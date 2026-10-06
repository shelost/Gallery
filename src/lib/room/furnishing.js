import { SHELVES } from '$lib/directions/content.js';
import { SIZES } from '$lib/shelf/layout.js';

/**
 * What comes up from the shelf into the room: the books on one floating shelf, films, a tape
 * and a magazine on another, the records leaning on the cabinet, the podcasts as cassettes,
 * and every song in the CD rack. In meters, from the same sizes the shelf uses.
 */

/** @typedef {import('$lib/directions/content.js').ShelfItem} ShelfItem */
/** @typedef {import('$lib/directions/content.js').ShelfFormat} ShelfFormat */
/** @typedef {import('$lib/shelf/layout.js').ItemPiece} ItemPiece */
/** @typedef {{ item: ShelfItem, format: 'cd' | 'vinyl', i: number }} Track */

/** @param {string} id */
const shelf = (id) => SHELVES.find((entry) => entry.id === id);

/**
 * Face-out pieces in a row, centered on x = 0.
 * @param {[string, number][]} picks shelf id and item index
 * @param {number} gap
 * @returns {ItemPiece[]}
 */
function row(picks, gap) {
	/** @type {ItemPiece[]} */
	const pieces = [];
	let x = 0;
	for (const [id, i] of picks) {
		const source = shelf(id);
		const item = source?.items[i];
		if (!source || !item) continue;
		const [w, h, d] = SIZES[source.format];
		pieces.push({ key: `${id}:${i}`, type: 'item', item, format: source.format, shelf: id, i, w, h, d, x: x + w / 2 });
		x += w + gap;
	}
	const width = x - gap;
	return pieces.map((piece) => ({ ...piece, x: piece.x - width / 2 }));
}

/** Every book on every shelf, as [shelf id, index]. @type {[string, number][]} */
const BOOK_PICKS = SHELVES.filter((entry) => entry.format === 'book').flatMap((entry) =>
	entry.items.map((_, i) => /** @type {[string, number]} */ ([entry.id, i]))
);

export const BOOK_SHELF = row(BOOK_PICKS, 0.016);

export const MEDIA_SHELF = row(
	[
		['movies', 0],
		['movies', 1],
		['youtube', 0],
		['blogs', 0]
	],
	0.02
);

/** The books as the Stripe Press shelf shows them, in the same order. */
export const BOOKS = BOOK_SHELF.map((piece) => piece.item);

/** The records lean one in front of the other, each a little further out. */
export const SLEEVES = (shelf('music')?.items ?? []).map((item, i) => {
	const [w, h, d] = SIZES.vinyl;
	return /** @type {ItemPiece} */ ({ key: `music:${i}`, type: 'item', item, format: 'vinyl', shelf: 'music', i, w, h, d, x: i * 0.07 });
});

export const CASSETTES = shelf('podcasts')?.items ?? [];

/** Everything that plays, in shelf order. @type {Track[]} */
export const TRACKS = SHELVES.filter((entry) => entry.format === 'cd' || entry.format === 'vinyl').flatMap((entry) =>
	entry.items.map((item, i) => ({ item, format: /** @type {'cd' | 'vinyl'} */ (entry.format), i }))
);

export const CDS = TRACKS.filter((track) => track.format === 'cd');
export const RECORDS = TRACKS.filter((track) => track.format === 'vinyl');

/** A stable key for a track, for keyed lists and shared transitions. @param {Track} track */
export const trackKey = (track) => `${track.format}:${track.item.title}`;

/** @param {string} key */
export function findPiece(key) {
	return [...BOOK_SHELF, ...MEDIA_SHELF, ...SLEEVES].find((piece) => piece.key === key);
}

/** @param {ShelfItem} item */
export function trackOf(item) {
	return TRACKS.find((track) => track.item === item);
}
