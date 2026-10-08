import { createAtlas } from '../atlas.js';
import { FRAME } from './frame.js';
import * as GEO from './geo.js';

/**
 * Rome and Persia, from Pompey on the Euphrates (64 BC) to the first Arab civil war (AD 660).
 * Holdings are simplified to the year a city changed hands; '?' marks a client kingdom or
 * an occupation that never settled, drawn fainter in its patron's colour.
 */

/** @typedef {import('../atlas.js').Hold} Hold */

/**
 * @param {string} id @param {string} name @param {number} lon @param {number} lat
 * @param {Hold[]} h @param {number} [r] reach in map units
 * @returns {import('../atlas.js').SiteDef}
 */
const site = (id, name, lon, lat, h, r) => ({ id, name, lon, lat, h, ...(r ? { r } : {}) });

/** @type {Hold[]} */
const ROME = [[-999, 'rome']];
/** @type {Hold[]} */
const CLIENT = [[-999, 'rome', '?']];
/** Labienus and the Parthians in Caria and Lydia, 40–39 BC. @type {Hold[]} */
const LABIENUS = [[-999, 'rome'], [-40, 'persia', '?'], [-39, 'rome']];
/** @type {Hold[]} */
const THRACE = [[-999, 'rome', '?'], [46, 'rome']];
/** @type {Hold[]} */
const MOESIA = [[-999, null], [-29, 'rome', '?'], [6, 'rome']];
/** @type {Hold[]} */
const DACIA = [[-999, null], [106, 'rome'], [271, null]];
/** @type {Hold[]} */
const CILICIA = [[-999, 'rome'], [-40, 'persia'], [-39, 'rome'], [271, 'palmyra'], [272, 'rome'], [613, 'persia'], [629, 'rome']];
/** @type {Hold[]} */
const PONTUS = [[-999, 'rome', '?'], [64, 'rome']];
/** Cappadocia, annexed in AD 17, overrun by Khosrow II's armies from 615. @type {Hold[]} */
const CAPPADOCIA = [[-999, 'rome', '?'], [17, 'rome'], [615, 'persia', '?'], [627, 'rome']];
/** @type {Hold[]} */
const BOSPORUS = [[-999, 'rome', '?'], [370, null], [527, 'rome', '?']];

/** Armenia between the empires: Trajan's province, Shapur's conquest, a restored king. @type {Hold[]} */
const ARMENIA = [[-999, 'armenia'], [114, 'rome'], [117, 'armenia'], [252, 'persia'], [287, 'armenia']];
/** @type {Hold[]} */
const ARMENIA_WEST = [...ARMENIA, [387, 'rome'], [610, 'persia'], [628, 'rome']];
/** @type {Hold[]} */
const ARMENIA_EAST = [...ARMENIA, [428, 'persia'], [640, 'armenia'], [653, 'arabs', '?']];
/** The part of Persarmenia Khosrow II gave Maurice in 591. @type {Hold[]} */
const ARMENIA_591 = [...ARMENIA, [428, 'persia'], [591, 'rome'], [607, 'persia'], [628, 'rome'], [653, 'arabs', '?']];
/** @type {Hold[]} */
const SOPHENE = [...ARMENIA, [298, 'rome'], [610, 'persia'], [628, 'rome'], [640, 'arabs']];
/** @type {Hold[]} */
const ARZANENE = [...ARMENIA, [298, 'rome'], [363, 'persia'], [591, 'rome'], [604, 'persia'], [628, 'rome'], [640, 'arabs']];
/** Armenian until the partition of 387, then Caucasian Albania. @type {Hold[]} */
const ARTSAKH = [...ARMENIA, [387, 'persia', '?'], [510, 'persia'], [651, 'arabs', '?']];
/** @type {Hold[]} */
const ALBANIA = [[-999, 'persia', '?'], [510, 'persia'], [651, 'arabs', '?']];
/** @type {Hold[]} */
const IBERIA = [[-999, 'rome', '?'], [363, 'persia', '?'], [580, 'persia'], [627, 'rome', '?'], [645, 'arabs', '?']];
/** @type {Hold[]} */
const LAZICA = [[-999, 'rome', '?'], [541, 'persia', '?'], [555, 'rome', '?']];
/** Judea under its own kings, the Parthian puppet Antigonus, then a province. @type {Hold[]} */
const JUDEA = [[-999, 'rome', '?'], [-40, 'persia', '?'], [-37, 'rome', '?'], [6, 'rome'], [270, 'palmyra'], [272, 'rome'], [614, 'persia'], [629, 'rome']];
/** @type {Hold[]} */
const NABATAEA = [[-999, 'nabataea'], [106, 'rome'], [270, 'palmyra'], [272, 'rome'], [614, 'persia'], [629, 'rome'], [634, 'arabs']];
/** Roman garrisons in the Hejaz after 106, gone by 300. @type {Hold[]} */
const HEJAZ = [[-999, 'nabataea'], [106, 'rome', '?'], [300, null], [630, 'arabs']];
/** The Caspian mountains, which kept their own princes after the empire fell. @type {Hold[]} */
const TABARISTAN = [[-999, 'persia'], [651, 'tabaristan', '?']];

/**
 * Roman Syria: overrun by Pacorus in 40 BC, Palmyrene in 270, Persian from 613, Arab in `fall`.
 * @param {number} fall @returns {Hold[]}
 */
const syria = (fall) => [[-999, 'rome'], [-40, 'persia'], [-38, 'rome'], [270, 'palmyra'], [272, 'rome'], [613, 'persia'], [629, 'rome'], [fall, 'arabs']];
/** @param {number} fall @param {number} [persian] @returns {Hold[]} */
const egypt = (fall, persian = 619) => [[-999, 'egypt'], [-30, 'rome'], [270, 'palmyra'], [272, 'rome'], [persian, 'persia'], [629, 'rome'], [fall, 'arabs']];
/** Lower Mesopotamia, Roman only for Trajan's year. @param {number} fall @returns {Hold[]} */
const babylonia = (fall) => [[-999, 'persia'], [116, 'rome'], [117, 'persia'], [fall, 'arabs']];
/** @param {number} fall @returns {Hold[]} */
const iran = (fall) => [[-999, 'persia'], [fall, 'arabs']];
/** Persis under its own kings until Ardashir. @param {number} fall @returns {Hold[]} */
const persis = (fall) => [[-999, 'persia', '?'], [224, 'persia'], [fall, 'arabs']];
/** @param {number} fall @returns {Hold[]} */
const elymais = (fall) => [[-999, 'persia', '?'], [221, 'persia'], [fall, 'arabs']];
/** @param {number} fall @returns {Hold[]} */
const atropatene = (fall) => [[-999, 'persia', '?'], [18, 'persia'], [fall, 'arabs']];
/** @param {number} fall @returns {Hold[]} */
const characene = (fall) => [[-999, 'persia', '?'], [116, 'rome', '?'], [117, 'persia', '?'], [222, 'persia'], [fall, 'arabs']];
/** The Arabian shore under Sasanian governors from Shapur I. @param {number} fall @returns {Hold[]} */
const gulf = (fall) => [[-999, null], [240, 'persia', '?'], [fall, 'arabs']];
/** @param {number} from @returns {Hold[]} */
const arabia = (from) => [[-999, null], [from, 'arabs']];

