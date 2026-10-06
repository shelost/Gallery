<script>
	import NumberFlow from '@number-flow/svelte';
	import { onMount } from 'svelte';
	import { inView } from './motion.js';

	/** @type {{ value: number, from?: number, prefix?: string, suffix?: string, class?: string }} */
	let { value, from = 0, prefix = '', suffix = '', class: className = '' } = $props();

	let started = $state(false);
	/** NumberFlow server-renders a declarative shadow root, which the browser consumes before hydration. */
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<span
	class={['stat', className]}
	{@attach inView(
		(visible) => {
			if (visible) started = true;
		},
		{ threshold: 0.8 }
	)}
>
	{#if mounted}
		<NumberFlow value={started ? value : from} {prefix} {suffix} />
	{:else}
		{prefix}{from}{suffix}
	{/if}
</span>

<style>
	.stat {
		display: inline-flex;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
