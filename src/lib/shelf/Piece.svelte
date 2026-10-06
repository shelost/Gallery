<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { BoxGeometry, Color, MeshStandardMaterial } from 'three';
	import { cover } from './covers.js';

	/**
	 * A recommendation standing face-out on a board, leaning back against the wall.
	 * It slides forward and stands up straight while it's hovered or open.
	 * @type {{ piece: import('./layout.js').ItemPiece, lifted: boolean, still: boolean, onpick: () => void, onhover: (on: boolean) => void }}
	 */
	let { piece, lifted, still, onpick, onhover } = $props();

	const LEAN = 0.09;

	const geometry = $derived(new BoxGeometry(piece.w, piece.h, piece.d));
	const materials = $derived.by(() => {
		const tone = new Color(piece.item.tone);
		const edge = new MeshStandardMaterial({ color: tone.clone().multiplyScalar(0.72), roughness: 0.7 });
		const top = new MeshStandardMaterial({ color: tone.clone().lerp(new Color('#ffffff'), 0.25), roughness: 0.7 });
		const front = new MeshStandardMaterial({
			map: cover(piece.item, piece.format, piece.i, piece.w, piece.h),
			roughness: piece.format === 'cd' || piece.format === 'dvd' ? 0.32 : 0.62
		});
		return [edge, edge, top, top, front, edge];
	});

	$effect(() => {
		const used = geometry;
		return () => used.dispose();
	});

	$effect(() => {
		const used = materials;
		return () => {
			used[4].map?.dispose();
			for (const material of new Set(used)) material.dispose();
		};
	});

	/** How far the base sits off the wall so the top just touches it. */
	const rest = $derived(Math.sin(LEAN) * piece.h + piece.d / 2 + 0.006);

	/** @type {import('three').Group | undefined} */
	let group = $state();

	const { invalidate } = useThrelte();

	useTask(
		(delta) => {
			if (!group) return;
			const lean = lifted ? 0 : LEAN;
			const z = lifted ? rest + 0.06 : rest;
			if (Math.abs(-lean - group.rotation.x) < 1e-4 && Math.abs(z - group.position.z) < 1e-5) return;
			const t = still ? 1 : 1 - Math.exp(-delta * 12);
			group.rotation.x += (-lean - group.rotation.x) * t;
			group.position.z += (z - group.position.z) * t;
			invalidate();
		},
		{ autoInvalidate: false }
	);
</script>

<T.Group bind:ref={group} oncreate={(ref) => ref.position.set(0, 0, rest)} rotation.x={-LEAN}>
	<T.Mesh
		{geometry}
		material={materials}
		position.y={piece.h / 2}
		castShadow
		receiveShadow
		onclick={(/** @type {any} */ event) => {
			event.stopPropagation();
			onpick();
		}}
		onpointerenter={(/** @type {any} */ event) => {
			event.stopPropagation();
			onhover(true);
		}}
		onpointerleave={() => onhover(false)}
	/>
</T.Group>
