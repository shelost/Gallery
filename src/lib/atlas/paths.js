/**
 * Curve geometry for map arrows, in whatever units the points come in (the map feeds it
 * screen pixels). A route is a smooth Catmull-Rom curve through its stops; a two-stop route
 * bows gently to one side so a march never reads as a ruler line. The curve is sampled into a
 * polyline so labels and arrowheads can be placed without asking the DOM for path lengths.
 *
 * @typedef {[number, number]} Point
 * @typedef {[Point, Point, Point, Point]} Segment
 */

const STEPS = 18;
/** A two-stop route bows out by this fraction of its length. */
const BOW = 0.16;

/** @param {Point} a @param {Point} b */
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** @param {number} v */
const n = (v) => Math.round(v * 10) / 10;

/**
 * Pulls an endpoint `by` units toward its neighbour, never past the midpoint.
 * @param {Point} p @param {Point} toward @param {number} by @returns {Point}
 */
function inset(p, toward, by) {
	const d = dist(p, toward);
	if (!d || !by) return p;
	const k = Math.min(by, d * 0.45) / d;
	return [p[0] + (toward[0] - p[0]) * k, p[1] + (toward[1] - p[1]) * k];
}

/** @param {Segment} segment @param {number} t @returns {Point} */
function cubic([p0, c1, c2, p1], t) {
	const u = 1 - t;
	const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
	return [a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]];
}

/**
 * Cubic segments of a Catmull-Rom spline through `points`; two points make one bowed arc.
 * @param {Point[]} points @param {number} bend @returns {Segment[]}
 */
function segments(points, bend) {
	if (points.length === 2) {
		const [a, b] = points;
		const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
		const off = BOW * bend;
		/** @type {Point} */
		const mid = [(a[0] + b[0]) / 2 - dy * off, (a[1] + b[1]) / 2 + dx * off];
		return [
			[
				a,
				[a[0] + (mid[0] - a[0]) * (2 / 3), a[1] + (mid[1] - a[1]) * (2 / 3)],
				[b[0] + (mid[0] - b[0]) * (2 / 3), b[1] + (mid[1] - b[1]) * (2 / 3)],
				b
			]
		];
	}
	return points.slice(0, -1).map((p1, i) => {
		const p0 = points[i - 1] ?? p1;
		const p2 = points[i + 1];
		const p3 = points[i + 2] ?? p2;
		return [
			p1,
			[p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
			[p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
			p2
		];
	});
}

/**
 * The smooth curve through `points`, trimmed `startGap` and `endGap` units off each end so it
 * starts beside a marker and leaves room for an arrowhead. `bend` (±1) picks which way a
 * two-stop route bows.
 * @param {Point[]} points
 * @param {{ startGap?: number, endGap?: number, bend?: number }} [options]
 * @returns {{ d: string, samples: Point[] } | null}
 */
export function curveThrough(points, { startGap = 0, endGap = 0, bend = 1 } = {}) {
	const stops = points.filter((p, i) => i === 0 || dist(p, points[i - 1]) > 0.5);
	if (stops.length < 2) return null;
	stops[0] = inset(stops[0], stops[1], startGap);
	stops[stops.length - 1] = inset(stops[stops.length - 1], stops[stops.length - 2], endGap);

	const segs = segments(stops, bend);
	const d =
		`M${n(segs[0][0][0])},${n(segs[0][0][1])}` +
		segs.map(([, c1, c2, p]) => `C${n(c1[0])},${n(c1[1])} ${n(c2[0])},${n(c2[1])} ${n(p[0])},${n(p[1])}`).join('');
	/** @type {Point[]} */
	const samples = [segs[0][0]];
	for (const segment of segs) {
		for (let s = 1; s <= STEPS; s++) samples.push(cubic(segment, s / STEPS));
	}
	return { d, samples };
}

/**
 * The point at fraction `t` of the way along the samples.
 * @param {Point[]} samples @param {number} t
 */
export function pointAlong(samples, t) {
	let total = 0;
	for (let i = 1; i < samples.length; i++) total += dist(samples[i], samples[i - 1]);
	let goal = Math.min(Math.max(t, 0), 1) * total;
	for (let i = 1; i < samples.length; i++) {
		const [a, b] = [samples[i - 1], samples[i]];
		const step = dist(a, b);
		if (goal <= step || i === samples.length - 1) {
			const k = step ? Math.min(goal / step, 1) : 0;
			return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k };
		}
		goal -= step;
	}
	return { x: samples[0][0], y: samples[0][1] };
}

/**
 * A filled arrowhead whose base sits on the curve's end, its tip `size` units beyond.
 * @param {Point[]} samples @param {number} size
 */
export function arrowHead(samples, size) {
	const end = samples[samples.length - 1];
	const prev = samples[Math.max(samples.length - 3, 0)];
	const a = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
	const [cos, sin] = [Math.cos(a), Math.sin(a)];
	/** @param {number} along @param {number} across */
	const at = (along, across) => `${n(end[0] + along * cos - across * sin)},${n(end[1] + along * sin + across * cos)}`;
	return `M${at(size, 0)}L${at(-size * 0.15, size * 0.62)}L${at(size * 0.12, 0)}L${at(-size * 0.15, -size * 0.62)}Z`;
}

/** Crossed swords as strokes (blade, guard, grip ×2), centred on 0,0 in a 2-unit box. */
export const CROSSED_SWORDS =
	'M-0.9,-0.9L0.5,0.5M0.25,0.75L0.75,0.25M0.55,0.55L0.9,0.9' +
	'M0.9,-0.9L-0.5,0.5M-0.25,0.75L-0.75,0.25M-0.55,0.55L-0.9,0.9';

/** A five-point star for capitals (12×12 box). */
export const STAR_GLYPH = 'M6 .6 7.6 4.1l3.8.4-2.9 2.6.8 3.8L6 9 2.7 10.9l.8-3.8L.6 4.5l3.8-.4Z';
