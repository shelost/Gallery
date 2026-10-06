<script>
	import { T } from '@threlte/core';
	import Solid from './Solid.svelte';
	import { FURNITURE } from './furniture.js';
	import { FINISH } from './geometry.js';

	/** @type {{ item: import('./plan.js').Item, paints: import('./materials.js').Paints }} */
	let { item, paints } = $props();

	const parts = $derived(FURNITURE[item.type] ?? []);
</script>

<T.Group position={[item.at[0], FINISH, item.at[1]]} rotation.y={((item.rotate ?? 0) * Math.PI) / 180}>
	{#each parts as { finish, ...part }, i (i)}
		<Solid {...part} material={paints[finish]} cast={finish !== 'glass'} />
	{/each}
</T.Group>
