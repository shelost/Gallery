<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Explainer from './Explainer.svelte';
	import Heading from './Heading.svelte';
	import { shelfLabel } from './furnishing.js';

	/** @typedef {import('$lib/shelf/layout.js').ItemPiece} ItemPiece */

	/**
	 * A row of things off one shelf, the way Stripe Press lays out its catalog. Choosing one sends
	 * the others away; it glides over to the left and turns to show its cover, and what it is
	 * comes up on the right. Choosing it again, or Back, puts everything back in the row.
	 * `object` draws a piece, told whether it's the one chosen.
	 * @type {{
	 *   pieces: ItemPiece[],
	 *   selected?: number | null,
	 *   kicker: string,
	 *   title: string,
	 *   hint: string,
	 *   action?: string,
	 *   object: import('svelte').Snippet<[ItemPiece, boolean]>
	 * }}
	 */
	let { pieces, selected = $bindable(null), kicker, title, hint, action = 'Find out more', object } = $props();

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
</script>

<div class={['showcase', chosen && 'chosen']}>
	{#if chosen}
		<Heading {kicker} {title}>
			<button type="button" class="back" onclick={() => (selected = null)}>
				<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5" /></svg>
				All of them
			</button>
		</Heading>
	{:else}
		<Heading {kicker} {title} {hint} />
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

	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		color: var(--ink-2);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.back:hover {
		color: var(--accent);
	}

	.back svg {
		width: 0.75rem;
		height: 0.75rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.stage {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: center;
		gap: clamp(1.5rem, 4vw, 3.5rem);
		min-height: 24rem;
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
			min-height: 0;
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