const SITES = [
	// Greece and the Balkans
	site('athens', 'Athens', 23.73, 37.98, ROME, 50),
	site('corinth', 'Corinth', 22.88, 37.91, ROME, 40),
	site('sparta', 'Sparta', 22.43, 37.07, ROME, 45),
	site('patrae', 'Patrae', 21.73, 38.25, ROME, 40),
	site('larissa', 'Larissa', 22.42, 39.64, ROME, 50),
	site('thessalonica', 'Thessalonica', 22.94, 40.64, ROME, 50),
	site('philippi', 'Philippi', 24.29, 41.01, ROME),
	site('serdica', 'Serdica', 23.32, 42.7, THRACE),
	site('philippopolis', 'Philippopolis', 24.75, 42.15, THRACE),
	site('adrianople', 'Adrianople', 26.56, 41.68, THRACE),
	site('perinthus', 'Perinthus', 27.96, 40.98, THRACE, 35),
	site('apollonia', 'Apollonia', 27.7, 42.42, THRACE),
	site('byzantium', 'Byzantium', 28.98, 41.01, ROME, 30),
	site('naissus', 'Naissus', 21.9, 43.32, MOESIA),
	site('ratiaria', 'Ratiaria', 22.9, 43.82, MOESIA),
	site('oescus', 'Oescus', 24.47, 43.7, MOESIA),
	site('novae', 'Novae', 25.38, 43.62, MOESIA),
	site('durostorum', 'Durostorum', 27.27, 44.12, MOESIA),
	site('odessus', 'Odessus', 27.91, 43.21, MOESIA),
	site('tomis', 'Tomis', 28.65, 44.17, MOESIA),
	site('troesmis', 'Troesmis', 28.2, 45.15, MOESIA),
	site('drobeta', 'Drobeta', 22.66, 44.63, DACIA),
	site('romula', 'Romula', 24.4, 44.1, DACIA),
	site('sarmizegetusa', 'Sarmizegetusa', 23.31, 45.62, DACIA, 50),
	site('apulum', 'Apulum', 23.57, 46.07, DACIA, 50),
	site('napoca', 'Napoca', 23.6, 46.77, DACIA, 45),

	// The islands
	site('crete', 'Crete', 24.95, 35.15, ROME, 60),
	site('rhodes', 'Rhodes', 28.0, 36.2, ROME, 30),
	site('lesbos', 'Lesbos', 26.3, 39.15, ROME, 28),
	site('cyprus', 'Cyprus', 33.4, 35.1, [[-999, 'egypt'], [-58, 'rome'], [-47, 'egypt'], [-30, 'rome']], 65),

	// Anatolia
	site('chalcedon', 'Chalcedon', 29.2, 40.85, [[-999, 'rome'], [615, 'persia', '?'], [627, 'rome']], 25),
	site('nicomedia', 'Nicomedia', 29.92, 40.77, ROME, 40),
	site('nicaea', 'Nicaea', 29.72, 40.43, ROME, 35),
	site('prusa', 'Prusa', 29.06, 40.19, ROME, 35),
	site('cyzicus', 'Cyzicus', 27.89, 40.38, ROME),
	site('troas', 'Troas', 26.16, 39.75, ROME, 35),
	site('pergamon', 'Pergamon', 27.18, 39.13, ROME),
	site('smyrna', 'Smyrna', 27.14, 38.42, ROME, 35),
	site('ephesus', 'Ephesus', 27.34, 37.94, ROME, 35),
	site('sardis', 'Sardis', 28.04, 38.49, LABIENUS),
	site('halicarnassus', 'Halicarnassus', 27.42, 37.04, LABIENUS, 35),
	site('laodicea-lycus', 'Laodicea', 29.11, 37.84, LABIENUS),
	site('apamea-phrygia', 'Apamea', 30.17, 38.07, ROME),
	site('dorylaeum', 'Dorylaeum', 30.52, 39.78, ROME, 50),
	site('amorium', 'Amorium', 31.29, 39.02, ROME, 50),
	site('myra', 'Myra', 29.98, 36.26, [[-999, 'rome', '?'], [43, 'rome']], 40),
	site('attalia', 'Attalia', 30.71, 36.89, ROME, 40),
	site('isaura', 'Isaura', 32.25, 37.2, [[-999, 'rome', '?'], [-25, 'rome']]),
	site('iconium', 'Iconium', 32.48, 37.87, [[-999, 'rome', '?'], [-25, 'rome'], [271, 'palmyra'], [272, 'rome']], 50),
	site('ancyra', 'Ancyra', 32.86, 39.93, [[-999, 'rome', '?'], [-25, 'rome'], [271, 'palmyra'], [272, 'rome'], [620, 'persia', '?'], [627, 'rome']], 50),
	site('gangra', 'Gangra', 33.61, 40.6, [[-999, 'rome', '?'], [-6, 'rome']], 45),
	site('heraclea', 'Heraclea', 31.42, 41.28, ROME, 40),
	site('amastris', 'Amastris', 32.38, 41.75, ROME, 40),
	site('sinope', 'Sinope', 35.15, 42.03, ROME, 40),
	site('amisus', 'Amisus', 36.33, 41.29, ROME, 40),
	site('amaseia', 'Amaseia', 35.83, 40.65, [[-999, 'rome', '?'], [-2, 'rome']]),
	site('neocaesarea', 'Neocaesarea', 36.98, 40.6, PONTUS),
	site('trapezus', 'Trapezus', 39.72, 41.0, PONTUS),
	site('rhizaeum', 'Rhizaeum', 40.52, 41.02, PONTUS, 35),
	site('nicopolis', 'Nicopolis', 38.33, 40.15, [[-999, 'rome', '?'], [72, 'rome'], [610, 'persia', '?'], [628, 'rome']]),
	site('satala', 'Satala', 39.66, 40.03, [[-999, 'rome', '?'], [72, 'rome'], [610, 'persia'], [628, 'rome']]),
	site('sebasteia', 'Sebasteia', 37.02, 39.75, [[-999, 'rome', '?'], [-2, 'rome'], [615, 'persia', '?'], [627, 'rome']]),
	site('caesarea', 'Caesarea', 35.48, 38.73, [[-999, 'rome', '?'], [17, 'rome'], [611, 'persia'], [612, 'rome'], [615, 'persia', '?'], [627, 'rome']]),
	site('archelais', 'Archelais', 34.03, 38.37, CAPPADOCIA),
	site('tyana', 'Tyana', 34.62, 37.83, [[-999, 'rome', '?'], [17, 'rome'], [271, 'palmyra'], [272, 'rome'], [615, 'persia', '?'], [627, 'rome']]),
	site('melitene', 'Melitene', 38.36, 38.35, [[-999, 'rome', '?'], [17, 'rome'], [611, 'persia'], [628, 'rome']]),
	site('germanicia', 'Germanicia', 36.93, 37.58, [[-999, 'rome', '?'], [17, 'rome'], [38, 'rome', '?'], [72, 'rome'], [613, 'persia'], [629, 'rome'], [638, 'arabs']]),
	site('samosata', 'Samosata', 38.51, 37.53, [[-999, 'rome', '?'], [17, 'rome'], [38, 'rome', '?'], [72, 'rome'], [611, 'persia'], [628, 'rome'], [639, 'arabs']], 35),
	site('anazarbus', 'Anazarbus', 35.9, 37.26, CILICIA, 40),
	site('tarsus', 'Tarsus', 34.9, 36.92, CILICIA, 40),
	site('seleucia', 'Seleucia', 33.93, 36.38, CILICIA, 40),
	site('anemurium', 'Anemurium', 32.8, 36.08, ROME, 35),

	// Crimea
	site('chersonesus', 'Chersonesus', 33.49, 44.61, CLIENT, 40),
	site('theodosia', 'Theodosia', 35.38, 45.03, BOSPORUS, 40),
	site('panticapaeum', 'Panticapaeum', 36.47, 45.35, BOSPORUS, 45),
	site('phanagoria', 'Phanagoria', 36.98, 45.28, BOSPORUS, 40),

	// Armenia
	site('theodosiopolis', 'Theodosiopolis', 41.27, 39.91, ARMENIA_WEST),
	site('acilisene', 'Acilisene', 39.5, 39.75, ARMENIA_WEST),
	site('arsamosata', 'Arsamosata', 39.85, 38.73, SOPHENE),
	site('martyropolis', 'Martyropolis', 41.1, 38.15, SOPHENE, 35),
	site('arzan', 'Arzan', 41.75, 38.05, ARZANENE, 35),
	site('taron', 'Taron', 41.5, 38.75, ARMENIA_591),
	site('manzikert', 'Manzikert', 42.53, 39.14, ARMENIA_591),
	site('van', 'Van', 43.33, 38.5, ARMENIA_591),
	site('bagrevand', 'Bagrevand', 43.1, 39.55, ARMENIA_591),
	site('kars', 'Kars', 43.1, 40.6, ARMENIA_591),
	site('ani', 'Ani', 43.57, 40.51, ARMENIA_591, 35),
	site('artaxata', 'Artaxata', 44.55, 39.95, ARMENIA_EAST),
	site('sevan', 'Sevan', 45.0, 40.45, ARMENIA_EAST),
	site('nakhchivan', 'Nakhchivan', 45.41, 39.21, ARMENIA_EAST),
	site('khoy', 'Khoy', 44.95, 38.55, ARMENIA_EAST),
	site('syunik', 'Syunik', 46.1, 39.5, ARMENIA_EAST),
	site('artsakh', 'Artsakh', 46.75, 39.82, ARTSAKH),
	site('utik', 'Partav', 47.15, 40.38, ARTSAKH),
	site('paytakaran', 'Paytakaran', 48.3, 39.6, ARTSAKH, 50),

	// The Caucasus
	site('mtskheta', 'Mtskheta', 44.72, 41.84, IBERIA, 45),
	site('uplistsikhe', 'Uplistsikhe', 44.0, 42.0, IBERIA, 40),
	site('kakheti', 'Kakheti', 45.6, 41.9, IBERIA, 45),
	site('javakheti', 'Javakheti', 43.6, 41.35, IBERIA, 40),
	site('phasis', 'Phasis', 41.67, 42.15, LAZICA, 40),
	site('archaeopolis', 'Archaeopolis', 42.25, 42.4, LAZICA, 40),
	site('kutatisi', 'Kutatisi', 42.7, 42.27, LAZICA, 38),
	site('petra-lazica', 'Petra', 41.75, 41.77, LAZICA, 32),
	site('svaneti', 'Svaneti', 42.7, 43.0, LAZICA, 40),
	site('pityus', 'Pityus', 40.34, 43.16, CLIENT, 40),
	site('sebastopolis', 'Sebastopolis', 41.0, 43.0, CLIENT, 40),
	site('kabalaka', 'Kabalaka', 47.85, 40.98, ALBANIA, 45),
	site('shaki', 'Shaki', 47.17, 41.2, ALBANIA, 40),
	site('shamakhi', 'Shamakhi', 48.64, 40.63, ALBANIA, 45),
	site('baku', 'Baku', 49.87, 40.41, ALBANIA, 40),
	site('derbent', 'Derbent', 48.29, 42.06, ALBANIA, 40),

	// Upper Mesopotamia: the frontier
	site('zeugma', 'Zeugma', 37.88, 37.06, [[-999, 'rome'], [-40, 'persia'], [-38, 'rome'], [270, 'palmyra'], [272, 'rome'], [610, 'persia'], [628, 'rome'], [637, 'arabs']], 35),
	site('hierapolis', 'Hierapolis', 37.95, 36.52, syria(637), 35),
	site('edessa', 'Edessa', 38.79, 37.15, [[-999, 'persia', '?'], [115, 'rome', '?'], [117, 'persia', '?'], [165, 'rome', '?'], [214, 'rome'], [270, 'palmyra'], [272, 'rome'], [609, 'persia'], [628, 'rome'], [639, 'arabs']], 35),
	site('carrhae', 'Carrhae', 39.03, 36.86, [[-999, 'persia', '?'], [-54, 'rome'], [-53, 'persia', '?'], [115, 'rome', '?'], [117, 'persia', '?'], [165, 'rome', '?'], [214, 'rome'], [238, 'persia'], [243, 'rome'], [252, 'persia'], [262, 'rome'], [270, 'palmyra'], [272, 'rome'], [609, 'persia'], [628, 'rome'], [639, 'arabs']], 32),
	site('callinicum', 'Callinicum', 39.02, 35.95, [[-999, 'persia', '?'], [165, 'rome', '?'], [214, 'rome'], [270, 'palmyra'], [272, 'rome'], [609, 'persia'], [628, 'rome'], [639, 'arabs']], 35),
	site('resaina', 'Resaina', 40.07, 36.85, [[-999, 'persia'], [115, 'rome'], [117, 'persia'], [198, 'rome'], [238, 'persia'], [243, 'rome'], [252, 'persia'], [262, 'rome'], [604, 'persia'], [628, 'rome'], [640, 'arabs']], 35),
	site('dara', 'Dara', 40.94, 37.18, [[-999, 'persia'], [115, 'rome'], [117, 'persia'], [198, 'rome'], [238, 'persia'], [243, 'rome'], [252, 'persia'], [262, 'rome'], [573, 'persia'], [591, 'rome'], [604, 'persia'], [628, 'rome'], [640, 'arabs']], 28),
	site('nisibis', 'Nisibis', 41.22, 37.07, [[-999, 'persia'], [115, 'rome'], [117, 'persia'], [198, 'rome'], [238, 'persia'], [243, 'rome'], [252, 'persia'], [262, 'rome'], [363, 'persia'], [640, 'arabs']], 30),
	site('amida', 'Amida', 40.23, 37.91, [[-999, 'armenia'], [114, 'rome'], [117, 'armenia'], [198, 'rome'], [359, 'persia'], [363, 'rome'], [503, 'persia'], [505, 'rome'], [609, 'persia'], [628, 'rome'], [639, 'arabs']], 35),
	site('singara', 'Singara', 41.87, 36.32, [[-999, 'persia'], [115, 'rome'], [117, 'persia'], [198, 'rome'], [238, 'persia'], [243, 'rome'], [252, 'persia'], [262, 'rome'], [360, 'persia'], [640, 'arabs']], 40),
	site('bezabde', 'Bezabde', 42.19, 37.33, [[-999, 'persia', '?'], [115, 'rome'], [117, 'persia', '?'], [298, 'rome'], [360, 'persia'], [640, 'arabs']], 30),
	site('corduene', 'Corduene', 43.1, 37.55, [[-999, 'persia', '?'], [115, 'rome'], [117, 'persia', '?'], [298, 'rome'], [363, 'persia'], [640, 'arabs']], 40),
	site('hatra', 'Hatra', 42.72, 35.59, [[-999, 'persia', '?'], [230, 'rome', '?'], [241, 'persia'], [637, 'arabs']], 40),
	site('nineveh', 'Nineveh', 43.15, 36.36, babylonia(641), 35),
	site('arbela', 'Arbela', 44.01, 36.19, [[-999, 'persia', '?'], [116, 'rome'], [117, 'persia', '?'], [226, 'persia'], [641, 'arabs']], 40),
	site('assur', 'Assur', 43.26, 35.46, babylonia(637), 40),
	site('karka', 'Karka', 44.39, 35.47, iran(637), 40),
	site('shahrazur', 'Shahrazur', 45.9, 35.3, iran(641), 40),
	site('circesium', 'Circesium', 40.45, 35.17, [[-999, 'persia'], [116, 'rome'], [117, 'persia'], [165, 'rome'], [256, 'persia'], [262, 'rome'], [609, 'persia'], [628, 'rome'], [637, 'arabs']], 30),
	site('dura', 'Dura-Europos', 40.73, 34.75, [[-999, 'persia'], [116, 'rome'], [117, 'persia'], [165, 'rome'], [256, 'persia'], [637, 'arabs']], 30),
	site('anatha', 'Anatha', 41.98, 34.37, babylonia(637), 35),
	site('hit', 'Hit', 42.82, 33.64, babylonia(634), 35),
	site('anbar', 'Anbar', 43.77, 33.37, babylonia(633), 32),
	site('samarra', 'Samarra', 43.87, 34.2, babylonia(637), 35),

	// Babylonia
	site('ctesiphon', 'Ctesiphon', 44.58, 33.09, babylonia(637), 30),
	site('dastagerd', 'Dastagerd', 44.97, 33.73, iran(637), 30),
	site('jalula', 'Jalula', 45.17, 34.27, iran(637), 35),
	site('babylon', 'Babylon', 44.42, 32.54, babylonia(636), 30),
	site('hira', 'al-Hira', 44.38, 31.98, [[-999, 'persia'], [116, 'rome'], [117, 'persia'], [300, 'persia', '?'], [602, 'persia'], [633, 'arabs']], 32),
	site('ain-tamr', 'Ayn al-Tamr', 43.5, 32.57, [[-999, 'persia'], [300, 'persia', '?'], [602, 'persia'], [633, 'arabs']], 35),
	site('kaskar', 'Kaskar', 45.8, 32.5, babylonia(636), 40),
	site('uruk', 'Uruk', 45.64, 31.32, babylonia(636), 40),
	site('ur', 'Ur', 46.1, 30.96, babylonia(636), 40),
	site('maysan', 'Maysan', 47.15, 31.84, characene(636), 40),
	site('charax', 'Charax', 47.7, 30.65, characene(636), 38),

	// The Zagros and Khuzestan
	site('hulwan', 'Hulwan', 45.86, 34.46, iran(640), 40),
	site('ilam', 'Ilam', 46.42, 33.64, iran(640), 45),
	site('kermanshah', 'Kermanshah', 47.06, 34.31, iran(642), 45),
	site('nahavand', 'Nahavand', 48.37, 34.19, iran(642), 40),
	site('hamadan', 'Ecbatana', 48.51, 34.8, iran(645), 40),
	site('khorramabad', 'Khorramabad', 48.36, 33.49, iran(642), 45),
	site('susa', 'Susa', 48.26, 32.19, elymais(638), 40),
	site('ahvaz', 'Ahvaz', 48.67, 31.32, elymais(638), 45),
	site('izeh', 'Izeh', 49.86, 31.83, elymais(642), 45),
	site('arrajan', 'Arrajan', 50.28, 30.62, persis(640), 45),

	// Atropatene and the Caspian shore
	site('ganzak', 'Ganzak', 47.0, 36.6, atropatene(643), 45),
	site('tabriz', 'Tabriz', 46.29, 38.08, atropatene(643), 45),
	site('ardabil', 'Ardabil', 48.29, 38.25, atropatene(643), 45),
	site('urmia', 'Urmia', 45.07, 37.55, atropatene(643), 40),
	site('maragheh', 'Maragheh', 46.24, 37.39, atropatene(643), 40),
	site('zanjan', 'Zanjan', 48.48, 36.67, iran(644), 45),
	site('qazvin', 'Qazvin', 50.0, 36.27, iran(644), 45),
	site('daylam', 'Daylam', 49.6, 37.0, TABARISTAN, 45),
	site('amol', 'Amol', 52.35, 36.47, TABARISTAN, 50),
	site('sari', 'Sari', 53.4, 36.6, TABARISTAN, 45),
	site('gorgan', 'Gorgan', 54.43, 36.84, iran(651), 45),
	site('dahistan', 'Dahistan', 54.4, 37.75, iran(651), 50),

	// The plateau
	site('rayy', 'Rayy', 51.44, 35.6, iran(643), 45),
	site('qom', 'Qom', 50.88, 34.64, iran(644), 45),
	site('arak', 'Arak', 49.7, 34.1, iran(643), 45),
	site('kashan', 'Kashan', 51.44, 33.98, iran(644), 45),
	site('golpayegan', 'Golpayegan', 50.29, 33.45, iran(643), 45),
	site('isfahan', 'Isfahan', 51.67, 32.66, iran(643), 50),
	site('semnan', 'Semnan', 53.39, 35.58, iran(651), 50),
	site('damghan', 'Hecatompylos', 54.34, 36.17, iran(651), 45),
	site('kavir', 'Dasht-e Kavir', 54.5, 34.4, iran(650), 80),
	site('nain', 'Nain', 53.08, 32.86, iran(650), 55),
	site('yazd', 'Yazd', 54.36, 31.9, iran(650), 60),
	site('tabas', 'Tabas', 56.92, 33.6, iran(650), 70),

	// Khorasan and Sistan
	site('sabzevar', 'Sabzevar', 57.68, 36.21, iran(651), 50),
	site('nishapur', 'Nishapur', 58.8, 36.21, iran(651), 50),
	site('tus', 'Tus', 59.6, 36.48, iran(651), 45),
	site('nisa', 'Nisa', 58.2, 37.95, iran(651), 45),
	site('sarakhs', 'Sarakhs', 61.16, 36.53, iran(651), 45),
	site('merv', 'Merv', 61.83, 37.6, iran(651), 55),
	site('herat', 'Herat', 62.2, 34.35, iran(651), 55),
	site('quhistan', 'Quhistan', 59.21, 32.87, iran(651), 65),
	site('lut', 'Dasht-e Lut', 58.6, 31.2, iran(650), 80),
	site('zarang', 'Zarang', 61.48, 30.96, iran(651), 60),

	// Fars and Kerman
	site('istakhr', 'Istakhr', 52.88, 29.95, persis(650), 45),
	site('bishapur', 'Bishapur', 51.57, 29.78, persis(644), 45),
	site('gor', 'Gor', 52.53, 28.84, persis(650), 45),
	site('fasa', 'Fasa', 53.65, 28.94, persis(650), 40),
	site('darabgerd', 'Darabgerd', 54.55, 28.75, persis(650), 50),
	site('rishahr', 'Rishahr', 50.83, 28.92, persis(640), 45),
	site('siraf', 'Siraf', 52.34, 27.67, persis(650), 45),
	site('lar', 'Lar', 54.33, 27.68, persis(650), 50),
	site('kerman', 'Kerman', 57.08, 30.28, iran(650), 60),
	site('jiroft', 'Jiroft', 57.74, 28.68, iran(650), 50),
	site('bam', 'Bam', 58.36, 29.1, iran(651), 55),
	site('hormuz', 'Hormuz', 57.08, 27.1, iran(650), 50),
	site('makran', 'Makran', 60.7, 27.2, iran(644), 70),

	// Arabia
	site('kazima', 'Kazima', 47.97, 29.37, gulf(633), 45),
	site('qatif', 'Qatif', 50.0, 26.55, gulf(630), 45),
	site('hajar', 'Hajar', 49.6, 25.4, gulf(630), 55),
	site('qatar', 'Qatar', 51.2, 25.3, gulf(630), 40),
	site('julfar', 'Julfar', 56.0, 25.6, gulf(632), 45),
	site('mazun', 'Mazun', 56.74, 24.36, gulf(632), 55),
	site('yamama', 'Yamama', 46.72, 24.69, arabia(632), 70),
	site('najd', 'Najd', 44.0, 26.3, arabia(632), 90),
	site('hail', 'Hail', 41.69, 27.52, arabia(632), 75),
	site('nafud', 'Nafud', 40.6, 29.0, arabia(632), 75),
	site('dumat', 'Dumat al-Jandal', 39.87, 29.81, arabia(631), 60),
	site('tayma', 'Tayma', 38.55, 27.63, arabia(630), 60),
	site('khaybar', 'Khaybar', 39.29, 25.7, arabia(628), 50),
	site('medina', 'Medina', 39.61, 24.47, arabia(622), 60),
	site('yanbu', 'Yanbu', 38.06, 24.09, arabia(630), 50),
	site('hegra', 'Hegra', 37.95, 26.8, HEJAZ, 55),
	site('tabuk', 'Tabuk', 36.57, 28.38, HEJAZ, 55),
	site('sirhan', 'Wadi Sirhan', 38.0, 30.8, [[-999, 'nabataea'], [106, 'rome', '?'], [300, null], [634, 'arabs']], 55),
	site('ghassan', 'Ghassan', 37.6, 32.3, [[-999, null], [502, 'rome', '?'], [584, null], [634, 'arabs']], 55),
	site('badiya', 'Syrian Desert', 39.6, 32.4, arabia(634), 70),
	site('lakhm', 'Lakhm', 41.6, 31.4, [[-999, null], [300, 'persia', '?'], [602, null], [633, 'arabs']], 70),

	// Syria, Phoenicia and Palestine
	site('antioch', 'Antioch', 36.16, 36.2, syria(637), 32),
	site('beroea', 'Beroea', 37.16, 36.2, syria(637), 35),
	site('apamea', 'Apamea', 36.4, 35.42, syria(637), 35),
	site('laodicea', 'Laodicea', 35.78, 35.52, syria(638), 32),
	site('epiphania', 'Epiphania', 36.75, 35.13, syria(636), 32),
	site('emesa', 'Emesa', 36.72, 34.73, syria(636), 32),
	site('sergiopolis', 'Sergiopolis', 38.75, 35.87, [[-999, 'rome', '?'], [270, 'palmyra'], [272, 'rome'], [609, 'persia'], [628, 'rome'], [637, 'arabs']], 40),
	site('tripolis', 'Tripolis', 35.84, 34.44, syria(637), 30),
	site('heliopolis', 'Heliopolis', 36.2, 34.0, syria(636), 30),
	site('berytus', 'Berytus', 35.5, 33.89, syria(637), 28),
	site('sidon', 'Sidon', 35.37, 33.56, syria(637), 28),
	site('tyre', 'Tyre', 35.2, 33.27, [[-999, 'rome'], [270, 'palmyra'], [272, 'rome'], [613, 'persia'], [629, 'rome'], [638, 'arabs']], 26),
	site('damascus', 'Damascus', 36.29, 33.51, syria(634), 32),
	site('palmyra', 'Palmyra', 38.27, 34.55, [[-999, 'rome', '?'], [17, 'rome'], [270, 'palmyra'], [273, 'rome'], [613, 'persia'], [629, 'rome'], [634, 'arabs']], 50),
	site('bostra', 'Bostra', 36.48, 32.52, [[-999, 'nabataea'], [106, 'rome'], [270, 'palmyra'], [272, 'rome'], [613, 'persia'], [629, 'rome'], [634, 'arabs']], 35),
	site('gerasa', 'Gerasa', 35.89, 32.27, syria(635), 28),
	site('philadelphia', 'Philadelphia', 35.93, 31.95, syria(635), 30),
	site('tiberias', 'Tiberias', 35.53, 32.79, [[-999, 'rome', '?'], [-40, 'persia', '?'], [-37, 'rome', '?'], [44, 'rome'], [270, 'palmyra'], [272, 'rome'], [614, 'persia'], [629, 'rome'], [636, 'arabs']], 26),
	site('caesarea-maritima', 'Caesarea Maritima', 34.89, 32.5, [...JUDEA, [640, 'arabs']], 28),
	site('jerusalem', 'Jerusalem', 35.23, 31.78, [...JUDEA, [637, 'arabs']], 28),
	site('gaza', 'Gaza', 34.46, 31.5, [[-999, 'rome'], [-40, 'persia'], [-38, 'rome'], [270, 'palmyra'], [272, 'rome'], [614, 'persia'], [629, 'rome'], [634, 'arabs']], 30),
	site('elusa', 'Elusa', 34.73, 31.04, NABATAEA, 40),
	site('moab', 'Rabbath Moab', 35.73, 31.3, NABATAEA, 35),
	site('petra', 'Petra', 35.44, 30.33, NABATAEA, 40),
	site('aila', 'Aila', 35.0, 29.53, [[-999, 'nabataea'], [106, 'rome'], [270, 'palmyra'], [272, 'rome'], [614, 'persia'], [629, 'rome'], [630, 'arabs']], 40),
	site('sinai', 'Sinai', 33.95, 28.85, [[-999, 'nabataea'], [106, 'rome'], [270, 'palmyra'], [272, 'rome'], [618, 'persia'], [629, 'rome'], [640, 'arabs']], 55),

	// Egypt and Cyrenaica
	site('rhinocorura', 'Rhinocorura', 33.8, 31.13, egypt(639, 618), 35),
	site('pelusium', 'Pelusium', 32.55, 31.04, egypt(640, 618), 35),
	site('clysma', 'Clysma', 32.55, 29.97, egypt(640, 618), 35),
	site('bubastis', 'Bubastis', 31.51, 30.57, egypt(640), 35),
	site('sais', 'Sais', 30.78, 30.97, egypt(641), 35),
	site('alexandria', 'Alexandria', 29.92, 31.2, egypt(642), 40),
	site('memphis', 'Memphis', 31.23, 29.98, egypt(641), 35),
	site('arsinoe', 'Arsinoe', 30.84, 29.31, egypt(641), 35),
	site('oxyrhynchus', 'Oxyrhynchus', 30.65, 28.53, egypt(641), 35),
	site('hermopolis', 'Hermopolis', 30.8, 27.78, egypt(641), 35),
	site('lycopolis', 'Lycopolis', 31.18, 27.18, egypt(641), 35),
	site('porphyrites', 'Mons Porphyrites', 33.3, 27.25, egypt(641), 45),
	site('ptolemais', 'Ptolemais', 31.78, 26.48, egypt(641), 35),
	site('myos-hormos', 'Myos Hormos', 34.24, 26.16, egypt(641), 50),
	site('thebes', 'Thebes', 32.64, 25.7, egypt(641), 35),
	site('syene', 'Syene', 32.9, 24.09, egypt(641), 40),
	site('berenice', 'Berenice', 35.47, 23.91, egypt(641), 50),
	site('hibis', 'Hibis', 30.55, 25.44, egypt(641), 40),
	site('mothis', 'Mothis', 29.0, 25.5, egypt(641), 35),
	site('bahariya', 'Bahariya', 28.86, 28.35, egypt(641), 35),
	site('ammonium', 'Ammonium', 25.52, 29.2, egypt(642), 35),
	site('paraetonium', 'Paraetonium', 27.24, 31.35, egypt(642), 45),
	site('catabathmus', 'Catabathmus', 25.17, 31.56, [[-999, 'egypt'], [-30, 'rome'], [642, 'arabs']], 45),
	site('antipyrgos', 'Antipyrgos', 23.96, 32.08, [[-999, 'rome'], [642, 'arabs']], 50),
	site('darnis', 'Darnis', 22.64, 32.77, [[-999, 'rome'], [643, 'arabs']], 40),
	site('cyrene', 'Cyrene', 21.86, 32.82, [[-999, 'rome'], [643, 'arabs']], 50)
];

