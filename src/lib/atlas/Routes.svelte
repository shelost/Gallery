<script>
	import { ROUTE_KINDS } from './atlas.js';
	import { CROSSED_SWORDS } from './paths.js';

	/**
	 * Campaign arrows over a map, in its pixels. Each route reveals along its length after its
	 * delay and its dashes keep marching; a battle is stamped where a route lands.
	 * @type {{
	 *   routes: { id: string, kind: import('./atlas.js').RouteKind, color: string, d: string, head: string, delay: number }[],
	 *   battles: { id: string, x: number, y: number, delay: number }[],
	 *   width: number,
	 *   height: number,
	 *   draw: number
	 * }}
	 */
	let { routes, battles, width, height, draw } = $props();

	const uid = $props.id();

	/** One dash and gap: how far the dashes march per loop. @param {string} dash */
	const period = (dash) => dash.split(' ').reduce((sum, v) => sum + Number(v), 0);
</script>

<svg class="routes" viewBox="0 0 {width} {height}" style:--draw="{draw}s" aria-hidden="true">
	<defs>
		{#each routes as route (route.id)}
			<mask id="{uid}-{route.id}" maskUnits="userSpaceOnUse" x="0" y="0" {width} {height}>
				<path class="reveal" d={route.d} pathLength="100" style:--delay="{route.delay}s" />
			</mask>
		{/each}
	</defs>

	{#each routes as route (route.id)}
		{@const kind = ROUTE_KINDS[route.kind]}
		<g
			class={['route', route.kind]}
			style:--c={route.color}
			style:--delay="{route.delay}s"
			style:--dash={kind.dash}
			style:--w="{kind.width}px"
			style:--period="{period(kind.dash)}px"
		>
			<g mask="url(#{uid}-{route.id})">
				<path class="casing" d={route.d} />
				<path class="line" d={route.d} />
			</g>
			<path class="head" d={route.head} />
		</g>
	{/each}

	{#each battles as battle (battle.id)}
		<g class="battle" transform="translate({battle.x} {battle.y})" style:--delay="{battle.delay}s">
			<g class="mark">
				<circle class="pulse" r="9" />
				<circle class="disc" r="8.5" />
				<path class="swords" d={CROSSED_SWORDS} transform="scale(5)" />
			</g>
		</g>
	{/each}
</svg>

<style>
	.routes {
		position: absolute;
		z-index: 2;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	.reveal {
		fill: none;
		stroke: #fff;
		stroke-width: 22;
		stroke-dasharray: 100 100;
		animation: reveal var(--draw) cubic-bezier(0.45, 0.05, 0.35, 1) var(--delay) both;
	}

	.casing,
	.line {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.casing {
		stroke: var(--paper);
		stroke-opacity: 0.75;
		stroke-width: calc(var(--w) + 3px);
	}

	.line {
		stroke: var(--c);
		stroke-width: var(--w);
		stroke-dasharray: var(--dash);
		animation: march 0.85s linear infinite;
	}

	.retreat .casing {
		stroke-opacity: 0.45;
	}

	.retreat .line {
		animation-duration: 1.3s;
	}

	.head {
		fill: var(--c);
		stroke: var(--paper);
		stroke-opacity: 0.8;
		stroke-width: 1.2;
		paint-order: stroke;
		animation: fade-in 260ms var(--ease-out) calc(var(--delay) + var(--draw) * 0.86) both;
	}

	.battle {
		animation: fade-in 320ms var(--ease-out) var(--delay) both;
	}

	.mark {
		transform-box: fill-box;
		transform-origin: center;
		animation: stamp 420ms cubic-bezier(0.3, 1.6, 0.5, 1) var(--delay) both;
	}

	.disc {
		fill: color-mix(in srgb, var(--paper) 88%, transparent);
		stroke: var(--ink);
		stroke-width: 1.2;
	}

	.pulse {
		fill: none;
		stroke: var(--accent);
		stroke-width: 1.4;
		transform-box: fill-box;
		transform-origin: center;
		animation: pulse 2.2s ease-out calc(var(--delay) + 0.4s) infinite both;
	}

	.swords {
		fill: none;
		stroke: var(--ink);
		stroke-width: 0.24;
		stroke-linecap: round;
	}

	@keyframes reveal {
		from {
			stroke-dashoffset: 100;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes march {
		to {
			stroke-dashoffset: calc(-1 * var(--period));
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes stamp {
		from {
			transform: scale(0.3);
		}
	}

	@keyframes pulse {
		from {
			transform: scale(1);
			opacity: 0.85;
		}
		to {
			transform: scale(2.4);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal,
		.line,
		.head,
		.battle,
		.mark {
			animation: none;
		}

		.reveal {
			stroke-dasharray: none;
		}

		.pulse {
			display: none;
		}
	}
</style>
