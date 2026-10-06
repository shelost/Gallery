<script>
	import WorkGroup from './WorkGroup.svelte';

	/**
	 * @type {{
	 *   groups: { id: string, numeral: string, label: string, works: import('./content.js').Work[] }[],
	 *   active?: string | null,
	 *   offset?: number
	 * }}
	 */
	let { groups, active = $bindable(null), offset = 0 } = $props();
</script>

{#each groups as group, i (group.id)}
	<WorkGroup {group} i={i + offset} bind:active />
{/each}
