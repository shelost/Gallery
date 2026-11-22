/**
 * Bakes the Kaliphate essay's elevation grids from the AWS Terrain Tiles (Terrarium encoding:
 * SRTM and GMTED on land, ETOPO1 and GEBCO at sea; public, no key).
 *
 *   node scripts/caliphate-relief.js
 *
 * reads the regions in `src/lib/caliphate/relief.js` and writes one Int16 grid per region to
 * `static/blog/caliphate/relief/<name>.bin`. Each output cell is a 3×3 box average of the tile
 * pixels inside it, so a coarse grid is a fair mean of the ground, not one lucky sample.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { REGIONS, size } from '../src/lib/caliphate/relief.js';

const SOURCE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const CACHE = fileURLToPath(new URL('../node_modules/.cache/terrarium/', import.meta.url));
const OUT = new URL('../static/blog/caliphate/relief/', import.meta.url);
const TILE = 256;

/** Tile zoom fine enough that each output cell spans at least two tile pixels. */
const zoomFor = (res) => Math.max(3, Math.ceil(Math.log2((360 * res * 2) / TILE)));

/** @type {Map<string, Promise<Uint8Array | null>>} */
const tiles = new Map();

/** @param {number} z @param {number} x @param {number} y */
function tile(z, x, y) {
	const n = 2 ** z;
	if (y < 0 || y >= n) return Promise.resolve(null);
	x = ((x % n) + n) % n;
	const key = `${z}/${x}/${y}`;
	let job = tiles.get(key);
	if (job) return job;
	job = (async () => {
		const file = join(CACHE, `${z}-${x}-${y}.png`);
		if (!existsSync(file)) {
			for (let attempt = 0; ; attempt++) {
				const response = await fetch(`${SOURCE}/${key}.png`).catch((error) => {
					if (attempt > 4) throw error;
					return null;
				});
				if (response?.ok) {
					writeFileSync(file, Buffer.from(await response.arrayBuffer()));
					break;
				}
				if (attempt > 4) throw new Error(`${key}: ${response?.status}`);
				await new Promise((done) => setTimeout(done, 800 * (attempt + 1)));
			}
		}
		const { data } = await sharp(readFileSync(file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
		return new Uint8Array(data);
	})();
	tiles.set(key, job);
	return job;
}

/** Global Web Mercator pixel coordinates at zoom z. */
function pixel(lon, lat, z) {
	const scale = TILE * 2 ** z;
	const phi = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
	return [((lon + 180) / 360) * scale, ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * scale];
}

/** Fetches every tile a region touches, a few at a time. */
async function prefetch(region, z) {
	const [x0, y0] = pixel(region.lon0, region.lat1, z);
	const [x1, y1] = pixel(region.lon1, region.lat0, z);
	const keys = [];
	for (let ty = Math.floor(y0 / TILE); ty <= Math.floor(y1 / TILE); ty++) {
		for (let tx = Math.floor(x0 / TILE); tx <= Math.floor(x1 / TILE); tx++) keys.push([tx, ty]);
	}
	for (let i = 0; i < keys.length; i += 8) {
		await Promise.all(keys.slice(i, i + 8).map(([tx, ty]) => tile(z, tx, ty)));
	}
	return keys.length;
}

/** @param {number} z @param {number} px @param {number} py */
async function elevation(z, px, py) {
	const tx = Math.floor(px / TILE);
	const ty = Math.floor(py / TILE);
	const data = await tile(z, tx, ty);
	if (!data) return 0;
	const i = ((Math.floor(py) - ty * TILE) * TILE + (Math.floor(px) - tx * TILE)) * 3;
	return data[i] * 256 + data[i + 1] + data[i + 2] / 256 - 32768;
}

mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });

for (const region of REGIONS) {
	const z = zoomFor(region.res);
	const count = await prefetch(region, z);
	const { w, h } = size(region);
	const grid = new Int16Array(w * h);
	for (let row = 0; row < h; row++) {
		for (let col = 0; col < w; col++) {
			let sum = 0;
			for (const dy of [1 / 6, 1 / 2, 5 / 6]) {
				for (const dx of [1 / 6, 1 / 2, 5 / 6]) {
					const lon = region.lon0 + (col + dx) / region.res;
					const lat = region.lat1 - (row + dy) / region.res;
					const [px, py] = pixel(lon, lat, z);
					sum += await elevation(z, px, py);
				}
			}
			grid[row * w + col] = Math.max(-11000, Math.min(9000, Math.round(sum / 9)));
		}
	}
	writeFileSync(new URL(`${region.name}.bin`, OUT), Buffer.from(grid.buffer));
	let min = Infinity;
	let max = -Infinity;
	for (const v of grid) {
		if (v < min) min = v;
		if (v > max) max = v;
	}
	console.log(`${region.name}: ${w}×${h} at 1/${region.res}°, zoom ${z}, ${count} tiles, ${min}…${max} m`);
}
