<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Back from './Back.svelte';
	import Explainer from './Explainer.svelte';
	import Heading from './Heading.svelte';
	import { shelfLabel } from './furnishing.js';

	/** @typedef {import('$lib/shelf/layout.js').ItemPiece} ItemPiece */

	/**
	 * A row of things off one shelf, the way Stripe Press lays out its catalog. Choosing one sends
	 * the others away; it glides over to the left and turns to show its cover, and what it is
	 * comes up on the right. Choosing it again, Back, or anywhere off it and its description puts
	 * everything back in the row. Without a `title` there's no heading, only Back once one is
	 * chosen. `object` draws a piece, told whether it's the one chosen.
	 * @type {{
	 *   pieces: ItemPiece[],
	 *   selected?: number | null,
	 *   kicker?: string,
	 *   title?: string,
	 *   hint?: string,
	 *   action?: string,
	 *   object: import('svelte').Snippet<[ItemPiece, boolean]>
	 * }}
	 */
	let { pieces, selected = $bindable(null), kicker = '', title = '', hint = '', action = 'Find out more', object } = $props();

	const chosen = $derived(selected === null ? null : (pieces[selected] ?? null));
	const shown = $derived(chosen ? [chosen] : pieces);
	const duration = $derived(prefersReducedMotion.current ? 0 : 1);

	/** @param {number} i */
	function choose(i) {
		selected = selected === i ? null : i;
	}

	/**
	 * Slides a piece from where it was to where it is now, without stretching it on the way.
	 * @param {HTMLElement} node
	 * @param {{ from: DOMRect, to: DOMRect }} rects
	 */
	function glide(node, { from, to }) {
		const dx = from.left - to.left;
		const dy = from.bottom - to.bottom;
		return {
			duration: 680 * duration,
			easing: cubicOut,
			css: (/** @type {number} */ _t, /** @type {number} */ u) => `transform: translate(${u * dx}px, ${u * dy}px)`
		};
	}

	/**
	 * With one chosen, a click anywhere that isn't on it, its description, or a button puts them
	 * all back. Keyboard users have Back for the same thing.
	 * @param {HTMLElement} node
	 */
	function dismiss(node) {
		/** @param {MouseEvent} event */
		const click = (event) => {
			if (selected === null || !(event.target instanceof Element)) return;
			if (event.target.closest('.slot, .detail, button, a')) return;
			selected = null;
		};
		node.addEventListener('click', click);
		return () => node.removeEventListener('click', click);
	}
</script>

<div class={['showcase', chosen && 'chosen', !title && 'bare']} {@attach dismiss}>
	{#if title}
		{#if chosen}
			<Heading {kicker} {title}>
				<Back onclick={() => (selected = null)} />
			</Heading>
		{:else}
			<Heading {kicker} {title} {hint} />
		{/if}
	{:else if chosen}
		<div class="top"><Back onclick={() => (selected = null)} /></div>
	{/if}

	<div class="stage">
		<div class="row">
			{#each shown as piece (piece.key)}
				{@const i = pieces.indexOf(piece)}
				<button
					type="button"
					class="slot"
					aria-pressed={selected === i}
					aria-label={[piece.item.title, piece.item.by].filter(Boolean).join(', ')}
					onclick={() => choose(i)}
					animate:glide
					in:fade={{ duration: 260 * duration, delay: 160 * duration }}
					out:fade={{ duration: 220 * duration }}
				>
					{@render object(piece, selected === i)}
				</button>
			{/each}
		</div>

		{#if chosen}
			{#key chosen}
				<div class="detail" in:fly={{ x: 28, duration: 520 * duration, delay: 260 * duration, easing: cubicOut }}>
					<Explainer item={chosen.item} kicker={shelfLabel(chosen.shelf)} {action} />
				</div>
			{/key}
		{/if}
	</div>
</div>

<style>
	.showcase {
		display: grid;
		gap: 1.4rem;
		padding: clamp(1.4rem, 3vw, 2.4rem);
	}

	/* Without a heading, Back sits where the heading would, and nothing moves when it appears. */
	.top {
		position: absolute;
		top: clamp(1.4rem, 3vw, 2.4rem);
		left: clamp(1.4rem, 3vw, 2.4rem);
	}

	.bare {
		position: relative;
		padding-top: clamp(2.6rem, 5vw, 3.6rem);
	}

	.stage {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: center;
		gap: clamp(1.5rem, 4vw, 3.5rem);
		height: 24rem;
	}

	/* The stage keeps its height whatever is chosen, so a long note is cut short rather than growing it. */
	.detail :global(.note) {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 7;
		line-clamp: 7;
	}

	.chosen .stage {
		grid-template-columns: auto minmax(0, 1fr);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: center;
		gap: 1.6rem 0.3rem;
		padding: 1.5rem 0.5rem 0.5rem;
	}

	.chosen .row {
		justify-content: flex-start;
		padding-left: clamp(0.5rem, 3vw, 2.5rem);
	}

	.slot {
		position: relative;
		flex: none;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		cursor: pointer;
	}

	.slot:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
		border-radius: 4px;
	}

	.detail {
		min-width: 0;
	}

	@media (max-width: 720px) {
		.chosen .stage {
			grid-template-columns: minmax(0, 1fr);
		}

		.chosen .row {
			justify-content: center;
			padding-left: 0.5rem;
		}
	}

	/* A phone holds one row, swiped along edge to edge like a shelf, instead of a tall wrapped stack. */
	@media (max-width: 640px) {
		.stage {
			height: auto;
		}

		.row {
			flex-wrap: nowrap;
			justify-content: flex-start;
			margin-inline: -1.4rem;
			padding-inline: 1.4rem;
			overflow-x: auto;
			overscroll-behavior-x: contain;
			scroll-snap-type: x proximity;
			scrollbar-width: none;
		}

		.row::-webkit-scrollbar {
			display: none;
		}

		.chosen .row {
			padding-left: 1.4rem;
		}

		.slot {
			scroll-snap-align: start;
			scroll-margin-inline: 1.4rem;
		}
	}
</style>
