<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { Vector3 } from 'three';
	import Book from '$lib/shelf/Book.svelte';
	import Glide from './Glide.svelte';
	import Lights from './Lights.svelte';

	/** @typedef {import('$lib/shelf/layout.js').ItemPiece} ItemPiece */
	/** @typedef {{ position: [number, number, number], rotation: [number, number, number], scale: number }} Pose */

	/**
	 * The books lying in one stack, biggest at the bottom, each floating a little over the one
	 * under it with its spine turned to you, seen from above the way an isometric drawing is.
	 * Pointing at one slides it out of the stack. Choosing one lifts it out and stands it up
	 * beside the stack, turned to show you its cover, while the books above it settle into its
	 * place. The camera never moves: it frames every way the books can be laid out at once.
	 * @type {{
	 *   books: ItemPiece[],
	 *   selected: number | null,
	 *   hovered: number | null,
	 *   still: boolean,
	 *   onpick: (i: number) => void,
	 *   onhover: (i: number, on: boolean) => void
	 * }}
	 */
	let { books, selected, hovered, still, onpick, onhover } = $props();

	/** Where the camera looks from: round to the front left, and down. */
	const YAW = -0.9;
	const PITCH = 0.55;
	const TOWARD = new Vector3(Math.sin(YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW) * Math.cos(PITCH));
	const RIGHT = new Vector3(Math.cos(YAW), 0, -Math.sin(YAW));
	const UP = new Vector3().crossVectors(TOWARD, RIGHT);
	/** The air between one book and the next, and under the bottom one. */
	const GAP = 0.034;
	const FLOAT = 0.05;
	/** How far a book pointed at slides out, spine first. */
	const PULL = 0.05;
	/** With one chosen, how far the stack steps left and the chosen book stands to the right. */
	const ASIDE = 0.16;
	const SHOWN = 0.22;
	const LARGER = 1.3;

	const { size, invalidate } = useThrelte();
	interactivity({ filter: (hits) => hits.slice(0, 1) });

	/** A steady scatter in [-0.5, 0.5) for the nth book. @param {number} n @param {number} salt */
	const scatter = (n, salt) => {
		const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
		return x - Math.floor(x) - 0.5;
	};

	/** Bottom to top: the biggest covers underneath, the way a stack stays standing. */
	const order = $derived([...books.keys()].sort((a, b) => books[b].w * books[b].h - books[a].w * books[a].h));
	const tall = $derived(books.reduce((sum, piece) => sum + piece.d + GAP, FLOAT));

	/**
	 * Where every book is for one chosen, or none, and one pointed at.
	 * @param {number | null} chosen
	 * @param {number | null} pointed
	 * @returns {Pose[]}
	 */
	function lay(chosen, pointed) {
		const shift = chosen === null ? 0 : -ASIDE;
		/** @type {Pose[]} */
		const poses = [];
		let y = FLOAT;
		for (const [n, i] of order.entries()) {
			if (i === chosen) continue;
			const piece = books[i];
			const pull = i === pointed ? PULL : 0;
			poses[i] = {
				position: [RIGHT.x * shift + scatter(n, 1) * 0.026 - pull, y + piece.d / 2, RIGHT.z * shift + scatter(n, 2) * 0.026],
				rotation: [-Math.PI / 2, scatter(n, 3) * 0.24, 0],
				scale: 1
			};
			y += piece.d + GAP;
		}
		if (chosen !== null) {
			poses[chosen] = {
				position: [RIGHT.x * SHOWN, tall / 2 + 0.02, RIGHT.z * SHOWN],
				rotation: [-PITCH * 0.45, YAW + 0.42, 0],
				scale: LARGER
			};
		}
		return poses;
	}

	const poses = $derived(lay(selected, hovered));

	/** Everything any layout can reach, across the screen and up it, so one framing holds them all. */
	const reach = $derived.by(() => {
		const box = { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity };
		const point = new Vector3();
		for (const chosen of [null, ...books.keys()]) {
			lay(chosen, null).forEach((pose, i) => {
				const piece = books[i];
				const r = (Math.hypot(piece.w, piece.h) / 2) * pose.scale;
				point.set(...pose.position);
				const across = point.dot(RIGHT);
				const up = point.dot(UP);
				box.left = Math.min(box.left, across - r);
				box.right = Math.max(box.right, across + r);
				box.bottom = Math.min(box.bottom, up - r * 0.6);
				box.top = Math.max(box.top, up + r * 0.6);
			});
		}
		return box;
	});

	/** @type {import('three').OrthographicCamera | undefined} */
	let lens = $state();
	/** @type {(import('three').Group | undefined)[]} */
	const bobs = $state([]);
	let framed = { width: 0, height: 0 };
	let clock = 0;

	useTask(
		(delta) => {
			if (!lens) return;
			const { width, height } = size.current;
			if (width !== framed.width || height !== framed.height) {
				framed = { width, height };
				const aspect = width / Math.max(1, height);
				const half = Math.max((reach.top - reach.bottom) / 2, (reach.right - reach.left) / 2 / aspect) * 1.02;
				const target = new Vector3()
					.addScaledVector(RIGHT, (reach.left + reach.right) / 2)
					.addScaledVector(UP, (reach.bottom + reach.top) / 2);
				Object.assign(lens, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
				lens.position.copy(target).addScaledVector(TOWARD, 4);
				lens.lookAt(target);
				lens.updateProjectionMatrix();
				invalidate();
			}
			if (still) return;
			clock += delta;
			bobs.forEach((bob, n) => bob && (bob.position.y = Math.sin(clock * 0.9 + n * 1.7) * 0.0022));
			invalidate();
		},
		{ autoInvalidate: false }
	);
</script>

<T.OrthographicCamera bind:ref={lens} makeDefault near={0.1} far={10} />

<Lights reach={1.3} resolution={2048} />

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
	<T.CircleGeometry args={[1.2, 48]} />
	<T.ShadowMaterial opacity={0.06} />
</T.Mesh>

{#each books as piece, i (piece.key)}
	{@const pose = poses[i]}
	<Glide position={pose.position} rotation={pose.rotation} scale={pose.scale} {still}>
		<T.Group bind:ref={bobs[i]}>
			<Book {piece} onpick={() => onpick(i)} onhover={(on) => onhover(i, on)} />
		</T.Group>
	</Glide>
{/each}
