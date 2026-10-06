<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import Article from '$lib/directions/Article.svelte';
	import { spring } from '$lib/directions/motion.js';
	import '$lib/directions/directions.css';

	/** @type {{ post: { slug?: string, content?: any, meta?: Record<string, any> } | null, onClose: () => void }} */
	let { post, onClose } = $props();

	const meta = $derived(post?.meta ?? {});
	const title = $derived(meta.title ?? post?.slug ?? 'Untitled');
	const kicker = $derived(meta.type === 'blog' ? (meta.series ?? 'Writing') : (meta.type ?? 'Page'));

	/**
	 * Slides the panel in from past the right edge.
	 * @param {Element} node
	 * @param {{ duration: number, easing: (t: number) => number }} params
	 */
	function drawer(node, { duration, easing }) {
		return {
			duration: prefersReducedMotion.current ? 0 : duration,
			easing,
			css: (/** @type {number} */ t, /** @type {number} */ u) => `transform: translate3d(calc(${u} * (100% + 2rem)), 0, 0)`
		};
	}

	function openFullPage() {
		if (post?.slug) goto(resolve(/** @type {any} */ (`/${post.slug}`)));
	}

	/** @param {HTMLElement} node */
	function focus(node) {
		node.focus({ preventScroll: true });
	}

	$effect(() => {
		const html = document.documentElement;
		const previous = html.style.overflow;
		html.style.overflow = 'hidden';
		return () => {
			html.style.overflow = previous;
		};
	});
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && onClose()} />

<!-- Carries the design tokens on pages that aren't inside the directions layout. -->
<div class="dir tokens">
<button
	type="button"
	class="scrim"
	aria-label="Close"
	onclick={onClose}
	in:fade|global={{ duration: prefersReducedMotion.current ? 0 : 320, easing: cubicOut }}
	out:fade|global={{ duration: prefersReducedMotion.current ? 0 : 220, easing: cubicIn }}
></button>

<div
	class="peek"
	role="dialog"
	aria-modal="true"
	aria-label={title}
	tabindex="-1"
	{@attach focus}
	in:drawer|global={{ duration: 680, easing: spring }}
	out:drawer|global={{ duration: 260, easing: cubicIn }}
>
	<header class="bar">
		<button type="button" class="close" onclick={onClose} aria-label="Close">
			<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
		</button>
		<p class="kicker">{kicker}</p>
		<button type="button" class="full" onclick={openFullPage}>Open page ↗</button>
	</header>

	<div class="body">
		<Article {meta} content={post?.content} compact />
	</div>
</div>
</div>

<style>
	.tokens {
		display: contents;
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 110;
		background: rgba(28, 27, 24, 0.3);
		backdrop-filter: blur(4px);
		cursor: default;
	}

	.peek {
		position: fixed;
		top: 0.75rem;
		right: 0.75rem;
		bottom: 0.75rem;
		z-index: 115;
		display: flex;
		flex-direction: column;
		width: min(42rem, calc(100vw - 1.5rem));
		overflow: hidden;
		border-radius: 22px;
		background: var(--te-body);
		box-shadow:
			0 0 0 1px rgba(28, 27, 24, 0.06),
			0 30px 60px -20px rgba(28, 27, 24, 0.45);
		outline: none;
		will-change: transform;
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
		padding: 0.75rem 0.85rem;
		border-bottom: 1px solid var(--rule);
		animation: dir-sfumato 420ms var(--ease-out) 120ms both;
	}

	.kicker {
		flex: 1;
		color: var(--ink-3);
		font-size: 13px;
	}

	.close,
	.full {
		display: inline-grid;
		place-items: center;
		height: 2.1rem;
		border-radius: 999px;
		background: linear-gradient(180deg, #fff, #f4f2ee);
		color: var(--ink);
		font-size: 13px;
		box-shadow:
			inset 0 1px 0 #fff,
			0 0 0 1px rgba(28, 27, 24, 0.08),
			0 6px 14px -8px rgba(28, 27, 24, 0.35);
		transition:
			transform 160ms var(--ease-out),
			color 160ms var(--ease-out);
	}

	.close {
		width: 2.1rem;
	}

	.full {
		padding: 0 0.9rem;
	}

	.close:hover,
	.full:hover {
		color: var(--accent);
	}

	.close:active,
	.full:active {
		transform: scale(0.95);
	}

	.close svg {
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
	}

	.body {
		flex: 1;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 2.5rem clamp(1.25rem, 5vw, 3rem) 6rem;
	}

	/* The text arrives after the panel has mostly landed, one layer at a time. */
	.body :global(.sfumato) {
		animation-duration: 700ms;
		animation-delay: calc(160ms + var(--i, 0) * 90ms);
	}

	@media (max-width: 720px) {
		.peek {
			top: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			border-radius: 0;
		}
	}
</style>
