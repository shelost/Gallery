<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { spring } from '$lib/directions/motion.js';

	/**
	 * A modal that grows out of the thing that was clicked and shrinks back into it, so opening
	 * an object reads as picking it up rather than as a box appearing over the page. There's no
	 * panel: what's inside floats over the frosted page on its own, the way the sheet of hanji
	 * does. `origin` is the click point in viewport pixels; `onclosed` runs once it has shrunk away.
	 * @type {{ origin: { x: number, y: number } | null, label: string, width?: string, onclose: () => void, onclosed?: () => void, children: import('svelte').Snippet }}
	 */
	let { origin, label, width = '60rem', onclose, onclosed, children } = $props();

	/**
	 * @param {HTMLElement} node
	 * @param {{ duration: number, easing: (t: number) => number }} params
	 */
	function grow(node, { duration, easing }) {
		const rect = node.getBoundingClientRect();
		const from = origin ?? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		const dx = from.x - (rect.left + rect.width / 2);
		const dy = from.y - (rect.top + rect.height / 2);
		return {
			duration: prefersReducedMotion.current ? 0 : duration,
			easing,
			css: (/** @type {number} */ t, /** @type {number} */ u) =>
				`transform: translate3d(${u * dx}px, ${u * dy}px, 0) scale(${0.1 + 0.9 * t}); opacity: ${Math.min(1, t * 2.5)}`
		};
	}

	/** @param {HTMLElement} node */
	function focus(node) {
		node.focus({ preventScroll: true });
	}

	const fadeIn = $derived({ duration: prefersReducedMotion.current ? 0 : 280, easing: cubicOut });
	const fadeOut = $derived({ duration: prefersReducedMotion.current ? 0 : 240, easing: cubicIn });

	$effect(() => {
		const html = document.documentElement;
		const previous = html.style.overflow;
		html.style.overflow = 'hidden';
		return () => {
			html.style.overflow = previous;
		};
	});
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && onclose()} />

<div class="sheet">
	<button type="button" class="scrim" aria-label="Close" tabindex="-1" onclick={onclose} in:fade|global={fadeIn} out:fade|global={fadeOut}></button>
	<div
		class="panel"
		role="dialog"
		aria-modal="true"
		aria-label={label}
		tabindex="-1"
		style:--width={width}
		{@attach focus}
		in:grow|global={{ duration: 680, easing: spring }}
		out:grow|global={{ duration: 300, easing: cubicIn }}
		onoutroend={onclosed}
	>
		{@render children()}
	</div>
	<button type="button" class="close" aria-label="Close" onclick={onclose} in:fade|global={fadeIn} out:fade|global={fadeOut}>
		<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
	</button>
</div>

<style>
	.sheet {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: grid;
		place-items: center;
		padding: 1rem;
	}

	/* The page stays in view behind, frosted over, so whatever's opened has nothing around it. */
	.scrim {
		position: absolute;
		inset: 0;
		border: 0;
		background: color-mix(in oklab, var(--paper, #fbfaf7) 70%, transparent);
		-webkit-backdrop-filter: blur(16px) saturate(1.1);
		backdrop-filter: blur(16px) saturate(1.1);
		cursor: default;
	}

	.panel {
		position: relative;
		width: min(var(--width), 100%);
		max-height: calc(100dvh - 2rem);
		overflow: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		outline: none;
		will-change: transform;
	}

	.close {
		position: absolute;
		top: 1.1rem;
		right: 1.1rem;
		z-index: 2;
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.82);
		box-shadow:
			0 0 0 1px rgba(28, 27, 24, 0.07),
			0 10px 22px -12px rgba(28, 27, 24, 0.45);
		-webkit-backdrop-filter: blur(10px);
		backdrop-filter: blur(10px);
		color: var(--ink, #1c1b18);
		cursor: pointer;
		transition:
			background-color 160ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.close:hover {
		background: #fff;
	}

	.close:active {
		transform: scale(0.92);
	}

	.close svg {
		width: 0.85rem;
		height: 0.85rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
	}

	/* On a phone it fills the width under a strip for the close button. */
	@media (max-width: 640px) {
		.sheet {
			place-items: start center;
			padding: 3.6rem 0.5rem 0.5rem;
		}

		.panel {
			width: 100%;
			max-height: calc(100dvh - 4.1rem);
		}

		.close {
			top: 0.6rem;
			right: 0.6rem;
		}
	}
</style>
