<script>
	import {
		ACHAEMENID_MARKS,
		ALEXANDER_MARKS,
		ARAB_WORLD_MARKS,
		ARABIA_632_MARKS,
		ARABIA_ALONE_MARKS,
		ARABIA_BEFORE_MARKS,
		BERBER_TRIBE_MARKS,
		CHINA_PROPER_MARKS,
		CLIENTS,
		COLONIES_MARKS,
		EGYPT_MARKS,
		EUROPE_MARKS,
		ACHAEAN_WAR_MARKS,
		GREECE_FREE_MARKS,
		JAPAN_EMPIRE_MARKS,
		JAPAN_HOME_MARKS,
		PACIFIC_WAR_MARKS,
		KOREA_ALONE_MARKS,
		KOREA_BEFORE_MARKS,
		KOREA_UNITED_MARKS,
		KOREANIC_WORLD_MARKS,
		LATIUM_MARKS,
		MACEDON_MARKS,
		NONE,
		PLATEAU_MARKS,
		PRC_MARKS,
		ROC_MARKS,
		QING_MARKS,
		PARTHIAN_MARKS,
		ROMAN_SEA_MARKS,
		SASANIAN_MARKS,
		SIBERIA_TRIBE_MARKS
	} from './empire.js';
	import Flag from './Flag.svelte';
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
						flags: ['ir'],
						quote: 'God effected that the whole world should be illumined from the very beginning by two eyes.',
						by: 'Khosrow II, in Theophylact Simocatta 4.11',
						body: 'A sea empire and a land empire. They fought over the same borderlands for seven centuries. Neither could finish the other.',
						map: { world: antique, period: 2, focus: EYES }
					},
					right: {
						title: 'America and China',
						when: 'today',
						flags: ['us', 'cn'],
						quote: 'The Pacific Ocean… will become the chief theatre of events in the world’s great hereafter.',
						by: 'William H. Seward, 1852',
						body: 'A sea empire and a land empire again. Both sit on the real coast, with the Pacific narrowed so North America is in the picture.',
						map: { world: modern, period: 2, focus: EYES, star: false }
					}
				}
			]
		},
		{
			id: 'seed',
			kicker: 'Seven hills',
			line: 'A village on seven hills, and thirteen colonies on one coast.',
			pairs: [
				{
					left: {
						title: 'The seven hills',
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
						flag: 'thirteen',
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
			kicker: 'The republic',
			line: 'Then the republics grew. Rome by sea, America by land.',
			pairs: [
				{
					left: {
						title: 'The Roman Republic',
						when: '264–30 BC',
						flag: 'vexillum',
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
							frame: { lon0: -11, lon1: 42, lat0: 22, lat1: 52 }
						}
					},
					right: {
						title: 'America takes the continent',
						when: '1783–1898',
						flag: 'us',
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
			kicker: 'The peace',
			line: 'A settled order, with one people running it.',
			pairs: [
				{
					left: {
						title: 'The Pax Romana',
						when: '27 BC – AD 180',
						flag: 'vexillum',
						quote: 'I transferred the republic from my power to the dominion of the senate and people of Rome.',
						by: 'Augustus, Res Gestae 34',
						body: 'Augustus said he restored the republic while ruling it alone. In 212, every free man in the empire became a citizen.',
						map: {
							world: antique,
							star: false,
							marks: ROMAN_SEA_MARKS,
							focus: ['romeEast', 'romeWest'],
							frame: { lon0: -11, lon1: 40, lat0: 24, lat1: 51 }
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
						title: 'The Pax Americana',
						when: '1945 –',
						flag: 'us',
						quote: 'Government of the people, by the people, for the people.',
						by: 'Abraham Lincoln, 1863',
						body: 'Citizenship by oath, not by blood, as in Rome. Washington is painted rising into the sky like an emperor.',
						map: {
							world: modern,
							period: 2,
							focus: ['romeEast'],
							frame: { lon0: -140, lon1: -52, lat0: 14, lat1: 62 }
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/washington-zeus.jpg',
								alt: 'Horatio Greenough’s marble George Washington seated like Olympian Zeus, one hand raised, the other on a sword',
								title: 'Horatio Greenough, George Washington, 1841. Made for the Capitol rotunda, on the pose of Phidias’s Zeus.'
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
						flag: 'us',
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
			kicker: 'The source',
			line: 'Egypt is the old country Greece and Rome learned from. Europe is that country for America.',
			pairs: [
				{
					left: {
						title: 'Egypt',
						when: 'the original',
						quote: 'The names of nearly all the gods came to Greece from Egypt.',
						by: 'Herodotus 2.50',
						body: 'An old river civilization, already ancient when Greece and Rome were learning their gods, their measures, and their stone.',
						map: {
							world: antique,
							star: false,
							marks: EGYPT_MARKS,
							fromMarks: NONE,
							spread: [31.2, 30.0],
							focus: ['people'],
							frame: { lon0: 24, lon1: 36, lat0: 21, lat1: 33 }
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
						title: 'The Achaemenids',
						when: '550–330 BC',
						flag: 'falcon',
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
						flag: 'qing',
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
						flag: 'kaviani',
						quote: 'I, the Mazda-worshipping lord Shapur, king of kings of Iran and non-Iran.',
						by: 'Shapur I, Naqsh-e Rostam',
						more: [
							{
								quote: 'He declared that he would recover for the Persians the kingdom which they had formerly possessed as far as the Grecian Sea, claiming that all this was his rightful inheritance from his forefathers.',
								by: 'Herodian 6.2.2, on Ardashir I'
							}
						],
						body: 'Five centuries after Alexander, a Persian dynasty takes Iran and Mesopotamia back. This is that realm, not the Egyptian occupation of 620.',
						map: {
							world: antique,
							star: false,
							marks: SASANIAN_MARKS,
							fromMarks: PLATEAU_MARKS,
							spread: AT.istakhr,
							focus: ['persia'],
							frame: { lon0: 28, lon1: 68, lat0: 14, lat1: 44 }
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
						flag: 'cn',
						quote: 'Ours will no longer be a nation subject to insult and humiliation. We have stood up.',
						by: 'Mao Zedong, 1949',
						more: [
							{
								quote: 'Realizing the great rejuvenation of the Chinese nation is the greatest dream of the Chinese nation since modern times.',
								by: 'Xi Jinping, 2012'
							},
							{
								quote: 'We will never allow anyone, any organization, or any political party, at any time or in any form, to separate any part of Chinese territory from China.',
								by: 'Xi Jinping, 19th Party Congress, 2017'
							}
						],
						body: 'After a century of loss, China puts the country back together and calls the old lands its own again.',
						map: {
							world: modern,
							star: false,
							marks: PRC_MARKS,
							fromMarks: CHINA_PROPER_MARKS,
							spread: AT.beijing,
							focus: ['persia'],
							frame: { lon0: 73, lon1: 135, lat0: 18, lat1: 50 }
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
						flag: 'sun',
						quote: 'Is it not worthy of tears that, when the number of worlds is infinite, I have not yet become lord of one?',
						by: 'Alexander, in Plutarch',
						body: 'Macedon, on Greece’s northern edge, conquers all of Persia in ten years. The empire splits when Alexander dies.',
						map: {
							world: antique,
							star: false,
							marks: ALEXANDER_MARKS,
							fromMarks: MACEDON_MARKS,
							spread: AT.pella,
							focus: ['greece'],
							frame: { lon0: 12, lon1: 66, lat0: 14, lat1: 46 }
						}
					},
					right: {
						title: 'Imperial Japan',
						when: '1931–1945',
						flag: 'rising',
						quote: 'The eight corners of the world under one roof.',
						by: 'Hakkō ichiu, the empire’s slogan',
						body: 'Japan, off China’s coast, takes Manchuria, the coast, and Southeast Asia. It collapses in 1945.',
						map: {
							world: modern,
							star: false,
							marks: JAPAN_EMPIRE_MARKS,
							fromMarks: JAPAN_HOME_MARKS,
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
					sub: 'The original',
					line: 'The look itself, before the empires that carried it.',
					left: {
						title: 'The Greek gods',
						when: 'the original',
						flag: 'gr',
						quote: 'Captive Greece took her savage conqueror captive.',
						by: 'Horace, Epistles 2.1',
						body: 'This is the Greek look: Zeus, Athena, Apollo, the gods in a row. Rome copied it for centuries.',
						ratio: '16 / 9',
						images: [
							{
								src: '/image_greek.jpg',
								alt: 'Zeus seated between Athena and Apollo on a Greek pediment',
								title: 'The Olympians, as Greece handed them on.'
							}
						]
					},
					right: {
						title: 'The anime heroes',
						when: 'the original',
						flag: 'jp',
						quote: 'Japan has been reinventing its influence as a cultural power.',
						by: 'Douglas McGray, 2002',
						body: 'Japan lost the war, and this is the look that won: the heroes it sent out afterward.',
						ratio: '16 / 9',
						images: [
							{
								src: '/image_anime.jpeg',
								alt: 'A lineup of famous anime heroes standing together',
								title: 'The anime pantheon.'
							}
						]
					}
				},
				{
					sub: 'The early form',
					line: 'Before the classic style: gold masks, and borrowed oil paint.',
					left: {
						title: 'Greece',
						when: 'c. 1550 BC',
						flag: 'gr',
						quote: 'I have found the tombs which the tradition of the whole civilized world has attributed to Agamemnon, Cassandra, and their companions.',
						by: 'Heinrich Schliemann, 1876',
						body: 'The Greek look had a childhood. This gold mask is it.',
						map: {
							world: antique,
							star: false,
							marks: GREECE_FREE_MARKS,
							focus: ['greece'],
							frame: { lon0: 19, lon1: 26.5, lat0: 35.2, lat1: 42 }
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
						title: 'Japan',
						when: '1868–1912',
						flag: 'jp',
						quote: 'We should leave the ranks of Asian nations and cast our lot with the civilized nations of the West.',
						by: 'Fukuzawa Yukichi, 1885',
						body: 'Japanese painters learned Western oil paint, then made it their own. The training before anime.',
						map: {
							world: modern,
							star: false,
							marks: JAPAN_HOME_MARKS,
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
						flag: 'sa',
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
						flags: ['kr', 'kp'],
						quote: 'When whales fight, the shrimp’s back is broken.',
						by: 'Korean proverb',
						body: 'One people, two client states. The patrons resent them and cannot drop them.',
						map: {
							world: modern,
							period: 2,
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
							period: 6,
							focus: ['caliphate'],
							frame: { lon0: 126.2, lon1: 131, lat0: 40.2, lat1: 43.6 }
						}
					}
				}
			]
		},
		{
			id: 'prophet',
			kicker: 'The prophet',
			line: 'One person, before the armies.',
			pairs: [
				{
					left: {
						title: 'Muhammad',
						when: '610–632',
						flag: 'umayyad',
						quote: 'O people, lend me an attentive ear, for I do not know whether, after this year, I shall ever be amongst you again.',
						by: 'The Farewell Sermon, as transmitted by Ibn Ishaq',
						body: 'One man, from the Hejaz, makes a new community. The armies come after he is gone.',
						map: {
							world: antique,
							star: false,
							marks: ARABIA_632_MARKS,
							fromMarks: ARABIA_BEFORE_MARKS,
							spread: AT.medina,
							focus: ['caliphate'],
							frame: { lon0: 34, lon1: 60, lat0: 12, lat1: 32 }
						}
					},
					right: {
						title: 'The Prophet',
						when: 'the prediction',
						flag: 'unity',
						body: 'The story’s guess of the same kind of person, out of Korea: one voice, then a people, then the march. This essay calls that person The Prophet, and names no one living.',
						map: {
							world: modern,
							star: false,
							marks: KOREA_UNITED_MARKS,
							fromMarks: KOREA_BEFORE_MARKS,
							spread: AT.pyongyang,
							focus: ['caliphate'],
							frame: { lon0: 124, lon1: 132, lat0: 33.5, lat1: 43.5 }
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
						flag: 'umayyad',
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
						flag: 'unity',
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
						flag: 'umayyad',
						when: '632–750',
						quote: 'Peace be upon you, O Syria, a farewell that will know no return.',
						by: 'Heraclius, as reported by al-Tabari',
						body: 'Within a century, Arab armies hold Syria, Egypt, North Africa, Spain, and nearly all of Persia.',
						map: { world: antique, period: 6, from: 3, spread: AT.medina, focus: ['caliphate'] }
					},
					right: {
						title: 'The Kaliphate',
						flag: 'unity',
						when: 'the fiction',
						quote: 'We herewith proclaim the independence of Korea and the liberty of the Korean people.',
						by: 'Korean Declaration of Independence, 1919',
						body: 'In the story, a united Korea takes all of Manchuria, north China, and Siberia. Southern China stays Chinese.',
						map: { world: modern, period: 6, from: 3, spread: AT.paektu, focus: ['caliphate'] }
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
						flag: 'sa',
						when: 'today',
						quote: 'The vanquished always want to imitate the victor in his distinctive mark(s), his dress, his occupation, and all his other conditions and customs.',
						by: 'Ibn Khaldun, Muqaddimah',
						body: 'Arabic took North Africa and the Fertile Crescent. Iran converted but kept Persian.',
						map: {
							world: antique,
							star: false,
							marks: ARAB_WORLD_MARKS,
							fromMarks: ARABIA_ALONE_MARKS,
							spread: AT.medina,
							focus: ['caliphate', 'persia'],
							frame: { lon0: -18, lon1: 62, lat0: -2, lat1: 44 }
						}
					},
					right: {
						title: 'The Koreanic world',
						flag: 'kr',
						when: 'the fiction',
						quote: 'The speech of this country is different from that of China.',
						by: 'King Sejong, 1446',
						body: 'Siberia is the Maghreb: vast and thinly settled, so it takes the new language. All of Manchuria goes with it: the three northeastern provinces, eastern Inner Mongolia out to the Argun, and Outer Manchuria south of the Stanovoy. China proper, like Iran, keeps its own.',
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
						map: { world: modern, period: 6, focus: ['caliphate', 'romeEast'] }
					}
				}
			]
		},
		{
			id: 'core',
			kicker: 'The country',
			line: 'Strip the empire away and the country is still there.',
			pairs: [
				{
					left: {
						title: 'Persia proper',
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
			id: 'broken',
			kicker: 'The neighbor',
			line: 'A smaller people breaks the giant, once.',
			pairs: [
				{
					left: {
						title: 'Alexander',
						when: '334–323 BC',
						flag: 'sun',
						quote: 'Is it not worthy of tears that, when the number of worlds is infinite, I have not yet become lord of one?',
						by: 'Alexander, in Plutarch',
						body: 'Macedon ends the Achaemenid empire in ten years. The empire splits when Alexander dies.',
						map: {
							world: antique,
							star: false,
							marks: ALEXANDER_MARKS,
							fromMarks: MACEDON_MARKS,
							spread: AT.pella,
							focus: ['greece'],
							frame: { lon0: 12, lon1: 66, lat0: 14, lat1: 46 }
						}
					},
					right: {
						title: 'Imperial Japan',
						when: '1931–1945',
						flag: 'rising',
						quote: 'The eight corners of the world under one roof.',
						by: 'Hakkō ichiu, the empire’s slogan',
						body: 'Japan breaks the Qing’s succession and takes the coast. It does not keep China.',
						map: {
							world: modern,
							star: false,
							marks: JAPAN_EMPIRE_MARKS,
							fromMarks: JAPAN_HOME_MARKS,
							spread: AT.tokyo,
							focus: ['greece'],
							frame: EAST_ASIA
						}
					}
				}
			]
		},
		{
			id: 'parthian',
			kicker: 'The successor',
			line: 'After the giant breaks, a smaller dynasty holds the country.',
			pairs: [
				{
					left: {
						title: 'The Parthians',
						when: '247 BC – AD 224',
						flag: 'arsacid',
						quote: 'Having divided the world with the Romans, they held the empire of the east.',
						by: 'Justin, Epitome 41.1',
						body: 'The Arsacids take Iran and Mesopotamia back from Alexander’s successors. They stop at the Euphrates. Egypt is not theirs.',
						map: {
							world: antique,
							star: false,
							marks: PARTHIAN_MARKS,
							fromMarks: PLATEAU_MARKS,
							spread: AT.istakhr,
							focus: ['persia'],
							frame: { lon0: 32, lon1: 68, lat0: 24, lat1: 42 }
						}
					},
					right: {
						title: 'The Republic of China',
						when: '1912–1949',
						flag: 'roc',
						quote: 'The revolution is not yet complete. Let all our comrades strive on.',
						by: 'Sun Yat-sen, political testament, 1925',
						body: 'After the Qing, the republic holds the country the People’s Republic holds, except Tibet. It spends itself in warlords, invasion, and civil war. The comeback dynasty is still ahead of it.',
						map: {
							world: modern,
							star: false,
							marks: ROC_MARKS,
							fromMarks: QING_MARKS,
							spread: AT.beijing,
							focus: ['persia'],
							frame: CHINA
						}
					}
				}
			]
		},
		{
			id: 'caesar',
			kicker: 'The man',
			line: 'A republic, and the man who steps over its line.',
			pairs: [
				{
					left: {
						title: 'Caesar',
						when: '49 BC',
						flag: 'vexillum',
						quote: 'The die is cast.',
						by: 'Caesar, in Suetonius, Divus Julius 32',
						body: 'A general brings his army across the Rubicon, which the law forbids, and a large part of the republic goes with him.',
						map: {
							world: antique,
							star: false,
							marks: ROMAN_SEA_MARKS,
							focus: ['romeEast', 'romeWest'],
							frame: ITALY
						}
					},
					right: {
						title: 'Trump',
						when: '2016 –',
						flag: 'us',
						quote: 'I alone can fix it.',
						by: 'Donald Trump, Republican National Convention, 2016',
						body: 'The claim that the office and the man are the same thing, and that the republic’s limit does not bind him.',
						map: {
							world: modern,
							period: 2,
							focus: ['romeEast'],
							frame: { lon0: -140, lon1: -52, lat0: 14, lat1: 62 }
						}
					}
				}
			]
		},
		{
			id: 'conquest',
			kicker: 'The conquest',
			line: 'Rome takes Greece. The United States takes Japan.',
			pairs: [
				{
					left: {
						title: 'The Achaean War',
						when: '146 BC',
						flag: 'vexillum',
						quote: 'I saw pictures thrown upon the ground, and soldiers playing at dice on them.',
						by: 'Polybius, on the sack of Corinth, in Strabo 8.6.23',
						body: 'Rome breaks the Achaean League and burns Corinth. Macedonia already has a Roman governor. Greece, which had taught Rome, is now ruled from Rome.',
						map: {
							world: antique,
							star: false,
							marks: ACHAEAN_WAR_MARKS,
							fromMarks: GREECE_FREE_MARKS,
							spread: [19.2, 38.6],
							focus: ['romeEast'],
							frame: { lon0: 19, lon1: 26.5, lat0: 35.2, lat1: 42 }
						}
					},
					right: {
						title: 'The Pacific War',
						when: '1941–1945',
						flag: 'us',
						quote: 'Today the guns are silent. A great tragedy has ended. A great victory has been won.',
						by: 'Douglas MacArthur, Tokyo Bay, 2 September 1945',
						body: 'The United States fights Japan across the ocean and, in 1945, occupies the home islands. Korea and Taiwan leave the empire. Japan stays under American arms.',
						map: {
							world: modern,
							star: false,
							marks: PACIFIC_WAR_MARKS,
							fromMarks: JAPAN_EMPIRE_MARKS,
							spread: [147.5, 34.5],
							focus: ['romeEast'],
							frame: { lon0: 124, lon1: 152, lat0: 24, lat1: 46 }
						}
					}
				}
			]
		},
		{
			id: 'philhellene',
			kicker: 'The admirers',
			line: 'Philhellene, and Japanophile.',
			pairs: [
				{
					left: {
						title: 'The philhellene',
						when: 'after the conquest',
						flag: 'gr',
						quote: 'Captive Greece took her savage conqueror captive.',
						by: 'Horace, Epistles 2.1',
						body: 'Rome conquered Greece and then could not stop collecting it. Hadrian’s Greece had a face: Antinous, mourned across the empire.',
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/antinous.jpg',
								alt: 'Marble bust of Antinous, a young man with curled hair, in profile',
								title: 'Antinous. Hadrian’s companion, and the face of a Roman philhellene. National Archaeological Museum, Athens.'
							}
						]
					},
					right: {
						title: 'The Japanophile',
						when: 'after the war',
						flag: 'jp',
						quote: 'Japan has been reinventing its influence as a cultural power.',
						by: 'Douglas McGray, 2002',
						body: 'Japan lost the war, and the look traveled anyway. The weeaboo is the philhellene of this story: devoted to a culture his own country once beat.',
						ratio: '16 / 9',
						images: [
							{
								src: '/image_anime.jpeg',
								alt: 'A lineup of famous anime heroes standing together',
								title: 'The anime pantheon, which outlived the empire.'
							}
						]
					}
				}
			]
		},
		{
			id: 'tribes',
			kicker: 'The peoples there',
			line: 'Siberia is the Maghreb. The people were already on the ground.',
			pairs: [
				{
					left: {
						title: 'The Berber tribes',
						when: 'before Islam',
						quote: 'They are the most numerous of peoples, and their tribes and subtribes are beyond counting.',
						by: 'Ibn Khaldun, on the Berbers',
						body: 'Before Arabic, North Africa was Berber. On the Atlantic, the Mauri. Inland, Numidia, Massaesyli to the west and Massylii toward Carthage. South of the Atlas, the Gaetuli. In the Fezzan, the Garamantes. By the Gulf of Sidra, the Nasamones. The shapes are homelands, not surveyed borders.',
						map: {
							world: antique,
							star: false,
							marks: BERBER_TRIBE_MARKS,
							fromMarks: NONE,
							spread: [3, 36],
							focus: ['people'],
							frame: { lon0: -12, lon1: 25, lat0: 22, lat1: 38 }
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/kabyle.jpg',
								alt: 'A Kabyle woman in a silver headdress and jewelry',
								title: 'A Kabyle woman, Algeria. Kabyles are Amazigh, the people the Mauri and the Numidians became.'
							},
							{
								src: '/blog/caliphate/tuareg.jpg',
								alt: 'A nineteenth-century engraving of Tuareg men, one standing with a spear and one mounted on a camel',
								title: 'Tuareg in the Sahara, from Le Tour du monde. The veiled Amazigh south of the Atlas.',
								ratio: '4 / 3'
							}
						]
					},
					right: {
						title: 'The peoples of Siberia',
						when: 'inside Russia',
						quote: 'The Yakut call themselves Sakha.',
						by: 'The people’s own name, along the Lena',
						body: 'The minority peoples still there: Nenets and Khanty-Mansi on the Ob, Evenks across the taiga, Sakha along the Lena, Altai, Tuvans, and Buryats around Baikal, Nanai on the Amur. Thinly settled, and still themselves. The shapes are homelands.',
						map: {
							world: modern,
							star: false,
							marks: SIBERIA_TRIBE_MARKS,
							fromMarks: NONE,
							spread: [129.7, 62.0],
							focus: ['people'],
							frame: { lon0: 60, lon1: 150, lat0: 46, lat1: 72 }
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/yakut.jpg',
								alt: 'A nineteenth-century picture of Sakha people in fur and embroidered coats beside a river',
								title: 'Sakha (Yakuts), a nineteenth-century view. One of the peoples on the Lena.'
							},
							{
								src: '/blog/caliphate/khanty.jpg',
								alt: 'A late nineteenth-century photograph of a Khanty family group with sleds and fishing nets',
								title: 'Khanty on the Ob, late nineteenth century. The people once called Ostyaks.'
							}
						]
					}
				}
			]
		},
		{
			id: 'final-war',
			kicker: 'The final war',
			line: 'The last great war of antiquity, and the contest that would rhyme with it.',
			pairs: [
				{
					left: {
						title: 'Rome and Persia',
						when: '602–628',
						flag: 'kaviani',
						quote: 'They captured Jerusalem and carried off the Lord’s Cross.',
						by: 'Sebeos, on 614',
						body: 'The Byzantine–Sasanian war, the last great war of antiquity. Persia takes Syria, Jerusalem, and Egypt. Heraclius reaches the heart of Persia. In 628 both sides accept the old border, and both are ruined.',
						map: {
							world: antique,
							period: 3,
							from: 2,
							spread: AT.istakhr,
							focus: ['persia', 'romeEast'],
							frame: { lon0: 24, lon1: 64, lat0: 22, lat1: 44 }
						}
					},
					right: {
						title: 'America and China',
						when: 'the contest',
						flags: ['us', 'cn'],
						quote: 'When a rising power threatens to displace a ruling one, alarm bells should sound.',
						by: 'Graham Allison, Destined for War, 2017',
						body: 'A long contest across the Pacific: fleets, chips, the island, sanctions. It is the rhyme of 602. It does not have to become an invasion.',
						map: { world: modern, period: 3, focus: EYES, star: false }
					}
				}
			]
		},
		{
			id: 'predictions',
			kicker: 'Further predictions',
			line: 'What the new tongue would do to the old writing.',
			pairs: [
				{
					left: {
						title: 'Persian in Arabic letters',
						when: 'after the conquest',
						flag: 'ir',
						quote: 'The vanquished always want to imitate the victor in his distinctive mark(s), his dress, his occupation, and all his other conditions and customs.',
						by: 'Ibn Khaldun, Muqaddimah',
						body: 'Persian kept its words and took the Arabic script. The language stayed. The letters changed.',
						examples: [
							{ from: 'زبان', to: 'zabān', gloss: 'language' },
							{ from: 'ایران', to: 'Īrān', gloss: 'Iran' }
						]
					},
					right: {
						title: 'Chinese in Hangul',
						when: 'the prediction',
						flag: 'kr',
						body: 'In the fiction, Chinese keeps its words and takes Hangul, the way Persian took the Arabic letters. These are Mandarin sounds spelled in Hangul. A sketch, not a reform.',
						examples: [
							{ from: '中国', to: '중궈', gloss: 'China' },
							{ from: '北京', to: '베이징', gloss: 'Beijing' },
							{ from: '你好', to: '니하오', gloss: 'hello' },
							{ from: '中华民族伟大复兴', to: '중화 민쭈 웨이다 푸싱', gloss: 'the great rejuvenation' }
						]
					}
				}
			]
		}
	];

	const chapters = [
		{
			id: 'rome',
			kicker: 'The Western Empire',
			line: 'Rome and America.',
			sections: ['parent', 'seed', 'reach', 'claim', 'caesar']
		},
		{
			id: 'persia',
			kicker: 'The Eastern Realm',
			line: 'Persia and China.',
			sections: ['core', 'width', 'broken', 'parthian', 'comeback']
		},
		{
			id: 'greece',
			kicker: 'The Archipelago',
			line: 'Greece and Japan.',
			sections: ['captive-culture', 'macedon', 'conquest', 'philhellene']
		},
		{
			id: 'arabia',
			kicker: 'The Peninsula',
			line: 'Arabia and Korea.',
			sections: ['hired-cousins', 'holy-place', 'prophet', 'union', 'tribes', 'language']
		},
		{
			id: 'wars',
			kicker: 'The two eyes',
			line: 'The standoff, then the final war.',
			sections: ['two-eyes', 'final-war']
		},
		{
			id: 'kaliphate',
			kicker: 'The Kaliphate',
			line: 'A fiction, and a few predictions.',
			sections: ['third-power', 'language', 'long-war', 'predictions']
		}
	].map((chapter) => ({
		...chapter,
		sections: chapter.sections.map((id) => groups.find((group) => group.id === id))
	}));
</script>

{#snippet cell(item, tone)}
	<article class={tone}>
	<header class="colhead">
		<strong>
			{#each item.flags ?? (item.flag ? [item.flag] : []) as id (id)}
				<Flag {id} />
			{/each}
			{item.title}
		</strong>
		<span>{item.when}</span>
	</header>
		{#if item.map}
			<Inset map={item.map} label="{item.title}, {item.when}" />
		{/if}
		{#if item.images?.length}
			<FitImages images={item.images} ratio={item.ratio ?? '4 / 3'} />
		{/if}
		<p>{item.body}</p>
		{#if item.examples?.length}
			<ul class="script">
				{#each item.examples as row (`${row.from}-${row.to}`)}
					<li>
						<span class="from">{row.from}</span>
						<span class="to">{row.to}</span>
						<span class="gloss">{row.gloss}</span>
					</li>
				{/each}
			</ul>
		{/if}
		{#if item.quote}
			<blockquote>
				<p>“{item.quote}”</p>
				<cite>{item.by}</cite>
			</blockquote>
		{/if}
		{#each item.more ?? [] as extra (`${extra.by}-${extra.quote}`)}
			<blockquote>
				<p>“{extra.quote}”</p>
				<cite>{extra.by}</cite>
			</blockquote>
		{/each}
		{#each item.links ?? [] as link (link.href)}
			<a href={link.href}>{link.label}</a>
		{/each}
	</article>
{/snippet}

<section class="compare" aria-label="Parallels">
	{#each chapters as chapter (chapter.id)}
		<h2 id={chapter.id} class="chapter">{chapter.kicker}</h2>
		<p class="thesis">{chapter.line}</p>
		{#each chapter.sections as section (`${chapter.id}-${section.id}`)}
			<h3 id="{chapter.id}-{section.id}" class="sub">{section.kicker}</h3>
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

	.script {
		display: grid;
		gap: 0.35rem;
		margin: 0.2rem 0 0.8rem;
		padding: 0;
		list-style: none;
	}

	.script li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.7rem;
		align-items: baseline;
		padding: 0.35rem 0;
		border-top: 1px solid color-mix(in srgb, var(--ink, #1c1b18) 12%, transparent);
	}

	.script .from {
		font-size: 1.15rem;
		letter-spacing: 0.01em;
	}

	.script .to {
		font-size: 1.05rem;
	}

	.script .gloss {
		color: var(--ink-3, #6d6860);
		font-size: 0.75rem;
		font-style: italic;
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
