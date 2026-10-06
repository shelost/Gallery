<script module>
	import { random } from './motion.js';

	/** Half the viewBox. `slice` crops it to whatever box the lines fill. */
	const W = 600;
	const H = 420;

	/**
	 * Focus lines run in from past the frame and stop short of a clear centre; speed lines streak
	 * across it. The same seed always draws the same lines, on the server and in the browser.
	 * @param {'focus' | 'speed'} kind
	 * @param {number} seed
	 * @param {number} count
	 * @param {number} inner the clear radius focus lines stop at
	 */
	function strokes(kind, seed, count, inner) {
		const next = random(seed);
		if (kind === 'speed') {
			return Array.from({ length: count }, (_, i) => {
				const y = -H + next() * H * 2;
				const length = 240 + next() * 620;
				const x1 = -W + next() * (W * 2 - length);
				return { id: i, x1, y1: y, x2: x1 + length, y2: y, width: 0.6 + next() * 2.4 };
			});
		}
		return Array.from({ length: count }, (_, i) => {
			const angle = (i / count) * Math.PI * 2 + next() * 0.09;
			const start = inner + next() * inner * 0.6;
			return {
				id: i,
				x1: Math.cos(angle) * start,
				y1: Math.sin(angle) * start,
				x2: Math.cos(angle) * 1100,
				y2: Math.sin(angle) * 1100,
				width: 0.5 + next() * 2.2
			};
		});
	}
</script>

<script>
	import { inView } from './motion.js';

	/**
	 * Manga action lines that ink themselves in. With `active` they follow it, drawing in and
	 * retracting; without it they draw once, the first time they scroll into view.
	 * @type {{
	 *   kind?: 'focus' | 'speed',
	 *   seed?: number,
	 *   count?: number,
	 *   inner?: number,
	 *   x?: number,
	 *   y?: number,
	 *   active?: boolean,
	 *   class?: import('svelte/elements').ClassValue
	 * }}
	 */
	let { kind = 'focus', seed = 64, count = 64, inner = 150, x = 0, y = 0, active, class: className } = $props();

	let seen = $state(false);

	const lines = $derived(strokes(kind, seed, count, inner));
	const drawn = $derived(active ?? seen);
</script>

<svg
	class={['lines', kind, active === undefined ? 'once' : 'follow', drawn && 'drawn', className]}
	viewBox="{-W} {-H} {W * 2} {H * 2}"
	preserveAspectRatio="xMidYMid slice"
	aria-hidden="true"
	{@attach active === undefined &&
		inView((visible) => {
			if (visible) seen = true;
		})}
>
	<g transform="translate({x} {y})">
		{#each lines as line (line.id)}
			<line
				x1={line.x1}
				y1={line.y1}
				x2={line.x2}
				y2={line.y2}
				stroke-width={line.width}
				pathLength="1"
				style:--d={line.id % 9}
			/>
		{/each}
	</g>
</svg>

<style>
	.lines {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	line {
		stroke: var(--lines-ink, var(--ink));
		stroke-linecap: round;
		opacity: 0.85;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
	}

	.once line {
		transition: stroke-dashoffset 600ms var(--ease-out) calc(var(--d) * 22ms);
	}

	.follow line {
		transition: stroke-dashoffset 260ms var(--ease-out) calc(var(--d) * 9ms);
	}

	.drawn line {
		stroke-dashoffset: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.lines line {
			transition: none;
		}
	}
</style>
