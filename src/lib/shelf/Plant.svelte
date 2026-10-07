<script>
	import { T } from '@threlte/core';
	import { MeshStandardMaterial, SphereGeometry } from 'three';

	/**
	 * A plant: a snake plant's blades, a round bush, or a fern's arching fronds, in a pot or, when
	 * it isn't `potted`, growing straight out of the ground.
	 * The randomness is seeded so the plant looks the same on every visit.
	 * @type {{ piece: import('./layout.js').PlantPiece, potted?: boolean }}
	 */
	let { piece, potted = true } = $props();

	const GREENS = ['#2f4a36', '#3e5c44', '#56725a', '#2c4032', '#6d8a62'];

	/** @param {number} seed */
	function random(seed) {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	/** The pot, or without one the patch of ground the plant comes up from. */
	const pot = $derived({
		r: piece.w * 0.36,
		h: potted ? (piece.variant === 'snake' ? 0.11 : 0.085) : 0,
		color: piece.variant === 'bush' ? '#b5653f' : '#ece6da'
	});

	const leaf = new SphereGeometry(1, 18, 12);
	const ceramic = $derived(new MeshStandardMaterial({ color: pot.color, roughness: 0.55 }));
	const soil = new MeshStandardMaterial({ color: '#3a2a1e', roughness: 1 });
	const greens = GREENS.map((color) => new MeshStandardMaterial({ color, roughness: 0.62 }));

	$effect(() => {
		const used = ceramic;
		return () => used.dispose();
	});

	$effect(() => () => {
		leaf.dispose();
		soil.dispose();
		for (const material of greens) material.dispose();
	});

	/** @typedef {{ position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], shift: number, tone: number }} Leaf */

	const leaves = $derived.by(() => {
		const next = random(piece.key.length * 7919 + piece.w * 1e4);
		/** @type {Leaf[]} */
		const out = [];
		if (piece.variant === 'snake') {
			for (let n = 0; n < 8; n++) {
				const len = piece.h * (0.45 + next() * 0.35);
				out.push({
					position: [(next() - 0.5) * pot.r, pot.h, (next() - 0.5) * pot.r],
					rotation: [(next() - 0.5) * 0.4, next() * Math.PI, (next() - 0.5) * 0.45],
					scale: [0.016, len / 2, 0.005],
					shift: len / 2,
					tone: n % GREENS.length
				});
			}
		} else if (piece.variant === 'fern') {
			for (let n = 0; n < 11; n++) {
				const yaw = (n / 11) * Math.PI * 2 + next() * 0.3;
				const len = piece.h * (0.5 + next() * 0.25);
				out.push({
					position: [0, pot.h, 0],
					rotation: [0.9 + next() * 0.35, yaw, 0],
					scale: [0.022, len / 2, 0.004],
					shift: len / 2,
					tone: 1 + (n % 3)
				});
			}
		} else {
			for (let n = 0; n < 14; n++) {
				const r = 0.03 + next() * 0.028;
				const angle = next() * Math.PI * 2;
				const spread = next() * pot.r * 1.2;
				out.push({
					position: [Math.cos(angle) * spread, pot.h + 0.04 + next() * (piece.h - pot.h - 0.08), Math.sin(angle) * spread * 0.7],
					rotation: [0, 0, 0],
					scale: [r, r * 0.9, r],
					shift: 0,
					tone: n % GREENS.length
				});
			}
		}
		return out;
	});
</script>

<T.Group position.z={piece.d / 2 + 0.03}>
	{#if potted}
		<T.Mesh material={ceramic} position.y={pot.h / 2} castShadow receiveShadow>
			<T.CylinderGeometry args={[pot.r, pot.r * 0.78, pot.h, 32]} />
		</T.Mesh>
		<T.Mesh material={soil} position.y={pot.h - 0.006}>
			<T.CylinderGeometry args={[pot.r * 0.92, pot.r * 0.92, 0.004, 32]} />
		</T.Mesh>
	{/if}
	{#each leaves as blade, n (n)}
		<T.Group position={blade.position} rotation={blade.rotation}>
			<T.Mesh geometry={leaf} material={greens[blade.tone]} position.y={blade.shift} scale={blade.scale} castShadow />
		</T.Group>
	{/each}
</T.Group>