/** @type {Record<string, import('../atlas.js').Polity>} */
const POLITIES = {
	rome: { label: 'Rome', color: '#b3263c', eras: [[-999, 'Roman Republic'], [-27, 'Roman Empire'], [395, 'Eastern Roman Empire']] },
	persia: { label: 'Persia', color: '#d4890f', eras: [[-999, 'Parthian Empire'], [224, 'Sassanian Empire']] },
	tabaristan: { label: 'Tabaristan', color: '#d4890f' },
	armenia: { label: 'Armenia', color: '#5a4fc0' },
	egypt: { label: 'Ptolemaic Egypt', color: '#178a8f' },
	nabataea: { label: 'Nabataea', color: '#9b5a36' },
	palmyra: { label: 'Palmyra', color: '#c43c8e', eras: [[-999, 'Palmyrene Empire']] },
	arabs: { label: 'Caliphate', color: '#2c7c4c', eras: [[-999, 'Medina'], [632, 'Rashidun Caliphate']] }
};

const EVENTS = [
	{ year: -64, text: 'Pompey annexes Syria. Rome and Parthia now meet on the Euphrates.' },
	{ year: -53, text: 'Carrhae: Parthian horse archers destroy Crassus and seven legions.' },
	{ year: -40, text: 'Pacorus and Labienus overrun Syria, Judea and much of Anatolia.' },
	{ year: -38, text: 'Ventidius kills Pacorus at Gindarus and takes Syria back.' },
	{ year: -36, text: 'Antony invades Media and loses a third of his army getting out.' },
	{ year: -30, text: 'Cleopatra is dead. Egypt becomes Roman.' },
	{ year: -20, text: 'Augustus gets Crassus’s eagles back by treaty, without a battle.' },
	{ year: 6, text: 'Judea becomes a Roman province.' },
	{ year: 17, text: 'Tiberius annexes Cappadocia and Commagene.' },
	{ year: 63, text: 'Rhandeia: a Parthian prince will rule Armenia, crowned by Rome.' },
	{ year: 106, text: 'Trajan annexes Nabataea as the province of Arabia, and conquers Dacia.' },
	{ year: 114, text: 'Trajan annexes Armenia.' },
	{ year: 116, text: 'Trajan takes Ctesiphon and reaches the Persian Gulf.' },
	{ year: 117, text: 'Hadrian gives back everything beyond the Euphrates.' },
	{ year: 165, text: 'Avidius Cassius burns Ctesiphon. Rome keeps Dura and Osroene.' },
	{ year: 198, text: 'Septimius Severus sacks Ctesiphon and makes Mesopotamia a province.' },
	{ year: 224, text: 'Ardashir kills the last Parthian king. The Sassanians begin.' },
	{ year: 241, text: 'Shapur I takes Hatra.' },
	{ year: 244, text: 'Gordian III dies on campaign. Philip buys peace for 500,000 denarii.' },
	{ year: 252, text: 'Shapur conquers Armenia and sweeps through Roman Mesopotamia.' },
	{ year: 256, text: 'Dura-Europos falls, and Antioch is sacked.' },
	{ year: 260, text: 'Edessa: Shapur captures the emperor Valerian.' },
	{ year: 262, text: 'Odaenathus of Palmyra chases the Persians back to Ctesiphon.' },
	{ year: 270, text: 'Zenobia of Palmyra takes Egypt and the Roman East.' },
	{ year: 272, text: 'Aurelian defeats Zenobia and takes Palmyra.' },
	{ year: 298, text: 'Treaty of Nisibis: Galerius wins five provinces beyond the Tigris.' },
	{ year: 330, text: 'Constantine moves the capital to Constantinople.' },
	{ year: 359, text: 'Shapur II takes Amida after a 73-day siege.' },
	{ year: 363, text: 'Julian dies in Persia. Jovian gives up Nisibis to get his army home.' },
	{ year: 387, text: 'Armenia is partitioned. Persia gets four-fifths.' },
	{ year: 395, text: 'The empire splits for good. The East rules from Constantinople.' },
	{ year: 428, text: 'Persia abolishes the Armenian monarchy.' },
	{ year: 503, text: 'Kavad takes Amida. Rome answers by building Dara.' },
	{ year: 532, text: 'The Eternal Peace: Justinian pays 11,000 pounds of gold. It lasts eight years.' },
	{ year: 540, text: 'Khosrow I sacks Antioch and deports its people to Persia.' },
	{ year: 541, text: 'Persia takes Lazica, on the Black Sea.' },
	{ year: 562, text: 'The Fifty Years’ Peace. It lasts ten.' },
	{ year: 573, text: 'Khosrow I takes Dara. Justin II loses his mind.' },
	{ year: 591, text: 'Maurice restores Khosrow II and is paid in Armenia and Dara.' },
	{ year: 602, text: 'Phocas murders Maurice. Khosrow II goes to war to avenge him.' },
	{ year: 610, text: 'Heraclius overthrows Phocas. Persian armies cross the Euphrates.' },
	{ year: 613, text: 'Persia takes Antioch and Damascus.' },
	{ year: 614, text: 'Jerusalem falls. The True Cross is carried off to Ctesiphon.' },
	{ year: 615, text: 'A Persian army camps at Chalcedon, across from Constantinople.' },
	{ year: 619, text: 'Alexandria falls. Persia holds Egypt.' },
	{ year: 622, text: 'Heraclius sails east. Muhammad leaves Mecca for Medina.' },
	{ year: 626, text: 'Avars and Persians besiege Constantinople, and fail.' },
	{ year: 627, text: 'Heraclius destroys the Persian army at Nineveh.' },
	{ year: 628, text: 'Khosrow II is deposed and killed. Persia sues for peace.' },
	{ year: 629, text: 'Persia withdraws from Egypt, Syria and Palestine.' },
	{ year: 632, text: 'Muhammad dies. Abu Bakr unites Arabia.' },
	{ year: 633, text: 'Khalid ibn al-Walid takes al-Hira, on the Euphrates.' },
	{ year: 634, text: 'Damascus falls to the Arabs.' },
	{ year: 636, text: 'Yarmouk and Qadisiyyah: both empires lose their field armies.' },
	{ year: 637, text: 'Ctesiphon falls. Jerusalem surrenders.' },
	{ year: 640, text: 'The Arabs take Upper Mesopotamia and invade Egypt.' },
	{ year: 642, text: 'Nahavand, the “victory of victories”. Alexandria surrenders.' },
	{ year: 651, text: 'Yazdegerd III, the last Sassanian king, is murdered near Merv.' },
	{ year: 653, text: 'Armenia submits to the Caliphate.' }
];

