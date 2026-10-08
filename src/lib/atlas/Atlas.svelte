<script>
	import { untrack } from 'svelte';
	import { placeLabels, placeNames } from './labels.js';
	import { STAR_GLYPH, arrowHead, curveThrough, pointAlong } from './paths.js';
	import Routes from './Routes.svelte';

	/**
	 * One map of an atlas in one year: coastlines, the territory wash, realm and geography
	 * labels, place markers and, once `live`, campaign routes. Everything is laid out against
	 * `crop`, a box in map units (the whole map by default); `children` draws over the top.
	 * @type {{
	 *   atlas: import('./atlas.js').Atlas,
	 *   year: number,
	 *   label: string,
	 *   crop?: import('./projection.js').View,
	 *   places?: string[],
	 *   routes?: string[],
	 *   live?: boolean,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { atlas, year, label, crop, places = [], routes = [], live = true, children } = $props();

	const uid = $props.id();
	/** Blur on the wash, in map units. */
	const SOFT = 4;
	/** Route timing in seconds: the first route's lead-in, the stagger per `order`, the draw-in. */
	const LEAD = 0.35;
	const STAGGER = 0.6;
	const DRAW = 1.4;
	/** Arrowhead length and the gaps left beside a marker and a battle mark, in px. */
	const HEAD = 7;
	const MARKER_GAP = 6;
	const BATTLE_GAP = 10;
	/** How far a realm name keeps from a route line, in px. */
	const TRAIL = 4;
	/** What covering each thing costs a realm name; a marker or an overlay outweighs a line or a sea's name. */
	const WEIGHT = { marker: 4, overlay: 4, route: 2, geography: 1 };
	const ROUTE_LABEL = 'route:';
	const REALM_LABEL = 'realm:';
	const GEO_LABEL = 'geo:';

	let frame = $derived(crop ?? atlas.view);
	let holdings = $derived(atlas.holdingsAt(year));
	let realms = $derived(atlas.realmsAt(year, holdings, crop));

	/** Only cells near the frame are painted, so a zoomed excerpt blurs a small area. */
	let cells = $derived.by(() => {
		const m = SOFT * 3;
		return atlas.sites.flatMap((site, i) => {
			const { x0, y0, x1, y1 } = site.box;
			const near = x1 > frame.x - m && x0 < frame.x + frame.w + m && y1 > frame.y - m && y0 < frame.y + frame.h + m;
			return site.d && near ? [{ site, i }] : [];
		});
	});

	let shownRoutes = $derived(routes.map((id) => atlas.routes[id]).filter(Boolean));

	/** The map's own places, then every place a route passes through, drawn smaller. */
	let pins = $derived.by(() => {
		const own = new Set(places);
		return [...new Set([...places, ...shownRoutes.flatMap(atlas.routePlaceIds)])].flatMap((id) => {
			const place = atlas.places[id];
			const now = place && atlas.placeAt(place, year);
			return now ? [{ place, now, own: own.has(id) }] : [];
		});
	});

	let width = $state(0);
	let height = $state(0);

	/** @param {number} x */
	const left = (x) => ((x - frame.x) / frame.w) * 100;
	/** @param {number} y */
	const top = (y) => ((y - frame.y) / frame.h) * 100;
	/** @param {[number, number]} point @returns {[number, number]} */
	const px = ([x, y]) => [((x - frame.x) / frame.w) * width, ((y - frame.y) / frame.h) * height];
	/** @param {string | null} polity */
	const color = (polity) => (polity ? atlas.polities[polity].color : 'var(--ink-3)');
	/** A marker's radius in px. @param {{ capital: boolean }} now @param {boolean} own */
	const radius = (now, own) => (now.capital ? 6 : own ? 4 : 3);

	let drawn = $derived.by(() => {
		if (!width || !height) return [];
		return shownRoutes.flatMap((route, i) => {
			const first = route.points[0];
			const last = route.points.at(-1);
			const curve = curveThrough(atlas.routePoints(route).map(px), {
				startGap: typeof first === 'string' ? MARKER_GAP : 0,
				endGap: (typeof last !== 'string' ? 0 : last === route.battle ? BATTLE_GAP : MARKER_GAP) + HEAD,
				bend: route.bend ?? 1
			});
			if (!curve) return [];
			const line = {
				id: route.id,
				kind: route.kind ?? 'march',
				color: color(route.side),
				d: curve.d,
				head: arrowHead(curve.samples, HEAD),
				delay: LEAD + (route.order ?? i) * STAGGER
			};
			return [{ route, line, samples: curve.samples, anchor: pointAlong(curve.samples, 0.5) }];
		});
	});

	/** One crossed-swords mark per battle, stamped when the first route into it lands. */
	let battles = $derived.by(() => {
		/** @type {Record<string, { id: string, x: number, y: number, delay: number }>} */
		const marks = {};
		for (const { route, line } of drawn) {
			const place = route.battle ? atlas.places[route.battle] : undefined;
			if (!place) continue;
			const delay = line.delay + DRAW;
			if (marks[place.id] && marks[place.id].delay <= delay) continue;
			const [x, y] = px([place.x, place.y]);
			marks[place.id] = { id: place.id, x, y, delay };
		}
		return Object.values(marks);
	});

	/** @type {Record<string, import('./labels.js').LabelSpot>} */
	let spots = $state({});
	/** Which of its spots each realm's name took, by realm key. @type {Record<string, number>} */
	let names = $state({});
	/** @type {Record<string, HTMLElement>} */
	const labelEls = {};
	/** @type {HTMLElement | undefined} */
	let root;

	/** @param {string} id @returns {import('svelte/attachments').Attachment<HTMLElement>} */
	const measure = (id) => (el) => {
		labelEls[id] = el;
		return () => delete labelEls[id];
	};

	/** @type {import('svelte/attachments').Attachment<HTMLElement>} */
	const holdRoot = (el) => {
		root = el;
		return () => (root = undefined);
	};

	/**
	 * Where an element sits within the map, rotation included.
	 * @param {Element} el @param {DOMRect} origin the map's own rect @param {number} weight
	 * @returns {import('./labels.js').Obstacle}
	 */
	function boxOf(el, origin, weight) {
		const box = el.getBoundingClientRect();
		return {
			left: box.left - origin.left,
			top: box.top - origin.top,
			right: box.right - origin.left,
			bottom: box.bottom - origin.top,
			weight
		};
	}

	/** @param {number} x @param {number} y @param {number} r @param {number} weight @returns {import('./labels.js').Obstacle} */
	const square = (x, y, r, weight) => ({ left: x - r, top: y - r, right: x + r, bottom: y + r, weight });

	/** What the label layout depends on: which labels show and what they say, not their colours. */
	let layoutKey = $derived(
		[
			width,
			height,
			...realms.map((realm) => `${REALM_LABEL}${realm.key}:${realm.label}:${realm.spots.join(';')}`),
			...pins.map(({ place, now, own }) => `${place.id}:${now.name}:${now.capital}:${own}`),
			...(live ? drawn.map(({ route }) => ROUTE_LABEL + route.id) : [])
		].join('|')
	);

	/**
	 * Realm names first, the biggest realm choosing first, each kept off the markers, the routes,
	 * the geographic names and anything drawn over the map with `data-atlas-reserve`; then place
	 * and route labels around the markers, kept off the realm names and the overlays.
	 */
	function layout() {
		if (!root) return;
		const origin = root.getBoundingClientRect();
		const markers = pins.map(({ place, now, own }) => {
			const [x, y] = px([place.x, place.y]);
			return { place, now, own, x, y, r: radius(now, own) };
		});
		const geography = atlas.labels.flatMap((geo) => {
			const el = labelEls[GEO_LABEL + geo.text];
			return el ? [boxOf(el, origin, WEIGHT.geography)] : [];
		});
		const overlays = [...root.querySelectorAll('[data-atlas-reserve]')].map((el) => boxOf(el, origin, WEIGHT.overlay));
		const trails = live
			? drawn.flatMap(({ samples }) => samples.map(([x, y]) => square(x, y, TRAIL, WEIGHT.route)))
			: [];
		const strikes = live ? battles.map(({ x, y }) => square(x, y, BATTLE_GAP, WEIGHT.marker)) : [];
		const realmNames = realms
			.toSorted((a, b) => b.size - a.size)
			.flatMap((realm) => {
				const el = labelEls[REALM_LABEL + realm.key];
				return el ? [{ id: realm.key, centres: realm.spots.map(px), w: el.offsetWidth, h: el.offsetHeight }] : [];
			});
		const marks = markers.map(({ x, y, r }) => square(x, y, r, WEIGHT.marker));
		const named = placeNames(realmNames, [...marks, ...strikes, ...overlays, ...trails, ...geography], width, height);
		names = named.chosen;

		/** @type {import('./labels.js').LabelItem[]} */
		const items = markers.flatMap(({ place, now, own, x, y, r }) => {
			const el = labelEls[place.id];
			return el ? [{ id: place.id, x, y, r, w: el.offsetWidth, h: el.offsetHeight, priority: own ? (now.capital ? 4 : 3) : 1 }] : [];
		});
		if (live) {
			for (const { route, anchor } of drawn) {
				const el = labelEls[ROUTE_LABEL + route.id];
				if (!el) continue;
				items.push({ id: ROUTE_LABEL + route.id, ...anchor, r: 3, w: el.offsetWidth, h: el.offsetHeight, priority: 2 });
			}
		}
		spots = placeLabels(items, width, height, [...named.boxes, ...strikes, ...overlays]);
	}

	$effect(() => {
		if (!layoutKey || !width || !height) return;
		untrack(layout);
		let alive = true;
		document.fonts?.ready.then(() => alive && untrack(layout));
		return () => (alive = false);
	});
