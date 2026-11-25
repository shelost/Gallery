/**
 * Campaign arrows. A march is a road an army actually took, drawn as one arrow that grows
 * with the map's change. `from` and `to` are fractions of that play; an arrow with
 * `hold: false` leaves once its part is over, so a strike can be answered.
 *
 * @typedef {'persia' | 'rome' | 'greece' | 'caliphate'} Ink
 * @typedef {{ color: Ink, path: [number, number][], from?: number, to?: number, hold?: boolean }} March
 */

import {
	BufferAttribute,
	BufferGeometry,
	Color,
	DoubleSide,
	Group,
	Mesh,
	MeshStandardMaterial,
	Vector3
} from 'three';
import { curveThrough } from '../atlas/paths.js';
import { project } from './sheets.js';

/** A light core and a dark edge, so the arrow reads on its own color and on bare land. */
const INK = {
	persia: ['#f2c56b', '#5c3810'],
	rome: ['#ef6a6a', '#5a1520'],
	greece: ['#a9cbee', '#1a365d'],
	caliphate: ['#8fd0a8', '#0f4d30']
};

/**
 * How far along one play this arrow is. 0 before it starts, 1 once drawn.
 * @param {number} t
 * @param {March} march
 */
function phase(t, march) {
	const from = march.from ?? 0;
	const to = march.to ?? 1;
	if (t < from) return 0;
	if (t > to) return march.hold === false ? 0 : 1;
	return (t - from) / Math.max(1e-4, to - from);
}

/**
 * One cubic, in x, terrain height, z.
 * @param {number[]} p0 @param {number[]} c1 @param {number[]} c2 @param {number[]} p1 @param {number} t
 */
function cubic3(p0, c1, c2, p1, t) {
	const u = 1 - t;
	const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
	return [0, 1, 2].map((k) => a * p0[k] + b * c1[k] + c * c2[k] + d * p1[k]);
}

/**
 * A smooth ground track through the stops. The height here is still the terrain.
 * @param {number[][]} stops
 * @param {number} steps
 */
function catmull3(stops, steps) {
	/** @type {number[][]} */
	const out = [];
	for (let i = 0; i < stops.length - 1; i++) {
		const p0 = stops[i - 1] ?? stops[i];
		const p1 = stops[i];
		const p2 = stops[i + 1];
		const p3 = stops[i + 2] ?? p2;
		const c1 = p1.map((v, k) => v + (p2[k] - p0[k]) / 6);
		const c2 = p2.map((v, k) => v - (p3[k] - p1[k]) / 6);
		for (let s = i === 0 ? 0 : 1; s <= steps; s++) out.push(cubic3(p1, c1, c2, p2, s / steps));
	}
	return out;
}

/**
 * The whole campaign as one bow above the map. The curve itself does not follow
 * the ridges: a sine lifts the middle, and the whole bow rises together until
 * even the low shoulders clear the highest ground underneath.
 * @param {[number, number][]} path
 * @param {(lon: number, lat: number) => Vector3 | null} place
 * @returns {Vector3[]}
 */
function flight(path, place) {
	/** @type {number[][]} */
	const stops = [];
	for (const [lon, lat] of path) {
		const point = place(lon, lat);
		if (point) stops.push([point.x, point.y, point.z]);
	}
	if (stops.length < 2) return [];
	const track = catmull3(stops, 14);
	const n = track.length;
	const y0 = track[0][1];
	const y1 = track[n - 1][1];
	const span = Math.hypot(track[n - 1][0] - track[0][0], track[n - 1][2] - track[0][2]) || 0.2;
	const chord = (/** @type {number} */ s) => y0 + (y1 - y0) * s;
	const bow = span * 0.2;
	const clearance = Math.max(span * 0.018, 0.004);
	let lift = 0;
	for (let i = 0; i < n; i++) {
		const s = i / (n - 1);
		const y = chord(s) + Math.sin(Math.PI * s) * bow;
		lift = Math.max(lift, track[i][1] + clearance - y);
	}
	return track.map((p, i) => {
		const s = i / (n - 1);
		return new Vector3(p[0], chord(s) + lift + Math.sin(Math.PI * s) * bow, p[2]);
	});
}

