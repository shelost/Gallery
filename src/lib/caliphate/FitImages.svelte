<script>
	/** @type {{
	 *   images: { src: string, alt: string, title?: string }[],
	 *   ratio?: string
	 * }} */
	let { images, ratio = '4 / 3' } = $props();
</script>

<div class="fits" style:--ratio={ratio}>
	{#each images as image (image.src)}
		<figure>
			<div class="frame">
				<img class="fit" src={image.src} alt={image.alt} title={image.title} />
			</div>
			{#if image.title}
				<figcaption>{image.title}</figcaption>
			{/if}
		</figure>
	{/each}
</div>

<style>
	.fits {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.7rem;
		margin: 0.75rem 0 0.2rem;
	}

	figure {
		margin: 0;
	}

	.frame {
		position: relative;
		aspect-ratio: var(--ratio);
		overflow: hidden;
		border-radius: 10px;
		background: transparent;
	}

	.fit {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		margin: 0;
		border: 0;
		border-radius: 10px;
		object-fit: cover;
		background: transparent;
	}

	figcaption {
		margin-top: 0.35rem;
		color: var(--ink-3, #6d6860);
		font-size: 0.72rem;
		line-height: 1.15;
	}
</style>
