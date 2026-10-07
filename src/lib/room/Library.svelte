<script>
	import Showcase from './Showcase.svelte';

	/**
	 * The books, spine out and at their real sizes, the way Stripe Press shows its catalog: the
	 * thick ones are thick because they're long. Choosing one turns it to its cover.
	 * @type {{ books: import('$lib/shelf/layout.js').ItemPiece[], selected?: number | null }}
	 */
	let { books, selected = $bindable(null) } = $props();

	/** A length in meters, at the shelf's scale (`--per-meter`). @param {number} meters */
	const real = (meters) => `calc(${meters.toFixed(4)} * var(--per-meter))`;

	/** The author's surname, for the foot of the spine. @param {string} by */
	const surname = (by) => by.split(/\s*&\s*|\s+and\s+/)[0].split(' ').at(-1);
</script>

{#snippet book(/** @type {import('$lib/shelf/layout.js').ItemPiece} */ piece, /** @type {boolean} */ open)}
	{@const item = piece.item}
	<span
		class={['book', open && 'open']}
		style:--tone={item.tone}
		style:--ink={item.ink}
		style:--w={real(piece.w)}
		style:--h={real(piece.h)}
		style:--d={real(piece.d)}
		style:--cover={item.cover ? `url("${item.cover}")` : undefined}
	>
		<span class="box">
			<span class={['face', 'cover', item.cover && 'art']}>
				{#if !item.cover}
					<span class="title" lang={item.lang}>{item.title}</span>
					{#if item.by}
						<span class="by" lang={item.lang}>{item.by}</span>
					{/if}
					{#if item.year}
						<span class="year">{item.year}</span>
					{/if}
				{/if}
			</span>
			<span class="face spine">
				<span class="spine-title" lang={item.lang}>{item.title}</span>
				{#if item.by}
					<span class="spine-by" lang={item.lang}>{surname(item.by)}</span>
				{/if}
			</span>
			<span class="face pages"></span>
			<span class="face back"></span>
		</span>
	</span>
{/snippet}

<Showcase
	pieces={books}
	bind:selected
	kicker="Library"
	title="On the shelf"
	hint="Every book at its real size. Pick one up."
	action="Read more"
	object={book}
/>

<style>
	/*
	 * A 23 cm book stands a little over 18rem tall, or 13rem on a phone. It's drawn without
	 * perspective, and every face's padding is inside its size, so a turned book's spine and
	 * cover stay exactly the same height.
	 */
	.book {
		--per-meter: 80rem;
		--open: 1.12;
		--spine: color-mix(in oklab, var(--tone) 86%, black);
		position: relative;
		display: block;
		width: var(--d);
		height: var(--h);
		transition:
			width 720ms var(--ease-out),
			height 720ms var(--ease-out);
	}

	/* Turned toward you, a book takes up its cover's width less what the angle hides. */
	.book.open {
		width: calc((var(--w) * 0.906 + var(--d) * 0.423) * var(--open) + 1rem);
		height: calc(var(--h) * var(--open));
	}

	.box {
		position: absolute;
		left: calc(50% - var(--w) / 2);
		bottom: 0;
		width: var(--w);
		height: var(--h);
		transform-origin: 50% 100%;
		transform-style: preserve-3d;
		transform: translateZ(calc(var(--w) / -2)) rotateY(90deg);
		transition: transform 720ms var(--ease-out);
	}

	:global(.slot:hover) .book:not(.open) .box {
		transform: translateY(-0.7rem) translateZ(calc(var(--w) / -2)) rotateY(90deg);
	}

	.book.open .box {
		transform: rotateY(25deg) scale(var(--open));
	}

	:global(.slot:focus-visible) .spine {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.face {
		position: absolute;
		box-sizing: border-box;
		backface-visibility: hidden;
		overflow: hidden;
	}

	.cover {
		inset: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1.2rem 1rem 1rem;
		background: var(--tone);
		color: var(--ink);
		text-align: left;
		transform: translateZ(calc(var(--d) / 2));
		box-shadow: inset 5px 0 0 rgba(0, 0, 0, 0.13);
	}

	.cover.art {
		background: var(--cover) center / cover no-repeat, var(--tone);
	}

	.cover::after,
	.spine::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(105deg, rgba(255, 255, 255, 0.2), transparent 45%, rgba(0, 0, 0, 0.14));
		pointer-events: none;
	}

	.title {
		font-family: var(--serif);
		font-size: 1.35rem;
		line-height: 1.02;
		letter-spacing: -0.01em;
		text-wrap: balance;
	}

	.by {
		margin-top: auto;
		font-size: 0.6rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.85;
	}

	.year {
		font-family: var(--mono);
		font-size: 0.6rem;
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
		padding: 0.9rem 0 0.8rem;
		background: var(--spine);
		color: var(--ink);
		transform: rotateY(-90deg) translateZ(calc(var(--w) / 2));
	}

	.spine-title {
		max-height: 76%;
		overflow: hidden;
		writing-mode: vertical-rl;
		font-family: var(--serif);
		font-size: clamp(0.5rem, calc(var(--d) * 0.42), 1.05rem);
		line-height: 1;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.spine-by {
		writing-mode: vertical-rl;
		font-size: clamp(0.4rem, calc(var(--d) * 0.24), 0.56rem);
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

	[lang='ko'] {
		font-family: var(--korean);
	}

	@media (max-width: 640px) {
		.book {
			--per-meter: 58rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.book,
		.box {
			transition: none;
		}
	}
</style>
