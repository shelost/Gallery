import { worksIn } from '$lib/directions/content.js';
import { LEGACY } from '$lib/legacy.js';

const sources = import.meta.glob('/src/posts/*.md', { query: '?raw', import: 'default', eager: true });

/**
 * An essay's readable text: an original page without its markup (it wins its URL over any
 * post draft of the same name), or a post without its frontmatter and scripts.
 * @param {string} href
 */
function prose(href) {
	const page = LEGACY[href.slice(1)];
	if (page) {
		const body = page.match(/<body[\s\S]*<\/body>/)?.[0] ?? page;
		return body.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ');
	}
	const text = sources[`/src/posts${href}.md`];
	if (typeof text !== 'string') return null;
	return text.replace(/^---[\s\S]*?---/, '').replace(/<script[\s\S]*?<\/script>/g, '');
}

/**
 * Word counts and reading times for the essays, counted from their markdown (or original
 * page) at build time. Short pieces such as charts get no reading time.
 */
export function load() {
	/** @type {Record<string, { words: number, minutes: number | null }>} */
	const essays = {};
	for (const work of worksIn('writing')) {
		const text = prose(work.href);
		if (text === null) continue;
		const words = text.split(/\s+/).filter(Boolean).length;
		essays[work.id] = { words, minutes: words >= 200 ? Math.max(1, Math.round(words / 230)) : null };
	}
	return { essays };
}
