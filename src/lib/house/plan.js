/**
 * The dream house as data. Walls, windows, stairs, floors, furniture and the room list on /house
 * are all generated from this object, so redesigning the house means editing only this file.
 *
 * Units are metres. Plan points are [x, z] from the back-left corner of the house: x runs left to
 * right along the street, z runs from the back garden toward the street. Rects are [x, z, width, depth].
 *
 * - Walls come for free: the footprint gets exterior walls, and every room edge inside it gets an
 *   interior wall. Rooms that share an edge share one wall.
 * - Openings are points on a wall line. Defaults: window 1.2 wide, 1.5 tall on a 0.9 sill;
 *   door 0.9 × 2.1; opening (no door) 1.2 × 2.4.
 * - Stairs climb toward `up` from the floor they're listed on; the floor above gets a matching
 *   stairwell with a glass rail on its open sides.
 * - Furniture `type`s live in furniture.js. `rotate` is in degrees: 0 faces the street,
 *   90 faces right, -90 left, 180 the garden.
 */

/**
 * @typedef {[x: number, z: number, width: number, depth: number]} Rect
 * @typedef {'oak' | 'stone' | 'tile' | 'rubber'} FloorFinish
 * @typedef {{ id: string, name: string, rect: Rect, finish: FloorFinish, label?: [number, number] }} Room
 * @typedef {{ type: 'window' | 'door' | 'opening', at: [number, number], width?: number, height?: number, sill?: number }} Opening
 * @typedef {{ rect: Rect, up: 'back' | 'front' | 'left' | 'right' }} Stair
 * @typedef {{ type: string, at: [number, number], rotate?: number }} Item
 * @typedef {{ id: string, name: string, short: string, height: number, rooms: Room[], openings: Opening[], stairs?: Stair[], furniture: Item[] }} Floor
 * @typedef {{ rect: Rect, height?: number }} Path
 * @typedef {{ width: number, depth: number, house: [number, number], paths: Path[], trees: [x: number, z: number, radius: number][] }} Site
 * @typedef {{ pitch: number, overhang: number, verge: number, thickness: number }} Roof
 * @typedef {{
 *   width: number,
 *   depth: number,
 *   walls: { exterior: number, interior: number },
 *   slab: number,
 *   plinth: number,
 *   grade: number,
 *   roof: Roof,
 *   site: Site,
 *   floors: Floor[]
 * }} House
 */

