<script module>
	/** The low cabinet behind the desk's left end, long side running left to right. */
	const CABINET = { x: -1.15, z: -0.8, w: 1.06, d: 0.42, top: 0.53 };
	/** Where the floating shelves hang: the back edge of each board. */
	const BOOKS_AT = { x: 0.68, y: 1.24, z: -0.66 };
	const MEDIA_AT = { x: -1.15, y: 1.06, z: -1.0 };
	/** The calligraphy set, front and center on the desk, and the turntable at its left end. */
	const INK_AT = { x: 0.04, z: 0.13 };
	const DECK_AT = { x: -0.82, z: -0.12, turn: 0.16 };
	/** The records lean beside the books, each one a little further along and in front. */
	const RECORD_STEP = 0.06;
	/**
	 * The podium past the desk's right end, which way it and its statue face, toward the desk, and
	 * the box any statue is scaled to fit on it: inside the top slab, and short enough to stay
	 * clear of the book shelf.
	 */
	const PODIUM_AT = { x: 1.45, z: 0.3, turn: -0.35 };
	export const ON_PODIUM = /** @type {[number, number, number]} */ ([0.44, 0.9, 0.4]);
	/**
	 * The painting on the wall between the shelves, centered at `x` with its frame's foot at
	 * `y`, and the most room its frame has; the frame takes the painting's own shape inside that.
	 */
	const WALL = { x: -0.27, y: 0.94, z: -0.86, w: 0.9, h: 0.7 };
	/** The ARC grid, small now, hung over the media shelf. */
	const ARC_AT = { x: -1.32, y: 1.3, z: -1.0, size: 0.28 };
	/** The sheet of hanji on the felt, in meters. */
	export const PAPER = { w: 0.42, d: 0.29 };

	/**
	 * Plants growing up around the podium's foot, kept off the side facing the desk: what each
	 * is, its size, where it is from the podium's center, and how far it's turned.
	 */
	const GARDEN = /** @type {const} */ ([
		{ variant: 'snake', w: 0.34, h: 0.74, at: [0.25, -0.22], turn: 0.4 },
		{ variant: 'fern', w: 0.3, h: 0.36, at: [0.33, 0.04], turn: 1.1 },
		{ variant: 'snake', w: 0.24, h: 0.44, at: [0.22, 0.29], turn: 2 },
		{ variant: 'bush', w: 0.3, h: 0.3, at: [-0.17, 0.29], turn: 0 },
		{ variant: 'fern', w: 0.26, h: 0.3, at: [-0.14, -0.29], turn: 2.3 }
	]);

	const PALETTE = {
		mint: '#cfe9de',
		sky: '#d3e3f5',
		peach: '#f8d9ca',
		butter: '#f7ebb9',
		lilac: '#dfd6f5',
		white: '#ffffff'
	};

	const FOV = 24;
	/** Everything in the scene fits inside this box, so the camera can frame it. */
	const BOUNDS = { x: [-1.72, 1.92], y: [0, 1.7] };
</script>

