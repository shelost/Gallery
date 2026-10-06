/** @typedef {import('./content.js').ShelfItem} ShelfItem */

/**
 * A YouTube embed that starts playing a recommendation, or '' when there's nothing to play.
 * Items with a video play it; items with a query play the top result. With `search`, anything
 * else is looked up by its title and artist, which is how music without a link still plays.
 * @param {ShelfItem | null | undefined} item
 * @param {{ search?: boolean }} [options]
 */
export function embed(item, { search = false } = {}) {
	if (!item) return '';
	if (item.youtube) return `https://www.youtube-nocookie.com/embed/${item.youtube}?autoplay=1&rel=0`;
	const query = item.query ?? (search ? [item.title, item.by].filter(Boolean).join(' ') : '');
	return query
		? `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`
		: '';
}

/** Where a recommendation lives online: its Wikipedia page, else its link. @param {ShelfItem} item */
export function pageFor(item) {
	return item.wiki ? `https://en.wikipedia.org/wiki/${encodeURIComponent(item.wiki)}` : item.href;
}
