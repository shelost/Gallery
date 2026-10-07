<script module>
	import { TextureLoader } from 'three';

	/** A cartridge's size, standing on its bottom edge with its label to the front. */
	export const CART = { w: 0.1, h: 0.124, d: 0.018 };

	const LABEL = { w: CART.w - 0.016, h: 0.074 };
	const loader = new TextureLoader();
</script>

<script>
	import { T, useThrelte } from '@threlte/core';
	import { BoxGeometry, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
	import Box from './Box.svelte';
	import Glide from './Glide.svelte';
	import { cover } from './surface.js';

	/**
	 * A game cartridge in soft matte plastic: a grip at the top, the game's art as its label,
	 * and a light under it that turns on while it's the one in. It rises while it's `lit`.
	 * @type {{
	 *   image: string | undefined,
	 *   position: [number, number, number],
	 *   rotation?: [number, number, number],
	 *   lit: boolean,
	 *   inserted: boolean,
	 *   still?: boolean,
	 *   onpick: () => void,
	 *   onhover: (on: boolean) => void
	 * }}
	 */
	let { image, position, rotation = [0, 0, 0], lit, inserted, still = false, onpick, onhover } = $props();

	const { invalidate } = useThrelte();

	const art = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 });
	const pane = new PlaneGeometry(LABEL.w, LABEL.h);
	const hit = new BoxGeometry(CART.w, CART.h + 0.04, CART.d + 0.03);
	const hidden = new MeshBasicMaterial({ visible: false });

	$effect(() => {
		if (!image) return;
		let live = true;
		loader.load(image, (texture) => {
			if (!live) return texture.dispose();
			texture.colorSpace = SRGBColorSpace;
			texture.anisotropy = 8;
			cover(texture, LABEL.w / LABEL.h);
			art.map?.dispose();
			art.map = texture;
			art.needsUpdate = true;
			invalidate();
		});
		return () => {
			live = false;
		};
	});

	$effect(() => () => {
		art.map?.dispose();
		art.dispose();
		pane.dispose();
		hit.dispose();
		hidden.dispose();
	});

	const lift = $derived(lit ? 0.04 : inserted ? 0.016 : 0);
</script>

<Glide position={[position[0], position[1] + lift, position[2]]} {rotation} stiffness={170} {still}>
	<Box size={[CART.w, CART.h, CART.d]} radius={0.009} color="#f3f1ec" roughness={0.6} sheen={0.15} position={[0, CART.h / 2, 0]} />
	{#each [0, 1, 2] as n (n)}
		<Box size={[CART.w * 0.46, 0.0022, 0.002]} radius={0.0008} color="#dedbd3" position={[0, CART.h - 0.01 - n * 0.0045, CART.d / 2 + 0.0004]} shadow={false} />
	{/each}
	<T.Mesh geometry={pane} material={art} position={[0, CART.h * 0.47, CART.d / 2 + 0.0008]} />
	<Box
		size={[LABEL.w * 0.4, 0.004, 0.002]}
		radius={0.0012}
		color={inserted ? '#ff004c' : '#d8d5cd'}
		position={[0, 0.013, CART.d / 2 + 0.0004]}
		shadow={false}
	/>
	<T.Mesh
		geometry={hit}
		material={hidden}
		position.y={CART.h / 2}
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
</Glide>
