import { LEGACY } from '$lib/legacy.js';

/** The page as it was, with its relative paths pointed at its folder and its back link at the blog. */
export function GET({ params }) {
	const html = LEGACY[params.page]
		.replace('<head>', `<head>\n    <base href="/legacy/blog/${params.page}/">`)
		.replace("href = '../'", "href = '/blog'");

	return new Response(html, {
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=86400'
		}
	});
}