/**
 * The arc up to fraction `t`, measured along the bow.
 * @param {Vector3[]} arc
 * @param {number} t
 */
function along(arc, t) {
	if (arc.length < 2 || t >= 0.999) return arc;
	const dist = [0];
	for (let i = 1; i < arc.length; i++) dist.push(dist[i - 1] + arc[i].distanceTo(arc[i - 1]));
	const goal = dist[dist.length - 1] * t;
	/** @type {Vector3[]} */
	const out = [arc[0]];
	for (let i = 1; i < arc.length; i++) {
		if (dist[i] <= goal) {
			out.push(arc[i]);
			continue;
		}
		const span = dist[i] - dist[i - 1] || 1;
		out.push(arc[i - 1].clone().lerp(arc[i], (goal - dist[i - 1]) / span));
		break;
	}
	return out;
}

/**
 * Drop the last `gap` of the shaft so the arrowhead can sit on the end.
 * @param {Vector3[]} points
 * @param {number} gap
 */
function trimEnd(points, gap) {
	if (points.length < 2 || gap <= 0) return points;
	const dist = [0];
	for (let i = 1; i < points.length; i++) dist.push(dist[i - 1] + points[i].distanceTo(points[i - 1]));
	const keep = dist[dist.length - 1] - gap;
	if (keep <= dist[0]) return [points[0], points[1]];
	return along(points, keep / dist[dist.length - 1]);
}

/**
 * A ribbon of constant width along an arc. `crest` raises a spine; without it the
 * ribbon is the dark edge, widened so it shows around the core.
 * @param {Vector3[]} points
 * @param {number} half
 * @param {number} raise
 * @param {number} crest
 */
function ribbon(points, half, raise, crest) {
	const n = points.length;
	const across = crest > 0 ? 3 : 2;
	const positions = new Float32Array(n * across * 3);
	const normals = new Float32Array(n * across * 3);
	const put = (/** @type {number} */ o, x, y, z, nx, ny, nz) => {
		positions[o] = x;
		positions[o + 1] = y;
		positions[o + 2] = z;
		const mag = Math.hypot(nx, ny, nz) || 1;
		normals[o] = nx / mag;
		normals[o + 1] = ny / mag;
		normals[o + 2] = nz / mag;
	};
	for (let i = 0; i < n; i++) {
		const prev = points[Math.max(0, i - 1)];
		const next = points[Math.min(n - 1, i + 1)];
		let tx = next.x - prev.x;
		let tz = next.z - prev.z;
		const len = Math.hypot(tx, tz) || 1;
		tx /= len;
		tz /= len;
		const rx = tz;
		const rz = -tx;
		const w = half;
		const p = points[i];
		const y = p.y + raise;
		const o = i * across * 3;
		if (crest > 0) {
			const c = crest;
			put(o, p.x - rx * w, y, p.z - rz * w, -rx, 2.4, -rz);
			put(o + 3, p.x, y + c, p.z, 0, 1, 0);
			put(o + 6, p.x + rx * w, y, p.z + rz * w, rx, 2.4, rz);
		} else {
			const edge = w * 1.62;
			put(o, p.x - rx * edge, y, p.z - rz * edge, 0, 1, 0);
			put(o + 3, p.x + rx * edge, y, p.z + rz * edge, 0, 1, 0);
		}
	}
	const quads = n - 1;
	const index = new Uint16Array((crest > 0 ? quads * 4 : quads * 2) * 3);
	let q = 0;
	const push = (/** @type {number} */ a, b, c) => {
		index[q++] = a;
		index[q++] = b;
		index[q++] = c;
	};
	for (let i = 0; i < quads; i++) {
		const a = i * across;
		const b = a + across;
		if (crest > 0) {
			push(a, a + 1, b);
			push(a + 1, b + 1, b);
			push(a + 1, a + 2, b + 1);
			push(a + 2, b + 2, b + 1);
		} else {
			push(a, a + 1, b);
			push(a + 1, b + 1, b);
		}
	}
	const geo = new BufferGeometry();
	geo.setAttribute('position', new BufferAttribute(positions, 3));
	geo.setAttribute('normal', new BufferAttribute(normals, 3));
	geo.setIndex(new BufferAttribute(index, 1));
	return geo;
}

