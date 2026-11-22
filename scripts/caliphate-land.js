/**
 * Bakes the Kaliphate essay's land from Natural Earth's 1:50m layers (public domain).
 *
 *   node scripts/caliphate-land.js
 *
 * writes two files:
 *
 * - `src/lib/caliphate/earth.json`: every land polygon, with the lakes layer cut in as holes, cut to the
 *   ground the two sheets and their close-ups can show. It is only ever filled, never
 *   stroked, so the cut edges are invisible.
 * - `src/lib/caliphate/land.json`: today's countries for each side, whole rather than cut (every
 *   view clips rings itself, and these are stroked, so a pre-cut ring would print the box edge as
 *   a border). The modern sheet strokes its own. The antique side's countries are only for
 *   present-day close-ups (the Arab world, Europe); its historical sheet never draws them.
 */
import { writeFileSync } from 'node:fs';
import { clipRect } from '../src/lib/caliphate/clip.js';
import { naturalEarth, outerRings, thin } from './natural-earth.js';

const EARTH = new URL('../src/lib/caliphate/earth.json', import.meta.url);
const LAND = new URL('../src/lib/caliphate/land.json', import.meta.url);

/**
 * Each sheet's reach as [west, south, east, north] boxes, with the vertex spacing its closest
 * crop needs: the Aegean close-up is ten degrees wide, the closest modern one is five. The
 * antique side runs from the Atlantic to the Indus and from the Cape to the North Cape; the
 * modern side from Java to the Arctic. Boxes on one side overlap a little, so no hairline seam
 * shows where two cut pieces of one coast meet.
 */
const REACH = [
	{ step: 0.025, boxes: [[2, 8, 69, 51]] },
	{
		step: 0.05,
		boxes: [
			[-40, -42, 2.2, 80],
			[1.8, -42, 69.2, 8.2],
			[1.8, 50.8, 69.2, 80]
		]
	},
	{
		step: 0.04,
		boxes: [
			[68.8, -42, 180, 79],
			[-180, 4, -97.8, 79],
			[-98.2, 20, -52, 54]
		]
	}
];
/**
 * The modern sheet's countries, and the antique side's present-day ones: every country that
 * reaches the west box. Rings are stroked, so they are only cut along lines no view reaches.
 * The antique side only draws them on continent-wide close-ups, so its spacing is coarser.
 */
const SIDES = {
	modern: {
		step: 0.05,
		pick: [
			'CHN', 'JPN', 'KOR', 'MNG', 'PRK', 'RUS', 'TWN', 'USA',
			'VNM', 'LAO', 'KHM', 'THA', 'MMR', 'MYS', 'PHL', 'IDN', 'BRN', 'TLS', 'PNG',
			'IND', 'BGD', 'BTN', 'NPL', 'KAZ', 'KGZ'
		],
		boxes: [
			[60, -42, 180, 80],
			[-180, -42, -50, 80]
		]
	},
	antique: {
		step: 0.1,
		pick: null,
		boxes: [[-36, -42, 82, 80]]
	}
};
/** Smaller islands and lakes vanish at the sheets' scale, in square degrees of bounding box. */
const ISLET = 0.015;

/** @param {number[][]} ring */
function bounds(ring) {
	const lons = ring.map(([lon]) => lon);
	const lats = ring.map(([, lat]) => lat);
	return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

/** @param {number[][]} ring */
const round = (ring) => ring.map(([lon, lat]) => [Math.round(lon * 100) / 100, Math.round(lat * 100) / 100]);

/** @param {number[][]} ring */
function visible(ring) {
	if (ring.length < 4) return false;
	const [west, south, east, north] = bounds(ring);
	return (east - west) * (north - south) >= ISLET;
}

/**
 * Every polygon of a layer cut to each box of the reach it touches.
 * @param {any[]} features
 * @param {(polygon: number[][][]) => void} each
 */
function crop(features, each) {
	for (const feature of features) {
		const { type, coordinates } = feature.geometry;
		for (const polygon of type === 'Polygon' ? [coordinates] : coordinates) {
			const [west, south, east, north] = bounds(polygon[0]);
			for (const { step, boxes } of REACH) {
				for (const box of boxes) {
					if (east < box[0] || west > box[2] || north < box[1] || south > box[3]) continue;
					const [outer, ...holes] = polygon.map((/** @type {number[][]} */ ring) =>
						round(clipRect(thin(ring, step), box[0], box[1], box[2], box[3]))
					);
					if (outer.length >= 3) each([outer, ...holes.filter((ring) => ring.length >= 3)]);
				}
			}
		}
	}
}

/** @param {number[]} point @param {number[][]} ring */
function inside([x, y], ring) {
	let hit = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
	}
	return hit;
}

/** @type {number[][][][]} */
const earth = [];
crop(await naturalEarth('ne_50m_land'), (rings) => earth.push(rings));

/** Lakes are holes in the land that holds them, so the even-odd fill leaves them as water. */
let lakes = 0;
crop(await naturalEarth('ne_50m_lakes'), ([shore]) => {
	if (!visible(shore)) return;
	const land = earth.find((polygon) => inside(shore[0], polygon[0]));
	if (!land) return;
	land.push(shore);
	lakes++;
});

const countries = await naturalEarth('ne_50m_admin_0_countries');

/**
 * @param {any} feature
 * @param {number[][]} boxes
 * @param {number} step
 */
const cut = (feature, boxes, step) =>
	outerRings(feature)
		.flatMap((ring) => boxes.map((box) => round(clipRect(thin(ring, step), box[0], box[1], box[2], box[3]))))
		.filter(visible);

/** @type {Record<string, Record<string, number[][][]>>} */
const sides = {};
for (const [side, { step, pick, boxes }] of Object.entries(SIDES)) {
	/** @type {Record<string, number[][][]>} */
	const bag = {};
	if (pick) {
		for (const iso of pick) {
			const feature = countries.find((item) => item.properties.ADM0_A3 === iso);
			if (!feature) throw new Error(`No country ${iso}`);
			bag[iso] = cut(feature, boxes, step);
		}
	} else {
		for (const feature of countries) {
			const rings = cut(feature, boxes, step);
			if (rings.length) bag[feature.properties.ADM0_A3] = rings;
		}
	}
	sides[side] = bag;
}

writeFileSync(EARTH, JSON.stringify({ polygons: earth }));
writeFileSync(LAND, JSON.stringify(sides));
const points = earth.reduce((sum, polygon) => sum + polygon.reduce((n, ring) => n + ring.length, 0), 0);
console.log(`earth: ${earth.length} polygons, ${lakes} lakes, ${points} points`);
for (const [side, bag] of Object.entries(sides)) console.log(`${side}: ${Object.keys(bag).length} countries`);
