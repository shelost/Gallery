<script module>
	/** Air around the boards, in meters. */
	export const PAD = 0.07;
	const FOV = 22;
</script>

<script>
	import { T, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { BoxGeometry, MeshStandardMaterial, PlaneGeometry, ShadowMaterial } from 'three';
	import { BOARD } from './layout.js';
	import { studio } from './studio.js';
	import Piece from './Piece.svelte';
	import Plant from './Plant.svelte';
	import Turntable from './Turntable.svelte';

	/**
	 * Floating boards on the page's own background. The page is the wall: the canvas is
	 * transparent, and only the shadows the boards and objects cast are drawn onto it.
	 * @type {{
	 *   wall: import('./layout.js').Wall,
	 *   lifted: string | null,
	 *   platter: import('$lib/directions/content.js').ShelfItem | undefined,
	 *   still: boolean,
	 *   onpick: (key: string) => void,
	 *   onhover: (key: string | null) => void
	 * }}
	 */
	let { wall, lifted, platter, still, onpick, onhover } = $props();

	const { renderer, scene } = useThrelte();

	interactivity({ filter: (hits) => hits.slice(0, 1) });

	const unlight = studio(/** @type {import('three').WebGLRenderer} */ (renderer), scene, 0.45);

	const oak = new MeshStandardMaterial({ color: '#c9a57a', roughness: 0.58 });
	const catcher = new ShadowMaterial({ opacity: 0.17 });

	const board = $derived(new BoxGeometry(wall.width - PAD, BOARD.thickness, BOARD.depth));
	const plane = $derived(new PlaneGeometry(wall.width * 4, wall.height * 4));

	$effect(() => {
		const used = [board, plane];
		return () => used.forEach((geometry) => geometry.dispose());
	});

	$effect(() => () => {
		unlight();
		oak.dispose();
		catcher.dispose();
	});

	/** Square on, from far enough back that the whole wall fits, looking a touch down onto the boards. */
	const camera = $derived.by(() => {
		const fit = (wall.height + PAD * 2) / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
		const focus = BOARD.depth / 2;
		return { position: /** @type {[number, number, number]} */ ([0, fit * 0.06, focus + fit]), focus };
	});

	/** @type {import('three').PerspectiveCamera | undefined} */
	let lens = $state();

	$effect(() => {
		if (!lens) return;
		lens.position.set(...camera.position);
		lens.lookAt(0, 0, camera.focus);
	});

	const reach = $derived(Math.max(wall.width, wall.height) / 2 + 0.5);

	/** @param {import('three').DirectionalLight} light */
	function sun(light) {
		const { shadow } = light;
		shadow.mapSize.set(2048, 2048);
		shadow.bias = -0.0003;
		shadow.normalBias = 0.02;
		shadow.radius = 3;
	}

	/** @type {import('three').DirectionalLight | undefined} */
	let light = $state();

	$effect(() => {
		if (!light) return;
		Object.assign(light.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 0.1, far: 12 });
		light.shadow.camera.updateProjectionMatrix();
	});
</script>

<T.PerspectiveCamera bind:ref={lens} makeDefault fov={FOV} near={0.05} far={40} />

<T.HemisphereLight args={['#fffdf8', '#d9d1c3', 1.15]} />
<T.DirectionalLight
	bind:ref={light}
	position={[-wall.width * 0.35, wall.height * 0.5 + 1.6, 2.4]}
	intensity={2.1}
	castShadow
	oncreate={sun}
/>

<T.Mesh geometry={plane} material={catcher} receiveShadow />

{#each wall.rows as row, r (r)}
	<T.Group position.y={row.y}>
		<T.Mesh geometry={board} material={oak} position={[0, -BOARD.thickness / 2, BOARD.depth / 2]} castShadow receiveShadow />
		{#each row.pieces as piece (piece.key)}
			<T.Group position.x={piece.x}>
				{#if piece.type === 'item'}
					<Piece
						{piece}
						{still}
						lifted={lifted === piece.key}
						onpick={() => onpick(piece.key)}
						onhover={(on) => onhover(on ? piece.key : null)}
					/>
				{:else if piece.type === 'deck'}
					<Turntable
						item={platter}
						{still}
						onpick={() => onpick(piece.key)}
						onhover={(on) => onhover(on ? piece.key : null)}
					/>
				{:else}
					<Plant {piece} />
				{/if}
			</T.Group>
		{/each}
	</T.Group>
{/each}
