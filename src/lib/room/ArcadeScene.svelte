<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { on } from 'svelte/events';
	import { MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector3, VideoTexture } from 'three';
	import Box from './Box.svelte';
	import Cartridge from './Cartridge.svelte';
	import Lights from './Lights.svelte';
	import { paintKeys } from './keyboard.js';
	import { cover, surface } from './surface.js';

	/**
	 * A desk for the games: a monitor playing whichever game is shown, a keyboard in front of
	 * it, and the cartridges standing in a row. Pointing at a cartridge puts its game on the
	 * screen; clicking one puts it in, and clicking the screen or the keyboard starts it.
	 * The screen only plays while `playing`, so it rests while it's out of view.
	 * @type {{
	 *   games: import('$lib/directions/content.js').Work[],
	 *   shown: import('$lib/directions/content.js').Work,
	 *   inserted: number,
	 *   active: string | null,
	 *   playing: boolean,
	 *   still: boolean,
	 *   oninsert: (i: number) => void,
	 *   onhover: (id: string, on: boolean) => void,
	 *   onpoint: (on: boolean) => void,
	 *   onstart: () => void
	 * }}
	 */
	let { games, shown, inserted, active, playing, still, oninsert, onhover, onpoint, onstart } = $props();

	const MONITOR = { w: 0.64, h: 0.415, d: 0.022, y: 0.15, z: -0.16 };
	const SCREEN = { w: 0.6, h: 0.375 };
	const KEYBOARD = { w: 0.44, h: 0.014, d: 0.135, z: 0.13 };
	const ROW = { z: 0.4, step: 0.128, tilt: -0.32 };
	const TARGET = new Vector3(0, 0.25, 0.08);
	const DIRECTION = new Vector3(0, 0.3, 1).normalize();
	const FOV = 24;

	const { size, invalidate } = useThrelte();
	interactivity({ filter: (hits) => hits.slice(0, 1) });

	const loader = new TextureLoader();
	const video = document.createElement('video');
	Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'auto' });
	const film = new VideoTexture(video);
	film.colorSpace = SRGBColorSpace;
	const glass = new MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
	const pane = new PlaneGeometry(SCREEN.w, SCREEN.h);
	const bezel = new MeshBasicMaterial({ color: '#101012' });
	const bezelPane = new PlaneGeometry(MONITOR.w - 0.01, MONITOR.h - 0.01);

	const keys = surface(KEYBOARD.w - 0.02, KEYBOARD.d - 0.02);
	keys.paint((ctx, w, h) => paintKeys(ctx, w, h, { deck: '#e7e5df', key: '#fbfaf7', accent: '#ff004c' }));
	const keyFace = new MeshStandardMaterial({ map: keys.texture, roughness: 0.75 });
	const keyPane = new PlaneGeometry(KEYBOARD.w - 0.02, KEYBOARD.d - 0.02);

	/** Whether the video has frames of the game that's shown, so it can replace the poster. */
	let rolling = $state(false);
	/** @type {import('three').Texture | null} */
	let poster = $state.raw(null);

	$effect(() => {
		const stop = [
			on(video, 'loadeddata', () => {
				cover(film, SCREEN.w / SCREEN.h, video.videoWidth / video.videoHeight);
				rolling = true;
			}),
			on(video, 'emptied', () => (rolling = false))
		];
		return () => stop.forEach((off) => off());
	});

	$effect(() => {
		const src = shown.media?.kind === 'video' ? shown.media.src : undefined;
		if (!src) return;
		video.src = src;
	});

	$effect(() => {
		if (playing && rolling) video.play().catch(() => {});
		else video.pause();
	});

	$effect(() => {
		const src = shown.media?.poster;
		if (!src) return;
		let live = true;
		loader.load(src, (texture) => {
			if (!live) return texture.dispose();
			texture.colorSpace = SRGBColorSpace;
			cover(texture, SCREEN.w / SCREEN.h);
			poster = texture;
		});
		return () => {
			live = false;
		};
	});

	$effect(() => {
		const used = poster;
		return () => used?.dispose();
	});

	$effect(() => {
		glass.map = rolling ? film : poster;
		glass.needsUpdate = true;
		invalidate();
	});

	$effect(() => () => {
		video.pause();
		video.removeAttribute('src');
		video.load();
		film.dispose();
		glass.dispose();
		pane.dispose();
		bezel.dispose();
		bezelPane.dispose();
		keys.texture.dispose();
		keyFace.dispose();
		keyPane.dispose();
	});

	/** @type {import('three').PerspectiveCamera | undefined} */
	let lens = $state();
	let framed = { width: 0, height: 0 };

	useTask(
		() => {
			if (rolling && !video.paused) invalidate();
			if (!lens) return;
			const { width, height } = size.current;
			if (width === framed.width && height === framed.height) return;
			framed = { width, height };
			const half = Math.tan(((FOV / 2) * Math.PI) / 180);
			const distance = Math.max(0.44 / half, 0.6 / (half * (width / Math.max(1, height))));
			lens.position.copy(TARGET).addScaledVector(DIRECTION, distance);
			lens.lookAt(TARGET);
			invalidate();
		},
		{ autoInvalidate: false }
	);

	/** Clicks that start the game, and pointing that says so. */
	const starter = {
		onclick: (/** @type {any} */ event) => {
			event.stopPropagation();
			onstart();
		},
		onpointerenter: () => onpoint(true),
		onpointerleave: () => onpoint(false)
	};
