/**
 * Packs the recommendations onto floating shelves, in meters.
 * Objects stand face-out along each board and wrap to a new board when a row runs out of width,
 * so a narrow screen gets a taller wall instead of a horizontal scroll.
 */

/** @typedef {import('$lib/directions/content.js').Shelf} Shelf */
/** @typedef {import('$lib/directions/content.js').ShelfItem} ShelfItem */
/** @typedef {import('$lib/directions/content.js').ShelfFormat} ShelfFormat */

/**
 * @typedef {{ key: string, type: 'item', item: ShelfItem, format: ShelfFormat, shelf: string, i: number, w: number, h: number, d: number, x: number }} ItemPiece
 * @typedef {{ key: string, type: 'deck', w: number, h: number, d: number, x: number }} DeckPiece
 * @typedef {{ key: string, type: 'plant', variant: 'snake' | 'bush' | 'fern', w: number, h: number, d: number, x: number }} PlantPiece
 * @typedef {ItemPiece | DeckPiece | PlantPiece} Piece
 * @typedef {{ y: number, h: number, pieces: Piece[] }} Row
 * @typedef {{ rows: Row[], width: number, height: number }} Wall
 */

/** Face-out width, height, and thickness of each object. @type {Record<ShelfFormat, [number, number, number]>} */
export const SIZES = {
	book: [0.15, 0.225, 0.035],
	magazine: [0.2, 0.27, 0.006],
	dvd: [0.135, 0.19, 0.014],
	vhs: [0.105, 0.19, 0.025],
	cassette: [0.11, 0.07, 0.017],
	cd: [0.142, 0.125, 0.01],
	vinyl: [0.3, 0.3, 0.005]
};

/** A leaf of book paper is about a tenth of a millimeter, so each page adds half that. */
const CM_PER_PAGE = 0.005;
/** Both boards of a cover together. */
const CM_BOARDS = 0.3;

/**
 * An object's width, height and thickness in meters. Books with a trim size and a page count are
 * as big as the real thing; everything else uses its format's standard size.
 * @param {ShelfItem} item
 * @param {ShelfFormat} format
 * @returns {[number, number, number]}
 */
export function dimensions(item, format) {
	const [w, h, d] = SIZES[format];
	if (format !== 'book') return [w, h, item.depth ? d * 1.5 : d];
	const [cw, ch] = item.size ?? [w * 100, h * 100];
	const thick = item.pages ? CM_BOARDS + item.pages * CM_PER_PAGE : d * 100;
	return [cw / 100, ch / 100, thick / 100];
}

export const BOARD = { thickness: 0.028, depth: 0.36 };

/** The turntable lies flat, so its depth is what matters to the board. */
const DECK = { w: 0.42, h: 0.11, d: 0.32 };

/** @type {Record<PlantPiece['variant'], [number, number]>} */
const PLANTS = { snake: [0.16, 0.38], bush: [0.17, 0.24], fern: [0.15, 0.2] };

/** The order things go up on the wall, reading left to right, top to bottom. */
const SEQUENCE = [
	'plant:snake',
	'nonfiction',
	'fiction',
	'manga',
	'blogs',
	'movies',
	'youtube',
	'podcasts',
	'plant:fern',
	'songs-christian',
	'songs-en',
	'songs-international',
	'music',
	'deck',
	'plant:bush'
];

const GAP = 0.024;
/** Extra air where one kind of thing gives way to the next. */
const BREAK = 0.05;
const HEADROOM = 0.08;
const MARGIN = 0.1;

/**
 * @param {Shelf[]} shelves
 * @returns {{ piece: Piece, group: string }[]}
 */
function collect(shelves) {
	return SEQUENCE.flatMap((entry) => {
		if (entry === 'deck') return [{ piece: { key: 'deck', type: /** @type {const} */ ('deck'), ...DECK, x: 0 }, group: entry }];
		if (entry.startsWith('plant:')) {
			const variant = /** @type {PlantPiece['variant']} */ (entry.slice(6));
			const [w, h] = PLANTS[variant];
			return [{ piece: { key: entry, type: /** @type {const} */ ('plant'), variant, w, h, d: w, x: 0 }, group: entry }];
		}
		const shelf = shelves.find((candidate) => candidate.id === entry);
		if (!shelf) return [];
		return shelf.items.map((item, i) => {
			const [w, h, d] = dimensions(item, shelf.format);
			return {
				piece: /** @type {ItemPiece} */ ({ key: `${shelf.id}-${i}`, type: 'item', item, format: shelf.format, shelf: shelf.id, i, w, h, d, x: 0 }),
				group: entry
			};
		});
	});
}

/**
 * @param {Shelf[]} shelves
 * @param {number} maxWidth the widest a board may get
 * @returns {Wall}
 */
export function arrange(shelves, maxWidth) {
	/** @type {{ pieces: Piece[], width: number }[]} */
	const lines = [];
	let line = { pieces: /** @type {Piece[]} */ ([]), width: 0 };
	let previous = '';

	for (const { piece, group } of collect(shelves)) {
		const space = line.pieces.length ? (group === previous ? GAP : BREAK) : 0;
		if (line.pieces.length && line.width + space + piece.w > maxWidth) {
			lines.push(line);
			line = { pieces: [], width: 0 };
		}
		const lead = line.pieces.length ? space : 0;
		piece.x = line.width + lead;
		line.width += lead + piece.w;
		line.pieces.push(piece);
		previous = group;
	}
	if (line.pieces.length) lines.push(line);

	const width = Math.max(...lines.map((entry) => entry.width)) + MARGIN * 2;

	/** Boards stack from the top down; y is the top face of each board. */
	let top = 0;
	const rows = lines.map((entry) => {
		const h = Math.max(...entry.pieces.map((piece) => piece.h)) + HEADROOM;
		top -= h;
		const offset = -entry.width / 2;
		for (const piece of entry.pieces) piece.x = offset + piece.x + piece.w / 2;
		const row = { y: top, h, pieces: entry.pieces };
		top -= BOARD.thickness;
		return row;
	});

	const height = -top;
	for (const row of rows) row.y += height / 2;

	return { rows, width, height };
}

/** Narrower screens get narrower boards. @param {number} px */
export function reach(px) {
	if (px < 560) return 0.95;
	if (px < 900) return 1.4;
	return 1.95;
}
