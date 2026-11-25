<script>
	import {
		ACHAEMENID_MARKS,
		ALEXANDER_MARKS,
		ARAB_WORLD_MARKS,
		ARABIA_632_MARKS,
		ARABIA_ALONE_MARKS,
		ARABIA_BEFORE_MARKS,
		BERBER_TRIBE_MARKS,
		ATLANTIC_MARKS,
		CHINA_PARTS_MARKS,
		CHINA_PROPER_MARKS,
		CLIENTS,
		COLONIES_MARKS,
		EAST_REMAINS_MARKS,
		EUROPE_FALL_MARKS,
		AMERICA_HALF_MARKS,
		GRECO_ROMAN_WAR_MARKS,
		GREECE_FREE_MARKS,
		HUMILIATION_MARKS,
		ILKHANATE_MARKS,
		ILKHANATE_PERSIAN_MARKS,
		ROME_BEFORE_GREECE_MARKS,
		YUAN_CHINESE_MARKS,
		YUAN_MARKS,
		JAPAN_1942_ALONE_MARKS,
		JAPAN_EMPIRE_MARKS,
		JAPAN_HOME_MARKS,
		PACIFIC_WAR_MARKS,
		PERSIA_PARTS_MARKS,
		QING_TRIBUTARY_MARKS,
		TWO_ROMES_MARKS,
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
		PERSIA_TRIBUTE_MARKS,
		ROMAN_SEA_MARKS,
		TRAJAN_MARKS,
		SASANIAN_MARKS,
		SELEUCID_MARKS,
		SIBERIA_TRIBE_MARKS
	} from './empire.js';
	import Flag from './Flag.svelte';
	import FinalWar from './FinalWar.svelte';
	import { PLACES as AT, antique, atlantic, modern } from './sheets.js';
	import { lower48 } from './coasts.js';
	import FitImages from './FitImages.svelte';
	import Inset from './Inset.svelte';

	const lower48Marks = [{ rings: lower48, color: 'romeEast', outline: true }];

	/** The frames several maps share, before they are squared. */
	const ITALY = { lon0: 6.4, lon1: 19.8, lat0: 35.2, lat1: 47.2 };
	const MED = { lon0: -12, lon1: 50, lat0: 18, lat1: 58 };
	const IRAN = { lon0: 24, lon1: 66, lat0: 16, lat1: 46 };
	const CHINA = { lon0: 73, lon1: 145, lat0: 17, lat1: 54 };
	const EAST_ASIA = { lon0: 88, lon1: 158, lat0: -12, lat1: 55 };

	const EYES = ['romeEast', 'persia'];

	const groups = [
		{
			id: 'two-eyes',
			kicker: 'Two superpowers',
			line: 'Both pairs saw themselves as the only two powers that really mattered.',
			pairs: [
				{
					left: {
						title: 'Rome and Persia',
						when: 'c. 600',
						flags: ['vexillum', 'kaviani'],
						quote: 'God effected that the whole world should be illumined from the very beginning by two eyes.',
						by: 'Khosrow II, in Theophylact Simocatta 4.11',
						body: 'Rome was a sea empire and Persia a land empire. They fought over the same borderlands for about seven centuries, and neither ever knocked the other out.',
						map: { world: antique, period: 3, focus: EYES }
					},
					right: {
						title: 'America and China',
						when: 'today',
						flags: ['us', 'cn'],
						quote: 'The Pacific Ocean… will become the chief theatre of events in the world’s great hereafter.',
						by: 'William H. Seward, 1852',
						body: 'Same setup today, with America as the sea power and China as the land power. I narrowed the Pacific so both fit on one map.',
						map: { world: modern, period: 3, focus: EYES, star: false }
					}
				}
			]
		},
		{
			id: 'seed',
			kicker: 'Seven hills',
			line: 'Both started small: a town on the Tiber, and a handful of colonies on the Atlantic coast.',
			pairs: [
				{
					left: {
						title: 'The seven hills',
						when: 'c. 500 BC',
						quote: 'From slender beginnings it has so grown that it is now overburdened by its own greatness.',
						by: 'Livy, preface',
						body: 'Rome started as one Latin town among many, on a few hills by the Tiber.',
						map: {
							world: antique,
							star: false,
							marks: LATIUM_MARKS,
							fromMarks: LATIUM_MARKS,
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
						body: 'America started as thirteen colonies along the Atlantic that argued with each other and with London.',
						map: {
							world: modern,
							star: false,
							hide: ['USA'],
							marks: COLONIES_MARKS,
							fromMarks: COLONIES_MARKS,
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
			line: 'Then both republics grew, Rome mostly by sea and America mostly by land.',
			pairs: [
				{
					left: {
						title: 'The Roman Republic',
						when: '264–30 BC',
						flag: 'vexillum',
						quote: 'They took in hand for the first time to build ships.',
						by: 'Polybius 1.20',
						body: 'Rome took Sicily, then North Africa, Greece, and finally Egypt, until it controlled the whole Mediterranean coast.',
						map: {
							world: antique,
							star: false,
							marks: ROMAN_SEA_MARKS,
							fromMarks: LATIUM_MARKS,
							spread: AT.rome,
							focus: ['romeEast'],
							frame: MED
						}
					},
					right: {
						title: 'America takes the continent',
						when: '1783–1898',
						flag: 'us',
						quote: 'Our manifest destiny to overspread the continent allotted by Providence.',
						by: 'John L. O’Sullivan, 1845',
						body: 'America expanded west across the continent until it reached the Pacific, and only after that started looking overseas.',
						map: {
							world: modern,
							star: false,
							hide: ['USA'],
							marks: lower48Marks,
							fromMarks: COLONIES_MARKS,
							spread: 'west',
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
			line: 'A long stretch of relative peace, kept by one dominant power.',
			pairs: [
				{
					left: {
						title: 'The Pax Romana',
						when: '27 BC – AD 180',
						flag: 'vexillum',
						quote: 'I transferred the republic from my power to the dominion of the senate and people of Rome.',
						by: 'Augustus, Res Gestae 34',
						body: 'Augustus claimed he had restored the republic while running it himself. By 212, every free man in the empire was a Roman citizen.',
						map: {
							world: antique,
							star: false,
							marks: TRAJAN_MARKS,
							fromMarks: ROMAN_SEA_MARKS,
							spread: AT.rome,
							focus: ['romeEast'],
							frame: MED
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
						body: 'You become American by taking an oath, not by ancestry. The founders got the Roman treatment too: Washington was sculpted as Zeus and painted rising into heaven.',
						map: {
							world: modern,
							star: false,
							hide: ['USA'],
							marks: lower48Marks,
							fromMarks: lower48Marks,
							focus: ['romeEast'],
							frame: { lon0: -130, lon1: -52, lat0: 14, lat1: 58 }
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
				}
			]
		},
		{
			id: 'house',
			kicker: 'The house',
			line: 'Both built their government buildings to look like temples.',
			pairs: [
				{
					left: {
						title: 'The Pantheon',
						when: 'Rome, c. 125',
						quote: 'Because of its vaulted roof, it resembles the heavens.',
						by: 'Cassius Dio 53.27',
						body: 'A temple front with a huge concrete dome behind it, built as a temple to all the gods.',
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
						body: 'The Capitol uses the same formula of columns, a pediment, and a dome, for the building where Congress meets.',
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/apotheosis.jpg',
								alt: 'The Apotheosis of Washington on the Capitol dome',
								title: 'Constantino Brumidi, The Apotheosis of Washington, in the Capitol dome.'
							}
						]
					}
				}
			]
		},
		{
			id: 'two-romes',
			kicker: 'The two Romes',
			line: 'The empire split in two. Dark red is the eastern half and light red is the western half.',
			pairs: [
				{
					left: {
						title: 'East and West',
						when: 'AD 395',
						flag: 'vexillum',
						quote: 'Constantinople is New Rome.',
						by: 'Council of Constantinople, Canon 3, 381',
						body: 'When Theodosius died in 395, the empire was divided between his two sons. The west was eventually run from Ravenna and the east from Constantinople, and both still called themselves Rome.',
						map: {
							world: antique,
							star: false,
							marks: TWO_ROMES_MARKS,
							fromMarks: TRAJAN_MARKS,
							spread: AT.constantinople,
							focus: ['romeEast', 'romeWest'],
							frame: MED
						}
					},
					right: {
						title: 'America and Europe',
						when: '1949 –',
						flags: ['us', 'eu'],
						quote: 'An attack against one is an attack against them all.',
						by: 'North Atlantic Treaty, Article 5, 1949',
						body: 'The West splits the same way today, with America in dark red and Europe in light red. Each side is drawn at its own scale, with the Atlantic between them.',
						map: {
							world: atlantic,
							star: false,
							marks: ATLANTIC_MARKS,
							fromMarks: AMERICA_HALF_MARKS,
							spread: AT.washington,
							focus: ['romeEast', 'romeWest']
						}
					}
				}
			]
		},
		{
			id: 'west-falls',
			kicker: 'Fall of Western Rome',
			line: 'The western half fades while the eastern half carries on.',
			pairs: [
				{
					left: {
						title: 'Fall of Western Rome',
						when: '476',
						flag: 'vexillum',
						quote: 'The majesty of Rome was faintly represented by the princes of Constantinople.',
						by: 'Gibbon, Decline and Fall, ch. 38',
						body: 'By 476 the western empire was gone. What was left of Rome was ruled from Constantinople, and its main rival was Persia.',
						map: {
							world: antique,
							star: false,
							marks: EAST_REMAINS_MARKS,
							fromMarks: TWO_ROMES_MARKS,
							spread: 'southwest',
							focus: ['romeEast'],
							frame: MED
						}
					},
					right: {
						title: 'Decline of Europe',
						when: '1991 –',
						flags: ['us', 'eu'],
						quote: 'Great Britain has lost an empire and has not yet found a role.',
						by: 'Dean Acheson, 1962',
						body: 'Europe hasn’t gone anywhere, but it’s no longer at the center of world politics, and America’s attention has shifted to Asia.',
						map: {
							world: atlantic,
							star: false,
							marks: EUROPE_FALL_MARKS,
							fromMarks: ATLANTIC_MARKS,
							spread: AT.washington,
							focus: ['romeEast']
						}
					}
				}
			]
		},
		{
			id: 'width',
			kicker: 'The widest empire',
			line: 'Each started out as one huge empire that eventually broke apart.',
			pairs: [
				{
					left: {
						title: 'The Achaemenids',
						when: '550–330 BC',
						flag: 'falcon',
						quote: 'This is the kingdom which I hold, from the Sacae who are beyond Sogdiana, thence unto Ethiopia; from Sind, thence unto Sardis.',
						by: 'Darius I, Persepolis',
						body: 'Persia’s first empire stretched from Egypt to India, until Alexander conquered it.',
						map: {
							world: antique,
							star: false,
							marks: ACHAEMENID_MARKS,
							fromMarks: PERSIA_PARTS_MARKS,
							spread: 'west',
							focus: ['persia'],
							frame: IRAN
						},
						images: [
							{
								src: '/blog/caliphate/persepolis.jpg',
								alt: 'The Gate of All Nations at Persepolis',
								title: 'The Gate of All Nations at Persepolis, which Alexander burned in 330 BC.'
							}
						]
					},
					right: {
						title: 'The Qing',
						when: '1644–1912',
						flag: 'qing',
						quote: 'Our Celestial Empire possesses all things in prolific abundance.',
						by: 'The Qianlong Emperor to George III, 1793',
						body: 'At its largest, China’s last dynasty held Tibet, Mongolia, Xinjiang, and Taiwan. It fell apart under pressure from foreign powers.',
						map: {
							world: modern,
							star: false,
							marks: QING_MARKS,
							fromMarks: CHINA_PARTS_MARKS,
							spread: AT.mukden,
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
			line: 'After losing to a smaller neighbor, the old country eventually rebuilt itself.',
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
						body: 'About five centuries after Alexander, a new Persian dynasty, the Sasanians, rebuilt the empire across Iran and Mesopotamia.',
						map: {
							world: antique,
							star: false,
							marks: SASANIAN_MARKS,
							fromMarks: PARTHIAN_MARKS,
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
						body: 'After about a century of losing territory, China reunified and laid claim to the old imperial borders.',
						map: {
							world: modern,
							star: false,
							marks: PRC_MARKS,
							fromMarks: ROC_MARKS,
							spread: 'southwest',
							focus: ['persia'],
							frame: { lon0: 73, lon1: 135, lat0: 18, lat1: 50 }
						},
						images: [
							{
								src: '/blog/caliphate/shanghai.jpg',
								alt: 'The Bund and the Pudong skyline in Shanghai',
								title: 'The Pudong skyline, seen from the Bund in Shanghai.'
							}
						]
					}
				}
			]
		},
		{
			id: 'absorb',
			kicker: 'Who rules',
			line: 'Persia and China tend to absorb whoever conquers them. Rome and America are sea powers that let people from all over rise to the top.',
			pairs: [
				{
					left: {
						title: 'The invaders become Persian',
						when: 'Ilkhanate, and after',
						flag: 'ir',
						quote: 'They became Persians.',
						by: 'on the Mongols in Iran, a later summary of the Ilkhanate’s end',
						body: 'The Mongols conquered Iran in the 1250s. Within a couple of generations their khans had converted to Islam, used Persian, and ran a Persian-style court.',
						points: [
							'Yuan China — Mongol dynasty, Chinese state',
							'Ilkhanate — Mongol dynasty, Persian state',
							'Both ended up governing like the countries they conquered'
						],
						map: {
							world: antique,
							star: false,
							marks: ILKHANATE_PERSIAN_MARKS,
							fromMarks: ILKHANATE_MARKS,
							spread: AT.istakhr,
							focus: ['persia'],
							borders: true,
							labels: [
								{ lon: 51, lat: 33, text: 'Ilkhanate' },
								{ lon: 33, lat: 39, text: 'Rum' }
							],
							frame: { lon0: 26, lon1: 70, lat0: 22, lat1: 46 }
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/ilkhan.jpg',
								alt: 'An Ilkhanid manuscript painting of Ghazan Khan converting to Islam, with scholars and a tented court',
								title: 'Ghazan Khan converting to Islam, from an Ilkhanid manuscript.'
							}
						]
					},
					right: {
						title: 'The invaders become Chinese',
						when: 'Yuan, and after',
						flag: 'cn',
						quote: 'The Yuan unified the empire; the Ming restored the rites.',
						by: 'Ming historiography, on the succession of Heaven',
						body: 'Kublai Khan founded the Yuan as a Chinese-style dynasty, moved his capital to Beijing, and governed through Chinese institutions.',
						points: [
							'Yuan — Mongol emperors of China',
							'Qing — Manchu emperors of China',
							'Foreign rulers both times, but the country stayed China'
						],
						map: {
							world: modern,
							star: false,
							marks: YUAN_CHINESE_MARKS,
							fromMarks: YUAN_MARKS,
							spread: AT.beijing,
							focus: ['persia'],
							borders: true,
							labels: [
								{ lon: 112, lat: 32, text: 'Yuan' },
								{ lon: 126, lat: 46, text: 'Manchuria' },
								{ lon: 104, lat: 46, text: 'Mongolia' },
								{ lon: 86, lat: 41, text: 'Xinjiang' },
								{ lon: 88, lat: 32, text: 'Tibet' }
							],
							frame: CHINA
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/kublai.jpg',
								alt: 'Kublai Khan and his empress enthroned, a manuscript painting',
								title: 'Kublai Khan and his empress enthroned.'
							}
						]
					}
				},
				{
					left: {
						title: 'Rome’s many peoples',
						when: 'AD 244–249',
						flag: 'vexillum',
						quote: 'Marcus Julius Philippus, called the Arab.',
						by: 'Roman naming of the emperor from Shahba',
						body: 'Roman emperors came from all over the empire, including Spain, Africa, the Balkans, and Syria. Philip the Arab, from what is now southern Syria, ruled from 244 to 249.',
						map: {
							world: antique,
							star: false,
							marks: TRAJAN_MARKS,
							fromMarks: ROMAN_SEA_MARKS,
							focus: ['romeEast'],
							frame: MED
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/philip-arab.jpg',
								alt: 'Marble bust of Philip the Arab, a short-haired man in a Roman toga',
								title: 'Philip the Arab, born in Shahba in southern Syria.'
							}
						]
					},
					right: {
						title: 'America’s many peoples',
						when: '2009–2017',
						flag: 'us',
						quote: 'The United States is a Pacific power, and we are here to stay.',
						by: 'Barack Obama, Canberra, 2011',
						body: 'America is also a sea power built by people from everywhere, and its leaders show it. Obama, whose father was Kenyan, grew up in Hawaii and Indonesia.',
						map: {
							world: modern,
							period: 3,
							focus: ['romeEast'],
							frame: { lon0: -126, lon1: -66, lat0: 24, lat1: 50 }
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/obama.jpg',
								alt: 'Barack Obama seated for an official portrait in the Oval Office',
								title: 'Barack Obama, official portrait in the Oval Office.'
							}
						]
					}
				}
			]
		},
		{
			id: 'tributary',
			kicker: 'The tributary world',
			line: 'Some neighbors sent tribute without being ruled directly.',
			pairs: [
				{
					left: {
						title: 'Persian tribute',
						when: 'the Achaemenids',
						flag: 'falcon',
						quote: 'I am Darius, the great king, king of kings, king of lands.',
						by: 'Darius I, Behistun',
						body: 'Solid gold is land Persia ruled directly. Faded gold marks peoples who sent gifts instead of paying taxes, and Herodotus lists the Arabs, Ethiopians, and Colchians among them.',
						map: {
							world: antique,
							star: false,
							marks: PERSIA_TRIBUTE_MARKS,
							fromMarks: ACHAEMENID_MARKS,
							spread: AT.pasargadae,
							focus: ['persia'],
							frame: IRAN
						}
					},
					right: {
						title: 'Qing tribute',
						when: 'the Qing',
						flag: 'qing',
						quote: 'Our dynasty’s majestic virtue has penetrated into every country under Heaven.',
						by: 'Qianlong to George III, 1793',
						body: 'The Qing worked the same way. Korea, Vietnam, Siam, Burma, and Nepal sent missions to the court without being part of China. Japan is shaded too, though it had stopped sending tribute long before.',
						map: {
							world: modern,
							star: false,
							marks: QING_TRIBUTARY_MARKS,
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
			id: 'macedon',
			kicker: 'The conqueror next door',
			line: 'A small military state on the edge beats the big empire, but can’t hold on to what it takes.',
			pairs: [
				{
					left: {
						title: 'Macedon',
						when: '334–323 BC',
						flag: 'sun',
						quote: 'Is it not worthy of tears that, when the number of worlds is infinite, I have not yet become lord of one?',
						by: 'Alexander, in Plutarch',
						body: 'Macedon, on Greece’s northern edge, conquered the entire Persian Empire in about ten years. The empire split apart as soon as Alexander died.',
						map: {
							world: antique,
							star: false,
							marks: ALEXANDER_MARKS,
							fromMarks: MACEDON_MARKS,
							spread: 'east',
							focus: ['greece'],
							frame: { lon0: 12, lon1: 66, lat0: 14, lat1: 46 }
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/alexander-bust.jpg',
								alt: 'Marble portrait head of Alexander the Great, British Museum',
								title: 'Portrait head of Alexander, found in Alexandria. British Museum.'
							}
						]
					},
					right: {
						title: 'Imperial Japan',
						when: '1931–1945',
						flag: 'rising',
						quote: 'The eight corners of the world under one roof.',
						by: 'Hakkō ichiu, the empire’s slogan',
						body: 'Japan took Manchuria, most of China’s coast, and Southeast Asia, then lost all of it in 1945.',
						map: {
							world: modern,
							star: false,
							marks: JAPAN_EMPIRE_MARKS,
							fromMarks: JAPAN_HOME_MARKS,
							spread: AT.tokyo,
							focus: ['greece'],
							frame: EAST_ASIA
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/sino-japanese-takushan.jpg',
								alt: 'Ogata Gekkō, The Japanese Navy Victorious Off Takushan, Sino-Japanese War, 1894',
								title: 'Ogata Gekkō, The Japanese Navy Victorious Off Takushan, 1894, from the First Sino-Japanese War.'
							}
						]
					}
				}
			]
		},
		{
			id: 'captive-culture',
			kicker: 'The captive culture',
			line: 'The side that lost the war ended up shaping the winner’s taste.',
			pairs: [
				{
					sub: 'The original',
					line: 'What each style looks like.',
					left: {
						title: 'The Greek gods',
						when: 'the original',
						flag: 'gr',
						quote: 'Captive Greece took her savage conqueror captive.',
						by: 'Horace, Epistles 2.1',
						body: 'Zeus, Athena, and Apollo as the Greeks carved them. Rome copied this style for centuries.',
						ratio: '16 / 9',
						images: [
							{
								src: '/image_greek.jpg',
								alt: 'Zeus seated between Athena and Apollo on a Greek pediment',
								title: 'Zeus between Athena and Apollo on a Greek pediment.'
							}
						]
					},
					right: {
						title: 'The anime heroes',
						when: 'the original',
						flag: 'jp',
						quote: 'Japan has been reinventing its influence as a cultural power.',
						by: 'Douglas McGray, 2002',
						body: 'Japan lost the war, but its animation became popular around the world afterward, including in America.',
						ratio: '16 / 9',
						images: [
							{
								src: '/image_anime.jpeg',
								alt: 'A lineup of famous anime heroes standing together',
								title: 'Well-known anime characters together.'
							}
						]
					}
				},
				{
					sub: 'The early form',
					line: 'What came before each style settled into its classic form.',
					left: {
						title: 'Greece',
						when: 'c. 1550 BC',
						flag: 'gr',
						quote: 'I have found the tombs which the tradition of the whole civilized world has attributed to Agamemnon, Cassandra, and their companions.',
						by: 'Heinrich Schliemann, 1876',
						body: 'Long before classical sculpture, Mycenaean Greece made gold funeral masks like this one.',
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
						body: 'In the Meiji era, Japanese painters learned Western oil painting and adapted it to Japanese subjects. Anime later did the same thing with Western animation.',
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
			id: 'faith',
			kicker: 'The faith',
			line: 'Persia and China pair one ruler with an official belief system. Rome and America pair a republic with a civic religion.',
			pairs: [
				{
					sub: 'The throne',
					line: 'Sasanian kings had the Zoroastrian priesthood behind them. China’s leader has the Communist Party.',
					left: {
						title: 'Zoroaster’s king',
						when: 'the Sasanians',
						flag: 'kaviani',
						quote: 'A great god is Ahuramazda, who created this earth, who created yonder sky, who created man, who created happiness for man, who made Darius king.',
						by: 'Darius I, inscription at Naqsh-e Rostam',
						more: [
							{
								quote: 'I, the Mazda-worshipping lord Shapur, king of kings of Iran and non-Iran.',
								by: 'Shapur I, Naqsh-e Rostam'
							}
						],
						body: 'The Sasanian king ruled with the backing of the Zoroastrian priests and a large bureaucracy. The system was built around the throne, and it didn’t much matter who sat on it.',
					},
					right: {
						title: 'The Party',
						when: '1949 –',
						flag: 'cn',
						quote: 'The force at the core leading our cause forward is the Chinese Communist Party. The theoretical basis guiding our thinking is Marxism-Leninism.',
						by: 'Mao Zedong, opening the First Plenary Session of the CPPCC, 1949',
						more: [
							{
								quote: 'Political power grows out of the barrel of a gun.',
								by: 'Mao Zedong, 1938'
							}
						],
						body: 'The Party has an official ideology and a monopoly on power. Its officials fill roughly the role the priests did in Persia, and the general secretary sits about where the king did.',
					}
				},
				{
					sub: 'The republic',
					line: 'The religion changed over time, but the idea of the republic stuck around.',
					left: {
						title: 'From the Pantheon',
						when: 'Rome',
						flag: 'vexillum',
						quote: 'In this sign, conquer.',
						by: 'Eusebius, Life of Constantine 1.28',
						more: [
							{
								quote: 'I transferred the republic from my power to the dominion of the senate and people of Rome.',
								by: 'Augustus, Res Gestae 34'
							}
						],
						body: 'Rome went from many gods to Christianity. Emperors kept saying they ruled a republic long after the assemblies had stopped mattering.',
					},
					right: {
						title: 'Capital and the Constitution',
						when: 'America',
						flag: 'us',
						quote: 'We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.',
						by: 'The Declaration of Independence, 1776',
						more: [
							{
								quote: 'A republic, if you can keep it.',
								by: 'Benjamin Franklin, 1787, as recorded by James McHenry'
							}
						],
						body: 'What Americans are expected to share is the Constitution and the free market. Religion is a personal choice, but everyone who takes office swears an oath to the Constitution.',
					}
				}
			]
		},
		{
			id: 'factions',
			kicker: 'The factions',
			line: 'Both had two team colors that people were willing to fight over.',
			pairs: [
				{
					left: {
						title: 'Blues and Greens',
						when: 'Constantinople',
						flag: 'vexillum',
						quote: 'In every city the population has been divided for a long time past into two groups, the Blues and the Greens.',
						by: 'Procopius, Wars 1.24',
						more: [
							{
								quote: 'They care for nothing except the name of their colour, and for it they are ready to die.',
								by: 'Procopius, Wars 1.24, on the circus factions'
							}
						],
						body: 'The Blues and Greens started as chariot-racing fan clubs and turned into political gangs. In 532 they rioted and burned much of Constantinople. Justinian survived it, and so did the factions.',
					},
					right: {
						title: 'Red and Blue',
						when: 'America',
						flag: 'us',
						quote: 'Winning isn’t everything, it’s the only thing.',
						by: 'Henry Russell Sanders, 1950; later Vince Lombardi’s line',
						more: [
							{
								quote: 'There’s not a liberal America and a conservative America — there is the United States of America.',
								by: 'Barack Obama, Democratic National Convention, 2004'
							}
						],
						body: 'America has red and blue parties, plus huge sporting events like the Super Bowl. People identify with their side much the way Byzantines identified with their color.'
					}
				}
			]
		},
		{
			id: 'hired-cousins',
			kicker: 'The hired cousins',
			line: 'One people split between two rival sponsors.',
			pairs: [
				{
					left: {
						title: 'Ghassanids and Lakhmids',
						when: '500s',
						flag: 'sa',
						quote: '…and bestowed upon him the dignity of king, a thing which among the Romans had never before been done.',
						by: 'Procopius 1.17',
						body: 'Rome paid the Ghassanids and Persia paid the Lakhmids to guard the desert frontier. Both empires eventually got rid of their Arab kings.',
						map: {
							world: antique,
							period: 3,
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
						body: 'One people in two states, each backed by a superpower that finds its client a headache but can’t afford to cut it loose.',
						map: {
							world: modern,
							period: 3,
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
			line: 'A holy site that both sides had already fought over.',
			pairs: [
				{
					left: {
						title: 'Jerusalem',
						when: '614, 630, 637',
						quote: 'They captured Jerusalem and carried off the Lord’s Cross.',
						by: 'Sebeos, on 614',
						body: 'Jerusalem was Roman, then Persian from 614, then Roman again in 630. The Arabs took it in 637.',
						map: {
							world: antique,
							period: 3,
							focus: ['romeEast'],
							frame: { lon0: 33.6, lon1: 37.2, lat0: 30.6, lat1: 33.8 }
						}
					},
					right: {
						title: 'Mount Paektu',
						when: 'the shared mountain',
						quote: 'Hwanung descended to the summit of Taebaek, and under a sandalwood tree he established a sacred city.',
						by: 'Iryeon, Samguk Yusa',
						body: 'Paektu is sacred to both Koreans and Manchus, and the border between China and North Korea runs through its crater lake.',
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
			id: 'prophet',
			kicker: 'The prophet',
			line: 'It starts with one person, before there are any armies.',
			pairs: [
				{
					left: {
						title: 'Muhammad',
						when: '610–632',
						flag: 'umayyad',
						quote: 'O people, lend me an attentive ear, for I do not know whether, after this year, I shall ever be amongst you again.',
						by: 'The Farewell Sermon, as transmitted by Ibn Ishaq',
						body: 'Muhammad founded a new community in the Hejaz. The conquests came after his death.',
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
						body: 'In the story, a similar figure comes out of Korea and builds a following before any expansion happens. I’m not pointing at any real person.',
						map: {
							world: modern,
							star: false,
							marks: KOREA_UNITED_MARKS,
							fromMarks: KOREA_BEFORE_MARKS,
							spread: 'south',
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
			line: 'Before it expanded, it had to unify.',
			pairs: [
				{
					left: {
						title: 'Arabia united',
						flag: 'umayyad',
						when: '632',
						quote: 'The Arabs will recognize authority only in this clan of Quraysh.',
						by: 'Abu Bakr, in al-Tabari',
						body: 'For the first time, the whole Arabian peninsula answered to one city, Medina, while Rome and Persia were worn out from fighting each other.',
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
							spread: 'south',
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
			line: 'A newcomer takes the land the two superpowers had worn themselves out over.',
			pairs: [
				{
					left: {
						title: 'The Caliphate',
						flag: 'umayyad',
						when: '632–750',
						quote: 'Peace be upon you, O Syria, a farewell that will know no return.',
						by: 'Heraclius, as reported by al-Tabari',
						body: 'Within a century, Arab armies hold Syria, Egypt, North Africa, Spain, and nearly all of Persia.',
						map: { world: antique, period: 7, from: 4, spread: AT.medina, focus: ['caliphate'] }
					},
					right: {
						title: 'The Kaliphate',
						flag: 'unity',
						when: 'the fiction',
						quote: 'We herewith proclaim the independence of Korea and the liberty of the Korean people.',
						by: 'Korean Declaration of Independence, 1919',
						body: 'In the story, a united Korea takes all of Manchuria, north China, and Siberia. Southern China stays Chinese.',
						map: { world: modern, period: 7, from: 4, spread: AT.paektu, focus: ['caliphate'] }
					}
				}
			]
		},
		{
			id: 'language',
			kicker: 'The language world',
			line: 'The empire eventually broke up, but its language stuck in places without a strong older identity.',
			pairs: [
				{
					left: {
						title: 'The Arab world',
						flag: 'sa',
						when: 'today',
						quote: 'The vanquished always want to imitate the victor in his distinctive mark(s), his dress, his occupation, and all his other conditions and customs.',
						by: 'Ibn Khaldun, Muqaddimah',
						body: 'Arabic took North Africa and the Fertile Crescent. Iran kept Persian, and wrote it in Arabic letters.',
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
						body: 'Siberia is thinly populated, like the Maghreb was, so it switches to Korean, and so do Manchuria and Mongolia. China keeps Chinese, the way Iran kept Persian, but writes it in Hangul.',
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
				},
				{
					sub: 'The letters',
					line: 'The language survives, but the alphabet changes.',
					left: {
						title: 'Persian in Arabic letters',
						when: 'after the conquest',
						flag: 'ir',
						quote: 'Much have I suffered in these thirty years; I revived the Persians with this Persian.',
						by: 'Ferdowsi, Shahnameh',
						body: 'Before the conquest, Persian was written in the Pahlavi script. Afterward it kept its vocabulary but switched to Arabic letters. Each row shows the Pahlavi, the Arabic script, and the pronunciation.',
						examples: [
							{ old: '𐭠𐭩𐭥𐭠𐭭', from: 'ایران', sound: 'ee-RAHN', gloss: 'Iran (ʾyrʾn)', script: 'pahlavi' },
							{ old: '𐭬𐭫𐭪𐭠', from: 'شاه', sound: 'shah', gloss: 'king (written MLKA)', script: 'pahlavi' },
							{ old: '𐭠𐭥𐭦𐭥𐭠𐭭', from: 'زبان', sound: 'zah-BAHN', gloss: 'language (uzwān)', script: 'pahlavi' }
						]
					},
					right: {
						title: 'Chinese in Hangul',
						when: 'the prediction',
						flag: 'kr',
						quote: 'A wise man can acquaint himself with them before the morning is over; a stupid man can learn them in the space of ten days.',
						by: 'Hunminjeongeum Haerye, 1446',
						body: 'In the story, Chinese keeps its words but is written in Hangul, the way Persian switched to Arabic letters. Each row shows the characters, the Hangul, and the pronunciation.',
						examples: [
							{ old: '中国', from: '중궈', sound: 'joong-gwor', gloss: 'China' },
							{ old: '北京', from: '베이징', sound: 'bay-JING', gloss: 'Beijing' },
							{ old: '你好', from: '니하오', sound: 'nee-HOW', gloss: 'hello' }
						]
					}
				}
			]
		},
		{
			id: 'long-war',
			kicker: 'The long war',
			line: 'After that come centuries of war with the remaining superpower.',
			pairs: [
				{
					left: {
						title: 'The Caliphate and Rome',
						when: '700–1100',
						quote: 'They have been at war with the Romans for a long time, and have become experienced in military matters.',
						by: 'Leo VI, Taktika 18',
						body: 'With Persia gone, Rome and the Caliphate fought on and off for about four hundred years, and neither side won outright.',
						map: {
							world: antique,
							period: 6,
							from: 7,
							spread: 'east',
							focus: ['romeEast', 'caliphate']
						}
					},
					right: {
						title: 'The Kaliphate and America',
						when: 'the fiction',
						quote: 'Whosoever commands the sea commands the trade… and consequently the world itself.',
						by: 'Sir Walter Raleigh',
						body: 'In the story, once China is worn down, the Kaliphate’s main rival is America across the Pacific, and neither side wins outright.',
						map: { world: modern, period: 7, focus: ['caliphate', 'romeEast'] }
					}
				}
			]
		},
		{
			id: 'core',
			kicker: 'The country',
			line: 'Under each empire is a core country that survives when the empire doesn’t.',
			pairs: [
				{
					left: {
						title: 'Persia proper',
						when: 'the plateau',
						quote: 'I am a Persian, son of a Persian, an Aryan of Aryan stock.',
						by: 'Darius I, Naqsh-e Rostam',
						body: 'The Iranian plateau. Every Persian empire started here, and shrank back to it when it lost territory.',
						map: {
							world: antique,
							star: false,
							marks: PLATEAU_MARKS,
							fromMarks: PLATEAU_MARKS,
							focus: ['persia'],
							frame: IRAN
						},
						ratio: '4 / 3'
					},
					right: {
						title: 'China proper',
						when: 'the old provinces',
						quote: 'He built the Long Wall… from Lintao to Liaodong, more than ten thousand li.',
						by: 'Sima Qian, Records of the Grand Historian',
						body: 'The old provinces inside the Great Wall. Manchuria, Mongolia, and Tibet were added later, around the edges.',
						map: {
							world: modern,
							star: false,
							marks: CHINA_PROPER_MARKS,
							fromMarks: CHINA_PROPER_MARKS,
							focus: ['persia'],
							frame: CHINA
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/forbidden-city.jpg',
								alt: 'The Forbidden City under a winter sky',
								title: 'The Forbidden City in Beijing.'
							}
						]
					}
				}
			]
		},
		{
			id: 'parts',
			kicker: 'The provinces',
			line: 'The regions each empire usually held, and the ones it fought over.',
			pairs: [
				{
					left: {
						title: 'Persia’s limbs',
						when: 'the usual map',
						flag: 'ir',
						quote: 'I am Darius, the great king, king of kings… king of the countries containing all kinds of men.',
						by: 'Darius I, Behistun',
						body: 'Around the plateau are the regions that Persian empires kept gaining and losing.',
						points: [
							'Persia proper — the plateau',
							'Mesopotamia',
							'Eastern Arabia',
							'The Caucasus',
							'Khorasan',
							'In contention with Rome: Levant, Egypt, Anatolia, Armenia'
						],
						map: {
							world: antique,
							star: false,
							marks: PERSIA_PARTS_MARKS,
							fromMarks: PLATEAU_MARKS,
							spread: AT.istakhr,
							focus: ['persia'],
							borders: true,
							labels: [
								{ lon: 54, lat: 32, text: 'Persia' },
								{ lon: 44, lat: 33, text: 'Mesopotamia' },
								{ lon: 55, lat: 23, text: 'E. Arabia' },
								{ lon: 44, lat: 41, text: 'Caucasus' },
								{ lon: 61, lat: 35.5, text: 'Khorasan' },
								{ lon: 35.5, lat: 33.5, text: 'Levant' },
								{ lon: 30, lat: 27, text: 'Egypt' },
								{ lon: 32, lat: 39, text: 'Anatolia' }
							],
							frame: { lon0: 20, lon1: 72, lat0: 12, lat1: 46 }
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/babylon.jpg',
								alt: 'The Ishtar Gate, the glazed-brick gate of Babylon',
								title: 'The Ishtar Gate of Babylon, in Mesopotamia.'
							}
						]
					},
					right: {
						title: 'China’s limbs',
						when: 'the usual map',
						flag: 'cn',
						quote: 'All under Heaven is the king’s land; the people on the shores are the king’s subjects.',
						by: 'Classic of Poetry, Xiaoya',
						body: 'Around China proper are the outer regions China governs today. The island chain offshore is about influence, not territory.',
						points: [
							'China proper',
							'Manchuria',
							'Inner Mongolia',
							'Xinjiang',
							'Tibet',
							'In contention with America (influence): Taiwan, Korea, Japan, Philippines'
						],
						map: {
							world: modern,
							star: false,
							marks: CHINA_PARTS_MARKS,
							fromMarks: CHINA_PROPER_MARKS,
							spread: AT.beijing,
							focus: ['persia'],
							borders: true,
							labels: [
								{ lon: 112, lat: 31, text: 'China' },
								{ lon: 126, lat: 46, text: 'Manchuria' },
								{ lon: 112, lat: 43, text: 'Inner Mongolia' },
								{ lon: 85, lat: 41, text: 'Xinjiang' },
								{ lon: 88, lat: 32, text: 'Tibet' },
								{ lon: 121, lat: 23.5, text: 'Taiwan' },
								{ lon: 127.5, lat: 36.5, text: 'Korea' },
								{ lon: 138, lat: 36, text: 'Japan' },
								{ lon: 122, lat: 12, text: 'Philippines' }
							],
							frame: EAST_ASIA
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/great-wall.jpg',
								alt: 'The Great Wall of China at Jinshanling',
								title: 'The Great Wall at Jinshanling, roughly the northern edge of China proper.'
							}
						]
					}
				}
			]
		},
		{
			id: 'broken',
			kicker: 'The invader',
			line: 'A smaller neighbor invades the big empire and takes much of it, at least for a while.',
			pairs: [
				{
					left: {
						title: 'Alexander',
						when: '334–323 BC',
						flag: 'sun',
						quote: 'Is it not worthy of tears that, when the number of worlds is infinite, I have not yet become lord of one?',
						by: 'Alexander, in Plutarch',
						body: 'Macedon brought down the Achaemenid empire in about ten years. Gold is the Persian empire, and blue shows how far Alexander got.',
						map: {
							world: antique,
							star: false,
							marks: ALEXANDER_MARKS,
							fromMarks: ACHAEMENID_MARKS,
							spread: 'east',
							focus: ['greece'],
							frame: { lon0: 12, lon1: 66, lat0: 14, lat1: 46 }
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/alexander.jpg',
								alt: 'The Alexander Mosaic, Alexander on horseback at the battle of Issus',
								title: 'The Alexander Mosaic from Pompeii, showing Alexander charging the Persian line at Issus.'
							}
						]
					},
					right: {
						title: 'Imperial Japan',
						when: '1931–1945',
						flag: 'rising',
						quote: 'The eight corners of the world under one roof.',
						by: 'Hakkō ichiu, the empire’s slogan',
						body: 'Japan took Manchuria and most of eastern China, never reached the west, and lost everything it had taken in 1945.',
						map: {
							world: modern,
							star: false,
							marks: JAPAN_1942_ALONE_MARKS,
							fromMarks: QING_MARKS,
							spread: AT.tokyo,
							focus: ['greece'],
							frame: EAST_ASIA
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/sino-japanese-yalu.jpg',
								alt: 'Kobayashi Kiyochika, The Battle of the Yalu River, 1894',
								title: 'Kobayashi Kiyochika, The Battle of the Yalu River, 1894.'
							}
						]
					}
				}
			]
		},
		{
			id: 'humiliation',
			kicker: 'The humiliation',
			line: 'Foreigners rule the old country, or carve off its edges, for more than a century. It does not forget.',
			pairs: [
				{
					left: {
						title: 'The Seleucids',
						when: '312–141 BC',
						flag: 'sun',
						quote: 'Antiochus, the great king, the legitimate king, king of the world, king of Babylon, king of the lands.',
						by: 'Antiochus I, the Antiochus Cylinder, 268 BC',
						body: 'After Alexander died, one of his generals kept Persia. For about 170 years, Greek kings ruled it from Syria and Babylon. The other Greek kingdoms are pale blue.',
						map: {
							world: antique,
							star: false,
							marks: SELEUCID_MARKS,
							fromMarks: ALEXANDER_MARKS,
							focus: ['greece'],
							labels: [
								{ lon: 51, lat: 33, text: 'Seleucids' },
								{ lon: 30.5, lat: 27, text: 'Ptolemies' },
								{ lon: 22.5, lat: 38.8, text: 'Macedon' },
								{ lon: 66, lat: 29, text: 'Mauryas' }
							],
							frame: { lon0: 18, lon1: 70, lat0: 20, lat1: 46 }
						}
					},
					right: {
						title: 'The century of humiliation',
						when: '1839–1949',
						flag: 'qing',
						quote: 'The Island of Hongkong, to be possessed in perpetuity by Her Britannic Majesty, Her Heirs and Successors.',
						by: 'Treaty of Nanking, Article III, 1842',
						body: 'After the Opium Wars and the unequal treaties, Britain, France, Russia, and Japan carved off China’s edges. China proper survived, and China still remembers.',
						map: {
							world: modern,
							star: false,
							marks: HUMILIATION_MARKS,
							fromMarks: QING_TRIBUTARY_MARKS,
							focus: ['greece', 'romeWest', 'steppe'],
							labels: [
								{ lon: 136, lat: 52, text: 'Russia, 1860' },
								{ lon: 127, lat: 47.5, text: 'Manchukuo, 1932' },
								{ lon: 121.5, lat: 23.6, text: 'Japan, 1895' },
								{ lon: 96, lat: 23.5, text: 'Britain, 1886' },
								{ lon: 106, lat: 15.5, text: 'France, 1885' }
							],
							frame: CHINA
						}
					}
				}
			]
		},
		{
			id: 'parthian',
			kicker: 'The successor',
			line: 'After the big empire falls, a smaller state holds the core together.',
			pairs: [
				{
					left: {
						title: 'The Parthians',
						when: '247 BC – AD 224',
						flag: 'arsacid',
						quote: 'Having divided the world with the Romans, they held the empire of the east.',
						by: 'Justin, Epitome 41.1',
						body: 'The Arsacids took Iran and Mesopotamia back from Alexander’s successors, but they stopped at the Euphrates and never held Egypt.',
						map: {
							world: antique,
							star: false,
							marks: PARTHIAN_MARKS,
							fromMarks: SELEUCID_MARKS,
							spread: AT.nisa,
							focus: ['persia'],
							frame: { lon0: 32, lon1: 68, lat0: 24, lat1: 42 }
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/parthian-coin.jpg',
								alt: 'A Parthian silver coin, a bearded king in a diadem and a standing figure on the reverse',
								title: 'A silver coin of a Parthian king.'
							}
						]
					},
					right: {
						title: 'The Republic of China',
						when: '1912–1949',
						flag: 'roc',
						quote: 'The revolution is not yet complete. Let all our comrades strive on.',
						by: 'Sun Yat-sen, political testament, 1925',
						body: 'After the Qing fell, the Republic claimed most of what the PRC holds today, minus Tibet. Warlords, the Japanese invasion, and the civil war meant it never really governed all of it.',
						map: {
							world: modern,
							star: false,
							marks: ROC_MARKS,
							fromMarks: QING_MARKS,
							spread: AT.wuchang,
							focus: ['persia'],
							frame: CHINA
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/sun-yat-sen.jpg',
								alt: 'Portrait of Sun Yat-sen',
								title: 'Sun Yat-sen, the Republic’s founding father.'
							}
						]
					}
				}
			]
		},
		{
			id: 'conquest',
			kicker: 'The Greco-Roman wars',
			line: 'Rome fought the Greek states on and off for about a century and ended up conquering all of Greece.',
			pairs: [
				{
					left: {
						title: 'The Greco-Roman wars',
						when: '214–146 BC',
						flags: ['sun', 'vexillum'],
						quote: 'I saw pictures thrown upon the ground, and soldiers playing at dice on them.',
						by: 'Polybius, on the sack of Corinth, via Strabo 8.6.23',
						body: 'First came the Macedonian Wars, then the Achaean War. Rome destroyed Corinth in 146 BC, and from then on all of Greece was under Roman rule.',
						map: {
							world: antique,
							star: false,
							marks: GRECO_ROMAN_WAR_MARKS,
							fromMarks: ROME_BEFORE_GREECE_MARKS,
							spread: [15.5, 41.5],
							focus: ['romeEast'],
							frame: { lon0: -8, lon1: 30, lat0: 32, lat1: 46 }
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/pyrrhus.jpg',
								alt: 'A bronze coin of Pyrrhus of Epirus, his profile and his name in Greek',
								title: 'A coin of Pyrrhus of Epirus, the first Greek king to fight Rome. He won his battles but lost the war.'
							}
						]
					},
					right: {
						title: 'The Pacific War',
						when: '1941–1945',
						flags: ['rising', 'us'],
						quote: 'It is for self-existence and self-defense that we have taken up arms.',
						by: 'Hideki Tōjō, address to the Diet, December 1941',
						more: [
							{
								quote: 'Today the guns are silent. A great tragedy has ended. A great victory has been won.',
								by: 'Douglas MacArthur, Tokyo Bay, 2 September 1945'
							}
						],
						body: 'Japan struck first and won the early battles, but couldn’t replace the ships and planes it lost. It surrendered in 1945, was occupied, and has stayed under American military protection ever since, much as Greece stayed under Rome.',
						map: {
							world: modern,
							star: false,
							marks: PACIFIC_WAR_MARKS,
							fromMarks: JAPAN_EMPIRE_MARKS,
							spread: [147.5, 34.5],
							focus: ['romeEast'],
							frame: { lon0: 124, lon1: 152, lat0: 24, lat1: 46 }
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/iwo-jima.jpg',
								alt: 'US Marines raising the flag on Iwo Jima, February 1945',
								title: 'Marines raising the flag on Iwo Jima, February 1945.'
							}
						]
					}
				}
			]
		},
		{
			id: 'philhellene',
			kicker: 'The admirers',
			line: 'The winners became fans of the culture they had beaten.',
			pairs: [
				{
					left: {
						title: 'The philhellene',
						when: 'after the conquest',
						flag: 'gr',
						quote: 'Captive Greece took her savage conqueror captive.',
						by: 'Horace, Epistles 2.1',
						body: 'Romans conquered Greece and then spent centuries collecting its art and copying its style. Hadrian was the most famous Greek enthusiast, and his companion Antinous became a symbol of it.',
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/antinous.jpg',
								alt: 'Marble bust of Antinous, a young man with curled hair, in profile',
								title: 'Antinous, Hadrian’s companion. National Archaeological Museum, Athens.'
							}
						]
					},
					right: {
						title: 'The Japanophile',
						when: 'after the war',
						flag: 'jp',
						quote: 'Japan has been reinventing its influence as a cultural power.',
						by: 'Douglas McGray, 2002',
						body: 'Japan lost the war, but its culture spread anyway. The American anime fan is the modern version of the Roman philhellene.',
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/anime-ensemble.jpg',
								alt: 'A lineup of famous anime heroes standing together',
								title: 'Anime characters that became popular worldwide after the war.'
							}
						]
					}
				}
			]
		},
		{
			id: 'tribes',
			kicker: 'The peoples there',
			line: 'Thinly populated land with useful resources, held for a long time by one empire.',
			pairs: [
				{
					left: {
						title: 'The Berber tribes',
						when: 'before Islam',
						quote: 'They are the most numerous of peoples, and their tribes and subtribes are beyond counting.',
						by: 'Ibn Khaldun, on the Berbers',
						body: 'Before Arabic arrived, North Africa was Berber: the Mauri, Numidians, Gaetuli, and Garamantes. The map shows rough homelands, not exact borders.',
						map: {
							world: antique,
							star: false,
							marks: BERBER_TRIBE_MARKS,
							fromMarks: BERBER_TRIBE_MARKS,
							spread: [3, 36],
							focus: ['people'],
							frame: { lon0: -12, lon1: 25, lat0: 22, lat1: 38 }
						},
						ratio: '3 / 4',
						images: [
							{
								src: '/blog/caliphate/kabyle.jpg',
								alt: 'A Kabyle woman in a silver headdress and jewelry',
								title: 'A Kabyle woman in Algeria. The Kabyles are Amazigh, descendants of the ancient Mauri and Numidians.'
							},
							{
								src: '/blog/caliphate/tuareg.jpg',
								alt: 'A nineteenth-century engraving of Tuareg men, one standing with a spear and one mounted on a camel',
								title: 'Tuareg in the Sahara, an engraving from Le Tour du monde.',
								ratio: '4 / 3'
							}
						]
					},
					right: {
						title: 'The peoples of Siberia',
						when: 'inside Russia',
						quote: 'The Yakut call themselves Sakha.',
						by: 'The people’s own name, along the Lena',
						body: 'Siberia’s native peoples are still there: the Khanty on the Ob, the Evenks, Sakha, Tuvans, Buryats, and Nanai, spread thinly over a huge area.',
						map: {
							world: modern,
							star: false,
							marks: SIBERIA_TRIBE_MARKS,
							fromMarks: SIBERIA_TRIBE_MARKS,
							spread: [129.7, 62.0],
							focus: ['people'],
							frame: { lon0: 60, lon1: 150, lat0: 46, lat1: 72 }
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/yakut.jpg',
								alt: 'A nineteenth-century picture of Sakha people in fur and embroidered coats beside a river',
								title: 'Sakha (Yakuts) on the Lena, nineteenth century.'
							},
							{
								src: '/blog/caliphate/khanty.jpg',
								alt: 'A late nineteenth-century photograph of a Khanty family group with sleds and fishing nets',
								title: 'A Khanty family on the Ob, late nineteenth century. Russians used to call them Ostyaks.'
							}
						]
					}
				},
				{
					sub: 'The empty west',
					line: 'Both regions had few people, a long stretch under one empire, and resources their neighbors wanted.',
					left: {
						title: 'The Maghreb',
						when: 'Rome, then the Arabs',
						flag: 'vexillum',
						quote: 'Africa was the granary of the Roman people.',
						by: 'on the African provinces, a later summary of the grain fleet',
						body: 'North Africa had few people and no big native state. Rome held it for centuries, and when the Caliphate took it, Arabic gradually replaced the older languages across much of the region.',
						points: [
							'Historically sparse, not a dense state',
							'One empire held it for centuries: Rome',
							'Grain and oil for the power across the sea'
						],
						map: {
							world: antique,
							star: false,
							marks: ROMAN_SEA_MARKS,
							fromMarks: BERBER_TRIBE_MARKS,
							spread: [3, 36],
							focus: ['romeEast'],
							frame: { lon0: -12, lon1: 25, lat0: 22, lat1: 38 }
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/volubilis.jpg',
								alt: 'The Arch of Caracalla at Volubilis in Morocco',
								title: 'The Arch of Caracalla at Volubilis, in Morocco.'
							},
							{
								src: '/blog/caliphate/maghreb-mosaic.jpg',
								alt: 'The Triumph of Bacchus mosaic from Sousse, Roman North Africa',
								title: 'A Roman mosaic from Sousse, Tunisia. The province had few people but plenty of money.',
								ratio: '4 / 3'
							}
						]
					},
					right: {
						title: 'Siberia',
						when: 'Russia, then the fiction',
						flag: 'kr',
						quote: 'Siberia is a country that could feed the world, if it were filled.',
						by: 'a later commonplace on the Russian east',
						body: 'Siberia is similar: few people and centuries of Russian rule. In the story, the Kaliphate takes it and Korean becomes the main language.',
						points: [
							'Historically sparse, not a dense state',
							'One empire held it for centuries: Russia',
							'Oil, gas, and timber East Asia would want'
						],
						map: {
							world: modern,
							star: false,
							marks: [
								{ iso: 'RUS', color: 'steppe' },
								{ iso: 'CHN', color: 'persia', alpha: 0.2 },
								{ iso: 'MNG', color: 'persia', alpha: 0.2 }
							],
							fromMarks: SIBERIA_TRIBE_MARKS,
							spread: [129.7, 62.0],
							focus: ['steppe'],
							frame: { lon0: 60, lon1: 150, lat0: 46, lat1: 72 }
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/siberia-railway.jpg',
								alt: 'View from a train on the Trans-Siberian Railway',
								title: 'The view from a Trans-Siberian train.'
							},
							{
								src: '/blog/caliphate/siberia-gas.jpg',
								alt: 'A gas field in Western Siberia',
								title: 'A gas field in Western Siberia.',
								ratio: '4 / 3'
							}
						]
					}
				}
			]
		},
		{
			id: 'final-war',
			kicker: 'The final war',
			line: 'In the story, China moves first, America pushes back, and the border ends up about where it started. Use the slider to step through the years.',
			pairs: []
		},
		{
			id: 'predictions',
			kicker: 'Further predictions',
			line: 'A few more guesses about what could come next.',
			pairs: [
				{
					sub: 'Byzantine America',
					line: 'The old power survives, but it’s past its peak.',
					left: {
						title: 'The city that remained',
						when: 'after 476',
						flag: 'vexillum',
						quote: 'Yet they continued to reign over the East, from the Danube to the Nile and Tigris.',
						by: 'Gibbon, Decline and Fall, ch. 38',
						body: 'Constantinople still called itself Rome and lasted for centuries, but it never got back to the size or wealth of Trajan’s empire.',
						map: {
							world: antique,
							period: 6,
							from: 7,
							spread: 'east',
							focus: ['romeEast', 'caliphate']
						},
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/hagia.jpg',
								alt: 'Hagia Sophia in Istanbul',
								title: 'Hagia Sophia in Istanbul, once Constantinople.'
							}
						]
					},
					right: {
						title: 'Byzantine America',
						when: 'after the Kaliphate',
						flag: 'us',
						quote: 'The United States is a Pacific power, and we are here to stay.',
						by: 'Barack Obama, Canberra, 2011',
						body: 'In the story, America is still around, still has its navy, and still backs Japan and Taiwan. It just isn’t at its peak anymore.',
						map: { world: modern, period: 6, focus: ['romeEast', 'caliphate'] },
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/capitol.jpg',
								alt: 'The west front of the United States Capitol',
								title: 'The west front of the United States Capitol.'
							}
						]
					}
				},
				{
					sub: 'The North Korean incident',
					line: 'Khosrow got rid of his own Arab client king, which left the desert frontier wide open.',
					left: {
						title: 'The end of the Lakhmids',
						when: 'c. 602',
						flag: 'kaviani',
						quote: 'He put al-Nuʿmān to death, and the kingdom of al-Ḥīra was abolished.',
						by: 'al-Tabari, on Khosrow II',
						body: 'Around 602, Khosrow II had the Lakhmid king killed. As a result:',
						points: [
							'No Arab king in al-Hira',
							'A Persian governor instead',
							'No buffer state left on the desert frontier'
						],
						map: {
							world: antique,
							period: 3,
							focus: CLIENTS.antique,
							frame: { lon0: 32, lon1: 56, lat0: 12, lat1: 37 }
						}
					},
					right: {
						title: 'The North Korean incident',
						when: 'the prediction',
						flags: ['cn', 'kp'],
						quote: 'When whales fight, the shrimp’s back is broken.',
						by: 'Korean proverb',
						body: 'Something big happens in North Korea in the next few decades. Some possibilities:',
						points: [
							'Kim Jong-Un succession crisis',
							'China tries annexing DPRK',
							'Major AI / crypto hack'
						],
						map: {
							world: modern,
							period: 3,
							focus: CLIENTS.modern,
							frame: { lon0: 124, lon1: 131, lat0: 33, lat1: 43.5 }
						}
					}
				},
				{
					sub: 'The New Silicon Age',
					line: 'The Caliphate became a center of learning, and in the story the Kaliphate does the same with AI.',
					left: {
						title: 'The House of Wisdom',
						when: 'the Abbasids',
						flag: 'umayyad',
						quote: 'They translated the sciences of the Greeks, the Persians, and the Indians into Arabic.',
						by: 'on the Bayt al-Ḥikma, a later summary of the age',
						body: 'Under the Abbasids, Baghdad brought together translators, astronomers, and doctors, and became the center of learning in the Islamic Golden Age.',
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/astrolabe.jpg',
								alt: 'A Persian astrolabe of engraved brass',
								title: 'A Persian astrolabe.'
							}
						]
					},
					right: {
						title: 'The New Silicon Age',
						when: 'the prediction',
						flag: 'sa',
						quote: 'Knowledge is the lost property of the believer.',
						by: 'a saying attributed in later collections',
						body: 'In the story, the Kaliphate leads in AI the way Baghdad once led in astronomy and medicine.',
						points: [
							'Research labs and endowments across the Kaliphate',
							'Korean as a major language for AI models',
							'Researchers drawn in from China and beyond, the way Baghdad drew Persian and Greek scholarship'
						],
						ratio: '4 / 3',
						images: [
							{
								src: '/blog/caliphate/abbasid-library.jpg',
								alt: 'Scholars reading in a medieval library, from the Maqamat of al-Hariri',
								title: 'Scholars in a library, from the Maqamat of al-Hariri.'
							}
						]
					}
				}
			]
		}
	];

	const chapters = [
		{
			id: 'rome',
			kicker: 'Rome and America',
			line: 'Each grows from a small republic into a superpower, splits into two halves, and watches its western half decline.',
			sections: ['seed', 'reach', 'claim', 'two-romes', 'west-falls', 'house']
		},
		{
			id: 'persia',
			kicker: 'The Eastern Realm',
			line: 'Persia and China.',
			sections: ['core', 'parts', 'width', 'tributary', 'broken', 'humiliation', 'parthian', 'comeback', 'absorb']
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
			line: 'The long standoff, and the war that leaves both sides exhausted.',
			sections: ['two-eyes', 'faith', 'factions', 'final-war']
		},
		{
			id: 'kaliphate',
			kicker: 'The Kaliphate',
			line: 'The made-up part, plus a few predictions.',
			sections: ['third-power', 'long-war', 'predictions']
		}
	].map((chapter) => ({
		...chapter,
		sections: chapter.sections.map((id) => groups.find((group) => group.id === id)).filter(Boolean)
	}));
</script>

{#snippet cell(item, tone)}
	<article class={tone}>
		<header class="slot-head">
			<strong>
				{#each item.flags ?? (item.flag ? [item.flag] : []) as id (id)}
					<Flag {id} />
				{/each}
				{item.title}
			</strong>
			<span>{item.when}</span>
		</header>
		<div class="slot-quote">
			{#if item.quote}
				<blockquote>
					<p>“{item.quote}”</p>
					<cite>{item.by}</cite>
				</blockquote>
			{/if}
		</div>
		<div class="slot-map">
			{#if item.map}
				<Inset map={item.map} label="{item.title}, {item.when}" />
			{/if}
		</div>
		<div class="slot-images">
			{#if item.images?.length}
				<FitImages images={item.images} ratio={item.ratio ?? '4 / 3'} />
			{/if}
		</div>
		<div class="slot-body">
			{#if item.body}
				<p>{item.body}</p>
			{/if}
			{#if item.points?.length}
				<ul class="points">
					{#each item.points as line (line)}
						<li>{line}</li>
					{/each}
				</ul>
			{/if}
			{#if item.examples?.length}
				<ul class="script">
					{#each item.examples as row (`${row.from}-${row.sound ?? row.to}`)}
						<li>
							{#if row.old}
								<span class={['old', row.script]}>{row.old}</span>
							{/if}
							<span class="from">{row.from}</span>
							{#if row.sound}
								<span class="sound">{row.sound}</span>
							{:else if row.to}
								<span class="to">{row.to}</span>
							{/if}
							<span class="gloss">{row.gloss}</span>
						</li>
					{/each}
				</ul>
			{/if}
			{#each item.links ?? [] as link (link.href)}
				<a href={link.href}>{link.label}</a>
			{/each}
		</div>
	</article>
{/snippet}

<section class="compare" aria-label="Parallels">
	{#each chapters as chapter (chapter.id)}
		<h2 id={chapter.id} class="chapter">{chapter.kicker}</h2>
		<p class="thesis">{chapter.line}</p>
		{#each chapter.sections as section (`${chapter.id}-${section.id}`)}
			<h3 id="{chapter.id}-{section.id}" class="sub">{section.kicker}</h3>
			<p class="thesis nested">{section.line}</p>
			{#if section.id === 'final-war'}
				<FinalWar />
			{:else}
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
			{/if}
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

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: auto auto auto auto 1fr;
		column-gap: 0.9rem;
		row-gap: 0;
		margin-bottom: 1rem;
		align-items: stretch;
	}

	.row > article {
		display: grid;
		grid-template-rows: subgrid;
		grid-row: 1 / -1;
		min-width: 0;
	}

	.slot-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: 1.7rem;
		margin: 0 0 0.45rem;
	}

	.slot-head strong {
		display: flex;
		align-items: center;
		min-width: 0;
		color: var(--ink);
		font-size: 1.02rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.slot-head :global(.flag) {
		width: 1.28em;
		height: 0.86em;
		max-width: 1.28em;
		max-height: 0.86em;
		margin: 0 0.35em 0 0;
		flex: none;
		object-fit: cover;
	}

	.slot-head span {
		flex: none;
		color: var(--ink-3);
		font-size: 0.78rem;
		font-style: italic;
		font-weight: 450;
	}

	.slot-quote {
		min-height: 4.2em;
	}

	.slot-map :global(.map canvas) {
		width: 100%;
		aspect-ratio: 1;
		height: auto;
	}

	.slot-images :global(.fits) {
		margin: 0.55rem 0 0;
	}

	.slot-body {
		display: flex;
		flex-direction: column;
	}

	.points {
		margin: 0.15rem 0 0.5rem;
		padding-left: 1.1rem;
		color: var(--ink);
		font-size: 0.98rem;
		line-height: 1.45;
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
		grid-template-columns: auto auto 1fr auto;
		gap: 0.55rem 0.7rem;
		align-items: baseline;
		padding: 0.35rem 0;
		border-top: 1px solid color-mix(in srgb, var(--ink, #1c1b18) 12%, transparent);
	}

	.script .old {
		font-size: 1.12rem;
		letter-spacing: 0.01em;
	}

	.script .old.pahlavi {
		font-family: 'Noto Sans Inscriptional Pahlavi', serif;
		font-size: 1.25rem;
		letter-spacing: 0.06em;
		direction: rtl;
		unicode-bidi: isolate;
	}

	.script .from {
		font-size: 1.12rem;
		letter-spacing: 0.01em;
	}

	.script .to {
		font-size: 1.05rem;
	}

	.script .sound {
		color: var(--ink-2);
		font-family: var(--mono, ui-monospace, monospace);
		font-size: 0.82rem;
		letter-spacing: 0.01em;
	}

	.script .gloss {
		color: var(--ink-3, #6d6860);
		font-size: 0.75rem;
		font-style: italic;
	}

	.compare article {
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

	.slot-body > p {
		margin: 0.55rem 0 0.45rem;
		color: var(--ink);
		font-size: 0.98rem;
		line-height: 1.45;
	}

	.compare article blockquote {
		margin: 0 0 0.55rem;
		padding: 0.55rem 0 0;
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
			grid-template-rows: none;
		}

		.row > article {
			display: flex;
			flex-direction: column;
			grid-row: auto;
		}

		.script li {
			grid-template-columns: auto 1fr;
		}

		.script .gloss {
			grid-column: 1 / -1;
		}
	}
</style>
