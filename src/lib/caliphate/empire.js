/**
 * Historical empire washes, as lon/lat rings painted in order onto one layer and cut to the
 * real coasts. A later region overrides an earlier one, so a frontier is drawn once, by the
 * power painted second, and every ring may run freely out to sea.
 *
 * The lines follow the standard reconstructions (Shepherd's Historical Atlas, the Barrington
 * Atlas for antiquity, Haldon's and Whittow's Byzantine maps, Kennedy's Historical Atlas of
 * Islam): the Danube limes, the 387 and 591 Roman–Persian partitions of Armenia, the Strata
 * Diocletiana and limes Arabicus, the Taurus–Anti-Taurus thughur, the Gorgan wall and the
 * Oxus, the Nerchinsk line in Manchuria, and the 1763 Proclamation Line. Precision is about a
 * quarter of a degree, which is finer than any of those sources claim.
 */
import provinces from './provinces.json';
import { lower48 } from './coasts.js';

/**
 * @typedef {{
 *   color: string,
 *   alpha?: number,
 *   iso?: string,
 *   ring?: number[][],
 *   rings?: number[][][],
 *   blur?: number,
 *   outline?: boolean
 * }} Region
 */

const CLIENT = 0.46;

/** @param {...number[][]} parts */
const join = (...parts) => parts.flat();

/** @param {number[][]} line */
const rev = (line) => [...line].reverse();

// ---------------------------------------------------------------- shared lines

/** The lower Danube limes, Singidunum to the Sulina mouth. Rome holds the south bank. */
const DANUBE = [
	[20.46, 44.82],
	[20.93, 44.66],
	[21.63, 44.66],
	[22.4, 44.72],
	[22.66, 44.63],
	[22.88, 43.99],
	[23.24, 43.83],
	[23.96, 43.74],
	[24.9, 43.7],
	[25.35, 43.62],
	[25.95, 43.85],
	[27.27, 44.12],
	[27.95, 44.68],
	[27.97, 45.27],
	[28.46, 45.27],
	[28.8, 45.18],
	[29.65, 45.16]
];

/** The Greater Caucasus crest, Abkhazia to Derbent. */
const CAUCASUS = [
	[40.0, 43.4],
	[41.0, 43.4],
	[42.5, 42.9],
	[43.4, 42.6],
	[44.5, 42.65],
	[46.0, 41.9],
	[47.5, 41.5],
	[48.6, 41.9]
];

/**
 * Rome and Persia under the 387 partition as Justinian left it: Lazica Roman, Iberia and
 * Persarmenia Persian, Theodosiopolis and Martyropolis Roman, Dara facing Nisibis, Circesium
 * on the Euphrates. North to south.
 */
const FRONTIER_565 = [
	[43.4, 42.6],
	[43.4, 42.2],
	[43.0, 41.5],
	[42.8, 41.0],
	[42.3, 40.4],
	[41.7, 39.9],
	[41.9, 39.3],
	[41.4, 38.5],
	[41.55, 38.25],
	[41.6, 38.0],
	[41.4, 37.4],
	[41.1, 37.05],
	[40.9, 36.4],
	[40.75, 35.6],
	[40.45, 35.1]
];

/**
 * Maurice's peace of 591: Rome takes western Iberia, Armenia to the Hrazdan short of Dvin, and
 * the lands west of Lake Van and Arzanene. Tiflis, Dvin, and Nisibis stay Persian.
 */
const FRONTIER_591 = [
	[44.5, 42.65],
	[44.7, 42.0],
	[44.5, 41.7],
	[44.3, 41.2],
	[44.6, 40.6],
	[44.5, 40.0],
	[44.2, 39.6],
	[44.0, 39.2],
	[43.7, 38.8],
	[43.5, 38.3],
	[42.9, 37.9],
	[42.4, 37.5],
	[41.9, 37.2],
	[41.1, 37.05],
	[40.9, 36.4],
	[40.75, 35.6],
	[40.45, 35.1]
];

/** The Strata Diocletiana and limes Arabicus: Circesium, Palmyra, Bostra, Petra, Aila. */
const DESERT_LIMES = [
	[40.45, 35.1],
	[39.3, 34.8],
	[38.6, 34.3],
	[37.6, 33.6],
	[37.1, 32.6],
	[36.82, 31.83],
	[36.2, 30.7],
	[35.73, 30.2],
	[35.0, 29.5]
];

/** Where the Mesopotamian floodplain meets the desert, Circesium to the Shatt al-Arab. */
const EUPHRATES = [
	[40.45, 35.1],
	[41.2, 34.5],
	[42.0, 34.45],
	[42.9, 33.7],
	[43.6, 33.3],
	[44.0, 32.5],
	[44.3, 31.9],
	[45.4, 31.4],
	[46.3, 31.0],
	[47.2, 30.5],
	[47.8, 30.1],
	[48.5, 29.9]
];

/** Down the middle of the Gulf and out past Hormuz and the Makran coast. */
const GULF = [
	[48.5, 29.9],
	[49.4, 28.9],
	[50.5, 27.9],
	[52.5, 26.9],
	[54.5, 26.4],
	[56.3, 26.6],
	[57.0, 25.6],
	[58.5, 25.0],
	[61.5, 24.6],
	[66.5, 24.4],
	[68.5, 24.4]
];

/** The Gorgan wall, the Kopet Dag, Merv, and the Oxus at Amul and Kerki. West to east. */
const SASANIAN_NORTH = [
	[54.0, 37.0],
	[55.5, 37.6],
	[57.5, 38.0],
	[59.0, 37.4],
	[60.5, 36.9],
	[61.5, 38.0],
	[62.5, 38.4],
	[63.5, 39.1],
	[64.5, 38.3],
	[65.2, 37.85]
];

/** Herat and Sistan are Sasanian; Ghor, Zabul, and Tokharistan are not. */
const SASANIAN_EAST = [
	[64.6, 36.5],
	[63.8, 35.2],
	[64.2, 33.5],
	[64.6, 31.5],
	[66.0, 30.0],
	[67.0, 27.0],
	[67.5, 24.4]
];

/** Across the Caspian, Derbent to the Gorgan plain, clear of Absheron. */
const CASPIAN = [
	[49.6, 41.6],
	[51.0, 40.6],
	[52.5, 38.5],
	[53.5, 37.3]
];

/** Khwarezm and Transoxiana under the Umayyads and after: the Ustyurt, the Aral, the Kyzylkum. */
const OXUS_NORTH = [
	[52.8, 41.0],
	[55.5, 41.6],
	[58.0, 42.8],
	[59.5, 43.6],
	[61.0, 43.8],
	[62.5, 42.5],
	[64.5, 41.2],
	[66.5, 40.6],
	[68.5, 40.6]
];

/**
 * The thughur: the Lamos river where prisoners were exchanged, the Cilician Gates, the
 * Anti-Taurus past Melitene, Theodosiopolis on the Arab side, then Klarjeti to the Caucasus.
 * The frontier from the 650s until the Macedonian offensives, and the line of 863.
 */
const TAURUS = [
	[34.2, 36.4],
	[34.2, 36.6],
	[34.5, 37.1],
	[34.8, 37.35],
	[35.4, 37.7],
	[36.0, 38.0],
	[36.6, 38.2],
	[37.4, 38.3],
	[38.0, 38.6],
	[38.6, 38.9],
	[39.2, 39.2],
	[39.7, 39.4],
	[40.4, 39.6],
	[41.0, 40.3],
	[41.4, 40.8],
	[42.0, 41.4],
	[42.6, 41.6],
	[43.0, 42.0],
	[43.4, 42.6]
];

/** The southern edge of the Armenian highland, where the caliphate's Jazira ends. East to west. */
const JAZIRA_NORTH = [
	[49.4, 39.4],
	[48.6, 39.7],
	[47.5, 39.6],
	[46.5, 39.0],
	[45.0, 39.2],
	[44.5, 38.2],
	[43.5, 37.6],
	[42.5, 38.0],
	[41.5, 38.5],
	[40.5, 38.8],
	[39.7, 39.4]
];

/** Egypt's edge: Berenike, the first cataract, the Kharga and Siwa oases, the Libyan coast. */
const EGYPT_SOUTH = [
	[36.6, 23.6],
	[35.6, 23.5],
	[33.0, 23.9],
	[30.2, 24.6],
	[28.6, 25.4],
	[27.6, 26.8],
	[25.6, 29.0],
	[25.0, 30.0]
];

/** The settled strip of Cyrenaica and the Syrtic coast, Marmarica to Arae Philaenorum. East to west. */
const CYRENAICA_INLAND = [
	[24.0, 30.4],
	[23.0, 30.6],
	[21.2, 30.9],
	[20.3, 30.4],
	[19.0, 30.1],
	[18.4, 30.2]
];

/** Tripolitania's coastal cities and the Jebel Nafusa, back to Gabès. East to west. */
const TRIPOLITANIA_INLAND = [
	[17.0, 30.7],
	[15.5, 31.2],
	[14.0, 31.9],
	[12.5, 32.3],
	[11.3, 32.6],
	[10.2, 33.5]
];

/** Byzacena and Numidia: Capsa, Thelepte, the Aurès forts, Tubunae. East to west. */
const AFRICA_INLAND = [
	[9.2, 33.8],
	[8.6, 34.3],
	[8.0, 34.7],
	[7.0, 35.0],
	[6.0, 35.2],
	[5.0, 35.3],
	[3.0, 35.4]
];

/** The Sahara's edge under the caliphs, Cyrenaica to the Maghreb. East to west. */
const SAHARA_EDGE = [
	[24.0, 29.5],
	[21.0, 29.6],
	[18.4, 29.8],
	[16.0, 30.2],
	[13.0, 31.0],
	[11.0, 31.5],
	[9.5, 32.0],
	[8.5, 33.0],
	[7.0, 33.8],
	[5.0, 34.2],
	[3.0, 34.0]
];

/** Offshore round Arabia, Hormuz to the Gulf of Aqaba. */
const ARABIA_SEA = [
	[68.5, 24.4],
	[66.5, 20.0],
	[60.0, 16.0],
	[54.0, 13.0],
	[51.5, 11.5],
	[43.5, 11.8],
	[42.0, 14.5],
	[39.0, 19.5],
	[36.6, 23.6]
];

/** Offshore along the Levant and Egypt, west to east, clear of the Cyrenaican bulge. */
const LEVANT_SEA = [
	[16.0, 33.6],
	[20.5, 33.8],
	[23.5, 33.3],
	[24.9, 32.4],
	[29.5, 31.9],
	[32.0, 31.9],
	[33.6, 32.0],
	[34.4, 33.2],
	[35.1, 34.4],
	[35.4, 35.6],
	[35.0, 36.3]
];

