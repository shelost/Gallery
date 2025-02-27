/*

import { error } from '@sveltejs/kit';

// Preload all markdown files
const allPosts = import.meta.glob('/src/posts/*.md', { eager: true });

// console.log('Available posts:', Object.keys(allPosts));


export async function load({ params }) {
	const { slug } = params;


	// Ensure the correct post is found
	const postEntry = Object.entries(allPosts).find(([path]) =>
		path.includes(`${slug}.md`)
	);


	if (!postEntry) {
		console.error(`Post not found: ${slug}`);
		throw error(404, `Post not found: ${slug}`);
	}

	const post = postEntry[1] as any;

	// Ensure content and metadata exist
	if (!post || !post.metadata || !post.default) {
		console.error(`Invalid markdown file: ${slug}`, post);
		throw error(500, `Invalid markdown file: ${slug}`);
	}

	console.log(typeof post.default)
	return {
		content: post.default, // Rendered Markdown content
		meta: post.metadata // Frontmatter metadata
	};
}
	*/


import { error } from '@sveltejs/kit'


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