/**
 * A chevron at the tip, aimed along the arc, the way the atlas draws its arrowhead.
 * @param {Vector3[]} points
 * @param {number} size
 */
function chevron(points, size) {
	const end = points[points.length - 1];
	const prev = points[Math.max(0, points.length - 4)];
	const tangent = new Vector3().subVectors(end, prev);
	if (tangent.lengthSq() < 1e-10) return new BufferGeometry();
	tangent.normalize();
	const right = new Vector3().crossVectors(new Vector3(0, 1, 0), tangent);
	if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
	right.normalize();
	const up = new Vector3().crossVectors(tangent, right).normalize();
	const at = (/** @type {number} */ alongBy, across) =>
		new Vector3(
			end.x + tangent.x * alongBy + right.x * across + up.x * size * 0.12,
			end.y + tangent.y * alongBy + right.y * across + up.y * size * 0.12,
			end.z + tangent.z * alongBy + right.z * across + up.z * size * 0.12
		);
	const tip = at(size, 0);
	const left = at(-size * 0.62, size * 0.46);
	const notch = at(-size * 0.08, 0);
	const rightPoint = at(-size * 0.62, -size * 0.46);
	const positions = new Float32Array(12);
	for (const [i, v] of [tip, left, notch, rightPoint].entries()) {
		positions[i * 3] = v.x;
		positions[i * 3 + 1] = v.y;
		positions[i * 3 + 2] = v.z;
	}
	const geo = new BufferGeometry();
	geo.setAttribute('position', new BufferAttribute(positions, 3));
	geo.setIndex([0, 1, 2, 0, 2, 3]);
	geo.computeVertexNormals();
	return geo;
}

/**
 * @param {string} hex
 * @param {number} offset
 * @param {number} glow
 */
function material(hex, offset, glow) {
	const color = new Color(hex);
	return new MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: glow,
		roughness: 0.42,
		metalness: glow > 0.3 ? 0.22 : 0.06,
		side: DoubleSide,
		polygonOffset: true,
		polygonOffsetFactor: offset,
		polygonOffsetUnits: offset
	});
}

/**
 * Arrows for one relief. `place` returns a point on that sheet, or null off it.
 * `visible` is the width of what the camera actually shows, in sheet units.
 * @param {March[]} marches
 * @param {(lon: number, lat: number) => Vector3 | null} place
 * @param {number} visible
 */
