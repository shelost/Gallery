/**
 * Greedy label placement for map markers, in screen pixels. Each label tries spots around its
 * marker (right, left, the diagonals, above, below, then the same ring a little farther out)
 * and takes the first that stays inside the frame without touching another label or marker.
 * Higher priorities choose first, then the most crowded markers; a label with no free spot
 * comes back null and stays hidden.
 *
 * @typedef {{ id: string, x: number, y: number, r: number, w: number, h: number, priority?: number }} LabelItem marker centre and radius, label size
 * @typedef {{ left: number, top: number } | null} LabelSpot
 * @typedef {{ left: number, top: number, right: number, bottom: number }} Box
 * @typedef {Box & { weight?: number }} Obstacle how much covering it costs a name, 1 by default
 */

const GAP = 2;
const PAD = 1;
/** Extra distance per ring, as a fraction of the label height. */
const RINGS = [0, 0.5, 1, 1.6];
/** How near a marker counts as a neighbour when ranking crowding. */
const CROWD_RADIUS = 48;

/** @param {LabelItem} item @param {number} ring */
function candidates({ x, y, r, w, h }, ring) {
	const d = r + GAP + ring * h;
	const diag = r * 0.7 + GAP + ring * h;
	return [
		{ left: x + d, top: y - h / 2 },
		{ left: x - d - w, top: y - h / 2 },
		{ left: x + diag, top: y - diag - h },
		{ left: x + diag, top: y + diag },
		{ left: x - diag - w, top: y - diag - h },
		{ left: x - diag - w, top: y + diag },
		{ left: x - w / 2, top: y - d - h },
		{ left: x - w / 2, top: y + d },
		{ left: x + d, top: y - h },
		{ left: x + d, top: y },
		{ left: x - d - w, top: y - h },
		{ left: x - d - w, top: y }
	];
}

/** @param {Box} a @param {Box} b */
const hits = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** What covering a name placed earlier costs a later one. */
const NAME_WEIGHT = 4;

/**
 * Names centred on a place rather than set beside a marker, like a realm's name over its land.
 * Each takes the first of its candidate centres (best first) that stays in the frame and clears
 * the obstacles and the names before it; when none does, the one whose clashes weigh least.
 * @param {{ id: string, centres: [number, number][], w: number, h: number }[]} names
 * @param {Obstacle[]} obstacles @param {number} width @param {number} height
 * @returns {{ chosen: Record<string, number>, boxes: Box[] }} the index of each name's centre, and the boxes they cover
 */
export function placeNames(names, obstacles, width, height) {
	const taken = [...obstacles];
	/** @type {Box[]} */
	const boxes = [];
	/** @type {Record<string, number>} */
	const chosen = {};
	for (const { id, centres, w, h } of names) {
		/** @param {[number, number]} centre @returns {Box} */
		const around = ([x, y]) => ({ left: x - w / 2 - PAD, top: y - h / 2 - PAD, right: x + w / 2 + PAD, bottom: y + h / 2 + PAD });
		const costs = centres.map((centre) => {
			const box = around(centre);
			const inside = box.left >= 0 && box.top >= 0 && box.right <= width && box.bottom <= height;
			return taken.reduce((sum, t) => sum + (hits(box, t) ? (t.weight ?? 1) : 0), inside ? 0 : Infinity);
		});
		const index = costs.indexOf(Math.min(...costs));
		const box = around(centres[index]);
		taken.push({ ...box, weight: NAME_WEIGHT });
		boxes.push(box);
		chosen[id] = index;
	}
	return { chosen, boxes };
}

/**
 * @param {LabelItem[]} items @param {number} width @param {number} height
 * @param {Box[]} [fixed] boxes already taken, which labels keep clear of
 * @returns {Record<string, LabelSpot>}
 */
export function placeLabels(items, width, height, fixed = []) {
	/** @type {Map<string, Box>} */
	const markers = new Map(
		items.map(({ id, x, y, r }) => [id, { left: x - r - PAD, top: y - r - PAD, right: x + r + PAD, bottom: y + r + PAD }])
	);
	const crowd = new Map(
		items.map((a) => [a.id, items.filter((b) => b !== a && Math.hypot(a.x - b.x, a.y - b.y) < CROWD_RADIUS).length])
	);
	const order = items.toSorted(
		(a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (crowd.get(b.id) ?? 0) - (crowd.get(a.id) ?? 0)
	);

	/** @type {Box[]} */
	const placed = [...fixed];
	/** @type {Record<string, LabelSpot>} */
	const out = {};
	for (const item of order) {
		out[item.id] = null;
		search: for (const ring of RINGS) {
			for (const spot of candidates(item, ring)) {
				const box = { left: spot.left, top: spot.top, right: spot.left + item.w, bottom: spot.top + item.h };
				if (box.left < 0 || box.top < 0 || box.right > width || box.bottom > height) continue;
				if (placed.some((p) => hits(box, p))) continue;
				if ([...markers].some(([id, m]) => id !== item.id && hits(box, m))) continue;
				placed.push(box);
				out[item.id] = spot;
				break search;
			}
		}
	}
	return out;
}
