<script module>
	/** The level id that shows the whole house with its roof on. */
	export const ROOF = 'roof';

	/** Camera position, then target, relative to the middle of the house at ground level. */
	export const VIEWS = {
		axon: { name: 'Axon', look: [17, 12, 20, 0, 2.8, 0] },
		front: { name: 'Front', look: [0, 3.2, 30, 0, 3.6, 0] },
		plan: { name: 'Plan', look: [0, 36, 0.01, 0, 0, 0] }
	};
</script>

<script>
	import { T, useThrelte } from '@threlte/core';
	import { CameraControls, interactivity } from '@threlte/extras';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Box3, PMREMGenerator, Sphere, Vector3 } from 'three';
	import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
	import { GAP } from './Layer.svelte';
	import Level from './Level.svelte';
	import Roof from './Roof.svelte';
	import Site from './Site.svelte';
	import { middle, stack } from './geometry.js';
	import { createPalette, disposePalette } from './materials.js';

	/**
	 * @type {{
	 *   house: import('./plan.js').House,
	 *   level: string,
	 *   exploded?: boolean,
	 *   panning?: boolean,
	 *   hovered?: string | null,
	 *   selected?: string | null,
	 *   onhover?: (id: string | null) => void,
	 *   onpick?: (id: string) => void
	 * }}
	 */
	let {
		house,
		level,
		exploded = false,
		panning = false,
		hovered = null,
		selected = null,
		onhover,
		onpick
	} = $props();

	const { renderer, scene } = useThrelte();
	const ground = createPalette();

	const heights = $derived(stack(house));
	/** Index of the storey being looked into; −1 with the roof on. */
	const current = $derived(house.floors.findIndex((floor) => floor.id === level));
	/** World position of the house's back-left corner, from where it sits on the lot. */
	const corner = $derived([
		house.site.house[0] - house.site.width / 2,
		house.site.house[1] - house.site.depth / 2
	]);

	/** @type {import('@threlte/extras').CameraControlsRef | undefined} */
	let controls = $state.raw();
	/** The controls' own bindings, read back so panning can swap them without importing camera-controls. */
	let actions = { rotate: 0, truck: 0, touchRotate: 0, touchTruck: 0 };

	interactivity({ filter: (hits) => hits.filter((hit) => shown(hit.object)).slice(0, 1) });

	const pmrem = new PMREMGenerator(/** @type {import('three').WebGLRenderer} */ (renderer));
	const studio = new RoomEnvironment();
	const environment = pmrem.fromScene(studio, 0.04).texture;
	studio.dispose();
	scene.environment = environment;
	scene.environmentIntensity = 0.5;

	$effect(() => () => {
		scene.environment = null;
		environment.dispose();
		pmrem.dispose();
		disposePalette(ground);
	});

	$effect(() => {
		if (!controls) return;
		controls.mouseButtons.left = panning ? actions.truck : actions.rotate;
		controls.touches.one = panning ? actions.touchTruck : actions.touchRotate;
	});

	/** Raycasts ignore visibility, so skip anything inside a hidden storey. @param {import('three').Object3D | null} node */
	function shown(node) {
		for (; node; node = node.parent) if (!node.visible) return false;
		return true;
	}

	const smooth = () => !prefersReducedMotion.current;

	/** Where a storey's floor is drawn right now, spread apart or not. @param {number} index */
	const floorY = (index) => heights.floors[index] + (exploded ? index * GAP : 0);

	/** @returns {[number, number]} */
	const centre = () => [corner[0] + house.width / 2, corner[1] + house.depth / 2];

	/** @param {import('@threlte/extras').CameraControlsRef} ref */
	function setup(ref) {
		actions = {
			rotate: ref.mouseButtons.left,
			truck: ref.mouseButtons.right,
			touchRotate: ref.touches.one,
			touchTruck: ref.touches.three
		};
		ref.setBoundary(new Box3(new Vector3(-20, -1, -20), new Vector3(20, 16, 20)));
		controls = ref;
		view('axon', false);
	}

	/** @param {import('three').DirectionalLight} light */
	function sun(light) {
		const { shadow } = light;
		shadow.mapSize.set(2048, 2048);
		Object.assign(shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 70 });
		shadow.camera.updateProjectionMatrix();
		shadow.bias = -0.0004;
		shadow.normalBias = 0.03;
	}

	/** @param {keyof typeof VIEWS} name */
	export function view(name, animate = smooth()) {
		const [cx, cz] = centre();
		const [px, py, pz, tx, ty, tz] = VIEWS[name].look;
		controls?.setLookAt(cx + px, py, cz + pz, cx + tx, ty, cz + tz, animate);
	}

	/** Brings the target to a level's height and tips the camera so you can see into it. @param {string} id */
	export function frame(id) {
		if (!controls) return;
		const target = controls.getTarget(new Vector3(), true);
		const index = house.floors.findIndex((floor) => floor.id === id);
		const top = heights.eaves + (exploded ? house.floors.length * GAP : 0);
		controls.moveTo(target.x, index < 0 ? top / 2 : floorY(index) + 1, target.z, smooth());
		if (index >= 0 && controls.polarAngle > 1.05) controls.rotatePolarTo(1.05, smooth());
		if (exploded) controls.dollyTo(Math.max(controls.distance, 34), smooth());
	}

	/** Frames one room from above. @param {string} id */
	export function focus(id) {
		const index = house.floors.findIndex((floor) => floor.rooms.some((room) => room.id === id));
		const room = house.floors[index]?.rooms.find((candidate) => candidate.id === id);
		if (!controls || !room) return;
		const [x, z] = middle(room.rect);
		const radius = Math.hypot(room.rect[2], room.rect[3]) / 2 + 0.5;
		const point = new Vector3(corner[0] + x, floorY(index) + 1, corner[1] + z);
		controls.fitToSphere(new Sphere(point, radius), smooth());
		if (controls.polarAngle > 0.9) controls.rotatePolarTo(0.9, smooth());
	}

	/** Slides the view along the ground: x to the right, z away from you. @param {number} x @param {number} z */
	export function nudge(x, z) {
		controls?.truck(x, 0, smooth());
		controls?.forward(z, smooth());
	}

	/** @param {number} amount metres toward the target */
	export function zoom(amount) {
		controls?.dolly(amount, smooth());
	}
</script>

<T.PerspectiveCamera makeDefault fov={30} near={0.1} far={400}>
	<CameraControls
		oncreate={setup}
		minDistance={3}
		maxDistance={90}
		maxPolarAngle={Math.PI / 2 - 0.02}
		dollyToCursor
		smoothTime={0.32}
		draggingSmoothTime={0.12}
	/>
</T.PerspectiveCamera>

<T.HemisphereLight args={['#fffdf8', '#d7d0c2', 1.25]} />
<T.DirectionalLight position={[12, 20, 14]} intensity={2.2} castShadow oncreate={sun} />

<Site site={house.site} grade={house.grade} paints={ground} />

<T.Group position={[corner[0], 0, corner[1]]}>
	{#each house.floors as floor, index (floor.id)}
		<Level
			{house}
			{index}
			elevation={heights.floors[index]}
			hidden={level !== ROOF && index > current}
			{exploded}
			active={level === floor.id}
			{hovered}
			{selected}
			{onhover}
			{onpick}
		/>
	{/each}
	<Roof {house} index={house.floors.length} elevation={heights.eaves} hidden={level !== ROOF} {exploded} />
</T.Group>
