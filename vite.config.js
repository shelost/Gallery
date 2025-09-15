import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
	],
	optimizeDeps: {
		exclude: ['@xyflow/svelte', 'sharp', '@node-loader/babel', '@babel/core']
	},
	ssr: {
		noExternal: ['three', '@xyflow/svelte'],
		external: ['sharp', '@node-loader/babel', '@babel/core']
	}
});
