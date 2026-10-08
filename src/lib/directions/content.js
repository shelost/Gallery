/**
 * Shared content for the /directions prototypes. Mirrors the arrays and copy in
 * src/routes/+page.svelte so every direction shows the same real work.
 */

import { MONTHS } from './today.js';

/**
 * @typedef {{ kind: 'image' | 'video' | 'graph', src?: string, poster?: string, alt?: string, fit?: 'cover' | 'contain' }} Media
 * @typedef {{
 *   id: string,
 *   section: string,
 *   kind: string,
 *   title: string,
 *   year: string,
 *   kicker: string,
 *   blurb: string,
 *   href: string,
 *   media: Media | null,
 *   medium: string,
 *   credit: string,
 *   icon?: string,
 *   featured?: boolean,
 *   pages?: string[],
 *   art?: string,
 *   tag?: string
 * }} Work
 * A stretch of life on the timeline, shaped like a work so the index lists it like any other group.
 * `until` is null while it's ongoing.
 * @typedef {Work & { from: number, until: number | null }} Job
 */

export const PROFILE = {
	name: 'Heewon Ahn',
	email: 'ahnheewon823@gmail.com',
	avatar: '/smiley.png',
	bust: '/statue.png',
	roles: ['designer', 'engineer', 'occasional artist'],
	bio: 'Founding designer at Stan, where we grew from $0 to $30M ARR in three years. Now building a new UX paradigm for generative AI.',
	links: [
		{ label: 'Email', href: 'mailto:ahnheewon823@gmail.com' },
		{ label: 'X', handle: '@ahnheewoni', href: 'https://x.com/ahnheewoni' },
		{ label: 'Instagram', handle: '_heewonahn', href: 'https://instagram.com/_heewonahn' },
		{ label: 'LinkedIn', handle: 'in/ahnheewon', href: 'https://linkedin.com/in/ahnheewon' },
		{ label: 'GitHub', handle: 'shelost', href: 'https://github.com/shelost' }
	]
};

export const SECTIONS = [
	{ id: 'products', label: 'Products', numeral: 'I', verb: 'make' },
	{ id: 'writing', label: 'Writing', numeral: 'II', verb: 'write' },
	{ id: 'design', label: 'Design', numeral: 'III', verb: 'design' },
	{ id: 'games', label: 'Games', numeral: 'IV', verb: 'play' },
	{ id: 'webdev', label: 'Web apps', numeral: 'V', verb: 'build' },
	{ id: 'comics', label: 'Comics', numeral: 'VI', verb: 'draw' },
	{ id: 'research', label: 'Research', numeral: 'VII', verb: 'study' },
	{ id: 'videos', label: 'Videos', numeral: 'VIII', verb: 'watch' }
];

/** Salon rooms, in walking order. */
export const ROOMS = [
	{
		id: 'lobby',
		numeral: '',
		name: 'Lobby',
		note: 'The two products in progress hang by the door.',
		sections: ['products']
	},
	{
		id: 'paper',
		numeral: 'I',
		name: 'Works on paper',
		note: 'Comics and concept art. A childhood dream, one page at a time.',
		sections: ['comics']
	},
	{
		id: 'installations',
		numeral: 'II',
		name: 'Interactive installations',
		note: 'Web games from the pre-AI era. Graphics and code made by hand.',
		sections: ['games']
	},
	{
		id: 'commissions',
		numeral: 'III',
		name: 'Commissions',
		note: 'Work for Stan, as founding designer.',
		sections: ['design']
	},
	{
		id: 'manuscripts',
		numeral: 'IV',
		name: 'Manuscripts',
		note: 'Essays. Each one opens in the reading drawer.',
		sections: ['writing']
	},
	{
		id: 'time',
		numeral: 'V',
		name: 'Time-based media',
		note: 'Apps and tools built more recently, and two videos.',
		sections: ['webdev', 'videos']
	},
	{
		id: 'archive',
		numeral: 'VI',
		name: 'Archive',
		note: 'Research on the ARC challenge with Prof. Kevin Ellis.',
		sections: ['research']
	}
];

