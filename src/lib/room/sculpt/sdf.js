/**
 * Sculpting in signed distance: a statue is a list of soft primitives melted into one another,
 * and `mesh` turns the result into triangles. Everything here is plain math on arrays so it runs
 * in a worker, away from the page.
 *
 * A primitive is a sphere, ellipsoid, rounded box, or a cone with a round end at each radius,
 * placed in the world with a 3×3 rotation. Each one melts into what came before it over `blend`
 * meters, or carves into it when `carve` is set. A cone can wear folds: grooves running down it
 * that deepen toward one end, the way cloth falls.
 */

/** @typedef {[number, number, number]} Vec */
/** @typedef {[number, number, number, number, number, number, number, number, number]} Mat */

/**
 * @typedef {{
 *   kind: number,
 *   a: Vec, b: Vec, r1: number, r2: number,
 *   radii: Vec, inverse: Mat, round: number,
 *   blend: number, carve: boolean,
 *   folds: number, foldDepth: [number, number], twist: number, u: Vec, v: Vec,
 *   center: Vec, reach: number
 * }} Primitive
 */

export const SPHERE = 0;
export const ELLIPSOID = 1;
export const BOX = 2;
export const CONE = 3;

/** @type {Mat} */
export const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/** @param {Mat} m @param {Vec} v @returns {Vec} */
export const apply = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];

/** @param {Mat} a @param {Mat} b @returns {Mat} */
export function multiply(a, b) {
	/** @type {number[]} */
	const out = [];
	for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]);
	return /** @type {Mat} */ (out);
}

/** @param {Mat} m @returns {Mat} */
export const transpose = (m) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];

/**
 * A rotation by angles about x, then y, then z, in radians.
 * @param {number} [x] @param {number} [y] @param {number} [z]
 * @returns {Mat}
 */
export function rotation(x = 0, y = 0, z = 0) {
	const [cx, sx, cy, sy, cz, sz] = [Math.cos(x), Math.sin(x), Math.cos(y), Math.sin(y), Math.cos(z), Math.sin(z)];
	/** @type {Mat} */
	const rx = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
	/** @type {Mat} */
	const ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
	/** @type {Mat} */
	const rz = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
	return multiply(rz, multiply(ry, rx));
}

/** @param {Vec} a @param {Vec} b @returns {Vec} */
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** @param {Vec} a @param {Vec} b @returns {Vec} */
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
/** @param {Vec} a @param {number} k @returns {Vec} */
export const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
/** @param {Vec} a @param {Vec} b */
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** @param {Vec} a @param {Vec} b @returns {Vec} */
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** @param {Vec} a */
export const length = (a) => Math.hypot(a[0], a[1], a[2]);
/** @param {Vec} a @returns {Vec} */
export const normalize = (a) => scale(a, 1 / (length(a) || 1));
/** @param {Vec} a @param {Vec} b @param {number} t @returns {Vec} */
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/**
 * @typedef {{ blend?: number, carve?: boolean }} Joining
 * @typedef {Joining & { folds?: number, foldDepth?: [number, number], twist?: number }} Draping
 */

/** @param {Partial<Primitive>} fields @param {Joining} joining @returns {Primitive} */
function primitive(fields, { blend = 0.02, carve = false }) {
	return {
		kind: SPHERE,
		a: [0, 0, 0],
		b: [0, 0, 0],
		r1: 0,
		r2: 0,
		radii: [1, 1, 1],
		inverse: IDENTITY,
		round: 0,
		blend,
		carve,
		folds: 0,
		foldDepth: [0, 0],
		twist: 0,
		u: [1, 0, 0],
		v: [0, 0, 1],
		center: [0, 0, 0],
		reach: 0,
		...fields
	};
}

/** @param {Vec} at @param {number} r @param {Joining} [joining] */
export const sphere = (at, r, joining = {}) => primitive({ kind: SPHERE, a: at, r1: r, center: at, reach: r }, joining);

/** @param {Vec} at @param {Vec} radii @param {Mat} [turn] @param {Joining} [joining] */
export const ellipsoid = (at, radii, turn = IDENTITY, joining = {}) =>
	primitive({ kind: ELLIPSOID, a: at, radii, inverse: transpose(turn), center: at, reach: Math.max(...radii) }, joining);

/** @param {Vec} at @param {Vec} half @param {number} round @param {Mat} [turn] @param {Joining} [joining] */
export const box = (at, half, round, turn = IDENTITY, joining = {}) =>
	primitive({ kind: BOX, a: at, radii: half, round, inverse: transpose(turn), center: at, reach: length(half) + round }, joining);

/**
 * A cone from `a` to `b`, round at both ends, `r1` thick at `a` and `r2` at `b`. With `folds`,
 * that many grooves run from a to b, `foldDepth` deep at each end, turning by `twist` radians.
 * @param {Vec} a @param {Vec} b @param {number} r1 @param {number} r2 @param {Draping} [draping]
 */
