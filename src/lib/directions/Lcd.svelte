<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { LcdRenderer } from './lcd.js';
	import { inView } from './motion.js';

	/**
	 * @type {{
	 *   header: { left: string, right: string },
	 *   title: string,
	 *   meta?: string,
	 *   marquee?: string,
	 *   source: import('./lcd.js').LcdSource | null,
	 *   label?: string
	 * }}
	 */
	let { header, title, meta = '', marquee = '', source, label = '' } = $props();

	let visible = $state(false);

	/** The renderer is created once; child effects push new content and the play state into it. @param {HTMLCanvasElement} canvas */
	function screen(canvas) {
		const renderer = new LcdRenderer(canvas);
		$effect(() => {
			renderer.update({ header, title, meta, marquee, source });
		});
		$effect(() => {
			renderer.setRunning(visible && !prefersReducedMotion.current);
		});
		return () => renderer.destroy();
	}
</script>

<div class="lcd" role="img" aria-label={label} {@attach inView((isVisible) => (visible = isVisible))}>
	<canvas {@attach screen} aria-hidden="true"></canvas>
</div>

<style>
	.lcd {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		background: var(--te-screen);
		line-height: 0;
	}

	.lcd::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(155deg, rgba(255, 255, 255, 0.07), transparent 38%);
	}

	canvas {
		width: 100%;
		aspect-ratio: 2 / 1;
	}
</style>
