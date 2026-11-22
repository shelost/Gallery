/**
 * Real elevation, baked from the AWS Terrain Tiles (Terrarium: SRTM, GMTED, ETOPO1 and GEBCO
 * bathymetry) by `node scripts/caliphate-relief.js`. Each region is an equirect Int16 grid in
 * metres, row 0 at the north. A close-up reads one fine patch that holds its whole window; a
 * wide sheet reads the coarse regions. One window never mixes resolutions, so it has no seams.
 */

/** @typedef {{ name: string, lon0: number, lon1: number, lat0: number, lat1: number, res: number }} Region */
/** @typedef {{ lon0: number, lon1: number, lat0: number, lat1: number }} Box */

/** @type {Region[]} Finest first. The res-8 regions are the base layer. */
export const REGIONS = [
	{ name: 'jerusalem', lon0: 31.5, lon1: 39.5, lat0: 28.75, lat1: 35.75, res: 32 },
	{ name: 'paektu', lon0: 123.5, lon1: 134, lat0: 38.25, lat1: 45.5, res: 32 },
	{ name: 'korea', lon0: 120, lon1: 135, lat0: 27, lat1: 49.5, res: 20 },
	{ name: 'aegean', lon0: 13.5, lon1: 34.5, lat0: 30.25, lat1: 46.25, res: 16 },
	{ name: 'italy', lon0: -1, lon1: 27.25, lat0: 28.5, lat1: 54, res: 12 },
	{ name: 'japan', lon0: 117.5, lon1: 157.5, lat0: 21, lat1: 55, res: 12 },
	{ name: 'west', lon0: -36, lon1: 80, lat0: -42, lat1: 78, res: 8 },
	{ name: 'east', lon0: 50, lon1: 180, lat0: -42, lat1: 78, res: 8 },
	{ name: 'america', lon0: -180, lon1: -40, lat0: 8, lat1: 76, res: 8 }
];

const BASE = 8;

/** @param {Region} region */
export const size = (region) => ({
	w: Math.round((region.lon1 - region.lon0) * region.res),
	h: Math.round((region.lat1 - region.lat0) * region.res)
});

/** @type {Map<string, Int16Array>} */
const grids = new Map();
/** @type {Map<string, Promise<void>>} */
const loading = new Map();
let version = 0;

/** Bumps every time another grid arrives, so cached shading knows to redraw. */
export const reliefVersion = () => version;

/** @param {number} lon */
const wrap = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180;

/** @param {Region} region @param {Box} box */
const holds = (region, box) =>
	box.lon0 >= region.lon0 && box.lon1 <= region.lon1 && box.lat0 >= region.lat0 && box.lat1 <= region.lat1;

/** @param {Region} region @param {Box} box */
function overlaps(region, box) {
	if (box.lat1 < region.lat0 || box.lat0 > region.lat1) return false;
	const a = wrap(box.lon0);
	const b = a + (box.lon1 - box.lon0);
	return [-360, 0, 360].some((shift) => b + shift >= region.lon0 && a + shift <= region.lon1);
}

/**
 * The grids a window reads: the finest patch that holds every box, or else the base regions
 * the boxes touch.
 * @param {Box[]} boxes
 * @returns {Region[]}
 */
export function regionsFor(boxes) {
	const patch = REGIONS.find((region) => boxes.every((box) => holds(region, box)));
	if (patch) return [patch];
	return REGIONS.filter((region) => region.res === BASE && boxes.some((box) => overlaps(region, box)));
}

/**
 * @param {Region[]} regions
 * @returns {Promise<number>}
 */
export function loadRelief(regions) {
	const jobs = regions.map((region) => {
		const pending = loading.get(region.name);
		if (pending) return pending;
		const { w, h } = size(region);
		const job = fetch(`/blog/caliphate/relief/${region.name}.bin`)
			.then((response) => (response.ok ? response.arrayBuffer() : null))
			.then((buffer) => {
				if (!buffer || buffer.byteLength !== w * h * 2) return;
				grids.set(region.name, new Int16Array(buffer));
				version++;
			})
			.catch(() => {});
		loading.set(region.name, job);
		return job;
	});
	return Promise.all(jobs).then(() => version);
}

/**
 * @param {Region[]} regions
 * @param {number} lon
 * @param {number} lat
 * @returns {number | null} metres, negative at sea, or null where none of the grids has arrived
 */
export function metresAt(regions, lon, lat) {
	const x0 = wrap(lon);
	for (const region of regions) {
		const grid = grids.get(region.name);
		if (!grid || lat < region.lat0 || lat > region.lat1 || x0 < region.lon0 || x0 > region.lon1) continue;
		const { w, h } = size(region);
		const x = Math.max(0, Math.min(w - 1.001, (x0 - region.lon0) * region.res - 0.5));
		const y = Math.max(0, Math.min(h - 1.001, (region.lat1 - lat) * region.res - 0.5));
		const i = Math.floor(x);
		const j = Math.floor(y);
		const fx = x - i;
		const fy = y - j;
		const row = j * w;
		const next = row + w;
		return (
			(grid[row + i] * (1 - fx) + grid[row + i + 1] * fx) * (1 - fy) +
			(grid[next + i] * (1 - fx) + grid[next + i + 1] * fx) * fy
		);
	}
	return null;
}

/**
 * Height of one mesh vertex, in sheet units. The sea is flat at zero and land rises from it,
 * so a coast is a shoreline, not a cliff.
 * @param {number | null} metres
 * @param {number} span
 */
export function groundHeight(metres, span) {
	return (Math.max(0, metres ?? 0) / 5000) * 0.075 * span;
}
