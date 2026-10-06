<script>
	import Media from './Media.svelte';
	import { isExternal, linkProps } from './links.js';

	/**
	 * @type {{
	 *   work: import('./content.js').Work,
	 *   onclose: () => void,
	 *   variant?: 'panels' | 'salon',
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { work, onclose, variant = 'panels', children } = $props();

	const external = $derived(isExternal(work.href));

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (event.key === 'Escape') onclose();
	}
</script>

<svelte:window {onkeydown} />

<div class={['zoom', variant]}>
	<button type="button" class="scrim" aria-label="Close" onclick={onclose}></button>
	<div
		class="sheet"
		role="dialog"
		aria-modal="true"
		aria-label={work.title}
		tabindex="-1"
		style:view-transition-name="zoom"
		{@attach (sheet) => sheet.focus({ preventScroll: true })}
	>
		<div class="figure">
			<Media media={work.media} playing fit="contain" title={work.title} />
		</div>
		<div class="text">
			<p class="kicker">
				{work.kind}{#if work.year}<span> · {work.year}</span>{/if}
			</p>
			<h2>{work.title}</h2>
			<p class="blurb">{work.blurb}</p>
			{@render children?.()}
			{#if work.pages}
				<div class="pages">
					{#each work.pages as src (src)}
						<img {src} alt="" loading="lazy" />
					{/each}
				</div>
			{/if}
			<div class="actions">
				<a class="primary" {...linkProps(work.href)}>
					{external ? 'Visit' : 'Read'}
					<span aria-hidden="true">↗</span>
				</a>
				<button type="button" class="ghost" onclick={onclose}>Close</button>
			</div>
		</div>
	</div>
</div>

<style>
	.zoom {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		padding: clamp(1rem, 4vw, 3rem);
	}

	.scrim {
		position: absolute;
		inset: 0;
		background: rgba(246, 244, 239, 0.82);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		cursor: zoom-out;
		animation: fade 200ms var(--ease-out);
	}

	.sheet {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(16rem, 1fr);
		grid-template-rows: minmax(0, 1fr);
		width: min(64rem, 100%);
		max-height: calc(100vh - 4rem);
		overflow: hidden;
		background: var(--paper);
		outline: none;
	}

	.figure {
		min-height: 22rem;
		--media-bg: var(--paper-2);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		padding: clamp(1.25rem, 3vw, 2.25rem);
		overflow-y: auto;
	}

	.kicker {
		font-size: 12px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	h2 {
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		font-weight: 500;
		line-height: 1.05;
		letter-spacing: -0.04em;
	}

	.blurb {
		color: var(--ink-2);
		max-width: 34ch;
	}

	.pages {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(4.5rem, 1fr));
		gap: 8px;
	}

	.pages img {
		width: 100%;
		aspect-ratio: 0.72;
		object-fit: cover;
		box-shadow: 0 0 0 1px var(--rule);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 1rem;
	}

	.primary,
	.ghost {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.95rem;
		font-size: 13px;
		font-weight: 400;
		transition: transform 120ms var(--ease-out);
	}

	.primary:active,
	.ghost:active {
		transform: scale(0.97);
	}

	.primary {
		background: var(--ink);
		color: var(--paper);
	}

	.primary:hover {
		color: var(--paper);
	}

	.ghost {
		color: var(--ink-2);
		box-shadow: inset 0 0 0 1px var(--rule);
	}

	/* Panels: an inked panel with a caption box. */
	.panels .sheet {
		border: 2px solid var(--ink);
		box-shadow: 8px 8px 0 var(--ink);
	}

	.panels .figure {
		border-right: 2px solid var(--ink);
	}

	.panels .kicker {
		align-self: flex-start;
		padding: 0.2rem 0.5rem;
		border: 1.5px solid var(--ink);
		color: var(--ink);
		background: var(--paper);
	}

	.panels .primary,
	.panels .ghost {
		border-radius: 0;
	}

	.panels .pages img {
		box-shadow: 0 0 0 1.5px var(--ink);
	}

	/* Salon: a matted frame with a museum label. */
	.salon .sheet {
		background: #fbfaf7;
		box-shadow: 0 30px 80px rgba(40, 30, 18, 0.18);
	}

	.salon .figure {
		margin: 1.25rem 0 1.25rem 1.25rem;
		box-shadow:
			0 0 0 1px rgba(120, 92, 56, 0.55),
			0 0 0 6px #fbfaf7,
			0 0 0 7px rgba(120, 92, 56, 0.25);
	}

	.salon h2 {
		font-family: var(--serif);
		font-weight: 400;
		font-style: italic;
		letter-spacing: -0.01em;
	}

	.salon .primary,
	.salon .ghost {
		border-radius: 999px;
	}

	.salon .pages {
		gap: 12px;
	}

	.salon .pages img {
		box-shadow:
			0 0 0 4px #fff,
			0 0 0 5px rgba(120, 92, 56, 0.35);
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	@media (max-width: 760px) {
		.sheet {
			grid-template-columns: 1fr;
			grid-template-rows: none;
			overflow-y: auto;
		}

		.figure {
			min-height: 14rem;
			aspect-ratio: 4 / 3;
		}

		.panels .figure {
			border-right: 0;
			border-bottom: 2px solid var(--ink);
		}

		.salon .figure {
			margin: 1rem 1rem 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scrim {
			animation: none;
		}
	}
</style>