/** The Alpine crest from the Maritime Alps to the Julian Alps. */
const ALPS = [
	[7.5, 43.6],
	[7.0, 44.2],
	[7.0, 45.3],
	[7.5, 45.9],
	[8.4, 46.3],
	[9.0, 46.4],
	[10.5, 46.5],
	[12.0, 46.7],
	[13.7, 46.5],
	[14.0, 46.2],
	[14.4, 45.9]
];

// ---------------------------------------------------------------- reusable regions

const ITALY_ISLANDS = join(ALPS, [
	[14.0, 45.0],
	[15.5, 43.5],
	[17.5, 42.0],
	[18.7, 40.5],
	[17.5, 38.5],
	[16.0, 36.4],
	[14.4, 35.6],
	[12.2, 36.6],
	[12.0, 38.4],
	[8.0, 38.7],
	[7.9, 41.5],
	[8.4, 43.2]
]);

const DALMATIA = [
	[18.85, 42.3],
	[19.2, 42.9],
	[19.3, 43.5],
	[19.35, 44.3],
	[18.2, 44.6],
	[16.8, 44.9],
	[15.5, 45.3],
	[14.4, 45.9],
	[13.6, 45.3],
	[14.0, 44.0],
	[16.0, 42.8],
	[17.8, 42.0]
];

const AFRICA_EXARCHATE = join(
	[
		[3.0, 37.5],
		[9.5, 37.8],
		[11.5, 37.2],
		[11.6, 35.0],
		[11.6, 33.6],
		[13.0, 33.3],
		[13.0, 32.3],
		[12.5, 32.3],
		[11.3, 32.6],
		[10.2, 33.5]
	],
	AFRICA_INLAND
);

const TRIPOLITANIA = join(
	[
		[13.0, 33.3],
		[15.5, 32.6],
		[17.5, 31.5],
		[18.4, 31.6],
		[18.4, 30.2]
	],
	TRIPOLITANIA_INLAND.slice(0, 3),
	[[13.0, 32.2]]
);

/** Sicily, cut down the Strait of Messina so it never claims Reggio or Scilla. */
const SICILY = [
	[12.1, 38.3],
	[13.5, 38.35],
	[15.66, 38.32],
	[15.58, 38.15],
	[15.45, 37.4],
	[15.3, 36.55],
	[14.3, 36.6],
	[12.3, 37.3]
];

const SARDINIA = [
	[8.0, 38.7],
	[9.9, 38.7],
	[10.0, 41.3],
	[8.1, 41.3]
];

const CORSICA = [
	[8.3, 41.3],
	[9.8, 41.3],
	[9.7, 43.1],
	[8.4, 43.1]
];

const CRETE = [
	[23.3, 34.8],
	[26.5, 34.8],
	[26.5, 35.7],
	[23.3, 35.7]
];

const CYPRUS = [
	[32.0, 34.4],
	[34.2, 34.6],
	[34.9, 35.8],
	[33.5, 35.5],
	[32.0, 35.3]
];

/** Cherson and the Gothic coast of the Crimea, with the Bosporus until 576. */
const CRIMEA_COAST = [
	[33.3, 44.4],
	[33.4, 44.75],
	[34.0, 44.8],
	[35.2, 45.0],
	[36.0, 45.1],
	[36.4, 45.45],
	[36.7, 45.3],
	[36.7, 45.0],
	[35.5, 44.6],
	[34.2, 44.3]
];

const CHERSON = [
	[33.3, 44.4],
	[33.4, 44.75],
	[33.9, 44.75],
	[34.3, 44.55],
	[33.7, 44.3]
];

/** Ravenna, the Pentapolis, the Perugia corridor, and the duchy of Rome. */
const RAVENNA_ROME = [
	[12.3, 44.8],
	[11.95, 44.45],
	[12.25, 44.05],
	[12.45, 43.75],
	[12.45, 43.4],
	[12.3, 43.15],
	[12.28, 42.8],
	[12.2, 42.45],
	[11.95, 42.35],
	[11.65, 42.2],
	[11.5, 41.9],
	[12.5, 41.3],
	[13.2, 41.0],
	[13.6, 41.2],
	[13.45, 41.5],
	[13.1, 41.75],
	[12.95, 42.05],
	[12.65, 42.4],
	[12.55, 42.8],
	[12.6, 43.15],
	[12.75, 43.45],
	[13.05, 43.35],
	[13.4, 43.25],
	[13.7, 43.5],
	[14.0, 43.8],
	[12.8, 44.6]
];

const VENETIA_ISTRIA = [
	[12.2, 45.2],
	[12.4, 45.6],
	[13.0, 45.8],
	[13.6, 45.75],
	[14.2, 45.5],
	[14.3, 45.0],
	[13.9, 44.7],
	[13.2, 45.0],
	[12.4, 44.9]
];

const LIGURIA = [
	[7.5, 43.75],
	[8.0, 44.1],
	[8.9, 44.55],
	[9.5, 44.3],
	[10.0, 44.1],
	[9.5, 43.8],
	[8.0, 43.5]
];

const NAPLES = [
	[13.9, 41.05],
	[14.3, 41.05],
	[14.5, 40.85],
	[14.6, 40.6],
	[14.3, 40.5],
	[13.8, 40.7]
];

const CALABRIA = [
	[15.9, 39.2],
	[16.4, 39.25],
	[17.2, 39.3],
	[17.3, 38.3],
	[16.0, 37.8],
	[15.62, 37.85],
	[15.6, 38.15],
	[15.68, 38.28],
	[15.8, 38.6],
	[15.6, 38.9]
];

const APULIA_HEEL = [
	[16.6, 40.45],
	[16.75, 41.1],
	[17.2, 41.2],
	[18.0, 40.75],
	[18.6, 40.3],
	[18.5, 39.75],
	[17.6, 40.0],
	[16.9, 40.2]
];

const OTRANTO = [
	[18.0, 40.35],
	[18.6, 40.3],
	[18.6, 39.7],
	[17.9, 39.95]
];

/** What the Exarchate of Ravenna still held after the Lombards came in 568. */
const EXARCHATE_600 = [VENETIA_ISTRIA, LIGURIA, RAVENNA_ROME, NAPLES, CALABRIA, APULIA_HEEL, SICILY, SARDINIA, CORSICA];
const EXARCHATE_655 = [VENETIA_ISTRIA, RAVENNA_ROME, NAPLES, CALABRIA, APULIA_HEEL, SICILY, SARDINIA, CORSICA];
const EXARCHATE_740 = [VENETIA_ISTRIA, RAVENNA_ROME, NAPLES, CALABRIA, OTRANTO, SICILY, SARDINIA];

/** Rome's Balkans under Justinian and Maurice: the Danube bank, Praevalitana, Greece, Crete. */
const BALKANS = join(
	[
		[19.0, 40.2],
		[18.7, 41.6],
		[18.85, 42.3],
		[19.2, 42.9],
		[19.3, 43.5],
		[19.35, 44.3],
		[19.35, 44.88],
		[20.0, 44.85]
	],
	DANUBE,
	[
		[30.5, 45.0],
		[29.5, 42.0],
		[29.1, 41.25],
		[27.5, 40.9],
		[26.0, 40.3],
		[25.5, 38.0],
		[26.5, 35.0],
		[23.0, 34.6],
		[20.5, 36.5],
		[19.5, 38.5]
	]
);

/** Anatolia, generous on the east, for phases where a later power paints the frontier. */
const ANATOLIA = [
	[26.0, 40.3],
	[27.5, 40.9],
	[29.1, 41.25],
	[31.0, 42.0],
	[35.0, 42.4],
	[39.0, 41.6],
	[40.0, 43.4],
	[41.0, 43.4],
	[42.5, 42.9],
	[43.4, 42.6],
	[43.4, 42.2],
	[42.6, 41.6],
	[42.0, 40.0],
	[40.0, 37.0],
	[36.5, 36.0],
	[33.0, 35.9],
	[30.5, 35.8],
	[28.0, 36.0],
	[26.5, 36.5],
	[25.8, 38.5]
];

/**
 * Rome's east under Justinian: Anatolia, Lazica, the Levant to the limes, Egypt, Cyrenaica.
 * @param {number[][]} frontier north to south, starting on the Caucasus crest
 */
const romeAsia = (frontier) =>
	join(
		[
			[26.0, 40.3],
			[27.5, 40.9],
			[29.1, 41.25],
			[31.0, 42.0],
			[35.0, 42.4],
			[39.0, 41.6]
		],
		CAUCASUS.slice(0, CAUCASUS.findIndex((pt) => pt[0] === frontier[0][0] && pt[1] === frontier[0][1])),
		frontier,
		DESERT_LIMES.slice(1),
		[
			[34.7, 28.3],
			[35.4, 26.5]
		],
		EGYPT_SOUTH,
		CYRENAICA_INLAND,
		[
			[18.4, 31.8],
			[20.5, 34.0],
			[24.0, 35.0],
			[26.0, 35.5]
		]
	);

/**
 * Sasanian Persia from Derbent to Herat.
 * @param {number[][]} frontier north to south, starting on the Caucasus crest
 */
const persia = (frontier) =>
	join(
		CAUCASUS.slice(CAUCASUS.findIndex((pt) => pt[0] === frontier[0][0] && pt[1] === frontier[0][1])),
		CASPIAN,
		SASANIAN_NORTH,
		SASANIAN_EAST,
		rev(GULF.slice(0, -1)),
		rev(EUPHRATES),
		rev(frontier)
	);

/** The Ghassanid desert, Rome's Arab client from the Hauran to the Hejaz. */
const GHASSANID = [
	[35.3, 29.5],
	...DESERT_LIMES.slice().reverse(),
	[40.9, 34.3],
	[40.3, 33.0],
	[39.3, 31.6],
	[38.6, 30.0],
	[37.7, 28.3],
	[36.8, 27.0],
	[36.2, 26.2],
	[35.5, 27.0],
	[35.0, 28.5]
];

/** The Lakhmid desert west of the Euphrates, Persia's client at al-Hira. */
const LAKHMID = [
	[40.9, 34.3],
	[41.9, 34.4],
	[43.0, 33.4],
	[43.8, 32.6],
	[44.4, 31.8],
	[46.3, 31.0],
	[47.3, 30.3],
	[47.7, 29.4],
	[47.0, 28.0],
	[45.5, 27.5],
	[43.5, 28.3],
	[41.5, 29.2],
	[40.0, 30.2],
	[39.3, 31.6],
	[40.3, 33.0]
];

/** Sasanian Bahrain: Kazima, Qatif, the Hasa oasis, and Qatar. */
const BAHRAIN = [
	[47.4, 28.6],
	[48.3, 27.1],
	[48.8, 25.6],
	[49.3, 24.4],
	[50.8, 24.0],
	[51.6, 24.0],
	[52.0, 24.6],
	[51.8, 26.3],
	[50.8, 27.0],
	[49.5, 28.5],
	[48.4, 29.6]
];

