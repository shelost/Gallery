import { Rig, horse, man, skeleton, stallion } from './anatomy.js';
import { add, box, cone, cross, dot, ellipsoid, mix, normalize, rotation, scale, sphere, sub } from './sdf.js';

/**
 * The statues that can stand on the podium, each sculpted from the shared rig in `anatomy.js`.
 * `build` returns the primitives in meters at life size, standing on y = 0; the scene scales
 * the mesh down to the podium. `cell` is the meshing grid, finer for smaller figures.
 */

/** @typedef {import('./sdf.js').Vec} Vec */
/** @typedef {import('./sdf.js').Primitive} Primitive */
/** @typedef {'bronze' | 'marble' | 'stone'} Finish */
/**
 * @typedef {{
 *   id: string, title: string, by: string, year: string, place: string, note: string,
 *   href: string, finish: Finish, plate: string, cell: number, build: () => Primitive[]
 * }} Statue
 */

/** A small seeded random, so the rocks come out the same on every load. @param {number} seed */
function random(seed) {
	let state = seed >>> 0;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

/**
 * A rough heap of stone around `at`, `radii` across, made of `count` lumps, none of them
 * reaching down past `floor`.
 * @param {Vec} at @param {Vec} radii @param {number} count @param {number} seed @param {number} floor
 */
function rocks(at, radii, count, seed, floor) {
	const next = random(seed);
	/** @type {Primitive[]} */
	const round = Math.min(...radii) * 0.3;
	const parts = [box(at, scale(radii, 0.62), round, rotation(0, next() * 3, 0), { blend: 0.06 })];
	for (let n = 0; n < count; n++) {
		const angle = (n / count) * Math.PI * 2 + next() * 0.6;
		const size = 0.35 + next() * 0.3;
		const half = /** @type {Vec} */ ([radii[0] * size * 0.55, radii[1] * size * 0.5, radii[2] * size * 0.55]);
		const lift = Math.max(floor + half[1] * 0.8, at[1] + (next() - 0.55) * radii[1] * 1.1);
		const spot = /** @type {Vec} */ ([at[0] + Math.cos(angle) * radii[0] * 0.78, lift, at[2] + Math.sin(angle) * radii[2] * 0.78]);
		parts.push(box(spot, half, round * 0.35, rotation((next() - 0.5) * 0.9, next() * 3, (next() - 0.5) * 0.9), { blend: 0.035 }));
	}
	return parts;
}

/** A square plinth with a moulded lip. @param {number} w @param {number} d @param {number} h */
function plinth(w, d, h) {
	return [
		box([0, h * 0.45, 0], [w / 2, h * 0.45, d / 2], 0.01, undefined, { blend: 0 }),
		box([0, h * 0.95, 0], [w / 2 - 0.02, h * 0.06, d / 2 - 0.02], 0.012, undefined, { blend: 0.01 })
	];
}

/**
 * A straight rod held in a fist, running through the grip along `direction` in the wrist's
 * frame, `back` behind the hand and `ahead` in front of it.
 * @param {Rig} rig @param {string} wrist @param {Vec} direction @param {number} back @param {number} ahead @param {number} r1 @param {number} r2
 */
function held(rig, wrist, direction, back, ahead, r1, r2) {
	const grip = rig.point(wrist, [0, -0.065, 0.006]);
	const along = normalize(rig.direction(wrist, direction));
	return { from: add(grip, scale(along, -back)), to: add(grip, scale(along, ahead)), along, r1, r2 };
}

/**
 * A flame rising from `at`: a teardrop body with tongues twisting up around it, each bending in
 * toward the middle as it climbs.
 * @param {Vec} at @param {number} size
 */
function flame(at, size) {
	/** @type {Primitive[]} */
	const parts = [
		ellipsoid(add(at, [0, size * 0.28, 0]), [size * 0.3, size * 0.36, size * 0.3], undefined, { blend: 0.05 }),
		cone(add(at, [0, size * 0.4, 0]), add(at, [size * 0.04, size * 1.15, 0]), size * 0.22, size * 0.015, { blend: 0.06, folds: 5, foldDepth: [0.004, 0.012], twist: 2.5 })
	];
	for (let n = 0; n < 6; n++) {
		const angle = (n / 6) * Math.PI * 2;
		const tall = 0.65 + ((n * 7) % 5) * 0.08;
		const base = add(at, [Math.cos(angle) * size * 0.2, size * 0.25, Math.sin(angle) * size * 0.2]);
		const bend = add(base, [Math.cos(angle + 0.6) * size * 0.12, size * tall * 0.5, Math.sin(angle + 0.6) * size * 0.12]);
		const tip = add(at, [Math.cos(angle + 1.3) * size * 0.08, size * tall, Math.sin(angle + 1.3) * size * 0.08]);
		parts.push(cone(base, bend, size * 0.12, size * 0.08, { blend: 0.05 }), cone(bend, tip, size * 0.08, size * 0.01, { blend: 0.04 }));
	}
	return parts;
}

/**
 * The rotation that lays a primitive's z along `along`, with its y as near `normal` as it can be.
 * @param {Vec} along @param {Vec} normal
 * @returns {import('./sdf.js').Mat}
 */
function aligned(along, normal) {
	const z = normalize(along);
	const y = normalize(sub(normal, scale(z, dot(normal, z))));
	const x = cross(y, z);
	return [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
}

/**
 * A wing of overlapping feathers: rows from the long flight feathers at the back to the short
 * coverts along the front edge, all fanning back from a leading edge that runs from `root` to
 * `wrist`. `side` is the side of the body it's on.
 * @param {Vec} root @param {Vec} wrist @param {number} side @param {number} span
 */
function wing(root, wrist, side, span) {
	/** @type {Primitive[]} */
	const parts = [cone(root, wrist, 0.055, 0.03, { blend: 0.05 })];
	const normal = normalize([side, 0.05, side * 0.25]);
	const rows = [
		{ count: 10, length: 1, width: 0.06, lift: 0 },
		{ count: 8, length: 0.58, width: 0.065, lift: 0.018 },
		{ count: 6, length: 0.3, width: 0.07, lift: 0.034 }
	];
	for (const row of rows) {
		for (let n = 0; n < row.count; n++) {
			const t = n / (row.count - 1);
			const bow = Math.sin(t * Math.PI) * 0.06;
			const base = add(mix(root, wrist, 0.1 + 0.9 * t), scale(normal, row.lift + bow));
			const along = normalize([side * 0.06, 0.12 * t - 0.5 * (1 - t), -1]);
			const length = span * (0.22 + 0.78 * Math.pow(t, 1.2)) * row.length;
			parts.push(ellipsoid(add(base, scale(along, length / 2)), [row.width, 0.016, length / 2], aligned(along, normal), { blend: 0.02 }));
		}
	}
	return parts;
}

/**
 * A cloak hung from the shoulders and streaming back: strips of cloth side by side, each
 * wavering a little differently, `spread` across at the hem and `fall` long.
 * @param {Rig} rig @param {string} chest @param {number} spread @param {number} fall
 */
function cape(rig, chest, spread, fall) {
	/** @type {Primitive[]} */
	const parts = [];
	const strips = 6;
	for (let n = 0; n < strips; n++) {
		const t = n / (strips - 1) - 0.5;
		const top = /** @type {Vec} */ ([t * 0.26, 0.19, -0.085]);
		const middle = /** @type {Vec} */ ([t * spread * 0.7, 0.19 - fall * 0.45, -0.17 - Math.cos(n * 1.9) * 0.03]);
		const hem = /** @type {Vec} */ ([t * spread, 0.19 - fall, -0.3 - Math.sin(n * 2.3) * 0.05]);
		parts.push(
			rig.limb(chest, top, middle, 0.035, 0.035, { blend: 0.05, folds: 3, foldDepth: [0.002, 0.006] }),
			rig.limb(chest, middle, hem, 0.035, 0.03, { blend: 0.05, folds: 3, foldDepth: [0.004, 0.01] })
		);
	}
	return parts;
}

/**
 * Rebuilds the rig's root until the lowest of `feet` stands on `ground`.
 * @param {(rise: number) => Rig} pose @param {[string, Vec][]} feet @param {number} ground
 */
function stand(pose, feet, ground) {
	const trial = pose(0);
	const lowest = Math.min(...feet.map(([joint, local]) => trial.point(joint, local)[1]));
	return pose(ground - lowest);
}

/** @type {Statue[]} */
export const STATUES = [
	{
		id: 'nike',
		title: 'Winged Victory of Samothrace',
		by: 'Unknown Rhodian sculptor',
		year: 'c. 190 BC',
		place: 'Louvre, Paris',
		plate: 'ΝΙΚΗ',
		note: 'Nike, the goddess of victory, landing on the prow of a warship with the wind still in her robes. She lost her head and arms somewhere along the way and is more alive for it: the whole statue is motion.',
		href: 'https://en.wikipedia.org/wiki/Winged_Victory_of_Samothrace',
		finish: 'marble',
		cell: 0.014,
		build() {
			const rig = stand(
				(rise) => {
					const r = new Rig();
					skeleton(r, 'v', null, [0, 1.62 + rise, 0.05], [0.12, 0, 0], {
						spine: [0.05, 0, 0],
						chest: [-0.12, 0.08, 0],
						hipR: [-0.45, 0, -0.04],
						kneeR: [0.4, 0, 0],
						ankleR: [0.05, 0, 0],
						hipL: [0.42, 0, 0.05],
						kneeL: [0.35, 0, 0],
						ankleL: [-0.7, 0, 0],
						shoulderL: [0, 0, 0.5],
						shoulderR: [0, 0, 0.5]
					});
					return r;
				},
				[
					['v.ankleR', [0, -0.07, 0.06]],
					['v.ankleL', [0, -0.07, 0.14]]
				],
				0.66
			);
			const body = man(rig, 'v', { build: 0.95, head: false, arms: false, blend: 0.035 });
			const drape = { blend: 0.05 };
			const parts = [
				...body,
				rig.blob('v.chest', [0.055, 0.1, 0.075], [0.06, 0.06, 0.05], [0, 0, 0], drape),
				rig.blob('v.chest', [-0.055, 0.1, 0.075], [0.06, 0.06, 0.05], [0, 0, 0], drape),
				rig.limb('v.chest', [0, 0.2, 0.0], [0, -0.05, 0.01], 0.15, 0.15, { blend: 0.05, folds: 22, foldDepth: [0.003, 0.009], twist: 0.6 }),
				rig.limb('v.spine', [0, 0.12, 0.0], [0, -0.06, 0], 0.15, 0.17, { blend: 0.05, folds: 18, foldDepth: [0.004, 0.01] }),
				rig.blob('v.pelvis', [0.11, -0.02, 0.08], [0.07, 0.05, 0.06], [0, 0, 0.6], drape),
				rig.limb('v.pelvis', [0, 0.02, 0], [0, -0.16, 0.01], 0.17, 0.2, { blend: 0.06, folds: 16, foldDepth: [0.005, 0.016], twist: 1 }),
				rig.limb('v.hipR', [0, -0.05, 0.01], [0, -0.46, 0.02], 0.1, 0.09, { blend: 0.06, folds: 9, foldDepth: [0.006, 0.014], twist: 0.5 }),
				rig.limb('v.kneeR', [0, 0, 0], [0, -0.39, 0.0], 0.085, 0.13, { blend: 0.06, folds: 11, foldDepth: [0.008, 0.02], twist: -0.4 }),
				rig.limb('v.hipL', [0, -0.05, 0], [0, -0.46, -0.01], 0.1, 0.1, { blend: 0.06, folds: 10, foldDepth: [0.006, 0.018], twist: -0.8 }),
				rig.limb('v.kneeL', [0, 0.02, -0.03], [0, -0.36, -0.08], 0.085, 0.12, { blend: 0.06, folds: 12, foldDepth: [0.008, 0.02], twist: 0.9 }),
				rig.limb('v.pelvis', [-0.08, -0.05, 0.1], [-0.13, -0.5, 0.2], 0.05, 0.09, { blend: 0.06, folds: 6, foldDepth: [0.004, 0.014], twist: 0.5 }),
				rig.limb('v.pelvis', [0.12, -0.02, -0.04], [0.22, -0.55, -0.26], 0.06, 0.1, { blend: 0.07, folds: 7, foldDepth: [0.006, 0.018], twist: -0.6 })
			];
			for (const s of [1, -1]) {
				const root = rig.point('v.chest', [s * 0.07, 0.13, -0.1]);
				parts.push(...wing(root, add(root, [s * 0.2, 0.62, -0.42]), s, 0.95));
			}
			return [
				cone([0, 0.5, -0.8], [0, 0.5, 0.78], 0.4, 0.07, { blend: 0.02 }),
				box([0, 0.95, 0], [1, 0.28, 1.4], 0, undefined, { blend: 0.03, carve: true }),
				box([0, -0.05, 0], [1, 0.2, 1.4], 0, undefined, { blend: 0.02, carve: true }),
				box([0, 0.08, -0.15], [0.48, 0.08, 0.9], 0.01, undefined, { blend: 0 }),
				box([0, 0.665, -0.2], [0.3, 0.012, 0.55], 0.01, undefined, { blend: 0.02 }),
				...parts
			];
		}
	},
	{
		id: 'thinker',
		title: 'The Thinker',
		by: 'Auguste Rodin',
		year: '1904',
		place: 'Musée Rodin, Paris',
		plate: 'LE PENSEUR',
		note: 'Made first as Dante, brooding over the Gates of Hell, before Rodin enlarged him on his own. He thinks with his whole body: even his toes grip the rock.',
		href: 'https://en.wikipedia.org/wiki/The_Thinker',
		finish: 'bronze',
		cell: 0.011,
		build() {
			const rig = new Rig();
			skeleton(rig, 't', null, [0, 0.74, -0.08], [0.1, 0, 0], {
				spine: [0.74, -0.1, 0],
				chest: [0.06, -0.08, 0.3],
				neck: [0.23, 0, 0],
				head: [0.09, -0.14, 0],
				hipL: [-1.74, 0, 0.16],
				kneeL: [1.97, 0, 0],
				ankleL: [0.2, 0, 0],
				hipR: [-1.42, 0, -0.1],
				kneeR: [1.25, 0, 0],
				ankleR: [0.2, 0, 0],
				clavicleR: [0, 0.35, 0.3],
				shoulderR: [-0.64, 0.73, -0.06],
				elbowR: [-2.45, 0, 0],
				wristR: [-0.01, 0, 0.58],
				shoulderL: [-1.18, 0, 0.05],
				elbowL: [-1.05, 0, 0],
				wristL: [0.6, 0, 0]
			});
			return [
				...plinth(0.9, 0.95, 0.08),
				...rocks([0, 0.36, -0.12], [0.32, 0.29, 0.33], 11, 7, 0.08),
				...rocks([0.17, 0.14, 0.18], [0.13, 0.07, 0.14], 4, 19, 0.08),
				...man(rig, 't', { build: 1.12, hands: { L: 'open', R: 'fist' }, hair: 'curls', blend: 0.032 })
			];
		}
	},
	{
		id: 'dying-gaul',
		title: 'The Dying Gaul',
		by: 'Unknown, after a Pergamene bronze',
		year: 'c. 230 BC',
		place: 'Capitoline Museums, Rome',
		plate: 'GALATA MORENTE',
		note: 'A Galatian warrior sinking down onto his shield with a wound in his side, the torc still round his neck and his horn broken beside him. The Pergamenes made him to celebrate beating the Gauls, and gave their enemy all the dignity there is.',
		href: 'https://en.wikipedia.org/wiki/Dying_Gaul',
		finish: 'marble',
		cell: 0.012,
		build() {
			const rig = new Rig();
			skeleton(rig, 'd', null, [-0.1, 0.25, -0.28], [0.1, 0.85, 0.45], {
				spine: [0.2, -0.4, -0.08],
				chest: [0.18, -0.32, 0.04],
				neck: [0.32, 0, 0.05],
				head: [0.45, -0.35, 0.1],
				hipR: [-1.5, 0, -0.75],
				kneeR: [0.4, 0, 0],
				ankleR: [-0.2, 0, 0],
				hipL: [-1.95, 0, 0.12],
				kneeL: [1.5, 0, 0],
				ankleL: [0.35, 0, 0],
				shoulderR: [0.05, 0, -0.32],
				elbowR: [-0.05, 0, 0],
				wristR: [0.9, 0, 0],
				shoulderL: [-0.55, 0, -0.3],
				elbowL: [-0.75, 0, 0]
			});
			const torc = Array.from({ length: 14 }, (_, n) => {
				const angle = (n / 13) * Math.PI * 1.7 + Math.PI * 0.65;
				return rig.ball('d.neck', [Math.cos(angle) * 0.066, 0.02, Math.sin(angle) * 0.066], 0.012, { blend: 0.006 });
			});
			return [
				ellipsoid([0.02, 0, 0], [0.74, 0.16, 0.52], undefined, { blend: 0 }),
				box([0, -0.25, 0], [1.2, 0.25, 0.7], 0, undefined, { blend: 0, carve: true }),
				box([0, 0.39, 0], [1.2, 0.3, 0.7], 0, undefined, { blend: 0.01, carve: true }),
				ellipsoid([-0.22, 0.1, -0.3], [0.5, 0.035, 0.27], rotation(0, 0.25, 0), { blend: 0.015 }),
				sphere([-0.4, 0.11, -0.2], 0.055, { blend: 0.02 }),
				cone([-0.62, 0.11, 0.1], [-0.3, 0.11, 0.3], 0.02, 0.011, { blend: 0.01 }),
				cone([0.3, 0.12, -0.12], [0.52, 0.13, -0.28], 0.012, 0.038, { blend: 0.01 }),
				cone([0.52, 0.13, -0.28], [0.56, 0.15, -0.44], 0.038, 0.05, { blend: 0.01 }),
				...man(rig, 'd', { build: 1.08, hands: { L: 'open', R: 'open' }, hair: 'curls', blend: 0.03 }),
				...torc
			];
		}
	},
	{
		id: 'prometheus',
		title: 'Prometheus',
		by: 'Atelier Missor',
		year: '2025',
		place: 'Starbase, Texas',
		plate: 'PROMETHEUS',
		note: 'The Titan who stole fire from the gods and gave it to people. Here he stands at the launch site, holding the torch up for everyone to see.',
		href: 'https://www.ateliermissor.com/',
		finish: 'bronze',
		cell: 0.013,
		build() {
			const rig = stand(
				(rise) => {
					const r = new Rig();
					skeleton(r, 'p', null, [0, 1.0 + rise, 0], [0, 0, 0.04], {
						spine: [-0.04, 0.08, -0.03],
						chest: [-0.1, 0.1, -0.06],
						neck: [-0.12, 0, 0],
						head: [-0.3, 0.15, 0],
						shoulderR: [-2.75, 0.1, -0.18],
						elbowR: [-0.25, 0, 0],
						wristR: [0.1, 0, 0],
						shoulderL: [0.15, 0, 0.32],
						elbowL: [-0.35, 0, 0],
						hipR: [0.02, 0, -0.04],
						kneeR: [0.04, 0, 0],
						hipL: [-0.28, 0, 0.1],
						kneeL: [0.42, 0, 0],
						ankleL: [-0.1, 0, 0]
					});
					return r;
				},
				[
					['p.ankleR', [0, -0.067, 0.06]],
					['p.ankleL', [0, -0.067, 0.06]]
				],
				0.16
			);
			const torch = held(rig, 'p.wristR', [0, -1, 0.25], 0.1, 0.26, 0.024, 0.04);
			return [
				...plinth(0.9, 0.9, 0.16),
				...man(rig, 'p', { build: 1.25, hands: { L: 'fist', R: 'grip' }, hair: 'curls', beard: 'short', blend: 0.03 }),
				rig.limb('p.pelvis', [0, 0.01, -0.005], [0, -0.1, 0.0], 0.158, 0.168, { blend: 0.03, folds: 16, foldDepth: [0.003, 0.009], twist: 0.6 }),
				rig.limb('p.pelvis', [-0.05, -0.08, 0.1], [-0.07, -0.26, 0.11], 0.035, 0.05, { blend: 0.03, folds: 5, foldDepth: [0.003, 0.008] }),
				rig.limb('p.chest', [0.14, 0.18, -0.04], [0.2, -0.05, -0.12], 0.03, 0.05, { blend: 0.04, folds: 5, foldDepth: [0.002, 0.008] }),
				rig.limb('p.chest', [0.2, -0.05, -0.12], [0.24, -0.42, -0.12], 0.05, 0.075, { blend: 0.05, folds: 7, foldDepth: [0.004, 0.014], twist: 0.8 }),
				cone(torch.from, torch.to, torch.r1, torch.r2, { blend: 0.02, folds: 8, foldDepth: [0.002, 0.004] }),
				...flame(add(torch.to, scale(torch.along, 0.01)), 0.24)
			];
		}
	},
	{
		id: 'gyebaek',
		title: 'General Gyebaek',
		by: 'Baekje Military Museum',
		year: '2009',
		place: 'Nonsan, Korea',
		plate: '階伯',
		note: 'The last general of Baekje, who rode out with five thousand men against fifty thousand at Hwangsanbeol in 660 and held them for a day. He stands above the field where he fell.',
		href: 'https://en.wikipedia.org/wiki/Gyebaek',
		finish: 'bronze',
		cell: 0.016,
		build() {
			const pitch = -0.5;
			const rig = stand(
				(rise) => {
					const r = new Rig();
					stallion(r, 'h', [0, 1.3 + rise, -0.05], [pitch, 0, 0], {
						withers: [0.25, 0, 0],
						poll: [0.75, 0, 0],
						shoulderL: [-1.0, 0, 0],
						kneeL: [1.9, 0, 0],
						fetlockL: [0.6, 0, 0],
						shoulderR: [-0.55, 0, 0],
						kneeR: [1.5, 0, 0],
						fetlockR: [0.5, 0, 0],
						hipL: [0.8, 0, 0],
						hockL: [-0.55, 0, 0],
						hindFetlockL: [0.25, 0, 0],
						hipR: [0.55, 0, 0],
						hockR: [-0.4, 0, 0],
						hindFetlockR: [0.3, 0, 0],
						dock: [0.5, 0, 0]
					});
					skeleton(r, 'g', 'h.saddle', [0, 0.1, -0.02], [-pitch - 0.25, 0, 0], {
						spine: [0.1, 0, 0],
						chest: [0.05, -0.15, 0],
						head: [-0.1, -0.2, 0],
						hipL: [-1.1, 0, 0.42],
						kneeL: [1.35, 0, 0],
						hipR: [-1.1, 0, 0.42],
						kneeR: [1.35, 0, 0],
						shoulderR: [-2.3, 0, -0.45],
						elbowR: [-0.4, 0, 0],
						shoulderL: [-0.9, 0, 0.15],
						elbowL: [-0.9, 0, 0]
					});
					return r;
				},
				[
					['h.hindFetlockL', [0, -0.17, 0.08]],
					['h.hindFetlockR', [0, -0.17, 0.08]]
				],
				0.34
			);
			const sword = held(rig, 'g.wristR', [0, -0.2, 1], 0.12, 0.85, 0.022, 0.012);
			return [
				...rocks([0, 0.2, -0.45], [0.6, 0.22, 0.75], 12, 3, 0.12),
				box([0, 0.06, -0.3], [0.62, 0.06, 1.0], 0.01, undefined, { blend: 0.02 }),
				...horse(rig, 'h', {
					tail: [
						[0, 0, 0],
						[0, -0.2, -0.18],
						[0, -0.5, -0.2],
						[0, -0.85, -0.12]
					],
					mane: 0.06
				}),
				rig.blob('h.saddle', [0, 0.02, 0], [0.24, 0.07, 0.28], [0, 0, 0], { blend: 0.04 }),
				...man(rig, 'g', { build: 1.05, hands: { L: 'fist', R: 'grip' }, beard: 'short', hair: 'none', blend: 0.03 }),
				rig.limb('g.spine', [0, -0.05, 0], [0, 0.34, 0], 0.17, 0.18, { blend: 0.04, folds: 26, foldDepth: [0.006, 0.006] }),
				rig.limb('g.pelvis', [0, 0.05, 0], [0, -0.22, 0.04], 0.18, 0.26, { blend: 0.05, folds: 20, foldDepth: [0.008, 0.016] }),
				rig.blob('g.shoulderL', [0.02, -0.04, 0], [0.08, 0.08, 0.085], [0, 0, 0], { blend: 0.02 }),
				rig.blob('g.shoulderR', [-0.02, -0.04, 0], [0.08, 0.08, 0.085], [0, 0, 0], { blend: 0.02 }),
				rig.blob('g.head', [0, 0.13, -0.005], [0.1, 0.09, 0.11], [0, 0, 0], { blend: 0.015 }),
				rig.blob('g.head', [0, 0.085, 0], [0.135, 0.016, 0.14], [0, 0, 0], { blend: 0.012 }),
				rig.limb('g.head', [0, 0.2, 0], [0, 0.34, -0.02], 0.022, 0.006, { blend: 0.015 }),
				rig.ball('g.head', [0, 0.22, 0], 0.03, { blend: 0.01 }),
				...cape(rig, 'g.chest', 0.42, 0.62),
				cone(sword.from, sword.to, sword.r1, sword.r2, { blend: 0.01 }),
				sphere(sword.from, 0.03, { blend: 0.01 })
			];
		}
	},
	{
		id: 'shapur',
		title: 'Kneel Before Iran',
		by: 'Tehran Municipality',
		year: '2025',
		place: 'Enghelab Square, Tehran',
		plate: 'شاپور',
		note: 'Shapur I on horseback with the Roman emperor Valerian kneeling at his feet, after Edessa in 260 — the scene the Sasanians carved into the cliffs at Naqsh-e Rostam, brought down to the square.',
		href: 'https://en.wikipedia.org/wiki/Shapur_I',
		finish: 'stone',
		cell: 0.016,
		build() {
			const rig = stand(
				(rise) => {
					const r = new Rig();
					stallion(r, 'h', [0.18, 1.25 + rise, -0.25], [0, 0, 0], {
						withers: [-0.15, 0, 0],
						poll: [0.95, 0.15, 0],
						shoulderR: [-0.9, 0, 0],
						kneeR: [1.6, 0, 0],
						fetlockR: [0.3, 0, 0],
						shoulderL: [0.05, 0, 0],
						hipL: [0.12, 0, 0],
						hockL: [-0.12, 0, 0],
						hipR: [-0.08, 0, 0],
						hockR: [0.08, 0, 0],
						dock: [0.7, 0, 0]
					});
					skeleton(r, 's', 'h.saddle', [0, 0.1, -0.02], [0, 0, 0], {
						spine: [-0.04, 0, 0],
						head: [0.1, 0.15, 0],
						hipL: [-1.0, 0, 0.42],
						kneeL: [1.2, 0, 0],
						hipR: [-1.0, 0, 0.42],
						kneeR: [1.2, 0, 0],
						shoulderR: [-0.7, 0, -0.1],
						elbowR: [-1.0, 0, 0],
						shoulderL: [-0.3, 0, 0.12],
						elbowL: [-1.3, 0, 0]
					});
					return r;
				},
				[
					['h.fetlockL', [0, -0.17, 0.08]],
					['h.hindFetlockL', [0, -0.17, 0.08]]
				],
				0.14
			);
			stand(
				(rise) => {
					skeleton(rig, 'k', null, [-0.42, 0.85 + rise, 0.75], [0, 0.55, 0], {
						spine: [-0.1, 0, 0],
						chest: [-0.12, 0, 0],
						neck: [-0.2, 0, 0],
						head: [-0.25, 0, 0],
						hipL: [-0.15, 0, 0.05],
						kneeL: [1.55, 0, 0],
						ankleL: [-0.9, 0, 0],
						hipR: [-1.45, 0, 0.1],
						kneeR: [1.5, 0, 0],
						shoulderL: [-1.9, 0, 0.25],
						elbowL: [-0.35, 0, 0],
						shoulderR: [-1.9, 0, -0.25],
						elbowR: [-0.35, 0, 0]
					});
					return rig;
				},
				[['k.kneeL', [0, -0.045, 0.02]]],
				0.14
			);
			return [
				...plinth(1.4, 2.0, 0.14),
				...horse(rig, 'h', {
					tail: [
						[0, 0, 0],
						[0, -0.18, -0.12],
						[0, -0.5, -0.14],
						[0, -0.85, -0.08]
					]
				}),
				rig.blob('h.saddle', [0, 0.02, 0], [0.25, 0.06, 0.3], [0, 0, 0], { blend: 0.04 }),
				rig.limb('h.saddle', [0, 0, 0], [0, -0.42, 0.04], 0.22, 0.3, { blend: 0.05, folds: 16, foldDepth: [0.004, 0.012] }),
				...man(rig, 's', { build: 1.08, hands: { L: 'fist', R: 'fist' }, beard: 'full', hair: 'curls', blend: 0.03 }),
				rig.limb('s.spine', [0, -0.1, 0], [0, 0.36, 0], 0.17, 0.17, { blend: 0.05, folds: 20, foldDepth: [0.004, 0.009], twist: 0.3 }),
				rig.limb('s.pelvis', [0, 0.05, 0], [0, -0.3, 0.06], 0.2, 0.3, { blend: 0.06, folds: 18, foldDepth: [0.006, 0.02] }),
				rig.limb('s.head', [0, 0.14, -0.005], [0, 0.24, -0.01], 0.09, 0.075, { blend: 0.02, folds: 12, foldDepth: [0.003, 0.003] }),
				rig.ball('s.head', [0, 0.34, -0.01], 0.105, { blend: 0.03 }),
				...[1, -1].flatMap((s) => [
					rig.limb('s.head', [s * 0.06, 0.19, -0.08], [s * 0.1, 0.04, -0.15], 0.016, 0.02, { blend: 0.02 }),
					rig.limb('s.head', [s * 0.1, 0.04, -0.15], [s * 0.13, -0.16, -0.17], 0.02, 0.026, { blend: 0.02 })
				]),
				...man(rig, 'k', { build: 1, hands: { L: 'reach', R: 'reach' }, beard: 'short', hair: 'short', blend: 0.03 }),
				rig.limb('k.chest', [0, 0.2, -0.08], [0, -0.42, -0.2], 0.1, 0.17, { blend: 0.06, folds: 12, foldDepth: [0.005, 0.014], twist: 0.5 }),
				rig.limb('k.spine', [0, 0.12, 0], [0, -0.12, 0.01], 0.14, 0.16, { blend: 0.04, folds: 16, foldDepth: [0.003, 0.009] })
			];
		}
	}
];
