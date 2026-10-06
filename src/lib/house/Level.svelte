<script>
	import { HTML } from '@threlte/extras';
	import Furniture from './Furniture.svelte';
	import Layer from './Layer.svelte';
	import Solid from './Solid.svelte';
	import { FINISH, area, middle, storey } from './geometry.js';

	/**
	 * @type {{
	 *   house: import('./plan.js').House,
	 *   index: number,
	 *   elevation: number,
	 *   hidden?: boolean,
	 *   exploded?: boolean,
	 *   active?: boolean,
	 *   hovered?: string | null,
	 *   selected?: string | null,
	 *   onhover?: (id: string | null) => void,
	 *   onpick?: (id: string) => void
	 * }}
	 */
	let {
		house,
		index,
		elevation,
		hidden = false,
		exploded = false,
		active = false,
		hovered = null,
		selected = null,
		onhover,
		onpick
	} = $props();

	const floor = $derived(house.floors[index]);
	const parts = $derived(storey(house, index));
	const lit = $derived(parts.tiles.filter(({ room }) => room.id === hovered || room.id === selected));

	/** Walls catch the pointer, so a room behind a wall doesn't light up. */
	const occlude = () => {};

	/** @param {string} id */
	const enter = (id) => active && onhover?.(id);
	/** @param {string} id */
	const leave = (id) => active && hovered === id && onhover?.(null);
	/** @param {string} id @param {{ delta: number }} event */
	const click = (id, event) => active && event.delta < 4 && onpick?.(id);
</script>

<Layer {index} {elevation} {hidden} {exploded}>
	{#snippet children(paints)}
		{#each parts.tiles as tile (tile.key)}
			<Solid
				size={tile.size}
				at={tile.at}
				material={paints[tile.room.finish]}
				cast={false}
				onpointerenter={() => enter(tile.room.id)}
				onpointerleave={() => leave(tile.room.id)}
				onclick={(/** @type {{ delta: number }} */ event) => click(tile.room.id, event)}
			/>
		{/each}

		{#each lit as tile (tile.key)}
			<Solid
				size={[tile.size[0], 0.004, tile.size[2]]}
				at={[tile.at[0], FINISH + 0.003, tile.at[2]]}
				material={paints.highlight}
				cast={false}
				receive={false}
			/>
		{/each}

		{#each parts.solids as solid, i (i)}
			<Solid
				size={solid.size}
				at={solid.at}
				material={paints[solid.finish]}
				cast={solid.cast ?? true}
				onpointerenter={solid.occludes ? occlude : undefined}
			/>
		{/each}

		{#each floor.furniture as item, i (i)}
			<Furniture {item} {paints} />
		{/each}

		{#if active}
			{#each floor.rooms as room (room.id)}
				{@const [x, z] = room.label ?? middle(room.rect)}
				<HTML position={[x, 0.1, z]} center pointerEvents="none" zIndexRange={[10, 0]}>
					<span class={['tag', (room.id === hovered || room.id === selected) && 'lit']}>
						{room.name}
						<em>{area(room.rect).toFixed(1)} m²</em>
					</span>
				</HTML>
			{/each}
		{/if}
	{/snippet}
</Layer>

<style>
	.tag {
		display: inline-flex;
		align-items: baseline;
		gap: 0.45em;
		padding: 0.3em 0.7em 0.32em;
		border-radius: 999px;
		background: color-mix(in srgb, var(--paper) 88%, transparent);
		box-shadow:
			0 0 0 1px var(--rule),
			0 2px 8px rgb(28 27 24 / 0.08);
		backdrop-filter: blur(6px);
		color: var(--ink);
		font: 400 11px/1 var(--sans);
		letter-spacing: 0;
		white-space: nowrap;
		animation: tag-in 220ms var(--ease-out) both;
		transition:
			background-color 150ms ease-out,
			color 150ms ease-out;
	}

	.tag em {
		color: var(--ink-3);
		font: 400 10px/1 var(--mono);
		font-style: normal;
		transition: color 150ms ease-out;
	}

	.tag.lit {
		background: var(--ink);
		color: var(--paper);
	}

	.tag.lit em {
		color: color-mix(in srgb, var(--paper) 60%, transparent);
	}

	@keyframes tag-in {
		from {
			opacity: 0;
			transform: translateY(3px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tag {
			animation: none;
		}
	}
</style>