/** Mazun, the Sasanian Batinah coast of Oman. */
const OMAN_COAST = [
	[55.8, 25.6],
	[56.4, 26.5],
	[57.5, 24.6],
	[58.6, 23.7],
	[59.0, 22.8],
	[58.3, 22.6],
	[57.0, 23.5],
	[56.0, 24.0],
	[55.6, 24.9]
];

/** Yemen under the Persian governors, from 570 to Badhan's conversion in 628. */
const YEMEN = [
	[42.0, 17.8],
	[43.4, 18.0],
	[44.5, 17.6],
	[46.5, 16.8],
	[48.5, 16.0],
	[49.5, 15.2],
	[49.2, 14.4],
	[48.0, 13.3],
	[43.3, 12.4],
	[42.2, 15.0]
];

/** The Pontic–Caspian steppe and the Turkic north of Central Asia, south to the Sasanian line. */
const STEPPE = join(
	[
		[29.7, 45.3],
		[28.3, 45.9],
		[28.6, 47.6],
		[28.0, 49.5],
		[70.0, 49.5],
		[70.0, 37.2],
		[65.2, 37.85]
	],
	rev(SASANIAN_NORTH),
	rev(CASPIAN),
	[
		[47.5, 42.6],
		[46.5, 43.5],
		[44.5, 44.0],
		[42.0, 44.2],
		[40.0, 44.6],
		[38.2, 45.0],
		[37.0, 45.6],
		[35.4, 45.4],
		[34.5, 45.9],
		[32.0, 46.0],
		[30.5, 45.5]
	]
);

/** The Avar khaganate in the Carpathian basin, from 567. */
const AVARS = [
	[15.8, 46.4],
	[16.5, 47.9],
	[18.0, 48.8],
	[22.5, 48.8],
	[23.0, 47.8],
	[22.6, 46.0],
	[21.6, 44.9],
	[20.5, 44.95],
	[19.4, 45.0],
	[18.0, 45.3],
	[16.8, 45.6]
];

/** Heraclius's Balkans after the Slavs: the Thracian plain and coast to Thessalonica. */
const THRACE_COAST = [
	[29.3, 41.25],
	[29.1, 40.9],
	[28.0, 40.85],
	[27.0, 40.55],
	[26.2, 40.3],
	[25.5, 40.6],
	[24.0, 40.1],
	[23.3, 39.9],
	[22.8, 40.3],
	[22.5, 40.6],
	[22.9, 40.95],
	[23.6, 41.05],
	[24.6, 41.2],
	[25.6, 41.3],
	[26.4, 41.75],
	[27.1, 42.3],
	[27.8, 42.75],
	[28.3, 42.7]
];

/** Hellas after the Slavs: Attica, Euboea, the Argolid and Corinth, the islands, and Crete. */
const GREEK_COAST = [
	[22.8, 38.4],
	[23.5, 38.6],
	[24.2, 39.0],
	[24.8, 38.7],
	[26.5, 38.0],
	[28.0, 37.0],
	[28.3, 36.0],
	[27.5, 35.0],
	[26.5, 34.7],
	[23.4, 34.8],
	[23.0, 35.6],
	[22.8, 36.3],
	[22.7, 36.9],
	[22.4, 37.3],
	[22.6, 37.6],
	[22.4, 38.0],
	[22.6, 38.2]
];

/** Dyrrachium and the Dalmatian towns. */
const ADRIATIC_TOWNS = [
	[19.3, 41.0],
	[19.6, 41.3],
	[19.6, 42.0],
	[18.9, 42.4],
	[18.2, 42.6],
	[17.5, 43.0],
	[16.5, 43.5],
	[15.5, 44.0],
	[15.2, 44.3],
	[14.8, 44.1],
	[16.0, 43.0],
	[17.8, 42.2],
	[19.0, 41.0]
];

/** Persia at its height, 620: Egypt, the Levant, Cilicia, Cappadocia, and Armenia. */
const PERSIA_620_FRONT = [
	[33.4, 36.2],
	[33.8, 36.9],
	[34.5, 37.6],
	[35.0, 38.4],
	[35.8, 39.1],
	[37.0, 39.4],
	[38.5, 39.8],
	[39.8, 40.3],
	[40.6, 40.8],
	[41.6, 41.6]
];

const PERSIA_620 = join(
	[
		[42.6, 41.6],
		[43.4, 42.2]
	],
	CAUCASUS.slice(3),
	CASPIAN,
	SASANIAN_NORTH,
	SASANIAN_EAST,
	rev(GULF.slice(0, -1)),
	rev(EUPHRATES),
	DESERT_LIMES.slice(1),
	[
		[34.7, 28.3],
		[35.4, 26.5]
	],
	EGYPT_SOUTH,
	[[24.9, 31.9]],
	LEVANT_SEA.slice(3, -1),
	[
		[35.0, 35.95],
		[34.0, 35.95]
	],
	PERSIA_620_FRONT
);

/**
 * The caliphate's core, from the Taurus round Arabia to the Libyan coast.
 * @param {number[][]} west the inland edge in North Africa, east to west, ending at the sea
 */
const caliphateCore = (west) =>
	join(
		TAURUS.slice(0, 12),
		JAZIRA_NORTH.slice().reverse(),
		[[49.4, 39.4]],
		[
			[50.5, 38.0],
			[52.5, 37.2]
		],
		SASANIAN_NORTH,
		[
			[66.5, 37.2],
			[68.5, 37.2]
		],
		ARABIA_SEA,
		EGYPT_SOUTH,
		west,
		LEVANT_SEA
	);

/** Arminiya: Armenia, Iberia, and Albania, north of the Jazira and up to the Caucasus. */
const ARMINIYA = join(TAURUS.slice(11), CAUCASUS.slice(4), [
	[49.5, 40.5],
	[49.4, 39.4]
], JAZIRA_NORTH.slice(1));

/** The Caspian mountains that held out: Gilan, Daylam, and Tabaristan. */
const CASPIAN_HOLDOUTS = [
	[48.9, 37.6],
	[49.3, 36.9],
	[50.0, 36.5],
	[51.0, 36.2],
	[52.0, 35.95],
	[53.0, 36.0],
	[54.0, 36.5],
	[54.6, 36.9],
	[54.2, 37.4],
	[53.0, 37.8],
	[50.5, 38.2],
	[49.2, 38.3]
];

/** Khazars on the Pontic–Caspian steppe, and the Turgesh north of Transoxiana. */
const STEPPE_740 = join(
	[
		[31.5, 46.6],
		[31.0, 49.5],
		[70.0, 49.5],
		[70.0, 40.6]
	],
	rev(OXUS_NORTH),
	[
		[51.0, 40.8],
		[50.0, 41.8],
		[48.6, 41.9],
		[47.5, 42.6],
		[46.5, 43.5],
		[44.5, 44.0],
		[42.0, 44.2],
		[40.0, 44.6],
		[38.2, 45.0],
		[37.0, 45.6],
		[35.4, 45.4],
		[33.6, 45.9],
		[32.5, 46.2]
	]
);

/** The First Bulgarian Empire, between the Danube and the Haemus, with the land north of it. */
const BULGARIA = [
	[22.4, 44.6],
	[22.6, 44.0],
	[22.9, 43.4],
	[23.5, 43.0],
	[24.6, 42.75],
	[25.8, 42.55],
	[26.6, 42.45],
	[27.5, 42.45],
	[27.9, 42.45],
	[28.6, 43.0],
	[29.5, 44.5],
	[30.2, 45.2],
	[30.0, 46.4],
	[28.5, 47.0],
	[26.8, 46.2],
	[25.0, 45.6],
	[23.0, 45.0]
];

/** Byzantine Thrace below the Bulgarian frontier of 716, to Thessalonica. */
const THRACE_740 = [
	[29.1, 41.25],
	[29.5, 41.6],
	[28.4, 42.6],
	[27.9, 42.45],
	[27.5, 42.45],
	[26.6, 42.45],
	[25.8, 42.55],
	[24.6, 42.75],
	[23.5, 42.8],
	[23.2, 42.5],
	[23.6, 41.8],
	[23.4, 41.2],
	[23.0, 40.95],
	[22.5, 40.6],
	[22.6, 40.2],
	[23.4, 39.9],
	[24.5, 40.3],
	[25.6, 40.5],
	[26.2, 40.3],
	[27.0, 40.55],
	[28.0, 40.85]
];

/**
 * Basil II's empire at his death in 1025: the Danube again, Sirmium, Dyrrachium, Cilicia, the
 * duchy of Antioch to Latakia, Samosata and Melitene, Taron, Manzikert, Vaspurakan, and Tao.
 */
const BYZANTIUM_1025 = join(
	[
		[19.6, 45.0],
		[19.4, 44.6],
		[19.9, 44.0],
		[20.6, 43.6],
		[20.9, 43.0],
		[20.4, 42.6],
		[19.9, 42.3],
		[19.4, 41.9],
		[19.0, 40.2],
		[19.5, 38.5],
		[20.0, 36.0],
		[24.0, 34.6],
		[26.5, 34.7],
		[28.5, 36.0],
		[31.0, 35.8],
		[34.0, 35.9],
		[35.6, 35.6],
		[35.95, 35.25],
		[36.2, 35.35],
		[36.4, 35.6],
		[36.5, 35.95],
		[36.75, 36.2],
		[37.2, 36.5],
		[37.8, 36.8],
		[38.1, 37.0],
		[38.5, 37.6],
		[39.0, 37.75],
		[39.5, 38.0],
		[40.0, 38.5],
		[40.8, 38.6],
		[41.0, 38.9],
		[41.8, 38.9],
		[42.4, 38.6],
		[42.6, 38.2],
		[43.5, 37.9],
		[44.2, 38.2],
		[44.6, 38.8],
		[44.2, 39.3],
		[43.6, 39.7],
		[43.0, 40.1],
		[42.5, 40.6],
		[42.9, 41.2],
		[42.3, 41.6],
		[41.7, 41.7],
		[40.0, 42.0],
		[35.0, 42.4],
		[31.0, 42.0],
		[29.8, 43.0],
		[29.9, 44.6]
	],
	rev(DANUBE)
);

/** The catepanate of Italy: Apulia to the Fortore and Troia, Lucania, and Calabria. */
const CATEPANATE = [
	[15.2, 41.95],
	[15.1, 41.5],
	[15.3, 41.2],
	[15.6, 40.9],
	[15.7, 40.5],
	[15.65, 40.05],
	[15.4, 39.6],
	[15.8, 38.6],
	[15.68, 38.28],
	[15.6, 38.15],
	[15.62, 37.85],
	[16.3, 37.7],
	[17.4, 38.8],
	[18.7, 39.7],
	[18.7, 40.5],
	[16.5, 41.6],
	[15.9, 42.1]
];

