import { IDENTITY, add, apply, box, cone, ellipsoid, multiply, rotation, sphere } from './sdf.js';

/**
 * Figures for sculpting: a rig of joints posed by rotation, and bodies built over it muscle by
 * muscle in each joint's own frame, so a pose only turns joints and the anatomy follows.
 *
 * Every figure faces +z with its left toward +x. A side `s` is +1 for left and -1 for right.
 * Rotations are radians about x, then y, then z, in the parent joint's frame:
 * - spine, chest, neck, head: +x bends forward, +y turns toward the left, +z leans to the right.
 * - shoulder and hip: -x swings the limb forward, `s *` z swings it out to the side.
 * - elbow: -x bends it. knee: +x bends it. ankle: -x lifts the toes.
 * Units are meters for a man 1.8 m tall and a horse 1.6 m at the withers.
 */

/** @typedef {import('./sdf.js').Vec} Vec */
/** @typedef {import('./sdf.js').Mat} Mat */
/** @typedef {import('./sdf.js').Primitive} Primitive */
/** @typedef {import('./sdf.js').Draping} Draping */
/** @typedef {[number, number, number]} Turn */
/** @typedef {Record<string, Turn>} Pose */
/** @typedef {'open' | 'fist' | 'grip' | 'reach'} Hand */

export class Rig {
	/** @type {Map<string, { parent: string | null, offset: Vec, turn: Mat }>} */
	#joints = new Map();
	/** @type {Map<string, { at: Vec, frame: Mat }>} */
	#solved = new Map();

	/**
	 * @param {string} name
	 * @param {string | null} parent
	 * @param {Vec} offset from the parent joint, in its frame, or from the origin for a root
	 * @param {Turn} [turn]
	 */
	joint(name, parent, offset, turn = [0, 0, 0]) {
		this.#joints.set(name, { parent, offset, turn: rotation(...turn) });
		this.#solved.clear();
		return this;
	}

	/** @param {string} name @returns {{ at: Vec, frame: Mat }} */
	solve(name) {
		const known = this.#solved.get(name);
		if (known) return known;
		const joint = this.#joints.get(name);
		if (!joint) throw new Error(`No joint ${name}`);
		const parent = joint.parent ? this.solve(joint.parent) : { at: /** @type {Vec} */ ([0, 0, 0]), frame: IDENTITY };
		const solved = { at: add(parent.at, apply(parent.frame, joint.offset)), frame: multiply(parent.frame, joint.turn) };
		this.#solved.set(name, solved);
		return solved;
	}

	/** A point given in a joint's frame, in the world. @param {string} name @param {Vec} local */
	point(name, local) {
		const { at, frame } = this.solve(name);
		return add(at, apply(frame, local));
	}

	/** A direction given in a joint's frame, in the world. @param {string} name @param {Vec} local */
	direction(name, local) {
		return apply(this.solve(name).frame, local);
	}

	/** A rotation given in a joint's frame, in the world. @param {string} name @param {Mat} [local] */
	frame(name, local = IDENTITY) {
		return multiply(this.solve(name).frame, local);
	}

	/** A cone between two points of a joint. @param {string} name @param {Vec} a @param {Vec} b @param {number} r1 @param {number} r2 @param {Draping} [draping] */
	limb(name, a, b, r1, r2, draping) {
		return cone(this.point(name, a), this.point(name, b), r1, r2, draping);
	}

	/** An ellipsoid in a joint's frame. @param {string} name @param {Vec} at @param {Vec} radii @param {Turn} [turn] @param {import('./sdf.js').Joining} [joining] */
	blob(name, at, radii, turn = [0, 0, 0], joining) {
		return ellipsoid(this.point(name, at), radii, this.frame(name, rotation(...turn)), joining);
	}

	/** A rounded box in a joint's frame. @param {string} name @param {Vec} at @param {Vec} half @param {number} round @param {Turn} [turn] @param {import('./sdf.js').Joining} [joining] */
	block(name, at, half, round, turn = [0, 0, 0], joining) {
		return box(this.point(name, at), half, round, this.frame(name, rotation(...turn)), joining);
	}

