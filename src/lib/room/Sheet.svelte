<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { spring } from '$lib/directions/motion.js';

	/**
	 * A modal that grows out of the thing that was clicked and shrinks back into it, so opening
	 * an object reads as picking it up rather than as a box appearing over the page.
	 * `origin` is the click point in viewport pixels; `surface` is the panel's material.
	 * @type {{ origin: { x: number, y: number } | null, label: string, width?: string, surface?: string, onclose: () => void, children: import('svelte').Snippet }}
	 */
	let { origin, label, width = '60rem', surface = 'var(--paper)', onclose, children } = $props();

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
	<button
		type="button"
		class="scrim"
		aria-label="Close"
		tabindex="-1"
		onclick={onclose}
		in:fade|global={{ duration: prefersReducedMotion.current ? 0 : 280, easing: cubicOut }}
		out:fade|global={{ duration: prefersReducedMotion.current ? 0 : 240, easing: cubicIn }}
	></button>
	<div
		class="panel"
		role="dialog"
		aria-modal="true"
		aria-label={label}
		tabindex="-1"
		style:--width={width}
		style:--surface={surface}
		{@attach focus}
		in:grow|global={{ duration: 680, easing: spring }}
		out:grow|global={{ duration: 300, easing: cubicIn }}
	>
		<button type="button" class="close" aria-label="Close" onclick={onclose}>
			<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
		</button>
		{@render children()}
	</div>
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

	.scrim {
		position: absolute;
		inset: 0;
		border: 0;
		background: color-mix(in oklab, var(--ink, #1c1b18) 22%, transparent);
		backdrop-filter: blur(10px) saturate(1.1);
		cursor: default;
	}

	.panel {
		position: relative;
		width: min(var(--width), 100%);
		max-height: calc(100dvh - 2rem);
		overflow: auto;
		overscroll-behavior: contain;
		border-radius: 1.4rem;
		background: var(--surface);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.6) inset,
			0 30px 80px -20px rgba(20, 16, 8, 0.45),
			0 8px 24px -8px rgba(20, 16, 8, 0.25);
		outline: none;
		will-change: transform;
	}

	.close {
		position: absolute;
		top: 0.85rem;
		right: 0.85rem;
		z-index: 2;
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: 0;
		border-radius: 50%;
		background: color-mix(in oklab, var(--ink, #1c1b18) 8%, transparent);
		color: var(--ink, #1c1b18);
		cursor: pointer;
		transition:
			background-color 160ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.close:hover {
		background: color-mix(in oklab, var(--ink, #1c1b18) 14%, transparent);
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
</style>
