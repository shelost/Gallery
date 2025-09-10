<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import imageMetadata from '$lib/imageMetadata.json';
	import { animationsEnabled } from '$lib/store';

	export let src = '';
	export let alt = '';
	export let className = '';
	export let width = null;
	export let height = null;
	export let fetchpriority = null;

	let imgElement;
	let pictureElement;
	let loaded = false;
	let inView = false;
	let error = false;
	let unsubscribe;

	// Parse the src to determine the directory and file
	$: parsedSrc = parseSrc(src);
	$: metadata = getImageMetadata(parsedSrc);
	$: webpSrc = getWebPSrc(parsedSrc);
	$: optimizedSrc = getOptimizedSrc(parsedSrc);

	function parseSrc(srcPath) {
		const match = srcPath.match(/^(\w+)\/(.+)\.(\w+)$/);
		if (match) {
			return {
				dir: match[1],
				filename: match[2],
				ext: match[3]
			};
		}
		return null;
	}

	function getImageMetadata(parsed) {
		if (!parsed || !imageMetadata[parsed.dir]) return null;
		// Use the filename as-is since metadata keys match the filenames
		return imageMetadata[parsed.dir][parsed.filename];
	}

	function getWebPSrc(parsed) {
		if (!parsed || parsed.ext === 'svg') return null;
		// Remove 'card-' prefix for optimized files
		const optimizedFilename = parsed.filename.replace(/^card-/, '');
		return `${parsed.dir}/optimized/${optimizedFilename}.webp`;
	}

	function getOptimizedSrc(parsed) {
		if (!parsed || parsed.ext === 'svg') return src;
		// Remove 'card-' prefix for optimized files
		const optimizedFilename = parsed.filename.replace(/^card-/, '');
		return `${parsed.dir}/optimized/${optimizedFilename}.jpg`;
	}

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
					rootMargin: '50px',
					threshold: 0.01
				}
			);

			if (pictureElement) {
				observer.observe(pictureElement);
			}

			return () => {
				if (pictureElement) {
					observer.unobserve(pictureElement);
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

	// Determine what to show based on loading state
	$: showPlaceholder = !loaded && metadata?.placeholder;
	$: shouldLoad = inView || fetchpriority === 'high' || !$animationsEnabled;
</script>

<div class="smart-image-container {className}" bind:this={pictureElement}>
	{#if showPlaceholder}
		<img
			src={metadata.placeholder}
			alt=""
			class="placeholder"
			aria-hidden="true"
		/>
	{/if}

	{#if shouldLoad}
		<picture>
			{#if webpSrc && parsedSrc?.ext !== 'svg'}
				<source srcset={webpSrc} type="image/webp" />
			{/if}
			<img
				bind:this={imgElement}
				src={parsedSrc?.ext === 'svg' ? src : optimizedSrc}
				{alt}
				{width}
				{height}
				loading={fetchpriority === 'high' ? 'eager' : 'lazy'}
				decoding={fetchpriority === 'high' ? 'sync' : 'async'}
				on:load={handleLoad}
				on:error={handleError}
				class:loaded
				class:error
				transition:fade={{ duration: $animationsEnabled ? 300 : 0 }}
			/>
		</picture>
	{/if}
</div>

<style>
	.smart-image-container {
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
		object-fit: cover;
		filter: blur(20px);
		transform: scale(1.1);
		z-index: 1;
	}

	picture {
		position: relative;
		z-index: 2;
		display: block;
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
