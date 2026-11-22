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

const features = (await naturalEarth('ne_50m_admin_1_states_provinces')).filter(
	(feature) => feature.properties.adm0_a3 === 'CHN'
);

/** @type {Record<string, number[][][]>} */
const result = {};
for (const [group, names] of Object.entries(GROUPS)) {
	result[group] = names.flatMap((name) => {
		const feature = features.find((item) => item.properties.name === name);
		if (!feature) throw new Error(`No province named ${name}`);
		return outerRings(feature)
			.map((ring) => thin(ring, STEP))
			.filter((ring) => ring.length >= 4);
	});
	console.log(`${group}: ${names.length} provinces, ${result[group].length} rings`);
}
writeFileSync(OUT, JSON.stringify(result));
