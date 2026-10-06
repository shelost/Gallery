<script>
	import { T } from '@threlte/core';
	import { RoundedBoxGeometry } from '@threlte/extras';

	/**
	 * @typedef {object} Props
	 * @property {[number, number, number]} at
	 * @property {number[]} size box: [w, h, d] · cylinder: [radius, length] · sphere: [radius]
	 * @property {'box' | 'cylinder' | 'sphere'} [shape]
	 * @property {[number, number, number]} [rotation]
	 * @property {number} [round] corner radius for boxes
	 * @property {import('three').Material | import('three').Material[]} material
	 * @property {boolean} [cast]
	 * @property {boolean} [receive]
	 */

	/** @type {Props & Record<`on${string}`, any>} */
	let {
		at,
		size,
		shape = 'box',
		rotation = [0, 0, 0],
		round = 0,
		material,
		cast = true,
		receive = true,
		...events
	} = $props();
</script>

<T.Mesh position={at} {rotation} {material} castShadow={cast} receiveShadow={receive} {...events}>
	{#if shape === 'cylinder'}
		<T.CylinderGeometry args={[size[0], size[0], size[1], 32]} />
	{:else if shape === 'sphere'}
		<T.SphereGeometry args={[size[0], 32, 16]} />
	{:else if round > 0}
		<RoundedBoxGeometry args={size} radius={Math.min(round, Math.min(...size) / 2 - 0.002)} />
	{:else}
		<T.BoxGeometry args={size} />
	{/if}
</T.Mesh>
