<script>
	import { formatDate } from '$lib/utils';
	import Tag from './Tag.svelte';

	/**
	 * A post's header and markdown body, shared by its own page and the peek drawer.
	 * @type {{
	 *   meta?: Record<string, any>,
	 *   content?: import('svelte').Component | null,
	 *   attach?: (root: HTMLElement) => void | (() => void),
	 *   compact?: boolean
	 * }}
	 */
	let { meta = {}, content: Content = null, attach, compact = false } = $props();

	const blog = $derived(meta.type === 'blog');
	const blurb = $derived.by(() => {
		if (blog) return meta.blurb || meta.description;
		// Outside the blog the description is a type label ("Article"), so a subtitle replaces it.
		return meta.subtitle ? null : meta.description;
	});

	/** Once the markdown is in the page: fix its image paths, caption them, then hand over. @param {HTMLElement} root */
	function prepare(root) {
		rootImages(root);
		captionImages(root);
		return attach?.(root);
	}

	/** Posts write `blog/x.png`, which only resolves from a top-level route. @param {HTMLElement} root */
	function rootImages(root) {
		for (const img of root.querySelectorAll('img')) {
			const src = img.getAttribute('src') ?? '';
			if (src && !/^(\/|[a-z]+:)/i.test(src)) img.setAttribute('src', `/${src}`);
		}
	}

	/** Titled images become figures with their title as the caption. @param {HTMLElement} root */
	function captionImages(root) {
		for (const img of root.querySelectorAll('img[title]')) {
			if (img.parentElement?.tagName === 'FIGURE') continue;
			const figure = document.createElement('figure');
			const caption = document.createElement('figcaption');
			caption.textContent = img.getAttribute('title');
			img.setAttribute('loading', 'lazy');
			img.before(figure);
			figure.append(img, caption);
		}
	}
</script>

