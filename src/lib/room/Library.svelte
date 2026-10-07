<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Canvas } from '@threlte/core';
	import { NeutralToneMapping } from 'three';
	import Back from './Back.svelte';
	import BookStack from './BookStack.svelte';
	import Explainer from './Explainer.svelte';
	import Heading from './Heading.svelte';
	import { shelfLabel } from './furnishing.js';

	/**
	 * The books in a floating stack at their real sizes, with what's in it listed alongside.
	 * Pointing at a title or a book slides that book out; choosing one stands it up beside the
	 * stack and tells you about it where the list was. Nothing on the page moves to make room:
	 * the books move in their own scene, and the list and the description trade places.
	 * @type {{ books: import('$lib/shelf/layout.js').ItemPiece[], selected?: number | null }}
	 */
	let { books, selected = $bindable(null) } = $props();

	/** @type {number | null} */
	let hovered = $state(null);

	const chosen = $derived(selected === null ? null : (books[selected] ?? null));
	const still = $derived(prefersReducedMotion.current);
	const duration = $derived(still ? 0 : 1);
	const groups = $derived(
		[...new Set(books.map((piece) => piece.shelf))].map((shelf) => ({
			shelf,
			label: shelfLabel(shelf),
			entries: books.flatMap((piece, i) => (piece.shelf === shelf ? [{ piece, i }] : []))
		}))
	);

	/** @param {number} i */
	function choose(i) {
		selected = selected === i ? null : i;
		hovered = null;
	}

	/** @param {number} i @param {boolean} on */
	function point(i, on) {
		hovered = on ? i : hovered === i ? null : hovered;
	}
</script>

<div class="library">
	<div class="stage" style:cursor={hovered === null ? undefined : 'pointer'}>
		<Canvas toneMapping={NeutralToneMapping} dpr={Math.min(devicePixelRatio, 2)}>
			<BookStack {books} {selected} {hovered} {still} onpick={choose} onhover={point} />
		</Canvas>
	</div>

	<div class="side">
		{#key chosen}
			<div
				class="leaf"
				in:fly={{ y: 10, duration: 460 * duration, delay: 200 * duration, easing: cubicOut }}
				out:fade={{ duration: 180 * duration }}
			>
				{#if chosen}
					<Back onclick={() => (selected = null)} />
					<Explainer item={chosen.item} kicker={shelfLabel(chosen.shelf)} action="Read more" />
				{:else}
					<Heading kicker="Read" title="The bookshelf" hint="Stacked at their real sizes. Pick one up." />
					{#each groups as group (group.shelf)}
						<section class="group">
							<p class="label">{group.label}</p>
							<ul>
								{#each group.entries as { piece, i } (piece.key)}
									<li>
										<button
											type="button"
											class={['title', hovered === i && 'on']}
											onclick={() => choose(i)}
											onpointerenter={() => point(i, true)}
											onpointerleave={() => point(i, false)}
											onfocus={() => point(i, true)}
											onblur={() => point(i, false)}
										>
											<span class="name" lang={piece.item.lang}>{piece.item.title}</span>
											{#if piece.item.by}
												<span class="by" lang={piece.item.lang}>{piece.item.by}</span>
											{/if}
										</button>
									</li>
								{/each}
							</ul>
						</section>
					{/each}
				{/if}
			</div>
		{/key}
	</div>
</div>

<style>
	/* Both columns keep one height whatever is showing, so choosing a book never moves the page. */
	.library {
		--tall: clamp(28rem, 68vh, 40rem);
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
		gap: clamp(1rem, 3vw, 2.5rem);
		padding: clamp(1.4rem, 3vw, 2.4rem);
	}

	.stage {
		position: relative;
		height: var(--tall);
		touch-action: pan-y;
		user-select: none;
	}

	.side {
		display: grid;
		height: var(--tall);
		overflow-y: auto;
		scrollbar-width: none;
	}

	.leaf {
		grid-area: 1 / 1;
		display: grid;
		align-content: center;
		justify-items: start;
		gap: 1.1rem;
		min-width: 0;
	}

	.group {
		display: grid;
		gap: 0.3rem;
		width: 100%;
	}

	.label {
		margin: 0;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.64rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	ul {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.title {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding: 0.32rem 0;
		border: 0;
		border-bottom: 1px solid rgba(28, 27, 24, 0.07);
		background: none;
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: color 200ms var(--ease-out);
	}

	.title.on {
		color: var(--accent);
	}

	.title:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.name {
		font-family: var(--serif);
		font-size: 1.08rem;
		line-height: 1.2;
	}

	.by {
		flex: none;
		color: var(--ink-3);
		font-size: 0.74rem;
	}

	[lang='ko'] {
		font-family: var(--korean);
	}

	@media (max-width: 720px) {
		.library {
			--tall: 22rem;
			grid-template-columns: minmax(0, 1fr);
		}

		.side {
			height: auto;
			min-height: 18rem;
			overflow: visible;
		}

		.leaf {
			align-content: start;
		}
	}
</style>
