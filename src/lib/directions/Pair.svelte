<script>
	import Grid from './Grid.svelte';

	/** Two things side by side (tweets, figures), stacked on narrow screens.
	 * @type {{ children: import('svelte').Snippet, caption?: string, ratio?: string }} */
	let { children, ...rest } = $props();
</script>

<Grid columns={2} {...rest}>{@render children()}</Grid>
