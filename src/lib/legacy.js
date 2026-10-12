/**
 * Articles from the old static site, kept byte for byte under `static/legacy/blog/<slug>/`
 * and served at `/<slug>`.
 */
const pages = import.meta.glob('/static/legacy/blog/*/index.html', {
	query: '?raw',
	import: 'default',
	eager: true
});

/** @type {Record<string, string>} */
export const LEGACY = Object.fromEntries(
	Object.entries(pages).map(([path, html]) => [path.split('/').at(-2) ?? '', /** @type {string} */ (html)])
);
