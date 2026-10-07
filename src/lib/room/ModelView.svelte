<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { Canvas } from '@threlte/core';
	import { NeutralToneMapping } from 'three';
	import ModelStage from './ModelStage.svelte';

	/**
	 * Something from the room up close, in a 3D scene of its own with nothing behind it: lit the
	 * way the room is, floating over its own shadow, and turning when it's dragged. `size` is its
	 * extent in meters, standing on y = 0; `yaw` and `pitch` are where it's seen from. It fills
	 * whatever box it's given.
	 * @type {{ size: [number, number, number], yaw?: number, pitch?: number, label: string, cursor?: string, children: import('svelte').Snippet }}
	 */
	let { size, yaw = 0.45, pitch = 0.3, label, cursor = 'grab', children } = $props();
</script>

<div class="model" role="img" aria-label={label} style:cursor>
	<Canvas toneMapping={NeutralToneMapping} dpr={Math.min(devicePixelRatio, 2)}>
		<ModelStage {size} {yaw} {pitch} still={prefersReducedMotion.current}>
			{@render children()}
		</ModelStage>
	</Canvas>
</div>

<style>
	.model {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
		touch-action: pan-y;
		user-select: none;
	}
</style>
