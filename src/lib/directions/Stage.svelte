<script>
	/**
	 * One large panel with close-up panels inset over its lower right corner.
	 * The area goes in --stage, not --area, so the panels inside don't inherit it.
	 * @type {{ area?: string, children: import('svelte').Snippet, insets: import('svelte').Snippet }}
	 */
	let { area, children, insets } = $props();
</script>

<div class="stage" style:--stage={area}>
	{@render children()}
	<div class="insets">
		{@render insets()}
	</div>
</div>

<style>
	.stage {
		position: relative;
		grid-area: var(--stage);
		display: grid;
	}

	.insets {
		position: absolute;
		right: -6px;
		bottom: -6px;
		display: flex;
		gap: 10px;
	}

	.insets > :global(.panel) {
		width: 9.5rem;
		height: 7rem;
		box-shadow: 0 0 0 6px var(--paper);
	}

	.insets :global(.caption) {
		left: 6px;
		bottom: 6px;
		font-size: 11px;
	}

	@media (max-width: 760px) {
		.insets {
			position: static;
			margin-top: var(--gutter);
		}

		.insets > :global(.panel) {
			flex: 1;
			width: auto;
			min-height: 7rem;
			box-shadow: none;
		}
	}
</style>
