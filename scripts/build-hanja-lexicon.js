/**
 * Builds the brush page's suggestion dictionary from real usage data.
 *
 *   node scripts/build-hanja-lexicon.js /tmp/hanja
 *
 * The directory must hold:
 *   hanja.txt          libhangul's hangul→hanja dictionary (BSD)
 *                      https://github.com/libhangul/libhangul/blob/main/data/hanja/hanja.txt
 *   ko_full.txt        OpenSubtitles word frequencies (spoken Korean)
 *                      https://github.com/hermitdave/FrequencyWords
 *   Unihan_Readings.txt  Unicode's hanja readings and English definitions
 *   kowiki.xml.bz2     Korean Wikipedia articles (written Korean)
 *                      https://dumps.wikimedia.org/kowiki/latest/kowiki-latest-pages-articles.xml.bz2
 *
 * From Wikipedia it counts three things: how often a hangul word is glossed with a given
 * hanja spelling, as in "계백(階伯", how often each hanja word and character appears, and
 * how often each hangul word appears (with common particles stripped).
 *
 * Writes static/hanja/lexicon.txt (hangul, frequency, ranked hanja) and
 * static/hanja/english.txt (character, reading, frequency, definition).
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = process.argv[2] ?? '/tmp/hanja';
const OUT = join(process.cwd(), 'static/hanja');
const WORDS = 70000;
const VARIANTS = 6;
const SYLLABLE_VARIANTS = 10;
const ENGLISH_CHARS = 4000;

const HAN = '\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF';
const GLOSS = new RegExp(`([가-힣]{1,8}) ?\\(([${HAN}]{1,8})(?=[,)\\s;·:])`, 'g');
const HAN_RUN = new RegExp(`[${HAN}]+`, 'g');
const HANGUL_RUN = /[가-힣]+/g;

/** Particles and endings, longest first, so 계백은 and 사랑하다 count toward 계백 and 사랑. */
const ENDINGS = [
	'에서는', '으로는', '이라는', '에게서', '했으며', '되었다', '하였다',
	'에서', '에게', '으로', '까지', '부터', '이다', '이며', '이고', '라는', '에는', '에도', '로는',
	'과의', '와의', '들은', '들이', '들의', '하다', '했다', '하는', '하여', '되는', '된다', '이나',
	'은', '는', '이', '가', '을', '를', '의', '에', '로', '와', '과', '도', '만', '들', '한', '된'
];

/** @param {string} word */
function stem(word) {
	for (const ending of ENDINGS) {
		if (word.length > ending.length && word.endsWith(ending)) return word.slice(0, -ending.length);
	}
	return word;
}

/** @param {Map<string, number>} map @param {string} key @param {number} [by] */
const bump = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);

/** libhangul: "hangul:hanja:gloss", in no particular order. */
function readDictionary() {
	/** @type {Map<string, string[]>} */
	const spellings = new Map();
	for (const line of readFileSync(join(SOURCE, 'hanja.txt'), 'utf8').split('\n')) {
		if (!line || line.startsWith('#')) continue;
		const [hangul, hanja] = line.split(':');
		if (!hangul || !hanja || !/^[가-힣]+$/.test(hangul)) continue;
		const list = spellings.get(hangul) ?? [];
		if (!list.includes(hanja)) list.push(hanja);
		spellings.set(hangul, list);
	}
	return spellings;
}

/** Unihan: each character's hangul readings and English definition. */
function readUnihan() {
	/** @type {Map<string, { readings: string[], definition: string }>} */
	const chars = new Map();
	for (const line of readFileSync(join(SOURCE, 'Unihan_Readings.txt'), 'utf8').split('\n')) {
		const match = /^U\+([0-9A-F]+)\t(kHangul|kDefinition)\t(.+)$/.exec(line);
		if (!match) continue;
		const char = String.fromCodePoint(parseInt(match[1], 16));
		const entry = chars.get(char) ?? { readings: [], definition: '' };
		if (match[2] === 'kHangul') entry.readings = match[3].split(' ').map((reading) => reading.split(':')[0]);
		else entry.definition = match[3];
		chars.set(char, entry);
	}
	return chars;
}

/** OpenSubtitles: "word count", one per line. */
function readSubtitles() {
	/** @type {Map<string, number>} */
	const counts = new Map();
	for (const line of readFileSync(join(SOURCE, 'ko_full.txt'), 'utf8').split('\n')) {
		const [word, count] = line.split(' ');
		if (!word || !/^[가-힣]+$/.test(word)) continue;
		bump(counts, stem(word), Number(count));
	}
	return counts;
}

/**
 * Streams Wikipedia once, counting only strings the dictionaries already know, so memory stays bounded.
 * @param {Set<string>} hangulWords
 * @param {Set<string>} hanjaWords
 */
function readWikipedia(hangulWords, hanjaWords) {
	/** @type {Map<string, number>} */ const glosses = new Map();
	/** @type {Map<string, number>} */ const hanja = new Map();
	/** @type {Map<string, number>} */ const chars = new Map();
	/** @type {Map<string, number>} */ const words = new Map();
	let lines = 0;

	const bzcat = spawn('bzcat', [join(SOURCE, 'kowiki.xml.bz2')]);
	const reader = createInterface({ input: bzcat.stdout, crlfDelay: Infinity });

	reader.on('line', (line) => {
		if (++lines % 5_000_000 === 0) console.log(`  ${(lines / 1e6).toFixed(0)}M lines`);
		for (const [, hangul, spelling] of line.matchAll(GLOSS)) {
			bump(glosses, `${stem(hangul)}\t${spelling}`);
			if (stem(hangul) !== hangul) bump(glosses, `${hangul}\t${spelling}`);
		}
		for (const [run] of line.matchAll(HAN_RUN)) {
			for (const char of run) bump(chars, char);
			for (let start = 0; start < run.length - 1; start++) {
				for (let end = start + 2; end <= Math.min(run.length, start + 6); end++) {
					const word = run.slice(start, end);
					if (hanjaWords.has(word)) bump(hanja, word);
				}
			}
		}
		for (const [run] of line.matchAll(HANGUL_RUN)) {
			if (run.length > 10) continue;
			const root = stem(run);
			if (hangulWords.has(root)) bump(words, root);
			else if (hangulWords.has(run)) bump(words, run);
		}
	});

	return new Promise((done, fail) => {
		bzcat.on('error', fail);
		reader.on('close', () => done({ glosses, hanja, chars, words }));
	});
}

