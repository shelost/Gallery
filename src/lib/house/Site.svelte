<script>
	import { T } from '@threlte/core';
	import Solid from './Solid.svelte';
	import { slab } from './geometry.js';
	import { createDrafting } from './materials.js';

	/** @type {{ site: import('./plan.js').Site, grade: number, paints: import('./materials.js').Palette }} */
	let { site, grade, paints } = $props();

	const lot = $derived(slab([0, 0, site.width, site.depth], -grade - 0.6, -grade));
	const drafting = $derived(createDrafting(site.width, site.depth));
	/** BoxGeometry faces: +x, −x, +y, −y, +z, −z. Only the top is drawn on. */
	const ground = $derived([paints.site, paints.site, drafting, paints.site, paints.site, paints.site]);

	$effect(() => {
		const material = drafting;
		return () => {
			material.map?.dispose();
			material.dispose();
		};
	});
</script>

<T.Group position={[-site.width / 2, 0, -site.depth / 2]}>
	<Solid size={lot.size} at={lot.at} material={ground} cast={false} />
	{#each site.paths as path, i (i)}
		{@const block = slab(path.rect, -grade, -grade + (path.height ?? 0.03))}
		<Solid size={block.size} at={block.at} material={paints.paving} cast={false} />
	{/each}
	{#each site.trees as [x, z, radius], i (i)}
		<Solid shape="cylinder" size={[0.07, 1.6]} at={[x, -grade + 0.8, z]} material={paints.walnut} />
		<Solid shape="sphere" size={[radius]} at={[x, -grade + 1.4 + radius * 0.8, z]} material={paints.foliage} />
	{/each}
</T.Group>
