/**
 * Bakes the Chinese province groups the Kaliphate essay paints, from Natural Earth's
 * 1:50m admin-1 layer (public domain).
 *
 *   node scripts/caliphate-provinces.js
 *
 * writes `src/lib/caliphate/provinces.json`: for each group, the outer rings of its provinces,
 * thinned to about 0.05° and rounded to 0.01°.
 */
import { writeFileSync } from 'node:fs';
import { clipRect } from '../src/lib/caliphate/clip.js';
import { naturalEarth, outerRings, thin } from './natural-earth.js';

const OUT = new URL('../src/lib/caliphate/provinces.json', import.meta.url);
const STEP = 0.05;

/** The eighteen provinces of the Qing, in today's units: Zhili is Hebei, Beijing, and Tianjin. */
const CHINA_PROPER = [
	'Hebei',
	'Beijing',
	'Tianjin',
	'Shandong',
	'Shanxi',
	'Henan',
	'Jiangsu',
	'Shanghai',
	'Anhui',
	'Jiangxi',
	'Fujian',
	'Zhejiang',
	'Hubei',
	'Hunan',
	'Shaanxi',
	'Gansu',
	'Ningxia',
	'Sichuan',
	'Chongqing',
	'Guangdong',
	'Hainan',
	'Guangxi',
	'Yunnan',
	'Guizhou'
];

/** The fiction's stain: Manchuria, the North China Plain with Beijing, and the lower Yangtze to Shanghai. */
const KALIPHATE = [
	'Heilongjiang',
	'Jilin',
	'Liaoning',
	'Beijing',
	'Tianjin',
	'Hebei',
	'Shandong',
	'Henan',
	'Jiangsu',
	'Shanghai'
];

const GROUPS = { chinaProper: CHINA_PROPER, kaliphate: KALIPHATE };

const admin = await naturalEarth('ne_50m_admin_1_states_provinces');
const features = admin.filter((feature) => feature.properties.adm0_a3 === 'CHN');
const russian = admin.filter((feature) => feature.properties.adm0_a3 === 'RUS');

/** Today's China without Tibet. Xizang is the only province left out. */
const ROC = features
	.map((feature) => feature.properties.name)
	.filter((name) => name !== 'Xizang');

/** Tibet alone, so a China-shaped wash can leave it out. */
const TIBET = ['Xizang'];

/** @param {string} name */
function ringsOf(name) {
	const feature = features.find((item) => item.properties.name === name);
	if (!feature) throw new Error(`No province named ${name}`);
	return outerRings(feature)
		.map((ring) => thin(ring, STEP))
		.filter((ring) => ring.length >= 4);
}

/** @type {Record<string, number[][][]>} */
const result = {};
for (const [group, names] of Object.entries({ ...GROUPS, roc: ROC, tibet: TIBET })) {
	result[group] = names.flatMap(ringsOf);
	console.log(`${group}: ${names.length} provinces, ${result[group].length} rings`);
}

/** A province cut to a lon/lat box, then thinned. */
function clipped(/** @type {any} */ feature, west, south, east, north) {
	return outerRings(feature)
		.map((ring) => thin(clipRect(ring, west, south, east, north), STEP))
		.filter((ring) => ring.length >= 4);
}

/** @param {any[]} list @param {string} name */
function named(list, name) {
	const feature = list.find((item) => item.properties.name === name);
	if (!feature) throw new Error(`No province named ${name}`);
	return feature;
}

// All of Manchuria: the three provinces, eastern Inner Mongolia (west to the Argun),
// and Outer Manchuria south of the Stanovoy.
result.manchuria = [
	...['Heilongjiang', 'Jilin', 'Liaoning'].flatMap(ringsOf),
	...clipped(named(features, 'Inner Mongol'), 115.5, 41.5, 126, 54),
	...['Amur', "Primor'ye", 'Yevrey'].flatMap((name) =>
		outerRings(named(russian, name))
			.map((ring) => thin(ring, STEP))
			.filter((ring) => ring.length >= 4)
	),
	...clipped(named(russian, 'Khabarovsk'), 130, 42.5, 142, 56)
];
console.log(`manchuria: ${result.manchuria.length} rings`);
writeFileSync(OUT, JSON.stringify(result));
