<script>
	/** @type {{ onclick: () => void }} */
	let { onclick } = $props();
</script>

<button type="button" class="back" {onclick}>
	<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5" /></svg>
	Back
</button>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		color: var(--ink-2);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.back:hover {
		color: var(--accent);
	}

	svg {
		width: 0.75rem;
		height: 0.75rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
