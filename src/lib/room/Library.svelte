<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Explainer from './Explainer.svelte';

	/**
	 * The books spine-out on a shelf, the way Stripe Press shelves its catalog. Pulling one out
	 * turns it to its cover and opens room for it in the row; the explainer comes up beneath.
	 * @type {{ books: import('$lib/directions/content.js').ShelfItem[], selected?: number | null }}
	 */
	let { books, selected = $bindable(null) } = $props();

	const book = $derived(selected === null ? null : books[selected]);

	/** @param {number} i */
	function choose(i) {
		selected = selected === i ? null : i;
	}
</script>

<div class="library">
	<header>
		<p class="kicker">Library</p>
		<h2>On the shelf</h2>
		<p class="hint">{book ? 'Pick another, or the same one to put it back.' : 'Pull a book off the shelf.'}</p>
	</header>

	<div class="shelf">
		<div class="row">
			{#each books as item, i (item.title)}
				<button
					type="button"
					class={['book', selected === i && 'open']}
					style:--tone={item.tone}
					style:--ink={item.ink}
					style:--d={item.depth ?? '1.7rem'}
					aria-pressed={selected === i}
					aria-label={item.title}
					onclick={() => choose(i)}
				>
					<span class="box">
						<span class="face cover">
							<span class="title" lang={item.lang}>{item.title}</span>
							{#if item.by}
								<span class="by" lang={item.lang}>{item.by}</span>
							{/if}
							{#if item.year}
								<span class="year">{item.year}</span>
							{/if}
						</span>
						<span class="face spine">
							<span class="spine-title" lang={item.lang}>{item.title}</span>
							{#if item.by}
								<span class="spine-by" lang={item.lang}>{item.by.split(/\s*&\s*|\s+and\s+/)[0].split(' ').at(-1)}</span>
							{/if}
						</span>
						<span class="face pages"></span>
						<span class="face back"></span>
					</span>
				</button>
			{/each}
		</div>
		<div class="plank" aria-hidden="true"></div>
	</div>

	<div class="detail" aria-live="polite">
		{#if book}
			{#key book}
				<div in:fly={{ y: 14, duration: prefersReducedMotion.current ? 0 : 420, delay: 160, easing: cubicOut }}>
					<Explainer item={book} kicker="Book" />
				</div>
			{/key}
		{/if}
	</div>
</div>

<style>
	.library {
		display: grid;
		gap: 1.6rem;
		padding: clamp(1.4rem, 3vw, 2.4rem);
	}

	header {
		display: grid;
		gap: 0.2rem;
	}

	.kicker {
		margin: 0;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-family: var(--serif);
		font-size: 1.6rem;
		font-weight: 400;
	}

	.hint {
		margin: 0;
		color: var(--ink-3);
		font-size: 0.85rem;
	}

	.shelf {
		overflow-x: auto;
		overflow-y: hidden;
		padding: 1.4rem 0.4rem 0;
		scrollbar-width: none;
	}

	.row {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 0.2rem;
		width: max-content;
		min-width: 100%;
		padding: 0 1rem;
	}

	/* A shelf board: a lit front edge over a soft shadow on the wall behind. */
	.plank {
		height: 0.8rem;
		margin-top: -1px;
		border-radius: 2px;
		background: linear-gradient(to bottom, #e9dcc6 0 30%, #d8c6a6 30% 100%);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.5) inset,
			0 14px 22px -10px rgba(40, 28, 10, 0.4);
	}

	.book {
		--w: 9.2rem;
		--h: 13.6rem;
		--spine: color-mix(in oklab, var(--tone) 86%, black);
		position: relative;
		flex: none;
		width: var(--d);
		height: var(--h);
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		perspective: 1800px;
		transition: width 720ms var(--ease-out);
	}

	/* Turned toward you, a book takes up its cover's width less what the angle hides. */
	.book.open {
		width: calc(var(--w) * 0.906 + var(--d) * 0.423 + 0.6rem);
	}

	.box {
		position: absolute;
		left: calc(50% - var(--w) / 2);
		bottom: 0;
		width: var(--w);
		height: var(--h);
		transform-style: preserve-3d;
		transform: rotateY(90deg);
		transition: transform 720ms var(--ease-out);
	}

	.book:hover:not(.open) .box {
		transform: translateY(-0.6rem) rotateY(90deg);
	}

	.book.open .box {
		transform: translateY(-0.4rem) rotateY(25deg);
	}

	.book:focus-visible {
		outline: none;
	}

	.book:focus-visible .spine {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.face {
		position: absolute;
		backface-visibility: hidden;
		overflow: hidden;
	}

	.cover {
		inset: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1.1rem 0.95rem 0.95rem;
		background: var(--tone);
		color: var(--ink);
		text-align: left;
		transform: translateZ(calc(var(--d) / 2));
		box-shadow: inset 5px 0 0 rgba(0, 0, 0, 0.13);
	}

	.cover::after,
	.spine::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(105deg, rgba(255, 255, 255, 0.18), transparent 45%, rgba(0, 0, 0, 0.12));
		pointer-events: none;
	}

	.title {
		font-family: var(--serif);
		font-size: 1.15rem;
		line-height: 1.02;
		letter-spacing: -0.01em;
		text-wrap: balance;
	}

	.by {
		margin-top: auto;
		font-size: 0.56rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.85;
	}

	.year {
		font-family: var(--mono);
		font-size: 0.56rem;
		opacity: 0.7;
	}

	.spine {
		top: 0;
		left: calc(50% - var(--d) / 2);
		width: var(--d);
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		padding: 0.8rem 0 0.7rem;
		background: var(--spine);
		color: var(--ink);
		transform: rotateY(-90deg) translateZ(calc(var(--w) / 2));
	}

	.spine-title {
		max-height: 78%;
		overflow: hidden;
		writing-mode: vertical-rl;
		font-family: var(--serif);
		font-size: clamp(0.62rem, calc(var(--d) * 0.4), 0.9rem);
		line-height: 1;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.spine-by {
		writing-mode: vertical-rl;
		font-size: 0.5rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.8;
	}

	.pages {
		left: 0;
		top: calc(50% - var(--d) / 2);
		width: 100%;
		height: var(--d);
		background: repeating-linear-gradient(90deg, #f4efe2 0 1px, #e6dfcd 1px 2px);
		transform: rotateX(90deg) translateZ(calc(var(--h) / 2));
	}

	.back {
		inset: 0;
		background: var(--spine);
		transform: rotateY(180deg) translateZ(calc(var(--d) / 2));
	}

	.detail {
		min-height: 13rem;
		padding: 0 0.4rem;
	}

	[lang='ko'] {
		font-family: var(--korean);
	}

	@media (prefers-reduced-motion: reduce) {
		.book,
		.box {
			transition: none;
		}
	}
</style>
