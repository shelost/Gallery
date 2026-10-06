<script>
	import { T } from '@threlte/core';
	import { Shape, Vector2 } from 'three';
	import Layer from './Layer.svelte';
	import Solid from './Solid.svelte';
	import { gable } from './geometry.js';

	/** @type {{ house: import('./plan.js').House, index: number, elevation: number, hidden?: boolean, exploded?: boolean }} */
	let { house, index, elevation, hidden = false, exploded = false } = $props();

	const roof = $derived(gable(house));
	const attic = $derived(new Shape(roof.profile.map(([z, y]) => new Vector2(z, y))));
</script>

<Layer {index} {elevation} {hidden} {exploded}>
	{#snippet children(paints)}
		<!-- The attic's profile is drawn in z/y and extruded along x across the house. -->
		<T.Mesh position.x={house.width} rotation.y={-Math.PI / 2} material={paints.wall} castShadow receiveShadow>
			<T.ExtrudeGeometry args={[attic, { depth: house.width, bevelEnabled: false }]} />
		</T.Mesh>
		{#each roof.boards as board, i (i)}
			<Solid size={board.size} at={board.at} rotation={board.rotation} material={paints.roof} />
		{/each}
	{/snippet}
</Layer>
