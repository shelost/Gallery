<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { inView } from './motion.js';
	import { RippleGrid } from './ripples.js';

	/**
	 * `pulse` stirs one of the glyphs whenever it changes, for example to a hovered row's id.
	 * @type {{ pulse?: string | null }}
	 */
	let { pulse = null } = $props();

	let visible = $state(false);

	/** @param {HTMLCanvasElement} canvas */
	function grid(canvas) {
		const sim = new RippleGrid(canvas);

		$effect(() => {
			sim.setMotion(visible, prefersReducedMotion.current);
		});
		$effect(() => {
			if (pulse) sim.pulse(pulse);
		});

		return () => sim.destroy();
	}
</script>

<canvas
	aria-label="An ARC-style grid that ripples under the cursor. Click a cell to mark it."
	{@attach inView((isVisible) => (visible = isVisible))}
	{@attach grid}
></canvas>

<style>
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		cursor: cell;
		touch-action: manipulation;
	}
</style>