/** The Fatimids in 1025: Egypt, Palestine, Damascus and the coast to Tripoli, the Hejaz, Barqa. */
const FATIMID = join(
	[
		[24.9, 32.4],
		[29.5, 31.9],
		[33.6, 32.0],
		[34.4, 33.2],
		[35.5, 34.6],
		[35.9, 35.0],
		[36.5, 34.6],
		[37.2, 34.2],
		[37.6, 33.6],
		[37.1, 32.6],
		[36.82, 31.83],
		[36.6, 29.5],
		[38.5, 27.0],
		[40.0, 24.0],
		[41.0, 21.5],
		[41.8, 19.0],
		[41.2, 18.8],
		[38.0, 21.0]
	],
	EGYPT_SOUTH,
	CYRENAICA_INLAND,
	[
		[18.4, 31.8],
		[20.5, 33.8],
		[23.5, 33.3]
	]
);

/** Zirid Ifriqiya and Tripolitania, still the Fatimids' vassals in 1025. */
const IFRIQIYA = join(
	[
		[3.0, 37.5],
		[9.5, 37.8],
		[11.5, 37.2],
		[11.6, 35.0],
		[11.6, 33.6],
		[13.0, 33.3],
		[15.5, 32.6],
		[17.5, 31.5],
		[18.4, 31.6],
		[18.4, 30.2]
	],
	SAHARA_EDGE.slice(3)
);

/**
 * The rest of the Islamic world in 1025: Mirdasid Aleppo, the Marwanids and Uqaylids, the
 * Buyids under the Abbasid caliph, the Ghaznavids and Karakhanids, Shirvan and Derbent.
 * Georgia and the Armenian kingdoms of Ani and Kars stay out.
 */
const ISLAMIC_EAST = join(
	[
		[35.0, 36.0],
		[36.5, 37.5],
		[39.0, 38.3],
		[41.0, 38.7],
		[43.0, 38.4],
		[44.6, 38.8],
		[44.9, 39.5],
		[45.5, 40.2],
		[46.0, 40.9],
		[46.8, 41.4],
		[47.5, 41.5],
		[48.6, 41.9],
		[49.6, 41.6],
		[51.0, 40.8]
	],
	OXUS_NORTH,
	ARABIA_SEA,
	[
		[35.4, 26.5],
		[35.0, 29.5],
		[36.5, 31.0],
		[35.8, 33.0]
	]
);

/** Pechenegs west of the Don, the Oghuz past the Volga, north of the Islamic line. */
const STEPPE_1025 = join(
	[
		[29.7, 45.3],
		[28.3, 45.9],
		[28.6, 47.6],
		[28.0, 49.5],
		[70.0, 49.5],
		[70.0, 40.6]
	],
	rev(OXUS_NORTH),
	[
		[51.5, 44.0],
		[48.5, 45.5],
		[46.0, 45.8],
		[43.0, 46.0],
		[40.0, 46.0],
		[38.5, 46.6],
		[35.5, 46.2],
		[34.5, 45.9],
		[33.5, 46.0],
		[32.0, 46.3],
		[30.5, 45.8]
	]
);

/**
 * Alexander's empire at his death in 323 BC: Macedon and the League, Thrace to the Haemus,
 * Anatolia without Bithynia and Pontic Cappadocia, the Levant, Egypt with Siwa, Babylonia,
 * Media and Atropatene, Hyrcania, Parthia, Margiana, Sogdiana, and the road to the Indus.
 */
const ALEXANDER = [
	[19.0, 39.6],
	[19.9, 40.2],
	[20.6, 40.9],
	[20.9, 41.4],
	[21.6, 41.9],
	[22.6, 42.2],
	[23.4, 42.3],
	[24.5, 42.75],
	[26.0, 42.75],
	[27.5, 42.8],
	[28.2, 42.8],
	[29.0, 41.2],
	[28.7, 40.5],
	[29.3, 40.0],
	[30.5, 39.9],
	[31.6, 40.4],
	[31.8, 41.2],
	[31.5, 41.4],
	[32.5, 42.2],
	[35.0, 42.2],
	[36.0, 41.6],
	[36.3, 41.2],
	[36.0, 40.3],
	[37.5, 39.7],
	[38.5, 39.3],
	[38.8, 39.0],
	[39.5, 38.4],
	[40.8, 38.0],
	[42.0, 37.6],
	[43.5, 37.2],
	[44.5, 37.6],
	[45.0, 38.8],
	[46.0, 39.3],
	[47.5, 39.5],
	[48.8, 39.0],
	[49.5, 39.0],
	[51.0, 37.5],
	[53.5, 37.5],
	[54.0, 38.5],
	[55.0, 38.2],
	[57.5, 38.4],
	[59.5, 37.4],
	[61.8, 37.6],
	[62.0, 38.6],
	[63.6, 39.1],
	[64.5, 39.8],
	[65.3, 40.4],
	[66.5, 40.8],
	[68.0, 40.5],
	[68.0, 24.0],
	[66.0, 24.8],
	[62.0, 24.8],
	[58.5, 25.2],
	[56.5, 26.5],
	[55.5, 26.4],
	[52.0, 27.0],
	[50.0, 28.3],
	[49.0, 29.2],
	[48.2, 29.9],
	[47.4, 30.4],
	[46.3, 31.0],
	[44.6, 31.6],
	[43.6, 32.3],
	[42.5, 33.4],
	[41.3, 34.4],
	[40.2, 35.2],
	[38.5, 34.5],
	[37.6, 33.3],
	[36.9, 32.0],
	[36.4, 30.5],
	[35.6, 29.6],
	[35.0, 28.0],
	[36.0, 24.0],
	[32.9, 23.9],
	[30.5, 24.5],
	[30.0, 25.0],
	[28.0, 26.2],
	[25.5, 28.8],
	[25.0, 31.6],
	[25.0, 33.0],
	[27.0, 35.0],
	[26.5, 35.8],
	[25.0, 36.3],
	[23.0, 36.1],
	[21.5, 36.5],
	[20.0, 38.0]
];

/** Cyrene, allied to Alexander and annexed by Ptolemy in 322. */
const CYRENE_ALLY = [
	[19.6, 30.4],
	[19.8, 32.6],
	[23.5, 33.3],
	[25.0, 32.0],
	[25.0, 31.0],
	[23.0, 30.8],
	[21.0, 30.2]
];

/** Orontid Armenia, a satrapy in name only. */
const ARMENIA_SATRAPY = [
	[38.8, 39.0],
	[39.5, 40.5],
	[41.5, 41.0],
	[43.5, 41.2],
	[45.5, 40.9],
	[46.5, 39.6],
	[45.0, 38.8],
	[44.5, 37.6],
	[43.5, 37.2],
	[42.0, 37.6],
	[40.8, 38.0],
	[39.5, 38.4]
];

/** Rome in 323 BC, in the Second Samnite War: Latium, Campania, and southern Etruria. */
const ROME_323 = [
	[11.7, 42.2],
	[12.3, 42.35],
	[12.7, 42.2],
	[13.1, 42.0],
	[13.7, 41.75],
	[14.1, 41.4],
	[14.6, 41.15],
	[14.7, 40.75],
	[14.3, 40.55],
	[13.5, 41.0],
	[12.5, 41.4],
	[11.6, 42.0]
];

// ---------------------------------------------------------------- the phases

/** The two hired Arab kingdoms, kept as named regions so a map can light them alone. */
const GHASSANID_CLIENT = { ring: GHASSANID, color: 'romeEast', alpha: CLIENT };
const LAKHMID_CLIENT = { ring: LAKHMID, color: 'persia', alpha: CLIENT };

/** @type {Record<string, Region[]>} */
const ANTIQUE = {
	alexander: [
		{ ring: ALEXANDER, color: 'greece' },
		{ ring: CYRENE_ALLY, color: 'greece', alpha: 0.5 },
		{ ring: ARMENIA_SATRAPY, color: 'greece', alpha: 0.5 },
		{ ring: ROME_323, color: 'rome' }
	],
	justinian: [
		{ ring: STEPPE, color: 'steppe', alpha: 0.5 },
		{ ring: persia(FRONTIER_565), color: 'persia' },
		{ ring: BAHRAIN, color: 'persia', alpha: 0.6 },
		{ ring: OMAN_COAST, color: 'persia', alpha: 0.6 },
		GHASSANID_CLIENT,
		LAKHMID_CLIENT,
		{ ring: romeAsia(FRONTIER_565), color: 'romeEast' },
		{ ring: BALKANS, color: 'romeEast' },
		{ ring: CRIMEA_COAST, color: 'romeEast' },
		{ rings: [ITALY_ISLANDS, DALMATIA, AFRICA_EXARCHATE, TRIPOLITANIA], color: 'romeWest' }
	],
	dual600: [
		{ ring: STEPPE, color: 'steppe', alpha: 0.5 },
		{ ring: AVARS, color: 'steppe', alpha: 0.5 },
		{ ring: persia(FRONTIER_591), color: 'persia' },
		{ rings: [BAHRAIN, OMAN_COAST, YEMEN], color: 'persia', alpha: 0.6 },
		GHASSANID_CLIENT,
		LAKHMID_CLIENT,
		{ ring: romeAsia(FRONTIER_591), color: 'romeEast' },
		{ ring: BALKANS, color: 'romeEast' },
		{ ring: CHERSON, color: 'romeEast' },
		{ rings: [...EXARCHATE_600, DALMATIA, AFRICA_EXARCHATE, TRIPOLITANIA], color: 'romeWest' }
	],
	sasanian620: [
		{ ring: STEPPE, color: 'steppe', alpha: 0.5 },
		{ ring: AVARS, color: 'steppe', alpha: 0.5 },
		{ rings: [ANATOLIA, THRACE_COAST, GREEK_COAST, ADRIATIC_TOWNS, CYPRUS, CHERSON], color: 'romeEast' },
		{ ring: PERSIA_620, color: 'persia' },
		{ rings: [BAHRAIN, OMAN_COAST, YEMEN], color: 'persia', alpha: 0.6 },
		{ rings: [...EXARCHATE_600, AFRICA_EXARCHATE, TRIPOLITANIA], color: 'romeWest' }
	],
	rashidun655: [
		{ ring: STEPPE, color: 'steppe', alpha: 0.5 },
		{ ring: AVARS, color: 'steppe', alpha: 0.5 },
		{ rings: [ANATOLIA, THRACE_COAST, GREEK_COAST, ADRIATIC_TOWNS, CHERSON], color: 'romeEast' },
		{ ring: caliphateCore([...CYRENAICA_INLAND, ...TRIPOLITANIA_INLAND.slice(0, 3), [13.0, 32.3], [13.0, 33.3]]), color: 'caliphate' },
		{ ring: ARMINIYA, color: 'caliphate', alpha: 0.55 },
		{ ring: CASPIAN_HOLDOUTS, color: 'persia' },
		{ ring: CYPRUS, color: 'romeEast', alpha: 0.5 },
		{ rings: [...EXARCHATE_655, AFRICA_EXARCHATE], color: 'romeWest' }
	],
	byzantine863: [
		{ ring: STEPPE_1025, color: 'steppe', alpha: 0.45 },
		{ ring: ISLAMIC_EAST, color: 'caliphate', alpha: 0.78 },
		{ rings: [IFRIQIYA, SICILY], color: 'caliphate', alpha: 0.78 },
		{ ring: FATIMID, color: 'caliphate' },
		{ rings: [BYZANTIUM_1025, CRETE, CYPRUS, CHERSON], color: 'romeEast' },
		{ ring: CATEPANATE, color: 'romeWest' }
	],
	umayyad740: [
		{ ring: STEPPE_740, color: 'steppe', alpha: 0.5 },
		{ ring: BULGARIA, color: 'steppe', alpha: 0.5 },
		{ rings: [ANATOLIA, THRACE_740, GREEK_COAST, ADRIATIC_TOWNS, CHERSON], color: 'romeEast' },
		{
			ring: join(
				TAURUS.slice(0, 12),
				JAZIRA_NORTH.slice().reverse(),
				[
					[49.4, 39.4],
					[50.5, 38.0],
					[52.5, 37.2],
					[54.0, 37.0],
					[53.0, 39.5]
				],
				OXUS_NORTH,
				ARABIA_SEA,
				EGYPT_SOUTH,
				SAHARA_EDGE,
				[
					[3.0, 37.5],
					[9.5, 37.8],
					[11.3, 37.3],
					[11.6, 36.0],
					[14.0, 34.5]
				],
				LEVANT_SEA
			),
			color: 'caliphate'
		},
		{ ring: ARMINIYA, color: 'caliphate', alpha: 0.85 },
		{ ring: CASPIAN_HOLDOUTS, color: 'persia' },
		{ ring: CYPRUS, color: 'romeEast', alpha: 0.5 },
		{ rings: EXARCHATE_740, color: 'romeWest' }
	]
};

