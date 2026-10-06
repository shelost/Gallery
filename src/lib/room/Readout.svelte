<script>
	import { T, useThrelte } from '@threlte/core';
	import { MeshBasicMaterial, PlaneGeometry } from 'three';
	import Box from './Box.svelte';
	import { surface } from './surface.js';

	/**
	 * A device with a lit screen on its front: a desk clock, a counter, a television. `paint`
	 * draws the screen, and it's redrawn whenever anything it reads changes. The body stands
	 * on y = 0, and the screen sits `screen.at` from the center of its face.
	 * @type {{
	 *   size: [number, number, number],
	 *   color: string,
	 *   radius?: number,
	 *   screen: { w: number, h: number, at?: [number, number] },
	 *   paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { size, color, radius = 0.014, screen, paint, children } = $props();

	const { invalidate } = useThrelte();

	const display = $derived(surface(screen.w, screen.h));
	const pane = $derived(new PlaneGeometry(screen.w, screen.h));
	const glow = $derived(new MeshBasicMaterial({ map: display.texture, toneMapped: false, transparent: true }));

	$effect(() => {
		display.paint(paint);
		invalidate();
	});

	$effect(() => {
		const used = { display, pane, glow };
		return () => {
			used.display.texture.dispose();
			used.pane.dispose();
			used.glow.dispose();
		};
	});

	const at = $derived(screen.at ?? [0, 0]);
</script>

<Box {size} {color} {radius} position={[0, size[1] / 2, 0]} />
<T.Mesh geometry={pane} material={glow} position={[at[0], size[1] / 2 + at[1], size[2] / 2 + 0.0008]} />
{@render children?.()}