/** @type {Work[]} */
export const WORKS = [
	{
		id: 'ovid',
		section: 'products',
		kind: 'App',
		title: 'Ovid',
		year: '',
		kicker: 'App',
		blurb: 'Visual UX for AI',
		href: 'https://ovid.computer',
		media: { kind: 'video', src: '/video/ovid-x.mp4', poster: '/video/ovid-x.jpg', alt: 'Ovid in use' },
		medium: 'Software. A canvas for arranging models, images, and the work they make.',
		credit: 'Collection of the artist.',
		featured: true
	},
	{
		id: 'king',
		section: 'products',
		kind: 'Novel',
		title: 'Kingforall',
		year: '',
		kicker: 'Novel',
		blurb: 'Historical Fiction',
		href: 'https://kingforall.com',
		media: {
			kind: 'video',
			src: '/video/kingforall-title.mp4',
			poster: '/video/kingforall-title.jpg',
			alt: 'The King for All title sequence'
		},
		medium: 'Software and history. A chronicle of 7th-century Samhan.',
		credit: 'Collection of the artist.',
		featured: true
	},
	{
		id: 'chancellor',
		section: 'products',
		kind: 'Blog',
		title: 'Chancellor',
		year: '',
		kicker: 'Blog',
		blurb: 'Tech, History, Current Events',
		href: '/blog',
		media: null,
		medium: 'Blog. Tech, history, and current events.',
		credit: 'Collection of the artist.',
		featured: true
	},
	{
		id: 'school',
		section: 'education',
		kind: 'School',
		title: 'Cornell',
		year: '2021–22',
		kicker: 'Dropped out',
		blurb: 'Dropped out',
		href: 'https://www.cornell.edu',
		media: null,
		medium: 'University.',
		credit: 'Cornell University.'
	},
	{
		id: 'americana',
		section: 'writing',
		kind: 'Essay',
		title: 'The Aesthetics Age',
		year: '2026',
		kicker: 'Essay',
		blurb: 'Or, how vibes are everything now.',
		href: '/americana',
		media: { kind: 'image', src: '/blog/americana/pacu-jalur.jpg', alt: 'A boy dancing at the prow of a Pacu Jalur racing canoe' },
		medium: 'Essay.',
		credit: 'Read in the drawer.'
	},
	{
		id: 'gapyear',
		section: 'writing',
		kind: 'Essay',
		title: 'My Gap Year',
		year: '2025',
		kicker: 'Essay',
		blurb: 'My reflections with an eating disorder.',
		href: '/gapyear',
		media: null,
		medium: 'Essay.',
		credit: 'Read in the drawer.'
	},
	{
		id: 'pygmalion',
		section: 'writing',
		kind: 'Essay',
		title: 'A Visual Interface for Thought',
		year: '2025',
		kicker: 'Essay',
		blurb: "Revisiting David Canfield Smith's 1975 Pygmalion thesis to imagine what comes after chat.",
		href: '/pygmalion',
		media: {
			kind: 'image',
			src: '/pygmalion/galatea-15.png',
			alt: "Smith's Pygmalion programming environment",
			fit: 'contain'
		},
		medium: 'Essay.',
		credit: 'Read in the drawer.'
	},
	{
		id: 'palace',
		section: 'writing',
		kind: 'Essay',
		title: 'The AI Palace Economy',
		year: '2025',
		kicker: 'Essay',
		blurb: 'The intelligence revolution as a universal liquidity provider for the digital economy.',
		href: '/palace',
		media: { kind: 'image', src: '/blog/faces.png', alt: 'Illustration for The AI Palace Economy' },
		medium: 'Essay.',
		credit: 'Read in the drawer.'
	},
	{
		id: 'persia',
		section: 'writing',
		kind: 'Essay',
		title: 'The Roman-Persian Wars',
		year: '2025',
		kicker: 'Essay',
		blurb: 'Predictions on the US-China conflict, from the greatest rivalry of classical antiquity.',
		href: '/persia',
		media: null,
		medium: 'Essay.',
		credit: 'Read in the drawer.'
	},
	{
		id: 'timeline',
		section: 'writing',
		kind: 'Research',
		title: 'The Civilization Timeline',
		year: '2024',
		kicker: 'Chart',
		blurb: 'Three weeks charting the history of human civilization, by region and country.',
		href: '/timeline',
		media: { kind: 'image', src: '/civilization2.png', alt: 'Epochs and Civilizations chart' },
		medium: 'Research chart. Civilizations by region, from antiquity to now.',
		credit: 'Read in the drawer.'
	},
	{
		id: 'mario',
		section: 'writing',
		kind: 'Essay',
		title: 'The Super Mario Bros. Movie Review',
		year: '2023',
		kicker: 'Essay',
		blurb: "Nintendo's brand play, and what it means for the movie industry.",
		href: '/mario',
		media: null,
		medium: 'Essay.',
		credit: 'Read in the drawer.'
	},
	{
		id: 'stan',
		section: 'design',
		kind: 'Company',
		title: 'Stan',
		year: '2022–25',
		kicker: 'Founding designer',
		blurb: 'I dropped out of college at 19 to help build the future of work. We scaled from $0 to $30M ARR in three years, led by John and Vitalii.',
		href: 'https://stan.store',
		media: { kind: 'image', src: '/stan/stan-hero-1.png', alt: 'A Stan storefront', fit: 'contain' },
		medium: 'Commission. Founding product designer, from $0 to $30M ARR in three years.',
		credit: 'Commissioned by John & Vitalii.'
	},
	{
		id: 'brainteam',
		section: 'design',
		kind: 'Brand',
		title: 'Team Ithaca',
		year: '2021',
		kicker: 'School teams',
		blurb: 'Logos and banners for the Ithaca Brain Team and Science Olympiad.',
		href: '/ithaca',
		media: { kind: 'image', src: '/img/brainteam-banner.png', alt: 'The Ithaca Brain Team wordmark' },
		medium: 'School team designs.',
		credit: 'Commissioned by Team Ithaca.'
	},
	{
		id: 'paintball',
		section: 'design',
		kind: 'Brand',
		title: 'Ithaca Paintball',
		year: '2019',
		kicker: 'Local business',
		blurb: 'Branding and signage for a local paintball field.',
		href: '/paintball',
		media: { kind: 'image', src: '/img/paintball-01.png', alt: 'The Ithaca Paintball logo' },
		medium: 'Brand identity for a local business.',
		credit: 'Commissioned by Ithaca Paintball.'
	},
	{
		id: 'nybc',
		section: 'design',
		kind: 'Poster',
		title: 'NYBC',
		year: '2025',
		kicker: 'Posters',
		blurb: 'Posters and marketing for the New York Bible Conference.',
		href: '/nybc',
		media: { kind: 'image', src: '/img/nybc-2025.png', alt: 'The 2025 New York Bible Conference poster' },
		medium: 'Posters and marketing.',
		credit: 'Commissioned by the New York Bible Conference.'
	},
	{
		id: 'lab',
		section: 'design',
		kind: 'Brand',
		title: 'Cornell L+R Lab',
		year: '2024',
		kicker: 'Lab identity',
		blurb: 'Logos for the Learning & Recursion Lab, led by Prof. Kevin Ellis at Cornell.',
		href: '/lab',
		media: { kind: 'image', src: '/card/card-lab.png', alt: 'Cornell L+R Lab logos' },
		medium: 'Brand identity for an AI research lab.',
		credit: 'Commissioned by Prof. Kevin Ellis.'
	},
	{
		id: 'redesign',
		section: 'design',
		kind: 'Study',
		title: 'Logo Redesigns',
		year: '2022',
		kicker: 'Study',
		blurb: 'A personal exercise in giving famous brands a more modern feel.',
		href: '/redesign',
		media: { kind: 'image', src: '/card/card-redesign.png', alt: 'Redesigned brand logos' },
		medium: 'Graphic design study.',
		credit: 'Collection of the artist.'
	},
	{
		id: 'stan-gmv',
		section: 'webdev',
		kind: 'Dashboard',
		title: 'Stan GMV Tracker',
		year: '2024',
		kicker: 'Live dashboard',
		blurb: "A live, public dashboard tracking Stan's gross merchandise value in real time.",
		href: 'https://gmv.stan.store',
		media: { kind: 'video', src: '/video/stan_gmv.mov', alt: 'Stan GMV Tracker' },
		medium: "Live data visualization. Stan's gross merchandise value in real time.",
		credit: 'Commissioned by Stan.'
	},
	{
		id: 'stan-remix',
		section: 'webdev',
		kind: 'Web app',
		title: 'Stan Remix',
		year: '2024',
		kicker: 'Web app',
		blurb: 'An interactive remix of the Stan creator experience.',
		href: 'https://stan-remix.vercel.app/',
		media: {
			kind: 'video',
			src: '/video/stan_remix.mov',
			poster: '/card/card-stan.png',
			alt: 'Stan Remix'
		},
		medium: 'Video. The Stan creator experience.',
		credit: 'Commissioned by Stan.'
	},
	{
		id: 'platformr',
		section: 'games',
		kind: 'Game',
		title: 'Platformr',
		year: '',
		kicker: 'Platformer',
		blurb: 'My personal favorite game, where you create your own platforms. 18 handcrafted levels.',
		href: 'https://shelost.github.io/platformr',
		icon: '/icon-platformr.png',
		media: {
			kind: 'video',
			src: '/video/platformr.mp4',
			poster: '/card/card-platformr.png',
			alt: 'Platformr gameplay'
		},
		medium: 'Interactive installation. JavaScript and canvas, hand-drawn graphics, 18 levels.',
		credit: 'Playable in the gallery.'
	},
	{
		id: 'rooms',
		section: 'games',
		kind: 'Game',
		title: '11 Rooms',
		year: '',
		kicker: 'Puzzle',
		blurb: 'An atmospheric puzzle game set across 11 mysterious rooms.',
		href: 'https://shelost.github.io/11rooms',
		icon: '/icon-rooms.png',
		media: {
			kind: 'video',
			src: '/video/rooms.mp4',
			poster: '/card/card-rooms.png',
			alt: '11 Rooms gameplay'
		},
		medium: 'Interactive installation. An atmospheric puzzle across eleven rooms.',
		credit: 'Playable in the gallery.'
	},
	{
		id: 'orbiting',
		section: 'games',
		kind: 'Game',
		title: 'Just Orbiting By',
		year: '',
		kicker: 'Physics',
		blurb: 'A physics-based space game about orbital gravity and planetary motion.',
		href: 'https://shelost.github.io/orbiting',
		icon: '/icon-orbiting.png',
		media: {
			kind: 'video',
			src: '/video/orbiting.mp4',
			poster: '/card/card-orbiting.png',
			alt: 'Just Orbiting By gameplay'
		},
		medium: 'Interactive installation. Orbital gravity and planetary motion.',
		credit: 'Playable in the gallery.'
	},
	{
		id: 'wordchain',
		section: 'games',
		kind: 'Game',
		title: 'Wordchain',
		year: '',
		kicker: 'Word puzzle',
		blurb: 'A word puzzle where every answer begins with the last letter of the previous one.',
		href: 'https://shelost.github.io/wordchain',
		icon: '/icon-wordchain.png',
		media: {
			kind: 'video',
			src: '/video/wordchain.mp4',
			poster: '/card/card-wordchain.png',
			alt: 'Wordchain gameplay'
		},
		medium: 'Interactive installation. Each answer begins with the last letter of the one before.',
		credit: 'Playable in the gallery.'
	},
	{
		id: 'trails',
		section: 'games',
		kind: 'Game',
		title: 'Trails',
		year: '',
		kicker: 'Particle art',
		blurb: 'A particle art game where gravity and motion create colorful trails.',
		href: 'https://shelost.github.io/trails',
		icon: '/icon-trails.png',
		media: {
			kind: 'video',
			src: '/video/trails.mp4',
			poster: '/card/card-trails.png',
			alt: 'Trails gameplay'
		},
		medium: 'Interactive installation. Particles, gravity, and color.',
		credit: 'Playable in the gallery.'
	},
	{
		id: 'pong',
		section: 'games',
		kind: 'Game',
		title: 'Super Pong',
		year: '',
		kicker: 'Arcade',
		blurb: 'A high-speed, particle-charged remake of the classic Pong arcade game.',
		href: 'https://shelost.github.io/superpong',
		icon: '/icon-pong.png',
		media: {
			kind: 'video',
			src: '/video/pong.mp4',
			poster: '/card/card-pong.png',
			alt: 'Super Pong gameplay'
		},
		medium: 'Interactive installation. Pong, at high speed and particle-charged.',
		credit: 'Playable in the gallery.'
	},
	{
		id: 'canvas',
		section: 'webdev',
		kind: 'Web app',
		title: 'AI Canvas',
		year: '2025',
		kicker: 'Realtime AI drawing',
		blurb: "Realtime AI image generation, based on tldraw's Drawfast.",
		href: 'https://www.sketchdreamer.com/canvas',
		media: { kind: 'video', src: '/realtime%203.mov', alt: 'AI Canvas demo' },
		medium: "Software. Realtime image generation, after tldraw's Drawfast.",
		credit: 'Collection of the artist.'
	},
	{
		id: 'iphone',
		section: 'webdev',
		kind: 'Web app',
		title: 'iPhone 3D Creator',
		year: '2025',
		kicker: 'Design tool',
		blurb: 'A helper tool for UX designers.',
		href: 'https://www.sketchdreamer.com/phone',
		media: { kind: 'video', src: '/iphone3d.mov', alt: 'iPhone 3D Creator demo' },
		medium: 'Software. A helper tool for UX designers.',
		credit: 'Collection of the artist.'
	},
	{
		id: 'dido',
		section: 'webdev',
		kind: 'Web app',
		title: 'Dido UI',
		year: '2025',
		kicker: 'UI library',
		blurb: 'A minimalistic UI library.',
		href: 'https://dido-ui.vercel.app/',
		media: { kind: 'video', src: '/dido.mov', alt: 'Dido UI demo' },
		medium: 'Software. A minimalistic UI library.',
		credit: 'Collection of the artist.'
	},
	{
		id: 'scioly',
		section: 'webdev',
		kind: 'Website',
		title: 'Science Olympiad',
		year: '2020',
		kicker: 'Website',
		blurb: "Website for Ithaca's Science Olympiad team.",
		href: 'https://shelost.github.io/scioly',
		media: { kind: 'video', src: '/scioly.mov', alt: 'Science Olympiad website' },
		medium: "Website for Ithaca's Science Olympiad team.",
		credit: 'Gift of the artist.'
	},
	{
		id: 'pandemonium',
		section: 'comics',
		kind: 'Comic',
		title: 'Pandemonium',
		year: '2024',
		kicker: '천하만국',
		blurb: 'My first real comics chapter, built from classic Eastern novels such as Three Kingdoms and Journey to the West.',
		href: '/pandemonium',
		media: { kind: 'image', src: '/img/p1.png', alt: 'Pandemonium, page one' },
		pages: [
			'/img/p1.png',
			'/img/p20.png',
			'/img/p28.png',
			'/img/px-1.png',
			'/img/px-5.png',
			'/img/p8.png',
			'/img/p14.png',
			'/img/px-12.png',
			'/img/px-20.png'
		],
		art: '/title-cheonha.png',
		medium: 'Digital ink and color, after Three Kingdoms, the Odyssey, and Journey to the West.',
		credit: 'Gift of the artist.'
	},
	{
		id: 'samhan',
		section: 'comics',
		kind: 'Comic',
		title: 'The King of Samhan',
		year: '2025',
		kicker: 'Concept art',
		blurb: 'A historical adventure set in 7th-century Korea, loosely based on the K-drama Queen Seondeok.',
		href: '/kingdom',
		media: { kind: 'image', src: '/img/img-253.png', alt: 'The King of Samhan concept art' },
		pages: [
			'/img/img-253.png',
			'/img/img-240.png',
			'/img/img-234.png',
			'/img/samhan.png',
			'/img/img-245.png',
			'/img/img-249.png',
			'/img/img-237.png'
		],
		art: '/title-samhan.png',
		medium: 'Concept art for a webtoon about the 7th-century Unification Wars.',
		credit: 'Gift of the artist.'
	},
	{
		id: 'arcaide',
		section: 'research',
		kind: 'Research',
		title: 'Arcaide',
		year: '',
		kicker: 'ARC annotation',
		blurb: 'An extremely cleverly named ARC annotation tool that turns raw ARC data into JSON files of annotated objects.',
		href: 'https://shelost.github.io/arcaide2/',
		icon: '/logo-arcaide.png',
		media: { kind: 'image', src: '/arcaide.png', alt: 'Arcaide interface' },
		medium: 'Research software. Annotates raw ARC data as JSON objects.',
		credit: 'With Prof. Kevin Ellis, Cornell.'
	},
	{
		id: 'marc',
		section: 'research',
		kind: 'Dataset',
		title: 'MARC',
		year: '2022',
		kicker: 'Reasoning dataset',
		blurb: "The Markings Analysis & Reasoning Corpus: a visual reasoning dataset inspired by Chollet's ARC, made of strokes and drawings instead of grids.",
		href: '/marc',
		media: { kind: 'image', src: '/img/MARC-1.png', alt: 'MARC dataset sample' },
		medium: 'Dataset. Visual reasoning from strokes and drawings, after ARC.',
		credit: 'Collection of the artist.'
	},
	{
		id: 'cameo',
		section: 'videos',
		kind: 'Video',
		title: "4 Design Principles I'm Using to Build a $BN Company",
		year: 'May 23, 2024',
		kicker: 'From 7:32',
		blurb: "John's video. I appear at around the 7:32 mark.",
		href: 'https://www.youtube.com/watch?v=stjPRf0Iogg&t=452s',
		media: {
			kind: 'image',
			src: 'https://i.ytimg.com/vi/stjPRf0Iogg/hqdefault.jpg',
			alt: "Thumbnail of 4 Design Principles I'm Using to Build a $BN Company"
		},
		medium: 'Time-based media. Appearing from 7:32.',
		credit: 'Courtesy of John.'
	},
	{
		id: 'reel',
		section: 'videos',
		kind: 'Video',
		title: '3 Fun Mini Games, by Heewon Ahn',
		year: 'Jan 5, 2026',
		kicker: 'Reel',
		blurb: 'My personal game portfolio video.',
		href: 'https://www.youtube.com/watch?v=yHSWJty8QgI',
		media: {
			kind: 'image',
			src: 'https://i.ytimg.com/vi/yHSWJty8QgI/hqdefault.jpg',
			alt: 'Thumbnail of 3 Fun Mini Games, by Heewon Ahn'
		},
		medium: 'Time-based media.',
		credit: 'Gift of the artist.'
	},
	{
		id: 'future-ui',
		section: 'videos',
		kind: 'Video',
		title: 'The Future of UI in the AI Era (Inflection Fellowship 2026)',
		year: 'Jul 9, 2026',
		kicker: 'Inflection Fellowship',
		blurb: 'My video for the 2026 Inflection Fellowship.',
		href: 'https://www.youtube.com/watch?v=0kI-Q1683nI',
		media: {
			kind: 'image',
			src: 'https://i.ytimg.com/vi/0kI-Q1683nI/hqdefault.jpg',
			alt: 'Thumbnail for The Future of UI in the AI Era'
		},
		medium: 'Time-based media.',
		credit: 'Gift of the artist.'
	},
	{
		id: 'king-trailer',
		section: 'videos',
		kind: 'Video',
		title: 'King for All (AI Teaser Trailer)',
		year: 'Sep 2, 2026',
		kicker: 'AI teaser trailer',
		blurb: 'A teaser for King for All, my historical novel, made with AI.',
		href: 'https://www.youtube.com/watch?v=u4ABhgrZAq4',
		media: {
			kind: 'image',
			src: 'https://i.ytimg.com/vi/u4ABhgrZAq4/hqdefault.jpg',
			alt: 'Thumbnail for the King for All teaser trailer'
		},
		medium: 'Time-based media.',
		credit: 'Gift of the artist.'
	}
];