</script>

<T.PerspectiveCamera bind:ref={lens} makeDefault fov={FOV} near={0.05} far={10} />

<Lights reach={1.1} resolution={1024} />

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
	<T.PlaneGeometry args={[4, 4]} />
	<T.ShadowMaterial opacity={0.1} />
</T.Mesh>

<!-- The monitor on its stand. -->
<Box size={[0.22, 0.01, 0.15]} radius={0.005} color="#e9e8e4" roughness={0.35} sheen={0.4} position={[0, 0.005, MONITOR.z - 0.02]} />
<Box size={[0.06, MONITOR.y + 0.12, 0.014]} radius={0.005} color="#e9e8e4" roughness={0.35} sheen={0.4} position={[0, (MONITOR.y + 0.12) / 2, MONITOR.z - 0.05]} />
<T.Group position={[0, MONITOR.y, MONITOR.z]}>
	<Box size={[MONITOR.w, MONITOR.h, MONITOR.d]} radius={0.008} color="#f0efeb" roughness={0.35} sheen={0.4} position={[0, MONITOR.h / 2, 0]} />
	<T.Mesh geometry={bezelPane} material={bezel} position={[0, MONITOR.h / 2, MONITOR.d / 2 + 0.0005]} />
	<T.Mesh geometry={pane} material={glass} position={[0, MONITOR.h / 2 + 0.006, MONITOR.d / 2 + 0.001]} {...starter} />
</T.Group>

<!-- The keyboard, its Enter key lit. -->
<T.Group position={[0, 0, KEYBOARD.z]} rotation.x={0.04}>
	<Box size={[KEYBOARD.w, KEYBOARD.h, KEYBOARD.d]} radius={0.006} color="#efeee9" roughness={0.4} sheen={0.3} position={[0, KEYBOARD.h / 2, 0]} />
	<T.Mesh geometry={keyPane} material={keyFace} position={[0, KEYBOARD.h + 0.0006, 0]} rotation.x={-Math.PI / 2} receiveShadow {...starter} />
</T.Group>

{#each games as game, i (game.id)}
	<Cartridge
		image={game.media?.poster}
		position={[(i - (games.length - 1) / 2) * ROW.step, 0, ROW.z]}
		rotation={[ROW.tilt, 0, 0]}
		lit={game.id === active}
		inserted={i === inserted}
		{still}
		onpick={() => oninsert(i)}
		onhover={(on) => onhover(game.id, on)}
	/>
{/each}
