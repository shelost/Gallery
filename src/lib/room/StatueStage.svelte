<script>
	import { Canvas } from '@threlte/core';
	import { prefersReducedMotion } from 'svelte/motion';
	import { NeutralToneMapping } from 'three';
	import StatueRing from './StatueRing.svelte';
	import { sculpture } from './sculpt/load.js';
	import { STATUES } from './sculpt/statues.js';

	/**
	 * The statue carousel's stage: every statue on the ring in a scene of its own, with a note
	 * while the ones not yet sculpted are still being made.
	 * @type {{ offset: (i: number) => number, go: (i: number) => void }}
	 */
	let { offset, go } = $props();

	let made = $state(0);
	$effect(() => {
		let live = true;
		for (const statue of STATUES) sculpture(statue.id).then(() => live && (made += 1));
		return () => {
			live = false;
		};
	});
</script>

<div class="ring">
	<Canvas toneMapping={NeutralToneMapping} dpr={Math.min(devicePixelRatio, 2)}>
		<StatueRing {offset} {go} still={prefersReducedMotion.current} />
	</Canvas>
	{#if made < STATUES.length}
		<p class="making">Sculpting {made + 1} of {STATUES.length}…</p>
	{/if}
</div>

<style>
	.ring {
		position: absolute;
		inset: 0;
	}

	.making {
		position: absolute;
		left: 50%;
		bottom: 0.8rem;
		margin: 0;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.68rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		translate: -50% 0;
	}
</style>
