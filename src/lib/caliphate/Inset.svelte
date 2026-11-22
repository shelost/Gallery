<script>
	import MapModal from './MapModal.svelte';
	import { mountWindow } from './window.js';

	/** @type {{ map: import('./window.js').MapSpec, label: string }} */
	let { map, label } = $props();

	const controls = { replay: () => {} };
	/** @type {HTMLCanvasElement | undefined} */
	let canvas = $state();
	let open = $state(false);
</script>

<div class="map">
	<button type="button" class="open" aria-label="Expand map: {label}" onclick={() => (open = true)}>
		<canvas
			{@attach (node) => {
				canvas = node;
			}}
			{@attach (node) => mountWindow(node, { ...map, controls })}
		></canvas>
	</button>
	<button type="button" class="replay" aria-label="Replay map" onclick={() => controls.replay()}>
		<svg viewBox="0 0 16 16" aria-hidden="true">
			<path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3" />
			<path d="M3 2.5v3h3" />
		</svg>
	</button>
</div>

{#if open && canvas}
	<MapModal {map} source={canvas} seed={canvas} {label} onclose={() => (open = false)} />
{/if}

<style>
	.map {
		position: relative;
	}

	.open {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		border-radius: 10px;
		background: none;
		cursor: zoom-in;
	}

	canvas {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 1;
		border-radius: 10px;
		background: #9cb7d1;
		transition: filter 200ms cubic-bezier(0.22, 0.61, 0.36, 1);
	}

	.open:hover canvas {
		filter: brightness(1.04) saturate(1.05);
	}

	.replay {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: rgba(28, 27, 24, 0.55);
		color: #f3efe6;
		cursor: pointer;
		opacity: 0.75;
		transition: opacity 160ms cubic-bezier(0.22, 0.61, 0.36, 1);
	}

	.map:hover .replay,
	.replay:focus-visible {
		opacity: 1;
	}

	.replay svg {
		width: 15px;
		height: 15px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
