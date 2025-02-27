export type Categories = 'sveltekit' | 'svelte'

export type Post = {
	type: string
	title: string
	slug: string
	description: string
	author: string
	date: string
	categories: Categories[]
	published: boolean
}
