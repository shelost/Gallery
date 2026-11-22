/**
 * Real coasts, two projections. The antique sheet runs from Italy to Iran.
 * The modern sheet puts China on the left, a wide Pacific in the middle, and the
 * United States on the right. It stops south of the Arctic.
 */
import land from './land.json';
import { clipRect } from './clip.js';
import { earth } from './earth.js';
import { antiqueFrontiers, antiqueRegions, modernRegions } from './empire.js';
import { regionsFor } from './relief.js';
import { terrain } from './shade.js';

/** @typedef {{ lon0: number, lon1: number, lat0: number, lat1: number }} Frame */
/** @typedef {import('./empire.js').Region} Region */

export const COLORS = {
	romeEast: { ink: '#b4233a', name: 'Eastern Rome', twin: 'America' },
	romeWest: { ink: '#d25c69', name: 'Western Rome', twin: 'the Atlantic shore' },
	rome: { ink: '#b4233a', name: 'Rome', twin: 'America and its clients' },
	persia: { ink: '#d4890f', name: 'Persia', twin: 'China' },
	greece: { ink: '#3c6fb5', name: 'Greece', twin: 'Japan' },
	caliphate: { ink: '#1e7a46', name: 'The Caliphate', twin: 'The Kaliphate' },
	steppe: { ink: '#6e6256', name: 'The steppe', twin: 'Russia' },
	holy: { ink: '#e6c36a', name: 'Jerusalem', twin: 'Paektu' },
	people: { ink: '#8a5a44', name: 'The peoples there', twin: '' },
	land: { ink: '#e2d3bc', name: 'Other land', twin: '' }
};

const SEA = '#9cb7d1';
const PAPER = '#e2d3bc';
const INK = '#2a241c';

/**
 * Asia, then the Pacific, then America. `pinched` is the main sheet.
 * `wide` is the comparison: more of the United States, more ocean, and no Arctic.
 * @type {Record<string, { A0: number, A1: number, B0: number, B1: number, BW: number, C0: number, C1: number, USW: number }>}
 */
const PACIFIC = {
	pinched: { A0: 97, A1: 155, B0: 155, B1: 235, BW: 12, C0: 235, C1: 262, USW: 22 },
	wide: { A0: 100, A1: 148, B0: 148, B1: 237, BW: 42, C0: 237, C1: 294, USW: 62 },
	continent: { A0: 90, A1: 146, B0: 146, B1: 215, BW: 14, C0: 215, C1: 308, USW: 48 }
};

/** @param {{ span?: keyof typeof PACIFIC }} world */
function band(world) {
	const piece = PACIFIC[world.span ?? 'pinched'];
	const AW = piece.A1 - piece.A0;
	return { ...piece, AW, XSPAN: AW + piece.BW + piece.USW };
}

export const antique = {
	id: 'antique',
	title: 'Late antiquity',
	mode: 'equirect',
	frame: { lon0: 6, lon1: 64, lat0: 6, lat1: 56 },
	holy: { lon: 35.16, lat: 31.78, name: 'Jerusalem' },
	cities: [
		{ lon: 12.5, lat: 41.9, name: 'Rome' },
		{ lon: 28.98, lat: 41.01, name: 'Constantinople', glow: true },
		{ lon: 23.73, lat: 37.98, name: 'Athens' },
		{ lon: 29.92, lat: 31.2, name: 'Alexandria' },
		{ lon: 44.58, lat: 33.09, name: 'Ctesiphon' },
		{ lon: 39.83, lat: 21.42, name: 'Mecca', glow: true },
		{ lon: 39.61, lat: 24.47, name: 'Medina', glow: true }
	],
	labels: [
		{ lon: 12.4, lat: 43.2, text: 'Rome' },
		{ lon: 22.2, lat: 39.2, text: 'Greece' },
		{ lon: 54.2, lat: 32.6, text: 'Persia' },
		{ lon: 44.5, lat: 23.2, text: 'Caliphate', late: true }
	]
};

export const modern = {
	id: 'modern',
	title: 'The fiction',
	mode: 'pacific',
	span: 'continent',
	lat0: 8,
	lat1: 72,
	holy: { lon: 128.07, lat: 42.01, name: 'Paektu' },
	cities: [
		{ lon: -77.04, lat: 38.91, name: 'Washington' },
		{ lon: -122.42, lat: 37.77, name: 'San Francisco', glow: true },
		{ lon: -74.01, lat: 40.71, name: 'New York' },
		{ lon: 116.41, lat: 39.9, name: 'Beijing' },
		{ lon: 139.69, lat: 35.68, name: 'Tokyo' },
		{ lon: 125.75, lat: 39.03, name: 'Pyongyang', glow: true },
		{ lon: 126.98, lat: 37.57, name: 'Seoul', glow: true }
	],
	labels: [
		{ lon: -121.5, lat: 40.5, text: 'America' },
		{ lon: 110.5, lat: 32.5, text: 'China' },
		{ lon: 138.2, lat: 36.4, text: 'Japan' },
		{ lon: 127.4, lat: 36.2, text: 'Korea', early: true },
		{ lon: 134.5, lat: 48.5, text: 'Russia', early: true },
		{ lon: 126.8, lat: 45.2, text: 'Kaliphate', late: true }
	]
};

/**
 * China and America in one square. The Pacific is cut out, and a line marks the cut.
 * Each country keeps its own scale, so neither one is stretched to meet the other.
 */
export const facing = {
	id: 'facing',
	sheet: 'modern',
	mode: 'split',
	title: 'The fiction',
	gap: 0.045,
	left: { lon0: 97, lon1: 146, lat0: 18, lat1: 54 },
	right: { lon0: -126, lon1: -66, lat0: 24, lat1: 50 },
	holy: modern.holy,
	labels: modern.labels,
	cities: modern.cities
};

/** @param {{ sheet?: string, id: string }} world */
function sheetOf(world) {
	return world.sheet ?? world.id;
}

/**
 * Where each half of a split sheet sits in the square, in unit coordinates, y down.
 * @param {{ gap?: number, left: Frame, right: Frame }} world
 */
