<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { Vector3 } from 'three';
	import Lights from './Lights.svelte';

	/**
	 * The scene inside a ModelView: a camera framing the model from `yaw` and `pitch` so it fits
	 * however it's turned, the room's light, and the model's shadow on nothing. The model floats
	 * a little over its shadow, sways once it's been left alone a moment, and turns as it's
	 * dragged, carrying on for a moment after it's let go.
	 * @type {{ size: [number, number, number], yaw: number, pitch: number, still: boolean, children: import('svelte').Snippet }}
	 */
	let { size, yaw, pitch, still, children } = $props();

	const FOV = 26;

	const { size: canvas, dom, invalidate } = useThrelte();

	interactivity({ filter: (hits) => hits.slice(0, 1) });

	/** It can turn all the way around, so it's framed by the circle its corners sweep. */
	const radius = $derived(Math.hypot(size[0], size[2]) / 2);
	const hover = $derived(Math.hypot(...size) * 0.02);
	const bob = $derived(hover * 0.3);
	const center = $derived(new Vector3(0, (size[1] + hover + bob) / 2, 0));
	const forward = $derived(new Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)));

	/** @type {import('three').PerspectiveCamera | undefined} */
	let lens = $state();
	/** @type {import('three').Group | undefined} */
	let model = $state();

	/** How far back the camera stands for the whole turning model to fit a canvas this shape. @param {number} aspect */
	function distanceFor(aspect) {
		const tall = Math.tan(((FOV / 2) * Math.PI) / 180);
		const wide = tall * aspect;
		const right = new Vector3(0, 1, 0).cross(forward).normalize();
		const up = new Vector3().crossVectors(forward, right);
		const point = new Vector3();
		let distance = 0;
		for (let k = 0; k < 24; k++) {
			const angle = (k / 24) * Math.PI * 2;
			for (const y of [0, size[1] + hover + bob]) {
				point.set(Math.cos(angle) * radius, y - center.y, Math.sin(angle) * radius);
				const depth = point.dot(forward);
				distance = Math.max(distance, Math.abs(point.dot(right)) / wide + depth, Math.abs(point.dot(up)) / tall + depth);
			}
		}
		return distance * 1.04;
	}

	let framed = { width: 0, height: 0 };
	let turn = 0;
	let spin = 0;
	let held = false;
	let idle = 0;
	let clock = 0;

	$effect(() => {
		const element = dom;
		let last = 0;
		let moved = 0;
		/** @param {PointerEvent} event */
		const move = (event) => {
			const step = (event.clientX - last) * 0.011;
			last = event.clientX;
			moved = event.timeStamp;
			turn += step;
			spin = step * 40;
			invalidate();
		};
		/** @param {PointerEvent} event */
		const up = (event) => {
			held = false;
			if (event.timeStamp - moved > 90) spin = 0;
			element.style.cursor = '';
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
		};
		/** @param {PointerEvent} event */
		const down = (event) => {
			if (event.button !== 0) return;
			held = true;
			idle = 0;
			spin = 0;
			if (model) turn = model.rotation.y;
			last = event.clientX;
			element.style.cursor = 'grabbing';
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', up);
		};
		element.addEventListener('pointerdown', down);
		return () => {
			element.removeEventListener('pointerdown', down);
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
		};
	});

	useTask(
		(delta) => {
			if (!lens || !model) return;
			const { width, height } = canvas.current;
			let changed = false;
			if (width !== framed.width || height !== framed.height) {
				framed = { width, height };
				lens.position.copy(center).addScaledVector(forward, distanceFor(width / Math.max(1, height)));
				lens.lookAt(center);
				changed = true;
			}
			clock += delta;
			if (!held) {
				turn += spin * delta;
				spin *= Math.exp(-delta * 3.5);
				idle += delta;
			}
			const sway = still ? 0 : Math.sin(clock * 0.5) * 0.22 * Math.min(1, Math.max(0, (idle - 1.6) / 2.4));
			const goal = turn + sway;
			const gap = goal - model.rotation.y;
			model.rotation.y += still ? gap : gap * (1 - Math.exp(-delta * 12));
			const rise = hover + (still ? 0 : Math.sin(clock * 1.3) * bob);
			if (changed || Math.abs(gap) > 1e-5 || model.position.y !== rise) {
				model.position.y = rise;
				invalidate();
			}
		},
		{ autoInvalidate: false }
	);
</script>

<T.PerspectiveCamera bind:ref={lens} makeDefault fov={FOV} near={0.05} far={30} />

<Lights reach={Math.max(1, radius * 2)} resolution={1024} />

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
	<T.CircleGeometry args={[radius * 2.4, 48]} />
	<T.ShadowMaterial opacity={0.13} />
</T.Mesh>

<T.Group bind:ref={model}>
	{@render children()}
</T.Group>