export function cone(a, b, r1, r2, draping = {}) {
	const axis = normalize(sub(b, a));
	const helper = Math.abs(axis[1]) < 0.9 ? /** @type {Vec} */ ([0, 1, 0]) : /** @type {Vec} */ ([1, 0, 0]);
	const u = normalize(cross(axis, helper));
	const v = cross(axis, u);
	const { folds = 0, foldDepth = [0, 0], twist = 0, ...joining } = draping;
	return primitive(
		{ kind: CONE, a, b, r1, r2, folds, foldDepth, twist, u, v, center: mix(a, b, 0.5), reach: length(sub(b, a)) / 2 + Math.max(r1, r2) + Math.max(...foldDepth) },
		joining
	);
}

/** Polynomial smooth minimum, so shapes melt into each other over `k`. @param {number} a @param {number} b @param {number} k */
function smin(a, b, k) {
	if (k <= 0) return Math.min(a, b);
	const h = Math.max(k - Math.abs(a - b), 0) / k;
	return Math.min(a, b) - h * h * k * 0.25;
}

/**
 * The signed distance to one primitive, negative inside.
 * @param {Primitive} p @param {number} x @param {number} y @param {number} z
 */
export function distance(p, x, y, z) {
	const px = x - p.a[0];
	const py = y - p.a[1];
	const pz = z - p.a[2];
	switch (p.kind) {
		case SPHERE:
			return Math.sqrt(px * px + py * py + pz * pz) - p.r1;
		case ELLIPSOID: {
			const m = p.inverse;
			const lx = (m[0] * px + m[1] * py + m[2] * pz) / p.radii[0];
			const ly = (m[3] * px + m[4] * py + m[5] * pz) / p.radii[1];
			const lz = (m[6] * px + m[7] * py + m[8] * pz) / p.radii[2];
			const k0 = Math.sqrt(lx * lx + ly * ly + lz * lz);
			const k1 = Math.sqrt((lx * lx) / (p.radii[0] * p.radii[0]) + (ly * ly) / (p.radii[1] * p.radii[1]) + (lz * lz) / (p.radii[2] * p.radii[2]));
			return k1 === 0 ? -Math.min(...p.radii) : (k0 * (k0 - 1)) / k1;
		}
		case BOX: {
			const m = p.inverse;
			const qx = Math.abs(m[0] * px + m[1] * py + m[2] * pz) - p.radii[0];
			const qy = Math.abs(m[3] * px + m[4] * py + m[5] * pz) - p.radii[1];
			const qz = Math.abs(m[6] * px + m[7] * py + m[8] * pz) - p.radii[2];
			const ox = Math.max(qx, 0);
			const oy = Math.max(qy, 0);
			const oz = Math.max(qz, 0);
			return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - p.round;
		}
		default: {
			const bx = p.b[0] - p.a[0];
			const by = p.b[1] - p.a[1];
			const bz = p.b[2] - p.a[2];
			const l2 = bx * bx + by * by + bz * bz;
			const rr = p.r1 - p.r2;
			const a2 = l2 - rr * rr;
			const il2 = 1 / l2;
			const along = px * bx + py * by + pz * bz;
			const beyond = along - l2;
			const xx = px * l2 - bx * along;
			const xy = py * l2 - by * along;
			const xz = pz * l2 - bz * along;
			const x2 = xx * xx + xy * xy + xz * xz;
			const y2 = along * along * l2;
			const z2 = beyond * beyond * l2;
			const k = Math.sign(rr) * rr * rr * x2;
			let d;
			if (Math.sign(beyond) * a2 * z2 > k) d = Math.sqrt(x2 + z2) * il2 - p.r2;
			else if (Math.sign(along) * a2 * y2 < k) d = Math.sqrt(x2 + y2) * il2 - p.r1;
			else d = (Math.sqrt(x2 * a2 * il2) + along * rr) * il2 - p.r1;
			if (p.folds > 0) {
				const t = Math.min(1, Math.max(0, along * il2));
				const angle = Math.atan2(px * p.v[0] + py * p.v[1] + pz * p.v[2], px * p.u[0] + py * p.u[1] + pz * p.u[2]);
				const depth = p.foldDepth[0] + (p.foldDepth[1] - p.foldDepth[0]) * t;
				d += depth * (0.5 + 0.5 * Math.sin(angle * p.folds + t * p.twist));
			}
			return d;
		}
	}
}

/**
 * The whole sculpture's distance at a point, folding the primitives in order.
 * @param {Primitive[]} parts @param {number} x @param {number} y @param {number} z
 */
export function field(parts, x, y, z) {
	let d = 1e9;
	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		const di = distance(p, x, y, z);
		d = p.carve ? -smin(-d, di, p.blend) : smin(d, di, p.blend);
	}
	return d;
}

