import { SHELVES } from '$lib/directions/content.js';
import { SIZES, dimensions } from '$lib/shelf/layout.js';

/**
 * What comes up from the shelf into the room: the books spine out on one floating shelf with
 * the records leaning beside them, films, a tape and a magazine on another, and the podcasts
 * as cassettes.
 * Every song is a record, since the turntable is the only player. In meters, at real size.
 */

/** @typedef {import('$lib/directions/content.js').ShelfItem} ShelfItem */
/** @typedef {import('$lib/directions/content.js').ShelfFormat} ShelfFormat */
/** @typedef {import('$lib/shelf/layout.js').ItemPiece} ItemPiece */
/** @typedef {{ item: ShelfItem, shelf: string, i: number }} Track */

/** @param {string} id */
const shelf = (id) => SHELVES.find((entry) => entry.id === id);

/** @param {string} id */
export const shelfLabel = (id) => shelf(id)?.label ?? '';

/**
 * Pieces in a row, centered on x = 0: face out, each as wide as its cover, or spine out, as
 * wide as it is thick.
 * @param {[string, number][]} picks shelf id and item index
 * @param {number} gap
 * @param {boolean} [spines]
 * @returns {ItemPiece[]}
 */
function row(picks, gap, spines = false) {
	/** @type {ItemPiece[]} */
	const pieces = [];
	let x = 0;
	for (const [id, i] of picks) {
		const source = shelf(id);
		const item = source?.items[i];
		if (!source || !item) continue;
		const [w, h, d] = dimensions(item, source.format);
		const across = spines ? d : w;
		pieces.push({ key: `${id}:${i}`, type: 'item', item, format: source.format, shelf: id, i, w, h, d, x: x + across / 2 });
		x += across + gap;
	}
	const width = x - gap;
	return pieces.map((piece) => ({ ...piece, x: piece.x - width / 2 }));
}

/** @param {(entry: import('$lib/directions/content.js').Shelf) => boolean} test */
const picks = (test) =>
	SHELVES.filter(test).flatMap((entry) => entry.items.map((_, i) => /** @type {[string, number]} */ ([entry.id, i])));

export const BOOK_SHELF = row(
	picks((entry) => entry.format === 'book'),
	0.003,
	true
);

export const MEDIA_SHELF = row(
	[
		['movies', 0],
		['movies', 1],
		['youtube', 0],
		['blogs', 0]
	],
	0.02
);

export const TAPES = row(
	picks((entry) => entry.id === 'podcasts'),
	0
);

/** The records lean one in front of the other, each a little further along. */
export const SLEEVES = (shelf('music')?.items ?? []).map((item, i) => {
	const [w, h, d] = SIZES.vinyl;
	return /** @type {ItemPiece} */ ({ key: `music:${i}`, type: 'item', item, format: 'vinyl', shelf: 'music', i, w, h, d, x: i * 0.07 });
});

/** Every song and record, grouped the way the shelf groups them. */
export const CRATES = SHELVES.filter((entry) => entry.format === 'cd' || entry.format === 'vinyl').map((entry) => ({
	id: entry.id,
	label: entry.label,
	tracks: entry.items.map((item, i) => /** @type {Track} */ ({ item, shelf: entry.id, i }))
}));

/** Everything that plays, in shelf order. */
export const TRACKS = CRATES.flatMap((crate) => crate.tracks);

/** A stable key for a track, for keyed lists and shared transitions. @param {Track} track */
export const trackKey = (track) => `${track.shelf}:${track.i}`;

/** The things in the room that aren't off a shelf, described the way shelf items are. */
export const KEEPSAKES = /** @satisfies {Record<string, ShelfItem>} */ ({
	arc: {
		title: 'ARC-AGI',
		by: 'François Chollet',
		year: '2019',
		tone: '#f6f4ff',
		ink: '#1c1b18',
		href: 'https://arcprize.org',
		note: 'Small grid puzzles that are easy for people and hard for machines: work out the rule from a few examples, then apply it. I worked on them at Cornell with Prof. Kevin Ellis. This one is drawn fresh each time, mirrored like the sprites in the set.'
	}
});

/** @param {string} key */
export function findPiece(key) {
	return [...BOOK_SHELF, ...MEDIA_SHELF, ...TAPES, ...SLEEVES].find((piece) => piece.key === key);
}

/** @param {ShelfItem} item */
export function trackOf(item) {
	return TRACKS.find((track) => track.item === item);
}
