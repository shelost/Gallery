/**
 * Furniture built from primitives. Each piece is drawn in its own frame: metres, centred on its
 * footprint, standing on y = 0, and used from its +z side (where you sit, cook or lift from).
 * Add a piece here and place it in plan.js by its key.
 */

/** @typedef {import('./materials.js').Finish} Finish */
/** @typedef {[number, number, number]} Vec3 */
/** @typedef {{ shape: 'box' | 'cylinder' | 'sphere', size: number[], at: Vec3, rotation?: Vec3, round?: number, finish: Finish }} Part */

/** Rotations that lay a y-axis cylinder along each axis. @type {Record<'x' | 'y' | 'z', Vec3>} */
const LYING = { x: [0, 0, Math.PI / 2], y: [0, 0, 0], z: [Math.PI / 2, 0, 0] };

/**
 * A box standing at height `y`, with optionally rounded edges.
 * @param {Finish} finish
 * @param {Vec3} size
 * @param {Partial<Vec3>} [at]
 * @param {number} [round]
 * @returns {Part}
 */
function block(finish, [w, h, d], [x = 0, y = 0, z = 0] = [], round = 0) {
	return { shape: 'box', size: [w, h, d], at: [x, y + h / 2, z], round, finish };
}

/**
 * A cylinder centred on `at`, its length along `axis`.
 * @param {Finish} finish
 * @param {number} radius
 * @param {number} length
 * @param {Vec3} at
 * @param {'x' | 'y' | 'z'} [axis]
 * @returns {Part}
 */
function rod(finish, radius, length, at, axis = 'y') {
	return { shape: 'cylinder', size: [radius, length], at, rotation: LYING[axis], finish };
}

/** @param {Finish} finish @param {number} radius @param {Vec3} at @returns {Part} */
function ball(finish, radius, at) {
	return { shape: 'sphere', size: [radius], at, finish };
}

/** Parts for both sides of the centre line. @param {(side: number) => Part[]} make */
const mirrored = (make) => [-1, 1].flatMap(make);

/** A side chair at [x, z] with its back toward `back` (−1 or 1 in z). @param {number} x @param {number} z @param {number} back */
function chair(x, z, back) {
	return [
		block('oak', [0.44, 0.04, 0.44], [x, 0.43, z]),
		block('oak', [0.44, 0.42, 0.04], [x, 0.47, z + back * 0.2]),
		...mirrored((side) => [block('oak', [0.03, 0.43, 0.4], [x + side * 0.2, 0, z])])
	];
}

/** A dumbbell lying along z on a shelf at height `y`. @param {number} x @param {number} y @param {number} z @param {number} radius */
function dumbbell(x, y, z, radius) {
	const height = y + radius;
	return [
		rod('chrome', 0.015, 0.14, [x, height, z], 'z'),
		...mirrored((side) => [rod('ink', radius, 0.06, [x, height, z + side * 0.1], 'z')])
	];
}

/** Book runs on a shelf: [x, shelf height, width, height, finish]. @type {[number, number, number, number, Finish][]} */
const BOOKS = [
	[-0.45, 0.03, 0.5, 0.27, 'ink'],
	[0.3, 0.03, 0.6, 0.3, 'linen'],
	[-0.25, 0.53, 0.8, 0.25, 'sanguine'],
	[0.45, 0.53, 0.4, 0.31, 'walnut'],
	[-0.5, 1.03, 0.4, 0.3, 'linen'],
	[0.2, 1.03, 0.7, 0.24, 'ink'],
	[0.1, 1.53, 0.9, 0.28, 'fabric']
];