/** @type {Record<string, number[][][]>} */
const FRONTIERS = {
	justinian: [FRONTIER_565],
	dual600: [FRONTIER_591],
	sasanian620: [PERSIA_620_FRONT],
	rashidun655: [TAURUS],
	byzantine863: [TAURUS],
	umayyad740: [TAURUS]
};

/** @param {string} phase @returns {Region[]} */
export const antiqueRegions = (phase) => ANTIQUE[phase] ?? ANTIQUE.dual600;

/**
 * The dashed frontier for a phase; for the Macedonian revival it is the line of 863.
 * @param {string} phase
 * @returns {number[][][]}
 */
export const antiqueFrontiers = (phase) => FRONTIERS[phase] ?? [];

// ---------------------------------------------------------------- the modern sheet

const SOUTH_CLIENT = { iso: 'KOR', color: 'romeEast', alpha: CLIENT };
const NORTH_CLIENT = { iso: 'PRK', color: 'persia', alpha: CLIENT };

/** The client kings on each side: the Ghassanids and Lakhmids, the two Koreas. */
export const CLIENTS = {
	antique: [GHASSANID_CLIENT, LAKHMID_CLIENT],
	modern: [SOUTH_CLIENT, NORTH_CLIENT]
};

/** @type {Record<string, Region[]>} */
const MODERN = {
	buffers: [
		{ iso: 'RUS', color: 'steppe' },
		{ iso: 'USA', color: 'romeEast' },
		{ iso: 'TWN', color: 'romeEast' },
		SOUTH_CLIENT,
		{ iso: 'CHN', color: 'persia' },
		{ iso: 'MNG', color: 'persia', alpha: 0.42 },
		NORTH_CLIENT,
		{ iso: 'JPN', color: 'greece' }
	],
	union: [
		{ iso: 'RUS', color: 'steppe' },
		{ iso: 'USA', color: 'romeEast' },
		{ iso: 'TWN', color: 'romeEast' },
		{ iso: 'CHN', color: 'persia' },
		{ iso: 'MNG', color: 'persia', alpha: 0.42 },
		{ iso: 'JPN', color: 'greece' },
		{ iso: 'KOR', color: 'caliphate' },
		{ iso: 'PRK', color: 'caliphate' }
	],
	war: [
		{ iso: 'RUS', color: 'steppe' },
		{ iso: 'USA', color: 'romeEast' },
		{ iso: 'CHN', color: 'persia' },
		{ iso: 'MNG', color: 'persia', alpha: 0.42 },
		{ iso: 'PRK', color: 'persia' },
		{ iso: 'KOR', color: 'romeEast' },
		{ iso: 'JPN', color: 'romeEast' },
		{ iso: 'PHL', color: 'romeEast' },
		{ iso: 'TWN', color: 'romeEast', alpha: 0.55 },
		{ iso: 'TWN', color: 'persia', alpha: 0.6, blur: 4 }
	],
	caliphate: [
		{ iso: 'RUS', color: 'caliphate' },
		{ iso: 'USA', color: 'romeEast' },
		{ iso: 'TWN', color: 'romeEast' },
		{ iso: 'CHN', color: 'persia' },
		{ iso: 'MNG', color: 'persia', alpha: 0.35 },
		{ rings: provinces.kaliphate, color: 'caliphate', blur: 3 },
		{ rings: provinces.manchuria, color: 'caliphate' },
		{ iso: 'JPN', color: 'greece' },
		{ iso: 'KOR', color: 'caliphate' },
		{ iso: 'PRK', color: 'caliphate' }
	]
};

/** @param {string} phase @returns {Region[]} */
export const modernRegions = (phase) => MODERN[phase] ?? MODERN.buffers;

// ---------------------------------------------------------------- close-up marks

/**
 * Darius I's empire about 500 BC: Thrace and the Aegean shore, all of Anatolia, Cyprus, the
 * Levant and northern Arabia, Egypt to Elephantine with Kharga, Cyrenaica, Armenia to the Kura,
 * Chorasmia and Sogdiana, Maka on both sides of Hormuz, and the Indus beyond the frame.
 */
const ACHAEMENID = [
	[23.8, 40.7],
	[23.8, 41.3],
	[24.5, 41.7],
	[26.0, 42.2],
	[27.6, 42.6],
	[28.5, 42.5],
	[31.0, 42.2],
	[35.0, 42.3],
	[38.0, 41.3],
	[41.6, 41.5],
	[42.5, 41.2],
	[44.0, 41.0],
	[45.5, 41.0],
	[46.5, 40.8],
	[48.5, 40.2],
	[49.2, 39.5],
	[50.0, 39.0],
	[52.0, 38.5],
	[53.0, 40.0],
	[54.5, 39.0],
	[57.0, 39.8],
	[59.0, 42.5],
	[60.5, 43.3],
	[62.0, 42.5],
	[64.0, 41.6],
	[66.5, 41.5],
	[70.0, 41.0],
	[70.0, 24.0],
	[66.0, 24.5],
	[60.0, 24.5],
	[59.0, 22.5],
	[58.0, 22.5],
	[56.5, 23.6],
	[55.8, 24.3],
	[55.5, 25.5],
	[56.0, 26.5],
	[54.0, 26.3],
	[51.0, 27.5],
	[48.5, 29.8],
	[47.5, 30.3],
	[46.0, 30.5],
	[44.5, 31.0],
	[43.0, 31.5],
	[41.5, 30.8],
	[40.0, 30.0],
	[38.5, 27.5],
	[36.0, 27.8],
	[35.5, 28.0],
	[36.0, 24.5],
	[32.9, 24.0],
	[30.5, 24.5],
	[28.5, 25.5],
	[27.0, 27.5],
	[25.5, 29.5],
	[23.0, 30.5],
	[20.0, 30.4],
	[20.0, 33.0],
	[24.0, 34.6],
	[25.0, 34.6],
	[27.0, 35.3],
	[27.5, 35.6],
	[28.5, 36.5],
	[26.5, 37.5],
	[25.7, 38.5],
	[25.3, 39.4],
	[24.6, 40.4]
];

/**
 * The Iranian plateau: the Zagros mountain front, the Araxes, the Caspian shore, the Kopet Dag
 * and Khorasan, and the Gulf and Makran coasts. Mesopotamia and the Khuzestan plain are out.
 */
const IRAN_PLATEAU = [
	[44.4, 39.7],
	[45.0, 39.4],
	[46.5, 38.9],
	[48.0, 39.3],
	[48.9, 38.5],
	[49.5, 38.5],
	[50.5, 37.6],
	[53.5, 37.3],
	[54.0, 37.5],
	[55.5, 38.0],
	[57.0, 38.2],
	[58.5, 37.7],
	[60.3, 36.7],
	[61.2, 35.8],
	[62.5, 35.4],
	[64.0, 35.6],
	[65.5, 36.6],
	[66.5, 37.0],
	[67.0, 33.0],
	[66.8, 30.0],
	[66.5, 28.0],
	[66.6, 25.3],
	[66.5, 24.5],
	[61.6, 24.7],
	[58.0, 25.2],
	[56.8, 26.4],
	[55.0, 26.4],
	[53.0, 26.6],
	[51.5, 27.6],
	[50.4, 28.8],
	[50.0, 29.7],
	[50.2, 30.3],
	[49.6, 31.3],
	[48.9, 32.2],
	[47.9, 32.9],
	[47.0, 33.7],
	[46.1, 34.6],
	[45.6, 35.2],
	[45.0, 35.8],
	[44.3, 36.4],
	[43.6, 37.2],
	[44.2, 37.9],
	[44.3, 38.6]
];

/** The Qing beyond today's border: Outer Manchuria to the Stanovoy range, and Sakhalin. */
const OUTER_MANCHURIA = [
	[121.4, 53.3],
	[121.0, 54.5],
	[124.0, 55.0],
	[127.0, 55.2],
	[131.0, 55.3],
	[135.0, 54.9],
	[136.0, 54.6],
	[138.0, 54.5],
	[142.8, 54.4],
	[144.5, 54.5],
	[144.5, 49.0],
	[143.5, 46.0],
	[142.2, 45.9],
	[139.5, 42.8],
	[130.7, 42.3],
	[130.6, 42.5],
	[129.5, 44.0],
	[127.0, 47.0],
	[124.0, 50.0],
	[120.5, 50.5]
];