<header class={['head sfumato', compact && 'compact']} style:--i={1}>
	{#if meta.banner && blog}
		<img class="banner" src="/blog/{meta.banner}.png" alt="" />
	{/if}
	<h1>{meta.title}</h1>
	{#if meta.subtitle}<p class="subtitle">{meta.subtitle}</p>{/if}
	{#if blurb}<p class="blurb">{blurb}</p>{/if}
	{#if blog}
		<p class="byline">
			<img src="/heewon9.png" alt="" width="20" height="20" />
			<span class="author">Heewon Ahn</span>
			{#if meta.date}<span>·</span><time datetime={meta.date}>{formatDate(meta.date)}</time>{/if}
			{#if meta.ai}<Tag label="AI Assisted" />{/if}
		</p>
	{/if}
</header>

{#if Content}
	<div class={['prose sfumato', compact && 'compact']} style:--i={2} {@attach prepare}>
		<Content />
	</div>
{:else}
	<p class="missing">This page could not be loaded.</p>
{/if}

<style>
	.head {
		margin-bottom: 3.5rem;
	}

	.head.compact {
		margin-bottom: 2.5rem;
	}

	.banner {
		width: 100%;
		margin-bottom: 2rem;
		border-radius: 14px;
		box-shadow:
			0 0 0 1px var(--rule),
			0 18px 32px -20px rgba(28, 27, 24, 0.35);
	}

	h1 {
		color: var(--ink);
		font-size: clamp(2.1rem, 5vw, 2.75rem);
		font-weight: 550;
		line-height: 1.02;
		letter-spacing: -0.045em;
		text-wrap: balance;
	}

	.compact h1 {
		font-size: clamp(1.75rem, 4vw, 2.25rem);
	}

	.subtitle {
		margin-top: 0.6rem;
		color: var(--ink-2);
		font-size: clamp(1.3rem, 3.2vw, 1.6rem);
		font-weight: 500;
		line-height: 1.12;
		letter-spacing: -0.035em;
		text-wrap: balance;
	}

	.compact .subtitle {
		font-size: clamp(1.15rem, 2.6vw, 1.35rem);
	}

	.blurb {
		margin-top: 1rem;
		color: var(--ink-2);
		font-size: 17px;
		font-weight: 500;
		line-height: 1.3;
		letter-spacing: -0.02em;
		text-wrap: pretty;
	}

	.byline {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1.5rem;
		color: var(--ink-3);
		font-size: 13px;
	}

	.byline img {
		width: 20px;
		height: 20px;
		border-radius: 50%;
	}

	.author {
		color: var(--ink);
	}

	.missing {
		color: var(--ink-3);
	}

	/* The markdown, retuned to the main page's voice. */
	.prose {
		margin: 0;
		color: var(--ink-2);
		font-family: var(--sans);
		font-size: 16px;
		font-weight: 300;
		line-height: 1.6;
		letter-spacing: -0.015em;
	}

	.prose.compact {
		font-size: 15.5px;
	}

	.prose :global(:is(p, li, blockquote p)) {
		margin: 1.25em 0;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		line-height: inherit;
	}

	.prose :global(li) {
		margin: 0.35em 0;
	}

	.prose :global(ul) {
		padding-inline-start: 1.25rem;
		list-style: disc;
	}

	.prose :global(ol) {
		padding-inline-start: 1.25rem;
		list-style: decimal;
	}

	.prose :global(li::marker) {
		color: var(--ink-3);
	}

	.prose :global(:is(h1, h2, h3, h4)) {
		display: block;
		padding: 0;
		color: var(--ink);
		font-family: var(--sans);
		text-shadow: none;
		scroll-margin-top: 2rem;
		text-wrap: balance;
	}

	.prose :global(h1::after) {
		content: none;
	}

	.prose :global(h1) {
		margin: 4rem 0 1.25rem;
		font-size: 28px;
		font-weight: 550;
		letter-spacing: -0.035em;
		line-height: 1.1;
	}

	.prose :global(h2) {
		margin: 3rem 0 1rem;
		font-size: 21px;
		font-weight: 550;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.prose :global(:is(h3, h4)) {
		margin: 2.25rem 0 0.75rem;
		font-size: 17px;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	.prose :global(:is(b, strong)) {
		color: var(--ink);
		font-weight: 500 !important;
	}

	.prose :global(a) {
		color: var(--ink);
		font-family: inherit;
		font-weight: inherit;
		border: 0;
		text-decoration: underline;
		text-decoration-color: color-mix(in srgb, var(--accent), transparent 55%);
		text-decoration-thickness: 1.5px;
		text-underline-offset: 3px;
		transition:
			color 160ms var(--ease-out),
			text-decoration-color 160ms var(--ease-out);
	}

	.prose :global(a:hover) {
		background: none;
		color: var(--accent);
		text-decoration-color: var(--accent);
	}

	.prose :global(blockquote) {
		width: auto;
		margin: 2.5rem 0;
		padding: 0 0 0 1.25rem;
		border-left: 2px solid var(--accent);
		color: var(--ink);
		letter-spacing: inherit;
	}

	.prose :global(code) {
		margin: 0 1px;
		padding: 1px 5px;
		border-radius: 5px;
		background: rgba(28, 27, 24, 0.06);
		font-family: var(--mono);
		font-size: 13.5px;
		font-weight: 400;
	}

	.prose :global(.shiki) {
		margin: 1.75rem 0;
		padding: 1rem 1.25rem;
		border-radius: 14px;
		box-shadow:
			0 0 0 1px var(--rule),
			0 18px 32px -22px rgba(28, 27, 24, 0.45);
	}

	.prose :global(.shiki code) {
		padding: 0;
		background: none;
	}

	.prose :global(img) {
		width: 100%;
		height: auto;
		margin: 1.75rem 0;
		border: 0;
		border-radius: 14px;
		box-shadow:
			0 0 0 1px var(--rule),
			0 18px 32px -22px rgba(28, 27, 24, 0.4);
	}

	.prose :global(figure) {
		margin: 2.25rem 0;
	}

	.prose :global(figure img) {
		margin: 0;
	}

	.prose :global(figcaption) {
		margin-top: 0.75rem;
		color: var(--ink-3);
		font-size: 13px;
		line-height: 1.4;
		text-align: center;
		text-wrap: pretty;
	}

	.prose :global(iframe) {
		margin: 2rem 0;
		border: 0;
		border-radius: 14px;
	}

	.prose :global(hr) {
		margin: 3rem 0;
		border: 0;
		border-top: 1px solid var(--rule);
	}
</style>