/**
 * Meshes the sculpture's surface with naive surface nets: one vertex inside each cell the
 * surface passes through, at the average of where it crosses the cell's edges, and a quad across
 * every edge it crosses. Only cells near the surface are measured exactly; the rest take the
 * distance at their block's middle, which is enough to know which side they're on.
 * `cell` is the grid spacing in meters.
 * @param {Primitive[]} parts
 * @param {number} cell
 */
export function mesh(parts, cell) {
	let lo = /** @type {Vec} */ ([Infinity, Infinity, Infinity]);
	let hi = /** @type {Vec} */ ([-Infinity, -Infinity, -Infinity]);
	for (const p of parts) {
		if (p.carve) continue;
		const r = p.reach + p.blend;
		lo = [Math.min(lo[0], p.center[0] - r), Math.min(lo[1], p.center[1] - r), Math.min(lo[2], p.center[2] - r)];
		hi = [Math.max(hi[0], p.center[0] + r), Math.max(hi[1], p.center[1] + r), Math.max(hi[2], p.center[2] + r)];
	}
	const BLOCK = 4;
	const origin = sub(lo, [cell * 2, cell * 2, cell * 2]);
	const blocks = [0, 1, 2].map((axis) => Math.ceil((hi[axis] - lo[axis] + cell * 4) / (cell * BLOCK)));
	const [nx, ny, nz] = blocks.map((count) => count * BLOCK + 1);
	const values = new Float32Array(nx * ny * nz).fill(NaN);
	const at = (/** @type {number} */ i, /** @type {number} */ j, /** @type {number} */ k) => i + nx * (j + ny * k);
	const half = (cell * BLOCK * Math.sqrt(3)) / 2;
	const maxBlend = Math.max(...parts.map((p) => p.blend));

	/** @type {Primitive[]} */
	const near = [];
	for (let bk = 0; bk < blocks[2]; bk++) {
		for (let bj = 0; bj < blocks[1]; bj++) {
			for (let bi = 0; bi < blocks[0]; bi++) {
				const cx = origin[0] + (bi + 0.5) * BLOCK * cell;
				const cy = origin[1] + (bj + 0.5) * BLOCK * cell;
				const cz = origin[2] + (bk + 0.5) * BLOCK * cell;
				const centerDistance = field(parts, cx, cy, cz);
				const i0 = bi * BLOCK;
				const j0 = bj * BLOCK;
				const k0 = bk * BLOCK;
				if (Math.abs(centerDistance) > half * 1.5 + maxBlend) {
					for (let k = k0; k <= k0 + BLOCK; k++)
						for (let j = j0; j <= j0 + BLOCK; j++)
							for (let i = i0; i <= i0 + BLOCK; i++) {
								const index = at(i, j, k);
								if (Number.isNaN(values[index])) values[index] = centerDistance;
							}
					continue;
				}
				near.length = 0;
				let bound = Infinity;
				for (const p of parts) if (!p.carve) bound = Math.min(bound, distance(p, cx, cy, cz) + half);
				for (const p of parts) {
					const d = distance(p, cx, cy, cz);
					if (p.carve ? Math.abs(d) < half * 2 + p.blend : d - half < bound + p.blend + maxBlend) near.push(p);
				}
				for (let k = k0; k <= k0 + BLOCK; k++)
					for (let j = j0; j <= j0 + BLOCK; j++)
						for (let i = i0; i <= i0 + BLOCK; i++) {
							values[at(i, j, k)] = field(near, origin[0] + i * cell, origin[1] + j * cell, origin[2] + k * cell);
						}
			}
		}
	}
	return surfaceNets(values, [nx, ny, nz], origin, cell);
}

/**
 * How open each vertex is to the light, from 0 deep in a crease to 1 out in the open: the field
 * is sampled a few steps out along the normal, and wherever it's nearer than the step, something
 * else is close by.
 * @param {Primitive[]} parts
 * @param {Float32Array} positions
 * @param {Float32Array} normals
 * @param {number} reach how far out to look, in meters
 */
export function occlusion(parts, positions, normals, reach) {
	const open = new Float32Array(positions.length / 3);
	const steps = [0.2, 0.5, 1];
	for (let v = 0; v < open.length; v++) {
		const [x, y, z] = [positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]];
		const [nx, ny, nz] = [normals[v * 3], normals[v * 3 + 1], normals[v * 3 + 2]];
		let shut = 0;
		for (let s = 0; s < steps.length; s++) {
			const step = steps[s] * reach;
			const d = field(parts, x + nx * step, y + ny * step, z + nz * step);
			shut += Math.max(0, step - d) / step / (s + 1);
		}
		open[v] = Math.max(0, 1 - shut * 0.9);
	}
	return open;
}