/** Tannu Uriankhai, Qing until 1911. */
const TUVA = [
	[88.9, 50.8],
	[89.6, 51.9],
	[91.0, 52.3],
	[93.0, 53.0],
	[95.0, 53.2],
	[96.6, 53.6],
	[98.5, 53.0],
	[99.0, 52.0],
	[98.5, 51.3],
	[97.8, 50.6],
	[96.0, 50.0],
	[94.5, 50.0],
	[92.5, 50.7],
	[90.8, 50.4],
	[89.5, 49.8]
];

/** The Ili frontier before the 1864 Tarbagatai treaty: Balkhash's south shore, Issyk-Kul, Zaysan. */
const BALKHASH = [
	[74.2, 46.4],
	[75.5, 46.6],
	[77.0, 46.6],
	[79.0, 46.5],
	[80.5, 47.2],
	[83.0, 47.8],
	[85.5, 48.5],
	[87.3, 49.2],
	[86.0, 47.5],
	[82.0, 45.0],
	[80.5, 43.0],
	[80.2, 42.0],
	[78.0, 41.0],
	[75.5, 41.2],
	[74.5, 42.5],
	[73.8, 43.5],
	[73.8, 45.3]
];

/** The Thirteen Colonies inside the 1763 Proclamation Line, Maine to the St Marys. */
const THIRTEEN_COLONIES = [
	[-67.0, 45.0],
	[-67.8, 45.7],
	[-67.8, 47.0],
	[-69.2, 47.4],
	[-70.0, 46.2],
	[-71.0, 45.3],
	[-71.5, 45.0],
	[-73.3, 45.0],
	[-74.7, 45.0],
	[-75.2, 44.0],
	[-75.5, 43.2],
	[-75.8, 42.4],
	[-76.5, 42.0],
	[-77.6, 41.8],
	[-78.2, 41.3],
	[-78.6, 40.5],
	[-78.8, 39.7],
	[-79.5, 38.8],
	[-80.2, 37.8],
	[-80.8, 37.0],
	[-81.6, 36.3],
	[-82.3, 35.6],
	[-83.0, 35.0],
	[-83.2, 34.7],
	[-82.6, 33.6],
	[-82.3, 32.4],
	[-82.0, 31.2],
	[-82.0, 30.6],
	[-81.0, 30.6],
	[-75.0, 35.0],
	[-73.0, 40.0],
	[-69.5, 41.0],
	[-66.5, 44.5]
];

/** Latium vetus, the Tiber mouth to the Monte Circeo. */
const LATIUM = [
	[12.22, 41.75],
	[12.4, 41.93],
	[12.62, 42.0],
	[12.85, 42.0],
	[12.98, 41.83],
	[13.05, 41.62],
	[13.15, 41.4],
	[13.1, 41.22],
	[12.7, 41.2],
	[12.2, 41.6]
];

/** Etruria between the Arno and the Tiber, under the Apennines. */
const ETRURIA = [
	[10.28, 43.68],
	[11.25, 43.77],
	[11.9, 43.6],
	[12.2, 43.3],
	[12.3, 42.9],
	[12.5, 42.4],
	[12.55, 42.0],
	[12.45, 41.85],
	[12.23, 41.74],
	[12.0, 41.8],
	[10.0, 43.0],
	[10.1, 43.7]
];

/**
 * Hispania in 30 BC. The Cantabrian northwest is left out: it held until 19 BC.
 * East from the Pyrenees, down the Mediterranean, around to Lisbon, then inland of Galicia.
 */
const HISPANIA_30BC = [
	[3.15, 42.45],
	[1.8, 42.3],
	[0.6, 41.2],
	[0.15, 40.0],
	[-0.2, 39.0],
	[-0.6, 38.0],
	[-0.9, 37.4],
	[-2.0, 36.7],
	[-4.4, 36.5],
	[-5.6, 36.0],
	[-6.3, 36.5],
	[-7.4, 37.0],
	[-8.9, 37.1],
	[-8.9, 38.8],
	[-8.8, 40.2],
	[-8.7, 41.15],
	[-7.4, 41.55],
	[-6.3, 41.15],
	[-5.2, 41.3],
	[-4.6, 42.15],
	[-3.4, 42.7],
	[-1.8, 43.3],
	[0.2, 42.8],
	[1.7, 42.7],
	[3.15, 42.45]
];

/** Gaul in 30 BC: the Atlantic, the Channel, and the Rhine, stopping on the Alpine crest. */
const GAUL_30BC = [
	[-1.8, 43.35],
	[-1.5, 46.3],
	[-2.4, 47.4],
	[-4.6, 47.8],
	[-4.8, 48.5],
	[-2.8, 48.7],
	[-1.5, 48.5],
	[-1.3, 49.7],
	[1.6, 51.0],
	[2.5, 51.1],
	[4.3, 51.4],
	[5.8, 51.5],
	[6.2, 51.0],
	[6.9, 50.2],
	[7.1, 49.5],
	[8.2, 48.8],
	[7.6, 47.6],
	[8.6, 47.2],
	[7.6, 46.2],
	[6.9, 45.2],
	[7.0, 44.2],
	[7.5, 43.6],
	[6.2, 43.2],
	[4.7, 43.3],
	[3.1, 42.45],
	[1.5, 42.8],
	[-1.8, 43.35]
];

/** Rome after Actium: Italy and the islands, Hispania, Gaul, Illyricum, Africa to the Ampsaga. */
const ROME_30BC_WEST = [
	ITALY_ISLANDS,
	GAUL_30BC,
	HISPANIA_30BC,
	[
		[14.0, 45.4],
		[15.0, 45.6],
		[16.4, 45.5],
		[17.5, 44.6],
		[18.5, 43.8],
		[19.3, 42.8],
		[19.6, 41.85],
		[19.2, 41.8],
		[18.0, 42.3],
		[16.5, 43.0],
		[14.8, 44.0],
		[14.0, 44.8]
	],
	[
		[6.3, 37.5],
		[6.3, 36.5],
		[6.5, 35.8],
		[7.2, 35.3],
		[8.5, 34.8],
		[9.5, 34.3],
		[10.1, 33.9],
		[11.3, 32.6],
		[12.5, 32.3],
		[14.0, 31.9],
		[14.8, 32.2],
		[15.0, 33.0],
		[11.6, 33.6],
		[11.6, 35.0],
		[11.5, 37.2],
		[9.5, 37.8]
	]
];

/** Rome after Actium in the Greek east: Macedonia and Achaea, Asia and Bithynia, Cilicia and Syria, Crete and Cyrene, Egypt. */
const ROME_30BC_EAST = [
	[
		[19.3, 39.6],
		[19.4, 40.6],
		[19.6, 41.3],
		[19.7, 41.85],
		[20.5, 41.9],
		[21.4, 42.1],
		[22.4, 41.9],
		[23.3, 41.6],
		[24.1, 41.2],
		[24.8, 40.85],
		[25.5, 40.0],
		[26.0, 37.0],
		[24.5, 36.0],
		[22.5, 36.0],
		[21.0, 37.0],
		[20.2, 38.5]
	],
	[
		[26.0, 40.0],
		[29.1, 41.2],
		[31.0, 41.6],
		[33.0, 42.1],
		[35.0, 42.2],
		[36.4, 41.6],
		[36.0, 41.0],
		[34.5, 41.1],
		[33.0, 41.0],
		[31.8, 40.6],
		[31.0, 40.0],
		[31.0, 39.2],
		[31.3, 38.3],
		[30.4, 37.5],
		[29.6, 37.0],
		[29.3, 36.6],
		[28.6, 36.4],
		[27.5, 36.4],
		[26.5, 37.2],
		[25.6, 38.4],
		[25.8, 39.6]
	],
	[
		[34.3, 36.6],
		[34.5, 37.2],
		[35.3, 37.4],
		[36.1, 37.3],
		[36.9, 37.0],
		[37.9, 37.1],
		[38.2, 36.3],
		[37.8, 35.2],
		[37.0, 34.5],
		[36.8, 33.6],
		[36.0, 33.0],
		[35.6, 33.3],
		[35.1, 33.2],
		[34.7, 33.5],
		[35.0, 35.0],
		[33.0, 34.4],
		[32.0, 34.7],
		[32.2, 35.6],
		[33.5, 36.1]
	],
	CRETE,
	[[25.2, 32.0], [25.15, 31.55], ...CYRENAICA_INLAND, [18.4, 31.8], [20.5, 33.6], [23.5, 33.3]],
	[
		[25.2, 32.0],
		[25.15, 31.55],
		...EGYPT_SOUTH.slice().reverse(),
		[36.6, 23.6],
		[35.0, 27.0],
		[33.6, 27.9],
		[33.0, 28.8],
		[32.6, 29.9],
		[32.4, 30.6],
		[33.0, 31.0],
		[33.8, 31.1],
		[33.8, 32.0],
		[29.0, 31.9]
	]
];

/** Rome's clients in 30 BC: Thrace, Galatia, Cappadocia, Pontus, Commagene, Judaea, Nabataea, Mauretania. */
const ROME_30BC_CLIENTS = [
	[
		[24.7, 40.85],
		[24.1, 41.2],
		[23.3, 41.6],
		[22.6, 42.3],
		[24.0, 42.9],
		[26.0, 43.5],
		[27.8, 43.6],
		[28.6, 43.6],
		[28.4, 42.0],
		[29.1, 41.25],
		[28.0, 40.85],
		[26.2, 40.3],
		[25.5, 40.6]
	],
	[
		[31.0, 40.0],
		[31.8, 40.6],
		[33.0, 41.0],
		[34.5, 41.1],
		[34.8, 40.0],
		[34.6, 38.5],
		[33.8, 37.3],
		[33.4, 36.2],
		[31.0, 36.4],
		[30.4, 36.6],
		[30.4, 37.5],
		[31.3, 38.3],
		[31.0, 39.2]
	],
	[
		[34.5, 41.1],
		[36.0, 41.0],
		[38.0, 40.3],
		[38.8, 39.0],
		[38.0, 38.0],
		[36.1, 37.6],
		[34.8, 37.35],
		[34.6, 38.5],
		[34.8, 40.0]
	],
	[
		[36.0, 41.0],
		[36.4, 41.6],
		[39.0, 41.6],
		[40.5, 41.4],
		[40.0, 40.3],
		[38.0, 40.3]
	],
	[
		[36.9, 37.0],
		[37.9, 37.1],
		[38.8, 37.6],
		[38.8, 38.3],
		[37.5, 38.2],
		[36.6, 37.7],
		[36.1, 37.3]
	],
	[
		[34.2, 31.25],
		[34.9, 31.0],
		[35.4, 30.9],
		[35.6, 31.5],
		[35.9, 32.0],
		[36.0, 32.7],
		[35.9, 33.2],
		[35.6, 33.3],
		[35.15, 33.2],
		[34.6, 32.5],
		[34.2, 31.6]
	],
	[
		[35.0, 29.5],
		[34.6, 30.5],
		[35.4, 30.9],
		[35.6, 31.5],
		[35.9, 32.0],
		[36.5, 32.5],
		[37.5, 32.2],
		[38.5, 30.0],
		[37.5, 27.5],
		[36.8, 26.5],
		[35.5, 27.5]
	]
];

