<script>
	import { onDestroy } from 'svelte';
	import { T, useTask, useThrelte } from '@threlte/core';
	import {
		BoxGeometry,
		CanvasTexture,
		MeshStandardMaterial,
		PlaneGeometry,
		SRGBColorSpace
	} from 'three';
	import { paint, reliefFor, sample } from './sheets.js';
	import { groundHeight, loadRelief, metresAt } from './relief.js';

	/** @type {{ maps: import('./window.js').MapSpec[] }} */
	let { maps } = $props();

	const { scene, renderer, invalidate, camera } = useThrelte();
	scene.background = null;
	renderer.setClearColor(0x000000, 0);

	const W = 1.16;
	const H = 1.72;
	const SEGS = 64;

	/**
	 * @param {import('./window.js').MapSpec} spec
	 */
	function build(spec) {
		const frame = spec.frame ?? null;
		const geo = new PlaneGeometry(W, H, SEGS, SEGS);
		const position = geo.attributes.position;
		const uv = geo.attributes.uv;
		const regions = reliefFor(spec.world, frame);
		const span = Math.min(W, H);
		for (let i = 0; i < position.count; i++) {
			const [lon, lat] = sample(spec.world, uv.getX(i), uv.getY(i), frame);
			position.setZ(i, groundHeight(metresAt(regions, lon, lat), span));
		}
		geo.computeVertexNormals();
		const canvas = document.createElement('canvas');
		canvas.width = 720;
		canvas.height = Math.round(720 * (H / W));
		const ctx = canvas.getContext('2d');
		if (ctx) {
			paint(ctx, spec.world, spec.from ?? 0, spec.period ?? 0, 1, 0.35, {
				frame,
				marks: spec.marks,
				focus: spec.focus,
				cities: false,
				star: false,
				scale: 0.82
			});
		}
		const tex = new CanvasTexture(canvas);
		tex.colorSpace = SRGBColorSpace;
		tex.anisotropy = 8;
		const face = new MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0 });
		const edge = new MeshStandardMaterial({ color: '#c9b89a', roughness: 0.92, metalness: 0 });
		const back = new BoxGeometry(W, H, 0.055);
		return { geo, tex, face, edge, back };
	}

	/** @type {ReturnType<typeof build>[] } */
	let slabs = $state([]);
	let alive = true;
	let generation = 0;
	let aimed = false;

	$effect(() => {
		const specs = maps;
		const token = ++generation;
		Promise.all(specs.map((spec) => loadRelief(reliefFor(spec.world, spec.frame ?? null)))).then(() => {
			if (!alive || token !== generation) return;
			const old = slabs;
			slabs = specs.map((spec) => build(spec));
			for (const slab of old) dispose(slab);
			invalidate();
		});
	});

	/** @param {ReturnType<typeof build>} slab */
	function dispose(slab) {
		slab.geo.dispose();
		slab.back.dispose();
		slab.tex.dispose();
		slab.face.dispose();
		slab.edge.dispose();
	}

	useTask(() => {
		const current = camera.current;
		if (!current || aimed) return;
		current.position.set(0, 0.42, 3.15);
		current.lookAt(0, 0.02, 0);
		aimed = true;
		invalidate();
	});

	onDestroy(() => {
		alive = false;
		for (const slab of slabs) dispose(slab);
	});
</script>

<T.PerspectiveCamera makeDefault fov={28} near={0.05} far={20} position={[0, 0.42, 3.15]} />
<T.AmbientLight intensity={0.82} />
<T.DirectionalLight position={[1.4, 2.4, 2.2]} intensity={1.35} />
{#if slabs.length === 2}
	<T.Group position={[-0.58, -0.02, 0]} rotation={[-0.16, 0.18, -0.14]}>
		<T.Mesh geometry={slabs[0].back} material={slabs[0].edge} position={[0, 0, -0.02]} />
		<T.Mesh geometry={slabs[0].geo} material={slabs[0].face} />
	</T.Group>
	<T.Group position={[0.58, -0.02, 0]} rotation={[-0.16, -0.18, 0.14]}>
		<T.Mesh geometry={slabs[1].back} material={slabs[1].edge} position={[0, 0, -0.02]} />
		<T.Mesh geometry={slabs[1].geo} material={slabs[1].face} />
	</T.Group>
{/if}
