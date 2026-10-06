import { isHangul, isLatin, jamo, looseKey, loosen, romanize } from './romanize.js';

/**
 * Candidates for whatever's being typed: romanized Korean ("gyebek"), hangul (계백), or an
 * English meaning ("dragon"), each answered with hangul and hanja ranked by real usage.
 * The data comes from scripts/build-hanja-lexicon.js and loads the first time it's needed.
 */

/** @typedef {{ hangul: string, freq: number, hanja: string[], roman: string, loose: string, jamo: string }} Entry */
/** @typedef {{ char: string, reading: string, freq: number }} Glyph */
/** @typedef {{ text: string, note: string, kind: 'hangul' | 'hanja' }} Candidate */
/** @typedef {{ entries: Entry[], byLoose: Entry[], byJamo: Entry[], exact: Map<string, Entry>, sounds: Map<string, Entry>, total: number, english: Map<string, (Glyph & { sense: number })[]> }} Index */

const LIMIT = 12;
const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'to', 'and', 'or', 'in', 'on', 'be', 'as', 'by', 'for', 'with', 'at', 'is', 'used', 'name', 'surname', 'kangxi', 'radical', 'variant', 'same', 'also']);

/** @type {Promise<Index> | null} */
let loading = null;

/** Fetches and indexes the dictionary once; later calls share the same promise. */
export function load() {
	loading ??= Promise.all([
		fetch('/hanja/lexicon.txt').then((res) => res.text()),
		fetch('/hanja/english.txt').then((res) => res.text())
	]).then(([lexicon, english]) => index(lexicon, english));
	return loading;
}

/**
 * @param {string} lexicon
 * @param {string} english
 * @returns {Index}
 */
function index(lexicon, english) {
	/** @type {Entry[]} */
	const entries = [];
	for (const line of lexicon.split('\n')) {
		if (!line) continue;
		const [hangul, freq, hanja = ''] = line.split('\t');
		entries.push({
			hangul,
			freq: Number(freq),
			hanja: hanja ? hanja.split(' ') : [],
			roman: romanize(hangul),
			loose: looseKey(hangul),
			jamo: jamo(hangul)
		});
	}

	/** @type {Map<string, (Glyph & { sense: number })[]>} */
	const words = new Map();
	for (const line of english.split('\n')) {
		if (!line) continue;
		const [char, reading, freq, definition] = line.split('\t');
		definition.toLowerCase().split(/[;,]/).forEach((meaning, sense) => {
			for (const word of new Set(meaning.match(/[a-z]+/g) ?? [])) {
				if (STOPWORDS.has(word) || word.length < 3) continue;
				const list = words.get(word) ?? [];
				list.push({ char, reading, freq: Number(freq), sense });
				words.set(word, list);
			}
		});
	}

	/** The likeliest word for each loose spelling, for splitting phrases into words. */
	/** @type {Map<string, Entry>} */
	const sounds = new Map();
	for (const entry of entries) {
		const held = sounds.get(entry.loose);
		if (!held || entry.freq > held.freq) sounds.set(entry.loose, entry);
	}

	return {
		entries,
		byLoose: [...entries].sort((a, b) => compare(a.loose, b.loose)),
		byJamo: [...entries].sort((a, b) => compare(a.jamo, b.jamo)),
		exact: new Map(entries.map((entry) => [entry.hangul, entry])),
		sounds,
		total: entries.reduce((sum, entry) => sum + entry.freq, 0),
		english: words
	};
}

/** Each extra word in a split costs this much on top of its probability, so 風林 beats 風 + 林. */
const SPLIT = 1;

/**
 * Splits a phrase into the likeliest sequence of known words: a unigram language model,
 * where a split's score is the sum of its words' log probabilities.
 * @param {string} phrase a loose spelling or a hangul string
 * @param {(piece: string) => Entry | undefined} find
 * @param {number} longest the longest piece worth trying
 * @param {number} total the summed frequency of every word
 * @returns {Entry[] | null}
 */
function split(phrase, find, longest, total) {
	/** @type {({ score: number, from: number, entry: Entry } | null)[]} */
	const best = [{ score: 0, from: 0, entry: /** @type {Entry} */ (/** @type {unknown} */ (null)) }];
	for (let end = 1; end <= phrase.length; end++) {
		best[end] = null;
		for (let start = Math.max(0, end - longest); start < end; start++) {
			const before = best[start];
			const entry = before && find(phrase.slice(start, end));
			if (!before || !entry) continue;
			const score = before.score + Math.log((entry.freq + 1) / total) - SPLIT;
			if (!best[end] || score > /** @type {{ score: number }} */ (best[end]).score) best[end] = { score, from: start, entry };
		}
	}
	if (!best[phrase.length]) return null;
	/** @type {Entry[]} */
	const out = [];
	for (let at = phrase.length; at > 0; ) {
		const step = /** @type {{ from: number, entry: Entry }} */ (best[at]);
		out.unshift(step.entry);
		at = step.from;
	}
	return out.length > 1 ? out : null;
}

/**
 * A phrase spelled out word by word: in hangul, and in hanja when every word has one.
 * @param {Entry[] | null} words
 * @returns {Candidate[]}
 */
function compose(words) {
	if (!words) return [];
	const hangul = words.map((entry) => entry.hangul).join('');
	const out = [{ text: hangul, note: words.map((entry) => entry.roman).join('-'), kind: /** @type {const} */ ('hangul') }];
	if (words.every((entry) => entry.hanja.length)) {
		out.push({ text: words.map((entry) => entry.hanja[0]).join(''), note: hangul, kind: 'hanja' });
	}
	return out;
}

