<script module>
	import { MeshStandardMaterial } from 'three';

	/** What each statue is made of, darkened in its creases by the vertex color. */
	const FINISHES = {
		bronze: new MeshStandardMaterial({ color: '#8a6038', metalness: 0.62, roughness: 0.44, vertexColors: true }),
		marble: new MeshStandardMaterial({ color: '#f3efe8', metalness: 0, roughness: 0.52, vertexColors: true }),
		stone: new MeshStandardMaterial({ color: '#e2dacb', metalness: 0, roughness: 0.78, vertexColors: true })
	};
</script>

<script>
	import { T, useThrelte } from '@threlte/core';
	import { STATUES } from './sculpt/statues.js';
	import { sculpture } from './sculpt/load.js';

	/**
	 * One of the sculpted statues, as large as fits inside `fit` (meters, standing on y = 0,
	 * facing +z). Until it's been sculpted it shows whatever it showed before, so swapping one
	 * statue for another never leaves the spot empty.
	 * @type {{ id: string, fit: [number, number, number] }}
	 */
	let { id, fit } = $props();

	const { invalidate } = useThrelte();

	/** The statue being shown, which lags `id` until the new one has been sculpted. @type {{ id: string, made: import('./sculpt/load.js').Sculpture } | null} */
	let shown = $state.raw(null);

	$effect(() => {
		let live = true;
		const wanted = id;
		sculpture(wanted).then((made) => {
			if (!live) return;
			shown = { id: wanted, made };
			invalidate();
		});
		return () => {
			live = false;
		};
	});

	const finish = $derived(STATUES.find((entry) => entry.id === shown?.id)?.finish ?? 'marble');
	const scale = $derived(shown ? Math.min(fit[0] / shown.made.size[0], fit[1] / shown.made.size[1], fit[2] / shown.made.size[2]) : 1);
</script>

{#if shown}
	<T.Mesh geometry={shown.made.geometry} material={FINISHES[finish]} {scale} castShadow receiveShadow />
{/if}
