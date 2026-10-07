<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { BoxGeometry, MeshBasicMaterial } from 'three';

	/**
	 * Something in the room you can point at: an invisible box catches the pointer, and the
	 * object rises a little while it's hovered. Clicking it calls `onpick`. While `away` names it,
	 * it's gone from the room, up in its sheet. `below` stretches the box down under the object,
	 * over whatever it stands on, so that's somewhere to point too.
	 * @type {{
	 *   id: string,
	 *   size: [number, number, number],
	 *   hovered: string | null,
	 *   onhover: (id: string | null) => void,
	 *   onpick?: () => void,
	 *   position?: [number, number, number],
	 *   rotation?: [number, number, number],
	 *   lift?: number,
	 *   below?: number,
	 *   still?: boolean,
	 *   away?: string | null,
	 *   children: import('svelte').Snippet
	 * }}
	 */
	let {
		id,
		size,
		hovered,
		onhover,
		onpick,
		position = [0, 0, 0],
		rotation = [0, 0, 0],
		lift = 0.014,
		below = 0,
		still = false,
		away = null,
		children
	} = $props();

	const { invalidate } = useThrelte();

	const box = $derived(new BoxGeometry(size[0], size[1] + below, size[2]));
	const hidden = new MeshBasicMaterial({ visible: false });

	$effect(() => {
		const used = box;
		return () => used.dispose();
	});

	$effect(() => () => hidden.dispose());

	/** @type {import('three').Group | undefined} */
	let raised = $state();

	useTask(
		(delta) => {
			if (!raised) return;
			const target = hovered === id ? lift : 0;
			const gap = target - raised.position.y;
			if (Math.abs(gap) < 1e-5) return;
			raised.position.y += still ? gap : gap * (1 - Math.exp(-delta * 14));
			invalidate();
		},
		{ autoInvalidate: false }
	);
</script>

<T.Group {position} {rotation}>
	<T.Group bind:ref={raised} visible={away !== id}>
		{@render children()}
	</T.Group>
	<T.Mesh
		geometry={box}
		material={hidden}
		position.y={(size[1] - below) / 2}
		onclick={(/** @type {any} */ event) => {
			event.stopPropagation();
			onpick?.();
		}}
		onpointerenter={(/** @type {any} */ event) => {
			event.stopPropagation();
			onhover(id);
		}}
		onpointerleave={() => hovered === id && onhover(null)}
	/>
</T.Group>
