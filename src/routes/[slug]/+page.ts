import { error } from '@sveltejs/kit'

export const prerender = false;

export async function load({ params }) {

	try {
		const post = await import(`../../posts/${params.slug}.md`)

		return {
			content: post.default,
			meta: post.metadata,
			slug: params.slug
		}
	} catch (e) {
		throw error(404, `Could not find ${params.slug}`)
	}
}
