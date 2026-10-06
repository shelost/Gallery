<script>
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { page } from '$app/state';
	import { goto, onNavigate, pushState, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PostPeek from '$lib/components/PostPeek.svelte';
	import { isPeekableSlug, slugFromHref } from '$lib/postPeek';
	import { isDirection } from '$lib/directions/content.js';
	import { setDirectionsContext } from '$lib/directions/context.js';
	import CursorInk from '$lib/directions/CursorInk.svelte';
	import Fonts from '$lib/directions/Fonts.svelte';
	import { isExternal } from '$lib/directions/links.js';
	import Switcher from '$lib/directions/Switcher.svelte';
	import '$lib/directions/directions.css';

	let { data, children } = $props();

	const posts = $derived(data.posts ?? []);
	const prototype = $derived(page.url.pathname.startsWith('/directions'));

	/** Slug from a `?post=` deep link on first load, before any history entry exists. */
	let linked = $state(/** @type {string | null} */ (null));

	const peekSlug = $derived(page.state.postSlug ?? linked);
	const peekPost = $derived(
		peekSlug
			? (posts.find((post) => post.slug === peekSlug) ?? { slug: peekSlug, content: null, meta: {} })
			: null
	);

	/** Shallow history entry, so Back closes the drawer. @param {string} slug */
	function openPeek(slug) {
		linked = null;
		pushState('', { postSlug: slug });
	}

	function closePeek() {
		if (page.state.postSlug) {
			history.back();
			return;
		}
		linked = null;
		replaceState(resolve(/** @type {any} */ (page.url.pathname)), {});
	}

	/** Opens a work: essays in the drawer, other sites in a new tab, routes in place. @param {string} href */
	function open(href) {
		const slug = slugFromHref(href, location.origin);
		if (isPeekableSlug(slug, posts)) openPeek(/** @type {string} */ (slug));
		else if (isExternal(href)) window.open(href, '_blank', 'noopener');
		else goto(resolve(/** @type {any} */ (href)));
	}

	setDirectionsContext({ open });

	/** @param {MouseEvent} event */
	function interceptPeekLinks(event) {
		if (event.defaultPrevented || event.button !== 0) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const anchor = /** @type {HTMLElement} */ (event.target).closest?.('a');
		if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
		const slug = slugFromHref(anchor.href, location.origin);
		if (!isPeekableSlug(slug, posts)) return;
		event.preventDefault();
		openPeek(/** @type {string} */ (slug));
	}

	onMount(() => {
		const slug = new URL(location.href).searchParams.get('post');
		if (isPeekableSlug(slug, posts)) linked = slug;
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition || prefersReducedMotion.current) return;
		if (!isDirection(navigation.to?.url.pathname)) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<Fonts />

<div class="dir" onclickcapture={interceptPeekLinks}>
	{@render children()}
	{#if prototype}
		<Switcher />
	{/if}
	{#if peekPost}
		{#key peekPost.slug}
			<PostPeek post={peekPost} onClose={closePeek} />
		{/key}
	{/if}
	<CursorInk />
</div>