</script>

<div
	class="atlas"
	style:aspect-ratio="{frame.w} / {frame.h}"
	{@attach holdRoot}
	bind:clientWidth={width}
	bind:clientHeight={height}
	role="img"
	aria-label={label}
>
	<svg
		class="ground"
		viewBox="{frame.x} {frame.y} {frame.w} {frame.h}"
		preserveAspectRatio="xMidYMid slice"
		aria-hidden="true"
	>
		<defs>
			<clipPath id="{uid}-land"><path d={atlas.geo.land} clip-rule="evenodd" /></clipPath>
			<filter id="{uid}-soft" x="-5%" y="-5%" width="110%" height="110%">
				<feGaussianBlur stdDeviation={SOFT} />
			</filter>
		</defs>
		<rect class="sea" x={frame.x} y={frame.y} width={frame.w} height={frame.h} />
		<path class="graticule" d={atlas.geo.graticule} />
		<path class="land" d={atlas.geo.land} />
		<g clip-path="url(#{uid}-land)">
			<g class="cells" filter="url(#{uid}-soft)">
				{#each cells as { site, i } (site.id)}
					{@const hold = holdings[i]}
					<path
						d={site.d}
						class={[hold.disputed && 'disputed', !hold.polity && 'empty']}
						style:--c={hold.polity ? atlas.polities[hold.polity].color : 'transparent'}
					/>
				{/each}
			</g>
		</g>
		<path class="lakes" d={atlas.geo.lakes} />
		<path class="rivers" d={atlas.geo.rivers} />
		<path class="coast" d={atlas.geo.land} />
	</svg>

	<div class="names" aria-hidden="true">
		{#each atlas.labels as geo (geo.text)}
			<span
				class={['geo', geo.kind]}
				style:left="{left(geo.x)}%"
				style:top="{top(geo.y)}%"
				style:rotate="{geo.angle ?? 0}deg"
				{@attach measure(GEO_LABEL + geo.text)}>{geo.text}</span
			>
		{/each}
		{#each realms as realm (realm.key)}
			{@const [x, y] = realm.spots[names[realm.key] ?? 0] ?? realm.spots[0]}
			<span
				class={['realm', realm.minor && 'minor']}
				style:left="{left(x)}%"
				style:top="{top(y)}%"
				style:--c={color(realm.polity)}
				{@attach measure(REALM_LABEL + realm.key)}>{realm.label}</span
			>
		{/each}
	</div>

	{#if live && drawn.length}
		<Routes routes={drawn.map(({ line }) => line)} {battles} {width} {height} draw={DRAW} />
	{/if}

	{#each pins as { place, now, own }, i (place.id)}
		{@const spot = spots[place.id]}
		<span
			class={['pin', now.capital && 'capital', !own && 'extra']}
			style:left="{left(place.x)}%"
			style:top="{top(place.y)}%"
			style:--c={color(now.holding.polity)}
			style:--i={i}
			aria-hidden="true"
		>
			{#if now.capital}
				<svg viewBox="0 0 12 12"><path d={STAR_GLYPH} /></svg>
			{:else}
				<span class="dot"></span>
			{/if}
		</span>
		<span
			class={['place', !own && 'extra', spot && 'placed', spot === null && 'tucked']}
			style:left={spot ? `${spot.left}px` : `calc(${left(place.x)}% + 0.5rem)`}
			style:top={spot ? `${spot.top}px` : `${top(place.y)}%`}
			style:--i={i}
			aria-hidden="true"
			{@attach measure(place.id)}>{now.name}</span
		>
	{/each}

	{#if live}
		{#each drawn as { route, line, anchor } (route.id)}
			{@const spot = spots[ROUTE_LABEL + route.id]}
			<span
				class={['route', spot && 'placed', spot === null && 'tucked']}
				style:left="{spot ? spot.left : anchor.x}px"
				style:top="{spot ? spot.top : anchor.y}px"
				style:--c={line.color}
				style:--delay="{line.delay + DRAW * 0.6}s"
				aria-hidden="true"
				{@attach measure(ROUTE_LABEL + route.id)}>{route.label}</span
			>
		{/each}
	{/if}

	{@render children?.()}
</div>

<style>
	.atlas {
		--sea: #dde3e3;
		--land: #fbfaf6;
		--coast: rgba(28, 27, 24, 0.42);
		--halo: 0 0 4px var(--land), 0 0 2px var(--land), 0 0 1px var(--land);
		position: relative;
		overflow: hidden;
		container-type: inline-size;
		border-radius: 14px;
		background: var(--sea);
		box-shadow:
			0 0 0 1px var(--rule),
			0 18px 32px -22px rgba(28, 27, 24, 0.4);
		font-family: var(--sans);
		letter-spacing: 0;
		line-height: 1.2;
		user-select: none;
		-webkit-user-select: none;
	}

	.ground {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}

	.sea {
		fill: var(--sea);
	}

	.graticule {
		fill: none;
		stroke: rgba(28, 27, 24, 0.08);
		stroke-width: 0.6px;
		vector-effect: non-scaling-stroke;
	}

	.land {
		fill: var(--land);
		fill-rule: evenodd;
	}

	.cells {
		opacity: 0.46;
	}

	.cells path {
		fill: var(--c);
		stroke: var(--c);
		stroke-width: 1.5;
		transition:
			fill 500ms var(--ease-out),
			stroke 500ms var(--ease-out),
			fill-opacity 500ms var(--ease-out),
			stroke-opacity 500ms var(--ease-out);
	}

	.cells .disputed {
		fill-opacity: 0.45;
		stroke-opacity: 0.45;
	}

	.cells .empty {
		fill-opacity: 0;
		stroke-opacity: 0;
	}

	.lakes {
		fill: var(--sea);
		stroke: var(--coast);
		stroke-width: 0.5px;
		vector-effect: non-scaling-stroke;
	}

	.rivers {
		fill: none;
		stroke: #86a5b5;
		stroke-width: 0.9px;
		stroke-linecap: round;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
	}

	.coast {
		fill: none;
		stroke: var(--coast);
		stroke-width: 0.6px;
		vector-effect: non-scaling-stroke;
	}

	.names {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.geo,
	.realm {
		position: absolute;
		translate: -50% -50%;
		white-space: nowrap;
	}

	.geo {
		font-size: clamp(7px, 1.45cqw, 10.5px);
		font-style: italic;
		letter-spacing: 0.14em;
		color: #7a9099;
	}

	.geo.river {
		font-size: clamp(6.5px, 1.25cqw, 9.5px);
		letter-spacing: 0.08em;
		color: #6f93a6;
		text-shadow: var(--halo);
	}

	.geo.range,
	.geo.region {
		font-style: normal;
		font-size: clamp(6px, 1.15cqw, 8.5px);
		font-weight: 500;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: rgba(28, 27, 24, 0.32);
	}

	.realm {
		font-size: clamp(7.5px, 1.7cqw, 12px);
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--c) 72%, var(--ink));
		text-shadow: var(--halo);
		opacity: 0.85;
		transition:
			left 500ms var(--ease-out),
			top 500ms var(--ease-out);
	}

	.realm.minor {
		font-size: clamp(6px, 1.2cqw, 8.5px);
		letter-spacing: 0.14em;
	}

	.pin {
		position: absolute;
		z-index: 1;
		display: grid;
		place-items: center;
		translate: -50% -50%;
		animation: pin-in 520ms var(--ease-out) both;
		animation-delay: calc(var(--i) * 70ms + 150ms);
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--c) 80%, var(--ink));
		box-shadow: 0 0 0 1.5px var(--land);
		transition: background 500ms var(--ease-out);
	}

	.extra .dot {
		width: 5px;
		height: 5px;
	}

	.pin svg {
		display: block;
		width: 13px;
		height: 13px;
		overflow: visible;
		fill: color-mix(in srgb, var(--c) 80%, var(--ink));
		stroke: var(--land);
		stroke-width: 1.4;
		paint-order: stroke;
		transition: fill 500ms var(--ease-out);
	}

	.place,
	.route {
		position: absolute;
		z-index: 3;
		white-space: nowrap;
		pointer-events: none;
		text-shadow: var(--halo);
	}

	.place {
		font-size: clamp(9px, 1.75cqw, 11.5px);
		font-weight: 500;
		color: var(--ink);
		translate: 0 -50%;
		animation: pin-in 520ms var(--ease-out) both;
		animation-delay: calc(var(--i) * 70ms + 210ms);
	}

	.place.extra {
		font-size: clamp(8px, 1.5cqw, 10px);
		font-weight: 400;
		color: var(--ink-2);
	}

	.route {
		font-size: clamp(8px, 1.55cqw, 10.5px);
		font-weight: 600;
		font-style: italic;
		color: color-mix(in srgb, var(--c) 82%, #000);
		translate: -50% -50%;
		animation: label-in 480ms var(--ease-out) var(--delay) both;
	}

	.placed {
		translate: none;
	}

	.tucked {
		visibility: hidden;
	}

	@keyframes pin-in {
		from {
			opacity: 0;
			scale: 0.6;
		}
	}

	@keyframes label-in {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cells path,
		.realm,
		.pin,
		.place,
		.route {
			transition: none;
			animation: none;
		}
	}
</style>
