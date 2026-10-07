<script module>
	import { CubicBezierCurve, CubicBezierCurve3, ExtrudeGeometry, LatheGeometry, Shape, TubeGeometry, Vector2, Vector3 } from 'three';
	import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

	/** Her extent with the prow, in meters, standing on y = 0 and centered on x and z, facing +z. */
	export const STATUE = { w: 0.64, h: 0.76, d: 0.76 };

	/** How tall the prow is, and how far forward it all sits so she's centered between bow and wingtips. */
	const PROW = 0.1;
	const FORWARD = 0.11;

	/**
	 * Turns a profile on a lathe, seam at the back, then moves every point by `shape`, which is
	 * given the point's angle around (0 in front, ±π behind) and its height, and answers how much
	 * further out and how far back to push it.
	 * @param {[number, number][]} profile radius by height
	 * @param {(angle: number, y: number) => [number, number]} shape
	 * @param {number} [segments]
	 * @param {number} [start]
	 * @param {number} [length]
	 */
	function turned(profile, shape, segments = 72, start = Math.PI, length = Math.PI * 2) {
		const geometry = new LatheGeometry(
			profile.map(([r, y]) => new Vector2(r, y)),
			segments,
			start,
			length
		);
		const position = geometry.attributes.position;
		for (let i = 0; i < position.count; i++) {
			const x = position.getX(i);
			const z = position.getZ(i);
			const r = Math.hypot(x, z);
			if (r < 1e-6) continue;
			const [out, back] = shape(Math.atan2(x, z), position.getY(i));
			const k = (r + out) / r;
			position.setX(i, x * k);
			position.setZ(i, z * k - back);
		}
		geometry.computeVertexNormals();
		return geometry;
	}

	/** The chiton from hem to hips: folds deepening toward the hem, pressed flat against her front by the wind and blown out behind. */
	function chiton() {
		return turned(
			[
				[0, 0],
				[0.078, 0],
				[0.075, 0.014],
				[0.065, 0.05],
				[0.057, 0.09],
				[0.055, 0.13],
				[0.058, 0.17],
				[0.062, 0.2],
				[0.06, 0.222],
				[0, 0.224]
			],
			(angle, y) => {
				const low = 1 - Math.min(1, y / 0.22);
				const front = Math.max(0, Math.cos(angle));
				const behind = Math.max(0, -Math.cos(angle));
				const folds = Math.sin(angle * 9 + y * 34) * (0.0018 + 0.0075 * low * (0.35 + behind));
				return [folds - 0.011 * front * (1 - 0.4 * low), behind * low * low * 0.065];
			}
		);
	}

	/** The himation falling down her back from the roll at her hips, heavier toward the hem. */
	function mantle() {
		return turned(
			[
				[0, 0.016],
				[0.098, 0.016],
				[0.09, 0.06],
				[0.079, 0.11],
				[0.071, 0.16],
				[0.067, 0.21],
				[0, 0.214]
			],
			(angle, y) => {
				const low = 1 - Math.min(1, y / 0.21);
				return [Math.sin(angle * 7 + y * 22) * 0.006 * (0.3 + low), low * 0.06];
			},
			40,
			Math.PI * 0.62,
			Math.PI * 0.76
		);
	}

	/** Her torso from the hips to where her neck broke off, broad across the shoulders, the thin chiton rippling over it. */
	function torso() {
		return turned(
			[
				[0, 0],
				[0.06, 0],
				[0.054, 0.035],
				[0.051, 0.056],
				[0.055, 0.08],
				[0.06, 0.104],
				[0.06, 0.128],
				[0.058, 0.15],
				[0.054, 0.166],
				[0.044, 0.177],
				[0.028, 0.184],
				[0.019, 0.187],
				[0.017, 0.193],
				[0, 0.195]
			],
			(angle, y) => [Math.sin(angle * 13 + y * 150) * 0.0011 * Math.min(1, y / 0.05), 0]
		);
	}

	/**
	 * One feather, quill along +x from its base to a rounded tip, the vane a little wider on the
	 * trailing side.
	 * @param {number} length
	 * @param {number} width
	 */
	function feather(length, width) {
		const half = width / 2;
		const shape = new Shape();
		shape.moveTo(0, -half * 0.3);
		shape.bezierCurveTo(length * 0.22, -half * 1.05, length * 0.72, -half * 1.1, length * 0.97, -half * 0.42);
		shape.quadraticCurveTo(length * 1.02, -half * 0.05, length * 0.95, half * 0.22);
		shape.bezierCurveTo(length * 0.72, half * 0.72, length * 0.24, half * 0.66, 0, half * 0.3);
		shape.closePath();
		return new ExtrudeGeometry(shape, { depth: 0.0026, curveSegments: 5, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1 });
	}

	/** A wing's leading edge, from her shoulder blade to its tip, in the wing's own plane: back along x, up along y. */
	const EDGE = [new Vector2(0, 0), new Vector2(0.045, 0.15), new Vector2(0.19, 0.25), new Vector2(0.35, 0.215)];

	/**
	 * The rows of feathers hanging from the leading edge, from the long primaries out at the tip
	 * and the secondaries along the inner wing to the two rows of coverts over them: where along
	 * the edge each row runs, how many feathers, the angle they hang at, and how long they are.
	 */
	const ROWS = [
		{ along: [0.6, 1], count: 9, angle: [-1.05, -0.32], length: [0.15, 0.21], width: 0.042, drop: 0.012 },
		{ along: [0.06, 0.62], count: 11, angle: [-1.62, -1.05], length: [0.115, 0.155], width: 0.04, drop: 0.012 },
		{ along: [0.03, 0.97], count: 16, angle: [-1.6, -0.52], length: [0.066, 0.088], width: 0.032, drop: 0.007 },
		{ along: [0, 0.93], count: 15, angle: [-1.4, -0.62], length: [0.038, 0.05], width: 0.026, drop: 0.002 }
	];
	/** How far each row stands out from the one beneath it, toward the outside of the wing. */
	const LAYER = 0.0034;

	/**
	 * A whole wing as one geometry: a solid plate in its outline, cut a little short of the
	 * feather tips so they fan past it, then every feather row over row, and the rounded leading edge.
	 */
	function wing() {
		const curve = new CubicBezierCurve(...EDGE);
		/** @type {import('three').BufferGeometry[]} */
		const parts = [];
		/** @type {Vector2[][]} */
		const tips = [];
		ROWS.forEach((row, layer) => {
			/** @type {Vector2[]} */
			const ends = [];
			for (let n = 0; n < row.count; n++) {
				const t = n / (row.count - 1);
				const lerp = (/** @type {number[]} */ range) => range[0] + (range[1] - range[0]) * t;
				const at = curve.getPoint(lerp(row.along));
				const length = lerp(row.length);
				const angle = lerp(row.angle);
				const part = feather(length, row.width);
				part.rotateX((n % 2 ? 1 : -1) * 0.1);
				part.rotateZ(angle);
				part.translate(at.x, at.y - row.drop, -layer * LAYER - (n % 2) * 0.0007);
				parts.push(part);
				ends.push(new Vector2(at.x + Math.cos(angle) * length * 0.86, at.y - row.drop + Math.sin(angle) * length * 0.86));
			}
			tips.push(ends);
		});
		const outline = new Shape([...curve.getPoints(16), ...tips[0].slice().reverse(), ...tips[1].slice().reverse()]);
		const plate = new ExtrudeGeometry(outline, { depth: 0.003, curveSegments: 4, bevelEnabled: false });
		plate.translate(0, 0, 0.0008);
		parts.push(plate);
		const rim = new TubeGeometry(new CubicBezierCurve3(...EDGE.map((point) => new Vector3(point.x, point.y, -1.5 * LAYER))), 40, 0.0065, 8);
		parts.push(rim.toNonIndexed());
		rim.dispose();
		const merged = /** @type {import('three').BufferGeometry} */ (mergeGeometries(parts));
		for (const part of parts) part.dispose();
		return merged;
	}

	/**
	 * The prow's outline seen from above, bow forward; `scale` shrinks it for the deck on top.
	 * @param {number} scale
	 */
	function bow(scale) {
		const shape = new Shape();
		shape.moveTo(-0.12 * scale, 0.18 * scale);
		shape.lineTo(0.12 * scale, 0.18 * scale);
		shape.lineTo(0.125 * scale, 0.02 * scale);
		shape.quadraticCurveTo(0.11 * scale, -0.16 * scale, 0, -0.26 * scale);
		shape.quadraticCurveTo(-0.11 * scale, -0.16 * scale, -0.125 * scale, 0.02 * scale);
		shape.closePath();
		return shape;
	}

	/**
	 * One course of the prow, laid flat with its bow toward +z, from `at` up.
	 * @param {number} scale
	 * @param {number} depth
	 * @param {number} bevel
	 * @param {number} at
	 */
	function course(scale, depth, bevel, at) {
		const geometry = new ExtrudeGeometry(bow(scale), { depth, curveSegments: 18, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 });
		geometry.rotateX(-Math.PI / 2);
		geometry.translate(0, at + bevel, 0);
		return geometry;
	}