function splitPanels(world) {
	const gap = world.gap ?? 0.05;
	const panelW = (1 - gap) / 2;
	return [world.left, world.right].map((box, index) => {
		const mid = ((box.lat0 + box.lat1) / 2) * (Math.PI / 180);
		const xDeg = (box.lon1 - box.lon0) * Math.cos(mid);
		const yDeg = box.lat1 - box.lat0;
		const scale = Math.min(panelW / xDeg, 1 / yDeg);
		const drawW = xDeg * scale;
		const drawH = yDeg * scale;
		const x0 = index === 0 ? (panelW - drawW) / 2 : panelW + gap + (panelW - drawW) / 2;
		const y0 = (1 - drawH) / 2;
		return { box, x0, y0, drawW, drawH };
	});
}

export const PERIOD_INDEX = {
	alexander: 0,
	justinian: 1,
	dual600: 2,
	sasanian620: 3,
	rashidun655: 4,
	byzantine863: 5,
	umayyad740: 6,
	kaliphate: 7
};

/** Where each power's color spreads from when a period paints in. */
const FROM = {
	pella: [22.5, 40.8],
	constantinople: [28.98, 41.01],
	ctesiphon: [44.58, 33.09],
	medina: [39.61, 24.47],
	damascus: [36.29, 33.51],
	paektu: [128.07, 42.0]
};

/** The two eyes, lit together, and the single powers. One array each, so a glow can hold still. */
const EYES = ['romeEast', 'persia'];
const GREEN = ['caliphate'];
const GOLD = ['persia'];

/**
 * Each moment on both sheets. `spread` is the lon/lat a new color grows out from; `focus` is
 * the powers the moment is about, outlined and lit.
 * @type {{
 *   id: string,
 *   title: string,
 *   pair: string,
 *   antiquePhase: string,
 *   modernPhase: string,
 *   when: { antique: string, modern: string },
 *   line: string,
 *   spread?: { antique?: number[], modern?: number[] },
 *   focus: { antique: string[], modern: string[] }
 * }[]}
 */
export const PERIODS = [
	{
		id: 'alexander',
		title: 'Alexander',
		pair: 'Alexander / Imperial Japan',
		antiquePhase: 'alexander',
		modernPhase: 'japan',
		when: { antique: '334 BC', modern: '1931–1945' },
		line: 'Alexander takes Persia in ten years. Imperial Japan takes the China coast, and does not keep it.',
		spread: { antique: FROM.pella, modern: [139.7, 35.7] },
		focus: { antique: ['greece'], modern: ['greece'] }
	},
	{
		id: 'justinian',
		title: 'Justinian',
		pair: 'Justinian / the union',
		antiquePhase: 'justinian',
		modernPhase: 'union',
		when: { antique: '565', modern: 'the fiction' },
		line: 'Rome, in two halves, is put back together one last time. Korea, in the fiction, becomes one country.',
		spread: { antique: FROM.constantinople, modern: FROM.paektu },
		focus: { antique: ['romeEast', 'romeWest'], modern: GREEN }
	},
	{
		id: 'buffers',
		title: 'The standoff',
		pair: 'Rome & Persia / America & China',
		antiquePhase: 'dual600',
		modernPhase: 'buffers',
		when: { antique: 'c. 600', modern: 'today' },
		line: 'Two superpowers face off. Arab client kings sit between them, like the two Koreas.',
		focus: { antique: EYES, modern: EYES }
	},
	{
		id: 'war',
		title: 'The last war',
		pair: '602–628 / the contest',
		antiquePhase: 'sasanian620',
		modernPhase: 'war',
		when: { antique: '602–628', modern: 'ahead' },
		line: 'The last great war of antiquity wears out both eyes. The guess ahead is a long American–Chinese contest, and it does not have to be an invasion.',
		spread: { antique: FROM.ctesiphon },
		focus: { antique: EYES, modern: EYES }
	},
	{
		id: 'rashidun',
		title: 'Out of Arabia',
		pair: 'Out of Arabia / out of Korea',
		antiquePhase: 'rashidun655',
		modernPhase: 'spread',
		when: { antique: '655', modern: 'imagined' },
		line: 'In twenty years, Arabia takes Syria, Egypt, and nearly all of Persia. Korea comes out of the peninsula into all of Manchuria.',
		spread: { antique: FROM.medina, modern: FROM.paektu },
		focus: { antique: GREEN, modern: GREEN }
	},
	{
		id: 'resurgence',
		title: 'The long war',
		pair: 'Rome & the Caliphate / America after',
		antiquePhase: 'byzantine863',
		modernPhase: 'after',
		when: { antique: '863–1025', modern: 'imagined' },
		line: 'Rome strikes back into Anatolia. America holds Japan and the islands, and the Kaliphate holds Manchuria and the north.',
		spread: { antique: FROM.constantinople, modern: [-122.4, 37.8] },
		focus: { antique: ['romeEast', 'caliphate'], modern: ['romeEast', 'caliphate'] }
	},
	{
		id: 'umayyad',
		title: 'Umayyad',
		pair: 'The widest reach',
		antiquePhase: 'umayyad740',
		modernPhase: 'caliphate',
		when: { antique: '740', modern: 'the fiction' },
		line: 'The Caliphate at its widest, from Spain to India.',
		spread: { antique: FROM.damascus, modern: FROM.paektu },
		focus: { antique: GREEN, modern: GREEN }
	},
	{
		id: 'caliphate',
		title: 'The Kaliphate',
		pair: 'The third power',
		antiquePhase: 'arabWorld',
		modernPhase: 'tongue',
		when: { antique: 'after', modern: 'the fiction' },
		line: 'The tongue stays where the people were thin. Arabic across the old Berber lands. Hangul across Siberia and all of Manchuria. China keeps Chinese, as Iran kept Persian.',
		spread: { antique: FROM.medina, modern: FROM.paektu },
		focus: { antique: GREEN, modern: GREEN }
	}
];

