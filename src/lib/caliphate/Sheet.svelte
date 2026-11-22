<script>
	import { browser } from '$app/environment';
	import { Canvas } from '@threlte/core';
	import { NeutralToneMapping } from 'three';
	import { PERIODS, captionLabels, paint } from './sheets.js';
	import MapModal from './MapModal.svelte';
	import View from './View.svelte';
	import { mapView } from './view.svelte.js';

	/** @type {{ world: import('./sheets.js').World, when: string, origin: number, index: number, t: number }} */
	let { world, when, origin, index, t } = $props();

	const dpr = browser ? Math.min(devicePixelRatio, 2) : 1;
	const names = $derived(captionLabels(world, null, t > 0.5 ? index : origin));

	/** @type {HTMLButtonElement | undefined} */
	let stage = $state();
	/** @type {HTMLCanvasElement | undefined} */
	let flat = $state();

	$effect(() => {
		if (!browser || mapView.relief || !flat) return;
		const canvas = flat;
		const draw = () => {
			const width = canvas.clientWidth || 0;
			if (width < 8) return;
			canvas.width = Math.round(width);
			canvas.height = Math.round(width);
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			paint(ctx, world, origin, index, t, 0.35, { scale: 0.7 });
		};
		draw();
		const observer = new ResizeObserver(draw);
		observer.observe(canvas);
		return () => observer.disconnect();
	});
	/** @type {import('./window.js').MapSpec | null} */
	let opened = $state(null);

	function expand() {
		opened = { world, period: index, from: origin !== index ? origin : Math.max(0, index - 1) };
	}
</script>

<figure>
	<figcaption>
		<span>{world.title}</span>
		<time>{when}</time>
	</figcaption>
	{#if names.length}
		<p class="places" aria-hidden="true">
			{[...names.map((item) => item.text), world.holy.name].join(' · ')}
		</p>
	{/if}
	<button
		type="button"
		class="stage"
		aria-label="Expand map: {world.title}, {when}"
		{@attach (node) => {
			stage = node;
		}}
		onclick={expand}
	>
		{#if browser && mapView.relief}
			<Canvas toneMapping={NeutralToneMapping} {dpr}>
				<View {world} {origin} {index} {t} />
			</Canvas>
		{:else if browser}
			<canvas
				class="flat"
				{@attach (node) => {
					flat = node;
				}}
			></canvas>
		{/if}
	</button>
</figure>

{#if opened && stage}
	<MapModal
		map={opened}
		source={stage}
		label="{world.title}: {PERIODS[opened.period ?? 0].title}, {when}"
		onclose={() => (opened = null)}
	/>
{/if}

<style>
	figure {
		margin: 0;
		min-width: 0;
	}

	figcaption {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.2rem;
		color: var(--ink-3, #6d6860);
		font-size: 0.78rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	figcaption span {
		color: var(--ink, #1c1b18);
		font-weight: 550;
	}

	.places {
		margin: 0 0 0.35rem;
		color: var(--ink-3, #6d6860);
		font-size: 0.72rem;
		letter-spacing: 0.03em;
	}

	.flat {
		display: block;
		width: 100%;
		height: 100%;
	}

	.stage {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		padding: 0;
		border: 0;
		overflow: hidden;
		border-radius: 12px;
		background: #9cb7d1;
		cursor: zoom-in;
	}

	.stage :global(canvas) {
		display: block;
		width: 100% !important;
		height: 100% !important;
	}
</style>