</script>

<script>
	import { T } from '@threlte/core';
	import { BoxGeometry, CapsuleGeometry, DoubleSide, MeshStandardMaterial, SphereGeometry, TorusGeometry } from 'three';
	import { marble } from './materials.js';

	/**
	 * The Winged Victory of Samothrace, in marble: headless and armless as she survives, landing
	 * on a warship's prow with her left leg striding forward, the wind pressing her chiton against
	 * her and blowing her mantle out behind, and her wings swept back feather over feather.
	 */

	const stone = new MeshStandardMaterial({ map: marble(), color: '#f1ece3', roughness: 0.42, side: DoubleSide });
	const grey = new MeshStandardMaterial({ map: marble(), color: '#c9c3b9', roughness: 0.5 });

	const shapes = {
		chiton: chiton(),
		mantle: mantle(),
		torso: torso(),
		wing: wing(),
		hull: course(1, 0.064, 0.006, 0),
		deck: course(0.9, 0.016, 0.004, 0.076),
		oars: new BoxGeometry(0.034, 0.03, 0.15),
		breast: new SphereGeometry(0.022, 24, 16),
		girdle: new TorusGeometry(0.056, 0.0035, 8, 64),
		roll: new TorusGeometry(0.062, 0.011, 12, 64),
		thigh: new CapsuleGeometry(0.025, 0.065, 8, 20),
		shin: new CapsuleGeometry(0.02, 0.075, 8, 20)
	};

	$effect(() => () => {
		for (const geometry of Object.values(shapes)) geometry.dispose();
		stone.dispose();
		grey.dispose();
	});