	/** A sphere in a joint's frame. @param {string} name @param {Vec} at @param {number} r @param {import('./sdf.js').Joining} [joining] */
	ball(name, at, r, joining) {
		return sphere(this.point(name, at), r, joining);
	}
}

const SIDES = /** @type {const} */ ([
	[1, 'L'],
	[-1, 'R']
]);

/**
 * Adds a man's skeleton to `rig`, named `${id}.pelvis` and so on, hanging from `parent` (or
 * standing in the world when it's null) at `offset` and `turn`.
 * @param {Rig} rig @param {string} id @param {string | null} parent @param {Vec} offset @param {Turn} turn @param {Pose} pose
 */
export function skeleton(rig, id, parent, offset, turn, pose) {
	const j = (/** @type {string} */ name) => `${id}.${name}`;
	const posed = (/** @type {string} */ name) => pose[name] ?? [0, 0, 0];
	rig.joint(j('pelvis'), parent, offset, turn);
	rig.joint(j('spine'), j('pelvis'), [0, 0.1, -0.01], posed('spine'));
	rig.joint(j('chest'), j('spine'), [0, 0.17, 0], posed('chest'));
	rig.joint(j('neck'), j('chest'), [0, 0.21, -0.015], posed('neck'));
	rig.joint(j('head'), j('neck'), [0, 0.085, 0.01], posed('head'));
	for (const [s, side] of SIDES) {
		rig.joint(j(`clavicle${side}`), j('chest'), [s * 0.02, 0.165, 0], posed(`clavicle${side}`));
		rig.joint(j(`shoulder${side}`), j(`clavicle${side}`), [s * 0.165, -0.01, -0.02], posed(`shoulder${side}`));
		rig.joint(j(`elbow${side}`), j(`shoulder${side}`), [0, -0.29, 0], posed(`elbow${side}`));
		rig.joint(j(`wrist${side}`), j(`elbow${side}`), [0, -0.255, 0], posed(`wrist${side}`));
		rig.joint(j(`hip${side}`), j('pelvis'), [s * 0.095, -0.06, 0], posed(`hip${side}`));
		rig.joint(j(`knee${side}`), j(`hip${side}`), [0, -0.44, 0], posed(`knee${side}`));
		rig.joint(j(`ankle${side}`), j(`knee${side}`), [0, -0.42, -0.015], posed(`ankle${side}`));
	}
}

/**
 * @typedef {{
 *   build?: number,
 *   blend?: number,
 *   hands?: { L?: Hand, R?: Hand },
 *   beard?: 'none' | 'short' | 'full',
 *   hair?: 'none' | 'curls' | 'short',
 *   feet?: boolean,
 *   head?: boolean,
 *   arms?: boolean
 * }} Body
 */

/**
 * The body over a skeleton made by `skeleton`. `build` thickens every muscle, 1 for a fit man.
 * @param {Rig} rig @param {string} id @param {Body} [body]
 * @returns {Primitive[]}
 */
