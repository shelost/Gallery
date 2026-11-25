<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import Article from '$lib/directions/Article.svelte';

	type Heading = { id: string; text: string; level: number };

	let { data } = $props();

	const scrollKey = $derived(`scroll-${data.slug}`);
	/** Posts built around side-by-side figures set `wide: true` for a broader column. */
	const wide = $derived(Boolean(data.meta?.wide));
	const headline = $derived(
		data.meta?.subtitle ? `${data.meta.title}: ${data.meta.subtitle}` : data.meta?.title
	);

	let headings = $state.raw<Heading[]>([]);
	let activeId = $state('');
	let tocOpen = $state(false);
	/** The chapter whose children are open. One at a time. */
	let openId = $state('');

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
		const elements = [
			...root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')
		].filter((element) => !element.closest('.notoc'));
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
				if (top) {
					activeId = top.id;
					const chapter = chapterOf(top.id);
					if (chapter) openId = chapter;
				}
			},
			{ rootMargin: '-100px 0px -66%', threshold: [0, 1] }
		);
		for (const element of elements) observer.observe(element);
		return () => observer.disconnect();
	}

	type Chapter = Heading & { children: Heading[] };

	const toc = $derived.by(() => {
		const groups: Chapter[] = [];
		for (const item of headings) {
			if (item.level <= 2 || groups.length === 0) groups.push({ ...item, children: [] });
			else groups[groups.length - 1].children.push(item);
		}
		return groups;
	});

	function chapterOf(id: string) {
		return toc.find((group) => group.id === id || group.children.some((child) => child.id === id))?.id ?? '';
	}

	function toggleChapter(id: string) {
		const opening = openId !== id;
		openId = opening ? id : '';
		if (opening) scrollToHeading(id);
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
		{#each toc as chapter (chapter.id)}
			<li>
				<button
					type="button"
					class={['chapter', (chapter.id === activeId || chapter.children.some((child) => child.id === activeId)) && 'on']}
					aria-expanded={chapter.children.length > 0 ? openId === chapter.id : undefined}
					aria-current={chapter.id === activeId ? 'location' : undefined}
					onclick={() => (chapter.children.length ? toggleChapter(chapter.id) : scrollToHeading(chapter.id))}
				>
					{#if chapter.children.length}
						<span class={['chev', openId === chapter.id && 'open']} aria-hidden="true"></span>
					{/if}
					{chapter.text}
				</button>
				{#if chapter.children.length}
					<div class={['fold', openId === chapter.id && 'open']} inert={openId !== chapter.id ? true : undefined}>
						<ul class="nest">
							{#each chapter.children as child (child.id)}
								<li>
									<button
										type="button"
										class={[child.id === activeId && 'on']}
										aria-current={child.id === activeId ? 'location' : undefined}
										onclick={() => scrollToHeading(child.id)}
									>
										{child.text}
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<nav class={['rail sfumato', wide && 'wide']} aria-label="Contents">
	<button type="button" class="back" onclick={() => history.back()}>← Back</button>
	{#if headings.length > 0}
		{@render contents('toc')}
	{/if}
</nav>

<article class={['article', wide && 'wide']}>
	{#key data.slug}
		<Article meta={data.meta} content={data.content} attach={follow} />
	{/key}
</article>

{#if headings.length > 0}
	<button
		type="button"
		class={['fab', wide && 'wide']}
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

	/* A wide post widens the column for its figures; running text keeps a reading measure. */
	.article.wide {
		max-width: 960px;
	}

	.article.wide :global(:is(.head, .prose > :is(p, h2, h3, ul, ol, blockquote))) {
		max-width: 680px;
		margin-inline: auto;
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
		width: 100%;
		padding: 0.2rem 0 0.2rem 0.85rem;
		color: var(--ink-3);
		font-size: 12.5px;
		line-height: 1.3;
		text-align: left;
		transition: color 160ms var(--ease-out);
	}

	.toc .chapter,
	.drawer-list .chapter {
		padding-left: 0.95rem;
	}

	.toc .nest button,
	.drawer-list .nest button {
		padding-left: 1.35rem;
		font-size: 12px;
	}

	.fold {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.46s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.fold.open {
		grid-template-rows: 1fr;
	}

	.fold > .nest {
		overflow: hidden;
		min-height: 0;
		margin: 0;
		padding: 0.08rem 0 0.28rem;
	}

	.nest li {
		opacity: 0;
		transform: translateY(-0.35rem);
		transition:
			opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.fold.open .nest li {
		opacity: 1;
		transform: none;
	}

	.fold.open .nest li:nth-child(1) {
		transition-delay: 0.04s;
	}
	.fold.open .nest li:nth-child(2) {
		transition-delay: 0.07s;
	}
	.fold.open .nest li:nth-child(3) {
		transition-delay: 0.1s;
	}
	.fold.open .nest li:nth-child(4) {
		transition-delay: 0.13s;
	}
	.fold.open .nest li:nth-child(5) {
		transition-delay: 0.16s;
	}
	.fold.open .nest li:nth-child(6) {
		transition-delay: 0.19s;
	}
	.fold.open .nest li:nth-child(7) {
		transition-delay: 0.22s;
	}
	.fold.open .nest li:nth-child(8) {
		transition-delay: 0.25s;
	}

	.fold:not(.open) .nest li {
		transition-delay: 0s;
		transition-duration: 0.16s;
	}

	.chev {
		position: absolute;
		left: 0.15rem;
		top: 0.45rem;
		width: 0;
		height: 0;
		border-top: 3px solid transparent;
		border-bottom: 3px solid transparent;
		border-left: 4px solid currentColor;
		transform-origin: 40% 50%;
		transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.chev.open {
		transform: rotate(90deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.fold,
		.nest li,
		.chev {
			transition: none;
		}
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
		background: linear-gradient(180deg, var(--card), var(--card-2));
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

	.rail.wide {
		left: max(1.5rem, calc(50% - 480px - 15.5rem));
	}

	@media (max-width: 1430px) {
		.rail.wide {
			position: static;
			width: auto;
			max-width: 960px;
			margin: 2rem auto -3rem;
			padding: 0 1.5rem;
			box-sizing: content-box;
		}

		.rail.wide .toc {
			display: none;
		}

		.fab.wide {
			display: grid;
		}
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
