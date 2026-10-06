<script module>
	/** Metres between storeys in the exploded view. */
	export const GAP = 2.4;
	/** How far a storey lifts as it fades away. */
	const LIFT = 1.6;
</script>

<script>
	import { T, useThrelte } from '@threlte/core';
	import { cubicInOut, cubicOut } from 'svelte/easing';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { compose, createPalette, disposePalette, fadePalette } from './materials.js';

	/**
	 * One storey of the stack (or the roof). Owns its materials so it can fade on its own, and
	 * animates its height for the exploded view.
	 * @type {{
	 *   index: number,
	 *   elevation: number,
	 *   hidden?: boolean,
	 *   exploded?: boolean,
	 *   children: import('svelte').Snippet<[import('./materials.js').Paints]>
	 * }}
	 */
	let { index, elevation, hidden = false, exploded = false, children } = $props();

	const { invalidate } = useThrelte();
	const palette = createPalette();
	const paints = compose(palette);

	/** @param {number} ms */
	const timed = (ms) => () => (prefersReducedMotion.current ? 0 : ms);
	const spread = Tween.of(() => (exploded ? 1 : 0), { duration: timed(560), easing: cubicInOut });
	const presence = Tween.of(() => (hidden ? 0 : 1), { duration: timed(320), easing: cubicOut });

	$effect(() => {
		fadePalette(palette, presence.current);
		invalidate();
	});

	$effect(() => () => disposePalette(palette));
</script>

<T.Group
	position.y={elevation + spread.current * index * GAP + (1 - presence.current) * LIFT}
	visible={presence.current > 0.001}
>
	{@render children(paints)}
</T.Group>
