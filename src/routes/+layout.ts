export const prerender = true

import type { Post } from '$lib/types'
import { Posts } from '$lib/store'
import { error } from '@sveltejs/kit'
import { get } from 'svelte/store'

export async function load({ url, fetch }) {
	// Only load posts once using the Posts store
	const currentPosts = get(Posts)
	if (currentPosts && currentPosts.length > 0) {
		// If Posts is already populated, just return the URL
		return {
			url: url.pathname,
			posts: currentPosts
		}
	}

	// Otherwise, fetch and populate the Posts store
	try {
		const response = await fetch('api/posts')
		const posts: Post[] = await response.json()
		let p = []

		for (let i = 0; i < posts.length; i++){
			try {
				const post = await import(`../posts/${posts[i].slug}.md`)

				p.push({
					content: post.default,
					meta: post.metadata,
					slug: posts[i].slug
				})
			} catch (e) {
				console.error(`Could not find ${posts[i].slug}`, e)
				// Don't throw an error here, just skip this post
			}
		}

		const typeOrder = ['tool', 'design', 'game', 'comic', 'gallery', 'blog']

		p.sort((a, b) => {
			// Get the index of each type in the typeOrder array
			let typeA = typeOrder.indexOf(a.meta.type);
			let typeB = typeOrder.indexOf(b.meta.type);

			// If type is not in typeOrder, move it to the end by assigning a large index
			if (typeA === -1) typeA = Infinity;
			if (typeB === -1) typeB = Infinity;

			// First, sort by type order
			if (typeA !== typeB) return typeA - typeB;

			// If types are the same, sort by rating (undefined ratings go to the end)
			let ratingA = a.meta.rating ?? -Infinity; // Treat missing ratings as lowest
			let ratingB = b.meta.rating ?? -Infinity;

			return ratingB - ratingA; // Higher ratings first
		});

		// Set the Posts store with the loaded data
		Posts.set(p)

		return {
			url: url.pathname,
			posts: p
		}
	} catch (e) {
		console.error('Error loading posts:', e)
		// Return empty posts rather than failing the whole app
		return {
			url: url.pathname,
			posts: []
		}
	}
}