/** @param {typeof antique | typeof modern} world @param {number} periodIndex */
function phaseFor(world, periodIndex) {
	const meta = PERIODS[periodIndex] ?? PERIODS[PERIOD_INDEX.dual600];
	return sheetOf(world) === 'antique' ? meta.antiquePhase : meta.modernPhase;
}

/** @param {import('./sheets.js').Worldish} world @param {number} lon */
function pacificU(world, lon) {
	const { A0, A1, B0, B1, BW, C0, C1, USW, AW, XSPAN } = band(world);
	const shifted = lon < 0 ? lon + 360 : lon;
	if (shifted < A0 || shifted > C1) return null;
	let x;
	if (shifted <= A1) x = shifted - A0;
	else if (shifted <= B1) x = AW + ((shifted - B0) / (B1 - B0)) * BW;
	else x = AW + BW + ((shifted - C0) / (C1 - C0)) * USW;
	return x / XSPAN;
}

/** @param {import('./sheets.js').Worldish} world */
function span(world) {
	if (world.mode === 'pacific') {
		const mid = ((world.lat0 + world.lat1) / 2) * (Math.PI / 180);
		return { x: band(world).XSPAN * Math.cos(mid), y: world.lat1 - world.lat0 };
	}
	const { frame } = world;
	const mid = ((frame.lat0 + frame.lat1) / 2) * (Math.PI / 180);
	return { x: (frame.lon1 - frame.lon0) * Math.cos(mid), y: frame.lat1 - frame.lat0 };
}

/** @type {WeakMap<Frame, Frame>} */
const squares = new WeakMap();

/**
 * The frame grown along its shorter side, about its centre, until it is square on the ground.
 * Every map on the page is square, so the subject never changes size with its shape.
 * @param {Frame} frame
 * @returns {Frame}
 */
export function squareFrame(frame) {
	const hit = squares.get(frame);
	if (hit) return hit;
	const mid = (frame.lat0 + frame.lat1) / 2;
	const cos = Math.cos(mid * (Math.PI / 180));
	const x = (frame.lon1 - frame.lon0) * cos;
	const y = frame.lat1 - frame.lat0;
	const lon = (frame.lon0 + frame.lon1) / 2;
	const square =
		x > y
			? { lon0: frame.lon0, lon1: frame.lon1, lat0: mid - x / 2, lat1: mid + x / 2 }
			: { lon0: lon - y / cos / 2, lon1: lon + y / cos / 2, lat0: frame.lat0, lat1: frame.lat1 };
	squares.set(frame, square);
	return square;
}

/**
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 * @param {number} period
 */
export function captionLabels(world, frame, period) {
	const late = period >= PERIOD_INDEX.umayyad740;
	return world.labels.filter((item) => {
		if (item.late && !late) return false;
		if (item.early && late) return false;
		return true;
	});
}

/** @param {typeof antique | typeof modern} world @param {Frame | null} frame */
export function insetAspect(world, frame) {
	if (!frame && world.mode === 'split') return 1;
	if (frame) {
		const mid = ((frame.lat0 + frame.lat1) / 2) * (Math.PI / 180);
		const x = (frame.lon1 - frame.lon0) * Math.cos(mid);
		const y = frame.lat1 - frame.lat0;
		return x / y;
	}
	const { width, height } = reliefGeometry(world);
	return width / height;
}

/**
 * The ground a window shows, as lon/lat boxes. The Pacific sheet is two: Asia, and the
 * American coast past the dateline.
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 * @returns {Frame[]}
 */
export function reliefBoxes(world, frame) {
	if (frame) return [frame];
	if (world.mode === 'split') return [world.left, world.right];
	if (world.mode === 'equirect') return [world.frame];
	const { A0, C1 } = band(world);
	return [
		{ lon0: A0, lon1: 180, lat0: world.lat0, lat1: world.lat1 },
		{ lon0: -180, lon1: C1 - 360, lat0: world.lat0, lat1: world.lat1 }
	];
}

/**
 * The grids that serve one window.
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 */
export const reliefFor = (world, frame) => regionsFor(reliefBoxes(world, frame));

/** @param {import('./sheets.js').Worldish} world */
export function reliefGeometry(world) {
	if (world.mode === 'split' || world.mode === 'pacific') return { width: 2.5, height: 2.5, segs: 160 };
	const { x, y } = span(world);
	const width = 2.5;
	return { width, height: width * (y / x), segs: 200 };
}

/**
 * @param {import('./sheets.js').Worldish} world
 * @param {number} u
 * @param {number} v
 * @returns {[number, number]}
 */
export function sample(world, u, v) {
	if (world.mode === 'split') {
		const down = 1 - v;
		for (const panel of splitPanels(world)) {
			const { box, x0, y0, drawW, drawH } = panel;
			if (u < x0 || u > x0 + drawW || down < y0 || down > y0 + drawH) continue;
			return [
				box.lon0 + ((u - x0) / drawW) * (box.lon1 - box.lon0),
				box.lat1 - ((down - y0) / drawH) * (box.lat1 - box.lat0)
			];
		}
		return [180, 0];
	}
	if (world.mode === 'pacific') {
		const { A0, B0, B1, BW, C0, C1, USW, AW, XSPAN } = band(world);
		const x = u * XSPAN;
		let shifted;
		if (x <= AW) shifted = A0 + x;
		else if (x <= AW + BW) shifted = B0 + ((x - AW) / BW) * (B1 - B0);
		else shifted = C0 + ((x - AW - BW) / USW) * (C1 - C0);
		const lon = shifted > 180 ? shifted - 360 : shifted;
		const lat = world.lat0 + v * (world.lat1 - world.lat0);
		return [lon, lat];
	}
	const { frame } = world;
	return [
		frame.lon0 + u * (frame.lon1 - frame.lon0),
		frame.lat0 + v * (frame.lat1 - frame.lat0)
	];
}
/**
 * The lon/lat box a ring is cut to before projection, so no vertex ever falls off the sheet
 * and leaves a broken outline. On the wide sheet an Asian ring stops at the edge of Japan:
 * Kamchatka would smear across the Pacific. A ring west of the dateline keeps the coast
 * out to the sheet's eastern edge, and the latitude band leaves Alaska off.
 * @param {import('./sheets.js').Worldish} world
 * @param {number[][]} ring
 * @param {Frame | null} frame
 * @returns {number[]}
 */
