<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import Article from '$lib/directions/Article.svelte';

	type Heading = { id: string; text: string; level: number };

	let { data } = $props();

	const scrollKey = $derived(`scroll-${data.slug}`);
	const headline = $derived(
		data.meta?.subtitle ? `${data.meta.title}: ${data.meta.subtitle}` : data.meta?.title
	);

	let headings = $state.raw<Heading[]>([]);
	let activeId = $state('');
	let tocOpen = $state(false);

	/** Set while a contents click scrolls the page, so the headings it passes don't steal the mark. */
	let jumping = false;
	let settle: ReturnType<typeof setTimeout> | undefined;

	function saveScroll() {
		sessionStorage.setItem(scrollKey, String(window.scrollY));
	}

	beforeNavigate(saveScroll);

	/** @param text Heading text, made into an id no other element on the page uses yet. */
	function uniqueId(text: string) {
		const base = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/--+/g, '-')
			.trim();
		let id = base;
		for (let n = 1; document.getElementById(id); n++) id = `${base}-${n}`;
		return id;
	}

	function collectHeadings(root: HTMLElement) {
		const elements = [...root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')];
		for (const element of elements) element.id ||= uniqueId(element.textContent ?? '');
		const found = elements.map((element) => ({
			id: element.id,
			text: element.textContent ?? '',
			level: Number(element.tagName.slice(1))
		}));
		headings = found;
		activeId = found[0]?.id ?? '';
		return elements;
	}

	/** Once the markdown is in the page, follow its headings. */
	function follow(root: HTMLElement) {
		return watchHeadings(collectHeadings(root));
	}

	/** Marks the topmost heading in the reading band. */
	function watchHeadings(elements: HTMLElement[]) {
		const seen = new Set<string>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) seen.add(entry.target.id);
					else seen.delete(entry.target.id);
				}
				if (jumping) return;
				const top = elements.find((element) => seen.has(element.id));
				if (top) activeId = top.id;
			},
			{ rootMargin: '-100px 0px -66%', threshold: [0, 1] }
		);
		for (const element of elements) observer.observe(element);
		return () => observer.disconnect();
	}

	function scrollToHeading(id: string) {
		const element = document.getElementById(id);
		if (!element) return;
		jumping = true;
		activeId = id;
		tocOpen = false;
		element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		clearTimeout(settle);
		settle = setTimeout(() => (jumping = false), 1000);
	}

	onMount(() => {
		const saved = sessionStorage.getItem(scrollKey);
		if (saved !== null) requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
		return () => clearTimeout(settle);
	});
</script>

<svelte:head>
	<title>{headline}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={headline} />
	<link rel="icon" href="/smiley.png" />
</svelte:head>

<svelte:window onbeforeunload={saveScroll} onkeydown={(event) => event.key === 'Escape' && (tocOpen = false)} />