/** Mauretania, Rome's client from the Atlantic to the Ampsaga. */
const MAURETANIA = [
	[-5.9, 35.8],
	[-5.4, 35.15],
	[-3.6, 35.2],
	[-1.4, 35.15],
	[1.2, 35.5],
	[3.2, 36.4],
	[5.0, 36.9],
	[6.3, 37.5],
	[6.3, 36.5],
	[4.8, 35.5],
	[2.2, 34.9],
	[-1.2, 34.7],
	[-4.2, 34.7],
	[-5.9, 35.25]
];

/** @type {Region[]} */
export const ACHAEMENID_MARKS = [{ ring: ACHAEMENID, color: 'persia' }];

/** @type {Region[]} */
export const PLATEAU_MARKS = [
	{ ring: ACHAEMENID, color: 'persia', alpha: 0.34 },
	{ ring: IRAN_PLATEAU, color: 'persia' }
];

/** @type {Region[]} */
export const QING_MARKS = [
	{ iso: 'CHN', color: 'persia' },
	{ iso: 'MNG', color: 'persia' },
	{ iso: 'TWN', color: 'persia' },
	{ rings: [OUTER_MANCHURIA, TUVA, BALKHASH], color: 'persia' }
];

/** @type {Region[]} */
export const CHINA_PROPER_MARKS = [
	...QING_MARKS.map((item) => ({ ...item, alpha: 0.28 })),
	{ rings: provinces.chinaProper, color: 'persia' }
];

/**
 * The republic's China: the same country as the People's Republic, with Tibet left uncolored.
 * The Tibet ring is painted back to bare land, so the coast stays the country's own coast.
 */
/** @type {Region[]} */
export const ROC_MARKS = [
	{ iso: 'CHN', color: 'persia' },
	{ rings: provinces.tibet, color: 'land' }
];

/** @type {Region[]} */
export const LATIUM_MARKS = [{ ring: LATIUM, color: 'romeEast' }];

/** @type {Region[]} */
export const ETRURIA_MARKS = [{ ring: ETRURIA, color: 'romeWest' }];

/** @type {Region[]} */
export const ROMAN_SEA_MARKS = [
	{ rings: [...ROME_30BC_CLIENTS], color: 'romeEast', alpha: 0.4 },
	{ ring: MAURETANIA, color: 'romeWest', alpha: 0.4 },
	{ rings: ROME_30BC_WEST, color: 'romeWest' },
	{ rings: ROME_30BC_EAST, color: 'romeEast' }
];

/** The later country stays an outline; the colonies are the only fill. */
/** @type {Region[]} */
export const COLONIES_MARKS = [
	{ rings: lower48, color: 'land', outline: true },
	{ ring: THIRTEEN_COLONIES, color: 'romeEast' }
];

/** A map that starts empty, for an animation that paints its subject in from nothing. */
/** @type {Region[]} */
export const NONE = [];

// ---------------------------------------------------------------- the union, before the spread

/**
 * Arabia at Muhammad's death in 632: the Hejaz, Najd, Yemen, Oman, and the Gulf shore, north to
 * Ayla and Dumat al-Jandal after Tabuk. Sinai and the Syrian desert are still Roman and Persian.
 */
const ARABIA_632 = [
	[34.95, 29.5],
	[36.2, 29.75],
	[37.6, 30.0],
	[39.2, 30.3],
	[40.6, 30.0],
	[42.6, 29.4],
	[44.8, 29.05],
	[46.6, 28.95],
	[48.2, 28.6],
	[50.6, 27.6],
	[52.6, 25.6],
	[56.4, 26.6],
	[60.2, 22.8],
	[57.2, 16.8],
	[52.0, 14.4],
	[45.0, 11.7],
	[43.3, 12.4],
	[41.6, 15.4],
	[39.6, 19.4],
	[37.6, 23.0],
	[35.6, 26.6],
	[34.75, 28.2]
];

/** Rome and Persia after their last war, with Arabia one country under Medina. */
/** @type {Region[]} */
export const ARABIA_632_MARKS = [...ANTIQUE.dual600, { ring: ARABIA_632, color: 'caliphate' }];

/** @type {Region[]} */
export const ARABIA_BEFORE_MARKS = ANTIQUE.dual600;

const KOREA_UNITED = [
	{ iso: 'KOR', color: 'caliphate' },
	{ iso: 'PRK', color: 'caliphate' }
];

/** @type {Region[]} */
export const KOREA_BEFORE_MARKS = MODERN.buffers;

/** The two patrons as they are, with the peninsula one green country. */
/** @type {Region[]} */
export const KOREA_UNITED_MARKS = [...MODERN.buffers, ...KOREA_UNITED];

// ---------------------------------------------------------------- the Macedon of the east

/**
 * Japanese-held China in mid-1942: Manchukuo, Mengjiang, the North China Plain, the lower
 * Yangtze to Wuhan and Yichang, with the front along the Yellow River bend and the Yangtze. The
 * ring runs past the Soviet and Mongolian borders; those countries are painted over it.
 */
const JAPAN_CHINA_1942 = [
	[106.5, 41.6],
	[106.5, 43.5],
	[112.0, 46.5],
	[118.0, 50.0],
	[120.0, 53.6],
	[127.0, 50.6],
	[135.0, 48.6],
	[135.5, 43.0],
	[131.0, 42.6],
	[124.5, 40.0],
	[121.0, 38.6],
	[122.8, 37.4],
	[121.2, 35.4],
	[120.6, 34.0],
	[122.6, 31.0],
	[122.6, 29.8],
	[121.4, 29.5],
	[120.2, 29.6],
	[118.5, 30.0],
	[117.2, 30.5],
	[116.0, 29.6],
	[115.9, 28.5],
	[114.8, 28.9],
	[113.1, 29.2],
	[112.3, 30.1],
	[111.3, 30.6],
	[112.2, 31.6],
	[113.2, 32.4],
	[114.3, 32.6],
	[115.8, 33.2],
	[114.8, 34.3],
	[113.5, 34.95],
	[112.0, 34.9],
	[111.0, 34.7],
	[110.5, 35.8],
	[110.6, 37.5],
	[111.2, 39.0],
	[110.0, 40.5],
	[108.5, 41.0]
];

/** Canton and Hong Kong, held from 1938 and 1941. */
const CANTON_1942 = [
	[112.5, 23.7],
	[114.3, 23.6],
	[114.6, 22.5],
	[113.6, 21.9],
	[112.8, 22.2]
];

/** Hainan, held from 1939. */
const HAINAN = [
	[108.4, 19.1],
	[109.6, 20.3],
	[111.3, 20.1],
	[110.6, 17.9],
	[109.0, 18.1]
];

/** Karafuto, Japanese south of the 50th parallel from 1905. */
const KARAFUTO = [
	[141.5, 50.0],
	[144.5, 50.0],
	[144.8, 45.6],
	[141.5, 45.6]
];

/** The Japanese empire at its height in 1942, over a China that kept its west. */
/** @type {Region[]} */
export const JAPAN_1942_MARKS = [
	{ iso: 'CHN', color: 'persia' },
	{ rings: [JAPAN_CHINA_1942, CANTON_1942, HAINAN], color: 'greece' },
	{ iso: 'VNM', color: 'greece', alpha: 0.75 },
	{ iso: 'LAO', color: 'greece', alpha: 0.75 },
	{ iso: 'KHM', color: 'greece', alpha: 0.75 },
	{ iso: 'THA', color: 'greece', alpha: 0.45 },
	{ iso: 'MMR', color: 'greece' },
	{ iso: 'MYS', color: 'greece' },
	{ iso: 'BRN', color: 'greece' },
	{ iso: 'PHL', color: 'greece' },
	{ iso: 'IDN', color: 'greece' },
	{ iso: 'TLS', color: 'greece' },
	{ iso: 'PNG', color: 'greece', alpha: 0.5 },
	{ iso: 'RUS', color: 'steppe' },
	{ iso: 'MNG', color: 'steppe', alpha: 0.5 },
	{ iso: 'JPN', color: 'greece' },
	{ iso: 'KOR', color: 'greece' },
	{ iso: 'PRK', color: 'greece' },
	{ iso: 'TWN', color: 'greece' },
	{ ring: KARAFUTO, color: 'greece' }
];

/** The kingdom Alexander left: Macedon proper, before the march. */
const MACEDON_HOME = [
	[20.5, 39.95],
	[21.0, 40.7],
	[21.5, 41.4],
	[22.4, 41.9],
	[23.6, 41.55],
	[24.5, 41.15],
	[24.4, 40.55],
	[23.4, 40.15],
	[22.4, 39.95],
	[21.4, 39.85]
];

/** @type {Region[]} */
export const MACEDON_MARKS = [{ ring: MACEDON_HOME, color: 'greece' }];

/**
 * Mainland Greece in 146 BC, from Macedonia to the Peloponnese. The coast is the real one;
 * this ring only decides which land takes the color.
 */
const GREECE_146 = [
	[19.7, 39.5],
	[19.9, 40.5],
	[20.8, 41.1],
	[21.6, 41.4],
	[22.8, 41.2],
	[23.8, 40.8],
	[23.4, 39.4],
	[23.0, 38.6],
	[24.2, 38.3],
	[24.0, 37.4],
	[23.2, 36.5],
	[22.2, 36.6],
	[21.4, 37.4],
	[21.0, 38.2],
	[20.4, 38.8],
	[20.0, 39.3]
];

/** The leagues, still their own color, before Rome breaks them. */
/** @type {Region[]} */
export const GREECE_FREE_MARKS = [{ ring: GREECE_146, color: 'greece' }];

/** After the Achaean War: the same Greece, in Rome's color. */
/** @type {Region[]} */
export const ACHAEAN_WAR_MARKS = [{ ring: GREECE_146, color: 'romeEast' }];

/**
 * 1945. The empire's color has left the continent. The home islands are occupied,
 * in the sea power's color.
 */
/** @type {Region[]} */
export const PACIFIC_WAR_MARKS = [
	{ iso: 'CHN', color: 'persia', alpha: 0.25 },
	{ iso: 'KOR', color: 'persia', alpha: 0.22 },
	{ iso: 'PRK', color: 'persia', alpha: 0.22 },
	{ iso: 'TWN', color: 'persia', alpha: 0.4 },
	{ iso: 'JPN', color: 'romeEast' }
];

/** @type {Region[]} */
export const ALEXANDER_MARKS = [{ ring: ALEXANDER, color: 'greece' }];

