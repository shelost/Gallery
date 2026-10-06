<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
	import { record } from './covers.js';

	/**
	 * A record player lying flat on a board, its record turning at 33⅓ while it's `spinning`.
	 * The label is whatever's on; `finish` is the plinth's colour.
	 * @type {{
	 *   item: import('$lib/directions/content.js').ShelfItem | undefined,
	 *   still: boolean,
	 *   spinning?: boolean,
	 *   finish?: string,
	 *   onpick: () => void,
	 *   onhover: (on: boolean) => void
	 * }}
	 */
	let { item, still, spinning = true, finish = '#4a3121', onpick, onhover } = $props();

	const { invalidate } = useThrelte();

	const W = 0.42;
	const D = 0.32;
	const BASE = 0.06;
	const CENTER = /** @type {[number, number]} */ ([-0.06, 0.005]);
	const RADIUS = 0.135;
	const PIVOT = /** @type {[number, number]} */ ([0.15, -0.09]);
	const SPEED = ((100 / 3) / 60) * Math.PI * 2;

	const walnut = new MeshStandardMaterial({ roughness: 0.48, metalness: 0.05 });

	$effect(() => {
		walnut.color.set(finish);
		invalidate();
	});
	const steel = new MeshStandardMaterial({ color: '#c9c5bb', roughness: 0.28, metalness: 0.9 });
	const rubber = new MeshStandardMaterial({ color: '#141414', roughness: 0.85 });
	const vinyl = new MeshPhysicalMaterial({ color: '#0d0d0d', roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 });
	const hitbox = new MeshStandardMaterial({ visible: false });

	const label = $derived(
		new MeshPhysicalMaterial({ map: record(item), roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 })
	);

	$effect(() => {
		const used = label;
		return () => {
			used.map?.dispose();
			used.dispose();
		};
	});

	$effect(() => () => {
		for (const material of [walnut, steel, rubber, vinyl, hitbox]) material.dispose();
	});

	/** @type {import('three').Group | undefined} */
	let disc = $state();

	useTask(
		(delta) => {
			if (!disc || still || !spinning) return;
			disc.rotation.y -= delta * SPEED;
			invalidate();
		},
		{ autoInvalidate: false }
	);

	/** The arm swings from its pivot to the record's lead-in groove. */
	const reach = Math.atan2(CENTER[0] + RADIUS * 0.55 - PIVOT[0], CENTER[1] + RADIUS * 0.55 - PIVOT[1]);
	const length = Math.hypot(CENTER[0] + RADIUS * 0.55 - PIVOT[0], CENTER[1] + RADIUS * 0.55 - PIVOT[1]);
</script>

<T.Group position.z={D / 2 + 0.012}>
	<T.Mesh material={walnut} position.y={BASE / 2} castShadow receiveShadow>
		<T.BoxGeometry args={[W, BASE, D]} />
	</T.Mesh>

	{#each [-0.17, 0.17] as fx (fx)}
		{#each [-0.12, 0.12] as fz (fz)}
			<T.Mesh material={rubber} position={[fx, 0.004, fz]}>
				<T.CylinderGeometry args={[0.018, 0.02, 0.008, 20]} />
			</T.Mesh>
		{/each}
	{/each}

	<T.Mesh material={steel} position={[CENTER[0], BASE + 0.006, CENTER[1]]} castShadow receiveShadow>
		<T.CylinderGeometry args={[0.142, 0.142, 0.012, 72]} />
	</T.Mesh>

	<T.Group bind:ref={disc} position={[CENTER[0], BASE + 0.0135, CENTER[1]]}>
		<T.Mesh material={[vinyl, label, vinyl]} castShadow receiveShadow>
			<T.CylinderGeometry args={[RADIUS, RADIUS, 0.003, 72]} />
		</T.Mesh>
		<T.Mesh material={steel} position.y={0.006}>
			<T.CylinderGeometry args={[0.003, 0.003, 0.012, 12]} />
		</T.Mesh>
	</T.Group>

	<T.Group position={[PIVOT[0], BASE, PIVOT[1]]}>
		<T.Mesh material={steel} position.y={0.012} castShadow>
			<T.CylinderGeometry args={[0.016, 0.02, 0.024, 24]} />
		</T.Mesh>
		<T.Mesh material={rubber} position={[0, 0.03, -0.035]} rotation.x={Math.PI / 2} castShadow>
			<T.CylinderGeometry args={[0.012, 0.012, 0.02, 20]} />
		</T.Mesh>
		<T.Group rotation.y={reach} position.y={0.028}>
			<T.Mesh material={steel} position.z={length / 2} rotation.x={Math.PI / 2} castShadow>
				<T.CylinderGeometry args={[0.0028, 0.0028, length, 10]} />
			</T.Mesh>
			<T.Mesh material={rubber} position={[0, -0.006, length]} castShadow>
				<T.BoxGeometry args={[0.014, 0.008, 0.026]} />
			</T.Mesh>
		</T.Group>
	</T.Group>

	{#each [0.15, 0.185] as kx (kx)}
		<T.Mesh material={steel} position={[kx, BASE + 0.004, 0.12]} castShadow>
			<T.CylinderGeometry args={[0.01, 0.011, 0.008, 24]} />
		</T.Mesh>
	{/each}

	<T.Mesh
		material={hitbox}
		position.y={0.05}
		onclick={(/** @type {any} */ event) => {
			event.stopPropagation();
			onpick();
		}}
		onpointerenter={(/** @type {any} */ event) => {
			event.stopPropagation();
			onhover(true);
		}}
		onpointerleave={() => onhover(false)}
	>
		<T.BoxGeometry args={[W, 0.1, D]} />
	</T.Mesh>
</T.Group>