/**
 * Drops repeats, keeping the first, likeliest one.
 * @param {Candidate[]} list
 */
function unique(list) {
	const seen = new Set();
	return list.filter((candidate) => !seen.has(candidate.text) && seen.add(candidate.text)).slice(0, LIMIT);
}

/** @param {string} a @param {string} b */
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Every entry whose key starts with the prefix, found by binary search on the sorted list.
 * @param {Entry[]} sorted
 * @param {'loose' | 'jamo'} key
 * @param {string} prefix
 */
function range(sorted, key, prefix) {
	let low = 0;
	let high = sorted.length;
	while (low < high) {
		const mid = (low + high) >> 1;
		if (sorted[mid][key] < prefix) low = mid + 1;
		else high = mid;
	}
	const out = [];
	for (let n = low; n < sorted.length && sorted[n][key].startsWith(prefix); n++) out.push(sorted[n]);
	return out;
}

/**
 * Most likely first: how common the word is, a strong preference for matching the whole
 * spelling over only its start, and a nudge for spelling it exactly the standard way.
 * @param {Entry[]} found
 * @param {(entry: Entry) => number} bonus
 */
function rank(found, bonus) {
	return found
		.map((entry) => ({ entry, score: Math.log(entry.freq + 1) + bonus(entry) }))
		.sort((a, b) => b.score - a.score)
		.map(({ entry }) => entry);
}

/**
 * The first word gets its hanja spelled out in full; the rest bring their likeliest one.
 * @param {Entry[]} words
 */
function spread(words) {
	/** @type {Candidate[]} */
	const out = [];
	words.forEach((entry, n) => {
		out.push({ text: entry.hangul, note: entry.roman, kind: 'hangul' });
		for (const hanja of entry.hanja.slice(0, n === 0 ? 4 : 1)) out.push({ text: hanja, note: entry.hangul, kind: 'hanja' });
	});
	return out;
}

/**
 * @param {Index} data
 * @param {string} word
 * @returns {Candidate[]}
 */
function fromEnglish(data, word) {
	const glyphs = data.english.get(word.toLowerCase()) ?? [];
	return glyphs
		.map((glyph) => ({ glyph, score: Math.log(glyph.freq + 1) - glyph.sense * 1.5 }))
		.sort((a, b) => b.score - a.score)
		.slice(0, 5)
		.map(({ glyph }) => ({ text: glyph.char, note: `${glyph.reading} · ${word}`, kind: /** @type {const} */ ('hanja') }));
}

/**
 * The loose keys a typed spelling could stand for: as written, then the older habits of
 * writing ㅓ as "u" (chosun, hyundai) and 이 as "yi".
 * @param {string} lower
 */
function readings(lower) {
	const spellings = [lower, lower.replace(/u/g, 'eo'), lower.replace(/yi/g, 'i')];
	return [...new Set(spellings.map(loosen))];
}

/**
 * @param {Index} data
 * @param {string} token
 * @returns {Candidate[]}
 */
export function suggest(data, token) {
	if (isLatin(token)) {
		if (token.length < 2) return [];
		const lower = token.toLowerCase();
		const keys = readings(lower);
		/** @type {Map<Entry, number>} */
		const best = new Map();
		keys.forEach((key, n) => {
			for (const entry of range(data.byLoose, 'loose', key)) {
				const whole = entry.loose === key ? 6 : -0.6 * (entry.loose.length - key.length);
				const bonus = whole + (entry.roman === lower ? 1.5 : 0) - n * 3;
				best.set(entry, Math.max(best.get(entry) ?? -Infinity, bonus));
			}
		});
		const words = rank([...best.keys()], (entry) => best.get(entry) ?? 0).slice(0, 5);
		const english = token.length >= 3 ? fromEnglish(data, token) : [];
		const confident = !!words[0] && keys.includes(words[0].loose);
		const korean = spread(words);
		if (confident) return unique([...korean, ...english]);
		const spelled = token.length >= 4 && !english.length;
		const phrase = spelled ? compose(split(keys[0], (piece) => data.sounds.get(piece), 14, data.total)) : [];
		return unique([...english, ...phrase, ...korean]);
	}

	if (isHangul(token)) {
		const exact = data.exact.get(token);
		const key = jamo(token);
		const longer = rank(
			range(data.byJamo, 'jamo', key).filter((entry) => entry !== exact),
			(entry) => -0.5 * (entry.jamo.length - key.length)
		).slice(0, 4);
		/** @type {Candidate[]} */
		const own = exact ? exact.hanja.map((hanja) => ({ text: hanja, note: exact.hangul, kind: 'hanja' })) : [];
		const phrase = exact
			? []
			: compose(split(token, (piece) => data.exact.get(piece), 6, data.total)).filter((c) => c.kind === 'hanja');
		const completions = spread(longer);
		/** Two syllables with no match are usually a word still being typed, so finish it first. */
		const typing = [...token].length <= 2;
		return unique(typing ? [...own, ...completions, ...phrase] : [...own, ...phrase, ...completions]);
	}

	return [];
}

/**
 * The word the caret is in: a run of Latin letters or of hangul, whichever the caret touches.
 * @param {string} value
 * @param {number} caret
 */
export function wordAt(value, caret) {
	for (const pattern of [/[a-zA-Z]/, /[가-힣ㄱ-ㅣ]/]) {
		let start = caret;
		let end = caret;
		while (start > 0 && pattern.test(value[start - 1])) start--;
		while (end < value.length && pattern.test(value[end])) end++;
		if (end > start) return { start, end, word: value.slice(start, end) };
	}
	return null;
}