export const DIRECTIONS = [
	{
		slug: 'index',
		href: '/directions/index',
		numeral: 'I',
		name: 'Index',
		tagline: "Emil's restraint. Everything is a line of text until you ask for more.",
		hint: 'Hover the rows, then click one'
	},
	{
		slug: 'panels',
		href: '/directions/panels',
		numeral: 'II',
		name: 'Panels',
		tagline: 'The homepage is a manga page. Panel size sets importance, gutters set the rhythm.',
		hint: 'Hover a panel, click to zoom'
	},
	{
		slug: 'instrument',
		href: '/directions/instrument',
		numeral: 'III',
		name: 'Instrument',
		tagline: 'Navigation as a Teenage Engineering object, with plain reading text underneath.',
		hint: 'Keys 1 to 8, arrow keys, or turn the knob'
	},
	{
		slug: 'salon',
		href: '/directions/salon',
		numeral: 'IV',
		name: 'Salon',
		tagline: 'The work hung like a museum. One label format makes very different pieces read as one collection.',
		hint: 'Hover a work, or a room on the plan'
	},
	{
		slug: 'pond',
		href: '/directions/pond',
		numeral: 'V',
		name: 'Pond',
		tagline: 'The hero is a living <canvas>. Each koi carries a project.',
		hint: 'Hover a koi, click the water'
	},
	{
		slug: 'frames',
		href: '/',
		numeral: 'VI',
		name: 'Frames',
		tagline: 'Index and Panels on one page. Every row has its panel, and a few of the panels are alive.',
		hint: 'Hover a row or a panel'
	}
];

