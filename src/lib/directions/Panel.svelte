<script>
	import ActionLines from './ActionLines.svelte';
	import Media from './Media.svelte';
	import { hash } from './motion.js';

	/**
	 * An inked comic panel. Given a work it's a button: screentone follows the cursor and a click
	 * zooms the work open. A comic's `pages` stack up behind its cover and fan out from under it
	 * when it's lit, spaced so any number of them spans the same width; `lines` inks focus lines
	 * in around the art while it's lit. Without a work it's a plain frame for lettering or a live
	 * graphic.
	 * @type {{
	 *   work?: import('./content.js').Work,
	 *   zoom?: import('./zoom.svelte.js').Zoom,
	 *   tile?: string,
	 *   area?: string,
	 *   caption?: string,
	 *   narration?: string,
	 *   media?: import('./content.js').Media | null,
	 *   pages?: string[],
	 *   fit?: 'cover' | 'contain',
	 *   playing?: boolean,
	 *   lit?: boolean,
	 *   lines?: boolean,
	 *   reveal?: boolean,
	 *   onhover?: (id: string, hovering: boolean) => void,
	 *   class?: import('svelte/elements').ClassValue,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let {
		work,
		zoom,
		tile,
		area,
		caption,
		narration,
		media,
		pages = [],
		fit,
		playing,
		lit = false,
		lines = false,
		reveal = true,
		onhover,
		class: className,
		children
	} = $props();

	const key = $derived(tile ?? work?.id ?? '');
	/** Up to six pages peek out from behind the cover, deepest first so each paints over the one behind it. */
	const sheets = $derived(
		pages
			.slice(1, 7)
			.map((src, i) => ({ src, depth: i + 1 }))
			.reverse()
	);

	/** @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function tone(event) {
		const rect = event.currentTarget.getBoundingClientRect();
		event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
		event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
	}
</script>

{#snippet lettering()}
	{#if narration}
		<span class="narration">{narration}</span>
	{/if}
{/snippet}

{#if work}
	<button
		type="button"
		class={['panel', 'work', sheets.length > 0 && 'stack', lit && 'lit', reveal && 'reveal', className]}
		style:--area={area}
		style:--sheets={sheets.length}
		style:view-transition-name={zoom?.tileName(key)}
		aria-label="Open {work.title}"
		onclick={() => zoom?.show(work.id, key)}
		onpointerenter={() => onhover?.(work.id, true)}
		onpointerleave={() => onhover?.(work.id, false)}
		onfocus={() => onhover?.(work.id, true)}
		onblur={() => onhover?.(work.id, false)}
		onpointermove={tone}
	>
		{#each sheets as sheet (sheet.src)}
			<img
				class="sheet"
				style:--depth={sheet.depth}
				src={sheet.src}
				alt=""
				loading="lazy"
				decoding="async"
				draggable="false"
			/>
		{/each}
		<div class="art">
			<Media media={media === undefined ? work.media : media} {fit} {playing} title={work.title} />
		</div>
		{#if lines}
			<ActionLines active={lit} seed={hash(key)} count={48} inner={290} />
		{/if}
		{@render children?.()}
		{@render lettering()}
		<span class="caption">{caption ?? work.title}</span>
		{#if sheets.length > 0}
			<span class="count">{pages.length} pages</span>
		{/if}
	</button>
{:else}
	<div class={['panel', reveal && 'reveal', className]} style:--area={area}>
		{@render children?.()}
		{@render lettering()}
		{#if caption}
			<span class="caption">{caption}</span>
		{/if}
	</div>
{/if}

<style>
	.panel {
		--inset-x: var(--inset, 10px);
		position: relative;
		grid-area: var(--area);
		display: block;
		min-width: 0;
		overflow: hidden;
		background: var(--paper);
		border: var(--line, 2px) solid var(--ink);
		text-align: left;
	}

	.work {
		cursor: zoom-in;
	}

	.text {
		display: grid;
		place-items: center;
	}

	.art {
		position: absolute;
		inset: 0;
		--media-bg: var(--paper);
		--graph-fill: var(--paper);
	}

	.work::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image: radial-gradient(var(--ink) 0.8px, transparent 1.15px);
		background-size: 5px 5px;
		opacity: 0;
		transition: opacity 180ms var(--ease-out);
		-webkit-mask-image: radial-gradient(circle 9rem at var(--mx, 50%) var(--my, 50%), #000, transparent);
		mask-image: radial-gradient(circle 9rem at var(--mx, 50%) var(--my, 50%), #000, transparent);
	}

	.work:hover::after {
		opacity: 0.2;
	}

	/* A comic: its cover lies on the next few pages, which fan out from under it when it's lit
	   while the cover lifts on its spine. */
	.stack {
		overflow: visible;
		background: none;
		border: 0;
		perspective: 1200px;
	}

	.stack::after {
		content: none;
	}

	.stack .art,
	.sheet {
		inset: 5% auto auto 0;
		width: auto;
		height: 90%;
		aspect-ratio: 0.72;
		border: var(--line, 2px) solid var(--ink);
		background: var(--paper);
		transform-origin: 0 50%;
		transition:
			transform 440ms var(--ease-out),
			box-shadow 440ms var(--ease-out);
	}

	/* Three sheets set the spacing; more of them share the same spread. */
	.sheet {
		--step: calc(var(--depth) * 3 / max(var(--sheets), 3));
		position: absolute;
		object-fit: cover;
		transform: translate(calc(var(--step) * 7%), calc(var(--step) * -2%))
			rotate(calc(var(--step) * 1.3deg));
		transition-delay: calc(var(--depth) * 30ms);
	}

	.stack:hover .sheet,
	.stack:focus-visible .sheet,
	.stack.lit .sheet {
		transform: translate(calc(var(--step) * 19%), calc(var(--step) * -1%))
			rotate(calc(var(--step) * 3.2deg));
	}

	.stack:hover .art,
	.stack:focus-visible .art,
	.stack.lit .art {
		transform: translateX(-3%) rotateY(-18deg);
		box-shadow: 18px 0 24px -16px rgba(28, 27, 24, 0.5);
	}

	.stack .caption {
		bottom: calc(5% + var(--inset-x));
	}

	.count {
		position: absolute;
		right: 0;
		bottom: 5%;
		z-index: 1;
		padding: 0.2rem 0.45rem;
		background: var(--ink);
		color: var(--paper);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		pointer-events: none;
	}

	/* Lettering: the caption, narration boxes, and balloons inside any panel. */
	.caption,
	.panel :global(.box) {
		position: absolute;
		left: var(--inset-x);
		bottom: var(--inset-x);
		z-index: 1;
		max-width: calc(100% - 2 * var(--inset-x));
		padding: 0.3rem 0.55rem 0.35rem;
		background: var(--paper);
		border: 1.5px solid var(--ink);
		font-size: 12.5px;
		line-height: 1.35;
		color: var(--ink);
	}

	.caption {
		pointer-events: none;
		transition:
			background-color 150ms var(--ease-out),
			color 150ms var(--ease-out);
	}

	.lit .caption {
		background: var(--ink);
		color: var(--paper);
	}

	.korean .caption {
		font-family: var(--sans), var(--korean);
	}

	.narration {
		position: absolute;
		top: var(--inset-x);
		left: var(--inset-x);
		z-index: 1;
		max-width: min(16rem, calc(100% - 2 * var(--inset-x)));
		padding: 0.25rem 0.55rem 0.3rem;
		background: var(--paper-2);
		border: 1.5px solid var(--ink);
		font-family: var(--serif);
		font-size: 15px;
		font-style: italic;
		line-height: 1.2;
		color: var(--ink);
		pointer-events: none;
	}

	.panel :global(.big) {
		font-family: var(--serif);
		font-size: clamp(5rem, 11vw, 9rem);
		line-height: 1;
		margin-top: -1.5rem;
	}

	.panel :global(.sfx) {
		position: relative;
		font-family: var(--serif);
		font-size: clamp(2.6rem, 5vw, 4rem);
		font-style: italic;
		line-height: 1;
		color: var(--sanguine);
		margin-top: -1.25rem;
		transform: rotate(-4deg);
	}

	.panel :global(.balloon) {
		position: absolute;
		top: 1.5rem;
		left: 1.5rem;
		z-index: 1;
		max-width: 15.5rem;
		padding: 1rem 1.25rem;
		background: var(--paper);
		border: var(--line, 2px) solid var(--ink);
		border-radius: 50%;
		font-size: 17px;
		line-height: 1.35;
		text-align: center;
	}

	.panel :global(.balloon)::after {
		content: '';
		position: absolute;
		right: 14%;
		bottom: -18px;
		width: 22px;
		height: 22px;
		background: var(--paper);
		border-right: var(--line, 2px) solid var(--ink);
		border-bottom: var(--line, 2px) solid var(--ink);
		transform: skewX(-38deg) rotate(28deg);
	}

	.panel :global(.balloon a) {
		color: var(--sanguine);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}

	.panel :global(.balloon.small) {
		top: 1rem;
		left: 1rem;
		max-width: 13rem;
		padding: 0.7rem 1rem;
		font-size: 13px;
	}

	.panel :global(.balloon.small a) {
		color: var(--ink);
		word-break: break-all;
	}

	@supports (animation-timeline: view()) {
		.reveal {
			animation: wipe linear both;
			animation-timeline: view();
			animation-range: entry 0% entry 45%;
		}
	}

	@keyframes wipe {
		from {
			clip-path: inset(0 0 100% 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal {
			animation: none;
		}

		.stack .art,
		.sheet {
			transition: none;
		}
	}
</style>
