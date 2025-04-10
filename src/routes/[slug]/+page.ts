import { error } from '@sveltejs/kit'
import { get } from 'svelte/store'
import { Posts } from '$lib/store'

export const prerender = false;

export async function load({ params, parent }) {
	// First try to get the post from the parent layout
	try {
		const { posts } = await parent();

		// If we have posts from the parent, find the one matching the slug
		if (posts && posts.length > 0) {
			const post = posts.find(p => p.slug === params.slug);
			if (post) {
				return post;
			}
		}

		// If not found in parent posts, try to import it directly
		const post = await import(`../../posts/${params.slug}.md`);

		return {
			content: post.default,
			meta: post.metadata,
			slug: params.slug
		}
	} catch (e) {
		throw error(404, `Could not find ${params.slug}`);
	}
}
