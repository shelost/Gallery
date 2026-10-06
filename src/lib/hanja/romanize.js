/**
 * Turning hangul into keys that people's spellings can be matched against.
 *
 * Nobody types Revised Romanization exactly: 계백 is "gyebaek", but people write "gyebek",
 * "kyebaek", "gyebaeg". So both the dictionary and the input are folded into a loose key
 * where the letters people swap freely become the same letter, and frequency sorts out the rest.
 */

const BASE = 0xac00;
const LAST = 0xd7a3;

const INITIALS = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const VOWELS = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
/** Finals as they sound at the end of a syllable. */
const FINALS = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
/** Finals that carry over into a following vowel, the way 한국어 is said "han-gu-geo". */
const CARRIED = ['', 'g', 'kk', 'ks', 'n', 'nj', 'n', 'd', 'r', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'r', 'm', 'b', 'ps', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', ''];

/** Compatibility jamo, so a half-typed syllable like 계ㅂ can still prefix-match 계백. */
const JAMO_INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JAMO_VOWELS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JAMO_FINALS = ['', 'ㄱ', 'ㄲ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/** @param {number} code */
const isSyllable = (code) => code >= BASE && code <= LAST;

/** @param {string} char */
function parts(char) {
	const code = char.charCodeAt(0) - BASE;
	return { initial: Math.floor(code / 588), vowel: Math.floor((code % 588) / 28), final: code % 28 };
}

/**
 * Revised Romanization, one string per syllable, carrying a final consonant into a following vowel.
 * @param {string} hangul
 */
function syllables(hangul) {
	const chars = [...hangul];
	return chars.map((char, n) => {
		if (!isSyllable(char.charCodeAt(0))) return char;
		const { initial, vowel, final } = parts(char);
		const next = chars[n + 1];
		const carries = next && isSyllable(next.charCodeAt(0)) && parts(next).initial === 11;
		return INITIALS[initial] + VOWELS[vowel] + (carries ? CARRIED[final] : FINALS[final]);
	});
}

/** @param {string} hangul */
export const romanize = (hangul) => syllables(hangul).join('');

/**
 * A word's loose key. Each syllable folds on its own, so 포옹's "po-ong" never reads as "pung".
 * @param {string} hangul
 */
export const looseKey = (hangul) => collapse(syllables(hangul).map(fold).join(''));

/**
 * Folds a spelling so the letters people swap freely become one letter:
 * eo/o, ae/e, eu/u, g/k, d/t, b/p, j/ch, r/l, and doubled letters.
 * @param {string} spelling
 */
export const loosen = (spelling) => collapse(fold(spelling));

/** @param {string} spelling */
const collapse = (spelling) => spelling.replace(/(.)\1+/g, '$1');

/** @param {string} spelling */
function fold(spelling) {
	return spelling
		.toLowerCase()
		.replace(/[^a-z]/g, '')
		.replace(/eo/g, 'o')
		.replace(/ae|ai/g, 'e')
		.replace(/eu/g, 'u')
		.replace(/oo/g, 'u')
		.replace(/ee/g, 'i')
		.replace(/oe/g, 'we')
		.replace(/sh/g, 's')
		.replace(/ch|[jzc]/g, 'c')
		.replace(/[gkq]/g, 'k')
		.replace(/[dt]/g, 't')
		.replace(/[bpfv]/g, 'p')
		.replace(/r/g, 'l');
}

/**
 * Spells hangul out as jamo, so prefixes line up below the syllable: 계배 is a prefix of 계백.
 * @param {string} hangul
 */
export function jamo(hangul) {
	let out = '';
	for (const char of hangul) {
		if (!isSyllable(char.charCodeAt(0))) {
			out += char;
			continue;
		}
		const { initial, vowel, final } = parts(char);
		out += JAMO_INITIALS[initial] + JAMO_VOWELS[vowel] + JAMO_FINALS[final];
	}
	return out;
}

/** @param {string} text */
export const isHangul = (text) => /^[가-힣ㄱ-ㅣ]+$/.test(text);

/** @param {string} text */
export const isLatin = (text) => /^[a-zA-Z]+$/.test(text);
