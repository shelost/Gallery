/**
 * Turns the plan into solid blocks. Pure functions; positions are in plan coordinates (see plan.js)
 * with y measured up from the storey's finished floor.
 */

/** @typedef {import('./plan.js').House} House */
/** @typedef {import('./plan.js').Rect} Rect */
/** @typedef {import('./plan.js').Stair} Stair */
/** @typedef {import('./materials.js').Paint} Paint */
/** @typedef {[number, number, number]} Vec3 */
/** @typedef {{ size: Vec3, at: Vec3 }} Block */
/** @typedef {Block & { finish: Paint, cast?: boolean, occludes?: boolean }} Solid */
/** @typedef {Block & { key: string, room: import('./plan.js').Room }} Tile */
/** @typedef {{ axis: 'x' | 'z', at: number }} Line */
/** @typedef {Line & { line: number, from: number, to: number, thickness: number, exterior: boolean }} Wall */
/** @typedef {{ type: import('./plan.js').Opening['type'], from: number, to: number, sill: number, top: number }} Cut */

const EPS = 0.001;
/** How far an opening's point may sit off its wall line. */
const SNAP = 0.05;
/** Thickness of floor finishes; furniture stands on top of it. */
export const FINISH = 0.02;
const RISER = 0.18;
const RAIL = 1;

export const SQFT = 10.7639;

/** Sizes used when an opening doesn't give its own. */
export const OPENINGS = {
	window: { width: 1.2, height: 1.5, sill: 0.9 },
	door: { width: 0.9, height: 2.1, sill: 0 },
	opening: { width: 1.2, height: 2.4, sill: 0 }
};

/** @param {Rect} rect */
export const area = ([, , w, d]) => w * d;

/** @param {Rect} rect @returns {[number, number]} */
export const middle = ([x, z, w, d]) => [x + w / 2, z + d / 2];

/** Metres as feet and inches, e.g. 39′ 4″. @param {number} metres */
export function feet(metres) {
	const inches = Math.round(metres * 39.3701);
	return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
}

/** A box filling `rect` in plan, from height y0 to y1. @param {Rect} rect @param {number} y0 @param {number} y1 @returns {Block} */
export function slab([x, z, w, d], y0, y1) {
	return { size: [w, y1 - y0, d], at: [x + w / 2, (y0 + y1) / 2, z + d / 2] };
}

/** `rect` minus `hole`, as up to four rects. @param {Rect} rect @param {Rect} hole @returns {Rect[]} */
function subtract(rect, hole) {
	const [x, z, w, d] = rect;
	const [hx, hz, hw, hd] = hole;
	const [x2, z2, hx2, hz2] = [x + w, z + d, hx + hw, hz + hd];
	if (hx >= x2 - EPS || hx2 <= x + EPS || hz >= z2 - EPS || hz2 <= z + EPS) return [rect];
	const top = Math.max(z, hz);
	const bottom = Math.min(z2, hz2);
	/** @type {Rect[]} */
	const pieces = [
		[x, z, w, top - z],
		[x, bottom, w, z2 - bottom],
		[x, top, hx - x, bottom - top],
		[hx2, top, x2 - hx2, bottom - top]
	];
	return pieces.filter(([, , pw, pd]) => pw > EPS && pd > EPS);
}

/** @param {Rect[]} rects @param {Rect[]} holes */
export function carve(rects, holes) {
	return holes.reduce((pieces, hole) => pieces.flatMap((piece) => subtract(piece, hole)), rects);
}

/** Finished floor level of each storey, and the eaves where the roof starts. @param {House} house */
export function stack(house) {
	let y = 0;
	const floors = house.floors.map((floor) => {
		const at = y;
		y += floor.height + house.slab;
		return at;
	});
	return { floors, eaves: y - house.slab };
}

/** Unions overlapping or touching spans. @param {[number, number][]} spans */
function merge(spans) {
	/** @type {[number, number][]} */
	const merged = [];
	for (const [from, to] of [...spans].sort((a, b) => a[0] - b[0])) {
		const last = merged.at(-1);
		if (last && from <= last[1] + EPS) last[1] = Math.max(last[1], to);
		else if (to - from > EPS) merged.push([from, to]);
	}
	return merged;
}

/**
 * Exterior walls inside the footprint's edge, plus one interior wall per room edge line.
 * Side walls stop at the front and back walls, and interior walls at the exterior's inner face,
 * so no two walls overlap at a corner.
 * @param {House} house
 * @param {import('./plan.js').Floor} floor
 * @returns {Wall[]}
 */
