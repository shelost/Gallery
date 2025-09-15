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
	vite: {
		optimizeDeps: {
			include: ['@unpic/svelte']
		},
		ssr: {
			noExternal: ['@unpic/svelte']
		}
	},
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extension: '.md',
		}),
		sveltePreprocess({
			scss: {
				prependData: '@use "src/lib/styles/variables.scss" as *;'
			}
		})
	],
	prerender: {
		handleHttpError: ({ status, path }) => {
		  if (status === 404) {
			console.warn(`⚠️ Skipping 404 page during prerender: ${path}`);
			return { bypass: true };
		  }
		}
	},
	vitePlugin: {
		prebundleSvelteLibraries: false
	}
};

export default config;
