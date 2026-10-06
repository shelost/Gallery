<script>
	/**
	 * Two things side by side (tweets, figures), stacked on narrow screens.
	 * @type {{ children: import('svelte').Snippet, caption?: string }}
	 */
	let { children, caption = '' } = $props();
</script>

<figure class="pair">
	<div class="grid">{@render children()}</div>
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	.pair {
		margin: 2.5rem 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: 1rem;
	}

	.grid > :global(*) {
		min-width: 0;
		margin: 0 !important;
	}

	.grid :global(img) {
		aspect-ratio: 4 / 5;
		object-fit: cover;
	}

	@media (max-width: 560px) {
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
