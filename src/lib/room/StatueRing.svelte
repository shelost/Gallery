<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { BoxGeometry, MeshBasicMaterial } from 'three';
	import Lights from './Lights.svelte';
	import Statue from './Statue.svelte';
	import StatueLight from './StatueLight.svelte';
	import { STATUES } from './sculpt/statues.js';

	/**
	 * The statues standing in a ring on plinths, turned so whichever is in the middle faces you
	 * and slowly turns round to show itself off. Clicking one at the side brings it round.
	 * @type {{ offset: (i: number) => number, go: (i: number) => void, still: boolean }}
	 */
	let { offset, go, still } = $props();

	const FIT = /** @type {[number, number, number]} */ ([0.62, 0.78, 0.62]);
	const RADIUS = 1.35;
	const STEP = (Math.PI * 2) / STATUES.length;

	const { invalidate } = useThrelte();
	interactivity();

	const hit = new BoxGeometry(FIT[0], FIT[1] + 0.1, FIT[2]);
	const hidden = new MeshBasicMaterial({ visible: false });
	$effect(() => () => {
		hit.dispose();
		hidden.dispose();
	});

	let spin = $state(0);
	useTask(
		(delta) => {
			if (still) return;
			spin += delta * 0.35;
			invalidate();
		},
		{ autoInvalidate: false }
	);

	/** Where a statue stands for an offset, front and center at 0. @param {number} at */
	const spot = (at) => /** @type {[number, number, number]} */ ([Math.sin(at * STEP) * RADIUS, 0, Math.cos(at * STEP) * RADIUS - RADIUS]);
</script>

<T.PerspectiveCamera makeDefault fov={30} near={0.1} far={20} position={[0, 0.95, 2.75]} oncreate={(camera) => camera.lookAt(0, 0.42, -0.35)} />

<Lights reach={2.4} />
<StatueLight target={[0, FIT[1] / 2 + 0.06, 0]} scale={1.1} />

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
	<T.CircleGeometry args={[RADIUS * 2.2, 64]} />
	<T.ShadowMaterial opacity={0.12} />
</T.Mesh>

{#each STATUES as statue, i (statue.id)}
	{@const at = offset(i)}
	{@const near = Math.max(0, 1 - Math.abs(at))}
	<T.Group position={spot(at)}>
		<T.Mesh position.y={0.03} castShadow receiveShadow>
			<T.CylinderGeometry args={[0.4, 0.42, 0.06, 64]} />
			<T.MeshStandardMaterial color="#f4f1ec" roughness={0.5} />
		</T.Mesh>
		<T.Group position.y={0.06} rotation.y={-at * STEP + near * spin}>
			<Statue id={statue.id} fit={FIT} />
		</T.Group>
		<T.Mesh
			geometry={hit}
			material={hidden}
			position.y={FIT[1] / 2}
			onclick={(/** @type {any} */ event) => {
				event.stopPropagation();
				go(i);
			}}
		/>
	</T.Group>
{/each}
