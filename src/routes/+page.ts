import type { Post } from '$lib/types'
import { Posts } from '$lib/store'
import { error } from '@sveltejs/kit'

export async function load({ fetch }) {
	const response = await fetch('api/posts')
	const posts: Post[] = await response.json()
	let p = []
	for (let i = 0; i < posts.length; i++){
		try {
			const post = await import(`../posts/${posts[i].slug}.md`)

			p.push( {
				content: post.default,
				meta: post.metadata,
				slug: posts[i].slug
			} )
		} catch (e) {
			throw error(404, `Could not find ${posts[i].slug}`)
		}
	}

	const typeOrder = ['design', 'game', 'comic', 'gallery', 'blog']

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

	Posts.set(p)

	return { posts: p}
}