const PEAKS = [
	{ polity: 'persia', year: -40, label: 'Parthia', text: 'Parthia at its height: Pacorus holds Syria and Judea.' },
	{ polity: 'rome', year: 116, label: 'Rome', text: 'Rome at its height: Trajan stands on the Persian Gulf.' },
	{ polity: 'palmyra', year: 271, label: 'Palmyra', text: 'Palmyra at its height: Zenobia rules from Egypt to Ancyra.' },
	{ polity: 'persia', year: 620, label: 'Persia', text: 'Persia at its height: Khosrow II holds Egypt, Syria and half of Anatolia.' },
	{ polity: 'arabs', year: 651, label: 'Caliphate', text: 'The Caliphate: Persia is gone, and Rome has lost its East.' }
];

const PLACES = [
	{ id: 'byzantium', name: 'Byzantium', lon: 28.98, lat: 41.01, names: /** @type {[number, string][]} */ ([[330, 'Constantinople']]), capital: /** @type {[number, number]} */ ([330, 9999]) },
	{ id: 'chalcedon', name: 'Chalcedon', lon: 29.2, lat: 40.85 },
	{ id: 'ancyra', name: 'Ancyra', lon: 32.86, lat: 39.93 },
	{ id: 'caesarea', name: 'Caesarea', lon: 35.48, lat: 38.73 },
	{ id: 'melitene', name: 'Melitene', lon: 38.36, lat: 38.35 },
	{ id: 'theodosiopolis', name: 'Theodosiopolis', lon: 41.27, lat: 39.91 },
	{ id: 'artaxata', name: 'Artaxata', lon: 44.55, lat: 39.95, names: /** @type {[number, string][]} */ ([[335, 'Dvin']]), capital: /** @type {[number, number]} */ ([-999, 428]) },
	{ id: 'tiflis', name: 'Tiflis', lon: 44.79, lat: 41.69, from: 460 },
	{ id: 'zeugma', name: 'Zeugma', lon: 37.88, lat: 37.06 },
	{ id: 'antioch', name: 'Antioch', lon: 36.16, lat: 36.2 },
	{ id: 'edessa', name: 'Edessa', lon: 38.79, lat: 37.15 },
	{ id: 'carrhae', name: 'Carrhae', lon: 39.03, lat: 36.86 },
	{ id: 'nisibis', name: 'Nisibis', lon: 41.22, lat: 37.07 },
	{ id: 'nineveh', name: 'Nineveh', lon: 43.15, lat: 36.36 },
	{ id: 'ctesiphon', name: 'Ctesiphon', lon: 44.58, lat: 33.09, capital: /** @type {[number, number]} */ ([-999, 637]) },
	{ id: 'dastagerd', name: 'Dastagerd', lon: 44.97, lat: 33.73 },
	{ id: 'jalula', name: 'Jalula', lon: 45.17, lat: 34.27 },
	{ id: 'ganzak', name: 'Ganzak', lon: 47.0, lat: 36.6 },
	{ id: 'charax', name: 'Charax', lon: 47.7, lat: 30.65 },
	{ id: 'hira', name: 'al-Hira', lon: 44.38, lat: 31.98 },
	{ id: 'qadisiyyah', name: 'Qadisiyyah', lon: 44.3, lat: 31.6, from: 636 },
	{ id: 'nahavand', name: 'Nahavand', lon: 48.37, lat: 34.19 },
	{ id: 'rayy', name: 'Rayy', lon: 51.44, lat: 35.6 },
	{ id: 'istakhr', name: 'Istakhr', lon: 52.88, lat: 29.95 },
	{ id: 'merv', name: 'Merv', lon: 61.83, lat: 37.6 },
	{ id: 'palmyra', name: 'Palmyra', lon: 38.27, lat: 34.55, capital: /** @type {[number, number]} */ ([270, 272]) },
	{ id: 'damascus', name: 'Damascus', lon: 36.29, lat: 33.51 },
	{ id: 'bostra', name: 'Bostra', lon: 36.48, lat: 32.52 },
	{ id: 'yarmouk', name: 'Yarmouk', lon: 35.95, lat: 32.8, from: 636 },
	{ id: 'jerusalem', name: 'Jerusalem', lon: 35.23, lat: 31.78 },
	{ id: 'gaza', name: 'Gaza', lon: 34.46, lat: 31.5 },
	{ id: 'tabuk', name: 'Tabuk', lon: 36.57, lat: 28.38 },
	{ id: 'medina', name: 'Medina', lon: 39.61, lat: 24.47, names: /** @type {[number, string][]} */ ([[-999, 'Yathrib'], [622, 'Medina']]), capital: /** @type {[number, number]} */ ([622, 9999]) },
	{ id: 'pelusium', name: 'Pelusium', lon: 32.55, lat: 31.04 },
	{ id: 'memphis', name: 'Memphis', lon: 31.23, lat: 29.98, names: /** @type {[number, string][]} */ ([[641, 'Fustat']]) },
	{ id: 'alexandria', name: 'Alexandria', lon: 29.92, lat: 31.2, capital: /** @type {[number, number]} */ ([-999, -30]) }
];