<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { MeshStandardMaterial, SRGBColorSpace, TextureLoader, Vector3 } from 'three';
	import Book from '$lib/shelf/Book.svelte';
	import Piece from '$lib/shelf/Piece.svelte';
	import Plant from '$lib/shelf/Plant.svelte';
	import Turntable from '$lib/shelf/Turntable.svelte';
	import Box from './Box.svelte';
	import Coffee from './Coffee.svelte';
	import Desk, { DESK } from './Desk.svelte';
	import Frame, { MARGIN } from './Frame.svelte';
	import Glide from './Glide.svelte';
	import Hotspot from './Hotspot.svelte';
	import Laptop from './Laptop.svelte';
	import Lights from './Lights.svelte';
	import Podium, { PODIUM } from './Podium.svelte';
	import Readout from './Readout.svelte';
	import Statue from './Statue.svelte';
	import StatueLight from './StatueLight.svelte';
	import { BOOK_SHELF, MEDIA_SHELF, SLEEVES, TAPES } from './furnishing.js';
	import { pine } from './materials.js';
	import { PAINTINGS } from './paintings.js';
	import { STATUES } from './sculpt/statues.js';
	import { GRID, sprite } from './sprite.js';
	import { surface } from './surface.js';

	/** @typedef {(ctx: CanvasRenderingContext2D, w: number, h: number) => void} Paint */
	/** @typedef {{ x: number, y: number }} Point */

	/**
	 * The room without its walls: a Victorian pedestal desk with the turntable, a laptop, a
	 * clock, an age counter, a calligraphy set, a Bible and a coffee on its leather; a statue on
	 * a podium with plants growing up around it, lit like a gallery's; a painting and the ARC grid
	 * hung in the air; a cabinet with the podcasts on tape; and two shelves floating over the
	 * page, one with the books spine out and the records beside them. The furniture's shadows are
	 * the only floor, and the camera holds still.
	 * `statue` and `painting` are which of each is up, `lifted` takes the sheet of paper off the
	 * desk while it's up in your hands, `writing` is what was last written on it, and `away` is
	 * whatever has floated up into a sheet.
	 * @type {{
	 *   statue: string,
	 *   painting: string,
	 *   record: import('$lib/directions/content.js').ShelfItem | undefined,
	 *   spinning: boolean,
	 *   hovered: string | null,
	 *   seed: number,
	 *   still: boolean,
	 *   lifted: boolean,
	 *   writing: HTMLCanvasElement | null,
	 *   away: string | null,
	 *   paintClock: Paint,
	 *   paintAge: Paint,
	 *   onhover: (id: string | null) => void,
	 *   onpick: (id: string) => void
	 * }}
	 */
	let { statue, painting, record, spinning, hovered, seed, still, lifted, writing, away, paintClock, paintAge, onhover, onpick } = $props();

	const standing = $derived(STATUES.find((entry) => entry.id === statue) ?? STATUES[0]);
	const hanging = $derived(PAINTINGS.find((entry) => entry.id === painting) ?? PAINTINGS[0]);
	/** The painting, as big as fits on the wall in its frame at its own proportions. */
	const frame = $derived.by(() => {
		const [w, h] = hanging.size;
		const fit = Math.min((WALL.w - MARGIN * 2) / w, (WALL.h - MARGIN * 2) / h);
		return { w: w * fit + MARGIN * 2, h: h * fit + MARGIN * 2, canvas: [w * fit, h * fit] };
	});

	const loader = new TextureLoader();
	const canvasFace = new MeshStandardMaterial({ roughness: 0.62, color: '#ffffff' });
	$effect(() => {
		let live = true;
		loader.load(hanging.image, (texture) => {
			if (!live) return texture.dispose();
			texture.colorSpace = SRGBColorSpace;
			texture.anisotropy = 8;
			canvasFace.map?.dispose();
			canvasFace.map = texture;
			canvasFace.needsUpdate = true;
			invalidate();
		});
		return () => {
			live = false;
		};
	});

	const { renderer, size, invalidate } = useThrelte();

	interactivity({ filter: (hits) => hits.slice(0, 1) });

	const grain = pine();

	/** Pixel art in a floating frame. */
	const art = surface(0.38, 0.38);
	const canvasArt = new MeshStandardMaterial({ map: art.texture, roughness: 0.8 });

	/** The sheet on the desk, with one character on it and a seal, or whatever was written last. */
	const sheet = surface(PAPER.w, PAPER.d);
	const paperFace = new MeshStandardMaterial({ map: sheet.texture, roughness: 0.95 });

	$effect(() => {
		const cells = sprite(seed);
		art.paint((ctx, w) => {
			const cell = w / GRID;
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, w, w);
			ctx.strokeStyle = 'rgba(28, 27, 24, 0.06)';
			for (let k = 0; k <= GRID; k++) {
				ctx.beginPath();
				ctx.moveTo(k * cell, 0);
				ctx.lineTo(k * cell, w);
				ctx.moveTo(0, k * cell);
				ctx.lineTo(w, k * cell);
				ctx.stroke();
			}
			for (const { x, y, color } of cells) {
				ctx.fillStyle = color;
				ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
			}
		});
		invalidate();
	});

	/** @type {Paint} */
	function paintSheet(ctx, w, h) {
		ctx.fillStyle = '#f4ecdb';
		ctx.fillRect(0, 0, w, h);
		ctx.strokeStyle = 'rgba(150, 120, 80, 0.07)';
		ctx.lineWidth = Math.max(1, w / 600);
		let s = 41;
		const next = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
		for (let k = 0; k < 140; k++) {
			const x = next() * w;
			const y = next() * h;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.quadraticCurveTo(x + (next() - 0.5) * w * 0.08, y + next() * h * 0.05, x + (next() - 0.5) * w * 0.12, y + h * 0.08);
			ctx.stroke();
		}
		if (writing) {
			ctx.globalCompositeOperation = 'multiply';
			ctx.drawImage(writing, 0, 0, w, h);
			ctx.globalCompositeOperation = 'source-over';
			return;
		}
		ctx.fillStyle = '#17120e';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `700 ${Math.round(h * 0.62)}px "Gowun Batang", "Nanum Myeongjo", "Apple SD Gothic Neo", serif`;
		ctx.fillText('원', w * 0.46, h * 0.53);
		const seal = h * 0.13;
		ctx.fillStyle = '#c0281c';
		ctx.fillRect(w * 0.74, h * 0.7, seal, seal);
		ctx.fillStyle = '#f4ecdb';
		ctx.font = `700 ${Math.round(seal * 0.62)}px "Gowun Batang", serif`;
		ctx.fillText('筆', w * 0.74 + seal / 2, h * 0.7 + seal / 2);
	}

	$effect(() => {
		let live = true;
		const draw = () => {
			if (!live) return;
			sheet.paint(paintSheet);
			invalidate();
		};
		draw();
		document.fonts?.load('700 64px "Gowun Batang"', '원筆').then(draw, () => {});
		return () => {
			live = false;
		};
	});

	$effect(() => {
		lifted;
		away;
		invalidate();
	});

	$effect(() => () => {
		art.texture.dispose();
		canvasArt.dispose();
		sheet.texture.dispose();
		paperFace.dispose();
		canvasFace.map?.dispose();
		canvasFace.dispose();
	});

	/** @type {import('three').PerspectiveCamera | undefined} */
	let lens = $state();
	/** @type {import('three').Mesh | undefined} */
	let paper = $state();

	const TARGET = new Vector3((BOUNDS.x[0] + BOUNDS.x[1]) / 2, 0.66, -0.18);
	const DIRECTION = new Vector3(0.42, 0.56, 1).normalize();
	let framed = { width: 0, height: 0 };

	/** The camera only moves when the canvas changes size, to keep the whole scene in frame. */
	useTask(
		() => {
			if (!lens) return;
			const { width, height } = size.current;
			if (width === framed.width && height === framed.height) return;
			framed = { width, height };
			const aspect = width / Math.max(1, height);
			const half = Math.tan(((FOV / 2) * Math.PI) / 180);
			const across = (BOUNDS.x[1] - BOUNDS.x[0]) / 2;
			const tall = (BOUNDS.y[1] - BOUNDS.y[0]) / 2;
			const distance = Math.max((tall * 1.08) / half, (across * 0.98) / (half * aspect));
			lens.position.copy(TARGET).addScaledVector(DIRECTION, distance);
			lens.lookAt(TARGET);
			invalidate();
		},
		{ autoInvalidate: false }
	);

	/**
	 * Where the sheet of paper's corners are on screen, in viewport pixels: far left, far right,
	 * near right, near left, so they line up with the top left, top right, bottom right and bottom
	 * left of the page as you'd hold it.
	 * @returns {[Point, Point, Point, Point] | null}
	 */
	export function paperCorners() {
		if (!paper || !lens) return null;
		const camera = lens;
		const sheetMesh = paper;
		const rect = renderer.domElement.getBoundingClientRect();
		sheetMesh.updateWorldMatrix(true, false);
		camera.updateMatrixWorld();
		const corners = /** @type {[number, number][]} */ ([
			[-1, 1],
			[1, 1],
			[1, -1],
			[-1, -1]
		]).map(([sx, sy]) => {
			const point = sheetMesh.localToWorld(new Vector3((sx * PAPER.w) / 2, (sy * PAPER.d) / 2, 0)).project(camera);
			return { x: rect.left + ((point.x + 1) / 2) * rect.width, y: rect.top + ((1 - point.y) / 2) * rect.height };
		});
		return /** @type {[Point, Point, Point, Point]} */ (corners);
	}

	/** What's printed on the paper right now, as an image. */
	export function paperImage() {
		return /** @type {HTMLCanvasElement} */ (sheet.texture.image).toDataURL('image/png');
	}

	/** How much of the book shelf the books take, spine out, and the records beside them. */
	const bookSpan = BOOK_SHELF.reduce((sum, piece) => sum + piece.d, 0) + (BOOK_SHELF.length - 1) * 0.003;
	const recordSpan = (SLEEVES[0]?.w ?? 0) + (SLEEVES.length - 1) * RECORD_STEP;
	const shelfSpan = bookSpan + 0.05 + recordSpan;
	const records = SLEEVES.map((piece, n) => ({ piece, x: -shelfSpan / 2 + bookSpan + 0.05 + piece.w / 2 + n * RECORD_STEP, z: n * 0.012 }));
	const mediaSpan = Math.max(...MEDIA_SHELF.map((piece) => piece.x + piece.w / 2)) - Math.min(...MEDIA_SHELF.map((piece) => piece.x - piece.w / 2));

	/** The floating shelves, each a board with a low rail at the back for things to lean on. */
	const shelves = [
		{ id: 'books', at: BOOKS_AT, width: shelfSpan + 0.14 },
		{ id: 'media', at: MEDIA_AT, width: mediaSpan + 0.14 }
	];

	const tapeStack = TAPES.length * 0.0172 + 0.004;

	/** @param {string} key @param {boolean} on */
	const hoverPiece = (key, on) => onhover(on ? key : hovered === key ? null : hovered);
