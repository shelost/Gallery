import { dayOfYear } from './today.js';

/** @typedef {{ ref: string, text: string }} Verse */

/** A year of verses to turn to, in the King James Version. One comes up each day, in turn. */
export const VERSES = /** @type {Verse[]} */ ([
	{ ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
	{ ref: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.' },
	{ ref: 'Proverbs 3:5–6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.' },
	{ ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
	{ ref: 'Isaiah 40:31', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
	{ ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
	{ ref: 'Joshua 1:9', text: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.' },
	{ ref: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.' },
	{ ref: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
	{ ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.' },
	{ ref: '1 Corinthians 13:4', text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.' },
	{ ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
	{ ref: 'Matthew 6:34', text: 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.' },
	{ ref: 'Ecclesiastes 3:1', text: 'To every thing there is a season, and a time to every purpose under the heaven.' },
	{ ref: 'Galatians 6:9', text: 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.' },
	{ ref: 'Micah 6:8', text: 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?' },
	{ ref: 'Lamentations 3:22–23', text: 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.' },
	{ ref: 'Colossians 3:23', text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.' },
	{ ref: 'Psalm 27:1', text: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?' },
	{ ref: 'Matthew 5:14', text: 'Ye are the light of the world. A city that is set on an hill cannot be hid.' },
	{ ref: 'Proverbs 16:3', text: 'Commit thy works unto the LORD, and thy thoughts shall be established.' },
	{ ref: '2 Timothy 1:7', text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.' },
	{ ref: 'Psalm 37:4', text: 'Delight thyself also in the LORD; and he shall give thee the desires of thine heart.' },
	{ ref: 'Hebrews 11:1', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.' },
	{ ref: 'James 1:5', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.' },
	{ ref: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.' },
	{ ref: 'John 14:27', text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.' },
	{ ref: 'Psalm 118:24', text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.' },
	{ ref: 'Romans 12:2', text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind.' },
	{ ref: '1 Peter 5:7', text: 'Casting all your care upon him; for he careth for you.' },
	{ ref: 'Matthew 7:7', text: 'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.' },
	{ ref: 'Psalm 90:12', text: 'So teach us to number our days, that we may apply our hearts unto wisdom.' }
]);

/**
 * The verse for a calendar date, the same for everyone that day.
 * @param {{ year: number, month: number, day: number }} date
 */
export function verseOfTheDay(date) {
	const { day } = dayOfYear(date);
	return VERSES[(date.year * 366 + day) % VERSES.length];
}

/** Where to read the verse in context. @param {Verse} verse */
export function verseLink(verse) {
	return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(verse.ref.replace('–', '-'))}&version=KJV`;
}