/**
 * The Sasanian realm at the peace of 591: Iran, Mesopotamia, and the gulf.
 * The Egyptian and Syrian conquests of 620 belong to the war, not to this shape.
 */
/** @type {Region[]} */
export const SASANIAN_MARKS = [
	{ ring: persia(FRONTIER_591), color: 'persia' },
	{ rings: [BAHRAIN, OMAN_COAST], color: 'persia', alpha: 0.5 }
];

/** The Arsacids, on the same ground, between Alexander's successors and the Sasanians. */
/** @type {Region[]} */
export const PARTHIAN_MARKS = [{ ring: persia(FRONTIER_591), color: 'persia' }];

/** Egypt of the Nile: the old country Greece and Rome both learned from. */
const EGYPT_HOME = [
	[29.6, 31.4],
	[29.9, 31.0],
	[28.9, 31.0],
	[29.4, 30.2],
	[30.4, 26.4],
	[30.9, 24.1],
	[32.6, 22.0],
	[34.4, 23.8],
	[33.8, 27.4],
	[33.0, 29.4],
	[32.4, 31.2],
	[31.6, 31.5],
	[30.4, 31.5]
];

/** @type {Region[]} */
export const EGYPT_MARKS = [{ ring: EGYPT_HOME, color: 'people' }];

/** The People's Republic on its own. */
/** @type {Region[]} */
export const PRC_MARKS = MODERN.buffers.filter((region) => region.iso === 'CHN');

/** Japan before the march: the home islands, beside a China that is not the subject. */
/** @type {Region[]} */
export const JAPAN_HOME_MARKS = [
	{ iso: 'CHN', color: 'persia', alpha: 0.22 },
	{ iso: 'JPN', color: 'greece' }
];

/** The 1942 empire, with the lands it crossed faded so Japan is the shape that reads. */
/** @type {Region[]} */
export const JAPAN_EMPIRE_MARKS = JAPAN_1942_MARKS.map((region) =>
	region.color === 'greece' ? region : { ...region, alpha: Math.min(region.alpha ?? 1, 0.2) }
);

/** Japan in 1930, before the war: the home islands, Korea, Taiwan, Karafuto, by a whole China. */
/** @type {Region[]} */
export const JAPAN_1930_MARKS = [
	{ iso: 'CHN', color: 'persia' },
	{ iso: 'RUS', color: 'steppe' },
	{ iso: 'MNG', color: 'steppe', alpha: 0.5 },
	{ iso: 'JPN', color: 'greece' },
	{ iso: 'KOR', color: 'greece' },
	{ iso: 'PRK', color: 'greece' },
	{ iso: 'TWN', color: 'greece' },
	{ ring: KARAFUTO, color: 'greece' }
];

// ---------------------------------------------------------------- the language world

/** Where Arabic is the first language today: the Maghreb, the Nile, the Levant, Iraq, Arabia. */
const ARABIC = [
	'MRT', 'SAH', 'MAR', 'DZA', 'TUN', 'LBY', 'EGY', 'SDN',
	'SAU', 'YEM', 'OMN', 'ARE', 'QAT', 'BHR', 'KWT', 'IRQ', 'SYR', 'JOR', 'LBN', 'PSX'
];

/** @type {Region[]} */
export const ARAB_WORLD_MARKS = [
	{ iso: 'IRN', color: 'persia' },
	{ iso: 'TUR', color: 'steppe', alpha: 0.5 },
	...ARABIC.map((iso) => ({ iso, color: 'caliphate' }))
];

/** The Arabic world as the conquest began: the peninsula alone, by a Persia that kept its name. */
/** @type {Region[]} */
export const ARABIA_ALONE_MARKS = [
	{ iso: 'IRN', color: 'persia' },
	{ iso: 'TUR', color: 'steppe', alpha: 0.5 },
	{ ring: ARABIA_632, color: 'caliphate' }
];

/**
 * The fiction's language world: the peninsula and Siberia, the thin-settled land that takes the
 * new tongue the way the Maghreb took Arabic. China keeps its own, as Iran kept Persian.
 */
/** @type {Region[]} */
export const KOREANIC_WORLD_MARKS = [
	{ iso: 'CHN', color: 'persia' },
	{ iso: 'MNG', color: 'persia', alpha: 0.42 },
	{ iso: 'TWN', color: 'romeEast' },
	{ iso: 'JPN', color: 'greece' },
	{ iso: 'RUS', color: 'caliphate' },
	{ rings: provinces.manchuria, color: 'caliphate' },
	...KOREA_UNITED
];

MODERN.japan = JAPAN_1942_MARKS;
MODERN.spread = [
	{ iso: 'RUS', color: 'steppe' },
	{ iso: 'USA', color: 'romeEast' },
	{ iso: 'CHN', color: 'persia' },
	{ iso: 'MNG', color: 'persia', alpha: 0.35 },
	{ iso: 'JPN', color: 'greece' },
	{ rings: provinces.manchuria, color: 'caliphate' },
	{ iso: 'KOR', color: 'caliphate' },
	{ iso: 'PRK', color: 'caliphate' }
];
MODERN.after = [
	{ iso: 'RUS', color: 'steppe' },
	{ iso: 'USA', color: 'romeEast' },
	{ iso: 'CHN', color: 'persia' },
	{ rings: provinces.manchuria, color: 'caliphate' },
	{ rings: provinces.kaliphate, color: 'caliphate' },
	{ iso: 'JPN', color: 'romeEast' },
	{ iso: 'PHL', color: 'romeEast' },
	{ iso: 'TWN', color: 'romeEast' },
	{ iso: 'KOR', color: 'caliphate' },
	{ iso: 'PRK', color: 'caliphate' }
];
MODERN.tongue = KOREANIC_WORLD_MARKS;
ANTIQUE.arabWorld = ARAB_WORLD_MARKS;

/** @type {Region[]} */
export const KOREA_ALONE_MARKS = [
	{ iso: 'CHN', color: 'persia' },
	{ iso: 'MNG', color: 'persia', alpha: 0.42 },
	{ iso: 'TWN', color: 'romeEast' },
	{ iso: 'JPN', color: 'greece' },
	{ iso: 'RUS', color: 'steppe' },
	...KOREA_UNITED
];

// ---------------------------------------------------------------- the peoples already there

/**
 * Berber peoples before Islam, drawn as homelands rather than surveyed borders.
 * West to east: Mauri, Numidia, Gaetuli, Garamantes, Nasamones.
 */
const MAURI = [
	[-5.6, 35.8], [-5.2, 35.1], [-7.2, 33.4], [-9.2, 31.6], [-9.8, 30.2],
	[-8.4, 29.4], [-6.2, 31.2], [-5.8, 33.6], [-4.2, 35.0], [-5.6, 35.9]
];
const NUMIDIA = [
	[-2.2, 35.2], [2.4, 36.6], [7.6, 37.0], [9.6, 36.2], [9.2, 34.2],
	[7.4, 33.0], [3.2, 32.6], [-0.6, 33.2], [-2.4, 34.2]
];
const GAETULI = [
	[-8.6, 30.2], [-4.2, 31.4], [2.2, 32.2], [8.4, 32.4], [9.2, 30.2],
	[4.6, 29.2], [-2.4, 28.6], [-7.4, 28.4]
];
const GARAMANTES = [
	[11.4, 27.6], [14.2, 27.8], [15.6, 26.2], [14.6, 24.4], [12.2, 24.2], [11.2, 26.0]
];
const NASAMONES = [
	[17.4, 31.2], [20.6, 31.0], [22.4, 29.6], [21.2, 27.6], [18.2, 27.8], [16.8, 29.4]
];

/** @type {Region[]} */
export const BERBER_TRIBE_MARKS = [
	{ ring: MAURI, color: 'people' },
	{ ring: NUMIDIA, color: 'people', alpha: 0.72 },
	{ ring: GAETULI, color: 'people', alpha: 0.5 },
	{ ring: GARAMANTES, color: 'people' },
	{ ring: NASAMONES, color: 'people', alpha: 0.8 }
];

/**
 * Indigenous peoples of Siberia as they stand inside Russia.
 * Homelands, not the full extent of every seasonal range.
 */
const NENETS = [
	[66.5, 69.5], [73.5, 70.2], [78.5, 68.4], [76.5, 66.2], [68.5, 66.4], [65.5, 67.6]
];
const KHANTY = [
	[64.5, 64.2], [72.5, 65.0], [80.5, 63.4], [78.5, 59.2], [68.5, 59.4], [63.5, 61.6]
];
const SAKHA = [
	[118.5, 64.5], [128.5, 66.2], [138.5, 64.0], [140.5, 60.2], [132.5, 58.4], [122.5, 59.2]
];
const EVENK = [
	[96.5, 64.5], [112.5, 65.2], [122.5, 62.4], [116.5, 58.2], [100.5, 58.4], [94.5, 61.2]
];
const ALTAI = [
	[84.2, 51.6], [88.6, 51.8], [89.4, 49.6], [86.2, 48.8], [83.4, 49.8]
];
const TUVAN = [
	[89.6, 52.2], [96.8, 52.4], [98.2, 50.4], [93.4, 49.8], [89.4, 50.6]
];
const BURYAT = [
	[100.4, 54.2], [108.6, 54.6], [112.4, 52.2], [108.2, 50.6], [102.2, 50.8]
];
const NANAI = [
	[133.4, 50.4], [138.6, 50.8], [139.4, 48.2], [135.2, 47.6], [132.6, 48.8]
];

/** @type {Region[]} */
export const SIBERIA_TRIBE_MARKS = [
	{ ring: NENETS, color: 'people' },
	{ ring: KHANTY, color: 'people', alpha: 0.75 },
	{ ring: EVENK, color: 'people', alpha: 0.45 },
	{ ring: SAKHA, color: 'people' },
	{ ring: ALTAI, color: 'people' },
	{ ring: TUVAN, color: 'people', alpha: 0.85 },
	{ ring: BURYAT, color: 'people' },
	{ ring: NANAI, color: 'people', alpha: 0.8 }
];

// ---------------------------------------------------------------- the parent

const EUROPE = [
	'PRT', 'ESP', 'FRA', 'BEL', 'NLD', 'LUX', 'DEU', 'CHE', 'AUT', 'ITA', 'MLT', 'GBR', 'IMN', 'IRL',
	'ISL', 'DNK', 'NOR', 'SWE', 'FIN', 'EST', 'LVA', 'LTU', 'POL', 'CZE', 'SVK', 'HUN', 'SVN', 'HRV',
	'ROU', 'BGR', 'GRC', 'CYP'
];

/** Europe today in the lighter red, Russia as the steppe. */
/** @type {Region[]} */
export const EUROPE_MARKS = [
	{ iso: 'RUS', color: 'steppe' },
	...EUROPE.map((iso) => ({ iso, color: 'romeWest' }))
];
