<script>
	import { on } from 'svelte/events';
	import { Spring, prefersReducedMotion } from 'svelte/motion';
	import { PROFILE } from './content.js';
	import { clamp } from './motion.js';

	/** @type {{ size?: string, class?: string }} */
	let { size = '14rem', class: className = '' } = $props();

	const light = new Spring({ x: 68, y: 22 }, { stiffness: 0.07, damping: 0.6 });

	/**
	 * Moves the key light toward the cursor, wherever it is on the page.
	 * @type {import('svelte/attachments').Attachment<HTMLElement>}
	 */
	function followCursor(figure) {
		return on(window, 'pointermove', (event) => {
			if (prefersReducedMotion.current) return;
			const rect = figure.getBoundingClientRect();
			light.target = {
				x: clamp(((event.clientX - rect.left) / rect.width) * 100, -15, 115),
				y: clamp(((event.clientY - rect.top) / rect.height) * 100, -15, 100)
			};
		});
	}
</script>

<figure
	class={['bust', className]}
	style:--size={size}
	style:--lx="{light.current.x}%"
	style:--ly="{light.current.y}%"
	style:--mask="url({PROFILE.bust})"
	{@attach followCursor}
>
	<img src={PROFILE.bust} alt="A marble bust" draggable="false" />
	<span class="light" aria-hidden="true"></span>
</figure>

<style>
	.bust {
		position: relative;
		width: var(--size);
		aspect-ratio: 532 / 648;
		margin: 0;
		user-select: none;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: grayscale(1) sepia(0.14) contrast(1.05) brightness(1.03);
	}

	.light {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			radial-gradient(
				circle at var(--lx) var(--ly),
				rgba(255, 244, 222, 0.95),
				rgba(255, 244, 222, 0) 46%
			),
			radial-gradient(
				circle at calc(100% - var(--lx)) calc(115% - var(--ly)),
				rgba(28, 20, 12, 0.5),
				rgba(28, 20, 12, 0) 64%
			);
		mix-blend-mode: soft-light;
		-webkit-mask: var(--mask) center / contain no-repeat;
		mask: var(--mask) center / contain no-repeat;
	}
</style>
