<script>
	import { resolve } from '$app/paths';
	import WorkGroup from '$lib/directions/WorkGroup.svelte';

	/** @typedef {import('$lib/directions/content.js').Work} Work */

	let { data } = $props();

	const DAY = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });

	/** Post dates are written loosely ('2025-7-21'), so they're read by hand rather than by Date's parser. @param {string | undefined} date */
	function parse(date) {
		const [year, month = 1, day = 1] = String(date ?? '')
			.split(/[-/]/)
			.map(Number);
		return Number.isFinite(year) && year > 0 ? new Date(Date.UTC(year, month - 1, day)) : null;
	}

	/** Blog posts as index rows, newest first and grouped by year. */
	const years = $derived.by(() => {
		const posts = (data.posts ?? [])
			.filter((/** @type {any} */ post) => post.meta?.type === 'blog')
			.map((/** @type {any} */ post) => ({ post, date: parse(post.meta?.date) }))
			.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

		/** @type {{ id: string, numeral: string, label: string, works: Work[] }[]} */
		const groups = [];
		for (const { post, date } of posts) {
			const year = date ? String(date.getUTCFullYear()) : 'Undated';
			/** @type {Work} */
			const work = {
				id: post.slug,
				section: 'blog',
				kind: 'Essay',
				title: post.meta?.title ?? post.slug,
				year: date ? DAY.format(date) : '',
				kicker: '',
				blurb: post.meta?.blurb ?? '',
				href: `/${post.slug}`,
				media: null,
				medium: '',
				credit: '',
				tag: post.meta?.ai ? 'AI Assisted' : undefined
			};
			let group = groups.find((entry) => entry.id === year);
			if (!group) groups.push((group = { id: year, numeral: '', label: year, works: [] }));
			group.works.push(work);
		}
		return groups;
	});

	let active = $state(/** @type {string | null} */ (null));
</script>

<svelte:head>
	<title>Blog · Heewon Ahn</title>
	<meta name="description" content="Blog posts by Heewon" />
</svelte:head>

<main class="blog">
	<header class="sfumato">
		<a class="home" href={resolve('/')}>Heewon Ahn</a>
		<h1>Blog</h1>
		<p>My thoughts on history, tech, and more.</p>
	</header>

	{#each years as group, i (group.id)}
		<WorkGroup {group} i={i + 1} preview={false} bind:active />
	{:else}
		<p class="empty">No posts yet.</p>
	{/each}
</main>

<style>
	.blog {
		max-width: 640px;
		margin: 0 auto;
		padding: clamp(5rem, 14vh, 8rem) 1.5rem 10rem;
		box-sizing: content-box;
	}

	header {
		margin-bottom: 3.5rem;
	}

	.home {
		color: var(--ink-3);
		transition: color 160ms var(--ease-out);
	}

	.home:hover {
		color: var(--accent);
	}

	h1 {
		margin-top: 1.25rem;
		font-size: clamp(2.1rem, 5vw, 2.75rem);
		font-weight: 550;
		line-height: 1;
		letter-spacing: -0.045em;
	}

	header p {
		margin-top: 0.6rem;
		color: var(--ink-2);
		font-size: 17px;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	.empty {
		color: var(--ink-3);
	}
</style>
