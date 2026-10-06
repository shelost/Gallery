<script>
	/**
	 * A level meter that dances while something plays and settles flat when it stops.
	 * @type {{ active: boolean, bars?: number, class?: string }}
	 */
	let { active, bars = 14, class: className = '' } = $props();

	/** Each bar gets its own speed and delay so the meter never moves in lockstep. */
	const LEVELS = $derived(
		Array.from({ length: bars }, (_, i) => ({
			speed: 620 + ((i * 137) % 420),
			delay: -((i * 211) % 900),
			peak: 0.45 + ((i * 53) % 55) / 100
		}))
	);
</script>

<span class={['wave', active && 'active', className]} aria-hidden="true">
	{#each LEVELS as level, i (i)}
		<i style:--speed="{level.speed}ms" style:--delay="{level.delay}ms" style:--peak={level.peak}></i>
	{/each}
</span>

<style>
	.wave {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		height: 1.1rem;
	}

	i {
		width: 2px;
		height: 100%;
		border-radius: 1px;
		background: currentColor;
		transform: scaleY(0.12);
		transition: transform 260ms var(--ease-out);
	}

	.active i {
		animation: level var(--speed) var(--delay) ease-in-out infinite alternate;
	}

	@keyframes level {
		from {
			transform: scaleY(0.14);
		}

		to {
			transform: scaleY(var(--peak));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.active i {
			animation: none;
			transform: scaleY(var(--peak));
		}
	}
</style>
