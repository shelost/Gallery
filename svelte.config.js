import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import sveltePreprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	kit: {
		adapter: adapter()
	},
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extension: '.md',
		}),
	],
	prerender: {
		handleHttpError: ({ status, path }) => {
		  if (status === 404) {
			console.warn(`⚠️ Skipping 404 page during prerender: ${path}`);
			return { bypass: true };
		  }
		}
	}
};

export default config;