function viewClip(world, ring, frame) {
	if (frame) return [frame.lon0, frame.lat0, frame.lon1, frame.lat1];
	if (world.mode === 'split') {
		let lon = 0;
		for (const pt of ring) lon += pt[0];
		lon /= Math.max(1, ring.length);
		const right = world.right;
		const box = lon >= right.lon0 - 8 && lon <= right.lon1 + 8 ? right : world.left;
		return [box.lon0, box.lat0, box.lon1, box.lat1];
	}
	if (world.mode === 'equirect') {
		const box = world.frame;
		return [box.lon0 - 0.5, box.lat0 - 0.5, box.lon1 + 0.5, box.lat1 + 0.5];
	}
	let max = -180;
	for (const pt of ring) if (pt[0] > max) max = pt[0];
	const lat0 = world.lat0 - 1;
	const lat1 = world.lat1 + 1;
	const { A0, A1, C1 } = band(world);
	return max >= A0 ? [A0, lat0, A1, lat1] : [-180, lat0, C1 - 360, lat1];
}

/** @type {WeakMap<number[][], number[]>} */
const ringBounds = new WeakMap();

/** @param {number[][]} ring */
function boundsOf(ring) {
	let box = ringBounds.get(ring);
	if (!box) {
		box = [Infinity, Infinity, -Infinity, -Infinity];
		for (const [lon, lat] of ring) {
			if (lon < box[0]) box[0] = lon;
			if (lat < box[1]) box[1] = lat;
			if (lon > box[2]) box[2] = lon;
			if (lat > box[3]) box[3] = lat;
		}
		ringBounds.set(ring, box);
	}
	return box;
}

/** @type {number[][]} */
const NO_RING = [];

/**
 * @param {import('./sheets.js').Worldish} world
 * @param {number[][]} ring
 * @param {Frame | null} frame
 * @param {number[] | null} clip
 */
function shapeRing(world, ring, frame, clip) {
	const view = viewClip(world, ring, frame);
	const box = boundsOf(ring);
	const wraps = box[2] - box[0] > 180;
	if (!wraps && (box[2] < view[0] || box[0] > view[2] || box[3] < view[1] || box[1] > view[3])) return NO_RING;
	let pts = unwrap(ring, view[2] > 0);
	if (clip) pts = clipRect(pts, clip[0], clip[1], clip[2], clip[3]);
	return clipRect(pts, view[0], view[1], view[2], view[3]);
}

/**
 * A ring that crosses the dateline (Eurasia runs on into Chukotka) jumps 360° between two
 * vertices. Cut as-is, that jump becomes a false edge across the whole globe. Put every vertex
 * on the side being viewed first.
 * @param {number[][]} ring
 * @param {boolean} east
 */
function unwrap(ring, east) {
	let offset = 0;
	let jumped = false;
	let min = Infinity;
	let max = -Infinity;
	const out = ring.map(([lon, lat], i) => {
		if (i > 0) {
			const step = lon - ring[i - 1][0];
			if (step > 180) offset -= 360;
			else if (step < -180) offset += 360;
			if (Math.abs(step) > 180) jumped = true;
		}
		const x = lon + offset;
		if (x < min) min = x;
		if (x > max) max = x;
		return [x, lat];
	});
	if (!jumped) return ring;
	const shift = east && min < -180 ? 360 : !east && max > 180 ? -360 : 0;
	return shift ? out.map(([lon, lat]) => [lon + shift, lat]) : out;
}

/**
 * @param {import('./sheets.js').Worldish} world
 * @param {number} lon
 * @param {number} lat
 * @param {number} w
 * @param {number} h
 * @param {Frame | null} frame
 * @returns {[number, number] | null}
 */
