<script>
	import FloatLabels from './FloatLabels.svelte';
	import MapModal from './MapModal.svelte';
	import { mapView } from './view.svelte.js';
	import { mountWindow } from './window.js';

	/** @type {{ map: import('./window.js').MapSpec, label: string }} */
	let { map, label } = $props();

	const controls = { replay: () => {} };
	/** @type {HTMLCanvasElement | undefined} */
	let canvas = $state();
	let open = $state(false);
	/** @type {import('./window.js').Pin[]} */
	let pins = $state.raw([]);
</script>

	<div class="map">
	<button type="button" class="open" aria-label="Expand map: {label}" onclick={() => (open = true)}>
		{#key mapView.relief}
			<canvas
				class:solo={map.solo}
				{@attach (node) => {
					canvas = node;
				}}
				{@attach (node) =>
					mountWindow(node, {
						...map,
						cities: map.cities ?? false,
						flat: map.solo || !mapView.relief,
						controls,
						onPins: (next) => {
							pins = next;
						}
					})}
			></canvas>
		{/key}
		<FloatLabels {pins} />
		{#if map.mood}
			<div class={['mood', map.mood]} aria-hidden="true"></div>
		{/if}
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
		position: relative;
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		overflow: hidden;
		border-radius: 10px;
		background: none;
		cursor: zoom-in;
	}

	canvas {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		height: auto;
		border-radius: 10px;
		background: #9cb7d1;
		transition: filter 200ms cubic-bezier(0.22, 0.61, 0.36, 1);
	}

	canvas.solo {
		background: transparent;
	}

	.mood {
		position: absolute;
		inset: 0;
		border-radius: 10px;
		pointer-events: none;
		overflow: hidden;
	}

	.mood.rain {
		background:
			repeating-linear-gradient(105deg, transparent 0 10px, rgba(180, 200, 220, 0.28) 11px 12px),
			linear-gradient(180deg, rgba(40, 60, 80, 0.18), transparent 40%);
		animation: rain 0.7s linear infinite;
	}

	.mood.fire {
		background:
			radial-gradient(circle at 20% 80%, rgba(255, 120, 30, 0.45), transparent 28%),
			radial-gradient(circle at 70% 90%, rgba(255, 60, 20, 0.4), transparent 24%),
			radial-gradient(circle at 50% 70%, rgba(255, 200, 80, 0.25), transparent 30%);
		animation: fire 1.4s ease-in-out infinite;
		mix-blend-mode: screen;
	}

	.mood.triumph {
		background: radial-gradient(circle at 50% 40%, rgba(230, 195, 106, 0.38), transparent 55%);
		animation: triumph 2.8s ease-in-out infinite;
	}

	@keyframes rain {
		from { background-position: 0 0, 0 0; }
		to { background-position: -18px 28px, 0 0; }
	}

	@keyframes fire {
		50% { opacity: 0.55; transform: translateY(-4%); }
	}

	@keyframes triumph {
		50% { opacity: 0.45; }
	}

	.open:hover canvas {
		filter: brightness(1.04) saturate(1.05);
	}

	.replay {
		position: absolute;
		z-index: 3;
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
