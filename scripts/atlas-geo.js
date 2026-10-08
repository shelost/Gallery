/**
 * Bakes an atlas's coastlines, lakes and rivers into SVG paths, projected with its frame.
 *
 *   node scripts/atlas-geo.js persia
 *
 * reads `src/lib/atlas/persia/frame.js` and writes `src/lib/atlas/persia/geo.js`, from
 * Natural Earth 1:50m (public domain). Modern reservoirs and canals are left out, and the Aral
 * Sea is its historic shoreline, since these maps are of the ancient world.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { albers } from '../src/lib/atlas/projection.js';

const SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';
const MARGIN = 24; // map units past the view, so clipped edges never show
const TOLERANCE = 0.45; // map units a simplified line may stray
const MIN_AREA = 1.5; // square map units; smaller islands are dropped

const MODERN = new Set([
	'Lake Nasser',
	'Kakhovka Reservoir',
	'Kremenchuk Reservoir',
	'Lake Tharthar',
	'Lake Habbaniyah',
	'Razzaza Lake',
	'Sarygamysh Köli',
	'North Aral Sea',
	'South Aral Sea',
	'Barsakelmes Lake'
]);

const RIVERS = new Set([
	'Euphrates', 'Al Furat', 'Firat', 'Tigris', 'Dicle', 'Shatt al Arab',
	'Nile', 'Damietta Branch', 'Rosetta Branch', 'Jordan',
	'Danube', 'Donau', 'Borcea', 'Bratul Chillia', 'Bratul Sfintu Gheorghe', 'Bratul Sulina',
	'Dniester', 'Dnipro', 'Don', 'Volga', 'Ural', 'Amu Darya', 'Syr Darya', 'Helmand'
]);

const name = process.argv[2];
if (!name) throw new Error('Usage: node scripts/atlas-geo.js <atlas>');
const dir = new URL(`../src/lib/atlas/${name}/`, import.meta.url);
const { FRAME } = await import(new URL('frame.js', dir).href);
const { project, view } = albers(FRAME);
const box = { x0: view.x - MARGIN, y0: view.y - MARGIN, x1: view.x + view.w + MARGIN, y1: view.y + view.h + MARGIN };
const [[west, south], [east, north]] = FRAME.bounds;
const near = ([lon, lat]) => lon > west - 8 && lon < east + 8 && lat > south - 6 && lat < north + 6;

/** @param {string} file */
async function load(file) {
	const cached = join(tmpdir(), `${file}.geojson`);
	if (!existsSync(cached)) {
		const response = await fetch(`${SOURCE}/${file}.geojson`);
		if (!response.ok) throw new Error(`${file}: ${response.status}`);
		writeFileSync(cached, await response.text());
	}
	return JSON.parse(readFileSync(cached, 'utf8')).features;
}

/** Every polygon's rings, whether the feature is a Polygon or a MultiPolygon. */
const polygons = (features) =>
	features.flatMap(({ geometry: g }) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates));

/** Every line, whether the feature is a LineString or a MultiLineString. */
const lines = (features) =>
	features.flatMap(({ geometry: g }) => (g.type === 'LineString' ? [g.coordinates] : g.coordinates));

const inside = {
	left: ([x]) => x >= box.x0,
	right: ([x]) => x <= box.x1,
	top: ([, y]) => y >= box.y0,
	bottom: ([, y]) => y <= box.y1
};

/** Where segment a–b crosses one edge of the box. */
function cross(edge, [ax, ay], [bx, by]) {
	const along = (t) => [ax + (bx - ax) * t, ay + (by - ay) * t];
	if (edge === 'left') return along((box.x0 - ax) / (bx - ax));
	if (edge === 'right') return along((box.x1 - ax) / (bx - ax));
	if (edge === 'top') return along((box.y0 - ay) / (by - ay));
	return along((box.y1 - ay) / (by - ay));
}

/** Sutherland–Hodgman: a ring cut to the box, edge by edge. */
function clipRing(ring) {
	let out = ring;
	for (const edge of /** @type {const} */ (['left', 'right', 'top', 'bottom'])) {
		const input = out;
		out = [];
		input.forEach((point, i) => {
			const prev = input.at(i - 1);
			const now = inside[edge](point);
			if (now !== inside[edge](prev)) out.push(cross(edge, prev, point));
			if (now) out.push(point);
		});
		if (!out.length) break;
	}
	return out;
}