</script>

<T.PerspectiveCamera bind:ref={lens} makeDefault fov={FOV} near={0.1} far={40} />

<Lights reach={2.6} />

<!-- No floor, only the shadows it would catch, so the furniture stands on the page itself. -->
<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
	<T.PlaneGeometry args={[9, 9]} />
	<T.ShadowMaterial opacity={0.11} />
</T.Mesh>

<Desk />

<T.Group position.y={DESK.top}>
	<!-- The laptop, open on the stack. -->
	<Hotspot id="laptop" size={[0.36, 0.24, 0.31]} position={[-0.38, 0, -0.2]} rotation={[0, 0.28, 0]} {hovered} {onhover} onpick={() => onpick('laptop')} {still} {away}>
		<T.Group position.z={0.035}>
			<Laptop />
		</T.Group>
	</Hotspot>

	<!-- The clock at home, in Ithaca, standing on its feet. -->
	<Hotspot id="clock" size={[0.42, 0.17, 0.08]} position={[0.06, 0, -0.3]} rotation={[0, 0.08, 0]} {hovered} {onhover} onpick={() => onpick('clock')} {still} {away}>
		<T.Group position.y={0.018} rotation.x={-0.12}>
			<Readout size={[0.4, 0.14, 0.04]} color={PALETTE.white} radius={0.02} screen={{ w: 0.362, h: 0.104 }} paint={paintClock} />
		</T.Group>
		{#each [-0.15, 0.15] as x (x)}
			<Box size={[0.04, 0.02, 0.07]} radius={0.008} color={PALETTE.butter} position={[x, 0.01, 0]} />
		{/each}
	</Hotspot>

	<!-- My age, counting. -->
	<Hotspot id="age" size={[0.28, 0.1, 0.08]} position={[0.48, 0, -0.27]} rotation={[0, -0.14, 0]} {hovered} {onhover} onpick={() => onpick('age')} {still} {away}>
		<Readout size={[0.27, 0.088, 0.066]} color={PALETTE.peach} radius={0.022} screen={{ w: 0.24, h: 0.062 }} paint={paintAge} />
	</Hotspot>

	<!-- The calligraphy set: hanji on a felt mat, an inkstone with its stick, a brush on its rest. -->
	<Hotspot id="brush" size={[0.7, 0.07, 0.4]} position={[INK_AT.x, 0, INK_AT.z]} rotation={[0, -0.06, 0]} lift={0.012} {hovered} {onhover} onpick={() => onpick('brush')} {still}>
		<Box size={[PAPER.w + 0.08, 0.004, PAPER.d + 0.07]} radius={0.002} color="#2d2d31" roughness={1} sheen={0} position={[-0.08, 0.002, 0]} />
		<T.Mesh bind:ref={paper} material={paperFace} position={[-0.08, 0.0052, 0]} rotation.x={-Math.PI / 2} visible={!lifted} receiveShadow>
			<T.PlaneGeometry args={[PAPER.w, PAPER.d]} />
		</T.Mesh>
		{#each [-1, 1] as side (side)}
			<Box size={[0.03, 0.012, 0.014]} radius={0.003} color="#3a3a3e" position={[-0.08 + side * (PAPER.w / 2 - 0.05), 0.011, -PAPER.d / 2 + 0.012]} />
		{/each}
		<T.Group position={[0.26, 0, -0.02]} rotation.y={0.12}>
			<Box size={[0.11, 0.024, 0.16]} radius={0.01} color="#26262a" roughness={0.6} sheen={0.2} position={[0, 0.012, 0]} />
			<T.Mesh position={[0, 0.0245, 0.03]} rotation.x={-Math.PI / 2}>
				<T.CircleGeometry args={[0.034, 40]} />
				<T.MeshStandardMaterial color="#060607" roughness={0.12} metalness={0.2} />
			</T.Mesh>
			<Box size={[0.018, 0.014, 0.075]} radius={0.003} color="#141416" position={[0.02, 0.031, -0.045]} rotation={[0, 0.3, 0]} />
		</T.Group>
		<T.Group position={[0.08, 0, 0.17]} rotation.y={0.2}>
			{#each [-0.07, 0.07] as x (x)}
				<Box size={[0.014, 0.018, 0.02]} radius={0.004} color="#c9b48d" position={[x, 0.009, 0]} />
			{/each}
			<T.Mesh position={[0.01, 0.022, 0]} rotation.z={Math.PI / 2} castShadow>
				<T.CylinderGeometry args={[0.0055, 0.0055, 0.2, 16]} />
				<T.MeshStandardMaterial color="#d7b98a" roughness={0.5} />
			</T.Mesh>
			<T.Mesh position={[-0.112, 0.022, 0]} rotation.z={Math.PI / 2} castShadow>
				<T.ConeGeometry args={[0.0075, 0.045, 16]} />
				<T.MeshStandardMaterial color="#141210" roughness={0.9} />
			</T.Mesh>
		</T.Group>
	</Hotspot>

	<!-- A coffee, black, within reach of the brush; it's the way to buy me one. -->
	<Hotspot id="coffee" size={[0.15, 0.09, 0.15]} position={[0.54, 0, 0.28]} {hovered} {onhover} onpick={() => onpick('coffee')} {still}>
		<Coffee />
	</Hotspot>

	<!-- A leather Bible with gilt edges and a ribbon. -->
	<Hotspot id="bible" size={[0.15, 0.045, 0.21]} position={[0.8, 0, 0.12]} rotation={[0, -0.38, 0]} {hovered} {onhover} onpick={() => onpick('bible')} {still} {away}>
		<Box size={[0.14, 0.006, 0.2]} radius={0.003} color="#2b1b14" roughness={0.75} sheen={0.15} position={[0, 0.003, 0]} />
		<Box size={[0.132, 0.026, 0.19]} radius={0.002} color="#d8b25c" roughness={0.3} sheen={0.6} position={[0.003, 0.019, 0]} />
		<Box size={[0.14, 0.006, 0.2]} radius={0.003} color="#2b1b14" roughness={0.75} sheen={0.15} position={[0, 0.035, 0]} />
		<Box size={[0.008, 0.038, 0.2]} radius={0.004} color="#24160f" roughness={0.75} position={[-0.068, 0.019, 0]} />
		<Box size={[0.006, 0.0012, 0.05]} radius={0.0005} color="#d8b25c" sheen={0.6} position={[0.004, 0.0385, 0.012]} />
		<Box size={[0.034, 0.0012, 0.006]} radius={0.0005} color="#d8b25c" sheen={0.6} position={[0.004, 0.0385, 0.022]} />
		<Box size={[0.008, 0.002, 0.05]} radius={0.0008} color="#9c1b1f" position={[0.03, 0.003, 0.11]} rotation={[0.3, 0, 0]} />
	</Hotspot>

	<!-- The turntable, at the desk's left end. -->
	<T.Group position={[DECK_AT.x, 0, DECK_AT.z]} rotation.y={DECK_AT.turn} visible={away !== 'turntable'}>
		<Turntable
			item={record}
			{still}
			{spinning}
			finish="#ffffff"
			{grain}
			onpick={() => onpick('turntable')}
			onhover={(on) => hoverPiece('turntable', on)}
		/>
	</T.Group>

	<!-- A lamp. -->
	<T.Group position={[1, 0, -0.34]}>
		<T.Mesh position.y={0.008} castShadow receiveShadow>
			<T.CylinderGeometry args={[0.06, 0.065, 0.016, 48]} />
			<T.MeshStandardMaterial color={PALETTE.white} roughness={0.4} />
		</T.Mesh>
		<T.Mesh position.y={0.1} castShadow>
			<T.CylinderGeometry args={[0.006, 0.006, 0.18, 12]} />
			<T.MeshStandardMaterial color={PALETTE.white} roughness={0.4} />
		</T.Mesh>
		<T.Mesh position.y={0.22}>
			<T.SphereGeometry args={[0.075, 48, 32]} />
			<T.MeshStandardMaterial color="#fff7e0" emissive="#fff1cc" emissiveIntensity={0.9} roughness={0.3} />
		</T.Mesh>
		<T.PointLight position.y={0.22} intensity={0.5} distance={1.6} color="#ffe8c2" />
	</T.Group>
</T.Group>

<!-- The statue on its podium, with plants growing up around the podium's foot. -->
<T.Group position={[PODIUM_AT.x, 0, PODIUM_AT.z]}>
	<T.Group rotation.y={PODIUM_AT.turn}>
		<Podium name={standing.plate} />
	</T.Group>
	{#each GARDEN as plant, n (n)}
		<T.Group position={[plant.at[0], 0, plant.at[1]]} rotation.y={plant.turn}>
			<Plant piece={{ key: `garden-${n}`, type: 'plant', variant: plant.variant, w: plant.w, h: plant.h, d: 0, x: 0 }} potted={false} />
		</T.Group>
	{/each}
	<Hotspot
		id="statue"
		size={[PODIUM.w, ON_PODIUM[1], PODIUM.d]}
		below={PODIUM.top}
		position={[0, PODIUM.top, 0]}
		rotation={[0, PODIUM_AT.turn, 0]}
		lift={0.012}
		{hovered}
		{onhover}
		onpick={() => onpick('statue')}
		{still}
		{away}
	>
		<Statue id={standing.id} fit={ON_PODIUM} />
	</Hotspot>
	<StatueLight target={[0, PODIUM.top + ON_PODIUM[1] * 0.5, 0]} />
</T.Group>

<!-- The floating shelves: books and records over the desk, films, a tape and a magazine over the cabinet. -->
{#each shelves as entry (entry.id)}
	<T.Group position={[entry.at.x, entry.at.y, entry.at.z]}>
		<Box size={[entry.width, 0.028, 0.21]} radius={0.008} color={PALETTE.white} position={[0, -0.014, 0.105]} />
		<Box size={[entry.width, 0.05, 0.012]} radius={0.004} color={PALETTE.white} position={[0, 0.025, 0.006]} />
	</T.Group>
{/each}

<!-- The books stand spine out, and slide forward off the shelf while they're pointed at. -->
<T.Group position={[BOOKS_AT.x - shelfSpan / 2 + bookSpan / 2, BOOKS_AT.y, BOOKS_AT.z]}>
	{#each BOOK_SHELF as piece (piece.key)}
		<Glide position={[piece.x, piece.h / 2, piece.w / 2 + 0.014 + (hovered === piece.key ? 0.06 : 0)]} rotation={[0, Math.PI / 2, 0]} stiffness={160} {still}>
			<Book {piece} onpick={() => onpick(piece.key)} onhover={(on) => hoverPiece(piece.key, on)} />
		</Glide>
	{/each}
</T.Group>

{#snippet leaning(/** @type {import('$lib/shelf/layout.js').ItemPiece} */ piece, /** @type {[number, number, number]} */ at)}
	<T.Group position={at}>
		<Piece {piece} {still} lifted={hovered === piece.key} onpick={() => onpick(piece.key)} onhover={(on) => hoverPiece(piece.key, on)} />
	</T.Group>
{/snippet}

<T.Group position={[BOOKS_AT.x, BOOKS_AT.y, BOOKS_AT.z]}>
	{#each records as { piece, x, z } (piece.key)}
		{@render leaning(piece, [x, 0, z])}
	{/each}
</T.Group>

<T.Group position={[MEDIA_AT.x, MEDIA_AT.y, MEDIA_AT.z]}>
	{#each MEDIA_SHELF as piece (piece.key)}
		{@render leaning(piece, [piece.x, 0, 0])}
	{/each}
</T.Group>

<!-- A painting in a mahogany and gilt frame, hanging in the air between the shelves. -->
<Hotspot id="painting" size={[frame.w, frame.h, 0.06]} position={[WALL.x, WALL.y, WALL.z]} lift={0.01} {hovered} {onhover} onpick={() => onpick('painting')} {still} {away}>
	<Frame w={frame.canvas[0]} h={frame.canvas[1]} material={canvasFace} />
</Hotspot>

<!-- Pixel art in a small frame, hung over the media shelf. -->
<Hotspot id="arc" size={[ARC_AT.size, ARC_AT.size, 0.05]} position={[ARC_AT.x, ARC_AT.y, ARC_AT.z]} lift={0.01} {hovered} {onhover} onpick={() => onpick('arc')} {still} {away}>
	<Box size={[ARC_AT.size, ARC_AT.size, 0.026]} radius={0.01} color={PALETTE.white} position={[0, ARC_AT.size / 2, 0.013]} />
	<T.Mesh material={canvasArt} position={[0, ARC_AT.size / 2, 0.0275]} receiveShadow>
		<T.PlaneGeometry args={[ARC_AT.size * 0.82, ARC_AT.size * 0.82]} />
	</T.Mesh>
</Hotspot>

<!-- The cabinet, with the podcasts on tape. -->
<Box size={[CABINET.w, CABINET.top - 0.06, CABINET.d]} radius={0.018} color={PALETTE.white} position={[CABINET.x, 0.06 + (CABINET.top - 0.06) / 2, CABINET.z]} />
{#each [-0.25, 0.25] as x (x)}
	<Box size={[CABINET.w / 2 - 0.03, CABINET.top - 0.12, 0.012]} radius={0.004} color="#f4f1ec" position={[CABINET.x + x, 0.06 + (CABINET.top - 0.06) / 2, CABINET.z + CABINET.d / 2 + 0.002]} />
	<Box size={[0.09, 0.012, 0.014]} radius={0.004} color={PALETTE.mint} position={[CABINET.x + x, CABINET.top - 0.08, CABINET.z + CABINET.d / 2 + 0.012]} />
{/each}
{#each [-1, 1] as sx (sx)}
	{#each [-1, 1] as sz (sz)}
		<Box size={[0.03, 0.06, 0.03]} radius={0.01} color={PALETTE.mint} position={[CABINET.x + sx * (CABINET.w / 2 - 0.05), 0.03, CABINET.z + sz * (CABINET.d / 2 - 0.05)]} />
	{/each}
{/each}

<Hotspot id="tapes" size={[0.13, tapeStack, 0.09]} position={[CABINET.x + 0.1, CABINET.top, CABINET.z + 0.04]} rotation={[0, 0.3, 0]} {hovered} {onhover} onpick={() => onpick('tapes')} {still} {away}>
	{#each TAPES as tape, n (tape.key)}
		<Box size={[0.11, 0.017, 0.07]} radius={0.004} color={tape.item.tone} rotation={[0, n * 0.18, 0]} position={[0, 0.0085 + n * 0.0172, 0]} />
	{/each}
</Hotspot>
