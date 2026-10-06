/** First-segment routes with their own `+page`, not `[slug]` markdown. */
const DEDICATED_PATHS = new Set([
	'about',
	'apps',
	'blog',
	'calculator',
	'camera',
	'color',
	'comics',
	'directions',
	'flow',
	'frames',
	'games',
	'gemini',
	'gre',
	'house',
	'image',
	'journal',
	'novel',
	'orange',
	'original',
	'phone',
	'platformr',
	'pseudo',
	'resume',
	'room',
	'sketch',
	'stan-hero',
	'text',
	'tiles',
	'vault',
	'wikipedia',
	'words',
	'_pdf'
]);

export function slugFromHref(href, origin) {
	if (!href) return null;
	try {
		const url = new URL(href, origin);
		if (origin && url.origin !== origin) return null;
		const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
		if (parts.length !== 1) return null;
		return parts[0];
	} catch {
		return null;
	}
}

export function isPeekableSlug(slug, posts = []) {
	if (!slug || DEDICATED_PATHS.has(slug)) return false;
	return posts.some((post) => post.slug === slug);
}