function walls(house, floor) {
	const { width, depth } = house;
	const { exterior: outer, interior: inner } = house.walls;
	/** @type {Wall[]} */
	const list = [
		{ axis: 'x', line: 0, at: outer / 2, from: 0, to: width, thickness: outer, exterior: true },
		{ axis: 'x', line: depth, at: depth - outer / 2, from: 0, to: width, thickness: outer, exterior: true },
		{ axis: 'z', line: 0, at: outer / 2, from: outer, to: depth - outer, thickness: outer, exterior: true },
		{ axis: 'z', line: width, at: width - outer / 2, from: outer, to: depth - outer, thickness: outer, exterior: true }
	];

	/** @type {Map<string, { axis: 'x' | 'z', line: number, spans: [number, number][] }>} */
	const lines = new Map();
	/** @param {'x' | 'z'} axis @param {number} line @param {number} from @param {number} to */
	const edge = (axis, line, from, to) => {
		const [across, along] = axis === 'x' ? [depth, width] : [width, depth];
		if (line < EPS || line > across - EPS) return;
		const key = `${axis}${line.toFixed(3)}`;
		if (!lines.has(key)) lines.set(key, { axis, line, spans: [] });
		lines.get(key)?.spans.push([Math.max(from, outer), Math.min(to, along - outer)]);
	};
	for (const { rect: [x, z, w, d] } of floor.rooms) {
		edge('x', z, x, x + w);
		edge('x', z + d, x, x + w);
		edge('z', x, z, z + d);
		edge('z', x + w, z, z + d);
	}
	for (const { axis, line, spans } of lines.values()) {
		for (const [from, to] of merge(spans)) {
			list.push({ axis, line, at: line, from, to, thickness: inner, exterior: false });
		}
	}
	return list;
}

/**
 * The stretch [u0, u1] × [y0, y1] of a line, `depth` thick.
 * @param {Line} line
 * @param {number} u0
 * @param {number} u1
 * @param {number} y0
 * @param {number} y1
 * @param {number} depth
 * @returns {Block}
 */
function stretch(line, u0, u1, y0, y1, depth) {
	const [length, u, height, y] = [u1 - u0, (u0 + u1) / 2, y1 - y0, (y0 + y1) / 2];
	return line.axis === 'x'
		? { size: [length, height, depth], at: [u, y, line.at] }
		: { size: [depth, height, length], at: [line.at, y, u] };
}

/**
 * Splits a wall into solid blocks around its openings, with glass in the windows and a leaf in
 * exterior doors. Blocks that reach the top of the wall show the section cut.
 * @param {Wall} wall
 * @param {Cut[]} cuts
 * @param {number} height
 * @returns {Solid[]}
 */
function pierce(wall, cuts, height) {
	/** @type {Solid[]} */
	const solids = [];
	/** @param {number} u0 @param {number} u1 @param {number} y0 @param {number} y1 */
	const solid = (u0, u1, y0, y1) => {
		if (u1 - u0 <= EPS || y1 - y0 <= EPS) return;
		const finish = y1 >= height - EPS ? 'capped' : 'wall';
		solids.push({ ...stretch(wall, u0, u1, y0, y1, wall.thickness), finish, occludes: true });
	};
	let cursor = wall.from;
	for (const cut of [...cuts].sort((a, b) => a.from - b.from)) {
		solid(cursor, cut.from, 0, height);
		solid(cut.from, cut.to, 0, cut.sill);
		solid(cut.from, cut.to, cut.top, height);
		if (cut.type === 'window') {
			solids.push({ ...stretch(wall, cut.from, cut.to, cut.sill, cut.top, 0.03), finish: 'glass', cast: false });
		}
		if (cut.type === 'door' && wall.exterior) {
			solids.push({ ...stretch(wall, cut.from + 0.03, cut.to - 0.03, 0, cut.top - 0.02, 0.05), finish: 'walnut' });
		}
		cursor = Math.max(cursor, cut.to);
	}
	solid(cursor, wall.to, 0, height);
	return solids;
}

/** Solid treads for a straight stair climbing `rise` toward `up`. @param {Stair} stair @param {number} rise @returns {Solid[]} */
function steps({ rect: [x, z, w, d], up }, rise) {
	const count = Math.max(2, Math.round(rise / RISER));
	const going = (up === 'back' || up === 'front' ? d : w) / (count - 1);
	return Array.from({ length: count - 1 }, (_, i) => {
		const s = i * going;
		/** @type {Record<Stair['up'], Rect>} */
		const tread = {
			back: [x, z + d - s - going, w, going],
			front: [x, z + s, w, going],
			left: [x + w - s - going, z, going, d],
			right: [x + s, z, going, d]
		};
		return { ...slab(tread[up], 0, ((i + 1) * rise) / count), finish: /** @type {Paint} */ ('tread') };
	});
}

/**
 * A glass balustrade along each open edge of a stairwell: not the side you arrive on, and not
 * where a wall already stands.
 * @param {Stair[]} voids
 * @param {Wall[]} list
 * @returns {Solid[]}
 */