/** A line cut into the runs that stay within the box. */
function clipLine(line) {
	const within = ([x, y]) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
	const runs = [[]];
	line.forEach((point, i) => {
		if (within(point) || (i > 0 && within(line[i - 1])) || within(line[i + 1] ?? point)) runs.at(-1).push(point);
		else if (runs.at(-1).length) runs.push([]);
	});
	return runs.filter((run) => run.length > 1);
}

/** Douglas–Peucker. */
function simplify(points) {
	if (points.length < 3) return points;
	const keep = new Uint8Array(points.length);
	keep[0] = keep[points.length - 1] = 1;
	const stack = [[0, points.length - 1]];
	while (stack.length) {
		const [a, b] = stack.pop();
		const [ax, ay] = points[a];
		const [bx, by] = points[b];
		const length = Math.hypot(bx - ax, by - ay);
		let far = 0;
		let index = -1;
		for (let i = a + 1; i < b; i++) {
			const [px, py] = points[i];
			const d = length
				? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length
				: Math.hypot(px - ax, py - ay);
			if (d > far) [far, index] = [d, i];
		}
		if (far > TOLERANCE) {
			keep[index] = 1;
			stack.push([a, index], [index, b]);
		}
	}
	return points.filter((_, i) => keep[i]);
}

const area = (ring) => Math.abs(ring.reduce((sum, [x, y], i) => sum + x * ring.at(i - 1)[1] - ring.at(i - 1)[0] * y, 0) / 2);

/** Tenths, without a leading zero. */
const number = (tenths) => String(tenths / 10).replace(/^(-?)0\./, '$1.');

/** A relative SVG path, in tenths of a unit. */
function encode(shapes, closed) {
	return shapes
		.map((points) => {
			const tenths = points.map(([x, y]) => [Math.round(x * 10), Math.round(y * 10)]);
			let d = `M${number(tenths[0][0])} ${number(tenths[0][1])}l`;
			let first = true;
			for (let i = 1; i < tenths.length; i++) {
				const dx = tenths[i][0] - tenths[i - 1][0];
				const dy = tenths[i][1] - tenths[i - 1][1];
				if (!dx && !dy) continue;
				for (const part of [number(dx), number(dy)]) {
					d += first || part.startsWith('-') ? part : ` ${part}`;
					first = false;
				}
			}
			return closed ? `${d}z` : d;
		})
		.join('');
}

/** Rings near the frame, projected, clipped, simplified, without specks. */
function areas(rings) {
	return rings
		.filter((ring) => ring.some(near))
		.map((ring) => simplify(clipRing(ring.map(([lon, lat]) => project(lon, lat)))))
		.filter((ring) => ring.length > 3 && area(ring) >= MIN_AREA);
}

const [land, lakes, historic, rivers] = await Promise.all(
	['ne_50m_land', 'ne_50m_lakes', 'ne_50m_lakes_historic', 'ne_50m_rivers_lake_centerlines'].map(load)
);

const LAND = encode(areas(polygons(land).flat()), true);
const LAKES = encode(
	areas(
		polygons([...lakes.filter((f) => !MODERN.has(f.properties.name)), ...historic.filter((f) => f.properties.name === 'Aral Sea')]).flat()
	),
	true
);
const RIVER_LINES = encode(
	lines(rivers.filter((f) => RIVERS.has(String(f.properties.name).replace(/\s+/g, ' '))))
		.filter((line) => line.some(near))
		.flatMap((line) => clipLine(line.map(([lon, lat]) => project(lon, lat))))
		.map(simplify),
	false
);

writeFileSync(
	new URL('geo.js', dir),
	`// Generated by \`node scripts/atlas-geo.js ${name}\` from Natural Earth 1:50m. Do not edit.\n` +
		`export const LAND = '${LAND}';\nexport const LAKES = '${LAKES}';\nexport const RIVERS = '${RIVER_LINES}';\n`
);
console.log(`${name}: land ${LAND.length}, lakes ${LAKES.length}, rivers ${RIVER_LINES.length} characters; view ${view.w}×${view.h}`);