function project(world, lon, lat, w, h, frame) {
	if (!frame && world.mode === 'split') {
		for (const panel of splitPanels(world)) {
			const { box, x0, y0, drawW, drawH } = panel;
			if (lon < box.lon0 - 1.2 || lon > box.lon1 + 1.2 || lat < box.lat0 - 1.2 || lat > box.lat1 + 1.2) continue;
			return [
				(x0 + ((lon - box.lon0) / (box.lon1 - box.lon0)) * drawW) * w,
				(y0 + ((box.lat1 - lat) / (box.lat1 - box.lat0)) * drawH) * h
			];
		}
		return null;
	}
	if (frame || world.mode === 'equirect') {
		const box = frame ?? world.frame;
		if (lon < box.lon0 - 1 || lon > box.lon1 + 1 || lat < box.lat0 - 1 || lat > box.lat1 + 1) return null;
		return [
			((lon - box.lon0) / (box.lon1 - box.lon0)) * w,
			((box.lat1 - lat) / (box.lat1 - box.lat0)) * h
		];
	}
	const u = pacificU(world, lon);
	if (u == null || lat < world.lat0 - 2 || lat > world.lat1 + 2) return null;
	return [u * w, ((world.lat1 - lat) / (world.lat1 - world.lat0)) * h];
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./sheets.js').Worldish} world
 * @param {number[][]} ring
 * @param {number} w
 * @param {number} h
 * @param {Frame | null} frame
 */
function path(ctx, world, ring, w, h, frame) {
	ctx.beginPath();
	return trace(ctx, world, ring, w, h, frame);
}

/**
 * Adds one shaped ring to the current path as its own closed subpath.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./sheets.js').Worldish} world
 * @param {number[][]} ring
 * @param {number} w
 * @param {number} h
 * @param {Frame | null} frame
 */
function trace(ctx, world, ring, w, h, frame) {
	let started = false;
	for (const [lon, lat] of ring) {
		const pt = project(world, lon, lat, w, h, frame);
		if (!pt) continue;
		if (!started) {
			ctx.moveTo(pt[0], pt[1]);
			started = true;
		} else ctx.lineTo(pt[0], pt[1]);
	}
	if (started) ctx.closePath();
	return started;
}

/** @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y @param {string} text @param {number} scale */
function letter(ctx, x, y, text, scale) {
	ctx.save();
	ctx.font = `600 ${Math.round(22 * scale)}px Iowan Old Style, Palatino, Georgia, serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.lineWidth = 5 * scale;
	ctx.strokeStyle = 'rgba(239,228,212,0.92)';
	ctx.strokeText(text, x, y);
	ctx.fillStyle = INK;
	ctx.fillText(text, x, y);
	ctx.restore();
}

/**
 * Capitals as dots. The paired cities glow: Constantinople with San Francisco,
 * Mecca with Pyongyang, Medina with Seoul.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ cities?: { lon: number, lat: number, name: string, glow?: boolean }[] }} world
 * @param {Frame | null} frame
 * @param {number} w
 * @param {number} h
 * @param {number} pulse
 * @param {number} scale
 */
function drawCities(ctx, world, frame, w, h, pulse, scale) {
	for (const city of world.cities ?? []) {
		const pt = project(world, city.lon, city.lat, w, h, frame);
		if (!pt || pt[0] < 0 || pt[1] < 0 || pt[0] > w || pt[1] > h) continue;
		const [x, y] = pt;
		ctx.save();
		if (city.glow) {
			ctx.beginPath();
			ctx.arc(x, y, (8 + pulse * 4) * scale, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(230,195,106,${0.32 + pulse * 0.28})`;
			ctx.fill();
			ctx.beginPath();
			ctx.arc(x, y, 3.1 * scale, 0, Math.PI * 2);
			ctx.fillStyle = '#e6c36a';
			ctx.fill();
			ctx.lineWidth = 1 * scale;
			ctx.strokeStyle = '#6d5014';
			ctx.stroke();
		} else {
			ctx.beginPath();
			ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2);
			ctx.fillStyle = INK;
			ctx.fill();
		}
		ctx.font = `600 ${Math.round((city.glow ? 12 : 10) * scale)}px Iowan Old Style, Palatino, Georgia, serif`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.lineWidth = 3 * scale;
		ctx.strokeStyle = 'rgba(239,228,212,0.9)';
		ctx.strokeText(city.name, x + 6 * scale, y - (city.glow ? 1 : 0));
		ctx.fillStyle = city.glow ? '#6d5014' : INK;
		ctx.fillText(city.name, x + 6 * scale, y - (city.glow ? 1 : 0));
		ctx.restore();
	}
}

