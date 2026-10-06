<script>
	/** @type {{ label: string }} */
	let { label } = $props();
</script>

<span class="tag">{label}</span>

<style>
	.tag {
		display: inline-flex;
		align-items: center;
		height: 1.25rem;
		padding: 0 0.5rem;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-family: var(--sans);
		font-size: 11px;
		font-weight: 450;
		letter-spacing: 0;
		line-height: 1;
		white-space: nowrap;
		vertical-align: 0.1em;
	}
</style>