</script>

<T.Group position.z={FORWARD}>
	<!-- The prow, in grey marble: the hull, the deck over it, and the outriggers along its sides. -->
	<T.Mesh geometry={shapes.hull} material={grey} castShadow receiveShadow />
	<T.Mesh geometry={shapes.deck} material={grey} castShadow receiveShadow />
	{#each [-1, 1] as side (side)}
		<T.Mesh geometry={shapes.oars} material={grey} position={[side * 0.138, 0.048, -0.06]} castShadow receiveShadow />
	{/each}

	<T.Group position.y={PROW - 0.003}>
		<T.Mesh geometry={shapes.chiton} material={stone} scale={[1.12, 1, 0.92]} castShadow receiveShadow />
		<T.Mesh geometry={shapes.mantle} material={stone} scale={[1.12, 1, 0.92]} castShadow receiveShadow />

		<!-- Her left leg, striding forward under the wet drapery. -->
		<T.Mesh geometry={shapes.thigh} material={stone} position={[0.03, 0.15, 0.034]} rotation.x={-0.6} castShadow />
		<T.Mesh geometry={shapes.shin} material={stone} position={[0.034, 0.062, 0.058]} rotation.x={0.12} castShadow />

		<!-- The himation, rolled at her hips. -->
		<T.Group position.y={0.205} rotation.z={0.12} scale={[1.2, 1, 0.92]}>
			<T.Mesh geometry={shapes.roll} material={stone} rotation.x={Math.PI / 2} castShadow />
		</T.Group>

		<!-- Her torso, leaning into the wind, and her wings swept back from her shoulder blades. -->
		<T.Group position.y={0.2} rotation={[0.14, -0.12, 0]}>
			<T.Mesh geometry={shapes.torso} material={stone} scale={[1.25, 1, 0.82]} castShadow receiveShadow />
			{#each [-1, 1] as side (side)}
				<T.Mesh geometry={shapes.breast} material={stone} position={[side * 0.027, 0.104, 0.036]} scale={[0.95, 0.8, 0.62]} castShadow />
			{/each}
			<T.Group position.y={0.086} scale={[1.25, 1, 0.82]}>
				<T.Mesh geometry={shapes.girdle} material={stone} rotation.x={Math.PI / 2} />
			</T.Group>
			{#each [1, -1] as mirror (mirror)}
				<T.Group scale.x={mirror}>
					<T.Group position={[-0.03, 0.155, -0.03]} rotation.y={Math.PI / 2 + 0.5}>
						<T.Group rotation={[-0.15, 0, 0.18]}>
							<T.Mesh geometry={shapes.wing} material={stone} castShadow receiveShadow />
						</T.Group>
					</T.Group>
				</T.Group>
			{/each}
		</T.Group>
	</T.Group>
</T.Group>
