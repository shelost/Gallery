<script>
	import { browser } from '$app/environment';
	import { Canvas } from '@threlte/core';
	import { NeutralToneMapping } from 'three';
	import { PERIODS, captionLabels } from './sheets.js';
	import MapModal from './MapModal.svelte';
	import View from './View.svelte';

	/** @type {{ world: import('./sheets.js').World, when: string, origin: number, index: number, t: number }} */
	let { world, when, origin, index, t } = $props();

	const dpr = browser ? Math.min(devicePixelRatio, 2) : 1;
	const names = $derived(captionLabels(world, null, t > 0.5 ? index : origin));

	/** @type {HTMLButtonElement | undefined} */
	let stage = $state();
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
		{#if browser}
			<Canvas toneMapping={NeutralToneMapping} {dpr}>
				<View {world} {origin} {index} {t} />
			</Canvas>
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