export function man(rig, id, { build = 1, blend = 0.03, hands = {}, beard = 'none', hair = 'short', feet = true, head = true, arms = true } = {}) {
	const j = (/** @type {string} */ name) => `${id}.${name}`;
	const m = (/** @type {number} */ r) => r * build;
	/** The waist and hips thicken far less than the muscles do. */
	const w = (/** @type {number} */ r) => r * (1 + (build - 1) * 0.3);
	/** @type {Primitive[]} */
	const parts = [];
	const soft = { blend };
	const tight = { blend: blend * 0.6 };

	parts.push(rig.blob(j('pelvis'), [0, 0, 0], [w(0.15), 0.105, w(0.105)], [0, 0, 0], soft));
	parts.push(rig.blob(j('spine'), [0, 0.07, 0.005], [w(0.13), 0.12, w(0.095)], [0, 0, 0], soft));
	parts.push(rig.blob(j('spine'), [0, 0.08, 0.055], [w(0.07), 0.12, m(0.04)], [0, 0, 0], tight));
	for (let row = 0; row < 3; row++) {
		for (const [s] of SIDES) parts.push(rig.blob(j('spine'), [s * 0.026, 0.02 + row * 0.055, 0.088 + (build - 1) * 0.04], [0.022, 0.022, 0.012], [0, 0, 0], { blend: 0.014 }));
	}
	parts.push(rig.blob(j('chest'), [0, 0.08, 0], [m(0.148), 0.155, m(0.1)], [0, 0, 0], soft));
	parts.push(rig.blob(j('chest'), [0, 0.17, -0.045], [m(0.12), 0.05, m(0.05)], [0, 0, 0], soft));
	parts.push(rig.limb(j('neck'), [0, -0.01, -0.005], [0, 0.1, 0.01], m(0.058), m(0.052), soft));

	for (const [s, side] of SIDES) {
		parts.push(rig.blob(j('pelvis'), [s * 0.072, -0.035, -0.06], [w(0.082), 0.095, w(0.07)], [0, 0, 0], soft));
		parts.push(rig.blob(j('spine'), [s * 0.098, 0.04, 0.005], [w(0.05), 0.09, w(0.07)], [0, 0, 0], soft));
		parts.push(rig.blob(j('chest'), [s * 0.07, 0.112, 0.068], [m(0.074), 0.055, m(0.038)], [0, 0, s * 0.28], tight));
		parts.push(rig.blob(j('chest'), [s * 0.1, 0.05, -0.035], [m(0.06), 0.13, m(0.06)], [0, 0, s * 0.15], soft));
		parts.push(rig.limb(j('chest'), [0, 0.2, -0.035], [s * 0.15, 0.16, -0.03], m(0.045), m(0.034), soft));

		if (arms) {
			parts.push(rig.limb(j(`clavicle${side}`), [0, 0, 0], [s * 0.165, -0.01, -0.02], m(0.03), m(0.036), soft));
			parts.push(rig.blob(j(`shoulder${side}`), [s * 0.012, -0.035, 0], [m(0.056), 0.078, m(0.06)], [0, 0, 0], tight));
			parts.push(rig.limb(j(`shoulder${side}`), [0, 0, 0], [0, -0.29, 0], m(0.046), m(0.037), soft));
			parts.push(rig.blob(j(`shoulder${side}`), [0, -0.15, 0.022], [m(0.038), 0.08, m(0.04)], [0, 0, 0], tight));
			parts.push(rig.blob(j(`shoulder${side}`), [0, -0.13, -0.022], [m(0.041), 0.09, m(0.04)], [0, 0, 0], tight));
			parts.push(rig.ball(j(`elbow${side}`), [0, 0, -0.018], m(0.03), tight));
			parts.push(rig.limb(j(`elbow${side}`), [0, 0, 0], [0, -0.255, 0], m(0.04), m(0.025), soft));
			parts.push(rig.blob(j(`elbow${side}`), [s * 0.012, -0.065, 0.012], [m(0.041), 0.08, m(0.037)], [0, 0, 0], tight));
			parts.push(...hand(rig, j(`wrist${side}`), s, hands[side] ?? 'open', build));
		}

		parts.push(rig.limb(j(`hip${side}`), [0, 0.02, 0], [0, -0.44, 0], m(0.085), m(0.054), soft));
		parts.push(rig.blob(j(`hip${side}`), [s * 0.012, -0.2, 0.035], [m(0.07), 0.16, m(0.06)], [0, 0, 0], tight));
		parts.push(rig.blob(j(`hip${side}`), [-s * 0.03, -0.34, 0.03], [m(0.042), 0.06, m(0.04)], [0, 0, 0], tight));
		parts.push(rig.blob(j(`hip${side}`), [0, -0.2, -0.035], [m(0.06), 0.15, m(0.055)], [0, 0, 0], tight));
		parts.push(rig.ball(j(`knee${side}`), [0, 0, 0.042], m(0.03), tight));
		parts.push(rig.limb(j(`knee${side}`), [0, 0, 0], [0, -0.42, 0], m(0.05), m(0.03), soft));
		parts.push(rig.blob(j(`knee${side}`), [s * 0.006, -0.12, -0.035], [m(0.048), 0.11, m(0.048)], [0, 0, 0], tight));
		if (feet) {
			const ankle = j(`ankle${side}`);
			parts.push(rig.ball(ankle, [0, -0.04, -0.025], m(0.034), tight));
			parts.push(rig.blob(ankle, [0, -0.035, 0.05], [m(0.038), 0.03, 0.085], [0.12, 0, 0], tight));
			parts.push(rig.blob(ankle, [-s * 0.006, -0.05, 0.11], [m(0.042), 0.018, 0.04], [0, 0, 0], tight));
			for (let toe = 0; toe < 5; toe++) {
				const x = -s * (0.026 - toe * 0.0135);
				parts.push(rig.ball(ankle, [x, -0.055, 0.155 - toe * toe * 0.0025], toe === 0 ? 0.0135 : 0.0095 - toe * 0.0006, { blend: 0.008 }));
			}
		}
	}

	if (head) parts.push(...face(rig, j('head'), { beard, hair }));
	return parts;
}