/** @type {import('../atlas.js').RouteDef[]} */
const ROUTES = [
	{ id: 'crassus', side: 'rome', label: 'Crassus', points: ['zeugma', 'carrhae'], battle: 'carrhae', bend: -1, order: 0 },
	{ id: 'surena', side: 'persia', label: 'Surena', points: [[41.3, 36.3], 'carrhae'], battle: 'carrhae', order: 0.4 },
	{ id: 'cassius', side: 'rome', label: 'Cassius gets out', kind: 'retreat', points: ['carrhae', 'antioch'], order: 1.8 },
	{ id: 'trajan', side: 'rome', label: 'Trajan, 115–116', points: ['antioch', 'zeugma', 'edessa', 'nisibis', 'nineveh', 'ctesiphon', 'charax'] },
	{ id: 'shahrbaraz', side: 'persia', label: 'Shahrbaraz, 613–619', points: ['nisibis', 'edessa', 'antioch', 'damascus', 'jerusalem', 'pelusium', 'alexandria'] },
	{ id: 'shahin', side: 'persia', label: 'Shahin, 615', points: ['melitene', 'caesarea', 'ancyra', 'chalcedon'], order: 0.5 },
	{ id: 'heraclius-624', side: 'rome', label: 'Heraclius, 624', points: ['caesarea', 'theodosiopolis', 'artaxata', 'ganzak'] },
	{ id: 'heraclius-627', side: 'rome', label: 'Heraclius, 627', points: ['tiflis', [45.6, 38.9], [45.2, 37.0], 'nineveh'], battle: 'nineveh' },
	{ id: 'dastagerd', side: 'rome', label: 'Dastagerd, 628', points: ['nineveh', 'dastagerd'], order: 2.4 },
	{ id: 'khalid', side: 'arabs', label: 'Khalid, 633', points: ['medina', [46.7, 24.9], [47.9, 29.3], 'hira'], order: 0 },
	{ id: 'yarmouk', side: 'arabs', label: 'Yarmouk, 636', points: ['medina', 'tabuk', 'bostra', 'yarmouk'], battle: 'yarmouk', order: 1 },
	{ id: 'qadisiyyah', side: 'arabs', label: 'Qadisiyyah, 636', points: ['medina', [42.8, 28.6], 'qadisiyyah'], battle: 'qadisiyyah', order: 1.5 },
	{ id: 'nahavand', side: 'arabs', label: 'Nahavand, 642', points: ['qadisiyyah', 'ctesiphon', 'jalula', 'nahavand'], battle: 'nahavand', order: 3 },
	{ id: 'amr', side: 'arabs', label: 'Amr, 640–642', points: ['gaza', 'pelusium', 'memphis', 'alexandria'], order: 3.4 },
	{ id: 'yazdegerd', side: 'persia', label: 'Yazdegerd flees', kind: 'retreat', points: ['ctesiphon', 'istakhr', 'merv'], order: 4 },
	{ id: 'khorasan', side: 'arabs', label: 'Khorasan, 651', points: ['nahavand', 'rayy', 'merv'], order: 4.6 }
];