export function createMarches(marches, place, visible) {
	const group = new Group();
	const half = Math.max(0.0055, visible * 0.0056);
	const headSize = Math.max(half * 8, visible * 0.042);
	const arrows = marches.map((march) => {
		const [core, edge] = INK[march.color] ?? INK.persia;
		const under = new Mesh(new BufferGeometry(), material(edge, -1, 0.16));
		const over = new Mesh(new BufferGeometry(), material(core, -4, 0.42));
		const head = new Mesh(new BufferGeometry(), over.material);
		under.renderOrder = 2;
		over.renderOrder = 3;
		head.renderOrder = 4;
		under.visible = false;
		over.visible = false;
		head.visible = false;
		group.add(under, over, head);
		return { arc: flight(march.path, place), march, under, over, head };
	});

	/** @param {Mesh} mesh @param {BufferGeometry} geo */
	const swap = (mesh, geo) => {
		mesh.geometry.dispose();
		mesh.geometry = geo;
		mesh.visible = true;
	};

	return {
		group,
		/** @param {number} t eased, 0 to 1 */
		update(t) {
			for (const arrow of arrows) {
				const drawn = phase(t, arrow.march);
				const pts = drawn < 0.03 ? [] : along(arrow.arc, drawn);
				if (pts.length < 2) {
					arrow.under.visible = false;
					arrow.over.visible = false;
					arrow.head.visible = false;
					continue;
				}
				const shaft = trimEnd(pts, headSize * 0.55);
				swap(arrow.under, ribbon(shaft, half, 0, 0));
				swap(arrow.over, ribbon(shaft, half, half * 0.22, half * 0.55));
				swap(arrow.head, chevron(pts, headSize));
			}
		},
		dispose() {
			for (const arrow of arrows) {
				arrow.under.geometry.dispose();
				arrow.over.geometry.dispose();
				arrow.head.geometry.dispose();
				const under = arrow.under.material;
				const over = arrow.over.material;
				if (!Array.isArray(under)) under.dispose();
				if (!Array.isArray(over)) over.dispose();
			}
		}
	};
}

/**
 * The same arrows on a flat board, for the moment before the relief is up.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./sheets.js').Worldish} world
 * @param {import('./sheets.js').Frame | null} frame
 * @param {number} w
 * @param {number} h
 * @param {March[]} marches
 * @param {number} t eased, 0 to 1
 */
export function paintMarches(ctx, world, frame, w, h, marches, t) {
	ctx.save();
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	const shaft = Math.max(2.4, Math.min(w, h) * 0.011);
	for (const march of marches) {
		const drawn = phase(t, march);
		if (drawn < 0.03) continue;
		/** @type {[number, number][]} */
		const raw = [];
		for (const [lon, lat] of march.path) {
			const point = project(world, lon, lat, w, h, frame);
			if (point) raw.push([point[0], point[1]]);
		}
		const curve = curveThrough(raw, { bend: 1 });
		const pts = curve?.samples ?? [];
		if (pts.length < 2) continue;
		const seg = [0];
		for (let i = 1; i < pts.length; i++) {
			seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
		}
		const total = seg[seg.length - 1];
		if (total < 2) continue;
		const tip = sliceTo(seg, pts, total * drawn);
		if (tip.length < 2) continue;
		const [core, edge] = INK[march.color] ?? INK.persia;
		const head = shaft * 3.6;
		const body = sliceTo(measureOf(tip), tip, Math.max(shaft, lengthOf(tip) - head * 0.45));
		stroke(ctx, body.length >= 2 ? body : tip, shaft * 1.7, edge);
		stroke(ctx, body.length >= 2 ? body : tip, shaft, core);
		arrowHead(ctx, tip, shaft, core, edge);
	}
	ctx.restore();
}

/**
 * @param {[number, number][]} pts
 */
function lengthOf(pts) {
	let total = 0;
	for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
	return total;
}

/**
 * @param {[number, number][]} pts
 */
function measureOf(pts) {
	const seg = [0];
	for (let i = 1; i < pts.length; i++) {
		seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	}
	return seg;
}

/**
 * @param {number[]} seg
 * @param {[number, number][]} pts
 * @param {number} dist
 */
