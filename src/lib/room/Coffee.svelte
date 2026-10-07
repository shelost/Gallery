<script>
	import { T } from '@threlte/core';
	import { LatheGeometry, MeshPhysicalMaterial, Vector2 } from 'three';

	/** A cup of black coffee on its saucer, standing on y = 0. */

	const ceramic = new MeshPhysicalMaterial({ color: '#f6f3ec', roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.2 });
	const coffee = new MeshPhysicalMaterial({ color: '#2a170c', roughness: 0.08, clearcoat: 1 });

	/** The cup in section, outside wall up and inside wall down, so it's hollow. */
	const cup = new LatheGeometry(
		[
			[0.0, 0.006],
			[0.026, 0.006],
			[0.03, 0.012],
			[0.036, 0.05],
			[0.039, 0.078],
			[0.0365, 0.08],
			[0.034, 0.052],
			[0.028, 0.016],
			[0.0, 0.014]
		].map(([r, y]) => new Vector2(r, y)),
		48
	);

	const saucer = new LatheGeometry(
		[
			[0.0, 0.0],
			[0.05, 0.0],
			[0.064, 0.008],
			[0.066, 0.011],
			[0.06, 0.009],
			[0.03, 0.005],
			[0.0, 0.005]
		].map(([r, y]) => new Vector2(r, y)),
		48
	);

	$effect(() => () => {
		cup.dispose();
		saucer.dispose();
		ceramic.dispose();
		coffee.dispose();
	});
</script>

<T.Mesh geometry={saucer} material={ceramic} castShadow receiveShadow />
<T.Mesh geometry={cup} material={ceramic} castShadow receiveShadow />
<T.Mesh material={coffee} position.y={0.066} rotation.x={-Math.PI / 2}>
	<T.CircleGeometry args={[0.0355, 40]} />
</T.Mesh>
<T.Mesh material={ceramic} position={[0.041, 0.046, 0]} rotation.z={-Math.PI * 0.625} castShadow>
	<T.TorusGeometry args={[0.017, 0.0045, 12, 28, Math.PI * 1.25]} />
</T.Mesh>
