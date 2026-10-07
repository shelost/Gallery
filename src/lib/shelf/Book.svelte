<script module>
	import { BoxGeometry, MeshBasicMaterial, MeshStandardMaterial } from 'three';

	/** Shared by every book: the block of pages, and the box that catches the pointer. */
	const PAPER = new MeshStandardMaterial({ color: '#f3eee2', roughness: 0.95 });
	const HIDDEN = new MeshBasicMaterial({ visible: false });
</script>

<script>
	import { T } from '@threlte/core';
	import { Color } from 'three';
	import { cover, spine } from './covers.js';

	/**
	 * A book at its real size, standing centered on the origin with its cover facing +z and its
	 * spine at -x: two boards with the cover and its spine printed on them, a little proud of the
	 * pages they hold. The whole book is one target for the pointer.
	 * @type {{ piece: import('./layout.js').ItemPiece, onpick?: () => void, onhover?: (on: boolean) => void }}
	 */
	let { piece, onpick, onhover } = $props();

	const board = $derived(Math.min(0.0026, piece.d * 0.2));
	const parts = $derived.by(() => {
		const { w, h, d } = piece;
		return {
			board: new BoxGeometry(w, h, board),
			back: new BoxGeometry(board, h, d),
			pages: new BoxGeometry(w - board - 0.003, h - 0.005, d - board * 2),
			hit: new BoxGeometry(w, h, d)
		};
	});

	const skins = $derived.by(() => {
		const tone = new Color(piece.item.tone);
		const cloth = new MeshStandardMaterial({ color: tone, roughness: 0.68 });
		const front = new MeshStandardMaterial({ map: cover(piece.item, piece.format, piece.i, piece.w, piece.h), roughness: 0.5 });
		const printed = new MeshStandardMaterial({ map: spine(piece.item, piece.d, piece.h), roughness: 0.6 });
		return {
			front: [cloth, cloth, cloth, cloth, front, cloth],
			back: [cloth, cloth, cloth, cloth, cloth, cloth],
			spine: [cloth, printed, cloth, cloth, cloth, cloth],
			all: [cloth, front, printed]
		};
	});

	$effect(() => {
		const used = parts;
		return () => Object.values(used).forEach((geometry) => geometry.dispose());
	});

	$effect(() => {
		const used = skins;
		return () => {
			for (const material of used.all) {
				material.map?.dispose();
				material.dispose();
			}
		};
	});
</script>

<T.Mesh geometry={parts.board} material={skins.front} position.z={piece.d / 2 - board / 2} castShadow receiveShadow />
<T.Mesh geometry={parts.board} material={skins.back} position.z={-piece.d / 2 + board / 2} castShadow receiveShadow />
<T.Mesh geometry={parts.back} material={skins.spine} position.x={-piece.w / 2 + board / 2} castShadow receiveShadow />
<T.Mesh geometry={parts.pages} material={PAPER} position.x={board / 2 - 0.0015} castShadow receiveShadow />
<T.Mesh
	geometry={parts.hit}
	material={HIDDEN}
	onclick={(/** @type {any} */ event) => {
		if (!onpick) return;
		event.stopPropagation();
		onpick();
	}}
	onpointerenter={(/** @type {any} */ event) => {
		if (!onhover) return;
		event.stopPropagation();
		onhover(true);
	}}
	onpointerleave={() => onhover?.(false)}
/>
