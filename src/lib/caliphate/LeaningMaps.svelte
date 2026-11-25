<script>
	import { browser } from '$app/environment';
	import { Canvas } from '@threlte/core';
	import { WebGLRenderer } from 'three';
	import LeanScene from './LeanScene.svelte';

	/** @type {{ maps: import('./window.js').MapSpec[], label: string }} */
	let { maps, label } = $props();

	const dpr = browser ? Math.min(devicePixelRatio, 2) : 1;

	/** @param {HTMLCanvasElement} canvas */
	const createRenderer = (canvas) =>
		new WebGLRenderer({ canvas, alpha: true, antialias: true });
</script>

<div class="lean" role="img" aria-label={label}>
	{#if browser}
		<Canvas renderMode="on-demand" {dpr} {createRenderer}>
			<LeanScene {maps} />
		</Canvas>
	{/if}
</div>

<style>
	.lean {
		width: min(460px, 78%);
		height: 210px;
		margin: 0.15rem auto 0;
	}

	.lean :global(canvas) {
		display: block;
		width: 100% !important;
		height: 100% !important;
	}
</style>
