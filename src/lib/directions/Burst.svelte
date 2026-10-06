<script module>
	import { random } from './motion.js';

	/**
	 * A shout balloon's outline: spikes of uneven length around a circle in a 100 by 100 box,
	 * stretched to the balloon's shape.
	 * @param {number} spikes
	 * @param {number} seed
	 */
	function outline(spikes, seed) {
		const next = random(seed);
		return Array.from({ length: spikes * 2 }, (_, i) => {
			const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
			const radius = i % 2 ? 33 + next() * 5 : 45 + next() * 5;
			return `${(50 + Math.cos(angle) * radius).toFixed(1)},${(50 + Math.sin(angle) * radius).toFixed(1)}`;
		}).join(' ');
	}
</script>

<script>
	/**
	 * A comic burst for shouting a word or two. It sits in its panel's top right corner and
	 * jolts when the panel is lit.
	 * @type {{ text: string, spikes?: number, seed?: number }}
	 */
	let { text, spikes = 12, seed = 7 } = $props();

	const points = $derived(outline(spikes, seed));
</script>

<span class="burst">
	<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
		<polygon {points} />
	</svg>
	<span class="text">{text}</span>
</span>

<style>
	.burst {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		z-index: 2;
		display: grid;
		place-items: center;
		width: 9rem;
		aspect-ratio: 1.45;
		pointer-events: none;
		transform: rotate(-8deg);
	}

	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	polygon {
		fill: var(--paper);
		stroke: var(--ink);
		stroke-width: var(--line, 2px);
		stroke-linejoin: miter;
		vector-effect: non-scaling-stroke;
	}

	.text {
		position: relative;
		max-width: 64%;
		font-family: var(--serif);
		font-size: 19px;
		font-style: italic;
		line-height: 0.95;
		text-align: center;
		color: var(--sanguine);
	}

	:global(.lit) > .burst {
		animation: jolt 520ms var(--ease-out);
	}

	@keyframes jolt {
		30% {
			transform: rotate(-12deg) scale(1.1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.lit) > .burst {
			animation: none;
		}
	}
</style>
