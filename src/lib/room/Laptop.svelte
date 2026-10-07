<script module>
	/** Base and lid, in meters: the footprint, how thick the base is, and how tall the lid. */
	export const LAPTOP = { w: 0.34, d: 0.235, base: 0.012, lid: 0.225, open: 0.32 };
</script>

<script>
	import { T } from '@threlte/core';
	import { MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from 'three';
	import { MONO, SANS } from '$lib/shelf/covers.js';
	import Box from './Box.svelte';
	import { paintKeys } from './keyboard.js';
	import Readout from './Readout.svelte';
	import { surface } from './surface.js';

	/**
	 * An open laptop in silver aluminium, its lid leaning back from the hinge and an editor on
	 * the screen with the stack written out in Svelte. It stands on y = 0, centered.
	 */

	const SILVER = '#d7d8dc';
	const KEYS = { w: LAPTOP.w - 0.04, d: 0.11, z: -0.035 };
	const CODE = [
		[['#a626a4', '\x3Cscript>']],
		[['#1c1b18', '  let '], ['#4078f2', 'stack'], ['#1c1b18', ' = '], ['#ff3e00', '$state'], ['#1c1b18', '([']],
		[['#50a14f', "    'Svelte'"], ['#1c1b18', ', '], ['#50a14f', "'<canvas>'"], ['#1c1b18', ',']],
		[['#50a14f', "    'Vue'"], ['#1c1b18', ', '], ['#50a14f', "'React'"]],
		[['#1c1b18', '  ]);']],
		[['#a626a4', '\x3C/script>']],
		[],
		[['#a626a4', '{#each '], ['#4078f2', 'stack'], ['#a626a4', ' as '], ['#4078f2', 'tool'], ['#a626a4', '}']],
		[['#a626a4', '  <li>'], ['#1c1b18', '{tool}'], ['#a626a4', '</li>']],
		[['#a626a4', '{/each}']]
	];

	/** The editor's type is the site's own, so the screen repaints once it has loaded. */
	let fonts = $state(false);

	const keyboard = surface(KEYS.w, KEYS.d);
	const keyFace = new MeshStandardMaterial({ map: keyboard.texture, roughness: 0.7 });
	const keyPane = new PlaneGeometry(KEYS.w, KEYS.d);
	const bezelPane = new PlaneGeometry(LAPTOP.w - 0.008, LAPTOP.lid - 0.01);
	const bezelFace = new MeshBasicMaterial({ color: '#111113' });

	keyboard.paint((ctx, w, h) => paintKeys(ctx, w, h, { deck: '#c9cace', key: '#26272b' }));

	/** @param {CanvasRenderingContext2D} ctx @param {number} w @param {number} h */
	function paintScreen(ctx, w, h) {
		const [sans, mono] = fonts ? [SANS, MONO] : ['sans-serif', 'monospace'];
		ctx.fillStyle = '#fbfaf7';
		ctx.fillRect(0, 0, w, h);
		const bar = h * 0.09;
		ctx.fillStyle = '#efede8';
		ctx.fillRect(0, 0, w, bar);
		['#ff5f57', '#febc2e', '#28c840'].forEach((color, i) => {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(bar * (0.6 + i * 0.55), bar / 2, bar * 0.17, 0, Math.PI * 2);
			ctx.fill();
		});
		ctx.fillStyle = '#fbfaf7';
		ctx.fillRect(bar * 2.4, bar * 0.2, w * 0.24, bar * 0.8);
		ctx.font = `500 ${bar * 0.4}px ${sans}`;
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#ff3e00';
		ctx.fillText('S', bar * 2.65, bar * 0.6);
		ctx.fillStyle = 'rgba(28, 27, 24, 0.7)';
		ctx.fillText('Stack.svelte', bar * 3.05, bar * 0.6);
		const line = h * 0.078;
		const left = w * 0.1;
		ctx.font = `500 ${line * 0.62}px ${mono}`;
		CODE.forEach((tokens, n) => {
			const y = bar + line * (n + 1);
			ctx.fillStyle = 'rgba(28, 27, 24, 0.25)';
			ctx.textAlign = 'right';
			ctx.fillText(String(n + 1), left - w * 0.03, y);
			ctx.textAlign = 'left';
			let x = left;
			for (const [color, text] of tokens) {
				ctx.fillStyle = color;
				ctx.fillText(text, x, y);
				x += ctx.measureText(text).width;
			}
		});
		ctx.fillStyle = '#ff3e00';
		ctx.fillRect(left + ctx.measureText('{/each}').width + 2, bar + line * (CODE.length + 0.6), Math.max(2, w * 0.004), line * 0.7);
	}

	$effect(() => {
		document.fonts?.ready.then(() => (fonts = true));
		return () => {
			keyboard.texture.dispose();
			keyFace.dispose();
			keyPane.dispose();
			bezelPane.dispose();
			bezelFace.dispose();
		};
	});
</script>

<Box size={[LAPTOP.w, LAPTOP.base, LAPTOP.d]} radius={0.006} color={SILVER} roughness={0.32} sheen={0.4} position={[0, LAPTOP.base / 2, 0]} />
<T.Mesh geometry={keyPane} material={keyFace} position={[0, LAPTOP.base + 0.0006, KEYS.z]} rotation.x={-Math.PI / 2} receiveShadow />
<Box size={[0.11, 0.0012, 0.066]} radius={0.0006} color="#cfd0d4" roughness={0.25} sheen={0.6} position={[0, LAPTOP.base + 0.0004, 0.072]} shadow={false} />

<T.Group position={[0, LAPTOP.base, -LAPTOP.d / 2 + 0.004]} rotation.x={-LAPTOP.open}>
	<Readout size={[LAPTOP.w, LAPTOP.lid, 0.007]} color={SILVER} radius={0.006} screen={{ w: LAPTOP.w - 0.022, h: LAPTOP.lid - 0.03, at: [0, 0.004] }} paint={paintScreen}>
		<T.Mesh geometry={bezelPane} material={bezelFace} position={[0, LAPTOP.lid / 2, 0.0039]} />
	</Readout>
</T.Group>
