/**
 * The paintings that can hang on the wall, with their real sizes in centimeters (width, height)
 * so each frame takes the painting's own shape.
 * @typedef {{
 *   id: string, title: string, by: string, year: string, place: string, note: string,
 *   wiki: string, image: string, size: [number, number]
 * }} Painting
 */

/** @type {Painting[]} */
export const PAINTINGS = [
	{
		id: 'fallen-angel',
		title: 'The Fallen Angel',
		by: 'Alexandre Cabanel',
		year: '1847',
		place: 'Musée Fabre, Montpellier',
		note: 'Lucifer just after the fall, lying on a rock with his arms crossed over his face — except for his eyes, red-rimmed with a tear in them, glaring back up at the heaven he lost. Painted when Cabanel was twenty-four.',
		wiki: 'Fallen_Angel_(Cabanel)',
		image: '/paintings/fallen-angel.jpg',
		size: [189.7, 121]
	},
	{
		id: 'david-goliath',
		title: 'David with the Head of Goliath',
		by: 'Caravaggio',
		year: '1610',
		place: 'Galleria Borghese, Rome',
		note: 'David holds up the giant’s head and looks at it with something nearer pity than triumph. The head is Caravaggio’s own face; he painted it while on the run for murder and sent it to Rome hoping for a pardon.',
		wiki: 'David_with_the_Head_of_Goliath_(Caravaggio,_Rome)',
		image: '/paintings/david-goliath.jpg',
		size: [101, 125]
	},
	{
		id: 'death-of-marat',
		title: 'The Death of Marat',
		by: 'Jacques-Louis David',
		year: '1793',
		place: 'Royal Museums of Fine Arts of Belgium, Brussels',
		note: 'Marat dead in his bath, Charlotte Corday’s letter still in his hand. David was his friend, and painted him the way a dead Christ is painted, with the bare wall above taking up half the canvas.',
		wiki: 'The_Death_of_Marat',
		image: '/paintings/death-of-marat.jpg',
		size: [128, 165]
	},
	{
		id: 'triumph-christianity',
		title: 'The Triumph of Christianity',
		by: 'Tommaso Laureti',
		year: '1585',
		place: 'Hall of Constantine, Vatican Museums',
		note: 'On the ceiling of the Hall of Constantine: a pagan statue lies smashed on the marble floor below the plinth it fell from, and a crucifix stands where it stood.',
		wiki: 'Tommaso_Laureti',
		image: '/paintings/triumph-christianity.jpg',
		size: [116, 100]
	},
	{
		id: 'zhang-fei',
		title: 'Zhang Fei at Changban Bridge Glares Back at the Enemy Force of a Million',
		by: 'Tsukioka Yoshitoshi',
		year: '1884',
		place: 'Museum of Fine Arts, Boston',
		note: 'From the Illustrated Romance of the Three Kingdoms. Zhang Fei holds the bridge alone with a handful of riders, and his roar turns Cao Cao’s whole army back. A woodblock triptych, three sheets wide.',
		wiki: 'Tsukioka_Yoshitoshi',
		image: '/paintings/zhang-fei.jpg',
		size: [72, 36.4]
	},
	{
		id: 'dano',
		title: 'Scenery on Dano Day',
		by: 'Shin Yun-bok',
		year: 'c. 1805',
		place: 'Kansong Art Museum, Seoul',
		note: 'Dano, the fifth day of the fifth month: women wash their hair in a mountain stream and swing from the trees, while two boys from the temple spy on them from behind the rocks. From the Hyewon album, a National Treasure of Korea.',
		wiki: 'Shin_Yun-bok',
		image: '/paintings/dano.jpg',
		size: [35.6, 28.3]
	},
	{
		id: 'daily-bread',
		title: 'Give Us This Day Our Daily Bread',
		by: 'James Clarke Hook',
		year: '1866',
		place: 'Sudley House, Liverpool',
		note: 'A herring crew pushing off under the cliffs at St Abb’s Head, the title taken from the Lord’s Prayer. The catch is the bread.',
		wiki: 'James_Clarke_Hook',
		image: '/paintings/daily-bread.jpg',
		size: [100, 70.9]
	}
];