/** @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y @param {number} pulse @param {number} scale */
function star(ctx, x, y, pulse, scale) {
	const r = (8 + pulse * 3.5) * scale;
	ctx.save();
	ctx.beginPath();
	ctx.arc(x, y, r + 8 * scale, 0, Math.PI * 2);
	ctx.fillStyle = `rgba(230,195,106,${0.28 + pulse * 0.22})`;
	ctx.fill();
	ctx.beginPath();
	for (let i = 0; i < 8; i++) {
		const angle = -Math.PI / 2 + (i * Math.PI) / 4;
		const radius = i % 2 === 0 ? r : r * 0.42;
		const px = x + Math.cos(angle) * radius;
		const py = y + Math.sin(angle) * radius;
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
	ctx.fillStyle = '#e6c36a';
	ctx.fill();
	ctx.lineWidth = 1.2 * scale;
	ctx.strokeStyle = '#6d5014';
	ctx.stroke();
	ctx.restore();
}

/**
 * Every land polygon in the window, in the current fill style: the world outline, then the
 * modern sheet's own countries, so a hidden one can be left out of a mask.
 * @param {CanvasRenderingContext2D} ctx
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 * @param {number} w
 * @param {number} h
 * @param {Set<string>} [hide]
 */
function fillEarth(ctx, world, frame, w, h, hide = new Set()) {
	for (const poly of earth) {
		ctx.beginPath();
		for (const ring of poly) {
			const shaped = shapeRing(world, ring, frame, null);
			if (shaped.length >= 3) trace(ctx, world, shaped, w, h, frame);
		}
		ctx.fill('evenodd');
	}
	if (sheetOf(world) !== 'modern') return;
	for (const [iso, rings] of Object.entries(land[sheetOf(world)])) {
		if (hide.has(iso)) continue;
		for (const ring of rings) {
			const shaped = shapeRing(world, ring, frame, null);
			if (shaped.length < 3) continue;
			if (path(ctx, world, shaped, w, h, frame)) ctx.fill();
		}
	}
}

/**
 * Depth-tinted sea and land hillshade for one window, from the elevation grids.
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 * @param {number} w
 * @param {number} h
 */
function groundLayers(world, frame, w, h) {
	if (world.mode === 'split') return null;
	const box = frame ?? (world.mode === 'equirect' ? world.frame : null);
	const lons = new Float64Array(w);
	const lats = new Float64Array(h);
	for (let col = 0; col < w; col++) {
		const u = (col + 0.5) / w;
		lons[col] = box ? box.lon0 + u * (box.lon1 - box.lon0) : sample(world, u, 0.5)[0];
	}
	const lat0 = box ? box.lat0 : world.lat0;
	const lat1 = box ? box.lat1 : world.lat1;
	for (let row = 0; row < h; row++) lats[row] = lat1 - ((row + 0.5) / h) * (lat1 - lat0);
	return terrain({
		key: `${world.id}:${box ? `${box.lon0},${box.lon1},${box.lat0},${box.lat1}` : `${world.span ?? 'pinched'}:${world.lat0},${world.lat1}`}`,
		w,
		h,
		lons,
		lats,
		regions: reliefFor(world, frame),
		fillLand: (target) => fillEarth(target, world, frame, w, h)
	});
}

/** @param {typeof antique | typeof modern} world @param {number} periodIndex @returns {Region[]} */
const regionsAt = (world, periodIndex) =>
	sheetOf(world) === 'antique'
		? antiqueRegions(phaseFor(world, periodIndex))
		: modernRegions(phaseFor(world, periodIndex));

/** @param {string} hex */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * An opaque wash: the power's ink laid over paper at the region's strength.
 * @param {string} color
 * @param {number} alpha
 */
function tint(color, alpha) {
	const ink = rgb((COLORS[color] ?? COLORS.rome).ink);
	const paper = rgb(PAPER);
	const a = Math.min(0.94, alpha);
	return `rgb(${ink.map((value, i) => Math.round(paper[i] + (value - paper[i]) * a)).join(',')})`;
}

const EDGE = 'rgba(42, 36, 28, 0.42)';
const SIZES_KEPT = 4;

/** @type {WeakMap<Region[], Map<string, HTMLCanvasElement>>} */
const regionLayers = new WeakMap();

/** @type {HTMLCanvasElement | null} */
let mask = null;

/**
 * All land in the window as one opaque layer. A `destination-in` mask has to be composited in
 * a single draw: each separate fill would erase everything outside its own polygon.
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 * @param {number} w
 * @param {number} h
 * @param {Set<string>} hide
 */
function landMask(world, frame, w, h, hide) {
	mask ??= document.createElement('canvas');
	mask.width = w;
	mask.height = h;
	const g = mask.getContext('2d');
	if (g) {
		g.fillStyle = '#fff';
		fillEarth(g, world, frame, w, h, hide);
	}
	return mask;
}

/**
 * Every region of a phase on one layer, later regions over earlier ones, cut to the land.
 * Each region strokes its rings and then fills them, so the fill hides its own inner seams and
 * the half of the stroke inside it: what is left is one line wherever two owners meet.
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 * @param {number} w
 * @param {number} h
 * @param {number} scale
 * @param {Set<string>} hide
 * @param {Region[]} regions
 */
function regionLayer(world, frame, w, h, scale, hide, regions) {
	let sizes = regionLayers.get(regions);
	if (!sizes) {
		sizes = new Map();
		regionLayers.set(regions, sizes);
	}
	return remember(sizes, viewKey(world, frame, w, h, hide), () => {
		const node = canvasOf(w, h);
		const g = node.getContext('2d');
		if (!g) return node;
		const edges = sheetOf(world) === 'antique';
		g.lineJoin = 'round';
		g.lineWidth = Math.max(1.6, 2.2 * scale);
		g.strokeStyle = EDGE;
		for (const region of regions) {
			const rings = ringsOf(world, frame, region);
			if (!rings.length) continue;
			if (edges && !region.blur && !region.iso) {
				for (const ring of rings) if (path(g, world, ring, w, h, frame)) g.stroke();
			}
			g.fillStyle = tint(region.color, region.alpha ?? 1);
			g.filter = region.blur ? `blur(${region.blur * scale}px)` : 'none';
			for (const ring of rings) if (path(g, world, ring, w, h, frame)) g.fill();
			g.filter = 'none';
		}
		g.globalCompositeOperation = 'destination-in';
		g.drawImage(landMask(world, frame, w, h, hide), 0, 0);
		g.globalCompositeOperation = 'source-over';
		return node;
	});
}

/** @param {number} w @param {number} h */
function canvasOf(w, h) {
	const node = document.createElement('canvas');
	node.width = w;
	node.height = h;
	return node;
}

/**
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 * @param {number} w
 * @param {number} h
 * @param {Set<string>} hide
 */
const viewKey = (world, frame, w, h, hide) =>
	`${world.id}|${frame ? `${frame.lon0},${frame.lon1},${frame.lat0},${frame.lat1}` : `${world.span ?? 'pinched'}:${world.lat0},${world.lat1}`}|${w}x${h}|${[...hide].join(',')}`;

/**
 * A layer from a small per-key cache that drops its oldest sizes first.
 * @param {Map<string, HTMLCanvasElement>} sizes
 * @param {string} key
 * @param {() => HTMLCanvasElement} build
 */
function remember(sizes, key, build) {
	const hit = sizes.get(key);
	if (hit) return hit;
	const node = build();
	sizes.set(key, node);
	while (sizes.size > SIZES_KEPT) {
		const oldest = sizes.keys().next().value;
		if (oldest === undefined) break;
		sizes.delete(oldest);
	}
	return node;
}

/**
 * A region's rings, cut to the view: its own rings, or its country's.
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 * @param {Region} region
 */
function ringsOf(world, frame, region) {
	const source = region.rings ?? (region.ring ? [region.ring] : (land[sheetOf(world)][region.iso ?? ''] ?? []));
	return source.map((ring) => shapeRing(world, ring, frame, null)).filter((ring) => ring.length >= 3);
}

/** @param {string} hex @param {number} amount toward white */
const pale = (hex, amount) => {
	const [r, g, b] = rgb(hex).map((value) => Math.round(value + (255 - value) * amount));
	return `rgb(${r},${g},${b})`;
};

/** @param {string} hex @param {number} alpha */
const rgba = (hex, alpha) => `rgba(${rgb(hex).join(',')},${alpha})`;

/** @type {WeakMap<Region[], WeakMap<object, Map<string, HTMLCanvasElement>>>} */
const focusLayers = new WeakMap();

/**
 * A soft glow and a pale rim around the powers a map is about, the way a printed atlas lifts
 * its subject. A name in `focus` lights every full-strength region of that color; a region in
 * it lights just that region. Later regions still win: a lit power is only what it holds once
 * the whole phase is painted, so a client or a stain on top of it cuts the glow.
 * @param {typeof antique | typeof modern} world
 * @param {Frame | null} frame
 * @param {number} w
 * @param {number} h
 * @param {number} scale
 * @param {Set<string>} hide
 * @param {Region[]} regions
 * @param {(string | Region)[]} focus
 */
function focusLayer(world, frame, w, h, scale, hide, regions, focus) {
	let byFocus = focusLayers.get(regions);
	if (!byFocus) {
		byFocus = new WeakMap();
		focusLayers.set(regions, byFocus);
	}
	let sizes = byFocus.get(focus);
	if (!sizes) {
		sizes = new Map();
		byFocus.set(focus, sizes);
	}
	return remember(sizes, viewKey(world, frame, w, h, hide), () => {
		const node = canvasOf(w, h);
		const out = node.getContext('2d');
		const shape = canvasOf(w, h);
		const g = shape.getContext('2d');
		const edge = canvasOf(w, h);
		const e = edge.getContext('2d');
		if (!out || !g || !e) return node;
		const names = new Set(focus.filter((item) => typeof item === 'string'));
		const picked = new Set(focus.filter((item) => typeof item !== 'string'));
		const lit = (/** @type {Region} */ region) =>
			picked.has(region) || (names.has(region.color) && (region.alpha ?? 1) >= 0.7);
		const colors = new Set(regions.filter(lit).map((region) => region.color));
		const glow = 18 * scale;
		const rim = Math.max(1.6, 3 * scale);
		const coast = landMask(world, frame, w, h, hide);

		for (const color of colors) {
			const ink = (COLORS[color] ?? COLORS.rome).ink;
			g.clearRect(0, 0, w, h);
			g.fillStyle = '#000';
			for (const region of regions) {
				const rings = ringsOf(world, frame, region);
				if (!rings.length) continue;
				g.globalCompositeOperation = lit(region) && region.color === color ? 'source-over' : 'destination-out';
				g.filter = region.blur ? `blur(${region.blur * scale}px)` : 'none';
				for (const ring of rings) if (path(g, world, ring, w, h, frame)) g.fill();
			}
			g.filter = 'none';
			g.globalCompositeOperation = 'destination-in';
			g.drawImage(coast, 0, 0);
			g.globalCompositeOperation = 'source-over';

			e.clearRect(0, 0, w, h);
			for (let i = 0; i < 8; i++) {
				const angle = (i * Math.PI) / 4;
				e.drawImage(shape, Math.cos(angle) * rim, Math.sin(angle) * rim);
			}
			e.globalCompositeOperation = 'source-in';
			e.fillStyle = pale(ink, 0.5);
			e.fillRect(0, 0, w, h);
			// The shape is drawn off the canvas so only its shadow lands, behind the rim.
			e.globalCompositeOperation = 'destination-over';
			e.shadowColor = rgba(ink, 0.8);
			e.shadowBlur = glow;
			e.shadowOffsetX = w * 2;
			e.drawImage(shape, -w * 2, 0);
			e.shadowColor = 'transparent';
			e.shadowBlur = 0;
			e.shadowOffsetX = 0;
			e.globalCompositeOperation = 'destination-out';
			e.drawImage(shape, 0, 0);
			e.globalCompositeOperation = 'source-over';
			out.drawImage(edge, 0, 0);
		}
		return node;
	});
}

/** @type {WeakMap<Region[], WeakMap<Region[], Region[]>>} */
const underlays = new WeakMap();

/**
 * A phase with marks on top, as one stable array so its layer stays cached.
 * @param {Region[]} phase
 * @param {Region[]} marks
 */
function underlaid(phase, marks) {
	let byMarks = underlays.get(phase);
	if (!byMarks) {
		byMarks = new WeakMap();
		underlays.set(phase, byMarks);
	}
	let regions = byMarks.get(marks);
	if (!regions) {
		regions = [...phase, ...marks];
		byMarks.set(marks, regions);
	}
	return regions;
}

/** @type {HTMLCanvasElement | null} */
let blend = null;
/** @type {HTMLCanvasElement | null} */
let incoming = null;

/**
 * @param {HTMLCanvasElement | null} node
 * @param {number} w
 * @param {number} h
 */
function scratch(node, w, h) {
	const out = node ?? document.createElement('canvas');
	if (out.width !== w || out.height !== h) {
		out.width = w;
		out.height = h;
	} else out.getContext('2d')?.clearRect(0, 0, w, h);
	return out;
}

/**
 * Draws one phase turning into the next. Additive blending of the two weighted layers is an
 * exact linear mix, so land owned in only one phase fades instead of popping. With a point, the
 * weight is a soft-edged disc growing from it instead of one number, so the new color spreads
 * out over the map from where it started.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} from
 * @param {HTMLCanvasElement} to
 * @param {number} t
 * @param {number[] | null} point canvas x, y
 */
function crossfade(ctx, from, to, t, point) {
	if (from === to || t >= 0.999) {
		ctx.drawImage(to, 0, 0);
		return;
	}
	if (t <= 0.001) {
		ctx.drawImage(from, 0, 0);
		return;
	}
	const w = from.width;
	const h = from.height;
	blend = scratch(blend, w, h);
	const g = blend.getContext('2d');
	if (!g) return;
	if (!point) {
		g.globalAlpha = 1 - t;
		g.drawImage(from, 0, 0);
		g.globalCompositeOperation = 'lighter';
		g.globalAlpha = t;
		g.drawImage(to, 0, 0);
		g.globalCompositeOperation = 'source-over';
		g.globalAlpha = 1;
		ctx.drawImage(blend, 0, 0);
		return;
	}
	const [x, y] = point;
	const far = Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y));
	const soft = far * 0.24;
	const r = t * (far + soft);
	const disc = g.createRadialGradient(x, y, Math.max(0, r - soft), x, y, Math.max(1e-3, r));
	disc.addColorStop(0, '#000');
	disc.addColorStop(1, 'rgba(0,0,0,0)');

	incoming = scratch(incoming, w, h);
	const n = incoming.getContext('2d');
	if (!n) return;
	n.drawImage(to, 0, 0);
	n.globalCompositeOperation = 'destination-in';
	n.fillStyle = disc;
	n.fillRect(0, 0, w, h);
	n.globalCompositeOperation = 'source-over';

	g.drawImage(from, 0, 0);
	g.globalCompositeOperation = 'destination-out';
	g.fillStyle = disc;
	g.fillRect(0, 0, w, h);
	g.globalCompositeOperation = 'lighter';
	g.drawImage(incoming, 0, 0);
	g.globalCompositeOperation = 'source-over';
	ctx.drawImage(blend, 0, 0);
}

