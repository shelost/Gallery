<script>
	import Box from './Box.svelte';

	/**
	 * A little tower of jewel cases, spines out, each in its album's colours. The one that's
	 * playing slides half out of its slot. Stands on y = 0, facing +z.
	 * @type {{ items: import('$lib/directions/content.js').ShelfItem[], current: import('$lib/directions/content.js').ShelfItem | undefined, color?: string }}
	 */
	let { items, current, color = '#ffffff' } = $props();

	/** A jewel case lying flat: width, thickness, depth. */
	const CASE = /** @type {[number, number, number]} */ ([0.142, 0.0104, 0.125]);
	const PITCH = 0.0128;
	const WALL = 0.012;
	const INNER = CASE[0] + 0.006;

	const height = $derived(items.length * PITCH + WALL * 2);
	const depth = CASE[2] + 0.012;
</script>

{#each [-1, 1] as side (side)}
	<Box size={[WALL, height, depth]} radius={0.004} {color} position={[(side * (INNER + WALL)) / 2, height / 2, 0]} />
{/each}
<Box size={[INNER + WALL * 2, WALL, depth]} radius={0.004} {color} position={[0, WALL / 2, 0]} />
<Box size={[INNER + WALL * 2, WALL, depth]} radius={0.004} {color} position={[0, height - WALL / 2, 0]} />
<Box size={[INNER, height - WALL * 2, 0.004]} radius={0.001} {color} position={[0, height / 2, -depth / 2 + 0.002]} />

{#each items as item, n (item.title)}
	<Box
		size={CASE}
		radius={0.0025}
		color={item.tone}
		roughness={0.3}
		sheen={0.9}
		position={[0, WALL + PITCH * (n + 0.5), item === current ? 0.06 : 0.004]}
	/>
	<Box
		size={[CASE[0] * 0.5, CASE[1] * 0.3, 0.002]}
		radius={0.0005}
		color={item.ink}
		shadow={false}
		position={[-CASE[0] * 0.18, WALL + PITCH * (n + 0.5), (item === current ? 0.06 : 0.004) + CASE[2] / 2 + 0.0005]}
	/>
{/each}
