<script>
	/**
	 * The top of a sheet: a small label, a serif title, and a line of help under it. `children`
	 * takes the help line's place when the sheet needs something you can press there instead.
	 * @type {{ kicker: string, title: string, hint?: string, children?: import('svelte').Snippet }}
	 */
	let { kicker, title, hint = '', children } = $props();
</script>

<header class="heading">
	<p class="kicker">{kicker}</p>
	<h2>{title}</h2>
	{#if children}
		{@render children()}
	{:else if hint}
		<p class="hint">{hint}</p>
	{/if}
</header>

<style>
	.heading {
		display: grid;
		justify-items: start;
		gap: 0.2rem;
		padding-right: 2.6rem;
	}

	.kicker {
		margin: 0;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-family: var(--serif);
		font-size: 1.6rem;
		font-weight: 400;
	}

	.hint {
		margin: 0;
		color: var(--ink-3);
		font-size: 0.85rem;
	}
</style>
