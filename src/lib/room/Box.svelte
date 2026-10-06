<script>
	import { T } from '@threlte/core';
	import { MeshPhysicalMaterial } from 'three';
	import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

	/**
	 * A soft-cornered block in a satin finish, the room's one building material.
	 * `position` is the block's center.
	 * @type {{
	 *   size: [number, number, number],
	 *   radius?: number,
	 *   color?: string,
	 *   roughness?: number,
	 *   sheen?: number,
	 *   opacity?: number,
	 *   position?: [number, number, number],
	 *   rotation?: [number, number, number],
	 *   shadow?: boolean
	 * }}
	 */
	let {
		size,
		radius = 0.012,
		color = '#ffffff',
		roughness = 0.55,
		sheen = 0.25,
		opacity = 1,
		position = [0, 0, 0],
		rotation = [0, 0, 0],
		shadow = true
	} = $props();

	const geometry = $derived(
		new RoundedBoxGeometry(size[0], size[1], size[2], 4, Math.min(radius, Math.min(...size) / 2 - 1e-4))
	);
	const material = $derived(
		new MeshPhysicalMaterial({
			color,
			roughness,
			clearcoat: sheen,
			clearcoatRoughness: 0.6,
			transparent: opacity < 1,
			opacity
		})
	);

	$effect(() => {
		const used = geometry;
		return () => used.dispose();
	});

	$effect(() => {
		const used = material;
		return () => used.dispose();
	});
</script>

<T.Mesh {geometry} {material} {position} {rotation} castShadow={shadow && opacity === 1} receiveShadow />