async function main() {
	console.log('Reading dictionaries…');
	const spellings = readDictionary();
	const unihan = readUnihan();
	const subtitles = readSubtitles();

	/** Every hangul reading of a character, so single syllables can offer all their hanja. */
	for (const [char, { readings }] of unihan) {
		for (const reading of readings) {
			if (!/^[가-힣]$/.test(reading)) continue;
			const list = spellings.get(reading) ?? [];
			if (!list.includes(char)) list.push(char);
			spellings.set(reading, list);
		}
	}

	const hangulWords = new Set([...spellings.keys(), ...subtitles.keys()]);
	const hanjaWords = new Set([...spellings.values()].flat().filter((word) => word.length > 1));
	console.log(`  ${hangulWords.size} hangul words, ${hanjaWords.size} hanja words`);

	console.log('Counting Korean Wikipedia…');
	const wiki = await readWikipedia(hangulWords, hanjaWords);
	console.log(`  ${wiki.glosses.size} glosses, ${wiki.words.size} words, ${wiki.chars.size} characters`);

	/** Written and spoken Korean weigh equally: each word's share of each corpus, averaged. */
	const wikiTotal = [...wiki.words.values()].reduce((sum, n) => sum + n, 0);
	const subsTotal = [...subtitles.values()].reduce((sum, n) => sum + n, 0);
	/** @param {string} word */
	const frequency = (word) =>
		((wiki.words.get(word) ?? 0) / wikiTotal + (subtitles.get(word) ?? 0) / subsTotal) / 2;

	/**
	 * A spelling's evidence: being written as this word's gloss, and how often the hanja word
	 * appears anywhere, including inside longer terms (火山 in 火山巖, 活火山). Glosses alone
	 * favor proper nouns, since nobody glosses an everyday word. Single characters fall back on
	 * how common the character is.
	 * @param {string} hangul @param {string} spelling
	 */
	const evidence = (hangul, spelling) =>
		(wiki.glosses.get(`${hangul}\t${spelling}`) ?? 0) * 4 +
		(spelling.length > 1 ? (wiki.hanja.get(spelling) ?? 0) : (wiki.chars.get(spelling) ?? 0) / 50);

	/** @type {{ hangul: string, score: number, hanja: string[] }[]} */
	const entries = [];
	for (const hangul of hangulWords) {
		const list = spellings.get(hangul) ?? [];
		const ranked = list
			.map((spelling, order) => ({ spelling, order, weight: evidence(hangul, spelling) }))
			.sort((a, b) => b.weight - a.weight || a.order - b.order);
		const proven = ranked.filter((entry) => entry.weight > 0);
		const keep = hangul.length === 1 ? SYLLABLE_VARIANTS : VARIANTS;
		const hanja = (proven.length ? proven : ranked.slice(0, 2)).slice(0, keep).map((entry) => entry.spelling);
		const glossed = proven.reduce((sum, entry) => sum + entry.weight, 0);
		const score = frequency(hangul) + (glossed / wikiTotal) * 0.05;
		if (score > 0 || hangul.length === 1) entries.push({ hangul, score, hanja });
	}

	entries.sort((a, b) => b.score - a.score);
	const syllables = entries.filter((entry) => entry.hangul.length === 1);
	const words = entries.filter((entry) => entry.hangul.length > 1).slice(0, WORDS);
	const lexicon = [...words, ...syllables]
		.map(({ hangul, score, hanja }) => `${hangul}\t${Math.max(1, Math.round(score * 1e8))}\t${hanja.join(' ')}`)
		.join('\n');

	/** A character's usual reading: the syllable that ranks it highest, so 龍 reads 용, not 룡. */
	const syllableRank = new Map(syllables.map((entry) => [entry.hangul, entry]));
	/** @param {string} char @param {string} reading */
	const place = (char, reading) => {
		const n = syllableRank.get(reading)?.hanja.indexOf(char) ?? -1;
		return n < 0 ? Infinity : n;
	};
	/** @param {string} char @param {string[]} readings */
	const usual = (char, readings) =>
		[...readings].sort(
			(a, b) =>
				place(char, a) - place(char, b) ||
				(syllableRank.get(b)?.score ?? 0) - (syllableRank.get(a)?.score ?? 0)
		)[0];

	const english = [...unihan]
		.filter(([char, entry]) => entry.definition && entry.readings.length && wiki.chars.has(char))
		.sort((a, b) => (wiki.chars.get(b[0]) ?? 0) - (wiki.chars.get(a[0]) ?? 0))
		.slice(0, ENGLISH_CHARS)
		.map(([char, entry]) => `${char}\t${usual(char, entry.readings)}\t${wiki.chars.get(char)}\t${entry.definition}`)
		.join('\n');

	mkdirSync(OUT, { recursive: true });
	writeFileSync(join(OUT, 'lexicon.txt'), lexicon + '\n');
	writeFileSync(join(OUT, 'english.txt'), english + '\n');
	console.log(`Wrote ${words.length + syllables.length} words and ${ENGLISH_CHARS} characters to ${OUT}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