function rails(voids, list) {
	return voids.flatMap(({ rect: [x, z, w, d], up }) => {
		/** @type {{ side: Stair['up'], axis: 'x' | 'z', at: number, from: number, to: number }[]} */
		const edges = [
			{ side: 'back', axis: 'x', at: z, from: x, to: x + w },
			{ side: 'front', axis: 'x', at: z + d, from: x, to: x + w },
			{ side: 'left', axis: 'z', at: x, from: z, to: z + d },
			{ side: 'right', axis: 'z', at: x + w, from: z, to: z + d }
		];
		const walled = (/** @type {typeof edges[number]} */ edge) =>
			list.some(
				(wall) =>
					wall.axis === edge.axis &&
					Math.abs(wall.line - edge.at) < wall.thickness &&
					wall.from <= edge.from + EPS &&
					wall.to >= edge.to - EPS
			);
		return edges
			.filter((edge) => edge.side !== up && !walled(edge))
			.flatMap((edge) => [
				{ ...stretch(edge, edge.from, edge.to, 0, RAIL, 0.02), finish: /** @type {Paint} */ ('glass'), cast: false },
				{ ...stretch(edge, edge.from, edge.to, RAIL, RAIL + 0.04, 0.05), finish: /** @type {Paint} */ ('oak') }
			]);
	});
}

/**
 * Everything on one storey: walkable floor tiles (one or more per room) and every other solid.
 * @param {House} house
 * @param {number} index
 */
export function storey(house, index) {
	const floor = house.floors[index];
	const voids = house.floors[index - 1]?.stairs ?? [];
	const holes = voids.map((stair) => stair.rect);
	const list = walls(house, floor);

	/** @type {Map<Wall, Cut[]>} */
	const cuts = new Map();
	for (const opening of floor.openings) {
		const [x, z] = opening.at;
		const wall = list.find((candidate) => {
			const [across, along] = candidate.axis === 'x' ? [z, x] : [x, z];
			return Math.abs(across - candidate.line) < SNAP && along > candidate.from - EPS && along < candidate.to + EPS;
		});
		if (!wall) {
			console.warn(`[house] ${floor.name}: the ${opening.type} at [${opening.at}] isn't on a wall.`);
			continue;
		}
		const { width, height, sill } = { ...OPENINGS[opening.type], ...opening };
		const u = wall.axis === 'x' ? x : z;
		cuts.set(wall, [...(cuts.get(wall) ?? []), { type: opening.type, from: u - width / 2, to: u + width / 2, sill, top: sill + height }]);
	}

	/** @type {Rect} */
	const footprint = [0, 0, house.width, house.depth];
	const below = index === 0 ? house.plinth : house.slab;

	return {
		/** @type {Tile[]} */
		tiles: floor.rooms.flatMap((room) =>
			carve([room.rect], holes).map((rect, i) => ({ key: `${room.id}.${i}`, room, ...slab(rect, 0, FINISH) }))
		),
		/** @type {Solid[]} */
		solids: [
			...carve([footprint], holes).map((rect) => ({ ...slab(rect, -below, 0), finish: /** @type {Paint} */ ('slab') })),
			...list.flatMap((wall) => pierce(wall, cuts.get(wall) ?? [], floor.height)),
			...(floor.stairs ?? []).flatMap((stair) => steps(stair, floor.height + house.slab)),
			...rails(voids, list)
		]
	};
}

/**
 * A gable roof: the triangular attic over the footprint and two boards with overhangs. Each
 * board runs a little past the ridge so their top faces meet in a clean line.
 * @param {House} house
 */
export function gable(house) {
	const { width, depth } = house;
	const { pitch, overhang, verge, thickness } = house.roof;
	const slope = (pitch * Math.PI) / 180;
	const rise = (depth / 2) * Math.tan(slope);
	const run = depth / 2 + overhang;
	const past = thickness * Math.tan(slope);
	const length = run / Math.cos(slope) + past;
	const upper = [depth / 2 - past * Math.cos(slope), rise + past * Math.sin(slope)];
	const lower = [depth / 2 + run, rise - run * Math.tan(slope)];
	const z = (upper[0] + lower[0]) / 2 + (thickness / 2) * Math.sin(slope);
	const y = (upper[1] + lower[1]) / 2 + (thickness / 2) * Math.cos(slope);
	/** @type {Vec3} */
	const size = [width + 2 * verge, thickness, length];
	return {
		rise,
		/** The attic's cross-section as [z, y] points. */
		profile: /** @type {[number, number][]} */ ([
			[0, 0],
			[depth, 0],
			[depth / 2, rise]
		]),
		boards: [
			{ size, at: /** @type {Vec3} */ ([width / 2, y, z]), rotation: /** @type {Vec3} */ ([slope, 0, 0]) },
			{ size, at: /** @type {Vec3} */ ([width / 2, y, depth - z]), rotation: /** @type {Vec3} */ ([-slope, 0, 0]) }
		]
	};
}
