const RAD = Math.PI / 180;

/**
 * Where a map looks: an Albers equal-area conic through two standard parallels, fitted so the
 * projected outline of the lon/lat `bounds` fills a viewBox `width` units wide, north up.
 * @typedef {{ center: [number, number], parallels: [number, number], bounds: [[number, number], [number, number]], width: number }} Frame
 */

/** @typedef {{ x: number, y: number, w: number, h: number }} View */

/**
 * The projection for a frame. Plain math with no dependencies, so the geography script and the
 * page project identically.
 * @param {Frame} frame
 */
export function albers({ center, parallels, bounds, width }) {
	const [south1, north1] = parallels.map((d) => d * RAD);
	const n = (Math.sin(south1) + Math.sin(north1)) / 2;
	const c = Math.cos(south1) ** 2 + 2 * n * Math.sin(south1);
	/** @param {number} lat */
	const radius = (lat) => Math.sqrt(c - 2 * n * Math.sin(lat * RAD)) / n;
	const origin = radius(center[1]);

	/** @param {number} lon @param {number} lat @returns {[number, number]} */
	function raw(lon, lat) {
		const r = radius(lat);
		const theta = n * (lon - center[0]) * RAD;
		return [r * Math.sin(theta), r * Math.cos(theta) - origin];
	}

	const [[west, south], [east, north]] = bounds;
	const outline = sample(west, east, south, north, 64).map(([lon, lat]) => raw(lon, lat));
	const left = Math.min(...outline.map((p) => p[0]));
	const top = Math.min(...outline.map((p) => p[1]));
	const scale = width / (Math.max(...outline.map((p) => p[0])) - left);
	const height = (Math.max(...outline.map((p) => p[1])) - top) * scale;

	/** @param {number} lon @param {number} lat @returns {[number, number]} */
	function project(lon, lat) {
		const [x, y] = raw(lon, lat);
		return [(x - left) * scale, (y - top) * scale];
	}

	/** @type {View} */
	const view = { x: 0, y: 0, w: width, h: Math.round(height * 10) / 10 };

	/**
	 * Meridians and parallels every `step` degrees, as one path, reaching a little past the
	 * bounds so the curved edges still fill the view's corners.
	 * @param {number} step
	 */
	function graticule(step) {
		/** @param {number} d */
		const from = (d) => Math.floor(d / step) * step;
		/** @param {number} d */
		const to = (d) => Math.ceil(d / step) * step;
		const [w, e, s, nn] = [from(west - step), to(east + step), from(south - step), to(north + step)];
		/** @type {string[]} */
		const lines = [];
		for (let lon = w; lon <= e; lon += step) lines.push(polyline(range(s, nn, 24).map((lat) => project(lon, lat))));
		for (let lat = s; lat <= nn; lat += step) lines.push(polyline(range(w, e, 48).map((lon) => project(lon, lat))));
		return lines.join('');
	}

	return { project, view, graticule };
}

/** @param {number} from @param {number} to @param {number} steps */
function range(from, to, steps) {
	return Array.from({ length: steps + 1 }, (_, i) => from + ((to - from) * i) / steps);
}

/**
 * Points along all four edges of a lon/lat box.
 * @param {number} west @param {number} east @param {number} south @param {number} north @param {number} steps
 * @returns {[number, number][]}
 */
function sample(west, east, south, north, steps) {
	const lons = range(west, east, steps);
	const lats = range(south, north, steps);
	return [
		...lons.map((lon) => /** @type {[number, number]} */ ([lon, south])),
		...lons.map((lon) => /** @type {[number, number]} */ ([lon, north])),
		...lats.map((lat) => /** @type {[number, number]} */ ([west, lat])),
		...lats.map((lat) => /** @type {[number, number]} */ ([east, lat]))
	];
}

/** @param {[number, number][]} points */
function polyline(points) {
	return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
}
