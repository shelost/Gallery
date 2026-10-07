<script module>
	/**
	 * The podium's courses from the floor up, the classical way: a plinth, a base moulding, the
	 * die, a cornice, and the slab the statue stands on. In meters.
	 */
	const COURSES = [
		{ w: 0.5, h: 0.06, d: 0.46, tint: '#d9d4cb' },
		{ w: 0.45, h: 0.035, d: 0.41, tint: '#e4e0d8' },
		{ w: 0.38, h: 0.5, d: 0.34, tint: '#efebe4' },
		{ w: 0.43, h: 0.03, d: 0.39, tint: '#e4e0d8' },
		{ w: 0.47, h: 0.055, d: 0.43, tint: '#d9d4cb' }
	].map((course, i, all) => ({ ...course, y: all.slice(0, i).reduce((sum, below) => sum + below.h, 0) + course.h / 2 }));

	const DIE = COURSES[2];

	/** Its footprint, and the height of the slab on top. */
	export const PODIUM = { w: COURSES[0].w, d: COURSES[0].d, top: COURSES.reduce((sum, course) => sum + course.h, 0) };
</script>

<script>
	import { T } from '@threlte/core';
	import { MeshStandardMaterial } from 'three';
	import Box from './Box.svelte';
	import { BRASS, marble } from './materials.js';
	import { surface } from './surface.js';

	/** A marble podium with a sunk panel on its die and a brass plate naming who stands on it. */

	const stone = marble();
	const plate = surface(0.13, 0.036);
	const engraved = new MeshStandardMaterial({ ...BRASS, map: plate.texture });

	plate.paint((ctx, w, h) => {
		ctx.fillStyle = '#f4ecda';
		ctx.fillRect(0, 0, w, h);
		ctx.strokeStyle = 'rgba(60, 40, 10, 0.45)';
		ctx.lineWidth = Math.max(1, h * 0.04);
		ctx.strokeRect(h * 0.1, h * 0.1, w - h * 0.2, h * 0.8);
		ctx.fillStyle = 'rgba(48, 30, 8, 0.85)';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `500 ${Math.round(h * 0.44)}px "Instrument Serif", Georgia, serif`;
		ctx.fillText('ΝΙΚΗ', w / 2, h * 0.54);
	});

	$effect(() => () => {
		plate.texture.dispose();
		engraved.dispose();
	});
</script>

{#each COURSES as course (course.y)}
	<Box size={[course.w, course.h, course.d]} radius={0.006} map={stone} color={course.tint} roughness={0.42} sheen={0.35} position={[0, course.y, 0]} />
{/each}
<Box size={[DIE.w - 0.08, DIE.h - 0.12, 0.004]} radius={0.002} map={stone} color="#e3dfd7" roughness={0.45} sheen={0.3} position={[0, DIE.y, DIE.d / 2 + 0.002]} />
<T.Mesh material={engraved} position={[0, DIE.y + DIE.h * 0.24, DIE.d / 2 + 0.0055]} castShadow>
	<T.BoxGeometry args={[0.13, 0.036, 0.003]} />
</T.Mesh>
