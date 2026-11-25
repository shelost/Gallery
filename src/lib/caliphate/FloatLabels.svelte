<script>
	/**
	 * Screen-space names for map cities. The canvas keeps the dots; these
	 * float above the relief so the letters never warp with the hills.
	 * @type {{ pins?: { name: string, x: number, y: number, glow?: boolean, kind?: string, flag?: string }[] }}
	 */
	let { pins = [] } = $props();
</script>

{#if pins.length}
	<div class="pins" aria-hidden="true">
		{#each pins as pin (`${pin.kind}-${pin.name}`)}
			<span
				class={['pin', pin.glow && 'glow', pin.kind === 'region' && 'region']}
				style:left="{pin.x}%"
				style:top="{pin.y}%"
			>
				{#if pin.flag}
					<img class="mark flag" src="/blog/caliphate/flags/{pin.flag}.png" alt="" />
				{/if}
				<em>{pin.name}</em>
				<i></i>
			</span>
		{/each}
	</div>
{/if}

<style>
	.pins {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 2;
	}

	.pin {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		transform: translate(-50%, calc(-100% + 1px));
		filter: drop-shadow(0 1px 2px rgba(20, 16, 10, 0.38));
	}

	.pin.region {
		transform: translate(-50%, -50%);
	}

	.mark {
		display: block;
		width: 1.15rem;
		height: 0.76rem;
		margin-bottom: 0.15rem;
		object-fit: cover;
		border-radius: 2px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.35);
	}

	.pin em {
		padding: 0.14em 0.45em 0.16em;
		border-radius: 4px;
		background: rgba(28, 27, 24, 0.8);
		color: #f4efe6;
		font: 600 0.62rem/1.2 Iowan Old Style, Palatino, Georgia, serif;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.pin i {
		width: 1.5px;
		height: 11px;
		background: linear-gradient(180deg, rgba(28, 27, 24, 0.55), rgba(28, 27, 24, 0.12));
		border-radius: 1px;
	}

	.pin.region i {
		display: none;
	}

	.pin.glow em {
		background: rgba(42, 32, 12, 0.86);
		color: #f3e2b0;
		box-shadow: 0 0 0 1px rgba(230, 195, 106, 0.5);
	}

	.pin.glow i {
		background: linear-gradient(180deg, rgba(230, 195, 106, 0.7), rgba(230, 195, 106, 0.12));
	}

	@media (max-width: 640px) {
		.pin em {
			font-size: 0.55rem;
			padding: 0.1em 0.35em 0.12em;
		}

		.pin i {
			height: 8px;
		}
	}
</style>
