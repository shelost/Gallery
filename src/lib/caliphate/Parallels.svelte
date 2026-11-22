<script>
	import {
		ACHAEMENID_MARKS,
		ARAB_WORLD_MARKS,
		ARABIA_632_MARKS,
		ARABIA_ALONE_MARKS,
		ARABIA_BEFORE_MARKS,
		CHINA_PROPER_MARKS,
		CLIENTS,
		COLONIES_MARKS,
		ETRURIA_MARKS,
		EUROPE_MARKS,
		JAPAN_1930_MARKS,
		JAPAN_1942_MARKS,
		KOREA_ALONE_MARKS,
		KOREA_BEFORE_MARKS,
		KOREA_UNITED_MARKS,
		KOREANIC_WORLD_MARKS,
		LATIUM_MARKS,
		NONE,
		PLATEAU_MARKS,
		QING_MARKS,
		ROMAN_SEA_MARKS
	} from './empire.js';
	import { antique, modern } from './sheets.js';
	import { lower48 } from './coasts.js';
	import FitImages from './FitImages.svelte';
	import Inset from './Inset.svelte';

	const lower48Marks = [{ rings: lower48, color: 'romeEast', outline: true }];

	/** Where each change spreads from, as lon/lat. */
	const AT = {
		rome: [12.5, 41.9],
		etruria: [11.3, 43.0],
		jamestown: [-76.8, 37.2],
		washington: [-77.0, 38.9],
		pasargadae: [53.2, 30.2],
		istakhr: [52.9, 29.9],
		mukden: [123.4, 41.8],
		beijing: [116.4, 39.9],
		pella: [22.5, 40.8],
		tokyo: [139.7, 35.7],
		medina: [39.6, 24.5],
		constantinople: [28.98, 41.01],
		pyongyang: [125.75, 39.03],
		paektu: [128.07, 42.0]
	};

	/** The frames several maps share, before they are squared. */
	const ITALY = { lon0: 6.4, lon1: 19.8, lat0: 35.2, lat1: 47.2 };
	const IRAN = { lon0: 24, lon1: 66, lat0: 16, lat1: 44 };
	const CHINA = { lon0: 73, lon1: 145, lat0: 17, lat1: 54 };
	const EAST_ASIA = { lon0: 88, lon1: 158, lat0: -12, lat1: 55 };

	const EYES = ['romeEast', 'persia'];

	const groups = [
		{
			id: 'two-eyes',
			kicker: 'Two superpowers',
			line: 'Each thought the world had room for exactly two.',
			pairs: [
				{
					left: {
						title: 'Rome and Persia',
						when: 'c. 600',
						quote: 'God effected that the whole world should be illumined from the very beginning by two eyes.',
						by: 'Khosrow II, in Theophylact Simocatta 4.11',
						body: 'A sea empire and a land empire. They fought over the same borderlands for seven centuries. Neither could finish the other.',
						map: { world: antique, period: 2, focus: EYES }
					},
					right: {
						title: 'America and China',
						when: 'today',
						quote: 'The Pacific Ocean… will become the chief theatre of events in the world’s great hereafter.',
						by: 'William H. Seward, 1852',
						body: 'A sea empire and a land empire again. The Pacific is squeezed here so both fit.',
						map: { world: modern, period: 0, focus: EYES }
					}
				}
			]
		},
		{
			id: 'seed',
			kicker: 'The seed',
			line: 'Both started as a strip of coast.',
			pairs: [
				{
					left: {
						title: 'Early Rome',
						when: 'c. 500 BC',
						quote: 'From slender beginnings it has so grown that it is now overburdened by its own greatness.',
						by: 'Livy, preface',
						body: 'A few hills by the Tiber, one Latin town among many. Not yet an empire.',
						map: {
							world: antique,
							star: false,
							marks: LATIUM_MARKS,
							fromMarks: NONE,
							spread: AT.rome,
							focus: ['romeEast'],
							frame: ITALY
						}
					},
					right: {
						title: 'The thirteen colonies',
						when: '1607–1776',
						quote: 'Thirteen clocks were made to strike together.',
						by: 'John Adams, 1818',
						body: 'A string of colonies on the Atlantic, squabbling with each other and with London.',
						map: {
							world: modern,
							star: false,
							hide: ['USA'],
							marks: COLONIES_MARKS,
							fromMarks: NONE,
							spread: AT.jamestown,
							focus: ['romeEast'],
							frame: { lon0: -100, lon1: -56, lat0: 23, lat1: 52 }
						}
					}
				}
			]
		},
		{
			id: 'reach',
			kicker: 'The reach',
			line: 'Then they grew. Rome by sea, America by land.',
			pairs: [
				{
					left: {
						title: 'Rome takes the sea',
						when: '264–30 BC',
						quote: 'They took in hand for the first time to build ships.',
						by: 'Polybius 1.20',
						body: 'Sicily, Africa, Greece, then Egypt. The Mediterranean becomes a Roman lake.',
						map: {
							world: antique,
							star: false,
							marks: ROMAN_SEA_MARKS,
							fromMarks: LATIUM_MARKS,
							spread: AT.rome,
							focus: ['romeEast', 'romeWest'],
							frame: { lon0: 5, lon1: 42, lat0: 18, lat1: 47 }
						}
					},
					right: {
						title: 'America takes the continent',
						when: '1783–1898',
						quote: 'Our manifest destiny to overspread the continent allotted by Providence.',
						by: 'John L. O’Sullivan, 1845',
						body: 'America walks west until it hits the Pacific. Only then does it turn to the sea.',
						map: {
							world: modern,
							star: false,
							hide: ['USA'],
							marks: lower48Marks,
							fromMarks: COLONIES_MARKS,
							spread: AT.washington,
							focus: ['romeEast'],
							frame: { lon0: -126, lon1: -66, lat0: 24, lat1: 50 }
						}
					}
				}
			]
		},
		{
			id: 'claim',
			kicker: 'The claim',
			line: 'Both call themselves a republic of many peoples.',
			pairs: [
				{
					left: {
						title: 'The Roman Republic',
						when: '509 BC – AD 212',
						quote: 'I transferred the republic from my power to the dominion of the senate and people of Rome.',
						by: 'Augustus, Res Gestae 34',
						body: 'Augustus said he restored the republic while ruling it alone. In 212, every free man in the empire became a citizen.',
						map: {
							world: antique,
							star: false,
							marks: ROMAN_SEA_MARKS,
							focus: ['romeEast', 'romeWest'],
							frame: { lon0: 5, lon1: 38, lat0: 22, lat1: 47 }
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/augustus.jpg',
								alt: 'Augustus of Prima Porta',
								title: 'Augustus of Prima Porta.'
							}
						]
					},
					right: {
						title: 'The American republic',
						when: '1776 –',
						quote: 'Government of the people, by the people, for the people.',
						by: 'Abraham Lincoln, 1863',
						body: 'Citizenship by oath, not by blood, as in Rome. Washington is painted rising into the sky like an emperor.',
						map: { world: modern, period: 0, focus: ['romeEast'] },
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/apotheosis.jpg',
								alt: 'The Apotheosis of Washington in the Capitol rotunda',
								title: 'The Apotheosis of Washington, Capitol dome, 1865.'
							}
						]
					}
				},
				{
					sub: 'The house',
					line: 'A dome over a civic religion.',
					left: {
						title: 'The Pantheon',
						when: 'Rome, c. 125',
						quote: 'Because of its vaulted roof, it resembles the heavens.',
						by: 'Cassius Dio 53.27',
						body: 'A temple front and a dome. The Roman state, in stone.',
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/pantheon.jpg',
								alt: 'The Pantheon in Rome, exterior',
								title: 'The Pantheon, Rome.'
							}
						]
					},
					right: {
						title: 'The Capitol',
						when: 'Washington, 1800',
						quote: '…presenting to them models for their study and imitation.',
						by: 'Thomas Jefferson, 1785',
						body: 'Columns, a pediment, a dome. A Roman temple for a new senate.',
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/capitol.jpg',
								alt: 'The west front of the United States Capitol',
								title: 'The United States Capitol, west front.'
							}
						]
					}
				}
			]
		},
		{
			id: 'parent',
			kicker: 'The parent',
			line: 'The older neighbors each one learned from.',
			pairs: [
				{
					left: {
						title: 'The Etruscans',
						when: 'before Rome',
						quote: 'The Etruscan name filled the whole length of Italy, from the Alps to the Strait of Sicily.',
						by: 'Livy 5.33',
						body: 'A league of rival city-states north of Rome. They gave Rome its alphabet, many of its gods, and its symbols of office.',
						map: {
							world: antique,
							star: false,
							marks: ETRURIA_MARKS,
							fromMarks: NONE,
							spread: AT.etruria,
							focus: ['romeWest'],
							frame: ITALY
						}
					},
					right: {
						title: 'Europe',
						when: 'before America',
						quote: 'What then is the American, this new man? He is either an European, or the descendant of an European.',
						by: 'J. Hector St. John de Crèvecœur, 1782',
						body: 'Older, split into rival states, and the source of America’s language, law, and faith.',
						map: {
							world: antique,
							star: false,
							borders: true,
							marks: EUROPE_MARKS,
							fromMarks: NONE,
							spread: AT.rome,
							focus: ['romeWest'],
							frame: { lon0: -12, lon1: 34, lat0: 34, lat1: 64 }
						}
					}
				}
			]
		},
		{
			id: 'width',
			kicker: 'The widest empire',
			line: 'First a giant empire. Then it broke.',
			pairs: [
				{
					left: {
						title: 'The Persian Empire',
						when: '550–330 BC',
						quote: 'This is the kingdom which I hold, from the Sacae who are beyond Sogdiana, thence unto Ethiopia; from Sind, thence unto Sardis.',
						by: 'Darius I, Persepolis',
						body: 'Persia’s first empire, from Egypt to India. Alexander ends it.',
						map: {
							world: antique,
							star: false,
							marks: ACHAEMENID_MARKS,
							fromMarks: NONE,
							spread: AT.pasargadae,
							focus: ['persia'],
							frame: IRAN
						},
						images: [
							{
								src: '/blog/caliphate/persepolis.jpg',
								alt: 'The Gate of All Nations at Persepolis',
								title: 'Persepolis. Alexander burned it in 330 BC.'
							}
						]
					},
					right: {
						title: 'The Qing',
						when: '1644–1912',
						quote: 'Our Celestial Empire possesses all things in prolific abundance.',
						by: 'The Qianlong Emperor to George III, 1793',
						body: 'China’s last dynasty, at its widest: Tibet, Mongolia, Xinjiang, Taiwan. It breaks under foreign pressure.',
						map: {
							world: modern,
							star: false,
							marks: QING_MARKS,
							fromMarks: NONE,
							spread: AT.mukden,
							focus: ['persia'],
							frame: CHINA
						},
						images: [
							{
								src: '/blog/caliphate/temple-heaven.jpg',
								alt: 'The Temple of Heaven in Beijing',
								title: 'The Temple of Heaven, Beijing.'
							}
						]
					}
				},
				{
					sub: 'The core',
					line: 'Strip the empire away and the country is still there.',
					left: {
						title: 'Iran proper',
						when: 'the plateau',
						quote: 'I am a Persian, son of a Persian, an Aryan of Aryan stock.',
						by: 'Darius I, Naqsh-e Rostam',
						body: 'The plateau. Every Persian empire grew out of it and shrank back to it.',
						map: {
							world: antique,
							star: false,
							marks: PLATEAU_MARKS,
							fromMarks: ACHAEMENID_MARKS,
							focus: ['persia'],
							frame: IRAN
						}
					},
					right: {
						title: 'China proper',
						when: 'the old provinces',
						quote: 'He built the Long Wall… from Lintao to Liaodong, more than ten thousand li.',
						by: 'Sima Qian, Records of the Grand Historian',
						body: 'The old provinces inside the Great Wall. Manchuria, Mongolia, and Tibet are the rim.',
						map: {
							world: modern,
							star: false,
							marks: CHINA_PROPER_MARKS,
							fromMarks: QING_MARKS,
							focus: ['persia'],
							frame: CHINA
						}
					}
				}
			]
		},
		{
			id: 'comeback',
			kicker: 'The comeback',
			line: 'Beaten by a smaller neighbor, the old country rises again.',
			pairs: [
				{
					left: {
						title: 'The Sasanians',
						when: '224–651',
						quote: 'I, the Mazda-worshipping lord Shapur, king of kings of Iran and non-Iran.',
						by: 'Shapur I, Naqsh-e Rostam',
						body: 'Five centuries after Alexander, a Persian dynasty rebuilds the empire and fights Rome as an equal.',
						map: {
							world: antique,
							star: false,
							period: 2,
							from: 0,
							spread: AT.istakhr,
							focus: ['persia'],
							frame: { lon0: 20, lon1: 64, lat0: 16, lat1: 46 }
						},
						images: [
							{
								src: '/blog/caliphate/taq-kasra.jpg',
								alt: 'The Arch of Ctesiphon, Taq Kasra',
								title: 'Taq Kasra, the Sasanian palace at Ctesiphon.'
							}
						]
					},
					right: {
						title: 'The People’s Republic',
						when: '1949 –',
						quote: 'Ours will no longer be a nation subject to insult and humiliation. We have stood up.',
						by: 'Mao Zedong, 1949',
						body: 'After Japan’s invasion, China rebuilds as one state and faces America as an equal.',
						map: {
							world: modern,
							star: false,
							period: 0,
							fromMarks: JAPAN_1942_MARKS,
							spread: AT.beijing,
							focus: ['persia'],
							frame: { lon0: 73, lon1: 145, lat0: 10, lat1: 54 }
						},
						images: [
							{
								src: '/blog/caliphate/forbidden-city.jpg',
								alt: 'The Forbidden City from Jingshan',
								title: 'The Forbidden City, Beijing.'
							}
						]
					}
				}
			]
		},
		{
			id: 'macedon',
			kicker: 'The conqueror next door',
			line: 'A small, warlike neighbor beats the old giant, once.',
			pairs: [
				{
					left: {
						title: 'Macedon',
						when: '334–323 BC',
						quote: 'Is it not worthy of tears that, when the number of worlds is infinite, I have not yet become lord of one?',
						by: 'Alexander, in Plutarch',
						body: 'Macedon, on Greece’s northern edge, conquers all of Persia in ten years. The empire splits when Alexander dies.',
						map: {
							world: antique,
							star: false,
							period: 0,
							fromMarks: ACHAEMENID_MARKS,
							spread: AT.pella,
							focus: ['greece'],
							frame: { lon0: 12, lon1: 66, lat0: 14, lat1: 46 }
						}
					},
					right: {
						title: 'Imperial Japan',
						when: '1931–1945',
						quote: 'The eight corners of the world under one roof.',
						by: 'Hakkō ichiu, the empire’s slogan',
						body: 'Japan, off China’s coast, takes Manchuria, the coast, and Southeast Asia. It collapses in 1945.',
						map: {
							world: modern,
							star: false,
							marks: JAPAN_1942_MARKS,
							fromMarks: JAPAN_1930_MARKS,
							spread: AT.tokyo,
							focus: ['greece'],
							frame: EAST_ASIA
						}
					}
				}
			]
		},
		{
			id: 'captive-culture',
			kicker: 'The captive culture',
			line: 'The loser’s art conquers the winner.',
			pairs: [
				{
					sub: 'The early form',
					line: 'Before the classic style: gold masks, and borrowed oil paint.',
					left: {
						title: 'Mycenaean Greece',
						when: 'c. 1550 BC',
						quote: 'I have found the tombs which the tradition of the whole civilized world has attributed to Agamemnon, Cassandra, and their companions.',
						by: 'Heinrich Schliemann, 1876',
						body: 'The Greek look had a childhood. This gold mask is it.',
						map: {
							world: antique,
							star: false,
							period: 0,
							focus: ['greece'],
							frame: { lon0: 19, lon1: 29, lat0: 34.5, lat1: 42 }
						},
						ratio: '1 / 1',
						images: [
							{
								src: '/blog/caliphate/agamemnon.jpg',
								alt: 'The Mask of Agamemnon from Mycenae',
								title: 'The Mask of Agamemnon, Mycenae. National Archaeological Museum, Athens.'
							}
						]
					},
					right: {
						title: 'Meiji Japan',
						when: '1868–1912',
						quote: 'We should leave the ranks of Asian nations and cast our lot with the civilized nations of the West.',
						by: 'Fukuzawa Yukichi, 1885',
						body: 'Japanese painters learned Western oil paint, then made it their own. The training before anime.',
						map: {
							world: modern,
							star: false,
							period: 0,
							focus: ['greece'],
							frame: { lon0: 128, lon1: 147, lat0: 30, lat1: 46 }
						},
						ratio: '1 / 1',
						images: [
							{
								src: '/blog/caliphate/lakeside.jpg',
								alt: 'Lakeside by Kuroda Seiki',
								title: 'Kuroda Seiki, Lakeside, 1897.'
							}
						]
					}
				},
				{
					sub: 'The classic style',
					line: 'The look the winners copied for centuries.',
					left: {
						title: 'Greek gods in Roman villas',
						when: 'after 146 BC',
						quote: 'Captive Greece took her savage conqueror captive.',
						by: 'Horace, Epistles 2.1',
						body: 'Rich Romans filled their villas with Greek gods. Greek style became how a hero looked.',
						ratio: '3 / 2',
						images: [
							{
								src: '/blog/caliphate/olympians.jpg',
								alt: 'Eight statues of the Olympian gods, shown together',
								title: 'Eight Olympians in bronze and marble. Photographs by sailko (CC BY 2.5), Nikos Kitsakis (CC BY 4.0), Commonists (CC BY-SA 4.0), Marie-Lan Nguyen (CC BY 2.5), and Roccuz (CC BY-SA 2.5); three are public domain.'
							}
						]
					},
					right: {
						title: 'Anime in the White House',
						when: 'after 1945',
						quote: 'Japan has been reinventing its influence as a cultural power.',
						by: 'Douglas McGray, 2002',
						body: 'Japan lost the war, but its style won. Even the White House posts in it.',
						ratio: '3 / 2',
						images: [
							{
								src: '/blog/caliphate/anime-ensemble.jpg',
								alt: 'An original lineup of anime-style characters standing together',
								title: 'Original characters in the anime manner.'
							}
						],
						links: [
							{
								href: 'https://x.com/elonmusk/status/1054520588734058496',
								label: 'The drawing, 2018'
							},
							{
								href: 'https://www.theverge.com/tech/638603/studio-ghibli-chatgpt-ai-filter-white-house-meme',
								label: 'The White House post'
							}
						]
					}
				}
			]
		},
		{
			id: 'hired-cousins',
			kicker: 'The hired cousins',
			line: 'One people, split between two patrons.',
			pairs: [
				{
					left: {
						title: 'Ghassanids and Lakhmids',
						when: '500s',
						quote: '…and bestowed upon him the dignity of king, a thing which among the Romans had never before been done.',
						by: 'Procopius 1.17',
						body: 'Arab kingdoms paid by Rome and by Persia to guard the desert. Both patrons later scrapped them.',
						map: {
							world: antique,
							period: 2,
							focus: CLIENTS.antique,
							frame: { lon0: 32, lon1: 56, lat0: 12, lat1: 37 }
						}
					},
					right: {
						title: 'South and North Korea',
						when: '1953 –',
						quote: 'When whales fight, the shrimp’s back is broken.',
						by: 'Korean proverb',
						body: 'One people, two client states. The patrons resent them and cannot drop them.',
						map: {
							world: modern,
							period: 0,
							focus: CLIENTS.modern,
							frame: { lon0: 124, lon1: 131, lat0: 33, lat1: 43.5 }
						}
					}
				}
			]
		},
		{
			id: 'holy-place',
			kicker: 'The holy place',
			line: 'A sacred site both empires already fought over.',
			pairs: [
				{
					left: {
						title: 'Jerusalem',
						when: '614, 630, 637',
						quote: 'They captured Jerusalem and carried off the Lord’s Cross.',
						by: 'Sebeos, on 614',
						body: 'Roman, then Persian, then Roman again. The new power took it from both.',
						map: {
							world: antique,
							period: 2,
							focus: ['romeEast'],
							frame: { lon0: 33.6, lon1: 37.2, lat0: 30.6, lat1: 33.8 }
						}
					},
					right: {
						title: 'Mount Paektu',
						when: 'the shared mountain',
						quote: 'Hwanung descended to the summit of Taebaek, and under a sandalwood tree he established a sacred city.',
						by: 'Iryeon, Samguk Yusa',
						body: 'Sacred to Koreans and to the Manchus. The border still splits its crater lake.',
						map: {
							world: modern,
							period: 7,
							focus: ['caliphate'],
							frame: { lon0: 126.2, lon1: 131, lat0: 40.2, lat1: 43.6 }
						}
					}
				}
			]
		},
		{
			id: 'union',
			kicker: 'The union',
			line: 'Before the spread, one country.',
			pairs: [
				{
					left: {
						title: 'Arabia united',
						when: '632',
						quote: 'The Arabs will recognize authority only in this clan of Quraysh.',
						by: 'Abu Bakr, in al-Tabari',
						body: 'For the first time the whole peninsula answers to one city, Medina. Rome and Persia are exhausted from war.',
						map: {
							world: antique,
							star: false,
							marks: ARABIA_632_MARKS,
							fromMarks: ARABIA_BEFORE_MARKS,
							spread: AT.medina,
							focus: ['caliphate'],
							frame: { lon0: 30, lon1: 62, lat0: 10, lat1: 38 }
						}
					},
					right: {
						title: 'Korea united',
						when: 'the fiction',
						quote: 'I want our nation to be the most beautiful nation in the world.',
						by: 'Kim Gu, 1947',
						body: 'In the story, North and South become one state while China and America wear each other out.',
						map: {
							world: modern,
							star: false,
							marks: KOREA_UNITED_MARKS,
							fromMarks: KOREA_BEFORE_MARKS,
							spread: AT.pyongyang,
							focus: ['caliphate'],
							frame: { lon0: 118, lon1: 136, lat0: 30, lat1: 46 }
						}
					}
				}
			]
		},
		{
			id: 'third-power',
			kicker: 'The third power',
			line: 'It takes the land the two superpowers wore out.',
			pairs: [
				{
					left: {
						title: 'The Caliphate',
						when: '632–750',
						quote: 'Peace be upon you, O Syria, a farewell that will know no return.',
						by: 'Heraclius, as reported by al-Tabari',
						body: 'Within a century, Arab armies hold Syria, Egypt, North Africa, Spain, and nearly all of Persia.',
						map: { world: antique, period: 6, from: 3, spread: AT.medina, focus: ['caliphate'] }
					},
					right: {
						title: 'The Kaliphate',
						when: 'the fiction',
						quote: 'We herewith proclaim the independence of Korea and the liberty of the Korean people.',
						by: 'Korean Declaration of Independence, 1919',
						body: 'In the story, a united Korea takes north China and Siberia. Southern China stays Chinese.',
						map: { world: modern, period: 7, from: 3, spread: AT.paektu, focus: ['caliphate'] }
					}
				}
			]
		},
		{
			id: 'language',
			kicker: 'The language world',
			line: 'The empire passes. Its language stays where local identity was thin.',
			pairs: [
				{
					left: {
						title: 'The Arab world',
						when: 'today',
						quote: 'The vanquished always want to imitate the victor in his distinctive mark(s), his dress, his occupation, and all his other conditions and customs.',
						by: 'Ibn Khaldun, Muqaddimah',
						body: 'Arabic took North Africa and the Fertile Crescent. Iran converted but kept Persian.',
						map: {
							world: antique,
							star: false,
							borders: true,
							marks: ARAB_WORLD_MARKS,
							fromMarks: ARABIA_ALONE_MARKS,
							spread: AT.medina,
							focus: ['caliphate', 'persia'],
							frame: { lon0: -18, lon1: 62, lat0: -2, lat1: 44 }
						}
					},
					right: {
						title: 'The Koreanic world',
						when: 'the fiction',
						quote: 'The speech of this country is different from that of China.',
						by: 'King Sejong, 1446',
						body: 'Siberia is the Maghreb: vast and thinly settled, so it takes the new language. China, like Iran, keeps its own.',
						map: {
							world: modern,
							star: false,
							marks: KOREANIC_WORLD_MARKS,
							fromMarks: KOREA_ALONE_MARKS,
							spread: AT.paektu,
							focus: ['caliphate', 'persia'],
							frame: { lon0: 92, lon1: 176, lat0: 30, lat1: 74 }
						}
					}
				}
			]
		},
		{
			id: 'long-war',
			kicker: 'The long war',
			line: 'Then centuries of war with the superpower that is left.',
			pairs: [
				{
					left: {
						title: 'The Caliphate and Rome',
						when: '700–1100',
						quote: 'They have been at war with the Romans for a long time, and have become experienced in military matters.',
						by: 'Leo VI, Taktika 18',
						body: 'Persia is gone. Rome and the Caliphate fight for four centuries. Neither wins the sea.',
						map: {
							world: antique,
							period: 5,
							from: 6,
							spread: AT.constantinople,
							focus: ['romeEast', 'caliphate']
						}
					},
					right: {
						title: 'The Kaliphate and America',
						when: 'the fiction',
						quote: 'Whosoever commands the sea commands the trade… and consequently the world itself.',
						by: 'Sir Walter Raleigh',
						body: 'With China worn down, the next rival is America, across the Pacific. No one wins outright.',
						map: { world: modern, period: 7, focus: ['caliphate', 'romeEast'] }
					}
				}
			]
		}
	];

	const chapters = [
		{
			id: 'rome',
			kicker: 'Rome → America',
			line: 'A republic that took the sea, and the country that copies it.',
			sections: ['seed', 'reach', 'claim', 'parent']
		},
		{
			id: 'persia',
			kicker: 'Persia → China',
			line: 'The old land empire: widest, broken, reborn.',
			sections: ['width', 'comeback']
		},
		{
			id: 'wars',
			kicker: 'Roman–Persian Wars → US–China Rivalry',
			line: 'Two superpowers, centuries of standoff.',
			sections: ['two-eyes']
		},
		{
			id: 'greece',
			kicker: 'Greece → Japan',
			line: 'The small neighbor that conquered once, and whose art won.',
			sections: ['macedon', 'captive-culture']
		},
		{
			id: 'arabia',
			kicker: 'Arabia → Korea',
			line: 'A divided people between two empires.',
			sections: ['hired-cousins', 'holy-place', 'union']
		},
		{
			id: 'kaliphate',
			kicker: 'The Kaliphate',
			line: 'A fiction, for fun. Not a prediction.',
			sections: ['third-power', 'language', 'long-war']
		}
	].map((chapter) => ({
		...chapter,
		sections: chapter.sections.map((id) => groups.find((group) => group.id === id))
	}));
