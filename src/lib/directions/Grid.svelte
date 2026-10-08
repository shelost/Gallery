<script>
	/**
	 * Equal columns of figures (or tweets, or anything) under one shared caption.
	 * Titled images inside get their own captions from the article.
	 * @type {{
	 *   children: import('svelte').Snippet,
	 *   caption?: string,
	 *   columns?: number,
	 *   narrow?: number,
	 *   ratio?: string
	 * }}
	 */
	let { children, caption = '', columns = 3, narrow = 1, ratio = '4 / 5' } = $props();
</script>

<figure class="grid" style:--columns={columns} style:--narrow={narrow} style:--ratio={ratio}>
	<div class="cells">{@render children()}</div>
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	.grid {
		margin: 2.5rem 0;
	}

	.cells {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		align-items: start;
		gap: 1rem;
	}

	.cells > :global(*) {
		min-width: 0;
		margin: 0 !important;
	}

	.cells :global(img) {
		aspect-ratio: var(--ratio);
		object-fit: cover;
	}

	@media (max-width: 560px) {
		.cells {
			grid-template-columns: repeat(var(--narrow), minmax(0, 1fr));
		}
	}
</style>
