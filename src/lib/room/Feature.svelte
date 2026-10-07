<script>
	import Explainer from './Explainer.svelte';

	/**
	 * One thing from the room, shown large on the left with what it is on the right.
	 * @type {{ item: import('$lib/directions/content.js').ShelfItem, kicker: string, action?: string, figure: import('svelte').Snippet }}
	 */
	let { item, kicker, action = 'Find out more', figure } = $props();
</script>

<div class="feature">
	<div class="figure">
		{@render figure()}
	</div>
	<Explainer {item} {kicker} {action} />
</div>

<style>
	.feature {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
		align-items: center;
		gap: clamp(1.4rem, 4vw, 3rem);
		padding: clamp(1.6rem, 4vw, 3rem);
	}

	.figure {
		display: grid;
		justify-items: center;
		gap: 0.9rem;
		min-width: 0;
	}

	@media (max-width: 640px) {
		.feature {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
