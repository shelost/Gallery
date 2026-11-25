<script>
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import FloatLabels from './FloatLabels.svelte';
	import { mapView } from './view.svelte.js';
	import { mountWindow } from './window.js';

	/**
	 * One map, opened large over the page. It grows out of the element that opened it and
	 * shrinks back into it on close.
	 * @type {{
	 *   map: import('./window.js').MapSpec,
	 *   source: HTMLElement,
	 *   seed?: HTMLCanvasElement,
	 *   label: string,
	 *   onclose: () => void
	 * }}
	 */
	let { map, source, seed = undefined, label, onclose } = $props();

	const controls = { replay: () => {} };
	/** @type {import('./window.js').Pin[]} */
	let pins = $state.raw([]);

	/**
	 * Fixed-position content inside the essay would sit in the prose's animated layer, so the
	 * dialog lives on the body. Moving it drops focus, so it takes focus after the move, and
	 * Svelte no longer finds it where it was made, so it removes itself.
	 * @param {HTMLElement} node
	 */
	function portal(node) {
		document.body.append(node);
		node.querySelector('[role="dialog"]')?.focus({ preventScroll: true });
		const root = document.documentElement;
		const overflow = root.style.overflow;
		root.style.overflow = 'hidden';
		return () => {
			node.remove();
			root.style.overflow = overflow;
			(source.closest('button') ?? source).focus({ preventScroll: true });
		};
	}

	/**
	 * The frame flies between the opener's box and its own. Measured a microtask late, once the
	 * dialog is on the body and laid out.
	 * @param {HTMLElement} node
	 */
	function zoom(node) {
		return () => {
			const to = node.getBoundingClientRect();
			const at = source.getBoundingClientRect();
			if (prefersReducedMotion.current || !to.width) return { duration: 0 };
			const scale = at.width / to.width;
			const dx = at.left - to.left;
			const dy = at.top - to.top;
			return {
				duration: 480,
				easing: cubicOut,
				css: (/** @type {number} */ t, /** @type {number} */ u) =>
					`transform-origin: 0 0; transform: translate(${dx * u}px, ${dy * u}px) scale(${scale + (1 - scale) * t});`
			};
		};
	}

	const still = $derived(prefersReducedMotion.current);

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (event.key === 'Escape') onclose();
	}
</script>

<svelte:window {onkeydown} />

<div class="modal" {@attach portal}>
	<button
		type="button"
		class="scrim"
		aria-label="Close map"
		onclick={onclose}
		transition:fade={{ duration: still ? 0 : 350 }}
	></button>
	<div
		class="dialog"
		role="dialog"
		aria-modal="true"
		aria-label={label}
		tabindex="-1"
	>
		<div class="frame" transition:zoom>
			{#key mapView.relief}
				<canvas
					{@attach (node) =>
						mountWindow(node, {
							...map,
							seed,
							autoplay: !seed,
							flat: !mapView.relief,
							controls,
							onPins: (next) => {
								pins = next;
							}
						})}
				></canvas>
			{/key}
			<FloatLabels {pins} />
		</div>
		<div class="bar" transition:fade={{ duration: still ? 0 : 260 }}>
			<p>{label}</p>
			<button type="button" onclick={() => controls.replay()}>Replay</button>
			<button type="button" onclick={onclose}>Close</button>
		</div>
	</div>
</div>

<style>
	.modal {
		position: fixed;
		inset: 0;
		z-index: 1200;
		display: grid;
		place-items: center;
		padding: 1rem;
		font-family: var(--font-body);
	}

	.scrim {
		position: absolute;
		inset: 0;
		margin: 0;
		border: 0;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(3px);
		-webkit-backdrop-filter: blur(3px);
		cursor: zoom-out;
	}

	.dialog {
		position: relative;
		display: grid;
		gap: 0.7rem;
		width: min(92vw, calc(100vh - 6.5rem), 64rem);
		outline: none;
	}

	.frame {
		position: relative;
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: 14px;
		background: #9cb7d1;
		box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.6);
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #f3efe6;
	}

	.bar p {
		flex: 1;
		margin: 0;
		color: inherit;
		font-size: 0.9rem;
		line-height: 1.3;
	}

	.bar button {
		padding: 0.4rem 0.85rem;
		border: 1px solid rgba(243, 239, 230, 0.35);
		border-radius: 999px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 0.82rem;
		cursor: pointer;
		transition: background 160ms cubic-bezier(0.22, 0.61, 0.36, 1);
	}

	.bar button:hover {
		background: rgba(243, 239, 230, 0.12);
	}
</style>
