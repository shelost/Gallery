<script>
	import { T, useThrelte } from '@threlte/core';
	import { studio } from '$lib/shelf/studio.js';

	/**
	 * The room's light, for any scene that shows something from it: a soft sky, studio reflections,
	 * a sun high at the front right whose shadows cover `reach` meters either side of the origin,
	 * and a cool fill from the left.
	 * @type {{ reach: number, resolution?: number }}
	 */
	let { reach, resolution = 2048 } = $props();

	const { renderer, scene } = useThrelte();

	const unlight = studio(/** @type {import('three').WebGLRenderer} */ (renderer), scene, 0.55);
	$effect(() => () => unlight());

	/** @param {import('three').DirectionalLight} light */
	function sun(light) {
		const { shadow } = light;
		shadow.mapSize.set(resolution, resolution);
		shadow.bias = -0.0004;
		shadow.normalBias = 0.02;
		shadow.radius = 8;
		Object.assign(shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 0.5, far: 14 });
		shadow.camera.updateProjectionMatrix();
	}
</script>

<T.HemisphereLight args={['#ffffff', '#efe6f4', 1.25]} />
<T.DirectionalLight position={[2.4, 5.6, 3.2]} intensity={2.2} castShadow oncreate={sun} />
<T.DirectionalLight position={[-3, 2.5, 1]} intensity={0.35} color="#e9f1ff" />