/**
 * A hand at the end of a forearm, palm toward the body when the arm hangs.
 * @param {Rig} rig @param {string} wrist @param {number} s @param {Hand} style @param {number} build
 */
function hand(rig, wrist, s, style, build) {
	const tight = { blend: 0.008 };
	const k = (/** @type {number} */ r) => r * Math.sqrt(build);
	/** Index to little finger: how far forward each sits, how long it is, how thick. */
	const fingers = [
		[0.026, 0.043, 0.0095],
		[0.009, 0.048, 0.0098],
		[-0.008, 0.045, 0.0092],
		[-0.024, 0.036, 0.0082]
	];
	/** @type {Primitive[]} */
	const parts = [rig.block(wrist, [0, -0.05, 0.002], [k(0.015), 0.042, k(0.037)], 0.013, [0, 0, 0], { blend: 0.014 })];
	if (style === 'open' || style === 'reach') {
		const curl = style === 'reach' ? 0.25 : 0.45;
		for (const [z, long, r] of fingers) {
			const base = /** @type {Vec} */ ([0, -0.09, z]);
			const middle = /** @type {Vec} */ ([-s * long * 0.55 * Math.sin(curl), -0.09 - long * 0.55 * Math.cos(curl), z * 1.08]);
			const tip = /** @type {Vec} */ ([middle[0] - s * long * 0.45 * Math.sin(curl * 2.2), middle[1] - long * 0.45 * Math.cos(curl * 2.2), z * 1.12]);
			parts.push(rig.limb(wrist, base, middle, k(r), k(r * 0.9), tight), rig.limb(wrist, middle, tip, k(r * 0.9), k(r * 0.75), tight));
		}
		parts.push(
			rig.limb(wrist, [-s * 0.006, -0.025, 0.03], [-s * 0.016, -0.055, 0.056], k(0.014), k(0.011), tight),
			rig.limb(wrist, [-s * 0.016, -0.055, 0.056], [-s * 0.026, -0.08, 0.064], k(0.011), k(0.009), tight)
		);
		return parts;
	}
	for (const [z, , r] of fingers) {
		parts.push(rig.ball(wrist, [0, -0.094, z], k(r * 1.25), tight));
		parts.push(rig.limb(wrist, [-s * 0.008, -0.1, z], [-s * 0.028, -0.096, z * 0.95], k(r * 1.05), k(r * 0.95), tight));
		parts.push(rig.limb(wrist, [-s * 0.028, -0.096, z * 0.95], [-s * 0.03, -0.07, z * 0.9], k(r * 0.95), k(r * 0.85), tight));
	}
	parts.push(
		rig.limb(wrist, [-s * 0.006, -0.03, 0.032], [-s * 0.02, -0.06, 0.045], k(0.014), k(0.012), tight),
		rig.limb(wrist, [-s * 0.02, -0.06, 0.045], [-s * 0.033, -0.078, 0.02], k(0.012), k(0.01), tight)
	);
	return parts;
}