/** Whether a path is the hub or one of the directions. @param {string | undefined} path */
export function isDirection(path) {
	return path === '/directions' || DIRECTIONS.some((direction) => direction.href === path);
}

/**
 * The latest year a work touches; an open range ('2026–') is ongoing and an empty year sinks.
 * A full date ('Jul 9, 2026') counts its month too, so works from the same year still sort.
 * @param {string} year
 */
function recency(year) {
	if (/[–-]\s*$/.test(year)) return Infinity;
	const years = year.match(/\d{2,4}/g);
	if (!years) return -Infinity;
	const last = years[years.length - 1];
	const month = Math.max(0, MONTHS.findIndex((name) => name.startsWith(year.slice(0, 3))));
	return (last.length === 2 ? Number(years[0].slice(0, 2) + last) : Number(last)) + month / 12;
}

/**
 * Most recent first, keeping the authored order among equals.
 * @template {{ year: string }} T
 * @param {T[]} works
 */
export function newestFirst(works) {
	return works.toSorted((a, b) => recency(b.year) - recency(a.year));
}

/** @param {string} section */
export function worksIn(section) {
	return newestFirst(WORKS.filter((work) => work.section === section));
}

/** @param {string} id */
export function findWork(id) {
	return WORKS.find((work) => work.id === id);
}