{#snippet contents(className: string)}
	<ul class={className}>
		{#each headings as item (item.id)}
			<li style:--level={item.level - 1}>
				<button
					type="button"
					class={[item.id === activeId && 'on']}
					aria-current={item.id === activeId ? 'location' : undefined}
					onclick={() => scrollToHeading(item.id)}
				>
					{item.text}
				</button>
			</li>
		{/each}
	</ul>
{/snippet}

<nav class="rail sfumato" aria-label="Contents">
	<button type="button" class="back" onclick={() => history.back()}>← Back</button>
	{#if headings.length > 0}
		{@render contents('toc')}
	{/if}
</nav>

<article class="article">
	{#key data.slug}
		<Article meta={data.meta} content={data.content} attach={follow} />
	{/key}
</article>

{#if headings.length > 0}
	<button
		type="button"
		class="fab"
		aria-label={tocOpen ? 'Close contents' : 'Contents'}
		aria-expanded={tocOpen}
		onclick={() => (tocOpen = !tocOpen)}
	>
		<svg viewBox="0 0 16 16" aria-hidden="true">
			{#if tocOpen}
				<path d="M4 4l8 8M12 4l-8 8" />
			{:else}
				<path d="M3 4.5h10M3 8h10M3 11.5h6" />
			{/if}
		</svg>
	</button>

	{#if tocOpen}
		<button
			type="button"
			class="scrim"
			aria-label="Close contents"
			onclick={() => (tocOpen = false)}
			transition:fade={{ duration: 200 }}
		></button>
		<nav class="drawer" aria-label="Contents" transition:fly={{ x: 320, duration: 300, opacity: 1 }}>
			<p class="drawer-title">Contents</p>
			{@render contents('drawer-list')}
		</nav>
	{/if}
{/if}

<style>
	.article {
		max-width: 640px;
		margin: 0 auto;
		padding: clamp(5rem, 14vh, 8rem) 1.5rem 12rem;
		box-sizing: content-box;
	}


	/* Back and contents float in the left margin when there's room for them. */
	.rail {
		position: fixed;
		top: clamp(5rem, 14vh, 8rem);
		left: max(1.5rem, calc(50% - 320px - 15.5rem));
		z-index: 3;
		width: 12rem;
		max-height: calc(100vh - 10rem);
		overflow-y: auto;
		scrollbar-width: none;
	}

	.back {
		color: var(--ink-3);
		font-size: 13px;
		transition: color 160ms var(--ease-out);
	}

	.back:hover {
		color: var(--accent);
	}

	.toc,
	.drawer-list {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.toc {
		margin-top: 1.5rem;
		border-left: 1px solid var(--rule);
	}

	.toc button,
	.drawer-list button {
		position: relative;
		display: block;
		padding: 0.2rem 0 0.2rem calc(0.85rem + var(--level) * 0.7rem);
		color: var(--ink-3);
		font-size: 12.5px;
		line-height: 1.3;
		transition: color 160ms var(--ease-out);
	}

	.toc button:hover,
	.drawer-list button:hover {
		color: var(--ink);
	}

	.toc button.on,
	.drawer-list button.on {
		color: var(--ink);
	}

	.toc button.on::before {
		content: '';
		position: absolute;
		left: -1px;
		top: 0.25rem;
		bottom: 0.25rem;
		border-left: 2px solid var(--accent);
	}

	.drawer-list button.on {
		color: var(--accent);
	}

	.fab {
		position: fixed;
		right: 1.25rem;
		bottom: 1.25rem;
		z-index: 1002;
		display: none;
		place-items: center;
		width: 3.25rem;
		height: 3.25rem;
		border-radius: 50%;
		background: linear-gradient(180deg, #fff, #f1efea);
		color: var(--ink);
		box-shadow:
			inset 0 1px 0 #fff,
			0 0 0 1px rgba(28, 27, 24, 0.07),
			0 14px 28px -12px rgba(28, 27, 24, 0.4);
		transition: transform 120ms var(--ease-out);
	}

	.fab:active {
		transform: scale(0.95);
	}

	.fab svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(28, 27, 24, 0.32);
		backdrop-filter: blur(4px);
		cursor: default;
	}

	.drawer {
		position: fixed;
		top: 0.75rem;
		right: 0.75rem;
		bottom: 0.75rem;
		z-index: 1001;
		width: min(20rem, calc(100vw - 1.5rem));
		padding: 1.25rem 1.25rem 5rem 0.5rem;
		overflow-y: auto;
		border-radius: 22px;
		background: var(--te-body);
		box-shadow:
			0 0 0 1px rgba(28, 27, 24, 0.06),
			0 30px 60px -20px rgba(28, 27, 24, 0.45);
	}

	.drawer-title {
		margin: 0 0 1rem 0.85rem;
		color: var(--ink-3);
		font-size: 12px;
	}

	@media (max-width: 1100px) {
		.rail {
			position: static;
			width: auto;
			max-width: 640px;
			margin: 2rem auto -3rem;
			padding: 0 1.5rem;
			box-sizing: content-box;
		}

		.toc {
			display: none;
		}

		.fab {
			display: grid;
		}
	}
</style>