/**
 * Where a lon/lat falls on the canvas, even off its edge.
 * @param {typeof antique | typeof modern} world
 * @param {number[]} at
 * @param {number} w
 * @param {number} h
 * @param {Frame | null} frame
 */
function canvasPoint(world, [lon, lat], w, h, frame) {
	if (!frame && world.mode === 'split') return project(world, lon, lat, w, h, null) ?? [w / 2, h / 2];
	const box = frame ?? (world.mode === 'equirect' ? world.frame : null);
	if (box) {
		return [((lon - box.lon0) / (box.lon1 - box.lon0)) * w, ((box.lat1 - lat) / (box.lat1 - box.lat0)) * h];
	}
	return [(pacificU(world, lon) ?? 0.5) * w, ((world.lat1 - lat) / (world.lat1 - world.lat0)) * h];
}

/** @param {number} edge0 @param {number} edge1 @param {number} x */
const smoothstep = (edge0, edge1, x) => {
	const k = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return k * k * (3 - 2 * k);
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {typeof antique | typeof modern} world
 * @param {number} origin
 * @param {number} index
 * @param {number} t
 * @param {number} pulse
 * @param {{
 *   frame?: Frame,
 *   scale?: number,
 *   star?: boolean,
 *   hide?: string[],
 *   underlay?: boolean,
 *   marks?: Region[],
 *   fromMarks?: Region[],
 *   spread?: number[],
 *   focus?: (string | Region)[],
 *   borders?: boolean
 * }} [opts] `marks` replace the period's regions; `fromMarks` are what they grow out of;
 *   `spread` is the lon/lat the change grows from; `focus` is what the map is about;
 *   `borders` strokes today's countries on the antique side.
 */
export function paint(ctx, world, origin, index, t, pulse, opts = {}) {
	const { canvas } = ctx;
	const w = canvas.width;
	const h = canvas.height;
	const frame = opts.frame ?? null;
	const scale = opts.scale ?? Math.min(1, w / 900);
	const marks = opts.marks;
	const hide = new Set(opts.hide ?? []);
	const ground = groundLayers(world, frame, w, h);
	ctx.clearRect(0, 0, w, h);
	if (ground) ctx.drawImage(ground.sea, 0, 0);
	else {
		ctx.fillStyle = SEA;
		ctx.fillRect(0, 0, w, h);
	}

	const strokeFrontiers = (/** @type {number[][][]} */ lines, weight) => {
		if (sheetOf(world) !== 'antique' || weight < 0.04 || !lines.length) return;
		ctx.save();
		ctx.globalAlpha = 0.55 * weight;
		ctx.strokeStyle = INK;
		ctx.lineWidth = Math.max(1.4, 1.8 * scale);
		ctx.lineJoin = 'round';
		ctx.setLineDash([5 * scale, 3.5 * scale]);
		for (const line of lines) {
			ctx.beginPath();
			let open = true;
			for (const [lon, lat] of line) {
				const pt = project(world, lon, lat, w, h, frame);
				if (!pt) {
					open = true;
					continue;
				}
				if (open) {
					ctx.moveTo(pt[0], pt[1]);
					open = false;
				} else ctx.lineTo(pt[0], pt[1]);
			}
			ctx.stroke();
		}
		ctx.restore();
	};

	ctx.save();
	ctx.fillStyle = PAPER;
	fillEarth(ctx, world, frame, w, h, hide);
	ctx.restore();

	const layer = (/** @type {Region[]} */ regions) => regionLayer(world, frame, w, h, scale, hide, regions);
	const to = marks ? (opts.underlay ? underlaid(regionsAt(world, index), marks) : marks) : regionsAt(world, index);
	const from = opts.fromMarks ?? (marks ? to : regionsAt(world, origin));
	const at = opts.spread ?? (marks ? null : PERIODS[index]?.spread?.[sheetOf(world)]) ?? null;
	const point = at && from !== to ? canvasPoint(world, at, w, h, frame) : null;
	crossfade(ctx, layer(from), layer(to), t, point);
	if (!marks) {
		strokeFrontiers(antiqueFrontiers(phaseFor(world, origin)), opts.fromMarks ? 0 : 1 - t);
		strokeFrontiers(antiqueFrontiers(phaseFor(world, index)), t);
	}

	if (ground) {
		ctx.save();
		ctx.globalCompositeOperation = 'soft-light';
		ctx.drawImage(ground.relief, 0, 0);
		ctx.restore();
	}

	const glow = (/** @type {Region[]} */ regions, /** @type {(string | Region)[] | null} */ focus, weight) => {
		if (!focus?.length || weight < 0.02) return;
		ctx.save();
		ctx.globalAlpha = Math.min(1, weight) * (0.82 + 0.18 * pulse);
		ctx.drawImage(focusLayer(world, frame, w, h, scale, hide, regions, focus), 0, 0);
		ctx.restore();
	};
	const arriving = point ? smoothstep(0.5, 1, t) : t;
	if (opts.focus !== undefined || marks || opts.fromMarks) {
		// A close-up lights its subject as it plays, so a replay shows the highlight too.
		glow(to, opts.focus ?? null, arriving);
	} else {
		const fromFocus = PERIODS[origin]?.focus?.[sheetOf(world)] ?? null;
		const toFocus = PERIODS[index]?.focus?.[sheetOf(world)] ?? null;
		if (from === to && fromFocus === toFocus) glow(to, toFocus, 1);
		else {
			glow(from, fromFocus, 1 - t);
			glow(to, toFocus, arriving);
		}
	}

	// Country lines are not drawn. A wash sits on the real coast, and where two washes meet
	// is only a change of color.

	if (!frame && world.mode === 'split') {
		ctx.save();
		ctx.strokeStyle = INK;
		ctx.globalAlpha = 0.85;
		ctx.lineWidth = Math.max(1.25, 1.7 * scale);
		ctx.beginPath();
		ctx.moveTo(w / 2, h * 0.07);
		ctx.lineTo(w / 2, h * 0.93);
		ctx.stroke();
		ctx.restore();
	}

	drawCities(ctx, world, frame, w, h, pulse, scale);

	if (opts.star === false) return;
	const holy = project(world, world.holy.lon, world.holy.lat, w, h, frame);
	if (holy && holy[0] > 0 && holy[1] > 0 && holy[0] < w && holy[1] < h) {
		star(ctx, holy[0], holy[1], pulse, scale);
	}
}
