import { Delaunay } from 'd3-delaunay';
import { albers } from './projection.js';

/**
 * A historical atlas: borders drawn from who held which city in which year, the way the
 * kingdom map does it. Each site claims the land nearest it (its Voronoi cell), never farther
 * than its reach, and is washed in its holder's colour; neighbouring cells of one holder read
 * as one realm. Everything is in projected map units.
 *
 * @typedef {[number, number]} Point
 * @typedef {[number, string | null, '?'?]} Hold from this year, held by this polity (or no one); '?' marks a client or contested hold, drawn fainter
 * @typedef {{ id: string, name: string, lon: number, lat: number, r?: number, h: Hold[] }} SiteDef
 * @typedef {{ label: string, color: string, eras?: [number, string][] }} Polity eras rename a polity from a year on (Parthian, then Sasanian) without recolouring it
 * @typedef {{ year: number, text: string }} AtlasEvent
 * @typedef {{ polity: string, year: number, label: string, text: string }} Peak
 * @typedef {{ id: string, name: string, lon: number, lat: number, from?: number, to?: number, names?: [number, string][], capital?: [number, number] }} PlaceDef
 * @typedef {'march' | 'retreat'} RouteKind
 * @typedef {{ id: string, side: string, label: string, points: (string | [number, number])[], kind?: RouteKind, battle?: string, bend?: number, order?: number }} RouteDef
 * @typedef {{ text: string, lon: number, lat: number, angle?: number, kind: 'sea' | 'river' | 'range' | 'region' }} GeoLabelDef
 * @typedef {{ polity: string | null, disputed: boolean }} Holding
 * @typedef {{ key: string, polity: string, label: string, spots: Point[], size: number, minor: boolean }} Realm spots are where its name may sit, most central first
 */

const DEFAULT_REACH = 42;
const CIRCLE_SIDES = 28;
/** A run this small only gets a label when it is the polity's only ground. */
const MINOR_RUN = 3;
/** How many of a realm's most central sites its name may choose between. */
const REALM_SPOTS = 24;

/** How each kind of route is drawn, in screen pixels. */
export const ROUTE_KINDS = {
	march: { label: 'Advance', dash: '8 5', width: 2.4 },
	retreat: { label: 'Retreat', dash: '2 6', width: 2 }
};

/** 53 BC, 116 AD. There is no year zero; the slider passes it as 1 AD. @param {number} year */
export function formatYear(year) {
	return year < 0 ? `${-year} BC` : `${Math.max(year, 1)} AD`;
}

/**
 * Sutherland–Hodgman: a convex Voronoi cell cut by a convex polygon (the reach circle).
 * @param {Point[]} subject @param {Point[]} clipper
 */
function clipConvex(subject, clipper) {
	let out = subject;
	for (let i = 0; i < clipper.length && out.length; i++) {
		const a = clipper[i];
		const b = clipper[(i + 1) % clipper.length];
		/** @param {Point} p */
		const inside = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
		/** @param {Point} p @param {Point} q @returns {Point} */
		const cross = (p, q) => {
			const d1 = [q[0] - p[0], q[1] - p[1]];
			const d2 = [b[0] - a[0], b[1] - a[1]];
			const t = ((a[0] - p[0]) * d2[1] - (a[1] - p[1]) * d2[0]) / (d1[0] * d2[1] - d1[1] * d2[0]);
			return [p[0] + t * d1[0], p[1] + t * d1[1]];
		};
		const input = out;
		out = [];
		for (let j = 0; j < input.length; j++) {
			const p = input[j];
			const q = input[(j + 1) % input.length];
			if (inside(q)) {
				if (!inside(p)) out.push(cross(p, q));
				out.push(q);
			} else if (inside(p)) {
				out.push(cross(p, q));
			}
		}
	}
	return out;
}