/** Sections paired with their works, skipping empty ones. */
export const GROUPS = SECTIONS.map((section) => ({ ...section, works: worksIn(section.id) })).filter(
	(group) => group.works.length > 0
);

/**
 * What I build with, favorites first. `made` names works by id, or `self` for this site.
 * @type {{ id: string, title: string, kicker: string, favorite?: string, note: string, href: string, mark: { logo: string, tone: string, ink: string }, made: string[] }[]}
 */
export const STACK = [
	{
		id: 'svelte',
		title: 'Svelte',
		kicker: 'Framework',
		favorite: 'Favorite framework',
		note: 'Compiled, so the code I write is about the interface and not the framework. This site and Ovid are both Svelte.',
		href: 'https://svelte.dev',
		mark: { logo: '/logos/svelte.svg', tone: '#ff3e00', ink: '#ffffff' },
		made: ['self', 'ovid']
	},
	{
		id: 'canvas',
		title: '<canvas>',
		kicker: 'HTML element',
		favorite: 'Favorite element',
		note: 'A rectangle of pixels and a loop. Every one of my games is drawn on one, by hand.',
		href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas',
		mark: { logo: '/logos/canvas.svg', tone: '#1c1b18', ink: '#f4f1ec' },
		made: ['platformr', 'rooms']
	},
	{
		id: 'vue',
		title: 'Vue',
		kicker: 'Framework',
		note: 'Single-file components, close to Svelte in spirit.',
		href: 'https://vuejs.org',
		mark: { logo: '/logos/vuedotjs.svg', tone: '#ffffff', ink: '#42b883' },
		made: []
	},
	{
		id: 'react',
		title: 'React',
		kicker: 'Library',
		note: 'The lingua franca, and what most of the tools I build on are written in.',
		href: 'https://react.dev',
		mark: { logo: '/logos/react.svg', tone: '#20232a', ink: '#61dafb' },
		made: []
	}
];

