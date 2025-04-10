<script>
	import { onNavigate, afterNavigate, beforeNavigate } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { showHeader } from '$lib/store';
	import { page } from '$app/stores';

	// Track if we're navigating away from a [slug] page
	let isNavigatingAway = false;
	// Track if we should render the layout at all
	let shouldRender = true;
	let layoutElement;

	// Clean up any stray elements when navigating away
	function cleanupSlugLayout() {
		// Make sure body styles are reset
		document.body.style.overflow = '';
		// Make sure header is visible
		showHeader.set(true);

		// Remove any stray main elements with slugPage attribute
		const slugPages = document.querySelectorAll('[data-slug-page="true"]');
		slugPages.forEach(el => el.remove());
	}

	beforeNavigate(() => {
		if (layoutElement) {
			layoutElement.dataset.slugLayout = 'true';
		}
		cleanupSlugLayout();
	});

	onNavigate((navigation) => {
		// Check if we're navigating away from a [slug] page to a different route
		if (navigation.from && navigation.from.route.id === '/[slug]') {
			if (navigation.to && navigation.to.route.id !== '/[slug]') {
				isNavigatingAway = true;
				cleanupSlugLayout();

				// After the out transition, don't render the layout at all
				setTimeout(() => {
					shouldRender = false;

					// Do a final cleanup after transition completes
					setTimeout(cleanupSlugLayout, 100);
				}, 150); // Match the fade duration
			}
		}
	});

	afterNavigate(() => {
		// Reset states after navigation completes
		isNavigatingAway = false;
		// Only render if we're on a [slug] page
		shouldRender = $page.route.id === '/[slug]';

		if (!shouldRender) {
			cleanupSlugLayout();
		}
	});
</script>

{#if shouldRender}
<div
	class="app-layout"
	bind:this={layoutElement}
	out:fade={{duration: 150}}
	data-slug-layout="true"
	style="position: relative; z-index: 0; height: auto; width: 100%;"

>
    <slot />
</div>
{:else}
<slot />
{/if}

<style>
	.app-layout {
		position: relative;
		z-index: 0;
		width: 100%;
		height: auto;
		margin: 0;
		padding: 0;
	}
</style>