/**
 * A head: the skull, the planes of the face, deep-set eyes, and hair and a beard if asked.
 * @param {Rig} rig @param {string} head @param {{ beard: Body['beard'], hair: Body['hair'] }} style
 */
function face(rig, head, { beard, hair }) {
	const fine = { blend: 0.012 };
	const softer = { blend: 0.02 };
	/** @type {Primitive[]} */
	const parts = [
		rig.blob(head, [0, 0.105, -0.008], [0.081, 0.103, 0.097], [0, 0, 0], softer),
		rig.blob(head, [0, 0.068, 0.04], [0.068, 0.084, 0.068], [0, 0, 0], softer),
		rig.blob(head, [0, 0.024, 0.045], [0.058, 0.044, 0.054], [0, 0, 0], softer),
		rig.ball(head, [0, 0.004, 0.084], 0.024, fine),
		rig.blob(head, [0, 0.1, 0.079], [0.066, 0.017, 0.03], [0.2, 0, 0], fine),
		rig.limb(head, [0, 0.092, 0.094], [0, 0.054, 0.116], 0.01, 0.016, fine),
		rig.blob(head, [0, 0.051, 0.108], [0.02, 0.01, 0.012], [0, 0, 0], fine),
		rig.blob(head, [0, 0.031, 0.096], [0.023, 0.007, 0.011], [0, 0, 0], { blend: 0.006 }),
		rig.blob(head, [0, 0.018, 0.093], [0.02, 0.007, 0.01], [0, 0, 0], { blend: 0.006 })
	];
	for (const [s] of SIDES) {
		parts.push(rig.ball(head, [s * 0.031, 0.08, 0.101], 0.017, { blend: 0.012, carve: true }));
		parts.push(rig.ball(head, [s * 0.031, 0.079, 0.089], 0.0145, { blend: 0.004 }));
		parts.push(rig.blob(head, [s * 0.044, 0.062, 0.072], [0.024, 0.018, 0.02], [0, 0, 0], fine));
		parts.push(rig.blob(head, [s * 0.082, 0.074, 0.004], [0.011, 0.029, 0.019], [0, 0, 0], fine));
	}
	if (hair === 'curls') {
		for (let ring = 0; ring < 3; ring++) {
			const count = 9 - ring * 2;
			for (let n = 0; n < count; n++) {
				const angle = (n / count) * Math.PI * 2 + ring * 0.4;
				const lift = 0.14 + ring * 0.03;
				const reach = 0.075 - ring * 0.022;
				parts.push(rig.ball(head, [Math.sin(angle) * reach, lift, Math.cos(angle) * reach - 0.012], 0.03 - ring * 0.004, fine));
			}
		}
	} else if (hair === 'short') {
		parts.push(rig.blob(head, [0, 0.12, -0.015], [0.086, 0.094, 0.098], [0, 0, 0], fine));
	}
	if (beard === 'short' || beard === 'full') {
		const long = beard === 'full' ? 1 : 0.55;
		parts.push(rig.blob(head, [0, 0.022 - 0.02 * long, 0.065], [0.064, 0.05 + 0.035 * long, 0.05], [-0.15, 0, 0], softer));
		parts.push(rig.blob(head, [0, 0.042, 0.092], [0.034, 0.01, 0.014], [0, 0, 0], fine));
		if (beard === 'full') {
			for (let n = 0; n < 7; n++) {
				const x = (n - 3) * 0.017;
				parts.push(rig.limb(head, [x, 0.0, 0.085], [x * 1.1, -0.085 + Math.abs(x) * 0.6, 0.08], 0.014, 0.008, fine));
			}
		}
	}
	return parts;
}