/**
 * School before Cornell, oldest first: the grade I started each one in, and my first and last
 * months there as [year, month]. Grades go up a year after each start, so Korea, on the Korean
 * school year, moves up in March.
 * @type {{ id: string, title: string, grade: number, from: [number, number], until: [number, number] }[]}
 */
export const SCHOOLS = [
	{ id: 'belle-sherman', title: 'Belle Sherman', grade: 1, from: [2009, 9], until: [2011, 6] },
	{ id: 'horseheads', title: 'Horseheads', grade: 3, from: [2011, 9], until: [2016, 6] },
	{ id: 'korea', title: 'Korea', grade: 8, from: [2017, 3], until: [2018, 7] },
	{ id: 'ithaca-high', title: 'Ithaca High School', grade: 10, from: [2018, 9], until: [2021, 6] }
];

/** Where I've been, oldest first. @type {Job[]} */
export const LIFE = [
	{
		id: 'wolf',
		section: 'life',
		kind: 'Brand',
		title: 'Wolf Financial',
		year: '2020–21',
		kicker: 'Branding',
		blurb: 'Branding for a finance newsletter.',
		href: 'https://wolf.financial',
		media: { kind: 'image', src: '/card/card-wolf.png', alt: 'Wolf Financial branding' },
		medium: 'Brand identity for a finance newsletter and podcast.',
		credit: 'Commissioned by Wolf Financial.',
		from: 2020,
		until: 2021
	},
	{
		id: 'cornell',
		section: 'life',
		kind: 'School',
		title: 'Cornell',
		year: '2021–22',
		kicker: 'Dropped out',
		blurb: 'Studied, and worked on ARC with Prof. Kevin Ellis.',
		href: 'https://www.cornell.edu',
		media: null,
		medium: 'University.',
		credit: 'Cornell University.',
		from: 2021,
		until: 2022
	},
	{
		id: 'stan',
		section: 'life',
		kind: 'Company',
		title: 'Stan',
		year: '2022–25',
		kicker: 'Founding designer',
		blurb: 'Founding designer, $0 to $30M ARR.',
		href: 'https://stan.store',
		media: { kind: 'image', src: '/stan/stan-hero-1.png', alt: 'A Stan storefront', fit: 'contain' },
		medium: 'Founding product designer.',
		credit: 'With John & Vitalii.',
		from: 2022,
		until: 2025
	},
	{
		id: 'gapyear',
		section: 'life',
		kind: 'Break',
		title: 'Gap year',
		year: '2025–26',
		kicker: 'Time off',
		blurb: 'A year away, written up in My Gap Year.',
		href: '/gapyear',
		media: null,
		medium: 'Essay.',
		credit: 'Read in the drawer.',
		from: 2025,
		until: 2026
	},
	{
		id: 'ovid',
		section: 'life',
		kind: 'Product',
		title: 'Ovid',
		year: '2026–',
		kicker: 'Visual LLM workflows',
		blurb: 'Building visual LLM workflows.',
		href: 'https://ovid.computer',
		media: { kind: 'graph', alt: 'A node graph of models and images' },
		medium: 'Software.',
		credit: 'Collection of the artist.',
		from: 2026,
		until: null
	}
];

/**
 * A recommendation, printed onto whatever object its shelf holds.
 * `note` is the explainer shown when the object is taken off the shelf. `cover` is the real art,
 * printed over the drawn design. A book's `size` is its trim in centimeters, width by height,
 * and `pages` sets how thick it is.
 * @typedef {{ title: string, by?: string, year?: string, tone: string, ink: string, lang?: string, depth?: string, youtube?: string, wiki?: string, href?: string, query?: string, note?: string, cover?: string, pages?: number, size?: [number, number] }} ShelfItem
 * @typedef {'book' | 'dvd' | 'cd' | 'vinyl' | 'vhs' | 'cassette' | 'magazine'} ShelfFormat
 * @typedef {{ id: string, label: string, format: ShelfFormat, items: ShelfItem[] }} Shelf
 */

