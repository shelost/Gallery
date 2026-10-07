/** @typedef {{ x: number, y: number }} Point */

/**
 * A CSS `matrix3d` that maps a `width` × `height` element, with its transform origin at its top
 * left, onto any four points on screen: top left, top right, bottom right, bottom left. This is
 * the perspective a flat sheet takes on when it's seen at an angle, so a DOM element can sit
 * exactly over a rectangle in a 3D scene.
 * @param {number} width
 * @param {number} height
 * @param {[Point, Point, Point, Point]} corners
 */
export function fitQuad(width, height, [p0, p1, p2, p3]) {
	const dx1 = p1.x - p2.x;
	const dx2 = p3.x - p2.x;
	const dx3 = p0.x - p1.x + p2.x - p3.x;
	const dy1 = p1.y - p2.y;
	const dy2 = p3.y - p2.y;
	const dy3 = p0.y - p1.y + p2.y - p3.y;
	const det = dx1 * dy2 - dx2 * dy1 || 1e-9;
	const g = (dx3 * dy2 - dx2 * dy3) / det;
	const h = (dx1 * dy3 - dx3 * dy1) / det;
	const a = p1.x - p0.x + g * p1.x;
	const b = p3.x - p0.x + h * p3.x;
	const d = p1.y - p0.y + g * p1.y;
	const e = p3.y - p0.y + h * p3.y;
	const m = [a / width, d / width, 0, g / width, b / height, e / height, 0, h / height, 0, 0, 1, 0, p0.x, p0.y, 0, 1];
	return `matrix3d(${m.map((value) => +value.toFixed(9)).join(',')})`;
}

/**
 * The corners of an upright rectangle.
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @returns {[Point, Point, Point, Point]}
 */
export function rectCorners(x, y, width, height) {
	return [
		{ x, y },
		{ x: x + width, y },
		{ x: x + width, y: y + height },
		{ x, y: y + height }
	];
}

/**
 * Corners partway between two quads, lifted off the page in the middle of the move.
 * @param {[Point, Point, Point, Point]} from
 * @param {[Point, Point, Point, Point]} to
 * @param {number} t 0 to 1
 * @param {number} lift pixels to rise at the halfway point
 * @returns {[Point, Point, Point, Point]}
 */
export function between(from, to, t, lift = 0) {
	const rise = Math.sin(Math.PI * t) * lift;
	return /** @type {[Point, Point, Point, Point]} */ (
		from.map((point, n) => ({ x: point.x + (to[n].x - point.x) * t, y: point.y + (to[n].y - point.y) * t - rise }))
	);
}
