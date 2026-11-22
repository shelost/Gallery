/**
 * Two cached layers per window, both from real elevation: a sea tinted by depth, and a
 * hillshade blended over the land with soft-light, so mid-grey leaves the empire wash alone
 * and slopes lighten or darken it the way a printed relief map does.
 */
import { metresAt, reliefVersion } from './relief.js';

const SHALLOW = [192, 216, 234];
const DEEP = [128, 163, 199];
/** Open ocean past the grids, so the pinched Pacific matches the water around it. */
const OPEN = -4200;
/** Sun from the north-west, 45° up, the cartographer's default. */
const LIGHT = [-0.5, 0.5, Math.SQRT1_2];
/** Small-scale relief needs exaggeration to read at all; close-ups need almost none. */
const STEEPEST = 12;
const KEEP = 18;

/** @type {Map<string, { sea: HTMLCanvasElement, relief: HTMLCanvasElement } | null>} */
const cache = new Map();

/**
 * @param {{
 *   key: string,
 *   w: number,
 *   h: number,
 *   lons: Float64Array,
 *   lats: Float64Array,
 *   regions: import('./relief.js').Region[],
 *   fillLand: (ctx: CanvasRenderingContext2D) => void
 * }} opts
 */
export function terrain({ key, w, h, lons, lats, regions, fillLand }) {
	const id = `${key}|${w}x${h}|${reliefVersion()}`;
	if (cache.has(id)) return cache.get(id) ?? null;

	const ground = new Float32Array(w * h);
	let known = 0;
	for (let row = 0; row < h; row++) {
		for (let col = 0; col < w; col++) {
			const metres = metresAt(regions, lons[col], lats[row]);
			ground[row * w + col] = metres ?? Number.NaN;
			if (metres != null) known++;
		}
	}
	if (!known) {
		remember(id, null);
		return null;
	}

	const sea = canvas(w, h);
	const relief = canvas(w, h);
	const seaCtx = sea.getContext('2d');
	const reliefCtx = relief.getContext('2d');
	if (!seaCtx || !reliefCtx) return null;
	const seaPixels = seaCtx.createImageData(w, h);
	const reliefPixels = reliefCtx.createImageData(w, h);

	const height = (/** @type {number} */ col, /** @type {number} */ row) => {
		const value = ground[Math.max(0, Math.min(h - 1, row)) * w + Math.max(0, Math.min(w - 1, col))];
		return Number.isNaN(value) ? 0 : Math.max(0, value);
	};

	for (let row = 0; row < h; row++) {
		const up = Math.max(0, row - 1);
		const down = Math.min(h - 1, row + 1);
		const lat = lats[row];
		const dy = Math.max(1, Math.abs(lats[up] - lats[down]) * 110540);
		const cos = Math.cos((lat * Math.PI) / 180);
		for (let col = 0; col < w; col++) {
			const i = row * w + col;
			const p = i * 4;
			const metres = ground[i];

			const depth = Number.isNaN(metres) ? OPEN : Math.min(0, metres);
			const tone = mix(SHALLOW, DEEP, Math.min(1, Math.sqrt(-depth / 5500)));
			seaPixels.data[p] = tone[0];
			seaPixels.data[p + 1] = tone[1];
			seaPixels.data[p + 2] = tone[2];
			seaPixels.data[p + 3] = 255;

			const left = Math.max(0, col - 1);
			const right = Math.min(w - 1, col + 1);
			const dx = Math.max(1, Math.abs(lonDelta(lons[right] - lons[left])) * 111320 * cos);
			const exaggerate = Math.min(STEEPEST, Math.max(1.6, dx / 2 / 700));
			const gx = ((height(right, row) - height(left, row)) / dx) * exaggerate;
			const gy = ((height(col, up) - height(col, down)) / dy) * exaggerate;
			const length = Math.hypot(gx, gy, 1);
			const lit = (-gx * LIGHT[0] - gy * LIGHT[1] + LIGHT[2]) / length;
			const lift = Math.min(1, height(col, row) / 4200) * 22;
			const grey = Math.max(0, Math.min(255, 128 + (lit - LIGHT[2]) * 330 + lift));
			reliefPixels.data[p] = grey;
			reliefPixels.data[p + 1] = grey;
			reliefPixels.data[p + 2] = grey;
			reliefPixels.data[p + 3] = 255;
		}
	}
	seaCtx.putImageData(seaPixels, 0, 0);
	reliefCtx.putImageData(reliefPixels, 0, 0);
	const mask = canvas(w, h);
	const maskCtx = mask.getContext('2d');
	if (maskCtx) {
		maskCtx.fillStyle = '#fff';
		fillLand(maskCtx);
		reliefCtx.globalCompositeOperation = 'destination-in';
		reliefCtx.drawImage(mask, 0, 0);
	}

	const layers = { sea, relief };
	remember(id, layers);
	return layers;
}

/** @param {string} id @param {{ sea: HTMLCanvasElement, relief: HTMLCanvasElement } | null} value */
function remember(id, value) {
	cache.set(id, value);
	while (cache.size > KEEP) {
		const oldest = cache.keys().next().value;
		if (oldest === undefined) break;
		cache.delete(oldest);
	}
}

/** Longitude difference across the dateline. @param {number} d */
const lonDelta = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

/** @param {number} w @param {number} h */
function canvas(w, h) {
	const node = document.createElement('canvas');
	node.width = w;
	node.height = h;
	return node;
}

/** @param {number[]} a @param {number[]} b @param {number} t */
const mix = (a, b, t) => a.map((value, i) => Math.round(value + (b[i] - value) * t));
