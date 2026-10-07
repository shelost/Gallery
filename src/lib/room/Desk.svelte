<script module>
	/** The desk, centered on the origin, in meters; `top` is the height of its writing surface. */
	export const DESK = { w: 1.9, d: 0.9, top: 0.74 };

	const FOOT = 0.06;
	const PLINTH = 0.05;
	const SLAB = 0.036;
	const MOULD = 0.022;
	/** The two pedestals of drawers, standing in from the ends under the top. */
	const PEDESTAL = { w: 0.52, d: DESK.d - 0.1, x: DESK.w / 2 - 0.05 - 0.26 };
	const FLOOR = FOOT + PLINTH;
	const CEILING = DESK.top - SLAB - MOULD;
	const FRONT = PEDESTAL.d / 2;
	/** The kneehole between the pedestals, and the rail with the frieze drawer across its top. */
	const KNEE = 2 * (PEDESTAL.x - PEDESTAL.w / 2);
	const FRIEZE = 0.105;
	const MIDDLE = (FLOOR + CEILING) / 2;

	/** A pedestal's drawers, graduated from the top down: their centers and heights. */
	const DRAWERS = [0.148, 0.168, 0.192].reduce(
		(drawers, h) => {
			const above = drawers.at(-1);
			const top = above ? above.y - above.h / 2 - 0.012 : CEILING - 0.02;
			return [...drawers, { y: top - h / 2, h }];
		},
		/** @type {{ y: number, h: number }[]} */ ([])
	);

	/** Moulding is a shade darker than the panels it frames. */
	const DARK = '#c99c8c';
	const LIGHT = '#e6c8bb';
</script>

<script>
	import { T } from '@threlte/core';
	import { BoxGeometry, LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector2 } from 'three';
	import Box from './Box.svelte';
	import { BRASS, leather, mahogany } from './materials.js';

	/**
	 * A Victorian pedestal desk in French-polished mahogany: a moulded top with a gilt-tooled green
	 * leather inset, a frieze drawer over the kneehole, three graduated drawers in each pedestal
	 * with brass bail pulls, fielded panels on the ends, and short turned bun feet.
	 */

	const wood = mahogany();
	const hide = leather();
	const turned = new MeshPhysicalMaterial({ map: wood, color: DARK, roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.45 });
	const brass = new MeshStandardMaterial(BRASS);

	/** A bun foot with a collar above it, turned: radius by height. */
	const foot = new LatheGeometry(
		[
			[0, 0],
			[0.02, 0],
			[0.032, 0.01],
			[0.036, 0.024],
			[0.031, 0.038],
			[0.022, 0.046],
			[0.027, 0.05],
			[0.027, FOOT],
			[0, FOOT]
		].map(([r, y]) => new Vector2(r, y)),
		32
	);
	const plate = new BoxGeometry(0.09, 0.03, 0.003);
	/** A bail: the lower half of a ring, hanging from its posts. */
	const bail = new TorusGeometry(0.03, 0.0035, 10, 28, Math.PI);
	const knob = new SphereGeometry(0.011, 20, 14);

	$effect(() => () => {
		for (const geometry of [foot, plate, bail, knob]) geometry.dispose();
		turned.dispose();
		brass.dispose();
	});
</script>

<!-- The top, with a moulded lip under it and the leather let into it. -->
<Box size={[DESK.w, SLAB, DESK.d]} radius={0.012} map={wood} roughness={0.3} sheen={0.75} position={[0, DESK.top - SLAB / 2, 0]} />
<Box size={[DESK.w - 0.04, MOULD, DESK.d - 0.04]} radius={0.01} map={wood} color={DARK} roughness={0.34} sheen={0.6} position={[0, CEILING + MOULD / 2, 0]} />
<Box size={[DESK.w - 0.26, 0.002, DESK.d - 0.24]} radius={0.001} map={hide} roughness={0.8} sheen={0.05} position={[0, DESK.top + 0.001, 0]} shadow={false} />

{#each [-1, 1] as side (side)}
	{@const x = side * PEDESTAL.x}
	{#each [-1, 1] as fx (fx)}
		{#each [-1, 1] as fz (fz)}
			<T.Mesh geometry={foot} material={turned} position={[x + fx * (PEDESTAL.w / 2 - 0.04), 0, fz * (PEDESTAL.d / 2 - 0.04)]} castShadow receiveShadow />
		{/each}
	{/each}
	<Box size={[PEDESTAL.w + 0.03, PLINTH, PEDESTAL.d + 0.03]} radius={0.01} map={wood} color={DARK} roughness={0.34} sheen={0.6} position={[x, FOOT + PLINTH / 2, 0]} />
	<Box size={[PEDESTAL.w, CEILING - FLOOR, PEDESTAL.d]} radius={0.006} map={wood} roughness={0.32} sheen={0.7} position={[x, MIDDLE, 0]} />

	<!-- A fielded panel on the end, and a pilaster either side of the drawers. -->
	<Box size={[0.008, CEILING - FLOOR - 0.1, PEDESTAL.d - 0.12]} radius={0.003} map={wood} color={LIGHT} roughness={0.3} sheen={0.7} position={[x + side * (PEDESTAL.w / 2 + 0.004), MIDDLE, 0]} />
	{#each [-1, 1] as px (px)}
		<Box size={[0.03, CEILING - FLOOR - 0.012, 0.016]} radius={0.006} map={wood} color={DARK} roughness={0.32} sheen={0.7} position={[x + px * (PEDESTAL.w / 2 - 0.018), MIDDLE, FRONT + 0.008]} />
	{/each}

	{#each DRAWERS as drawer (drawer.y)}
		<Box size={[PEDESTAL.w - 0.09, drawer.h, 0.02]} radius={0.004} map={wood} roughness={0.3} sheen={0.75} position={[x, drawer.y, FRONT + 0.01]} />
		<Box size={[PEDESTAL.w - 0.16, drawer.h - 0.05, 0.006]} radius={0.003} map={wood} color={LIGHT} roughness={0.3} sheen={0.75} position={[x, drawer.y, FRONT + 0.023]} />
		<T.Mesh geometry={plate} material={brass} position={[x, drawer.y + 0.012, FRONT + 0.0275]} />
		<T.Mesh geometry={bail} material={brass} position={[x, drawer.y + 0.016, FRONT + 0.031]} rotation.z={Math.PI} castShadow />
	{/each}
{/each}

<!-- The kneehole: a frieze drawer across its top, and a panel at its back. -->
<Box size={[KNEE + 0.02, FRIEZE, PEDESTAL.d]} radius={0.006} map={wood} roughness={0.32} sheen={0.7} position={[0, CEILING - FRIEZE / 2, 0]} />
<Box size={[KNEE - 0.05, FRIEZE - 0.03, 0.02]} radius={0.004} map={wood} roughness={0.3} sheen={0.75} position={[0, CEILING - FRIEZE / 2, FRONT + 0.01]} />
{#each [-1, 1] as kx (kx)}
	<T.Mesh geometry={knob} material={brass} position={[kx * KNEE * 0.25, CEILING - FRIEZE / 2, FRONT + 0.026]} castShadow />
{/each}
<Box
	size={[KNEE + 0.02, CEILING - FRIEZE - FLOOR, 0.018]}
	radius={0.004}
	map={wood}
	color={DARK}
	roughness={0.36}
	sheen={0.5}
	position={[0, FLOOR + (CEILING - FRIEZE - FLOOR) / 2, -PEDESTAL.d / 2 + 0.06]}
/>
