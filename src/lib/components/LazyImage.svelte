<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let src = '';
	export let alt = '';
	export let className = '';
	export let width = null;
	export let height = null;
	export let fetchpriority = null;
	export let placeholder = null;

	let imgElement;
	let loaded = false;
	let inView = false;
	let error = false;

	// Generate a low-quality placeholder if not provided
	const defaultPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="100%25" height="100%25" fill="%23222"%3E%3C/rect%3E%3C/svg%3E';

	// Use IntersectionObserver for lazy loading
	onMount(() => {
		if ('IntersectionObserver' in window) {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							inView = true;
							observer.unobserve(entry.target);
						}
					});
				},
				{
					rootMargin: '50px', // Start loading 50px before the image enters viewport
					threshold: 0.01
				}
			);

			if (imgElement) {
				observer.observe(imgElement);
			}

			return () => {
				if (imgElement) {
					observer.unobserve(imgElement);
				}
			};
		} else {
			// Fallback for browsers without IntersectionObserver
			inView = true;
		}
	});

	function handleLoad() {
		loaded = true;
	}

	function handleError() {
		error = true;
		loaded = true;
	}

	$: actualSrc = inView ? src : (placeholder || defaultPlaceholder);
</script>

<div class="lazy-image-container {className}" bind:this={imgElement}>
	{#if !loaded && inView}
		<div class="placeholder" style="background-image: url({placeholder || defaultPlaceholder})"></div>
	{/if}

	<img
		src={actualSrc}
		{alt}
		{width}
		{height}
		{fetchpriority}
		loading={fetchpriority === 'high' ? 'eager' : 'lazy'}
		on:load={handleLoad}
		on:error={handleError}
		class:loaded
		class:error
		transition:fade={{ duration: 300 }}
	/>
</div>

<style>
	.lazy-image-container {
		position: relative;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.02);
	}

	.placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		filter: blur(20px);
		transform: scale(1.1);
	}

	img {
		display: block;
		width: 100%;
		height: auto;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	img.loaded {
		opacity: 1;
	}

	img.error {
		opacity: 0.5;
	}
</style>