function sliceTo(seg, pts, dist) {
	if (dist <= 0) return [pts[0]];
	/** @type {[number, number][]} */
	const out = [pts[0]];
	for (let i = 1; i < pts.length; i++) {
		if (seg[i] <= dist) {
			out.push(pts[i]);
			continue;
		}
		const span = seg[i] - seg[i - 1] || 1;
		const f = (dist - seg[i - 1]) / span;
		out.push([
			pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f,
			pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f
		]);
		break;
	}
	return out;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {[number, number][]} pts
 * @param {number} width
 * @param {string} color
 */
function stroke(ctx, pts, width, color) {
	ctx.beginPath();
	ctx.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.stroke();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {[number, number][]} pts
 * @param {number} shaft
 * @param {string} core
 * @param {string} edge
 */
function arrowHead(ctx, pts, shaft, core, edge) {
	const tip = pts[pts.length - 1];
	const prev = pts[pts.length - 2];
	const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
	const len = shaft * 3.6;
	const wid = shaft * 1.55;
	ctx.beginPath();
	ctx.moveTo(tip[0], tip[1]);
	ctx.lineTo(
		tip[0] - len * Math.cos(ang) + wid * Math.sin(ang),
		tip[1] - len * Math.sin(ang) - wid * Math.cos(ang)
	);
	ctx.lineTo(
		tip[0] - len * Math.cos(ang) - wid * Math.sin(ang),
		tip[1] - len * Math.sin(ang) + wid * Math.cos(ang)
	);
	ctx.closePath();
	ctx.fillStyle = core;
	ctx.fill();
	ctx.lineWidth = Math.max(1, shaft * 0.45);
	ctx.strokeStyle = edge;
	ctx.stroke();
}

// --- the roads. Each one is a campaign that the map beside it is about. ---

/** Rome out of Latium: Sicily and Africa, then Greece, then Egypt. */
/** @type {March[]} */
export const MARCH_ROME = [
	{
		color: 'rome',
		path: [
			[12.5, 41.9],
			[14.2, 38.6],
			[15.2, 37.4],
			[12.4, 36.2],
			[10.3, 36.85]
		]
	},
	{
		color: 'rome',
		from: 0.08,
		path: [
			[12.6, 42.1],
			[16.8, 40.4],
			[19.6, 39.4],
			[22.6, 38.6],
			[22.9, 37.9]
		]
	},
	{
		color: 'rome',
		from: 0.16,
		path: [
			[12.4, 41.5],
			[17.5, 36.5],
			[22.5, 33.2],
			[27.2, 31.6],
			[29.9, 31.2]
		]
	}
];

/** Across the continent, three streams, all of them west. */
/** @type {March[]} */
export const MARCH_AMERICA = [
	{
		color: 'rome',
		path: [
			[-75.2, 40.4],
			[-82, 39.8],
			[-90, 39.2],
			[-98, 39.4],
			[-106, 40.2],
			[-114, 40.6],
			[-122.3, 37.8]
		]
	},
	{
		color: 'rome',
		from: 0.08,
		path: [
			[-77.5, 34.8],
			[-85, 33.4],
			[-93, 32.4],
			[-100, 31.6],
			[-108, 32.2],
			[-115, 33.6],
			[-118.4, 34.1]
		]
	},
	{
		color: 'rome',
		from: 0.14,
		path: [
			[-74.2, 42.4],
			[-84, 43.2],
			[-93, 44.6],
			[-102, 45.8],
			[-112, 46.2],
			[-122.2, 47.4]
		]
	}
];

/** The royal road west, and the road down to Egypt. */
/** @type {March[]} */
export const MARCH_ACHAEMENID = [
	{
		color: 'persia',
		path: [
			[52.9, 29.9],
			[48.3, 32.2],
			[44.2, 33.4],
			[38.4, 36.6],
			[32.6, 38.2],
			[28.0, 38.5]
		]
	},
	{
		color: 'persia',
		from: 0.1,
		path: [
			[52.9, 29.9],
			[46.5, 31.4],
			[40.2, 33.2],
			[36.2, 33.4],
			[33.4, 31.6],
			[30.0, 30.6]
		]
	}
];

/** Out of Mukden: south through China proper, and west to the far frontier. */
/** @type {March[]} */
export const MARCH_QING = [
	{
		color: 'persia',
		path: [
			[123.4, 41.8],
			[119.6, 40.2],
			[116.4, 39.9],
			[114.6, 34.6],
			[113.6, 30.2],
			[113.3, 23.1]
		]
	},
	{
		color: 'persia',
		from: 0.12,
		path: [
			[116.4, 39.9],
			[108.9, 34.3],
			[103.8, 36.1],
			[96.5, 39.8],
			[87.6, 43.8]
		]
	}
];

/** From Istakhr back to the Mesopotamian capital, and out to the northeast. */
/** @type {March[]} */
export const MARCH_SASANIAN = [
	{
		color: 'persia',
		path: [
			[52.9, 29.9],
			[48.6, 32.0],
			[44.6, 33.2],
			[42.2, 35.4],
			[40.8, 36.8]
		]
	},
	{
		color: 'persia',
		from: 0.12,
		path: [
			[52.9, 29.9],
			[56.4, 32.6],
			[59.2, 35.4],
			[62.0, 37.6]
		]
	}
];

/** The last year of the civil war: south, and southwest. */
/** @type {March[]} */
export const MARCH_PRC = [
	{
		color: 'persia',
		path: [
			[114.2, 38.2],
			[114.0, 34.2],
			[113.6, 30.4],
			[113.2, 26.2],
			[113.3, 23.1]
		]
	},
	{
		color: 'persia',
		from: 0.1,
		path: [
			[112.5, 36.4],
			[108.4, 32.6],
			[104.2, 30.2],
			[101.6, 26.4],
			[100.2, 23.4]
		]
	}
];

/** Pella to Egypt along the coast, and on from Issus to the Persian heartland. */
/** @type {March[]} */
export const MARCH_ALEXANDER = [
	{
		color: 'greece',
		path: [
			[22.5, 40.8],
			[26.4, 40.2],
			[28.2, 38.4],
			[32.4, 36.6],
			[36.2, 36.7],
			[35.2, 33.3],
			[32.4, 31.2],
			[29.9, 31.2]
		]
	},
	{
		color: 'greece',
		from: 0.18,
		path: [
			[36.2, 36.7],
			[40.2, 36.2],
			[43.4, 36.5],
			[47.2, 33.2],
			[52.9, 29.9],
			[59.5, 32.6],
			[66.2, 31.4]
		]
	}
];

/** Into China by way of Korea, and south by sea. */
/** @type {March[]} */
export const MARCH_JAPAN = [
	{
		color: 'greece',
		path: [
			[139.7, 35.7],
			[134.8, 35.4],
			[130.4, 35.2],
			[127.2, 36.8],
			[124.2, 40.6],
			[119.2, 40.2],
			[116.4, 39.9],
			[114.3, 34.4],
			[114.3, 30.6]
		]
	},
	{
		color: 'greece',
		from: 0.12,
		path: [
			[139.7, 35.7],
			[134.2, 31.6],
			[128.4, 26.4],
			[121.6, 23.6],
			[114.2, 18.4],
			[109.2, 13.6],
			[104.4, 10.4],
			[103.8, 1.4]
		]
	}
];

/** Out of Nisa, west onto the plateau and down to Ctesiphon. */
/** @type {March[]} */
export const MARCH_PARTHIAN = [
	{
		color: 'persia',
		path: [
			[58.2, 37.9],
			[54.6, 36.2],
			[51.4, 34.4],
			[48.2, 33.6],
			[44.6, 33.3]
		]
	},
	{
		color: 'persia',
		from: 0.1,
		path: [
			[58.2, 37.9],
			[55.4, 34.2],
			[52.2, 31.2],
			[48.6, 30.6],
			[45.4, 32.2]
		]
	}
];

/** Across the Adriatic: the Macedonian wars, then Corinth. */
/** @type {March[]} */
export const MARCH_GREECE = [
	{
		color: 'rome',
		path: [
			[12.5, 41.9],
			[16.4, 40.8],
			[19.4, 40.2],
			[22.5, 40.8]
		]
	},
	{
		color: 'rome',
		from: 0.16,
		path: [
			[12.5, 41.6],
			[15.8, 39.2],
			[18.8, 38.2],
			[22.9, 37.9]
		]
	}
];

/**
 * Japan strikes out of Tokyo, then the reply comes in off the ocean.
 * The two do not stay on the map together.
 */
/** @type {March[]} */
export const MARCH_PACIFIC = [
	{
		color: 'greece',
		to: 0.44,
		hold: false,
		path: [
			[139.7, 35.7],
			[136.0, 34.0],
			[131.8, 32.4],
			[127.4, 31.4],
			[123.2, 31.2]
		]
	},
	{
		color: 'greece',
		from: 0.08,
		to: 0.46,
		hold: false,
		path: [
			[139.7, 35.7],
			[136.8, 33.2],
			[133.4, 29.6],
			[130.2, 26.4],
			[128.2, 24.0]
		]
	},
	{
		color: 'rome',
		from: 0.54,
		path: [
			[145.6, 33.8],
			[142.8, 34.4],
			[139.6, 34.9],
			[136.6, 35.3]
		]
	},
	{
		color: 'rome',
		from: 0.62,
		path: [
			[145.5, 38.4],
			[142.8, 37.6],
			[140.4, 36.6],
			[139.2, 35.8]
		]
	}
];

/** 614. Persia into Syria and Egypt, and up into Anatolia. */
/** @type {March[]} */
export const MARCH_PERSIA_WAR = [
	{
		color: 'persia',
		path: [
			[44.5, 33.2],
			[40.4, 34.2],
			[36.6, 33.6],
			[35.2, 31.8],
			[32.6, 31.0],
			[30.1, 31.1]
		]
	},
	{
		color: 'persia',
		from: 0.1,
		path: [
			[43.2, 36.8],
			[40.0, 37.5],
			[37.0, 38.3],
			[34.4, 39.1],
			[32.0, 39.9]
		]
	}
];

/** 614, the fiction. China out to the first island chain. */
/** @type {March[]} */
export const MARCH_CHINA_WAR = [
	{
		color: 'persia',
		path: [
			[119.2, 38.6],
			[123.2, 38.6],
			[126.8, 37.6],
			[129.4, 36.0]
		]
	},
	{
		color: 'persia',
		from: 0.08,
		path: [
			[121.2, 31.2],
			[126.4, 30.2],
			[132.2, 32.6],
			[137.2, 34.6],
			[139.7, 35.6]
		]
	},
	{
		color: 'persia',
		from: 0.14,
		path: [
			[117.2, 25.2],
			[120.6, 23.8],
			[121.8, 20.2],
			[121.6, 16.4],
			[123.4, 13.6]
		]
	}
];

/** 627. Heraclius, down from the north and straight at Ctesiphon. */
/** @type {March[]} */
export const MARCH_HERACLIUS = [
	{
		color: 'rome',
		path: [
			[33.6, 40.4],
			[36.8, 39.8],
			[40.2, 39.4],
			[42.8, 38.0],
			[43.3, 36.4],
			[44.6, 34.0]
		]
	},
	{
		color: 'rome',
		from: 0.1,
		path: [
			[31.6, 38.6],
			[35.6, 37.8],
			[38.8, 37.0],
			[41.8, 35.6],
			[44.2, 33.3]
		]
	}
];

/** 627, the fiction. In off the Pacific, onto the islands and no further. */
/** @type {March[]} */
export const MARCH_AMERICA_BACK = [
	{
		color: 'rome',
		path: [
			[158, 39.0],
			[146, 38.4],
			[136, 38.0],
			[129.2, 37.6],
			[126.6, 37.5]
		]
	},
	{
		color: 'rome',
		from: 0.08,
		path: [
			[162, 35.2],
			[148, 35.0],
			[140, 35.2],
			[136.2, 35.4],
			[132.4, 34.6]
		]
	},
	{
		color: 'rome',
		from: 0.14,
		path: [
			[155, 23.4],
			[140, 22.8],
			[128, 22.6],
			[121.6, 23.4]
		]
	}
];
