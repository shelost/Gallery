<script module>
	/** The frame's mouldings from the outside in, as rings around the canvas: how wide, how deep. */
	const RINGS = /** @type {const} */ ([
		{ part: 'fillet', width: 0.008, depth: 0.044 },
		{ part: 'wood', width: 0.052, depth: 0.05 },
		{ part: 'bead', width: 0.011, depth: 0.056 },
		{ part: 'slip', width: 0.028, depth: 0.03 }
	]);

	/** How far the frame reaches past the canvas on every side. */
	export const MARGIN = RINGS.reduce((sum, ring) => sum + ring.width, 0);
</script>

<script>
	import { T } from '@threlte/core';
	import Box from './Box.svelte';
	import { mahogany } from './materials.js';

	/**
	 * A picture frame in the desk's French-polished mahogany: a gilt fillet round the outside, the
	 * wood moulding, a gilt bead standing proud of it on the sight edge, and a linen slip holding
	 * the canvas. The canvas is `w` by `h` meters and printed with `material`; the frame stands on
	 * y = 0 with its back on z = 0.
	 * @type {{ w: number, h: number, material: import('three').Material }}
	 */
	let { w, h, material } = $props();

	const wood = mahogany();
	const LOOK = {
		fillet: { color: '#d6b067', roughness: 0.26, sheen: 0.9 },
		wood: { color: '#ffffff', roughness: 0.28, sheen: 0.8, map: wood },
		bead: { color: '#e0bd72', roughness: 0.22, sheen: 0.95 },
		slip: { color: '#ece4d2', roughness: 0.9, sheen: 0.05 }
	};

	/** Each ring as its four sides: the top and bottom run the full width, the sides fit between. */
	const bars = $derived.by(() => {
		const middle = MARGIN + h / 2;
		let inside = MARGIN;
		return RINGS.flatMap((ring) => {
			const outerW = w + inside * 2;
			const outerH = h + inside * 2;
			inside -= ring.width;
			const along = (outerW - ring.width) / 2;
			const up = (outerH - ring.width) / 2;
			return [
				{ key: `${ring.part}-top`, ring, size: [outerW, ring.width, ring.depth], at: [0, middle + up, ring.depth / 2] },
				{ key: `${ring.part}-bottom`, ring, size: [outerW, ring.width, ring.depth], at: [0, middle - up, ring.depth / 2] },
				{ key: `${ring.part}-left`, ring, size: [ring.width, outerH - ring.width * 2, ring.depth], at: [-along, middle, ring.depth / 2] },
				{ key: `${ring.part}-right`, ring, size: [ring.width, outerH - ring.width * 2, ring.depth], at: [along, middle, ring.depth / 2] }
			];
		});
	});
</script>

<Box size={[w + MARGIN * 2, h + MARGIN * 2, 0.012]} radius={0.004} color="#3b1a0e" roughness={0.8} position={[0, MARGIN + h / 2, 0.006]} />
{#each bars as bar (bar.key)}
	{@const look = LOOK[bar.ring.part]}
	<Box
		size={/** @type {[number, number, number]} */ (bar.size)}
		radius={Math.min(0.006, bar.ring.width * 0.45)}
		color={look.color}
		map={'map' in look ? look.map : undefined}
		roughness={look.roughness}
		sheen={look.sheen}
		position={/** @type {[number, number, number]} */ (bar.at)}
	/>
{/each}
<T.Mesh {material} position={[0, MARGIN + h / 2, 0.022]} receiveShadow>
	<T.PlaneGeometry args={[w, h]} />
</T.Mesh>
