<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import Brush3D from './Brush3D.svelte';
	import Lights from './Lights.svelte';

	/**
	 * The brush in your hand, standing in for the pointer wherever `over` says there's something
	 * to write on or dip into. Its tip is the pointer; it leans the way a held brush does, swings
	 * after the hand when it moves, and its hair spreads while it's pressed down. Drawn in screen
	 * pixels over a canvas that covers the viewport.
	 * @type {{ id: string, ink: number, color: string, still: boolean, over: (target: Element) => boolean }}
	 */
	let { id, ink, color, still, over } = $props();

	/** How long the brush is on screen, and how it's held: handle towards you, leaning right. */
	const LENGTH = 150;
	const HELD = { pitch: 0.55, lean: -0.42, side: -0.78 };

	const { size, invalidate } = useThrelte();

	let shown = $state(false);
	const at = { x: 0, y: 0, t: 0 };
	const velocity = { x: 0, y: 0 };
	let down = false;
	const now = { pitch: HELD.pitch, lean: HELD.lean };
	let splay = $state(0);
	let moved = false;
	/** @type {import('three').Group | undefined} */
	let hand = $state();

	/** @param {PointerEvent} event */
	function move(event) {
		const inside = event.target instanceof Element && over(event.target);
		if (inside !== shown) shown = inside;
		if (!inside) return;
		const dt = Math.max(8, event.timeStamp - at.t) / 1000;
		velocity.x = velocity.x * 0.6 + ((event.clientX - at.x) / dt) * 0.4;
		velocity.y = velocity.y * 0.6 + ((event.clientY - at.y) / dt) * 0.4;
		Object.assign(at, { x: event.clientX, y: event.clientY, t: event.timeStamp });
		moved = true;
	}

	/** @param {PointerEvent} event */
	function press(event) {
		move(event);
		down = true;
	}

	function release() {
		down = false;
	}

	useTask(
		(delta) => {
			if (!hand || !shown) return;
			const dt = Math.min(delta, 0.064);
			const ease = still ? 1 : Math.min(1, dt * 12);
			const swing = (/** @type {number} */ v) => Math.max(-0.4, Math.min(0.4, v));
			const goal = {
				pitch: HELD.pitch + swing(velocity.y * 0.0003),
				lean: (id === 'side' ? HELD.side : HELD.lean) + swing(-velocity.x * 0.00035),
				splay: down ? 1 : 0
			};
			const settling = Math.abs(goal.pitch - now.pitch) + Math.abs(goal.lean - now.lean) + Math.abs(goal.splay - splay) > 0.002;
			if (!settling && !moved) return;
			now.pitch += (goal.pitch - now.pitch) * ease;
			now.lean += (goal.lean - now.lean) * ease;
			splay += (goal.splay - splay) * ease;
			velocity.x *= Math.pow(0.02, dt);
			velocity.y *= Math.pow(0.02, dt);
			hand.position.set(at.x - size.current.width / 2, size.current.height / 2 - at.y, 0);
			hand.rotation.set(now.pitch, 0, now.lean);
			moved = false;
			invalidate();
		},
		{ autoInvalidate: false }
	);
</script>

<svelte:window onpointermove={move} onpointerdown={press} onpointerup={release} onpointercancel={release} />

<T.OrthographicCamera makeDefault position.z={600} near={1} far={2000} />
<Lights reach={1} resolution={256} />

<T.Group bind:ref={hand} visible={shown} oncreate={(group) => void (group.rotation.order = 'ZXY')}>
	<T.Group scale={LENGTH}>
		<Brush3D {id} {ink} {color} {splay} shadow={false} />
	</T.Group>
</T.Group>