/**
 * Adds a horse's skeleton to `rig`, named `${id}.barrel` and so on, the barrel at `offset`
 * and turned by `turn`.
 * @param {Rig} rig @param {string} id @param {Vec} offset @param {Turn} turn @param {Pose} pose
 */
export function stallion(rig, id, offset, turn, pose) {
	const j = (/** @type {string} */ name) => `${id}.${name}`;
	const posed = (/** @type {string} */ name) => pose[name] ?? [0, 0, 0];
	rig.joint(j('barrel'), null, offset, turn);
	rig.joint(j('withers'), j('barrel'), [0, 0.22, 0.42], posed('withers'));
	rig.joint(j('poll'), j('withers'), [0, 0.5, 0.3], posed('poll'));
	rig.joint(j('saddle'), j('barrel'), [0, 0.3, 0.08]);
	rig.joint(j('dock'), j('barrel'), [0, 0.18, -0.72], posed('dock'));
	for (const [s, side] of SIDES) {
		rig.joint(j(`shoulder${side}`), j('barrel'), [s * 0.16, -0.08, 0.5], posed(`shoulder${side}`));
		rig.joint(j(`knee${side}`), j(`shoulder${side}`), [0, -0.5, -0.02], posed(`knee${side}`));
		rig.joint(j(`fetlock${side}`), j(`knee${side}`), [0, -0.33, 0], posed(`fetlock${side}`));
		rig.joint(j(`hip${side}`), j('barrel'), [s * 0.17, 0.08, -0.56], posed(`hip${side}`));
		rig.joint(j(`hock${side}`), j(`hip${side}`), [0, -0.68, 0.06], posed(`hock${side}`));
		rig.joint(j(`hindFetlock${side}`), j(`hock${side}`), [0, -0.42, -0.04], posed(`hindFetlock${side}`));
	}
}

/**
 * A horse over a skeleton made by `stallion`: the barrel and its muscles, a crested neck with a
 * mane, the head, four legs, and a tail that follows `tail`, a list of points behind the dock in
 * its frame.
 * @param {Rig} rig @param {string} id @param {{ tail: Vec[], mane?: number }} options
 * @returns {Primitive[]}
 */
