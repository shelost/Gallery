<script>
	/** @type {{
	 *   images: { src: string, alt: string, title?: string, ratio?: string }[],
	 *   ratio?: string
	 * }} */
	let { images, ratio = '4 / 3' } = $props();
</script>

<div class="fits">
	{#each images as image (image.src)}
		<figure>
			<div class="frame" style:aspect-ratio={image.ratio ?? ratio}>
				<img src={image.src} alt={image.alt} title={image.title} />
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
		gap: 0.7rem;
		margin: 0.75rem 0 0.2rem;
	}

	figure {
		margin: 0;
	}

	.frame {
		position: relative;
		overflow: hidden;
		border-radius: 10px;
		background: color-mix(in srgb, var(--ink) 10%, var(--paper-2, var(--card)));
		box-shadow: 0 0 0 1px var(--rule);
	}

	.frame img {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		margin: 0;
		border: 0;
		border-radius: 0;
		box-shadow: none;
		object-fit: cover;
		object-position: center 28%;
		background: transparent;
	}

	figcaption {
		margin-top: 0.35rem;
		min-height: 2.3em;
		color: var(--ink-3, #6d6860);
		font-size: 0.72rem;
		line-height: 1.15;
	}
</style>
