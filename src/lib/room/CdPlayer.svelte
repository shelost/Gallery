<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { MeshPhysicalMaterial } from 'three';
	import { compact } from '$lib/shelf/covers.js';
	import Box from './Box.svelte';

	/**
	 * A portable CD player with a clear lid, the disc that's on turning under it.
	 * Stands on y = 0.
	 * @type {{ item: import('$lib/directions/content.js').ShelfItem | undefined, i?: number, spinning: boolean, color?: string }}
	 */
	let { item, i = 0, spinning, color = '#dcd3f3' } = $props();

	const R = 0.075;
	const H = 0.024;
	/** A CD spins at a few hundred rpm; slower reads better on screen. */
	const SPEED = Math.PI * 1.6;

	const { invalidate } = useThrelte();

	const shell = new MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.5 });
	const lid = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transmission: 0.9, thickness: 0.004, transparent: true, opacity: 0.35 });
	const face = $derived(new MeshPhysicalMaterial({ map: compact(item, i), transparent: true, roughness: 0.25, metalness: 0.35, clearcoat: 0.8 }));
	const edge = new MeshPhysicalMaterial({ color: '#e9edf2', roughness: 0.2, metalness: 0.6 });

	$effect(() => {
		shell.color.set(color);
		invalidate();
	});

	$effect(() => {
		const used = face;
		invalidate();
		return () => {
			used.map?.dispose();
			used.dispose();
		};
	});

	$effect(() => () => {
		for (const material of [shell, lid, edge]) material.dispose();
	});

	/** @type {import('three').Group | undefined} */
	let disc = $state();

	useTask(
		(delta) => {
			if (!disc || !spinning) return;
			disc.rotation.y -= delta * SPEED;
			invalidate();
		},
		{ autoInvalidate: false }
	);
</script>

<T.Mesh material={shell} position.y={H / 2} castShadow receiveShadow>
	<T.CylinderGeometry args={[R, R * 1.02, H, 64]} />
</T.Mesh>

<T.Group bind:ref={disc} position.y={H + 0.0015}>
	<T.Mesh material={[edge, face, edge]} castShadow>
		<T.CylinderGeometry args={[R * 0.82, R * 0.82, 0.0012, 64]} />
	</T.Mesh>
</T.Group>

<T.Mesh material={lid} position.y={H + 0.006}>
	<T.CylinderGeometry args={[R * 0.97, R * 0.97, 0.004, 64]} />
</T.Mesh>

{#each [-0.022, 0, 0.022] as x (x)}
	<Box size={[0.014, 0.006, 0.008]} radius={0.003} color="#ffffff" position={[x, H * 0.55, R * 0.98]} />
{/each}