export function horse(rig, id, { tail, mane = 0.05 }) {
	const j = (/** @type {string} */ name) => `${id}.${name}`;
	const soft = { blend: 0.07 };
	const firm = { blend: 0.04 };
	const fine = { blend: 0.02 };
	/** @type {Primitive[]} */
	const parts = [
		rig.blob(j('barrel'), [0, 0.02, -0.02], [0.29, 0.31, 0.62], [0, 0, 0], soft),
		rig.blob(j('barrel'), [0, 0.0, 0.42], [0.25, 0.33, 0.26], [0, 0, 0], soft),
		rig.blob(j('barrel'), [0, 0.1, -0.52], [0.26, 0.28, 0.3], [0, 0, 0], soft),
		rig.blob(j('barrel'), [0, 0.22, 0.25], [0.13, 0.12, 0.25], [0, 0, 0], soft),
		rig.blob(j('barrel'), [0, -0.12, 0.62], [0.17, 0.15, 0.1], [0, 0, 0], firm),
		rig.limb(j('withers'), [0, -0.1, -0.08], [0, 0.5, 0.3], 0.22, 0.12, soft),
		rig.limb(j('withers'), [0, 0.06, -0.12], [0, 0.5, 0.22], 0.12, 0.08, firm)
	];
	for (let n = 0; n < 9; n++) {
		const t = n / 8;
		const at = /** @type {Vec} */ ([0, 0.02 + 0.5 * t, -0.14 + 0.38 * t]);
		parts.push(rig.blob(j('withers'), at, [0.03, mane, 0.05], [0.4 + Math.sin(n * 2.3) * 0.25, 0, Math.sin(n * 1.7) * 0.5], fine));
	}
	parts.push(
		rig.blob(j('poll'), [0, -0.02, 0.05], [0.075, 0.08, 0.1], [0.7, 0, 0], firm),
		rig.limb(j('poll'), [0, -0.04, 0.09], [0, -0.38, 0.33], 0.072, 0.052, firm),
		rig.blob(j('poll'), [0, -0.39, 0.345], [0.058, 0.06, 0.065], [0.7, 0, 0], fine),
		rig.blob(j('poll'), [0, -0.13, 0.02], [0.06, 0.12, 0.09], [0.55, 0, 0], firm),
		rig.limb(j('poll'), [0, -0.1, -0.02], [0, -0.33, 0.24], 0.035, 0.03, fine)
	);
	for (const [s, side] of SIDES) {
		parts.push(rig.limb(j('poll'), [s * 0.035, 0.03, 0.0], [s * 0.05, 0.14, -0.03], 0.024, 0.006, fine));
		parts.push(rig.ball(j('poll'), [s * 0.068, -0.09, 0.13], 0.02, fine));
		parts.push(rig.blob(j('poll'), [s * 0.05, -0.13, 0.06], [0.03, 0.07, 0.05], [0.6, 0, 0], fine));
		parts.push(rig.ball(j('poll'), [s * 0.032, -0.41, 0.4], 0.014, { blend: 0.01, carve: true }));

		parts.push(rig.blob(j('barrel'), [s * 0.13, -0.02, 0.44], [0.12, 0.28, 0.17], [-0.3, 0, 0], firm));
		parts.push(rig.blob(j('barrel'), [s * 0.14, 0.02, -0.55], [0.15, 0.27, 0.24], [0.2, 0, 0], firm));

		const shoulder = j(`shoulder${side}`);
		const knee = j(`knee${side}`);
		const fetlock = j(`fetlock${side}`);
		parts.push(rig.limb(shoulder, [0, 0.05, 0], [0, -0.5, -0.02], 0.1, 0.055, firm));
		parts.push(rig.blob(shoulder, [0, -0.2, 0.02], [0.075, 0.18, 0.08], [0, 0, 0], fine));
		parts.push(rig.ball(knee, [0, 0, 0.005], 0.05, fine));
		parts.push(rig.limb(knee, [0, 0, 0], [0, -0.33, 0], 0.042, 0.035, fine));
		parts.push(rig.ball(fetlock, [0, 0, 0], 0.045, fine));
		parts.push(rig.limb(fetlock, [0, 0, 0], [0, -0.1, 0.05], 0.04, 0.036, fine));
		parts.push(rig.limb(fetlock, [0, -0.1, 0.05], [0, -0.17, 0.08], 0.05, 0.058, { blend: 0.012 }));

		const hip = j(`hip${side}`);
		const hock = j(`hock${side}`);
		const hindFetlock = j(`hindFetlock${side}`);
		parts.push(rig.limb(hip, [0, 0, 0], [0, -0.68, 0.06], 0.13, 0.06, firm));
		parts.push(rig.blob(hip, [0, -0.25, 0.04], [0.11, 0.25, 0.14], [0.15, 0, 0], firm));
		parts.push(rig.ball(hock, [0, 0, -0.03], 0.05, fine));
		parts.push(rig.limb(hock, [0, 0, 0], [0, -0.42, -0.04], 0.05, 0.036, fine));
		parts.push(rig.ball(hindFetlock, [0, 0, 0], 0.045, fine));
		parts.push(rig.limb(hindFetlock, [0, 0, 0], [0, -0.1, 0.05], 0.04, 0.036, fine));
		parts.push(rig.limb(hindFetlock, [0, -0.1, 0.05], [0, -0.17, 0.08], 0.05, 0.058, { blend: 0.012 }));
	}
	for (let n = 0; n < tail.length - 1; n++) {
		const t = n / (tail.length - 1);
		parts.push(rig.limb(j('dock'), tail[n], tail[n + 1], 0.07 * (1 - t) + 0.03, 0.07 * (1 - (n + 1) / (tail.length - 1)) + 0.03, { blend: 0.04, folds: 5, foldDepth: [0.004, 0.012], twist: 2 }));
	}
	return parts;
}