/** The eight corners of a cell, as offsets. */
const CORNERS = [
	[0, 0, 0],
	[1, 0, 0],
	[0, 1, 0],
	[1, 1, 0],
	[0, 0, 1],
	[1, 0, 1],
	[0, 1, 1],
	[1, 1, 1]
];
/** The twelve edges of a cell, as pairs of corners. */
const EDGES = [
	[0, 1],
	[2, 3],
	[4, 5],
	[6, 7],
	[0, 2],
	[1, 3],
	[4, 6],
	[5, 7],
	[0, 4],
	[1, 5],
	[2, 6],
	[3, 7]
];

/**
 * @param {Float32Array} values
 * @param {number[]} dims
 * @param {Vec} origin
 * @param {number} cell
 */
function surfaceNets(values, [nx, ny, nz], origin, cell) {
	const cx = nx - 1;
	const cy = ny - 1;
	const vertexOf = new Int32Array(cx * cy * (nz - 1)).fill(-1);
	/** @type {number[]} */
	const positions = [];
	/** @type {number[]} */
	const normals = [];
	/** @type {number[]} */
	const indices = [];
	const corner = new Float64Array(8);

	for (let k = 0; k < nz - 1; k++) {
		for (let j = 0; j < ny - 1; j++) {
			for (let i = 0; i < nx - 1; i++) {
				let mask = 0;
				for (let c = 0; c < 8; c++) {
					const [di, dj, dk] = CORNERS[c];
					corner[c] = values[i + di + nx * (j + dj + ny * (k + dk))];
					if (corner[c] < 0) mask |= 1 << c;
				}
				if (mask === 0 || mask === 255) continue;
				let sx = 0;
				let sy = 0;
				let sz = 0;
				let count = 0;
				for (const [e0, e1] of EDGES) {
					const v0 = corner[e0];
					const v1 = corner[e1];
					if (v0 < 0 === v1 < 0) continue;
					const t = v0 / (v0 - v1);
					sx += CORNERS[e0][0] + (CORNERS[e1][0] - CORNERS[e0][0]) * t;
					sy += CORNERS[e0][1] + (CORNERS[e1][1] - CORNERS[e0][1]) * t;
					sz += CORNERS[e0][2] + (CORNERS[e1][2] - CORNERS[e0][2]) * t;
					count++;
				}
				const fx = sx / count;
				const fy = sy / count;
				const fz = sz / count;
				positions.push(origin[0] + (i + fx) * cell, origin[1] + (j + fy) * cell, origin[2] + (k + fz) * cell);
				const lerp = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
				const gx = lerp(lerp(corner[1] - corner[0], corner[3] - corner[2], fy), lerp(corner[5] - corner[4], corner[7] - corner[6], fy), fz);
				const gy = lerp(lerp(corner[2] - corner[0], corner[3] - corner[1], fx), lerp(corner[6] - corner[4], corner[7] - corner[5], fx), fz);
				const gz = lerp(lerp(corner[4] - corner[0], corner[5] - corner[1], fx), lerp(corner[6] - corner[2], corner[7] - corner[3], fx), fy);
				const g = Math.hypot(gx, gy, gz) || 1;
				normals.push(gx / g, gy / g, gz / g);
				vertexOf[i + cx * (j + cy * k)] = positions.length / 3 - 1;
			}
		}
	}

	const cellAt = (/** @type {number} */ i, /** @type {number} */ j, /** @type {number} */ k) => vertexOf[i + cx * (j + cy * k)];
	/** @param {number} a @param {number} b @param {number} c @param {number} d @param {boolean} flip */
	const quad = (a, b, c, d, flip) => {
		if (a < 0 || b < 0 || c < 0 || d < 0) return;
		if (flip) indices.push(a, d, c, a, c, b);
		else indices.push(a, b, c, a, c, d);
	};

	for (let k = 1; k < nz - 1; k++) {
		for (let j = 1; j < ny - 1; j++) {
			for (let i = 1; i < nx - 1; i++) {
				const here = values[i + nx * (j + ny * k)] < 0;
				if (here !== values[i + 1 + nx * (j + ny * k)] < 0) {
					quad(cellAt(i, j - 1, k - 1), cellAt(i, j, k - 1), cellAt(i, j, k), cellAt(i, j - 1, k), !here);
				}
				if (here !== values[i + nx * (j + 1 + ny * k)] < 0) {
					quad(cellAt(i - 1, j, k - 1), cellAt(i - 1, j, k), cellAt(i, j, k), cellAt(i, j, k - 1), !here);
				}
				if (here !== values[i + nx * (j + ny * (k + 1))] < 0) {
					quad(cellAt(i - 1, j - 1, k), cellAt(i, j - 1, k), cellAt(i, j, k), cellAt(i - 1, j, k), !here);
				}
			}
		}
	}

	return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices) };
}