/** @type {Record<string, Part[]>} */
export const FURNITURE = {
	sofa: [
		block('fabric', [2.2, 0.4, 0.95], [0, 0, 0], 0.05),
		block('fabric', [2.2, 0.42, 0.24], [0, 0.38, -0.355], 0.08),
		...mirrored((side) => [
			block('fabric', [0.22, 0.22, 0.95], [side * 0.99, 0.38, 0], 0.06),
			block('linen', [0.86, 0.13, 0.68], [side * 0.44, 0.4, 0.1], 0.05)
		])
	],
	armchair: [
		block('fabric', [0.86, 0.38, 0.86], [0, 0, 0], 0.05),
		block('fabric', [0.86, 0.44, 0.2], [0, 0.36, -0.33], 0.07),
		...mirrored((side) => [block('fabric', [0.16, 0.2, 0.86], [side * 0.35, 0.36, 0], 0.05)]),
		block('linen', [0.54, 0.12, 0.62], [0, 0.38, 0.08], 0.05)
	],
	'coffee-table': [
		block('walnut', [1.2, 0.05, 0.62], [0, 0.33, 0], 0.015),
		...mirrored((side) => [block('walnut', [0.05, 0.33, 0.52], [side * 0.5, 0, 0])])
	],
	rug: [block('linen', [2.4, 0.012, 3])],
	media: [block('walnut', [1.8, 0.42, 0.42]), block('ink', [1.45, 0.83, 0.04], [0, 0.72, -0.12], 0.01)],
	plant: [rod('ceramic', 0.17, 0.42, [0, 0.21, 0]), ball('foliage', 0.36, [0, 0.78, 0])],

	kitchen: [
		block('lacquer', [2.6, 0.86, 0.62], [-0.4, 0, 0]),
		block('stone', [2.62, 0.04, 0.64], [-0.4, 0.86, 0.01]),
		block('chrome', [0.56, 0.01, 0.4], [-0.1, 0.9, 0.04]),
		block('ink', [0.6, 0.01, 0.5], [-1.2, 0.9, 0.04]),
		block('lacquer', [0.8, 2.1, 0.66], [1.3, 0, 0])
	],
	island: [
		block('lacquer', [1.8, 0.86, 0.9]),
		block('stone', [1.9, 0.04, 1], [0, 0.86, 0]),
		...[-0.55, 0, 0.55].flatMap((x) => [
			rod('steel', 0.02, 0.62, [x, 0.31, 0.75]),
			rod('walnut', 0.17, 0.05, [x, 0.645, 0.75])
		])
	],
	'dining-table': [
		block('walnut', [1.8, 0.04, 0.9], [0, 0.71, 0], 0.01),
		...mirrored((side) => [block('walnut', [0.06, 0.71, 0.76], [side * 0.72, 0, 0])]),
		...[-0.45, 0.45].flatMap((x) => [...chair(x, -0.62, -1), ...chair(x, 0.62, 1)])
	],

	desk: [
		block('oak', [1.4, 0.03, 0.7], [0, 0.72, 0]),
		...mirrored((side) => [block('steel', [0.03, 0.72, 0.62], [side * 0.66, 0, 0])]),
		block('steel', [0.05, 0.1, 0.05], [0, 0.75, -0.2]),
		block('ink', [0.6, 0.36, 0.02], [0, 0.85, -0.2], 0.005),
		rod('steel', 0.28, 0.03, [0, 0.015, 0.6]),
		rod('steel', 0.025, 0.42, [0, 0.24, 0.6]),
		block('leather', [0.48, 0.07, 0.46], [0, 0.45, 0.6], 0.03),
		block('leather', [0.46, 0.52, 0.06], [0, 0.56, 0.84], 0.03)
	],
	bookshelf: [
		block('oak', [1.6, 2, 0.02], [0, 0, -0.165]),
		...mirrored((side) => [block('oak', [0.03, 2, 0.35], [side * 0.785, 0, 0])]),
		...[0, 0.5, 1, 1.5, 1.97].map((y) => block('oak', [1.57, 0.03, 0.35], [0, y, 0])),
		...BOOKS.map(([x, y, w, h, finish]) => block(finish, [w, h, 0.24], [x, y, 0.02]))
	],
	bed: [
		block('walnut', [1.75, 0.28, 2.15]),
		block('linen', [1.62, 0.22, 2.02], [0, 0.28, 0.03], 0.07),
		block('fabric', [1.66, 0.05, 1.3], [0, 0.48, 0.42], 0.02),
		block('sanguine', [1.68, 0.03, 0.4], [0, 0.53, 0.78], 0.01),
		...mirrored((side) => [
			block('linen', [0.64, 0.12, 0.38], [side * 0.4, 0.5, -0.72], 0.05),
			block('walnut', [0.48, 0.48, 0.4], [side * 1.22, 0, -0.85])
		]),
		block('walnut', [1.9, 1, 0.06], [0, 0, -1.105])
	],
	dresser: [block('walnut', [1.4, 0.8, 0.5])],

	vanity: [
		block('walnut', [1.2, 0.82, 0.52]),
		block('stone', [1.22, 0.04, 0.54], [0, 0.82, 0]),
		block('ceramic', [0.5, 0.12, 0.38], [0, 0.86, 0.02], 0.04),
		block('mirror', [1, 0.8, 0.02], [0, 1.15, -0.26])
	],
	toilet: [
		block('ceramic', [0.38, 0.42, 0.52], [0, 0, 0.06], 0.1),
		block('ceramic', [0.4, 0.36, 0.17], [0, 0.42, -0.19], 0.03)
	],
	shower: [
		block('ceramic', [0.9, 0.04, 0.9]),
		block('glass', [0.6, 2, 0.01], [-0.15, 0.04, 0.445]),
		block('glass', [0.01, 2, 0.9], [0.445, 0.04, 0]),
		rod('chrome', 0.12, 0.01, [0, 2.1, -0.15])
	],
	tub: [block('ceramic', [1.7, 0.56, 0.8], [0, 0, 0], 0.14), block('tile', [1.46, 0.02, 0.58], [0, 0.55, 0], 0.01)],
	laundry: mirrored((side) => [
		block('ceramic', [0.6, 0.85, 0.6], [side * 0.31, 0, 0], 0.02),
		rod('ink', 0.17, 0.02, [side * 0.31, 0.46, 0.3], 'z')
	]),

	platform: [
		block('oak', [1.2, 0.05, 2.4]),
		...mirrored((side) => [block('rubber', [0.6, 0.05, 2.4], [side * 0.9, 0, 0])])
	],
	'power-rack': [
		...mirrored((side) => [
			...[-0.5, 0.5].map((z) => block('steel', [0.075, 2.3, 0.075], [side * 0.55, 0, z])),
			block('steel', [0.075, 0.075, 0.925], [side * 0.55, 2.225, 0]),
			block('steel', [0.09, 0.05, 1.3], [side * 0.55, 0, 0]),
			block('steel', [0.06, 0.05, 0.1], [side * 0.55, 1.29, 0.56]),
			rod('chrome', 0.025, 0.42, [side * 0.9, 1.34, 0.56], 'x'),
			rod('sanguine', 0.225, 0.05, [side * 0.8, 1.34, 0.56], 'x'),
			rod('ink', 0.17, 0.04, [side * 0.85, 1.34, 0.56], 'x')
		]),
		...[-0.5, 0.5].map((z) => block('steel', [1.175, 0.075, 0.075], [0, 2.225, z])),
		rod('chrome', 0.014, 1.3, [0, 1.34, 0.56], 'x')
	],
	bench: [
		block('leather', [0.3, 0.07, 1.2], [0, 0.4, 0], 0.03),
		block('steel', [0.08, 0.4, 0.9]),
		...[-0.48, 0.48].map((z) => block('steel', [0.5, 0.05, 0.08], [0, 0, z]))
	],
	dumbbells: [
		...mirrored((side) => [block('steel', [0.05, 0.82, 0.46], [side * 0.72, 0, 0])]),
		...[
			{ y: 0.4, z: 0.08, radius: 0.07 },
			{ y: 0.74, z: -0.06, radius: 0.05 }
		].flatMap(({ y, z, radius }) => [
			block('steel', [1.44, 0.03, 0.22], [0, y, z]),
			...Array.from({ length: 6 }, (_, i) => dumbbell(-0.6 + i * 0.24, y + 0.03, z, radius + i * 0.004)).flat()
		])
	],
	kettlebells: [0.09, 0.105, 0.12].map((radius, i) => ball('ink', radius, [(i - 1) * 0.3, radius, 0])),
	mat: [block('sanguine', [0.62, 0.006, 1.83])],
	mirror: [block('mirror', [3.2, 2, 0.02], [0, 0.3, 0])],
	treadmill: [
		block('ink', [0.8, 0.18, 1.9], [0, 0, 0], 0.03),
		block('rubber', [0.56, 0.01, 1.6], [0, 0.18, 0.08]),
		...mirrored((side) => [block('ink', [0.05, 1.08, 0.07], [side * 0.37, 0.12, -0.84])]),
		block('ink', [0.8, 0.1, 0.32], [0, 1.2, -0.8], 0.03)
	],
	rower: [
		block('steel', [0.1, 0.07, 2.1], [0, 0.2, 0.15]),
		block('steel', [0.46, 0.2, 0.08], [0, 0, 1.15]),
		rod('ink', 0.26, 0.28, [0, 0.4, -0.88], 'x'),
		block('ink', [0.5, 0.14, 0.12], [0, 0, -0.9]),
		block('leather', [0.3, 0.06, 0.32], [0, 0.27, 0.35], 0.02),
		...mirrored((side) => [block('ink', [0.13, 0.03, 0.26], [side * 0.1, 0.32, -0.55])]),
		rod('steel', 0.012, 0.6, [0, 0.95, -0.85]),
		block('ink', [0.24, 0.18, 0.03], [0, 1.2, -0.8], 0.01)
	],
	bike: [
		block('ink', [0.5, 0.05, 1.1]),
		rod('sanguine', 0.24, 0.05, [0, 0.4, -0.3], 'x'),
		block('ink', [0.07, 0.78, 0.07], [0, 0.05, 0.22]),
		block('leather', [0.18, 0.06, 0.28], [0, 0.83, 0.24], 0.02),
		block('ink', [0.07, 0.95, 0.07], [0, 0.05, -0.36]),
		block('ink', [0.46, 0.04, 0.12], [0, 1, -0.4], 0.015)
	],
	'cable-tower': [
		block('steel', [1.7, 0.06, 0.7]),
		...mirrored((side) => [
			block('steel', [0.12, 2.1, 0.12], [side * 0.76, 0.06, -0.24]),
			block('sanguine', [0.2, 0.9, 0.12], [side * 0.52, 0.06, -0.24]),
			rod('chrome', 0.02, 2, [side * 0.76, 1.1, -0.14])
		]),
		block('steel', [1.64, 0.12, 0.12], [0, 2.04, -0.24])
	]
};