</script>

{#snippet cell(item, tone)}
	<article class={tone}>
		<header class="colhead">
			<strong>{item.title}</strong>
			<span>{item.when}</span>
		</header>
		{#if item.map}
			<Inset map={item.map} label="{item.title}, {item.when}" />
		{/if}
		{#if item.images?.length}
			<FitImages images={item.images} ratio={item.ratio ?? '4 / 3'} />
		{/if}
		<p>{item.body}</p>
		<blockquote>
			<p>“{item.quote}”</p>
			<cite>{item.by}</cite>
		</blockquote>
		{#each item.links ?? [] as link (link.href)}
			<a href={link.href}>{link.label}</a>
		{/each}
	</article>
{/snippet}

<section class="compare" aria-label="Parallels">
	{#each chapters as chapter (chapter.id)}
		<h2 id={chapter.id} class="chapter">{chapter.kicker}</h2>
		<p class="thesis">{chapter.line}</p>
		{#each chapter.sections as section (section.id)}
			<h3 id={section.id} class="sub">{section.kicker}</h3>
			<p class="thesis nested">{section.line}</p>
			{#each section.pairs as pair, i (`${section.id}-${i}`)}
				{#if pair.sub}
					<h4 class="minor notoc">{pair.sub}</h4>
					{#if pair.line}
						<p class="thesis nested">{pair.line}</p>
					{/if}
				{/if}
				<div class="row">
					{@render cell(pair.left, 'antique')}
					{@render cell(pair.right, 'fiction')}
				</div>
			{/each}
		{/each}
	{/each}
</section>

<style>
	.compare {
		margin: 1.5rem 0 2rem;
	}

	.chapter {
		margin: 2.4rem 0 0.4rem;
		text-align: center;
		font-size: 1.45rem;
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.2;
	}

	.sub {
		margin: 1.35rem 0 0.35rem;
		text-align: center;
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-2, #4a4640);
	}

	.minor {
		margin: 0.85rem 0 0.3rem;
		text-align: center;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--ink-3, #6d6860);
	}

	.thesis {
		margin: 0 0 0.85rem;
		text-align: center;
		font-family: Iowan Old Style, Palatino, Georgia, serif;
		font-size: 1.05rem;
		font-style: italic;
		font-weight: 500;
		line-height: 1.4;
		color: var(--ink-2, #4a4640);
	}

	.thesis.nested {
		font-size: 0.98rem;
		margin-bottom: 0.7rem;
	}

	.colhead {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		margin: 0 0 0.7rem;
	}

	.colhead strong {
		color: var(--ink);
		font-size: 1.02rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.colhead span {
		flex: none;
		color: var(--ink-3);
		font-size: 0.78rem;
		font-style: italic;
		font-weight: 450;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
		margin-bottom: 1rem;
	}

	.compare article {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 1rem 1rem 0.6rem;
		border-radius: 14px;
		color: var(--ink);
		box-shadow: 0 0 0 1px var(--rule);
	}

	.antique {
		background: var(--antique, color-mix(in srgb, #c4a060 26%, var(--card, #fff)));
	}

	.fiction {
		background: var(--fiction, color-mix(in srgb, #c45a72 16%, var(--card, #fff)));
	}

	.compare article > p {
		margin: 0.8rem 0 0.6rem;
		color: var(--ink);
		font-size: 0.98rem;
		line-height: 1.5;
	}

	.compare article blockquote {
		margin: auto 0 0.6rem;
		padding: 0.6rem 0 0;
		border: 0;
		border-top: 1px solid var(--rule);
		color: var(--ink-2);
		letter-spacing: inherit;
	}

	.compare article blockquote p {
		margin: 0;
		color: var(--ink-2);
		font-family: Iowan Old Style, Palatino, Georgia, serif;
		font-size: 0.92rem;
		font-style: italic;
		font-weight: 450;
		line-height: 1.4;
	}

	.compare article cite {
		display: block;
		margin-top: 0.3rem;
		color: var(--ink-3);
		font-size: 0.74rem;
		font-style: normal;
		font-weight: 450;
	}

	article :global(figure) {
		margin: 0.75rem 0 0.2rem;
	}

	article a {
		display: inline-block;
		margin: 0 0.8rem 0.6rem 0;
		color: inherit;
		font-size: 0.82rem;
	}

	@media (max-width: 720px) {
		.row {
			grid-template-columns: 1fr;
		}
	}
</style>