/** @param {Point} centre @param {number} r @returns {Point[]} */
function circle([cx, cy], r) {
	return Array.from({ length: CIRCLE_SIDES }, (_, i) => {
		const a = (i / CIRCLE_SIDES) * Math.PI * 2;
		return /** @type {Point} */ ([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
	});
}

/**
 * @param {{
 *   frame: import('./projection.js').Frame,
 *   geo: { LAND: string, LAKES: string, RIVERS: string },
 *   range: { from: number, to: number },
 *   polities: Record<string, Polity>,
 *   sites: SiteDef[],
 *   events: AtlasEvent[],
 *   peaks: Peak[],
 *   places: PlaceDef[],
 *   routes: RouteDef[],
 *   labels: GeoLabelDef[],
 *   highlights: string[]
 * }} spec
 */
export function createAtlas(spec) {
	const { project, view, graticule } = albers(spec.frame);
	const { polities, events, peaks, range, highlights } = spec;

	const points = spec.sites.map((s) => project(s.lon, s.lat));
	const reach = spec.sites.map((s) => s.r ?? DEFAULT_REACH);
	const delaunay = Delaunay.from(points);
	const voronoi = delaunay.voronoi([view.x - 200, view.y - 200, view.x + view.w + 200, view.y + view.h + 200]);
	const sites = spec.sites.map((s, i) => {
		const ring = /** @type {Point[]} */ (voronoi.cellPolygon(i)).slice(0, -1);
		const cell = clipConvex(ring, circle(points[i], reach[i]));
		const xs = cell.map((p) => p[0]);
		const ys = cell.map((p) => p[1]);
		return {
			id: s.id,
			name: s.name,
			x: points[i][0],
			y: points[i][1],
			h: s.h,
			/** the site's land: its Voronoi cell inside its reach, as an SVG path */
			d: cell.length ? `M${cell.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z` : '',
			box: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) },
			/** Delaunay neighbours whose reaches overlap this one */
			near: [...delaunay.neighbors(i)].filter(
				(j) => Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]) < reach[i] + reach[j]
			)
		};
	});

	/** Years a holding actually changes: a scrub only repaints when it crosses one. */
	const changes = [...new Set(spec.sites.flatMap((s) => s.h.map(([from]) => from)))].sort((a, b) => a - b);
	/** @type {Map<number, Holding[]>} */
	const cache = new Map();

	/** @param {number} year */
	function settled(year) {
		return changes.findLast((change) => change <= year) ?? changes[0];
	}

	/** Who holds each site, cached by the last change so a scrub does not rebuild it. @param {number} year */
	function holdingsAt(year) {
		const key = settled(year);
		let hit = cache.get(key);
		if (!hit) {
			hit = sites.map(({ h }) => {
				const row = h.findLast(([from]) => from <= key);
				return { polity: row?.[1] ?? null, disputed: row?.[2] === '?' };
			});
			cache.set(key, hit);
		}
		return hit;
	}

	/** @param {string} id @param {number} year */
	function polityName(id, year) {
		const polity = polities[id];
		return polity.eras?.findLast(([from]) => from <= year)?.[1] ?? polity.label;
	}

	/**
	 * Each connected run of same-holder sites is one realm, labelled on one of its most central
	 * sites so an empire wrapped around a sea is not named in the water; the renderer picks the
	 * first of those that clears its markers. Besides each polity's largest run, only runs at
	 * least half its size are named, and never ones held only by clients or occupiers. Given a
	 * crop, a realm is labelled on the part of it in view, and not at all when none is.
	 * @param {number} year @param {Holding[]} holdings @param {import('./projection.js').View} [within]
	 * @returns {Realm[]}
	 */
	function realmsAt(year, holdings, within) {
		/** @param {number} i */
		const shown = (i) =>
			!within ||
			(sites[i].x > within.x && sites[i].x < within.x + within.w && sites[i].y > within.y && sites[i].y < within.y + within.h);
		/** @type {{ polity: string, members: number[] }[]} */
		const runs = [];
		const seen = new Set();
		sites.forEach((_, start) => {
			const polity = holdings[start].polity;
			if (!polity || seen.has(start)) return;
			const members = [];
			const queue = [start];
			seen.add(start);
			while (queue.length) {
				const i = /** @type {number} */ (queue.pop());
				members.push(i);
				for (const j of sites[i].near) {
					if (!seen.has(j) && holdings[j].polity === polity) {
						seen.add(j);
						queue.push(j);
					}
				}
			}
			runs.push({ polity, members });
		});

		/** @type {Map<string, number>} */
		const largest = new Map();
		for (const run of runs) largest.set(run.polity, Math.max(largest.get(run.polity) ?? 0, run.members.length));

		/** @type {Realm[]} */
		const realms = [];
		const named = new Set();
		for (const { polity, members } of runs) {
			const most = largest.get(polity) ?? 0;
			const isLargest = members.length === most && !named.has(polity);
			const minor = members.length < MINOR_RUN || members.every((i) => holdings[i].disputed);
			if (!isLargest && (minor || members.length * 2 < most)) continue;
			named.add(polity);
			const visible = members.filter(shown);
			if (!visible.length) continue;
			const cx = visible.reduce((sum, i) => sum + sites[i].x, 0) / visible.length;
			const cy = visible.reduce((sum, i) => sum + sites[i].y, 0) / visible.length;
			/** @param {number} i */
			const offCentre = (i) => Math.hypot(sites[i].x - cx, sites[i].y - cy);
			realms.push({
				key: `${polity}:${sites[members[0]].id}`,
				polity,
				label: polityName(polity, year),
				spots: visible
					.toSorted((a, b) => offCentre(a) - offCentre(b))
					.slice(0, REALM_SPOTS)
					.map((i) => /** @type {Point} */ ([sites[i].x, sites[i].y])),
				size: members.length,
				minor
			});
		}
		return realms;
	}

	/** The latest event at or before `year`. @param {number} year */
	function eventAt(year) {
		return events.findLast((e) => e.year <= year) ?? null;
	}

	/** @param {Point} p */
	const nearestSite = ([x, y]) =>
		sites.reduce((best, s, i) => (Math.hypot(s.x - x, s.y - y) < Math.hypot(sites[best].x - x, sites[best].y - y) ? i : best), 0);

	const places = Object.fromEntries(
		spec.places.map((p) => {
			const [x, y] = project(p.lon, p.lat);
			const own = sites.findIndex((s) => s.id === p.id);
			return [p.id, { ...p, x, y, site: own >= 0 ? own : nearestSite([x, y]) }];
		})
	);

	/** @typedef {(typeof places)[string]} Place */

	/**
	 * A place as it stands in `year`: its name then, whether it is a capital, and who holds it.
	 * Null before it is founded or after it is gone.
	 * @param {Place} place @param {number} year
	 */
	function placeAt(place, year) {
		if ((place.from ?? -Infinity) > year || (place.to ?? Infinity) < year) return null;
		return {
			name: place.names?.findLast(([from]) => from <= year)?.[1] ?? place.name,
			capital: !!place.capital && place.capital[0] <= year && year <= place.capital[1],
			holding: holdingsAt(year)[place.site]
		};
	}

	const routes = Object.fromEntries(spec.routes.map((r) => [r.id, r]));

	/** A route's stops in map units. @param {RouteDef} route @returns {Point[]} */
	function routePoints(route) {
		return route.points.map((p) => (typeof p === 'string' ? [places[p].x, places[p].y] : project(p[0], p[1])));
	}

	/** @param {RouteDef} route */
	function routePlaceIds(route) {
		return route.points.filter((p) => typeof p === 'string').filter((id) => id in places);
	}

	const labels = spec.labels.map((l) => {
		const [x, y] = project(l.lon, l.lat);
		return { ...l, x, y };
	});

	return {
		view,
		range,
		polities,
		events,
		peaks,
		highlights,
		sites,
		places,
		routes,
		labels,
		geo: { land: spec.geo.LAND, lakes: spec.geo.LAKES, rivers: spec.geo.RIVERS, graticule: graticule(5) },
		holdingsAt,
		realmsAt,
		polityName,
		eventAt,
		placeAt,
		routePoints,
		routePlaceIds
	};
}

/** @typedef {ReturnType<typeof createAtlas>} Atlas */
