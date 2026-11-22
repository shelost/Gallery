<script>
	import { onDestroy } from 'svelte';
	import { T, useTask, useThrelte } from '@threlte/core';
	import { CanvasTexture, Color, PerspectiveCamera, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three';
	import { paint, reliefFor, reliefGeometry, sample } from './sheets.js';
	import { groundHeight, loadRelief, metresAt } from './relief.js';

	/** @type {{ world: import('./sheets.js').World, origin: number, index: number, t: number }} */
	let { world, origin, index, t } = $props();

	const { camera, invalidate, scene } = useThrelte();
	scene.background = new Color('#9cb7d1');

	/** @type {PlaneGeometry | null} */
	let geometry = $state(null);
	/** @type {CanvasTexture | null} */
	let texture = $state(null);
	/** @type {CanvasRenderingContext2D | null} */
	let context = null;
	let view = $state({ halfW: 1.3, halfH: 0.85, z: 4 });
	const EL = 1.12;

	let last = '';
	let alive = true;

	$effect(() => {
		loadRelief(reliefFor(world, null)).then(() => {
			if (!alive) return;
			geometry?.dispose();
			texture?.dispose();
			geometry = null;
			texture = null;
			context = null;
			last = '';
			invalidate();
		});
	});

	/**
	 * @param {import('./sheets.js').World} map
	 */
	function build(map) {
		const shape = reliefGeometry(map);
		const geo = new PlaneGeometry(shape.width, shape.height, shape.segs, shape.segs);
		const position = geo.attributes.position;
		const uv = geo.attributes.uv;
		const span = Math.min(shape.width, shape.height);
		const regions = reliefFor(map, null);
		for (let i = 0; i < position.count; i++) {
			const [lon, lat] = sample(map, uv.getX(i), uv.getY(i));
			position.setZ(i, groundHeight(metresAt(regions, lon, lat), span));
		}
		geo.computeVertexNormals();
		const canvas = document.createElement('canvas');
		canvas.width = 960;
		canvas.height = Math.max(1, Math.round(960 * (shape.height / shape.width)));
		const tex = new CanvasTexture(canvas);
		tex.colorSpace = SRGBColorSpace;
		tex.anisotropy = 8;
		return {
			geo,
			tex,
			context: canvas.getContext('2d'),
			view: {
				halfW: shape.width / 2,
				halfH: shape.height / 2,
				z: 4
			}
		};
	}

	/**
	 * Back the camera up only until the sheet covers the canvas.
	 * The div is the window. The edge of the mesh stays outside it.
	 * @param {PerspectiveCamera} current
	 */
	function cover(current) {
		const place = (dist) => {
			const target = new Vector3(0, 0, 0.02);
			current.position.set(0, target.y - dist * Math.cos(EL), dist * Math.sin(EL));
			current.lookAt(target);
			current.updateProjectionMatrix();
			current.updateMatrixWorld();
		};
		const filled = () => {
			for (const x of [-1, 1]) {
				for (const y of [-1, 1]) {
					const point = new Vector3(x, y, 0.5).unproject(current).sub(current.position);
					if (point.z >= -1e-5) return false;
					const along = (0.02 - current.position.z) / point.z;
					if (!(along > 0)) return false;
					const hx = current.position.x + point.x * along;
					const hy = current.position.y + point.y * along;
					if (Math.abs(hx) >= view.halfW || Math.abs(hy) >= view.halfH) return false;
				}
			}
			return true;
		};
		let near = 0.4;
		let far = 40;
		for (let step = 0; step < 20; step++) {
			const dist = (near + far) / 2;
			place(dist);
			if (filled()) near = dist;
			else far = dist;
		}
		place(near * 0.98);
	}

	useTask(() => {
		if (!geometry) {
			const built = build(world);
			geometry = built.geo;
			texture = built.tex;
			context = built.context;
			view = built.view;
		}
		const current = camera.current;
		if (current instanceof PerspectiveCamera) cover(current);
		const pulse = (Math.sin(performance.now() / 480) + 1) / 2;
		const key = `${origin}:${index}:${t.toFixed(3)}:${pulse.toFixed(2)}`;
		if (key === last || !context || !texture) return;
		last = key;
		paint(context, world, origin, index, t, pulse);
		texture.needsUpdate = true;
		invalidate();
	});

	onDestroy(() => {
		alive = false;
		geometry?.dispose();
		texture?.dispose();
	});
</script>

<T.PerspectiveCamera makeDefault fov={36} near={0.05} far={40} position={[0, -2, 2]} />
{#if geometry && texture}
	<T.AmbientLight intensity={0.74} />
	<T.DirectionalLight position={[1.6, 2.6, 1.6]} intensity={1.4} />
	<T.Mesh {geometry}>
		<T.MeshStandardMaterial map={texture} roughness={0.88} metalness={0} />
	</T.Mesh>
{/if}