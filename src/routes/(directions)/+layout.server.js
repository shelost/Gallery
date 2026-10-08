import { worksIn } from '$lib/directions/content.js';

const sources = import.meta.glob('/src/posts/*.md', { query: '?raw', import: 'default', eager: true });

/**
 * Word counts and reading times for the essays, counted from their markdown at
 * build time. Short pieces such as charts get no reading time.
 */
export function load() {
	/** @type {Record<string, { words: number, minutes: number | null }>} */
	const essays = {};
	for (const work of worksIn('writing')) {
		const text = sources[`/src/posts${work.href}.md`];
		if (typeof text !== 'string') continue;
		const prose = text.replace(/^---[\s\S]*?---/, '').replace(/<script[\s\S]*?<\/script>/g, '');
		const words = prose.split(/\s+/).filter(Boolean).length;
		essays[work.id] = { words, minutes: words >= 200 ? Math.max(1, Math.round(words / 230)) : null };
	}
	return { essays };
}
