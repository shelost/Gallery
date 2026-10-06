<script module>
	/** Room outlines on a 100 × 46 plan: four rooms upstairs, then Room V, the lobby and Room VI. */
	const PLAN_H = 46;

	/** @type {Record<string, { x: number, y: number, w: number, h: number }>} */
	const PLAN = {
		paper: { x: 0, y: 0, w: 24, h: 22 },
		installations: { x: 25.5, y: 0, w: 24, h: 22 },
		commissions: { x: 51, y: 0, w: 24, h: 22 },
		manuscripts: { x: 76.5, y: 0, w: 23.5, h: 22 },
		time: { x: 0, y: 24, w: 37, h: 22 },
		lobby: { x: 38.5, y: 24, w: 23, h: 22 },
		archive: { x: 63, y: 24, w: 37, h: 22 }
	};
</script>

<script>
	/**
	 * @type {{
	 *   rooms: { id: string, numeral: string, name: string }[],
	 *   current: string,
	 *   onpick: (id: string) => void
	 * }}
	 */
	let { rooms, current, onpick } = $props();

	const here = $derived(PLAN[current] ?? PLAN.lobby);
	const room = $derived(rooms.find((entry) => entry.id === current));
</script>

<nav class="plan" aria-label="Floor plan">
	<div class="map">
		{#each rooms as entry (entry.id)}
			{@const rect = PLAN[entry.id]}
			{#if rect}
				<button
					type="button"
					class={['room', entry.id === current && 'current']}
					style:left="{rect.x}%"
					style:top="{(rect.y / PLAN_H) * 100}%"
					style:width="{rect.w}%"
					style:height="{(rect.h / PLAN_H) * 100}%"
					aria-label={entry.numeral ? `Room ${entry.numeral}, ${entry.name}` : entry.name}
					aria-current={entry.id === current ? 'location' : undefined}
					onclick={() => onpick(entry.id)}
				>
					{entry.numeral || 'Lobby'}
				</button>
			{/if}
		{/each}
		<span class="door" aria-hidden="true"></span>
		<span
			class="you"
			style:transform="translate({here.x + here.w / 2}%, {((here.y + here.h * 0.8) / PLAN_H) * 100}%)"
			aria-hidden="true"
		>
			<span class="dot"></span>
		</span>
	</div>
	{#if room}
		<p class="caption">{room.numeral ? `Room ${room.numeral}, ` : ''}{room.name}</p>
	{/if}
</nav>

<style>
	.plan {
		position: fixed;
		right: 1.25rem;
		bottom: 1.25rem;
		z-index: 80;
		width: 10.5rem;
		padding: 0.7rem 0.7rem 0.55rem;
		border-radius: 12px;
		background: rgba(246, 244, 239, 0.86);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow:
			0 0 0 1px var(--rule),
			0 12px 30px -14px rgba(40, 30, 18, 0.3);
	}

	.map {
		position: relative;
		aspect-ratio: 100 / 46;
	}

	.room {
		position: absolute;
		display: grid;
		place-items: center;
		box-shadow: inset 0 0 0 1px var(--ink-3);
		font-family: var(--serif);
		font-size: 11px;
		line-height: 1;
		color: var(--ink-3);
		transition:
			background-color 160ms var(--ease-out),
			color 160ms var(--ease-out);
	}

	.room.current {
		box-shadow: inset 0 0 0 1px var(--ink);
		background: rgba(168, 67, 43, 0.08);
		color: var(--ink);
	}

	@media (hover: hover) {
		.room:hover {
			background: rgba(28, 27, 24, 0.06);
			color: var(--ink);
		}
	}

	/* The entrance: a gap in the lobby's south wall. */
	.door {
		position: absolute;
		left: 46%;
		bottom: 0;
		width: 8%;
		height: 2px;
		background: #f6f4ef;
	}

	/* The layer is the size of the map, so translate percentages are map percentages. */
	.you {
		position: absolute;
		inset: 0;
		pointer-events: none;
		transition: transform 320ms var(--ease-out);
	}

	.dot {
		position: absolute;
		left: -3px;
		top: -3px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--sanguine);
	}

	.caption {
		margin-top: 0.5rem;
		overflow: hidden;
		font-family: var(--serif);
		font-size: 13px;
		font-style: italic;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: var(--ink-2);
	}

	@media (max-width: 900px) {
		.plan {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.you {
			transition: none;
		}
	}
</style>