/** @type {House} */
export const HOUSE = {
	width: 12,
	depth: 9,
	walls: { exterior: 0.3, interior: 0.12 },
	/** Structure between storeys. */
	slab: 0.3,
	/** The ground-floor slab, and how far it stands above the lawn. */
	plinth: 0.3,
	grade: 0.15,
	/** A 30° gable with the ridge running left to right; overhang at the eaves, verge at the ends. */
	roof: { pitch: 30, overhang: 0.45, verge: 0.25, thickness: 0.18 },

	/** The lot, in its own [x, z] from its back-left corner. `house` places the house on it. */
	site: {
		width: 26,
		depth: 23,
		house: [7, 7],
		paths: [
			{ rect: [12.1, 16, 1.8, 0.6], height: 0.15 },
			{ rect: [12.3, 16.6, 1.4, 6.4] }
		],
		trees: [
			[3.5, 4, 1.5],
			[22.5, 3.5, 1.8],
			[3, 19.5, 1.2],
			[23, 19.5, 1.35]
		]
	},

	floors: [
		{
			id: 'ground',
			name: 'Ground floor',
			short: '1',
			height: 2.9,
			rooms: [
				{ id: 'living', name: 'Living room', rect: [0, 4.2, 4.8, 4.8], finish: 'oak' },
				{ id: 'kitchen', name: 'Kitchen', rect: [0, 0, 4.8, 4.2], finish: 'stone' },
				{ id: 'entry', name: 'Entry & stair', rect: [4.8, 0, 2.6, 9], finish: 'oak', label: [6.7, 5.4] },
				{ id: 'study', name: 'Study', rect: [7.4, 4.2, 4.6, 4.8], finish: 'oak' },
				{ id: 'utility', name: 'Bath & laundry', rect: [7.4, 0, 4.6, 4.2], finish: 'tile' }
			],
			stairs: [{ rect: [4.8, 3.2, 1.2, 4.4], up: 'back' }],
			openings: [
				{ type: 'window', at: [1.2, 9] },
				{ type: 'window', at: [3.6, 9] },
				{ type: 'door', at: [6, 9], width: 1, height: 2.3 },
				{ type: 'window', at: [8.4, 9] },
				{ type: 'window', at: [10.8, 9] },

				{ type: 'window', at: [2.6, 0], width: 2.8, height: 2.4, sill: 0 },
				{ type: 'window', at: [6.1, 0], width: 1 },

				{ type: 'window', at: [0, 2.1], width: 1.4, height: 1.1, sill: 1.05 },
				{ type: 'window', at: [0, 8], width: 0.9 },
				{ type: 'window', at: [12, 6.6], width: 1.6 },
				{ type: 'window', at: [12, 2.1], width: 0.8, height: 0.8, sill: 1.3 },

				{ type: 'opening', at: [2.4, 4.2], width: 3.2, height: 2.5 },
				{ type: 'opening', at: [4.8, 8.15], width: 1.1 },
				{ type: 'opening', at: [4.8, 1.6], width: 1.4 },
				{ type: 'door', at: [7.4, 6.6] },
				{ type: 'door', at: [7.4, 2] }
			],
			furniture: [
				{ type: 'media', at: [0.52, 6.5], rotate: 90 },
				{ type: 'rug', at: [2.3, 6.5], rotate: 90 },
				{ type: 'coffee-table', at: [2.2, 6.5], rotate: 90 },
				{ type: 'sofa', at: [3.6, 6.5], rotate: -90 },
				{ type: 'armchair', at: [1.5, 8], rotate: 150 },
				{ type: 'plant', at: [4.35, 4.7] },

				{ type: 'kitchen', at: [0.64, 2.1], rotate: 90 },
				{ type: 'island', at: [2.4, 2.1], rotate: 90 },

				{ type: 'plant', at: [7, 8.3] },

				{ type: 'desk', at: [9.6, 8.25], rotate: 180 },
				{ type: 'bookshelf', at: [9.6, 4.45] },
				{ type: 'armchair', at: [11, 6.1], rotate: -110 },

				{ type: 'vanity', at: [8.5, 0.58] },
				{ type: 'laundry', at: [11.05, 0.62] },
				{ type: 'toilet', at: [9.7, 3.8], rotate: 180 },
				{ type: 'shower', at: [11.2, 3.64], rotate: 180 }
			]
		},
		{
			id: 'upper',
			name: 'Second floor',
			short: '2',
			height: 3,
			rooms: [
				{ id: 'gym', name: 'Gym', rect: [0, 0, 4.8, 9], finish: 'rubber' },
				{ id: 'landing', name: 'Landing', rect: [4.8, 0, 2.6, 9], finish: 'oak', label: [6.7, 5.4] },
				{ id: 'bedroom', name: 'Bedroom', rect: [7.4, 3.6, 4.6, 5.4], finish: 'oak' },
				{ id: 'bath', name: 'Bath', rect: [7.4, 0, 4.6, 3.6], finish: 'tile' }
			],
			openings: [
				{ type: 'window', at: [1.2, 9] },
				{ type: 'window', at: [3.6, 9] },
				{ type: 'window', at: [6, 9], width: 1 },
				{ type: 'window', at: [8.4, 9] },
				{ type: 'window', at: [10.8, 9] },

				{ type: 'window', at: [1.2, 0], width: 1.4 },
				{ type: 'window', at: [6.1, 0], width: 1 },
				{ type: 'window', at: [9.7, 0], width: 1, height: 0.9, sill: 1.2 },

				{ type: 'window', at: [0, 3], width: 1.8, height: 2, sill: 0.6 },
				{ type: 'window', at: [0, 6], width: 1.8, height: 2, sill: 0.6 },
				{ type: 'window', at: [12, 6.3], width: 1.6 },
				{ type: 'window', at: [12, 1.9], width: 0.8, height: 0.8, sill: 1.3 },

				{ type: 'door', at: [4.8, 1.6], width: 1.6, height: 2.3 },
				{ type: 'door', at: [7.4, 5] },
				{ type: 'door', at: [7.4, 1.8] }
			],
			furniture: [
				{ type: 'platform', at: [2.4, 7.3] },
				{ type: 'power-rack', at: [2.4, 7.45], rotate: 180 },
				{ type: 'mirror', at: [4.73, 4.6], rotate: -90 },
				{ type: 'dumbbells', at: [4.45, 4.6], rotate: -90 },
				{ type: 'bench', at: [3.2, 4.6], rotate: 90 },
				{ type: 'treadmill', at: [1.35, 3], rotate: 90 },
				{ type: 'rower', at: [1.6, 5.5], rotate: 90 },
				{ type: 'bike', at: [1.2, 1.2], rotate: 180 },
				{ type: 'cable-tower', at: [3.4, 0.68] },
				{ type: 'mat', at: [3.3, 2.5], rotate: 90 },
				{ type: 'kettlebells', at: [4.35, 6.6], rotate: -90 },
				{ type: 'plant', at: [0.6, 8.3] },

				{ type: 'plant', at: [6.95, 8.35] },

				{ type: 'bed', at: [9.6, 4.8] },
				{ type: 'dresser', at: [11.45, 7.6], rotate: -90 },
				{ type: 'armchair', at: [8.2, 8], rotate: 160 },

				{ type: 'tub', at: [11.25, 1.9], rotate: 90 },
				{ type: 'shower', at: [7.95, 0.79] },
				{ type: 'vanity', at: [9.4, 3.27], rotate: 180 },
				{ type: 'toilet', at: [9.8, 0.62] }
			]
		}
	]
};
