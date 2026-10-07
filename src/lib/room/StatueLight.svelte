<script>
	import { T } from '@threlte/core';

	/**
	 * Gallery light for a statue whose middle is at `target`: a warm key raking across it from
	 * high on the front left, so it shadows itself and every contour shows, and a cool rim from
	 * behind on the right that picks its outline off the page. `scale` is about how tall it is.
	 * @type {{ target: [number, number, number], scale?: number }}
	 */
	let { target, scale = 1 } = $props();

	/** @type {import('three').Object3D | undefined} */
	let aim = $state();

	const [x, y, z] = $derived(target);

	/** @param {import('three').SpotLight} light */
	function keyLight(light) {
		const { shadow } = light;
		shadow.mapSize.set(1024, 1024);
		shadow.bias = -0.0004;
		shadow.normalBias = 0.015;
		shadow.radius = 4;
		shadow.camera.near = 0.2;
		shadow.camera.far = 6;
	}
</script>

<T.Object3D bind:ref={aim} position={target} />
{#if aim}
	<T.SpotLight
		position={[x - 0.9 * scale, y + 1.1 * scale, z + 0.85 * scale]}
		target={aim}
		color="#fff3e2"
		intensity={6 * scale * scale}
		angle={0.42}
		penumbra={0.85}
		decay={2}
		distance={0}
		castShadow
		oncreate={keyLight}
	/>
	<T.SpotLight
		position={[x + 0.7 * scale, y + 0.5 * scale, z - 0.9 * scale]}
		target={aim}
		color="#dfe9ff"
		intensity={4 * scale * scale}
		angle={0.5}
		penumbra={1}
		decay={2}
		distance={0}
	/>
{/if}