/** Things I keep coming back to, each shelf holding the object its medium came on. @type {Shelf[]} */
export const SHELVES = [
	{
		id: 'movies',
		label: 'Movies',
		format: 'dvd',
		items: [
			{
				title: 'The Count of Monte Cristo',
				by: 'Matthieu Delaporte & Alexandre de La Patellière',
				year: '2024',
				tone: '#1f2a44',
				ink: '#e8d5a3',
				cover: '/covers/monte-cristo-2024.jpg',
				wiki: 'The_Count_of_Monte_Cristo_(2024_film)',
				note: 'Pierre Niney as Edmond Dantès in the most handsome adaptation in decades: three hours that feel like one, and every revenge served cold.'
			},
			{
				title: 'Vice',
				by: 'Adam McKay',
				year: '2018',
				tone: '#f1eee6',
				ink: '#b3121d',
				cover: '/covers/vice.jpg',
				wiki: 'Vice_(2018_film)',
				note: 'Christian Bale as Dick Cheney, and Adam McKay’s furious, funny account of how a quiet bureaucrat became the most powerful vice president in American history.'
			}
		]
	},
	{
		id: 'nonfiction',
		label: 'Nonfiction',
		format: 'book',
		items: [
			{
				title: 'Designing Interactions',
				by: 'Bill Moggridge',
				year: '2006',
				tone: '#f2f1ee',
				ink: '#1c1b18',
				pages: 766,
				size: [20.3, 25.4],
				cover: '/covers/designing-interactions.jpg',
				href: 'https://www.amazon.com/dp/0262134748',
				note: 'Moggridge, who designed the first laptop and co-founded IDEO, interviewed the people behind the mouse, the desktop, the Palm, Google and The Sims. Seven hundred pages of how interaction design actually happened, told by the ones who did it.'
			},
			{
				title: 'Pygmalion',
				by: 'David Canfield Smith',
				year: '1977',
				tone: '#f2df4a',
				ink: '#1c1b18',
				pages: 190,
				size: [15.5, 23.5],
				cover: '/covers/pygmalion.jpg',
				href: 'https://www.amazon.com/dp/3764309288',
				note: 'Smith’s Stanford thesis on programming by moving pictures around instead of typing text, published by Birkhäuser as A Computer Program to Model and Stimulate Creative Thought. It’s where the word “icon” entered computing, and the starting point of my essay A Visual Interface for Thought.'
			},
			{
				title: 'The Dream Machine',
				by: 'M. Mitchell Waldrop',
				year: '2001',
				tone: '#4a4a55',
				ink: '#8de3d4',
				pages: 528,
				size: [15.2, 22.9],
				cover: '/covers/dream-machine.jpg',
				href: 'https://press.stripe.com/the-dream-machine',
				note: 'The story of J. C. R. Licklider, who imagined personal, networked computing decades early and then funded the people who built it. Stripe Press’s reissue is the edition to own.'
			},
			{
				title: 'Je pense trop',
				by: 'Christel Petitcollin',
				year: '2010',
				tone: '#f7f4ef',
				ink: '#e0197d',
				lang: 'fr',
				pages: 264,
				size: [15.2, 22.8],
				cover: '/covers/je-pense-trop.jpg',
				wiki: 'Je_pense_trop',
				note: 'Christel Petitcollin on people whose minds won’t stop branching: the sensitivity, the tangents, and how to live with a head that is always on.'
			},
			{
				title: 'The Power of Now',
				by: 'Eckhart Tolle',
				year: '1997',
				tone: '#8cc49a',
				ink: '#1e3b2c',
				pages: 236,
				size: [13.3, 20.3],
				cover: '/covers/power-of-now.jpg',
				wiki: 'The_Power_of_Now',
				note: 'Eckhart Tolle’s case for living in the present instead of in the running commentary about the past and the future.'
			}
		]
	},
	{
		id: 'fiction',
		label: 'Fiction',
		format: 'book',
		items: [
			{
				title: 'The Count of Monte Cristo',
				by: 'Alexandre Dumas',
				year: '1844',
				tone: '#141414',
				ink: '#e8673a',
				pages: 1276,
				size: [12.9, 19.8],
				cover: '/covers/monte-cristo-book.jpg',
				wiki: 'The_Count_of_Monte_Cristo',
				note: 'Dumas’s great revenge story: a sailor framed on his wedding day, fourteen years in the Château d’If, and a fortune spent settling every account.'
			}
		]
	},
	{
		id: 'manga',
		label: 'Comics',
		format: 'book',
		items: [
			{
				title: 'One Piece',
				by: 'Eiichiro Oda',
				year: '1997',
				tone: '#f4f1e8',
				ink: '#d0202a',
				pages: 216,
				size: [11.4, 17.5],
				cover: '/covers/one-piece.jpg',
				wiki: 'One_Piece',
				note: 'Luffy and the Straw Hats, a thousand chapters and counting: the longest adventure in manga, and somehow still the most sincere.'
			},
			{
				title: 'Dragon Ball',
				by: 'Akira Toriyama',
				year: '1984',
				tone: '#f5a623',
				ink: '#1a3f8f',
				pages: 192,
				size: [11.4, 17.5],
				cover: '/covers/dragon-ball.jpg',
				wiki: 'Dragon_Ball_(manga)',
				note: 'Toriyama’s Journey to the West turned martial-arts epic. Every action manga since has borrowed its clarity of line and motion.'
			},
			{
				title: 'Naruto',
				by: 'Masashi Kishimoto',
				year: '1999',
				tone: '#f08a24',
				ink: '#1c1b18',
				pages: 192,
				size: [11.4, 17.5],
				cover: '/covers/naruto.jpg',
				wiki: 'Naruto',
				note: 'An outcast ninja who wants to be acknowledged, and the story of rivalry and loneliness that grew out of it.'
			},
			{
				title: 'Pretty Face',
				by: 'Yasuhiro Kanō',
				year: '2002',
				tone: '#f5d7e3',
				ink: '#c2185b',
				pages: 200,
				size: [11.4, 17.5],
				cover: '/covers/pretty-face.jpg',
				wiki: 'Pretty_Face',
				note: 'A delinquent wakes from a car crash with his face rebuilt as the girl he has a crush on. Six volumes of the best kind of ridiculous.'
			},
			{
				title: 'Asterix the Gaul',
				by: 'René Goscinny & Albert Uderzo',
				year: '1961',
				tone: '#f7d23e',
				ink: '#1f4fa3',
				pages: 48,
				size: [21.8, 28.7],
				cover: '/covers/asterix.jpg',
				wiki: 'Asterix_the_Gaul',
				note: 'One small village of indomitable Gauls still holding out against Caesar, on a magic potion and a great deal of wild boar. The puns survive every translation.'
			}
		]
	},
	{
		id: 'blogs',
		label: 'Blogs',
		format: 'magazine',
		items: [{ title: 'Amelia Wattenberger', tone: '#e6e0ff', ink: '#4527c9', href: 'https://wattenberger.com' }]
	},
	{
		id: 'youtube',
		label: 'YouTube',
		format: 'vhs',
		items: [{ title: 'Kraut', tone: '#161513', ink: '#efe5cf', query: 'Kraut history', href: 'https://www.youtube.com/@Kraut' }]
	},
	{
		id: 'podcasts',
		label: 'Podcasts',
		format: 'cassette',
		items: [
			{
				title: 'The Rest Is History',
				by: 'Tom Holland & Dominic Sandbrook',
				tone: '#c4122f',
				ink: '#fff6ea',
				cover: '/covers/rest-is-history.jpg',
				wiki: 'The_Rest_Is_History_(podcast)',
				note: 'Two historians who clearly love each other’s company, wandering from the Romans to the Beatles and back.'
			},
			{
				title: 'Founders',
				by: 'David Senra',
				tone: '#141414',
				ink: '#f2f2f2',
				cover: '/covers/founders.jpg',
				wiki: 'Founders_(podcast)',
				note: 'One biography of an entrepreneur per episode, read closely and argued with, from Rockefeller to Jobs.'
			},
			{
				title: 'Making Sense',
				by: 'Sam Harris',
				tone: '#dbe5ea',
				ink: '#1a2a35',
				cover: '/covers/making-sense.jpg',
				wiki: 'Making_Sense_with_Sam_Harris',
				note: 'Long conversations about the mind, ethics, and the news, slower and more careful than almost anything else on the air.'
			}
		]
	},
	{
		id: 'songs-christian',
		label: 'Songs · Christian',
		format: 'cd',
		items: [
			{ title: 'Is That You', by: 'Ary Shu', tone: '#f4e3c9', ink: '#a2461f', youtube: '4P06aMzPrDA' },
			{ title: 'Better Than I', by: 'Joseph: King of Dreams', tone: '#25324d', ink: '#f2c96b', cover: '/covers/better-than-i.jpg', youtube: '3jJJcacnGVI' },
			{ title: 'All in All', tone: '#e9eef0', ink: '#3a5a6a', youtube: 'lie1L61Qnos' }
		]
	},
	{
		id: 'songs-en',
		label: 'Songs · English',
		format: 'cd',
		items: [
			{ title: 'Yellow Brick Road', by: 'Elton John', tone: '#f3c623', ink: '#3b2a12', cover: '/covers/yellow-brick-road.jpg', youtube: 'wy709iNG6i8' },
			{ title: 'Never See Me Again', tone: '#101010', ink: '#e8e2d4', youtube: 'ePqZ9BPNsv8' },
			{ title: 'All Caps', by: 'MF DOOM', tone: '#b8261d', ink: '#f6e7c8', cover: '/covers/all-caps.jpg', youtube: 'gSJeHDlhYls' },
			{ title: 'Feel It Still', by: 'Portugal. The Man', tone: '#ff8fa3', ink: '#1d1b3a', cover: '/covers/feel-it-still.jpg', youtube: 'pBkHHoOIIn8' }
		]
	},
	{
		id: 'songs-international',
		label: 'Songs · International',
		format: 'cd',
		items: [
			{ title: '꽃이 피고 지듯이', by: 'Lee Yoon Jung', tone: '#f6d6dc', ink: '#8c2f4a', lang: 'ko', youtube: '-1JCohwW0EA' },
			{ title: '월량대표아적심', by: 'Teresa Teng', tone: '#1c2541', ink: '#f5e6a8', lang: 'ko', cover: '/covers/moon.jpg', youtube: 'IiFm7AWP9n4' },
			{ title: '비상', by: '임재범', tone: '#6fa3c7', ink: '#0f2236', lang: 'ko', cover: '/covers/bisang.jpg', youtube: 'b1p0jQbpVi4' },
			{ title: '잔소리', by: 'IU', tone: '#fbe9a6', ink: '#3d5a2a', lang: 'ko', cover: '/covers/jansori.jpg', youtube: 'yOqGYGNq9fw' },
			{ title: '고백', by: '멜로망스', tone: '#2f2a4a', ink: '#f3d5c0', lang: 'ko', cover: '/covers/gobaek.jpg', youtube: 'UhY0x9jN_uE' }
		]
	},
	{
		id: 'music',
		label: 'Music',
		format: 'vinyl',
		items: [
			{ title: 'Into the New World', by: 'Dvořák', tone: '#0f3b57', ink: '#f1d9a0', cover: '/covers/new-world.jpg', youtube: '89jOPAGJq-M', wiki: 'Symphony_No._9_(Dvořák)' },
			{ title: 'In the Hall of the Mountain King', by: 'Grieg', tone: '#3c2a1e', ink: '#e7c27a', cover: '/covers/mountain-king.jpg', youtube: 'OqvHWUZZdP0' },
			{ title: 'Going the Distance', by: 'Bill Conti', tone: '#d8392b', ink: '#fbf1dc', cover: '/covers/going-the-distance.jpg', youtube: 'GvQkl7qa6RQ' }
		]
	}
];

/** The works that swim in the koi ponds. Featured ones are vermilion. */
export const KOI = /** @type {Work[]} */ (
	['ovid', 'king', 'stan', 'platformr', 'pandemonium', 'arcaide', 'palace', 'rooms', 'timeline', 'marc']
		.map((id) => findWork(id))
		.filter(Boolean)
);