/** @type {import('../atlas.js').GeoLabelDef[]} */
const LABELS = [
	{ text: 'Mediterranean Sea', lon: 26.8, lat: 33.7, kind: 'sea' },
	{ text: 'Black Sea', lon: 34.3, lat: 43.3, kind: 'sea' },
	{ text: 'Caspian Sea', lon: 50.75, lat: 42.4, angle: -78, kind: 'sea' },
	{ text: 'Persian Gulf', lon: 51.4, lat: 27.3, angle: 27, kind: 'sea' },
	{ text: 'Red Sea', lon: 36.6, lat: 24.6, angle: 58, kind: 'sea' },
	{ text: 'Aegean', lon: 25.1, lat: 38.7, kind: 'sea' },
	{ text: 'Aral Sea', lon: 59.9, lat: 45.0, kind: 'sea' },
	{ text: 'Euphrates', lon: 40.05, lat: 35.55, angle: 36, kind: 'river' },
	{ text: 'Tigris', lon: 44.15, lat: 34.75, angle: 56, kind: 'river' },
	{ text: 'Nile', lon: 31.55, lat: 27.9, angle: -80, kind: 'river' },
	{ text: 'Taurus', lon: 34.2, lat: 37.45, angle: -12, kind: 'range' },
	{ text: 'Zagros', lon: 47.4, lat: 33.25, angle: 42, kind: 'range' },
	{ text: 'Caucasus', lon: 43.6, lat: 43.1, angle: 20, kind: 'range' },
	{ text: 'Arabia', lon: 43.0, lat: 26.6, kind: 'region' },
	{ text: 'Syrian Desert', lon: 39.4, lat: 32.6, kind: 'region' }
];

export const persia = createAtlas({
	frame: FRAME,
	geo: GEO,
	range: { from: -64, to: 660 },
	polities: POLITIES,
	sites: SITES,
	events: EVENTS,
	peaks: PEAKS,
	places: PLACES,
	routes: ROUTES,
	labels: LABELS,
	highlights: ['ctesiphon', 'byzantium', 'antioch', 'alexandria', 'jerusalem', 'nisibis', 'artaxata', 'palmyra', 'medina', 'istakhr', 'merv']
});
