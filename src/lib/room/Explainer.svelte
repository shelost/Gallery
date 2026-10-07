<script>
	import { linkProps } from '$lib/directions/links.js';
	import { pageFor } from '$lib/directions/music.js';

	/**
	 * What an object on the shelf is, and a way out to where it lives online.
	 * @type {{ item: import('$lib/directions/content.js').ShelfItem, kicker?: string, action?: string }}
	 */
	let { item, kicker = '', action = 'Read more' } = $props();

	const href = $derived(pageFor(item));
	const byline = $derived([item.by, item.year].filter(Boolean).join(' · '));
</script>

<div class="explainer">
	{#if kicker}
		<p class="kicker">{kicker}</p>
	{/if}
	<h3 lang={item.lang}>{item.title}</h3>
	{#if byline}
		<p class="by" lang={item.lang}>{byline}</p>
	{/if}
	{#if item.note}
		<p class="note">{item.note}</p>
	{/if}
	{#if href}
		<a class="go" {...linkProps(href)}>
			{action}
			<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" /></svg>
		</a>
	{/if}
</div>

<style>
	.explainer {
		display: grid;
		justify-items: start;
		gap: 0.4rem;
		max-width: 34rem;
	}

	.kicker {
		margin: 0;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h3 {
		margin: 0;
		color: var(--ink);
		font-family: var(--serif);
		font-size: clamp(1.3rem, 2.2vw, 1.7rem);
		font-weight: 500;
		line-height: 1.05;
		letter-spacing: -0.03em;
		text-wrap: balance;
	}

	.by {
		margin: 0;
		color: var(--ink-2);
		font-size: 0.82rem;
	}

	.note {
		margin: 0.5rem 0 0;
		color: var(--ink-2);
		font-size: 0.92rem;
		line-height: 1.38;
		text-wrap: pretty;
	}

	.go {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.9rem;
		padding: 0.6rem 1rem 0.6rem 1.1rem;
		border-radius: 999px;
		background: var(--ink);
		color: var(--paper);
		font-size: 0.85rem;
		font-weight: 500;
		text-decoration: none;
		transition:
			background-color 160ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.go:hover {
		background: var(--accent);
	}

	.go:active {
		transform: scale(0.97);
	}

	.go svg {
		width: 0.7rem;
		height: 0.7rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	[lang='ko'] {
		font-family: var(--korean);
	}
</style>
