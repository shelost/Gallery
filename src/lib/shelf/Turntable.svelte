<script module>
	/** The plinth's footprint and the height to the top of the counterweight, in meters. */
	export const DECK = { w: 0.42, d: 0.32, h: 0.1 };
</script>

<script>
	import { untrack } from 'svelte';
	import { T, useTask, useThrelte } from '@threlte/core';
	import { MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
	import { record } from './covers.js';

	/**
	 * A record player lying flat, its back edge on z = 0. While it's `spinning` the platter runs up
	 * to 33⅓ and the arm swings over to the lead-in groove; when it stops, the platter winds down and
	 * the arm goes back to its rest. A new record drops onto the platter. The label is whatever's on;
	 * `finish` is the plinth's colour and `grain` an optional wood texture. Dragging across it
	 * isn't a click.
	 * @type {{
	 *   item: import('$lib/directions/content.js').ShelfItem | undefined,
	 *   still: boolean,
	 *   spinning?: boolean,
	 *   finish?: string,
	 *   grain?: import('three').Texture,
	 *   onpick: () => void,
	 *   onhover: (on: boolean) => void
	 * }}
	 */
	let { item, still, spinning = true, finish = '#4a3121', grain, onpick, onhover } = $props();

	const { invalidate } = useThrelte();

	const { w: W, d: D } = DECK;
	const BASE = 0.06;
	const CENTER = /** @type {[number, number]} */ ([-0.06, 0.005]);
	const RADIUS = 0.135;
	const PIVOT = /** @type {[number, number]} */ ([0.15, -0.09]);
	const SPEED = ((100 / 3) / 60) * Math.PI * 2;
	/** Where the record lies on the platter, and how far above it a new one starts. */
	const DISC_Y = BASE + 0.0135;
	const DROP = 0.06;
	/** The arm's height over the plinth, the angle it rests at, and how far it's cued up while it swings. */
	const ARM_Y = 0.028;
	const REST = -0.25;
	const CUE = 0.008;

	const walnut = new MeshStandardMaterial({ roughness: 0.48, metalness: 0.05 });

	$effect(() => {
		walnut.color.set(finish);
		walnut.map = grain ?? null;
		walnut.needsUpdate = true;
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

	/** The arm swings from its pivot to the record's lead-in groove. */
	const reach = Math.atan2(CENTER[0] + RADIUS * 0.55 - PIVOT[0], CENTER[1] + RADIUS * 0.55 - PIVOT[1]);
	const length = Math.hypot(CENTER[0] + RADIUS * 0.55 - PIVOT[0], CENTER[1] + RADIUS * 0.55 - PIVOT[1]);
	/** The post the arm rests on, most of the way out along it. */
	const cradle = [PIVOT[0] + Math.sin(REST) * length * 0.8, PIVOT[1] + Math.cos(REST) * length * 0.8];

	/** @type {import('three').Group | undefined} */
	let disc = $state();
	/** @type {import('three').Group | undefined} */
	let tonearm = $state();

	let speed = 0;
	let arm = REST;
	let drop = 0;
	let settled = false;
	let placed = false;

	$effect(() => {
		item;
		if (placed && !untrack(() => still)) drop = DROP;
		placed = true;
		invalidate();
	});

	useTask(
		(delta) => {
			if (!disc || !tonearm) return;
			const on = spinning && item !== undefined;
			const goal = on ? reach : REST;
			const pace = on && !still ? SPEED : 0;
			if (settled && arm === goal && speed === pace && drop === 0) return;
			const ease = (/** @type {number} */ rate) => (still ? 1 : 1 - Math.exp(-delta * rate));
			speed += (pace - speed) * ease(2.2);
			arm += (goal - arm) * ease(2.6);
			drop -= drop * ease(7);
			if (Math.abs(pace - speed) < 1e-3) speed = pace;
			if (Math.abs(goal - arm) < 1e-4) arm = goal;
			if (drop < 1e-5) drop = 0;
			settled = speed === 0 && arm === goal && drop === 0;
			disc.rotation.y -= delta * speed;
			disc.position.y = DISC_Y + drop;
			tonearm.rotation.y = arm;
			tonearm.position.y = ARM_Y + Math.min(1, Math.abs(goal - arm) * 5) * CUE;
			invalidate();
		},
		{ autoInvalidate: false }
	);
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

	<T.Group bind:ref={disc} position={[CENTER[0], DISC_Y, CENTER[1]]}>
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
		<T.Group bind:ref={tonearm} rotation.y={REST} position.y={ARM_Y}>
			<T.Mesh material={steel} position.z={length / 2} rotation.x={Math.PI / 2} castShadow>
				<T.CylinderGeometry args={[0.0028, 0.0028, length, 10]} />
			</T.Mesh>
			<T.Mesh material={rubber} position={[0, -0.006, length]} castShadow>
				<T.BoxGeometry args={[0.014, 0.008, 0.026]} />
			</T.Mesh>
			<T.Mesh material={rubber} position={[0, 0.002, -0.035]} rotation.x={Math.PI / 2} castShadow>
				<T.CylinderGeometry args={[0.012, 0.012, 0.02, 20]} />
			</T.Mesh>
		</T.Group>
	</T.Group>

	<T.Mesh material={steel} position={[cradle[0], BASE + (ARM_Y - 0.004) / 2, cradle[1]]} castShadow>
		<T.CylinderGeometry args={[0.0035, 0.0045, ARM_Y - 0.004, 12]} />
	</T.Mesh>

	{#each [0.15, 0.185] as kx (kx)}
		<T.Mesh material={steel} position={[kx, BASE + 0.004, 0.12]} castShadow>
			<T.CylinderGeometry args={[0.01, 0.011, 0.008, 24]} />
		</T.Mesh>
	{/each}

	<T.Mesh
		material={hitbox}
		position.y={DECK.h / 2}
		onclick={(/** @type {any} */ event) => {
			event.stopPropagation();
			if (event.delta > 6) return;
			onpick();
		}}
		onpointerenter={(/** @type {any} */ event) => {
			event.stopPropagation();
			onhover(true);
		}}
		onpointerleave={() => onhover(false)}
	>
		<T.BoxGeometry args={[W, DECK.h, D]} />
	</T.Mesh>
</T.Group>
