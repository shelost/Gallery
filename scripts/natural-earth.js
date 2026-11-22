/**
 * Natural Earth layers (public domain) for the bake scripts: fetched once from the
 * natural-earth-vector repository and kept in `node_modules/.cache/natural-earth/`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const CACHE = fileURLToPath(new URL('../node_modules/.cache/natural-earth/', import.meta.url));

/**
 * The features of one layer.
 * @param {string} layer e.g. `ne_50m_admin_0_countries`
 * @returns {Promise<any[]>}
 */
export async function naturalEarth(layer) {
	mkdirSync(CACHE, { recursive: true });
	const file = `${CACHE}${layer}.geojson`;
	if (!existsSync(file)) {
		const source = `${BASE}${layer}.geojson`;
		const response = await fetch(source);
		if (!response.ok) throw new Error(`${source}: ${response.status}`);
		writeFileSync(file, Buffer.from(await response.arrayBuffer()));
	}
	return JSON.parse(readFileSync(file, 'utf8')).features;
}

/**
 * The outer ring of every polygon in a feature.
 * @param {any} feature
 * @returns {number[][][]}
 */
export function outerRings(feature) {
	const { type, coordinates } = feature.geometry;
	const polygons = type === 'Polygon' ? [coordinates] : coordinates;
	return polygons.map((/** @type {number[][][]} */ polygon) => polygon[0]);
}

/**
 * Drops vertices closer than `step` degrees to the last one kept and rounds to 0.01°.
 * @param {number[][]} ring
 * @param {number} step
 */
export function thin(ring, step) {
	/** @type {number[][]} */
	const out = [];
	for (const [lon, lat] of ring) {
		const last = out[out.length - 1];
		if (last && Math.hypot(lon - last[0], lat - last[1]) < step) continue;
		out.push([Math.round(lon * 100) / 100, Math.round(lat * 100) / 100]);
	}
	return out;
}
