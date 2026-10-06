<script module>
	/** The big table in the middle of everything, centered on the origin, in meters. */
	const TABLE = { w: 1.9, d: 0.9, top: 0.74 };
	/** The low cabinet behind the table's left end, long side running left to right. */
	const CABINET = { x: -1.15, z: -0.8, w: 1.06, d: 0.42, top: 0.53 };
	/** Where the floating shelves hang: the back edge of each board. */
	const BOOKS_AT = { x: 0.38, y: 1.24, z: -0.66 };
	const MEDIA_AT = { x: -1.15, y: 1.06, z: -1.0 };
	/** The calligraphy set, front and center on the table. */
	const INK_AT = { x: -0.12, z: 0.13 };
	const PAPER = { w: 0.42, d: 0.29 };

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
	const BOUNDS = { x: [-1.72, 1.48], y: [0, 1.56] };
</script>

<script>
	import { T, useTask, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { MeshStandardMaterial, Vector3 } from 'three';
	import Piece from '$lib/shelf/Piece.svelte';
	import Plant from '$lib/shelf/Plant.svelte';
	import Turntable from '$lib/shelf/Turntable.svelte';
	import { studio } from '$lib/shelf/studio.js';
	import Box from './Box.svelte';
	import CdPlayer from './CdPlayer.svelte';
	import CdRack from './CdRack.svelte';
	import Hotspot from './Hotspot.svelte';
	import Readout from './Readout.svelte';
	import { BOOK_SHELF, CASSETTES, CDS, MEDIA_SHELF, SLEEVES } from './furnishing.js';
	import { surface } from './surface.js';

	/** @typedef {import('./furnishing.js').Track} Track */
	/** @typedef {(ctx: CanvasRenderingContext2D, w: number, h: number) => void} Paint */

	/**
	 * The room without its walls: a large table with a television, a clock, an age counter, a CD
	 * player and a calligraphy set; a cabinet with the turntable and the CD rack; and two shelves
	 * floating over the page. The furniture's shadows are the only floor. The camera holds still.
	 * @type {{
	 *   cd: Track,
	 *   record: Track | undefined,
	 *   spinning: 'cd' | 'vinyl' | null,
	 *   hovered: string | null,
	 *   seed: number,
	 *   still: boolean,
	 *   paintTv: Paint,
	 *   paintClock: Paint,
	 *   paintAge: Paint,
	 *   onhover: (id: string | null) => void,
	 *   onpick: (id: string) => void
	 * }}
	 */
	let { cd, record, spinning, hovered, seed, still, paintTv, paintClock, paintAge, onhover, onpick } = $props();

	const { renderer, scene, size, invalidate } = useThrelte();

	interactivity({ filter: (hits) => hits.slice(0, 1) });

	const unlight = studio(/** @type {import('three').WebGLRenderer} */ (renderer), scene, 0.55);
	$effect(() => () => unlight());

	/** Pixel art in a floating frame, after the ARC puzzles: a mirrored sprite in the room's pastels. */
	const art = surface(0.38, 0.38);
	const canvasArt = new MeshStandardMaterial({ map: art.texture, roughness: 0.8 });

	/** The sheet on the table, with one character on it and a seal. */
	const sheet = surface(PAPER.w, PAPER.d);
	const paperFace = new MeshStandardMaterial({ map: sheet.texture, roughness: 0.95 });

	$effect(() => {
		const inks = [PALETTE.mint, PALETTE.peach, PALETTE.lilac, PALETTE.sky, '#ff004c'];
		let s = seed * 7919 + 17;
		const next = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
		art.paint((ctx, w) => {
			const n = 9;
			const cell = w / n;
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, w, w);
			ctx.strokeStyle = 'rgba(28, 27, 24, 0.06)';
			for (let k = 0; k <= n; k++) {
				ctx.beginPath();
				ctx.moveTo(k * cell, 0);
				ctx.lineTo(k * cell, w);
				ctx.moveTo(0, k * cell);
				ctx.lineTo(w, k * cell);
				ctx.stroke();
			}
			const ink = inks[Math.floor(next() * (inks.length - 1))];
			for (let y = 1; y < n - 1; y++) {
				for (let x = 1; x <= Math.floor(n / 2); x++) {
					if (next() < 0.48) continue;
					ctx.fillStyle = next() < 0.08 ? inks[4] : ink;
					ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
					ctx.fillRect((n - 1 - x) * cell + 1, y * cell + 1, cell - 2, cell - 2);
				}
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
		ctx.fillStyle = '#17120e';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `700 ${Math.round(h * 0.7)}px "Gowun Batang", "Nanum Myeongjo", "Songti SC", serif`;
		ctx.fillText('永', w * 0.46, h * 0.53);
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
		document.fonts?.load('700 64px "Gowun Batang"', '永筆').then(draw, () => {});
		return () => {
			live = false;
		};
	});

	$effect(() => () => {
		art.texture.dispose();
		canvasArt.dispose();
		sheet.texture.dispose();
		paperFace.dispose();
	});

	/** @type {import('three').PerspectiveCamera | undefined} */
	let lens = $state();

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
			const distance = Math.max((tall * 1.18) / half, (across * 1.04) / (half * aspect));
			lens.position.copy(TARGET).addScaledVector(DIRECTION, distance);
			lens.lookAt(TARGET);
			invalidate();
		},
		{ autoInvalidate: false }
	);

	/** @param {import('three').DirectionalLight} light */
	function sun(light) {
		const { shadow } = light;
		shadow.mapSize.set(2048, 2048);
		shadow.bias = -0.0004;
		shadow.normalBias = 0.02;
		shadow.radius = 8;
		Object.assign(shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 0.5, far: 14 });
		shadow.camera.updateProjectionMatrix();
	}

	const books = [
		{ tone: '#f3c9b5', size: /** @type {[number, number, number]} */ ([0.22, 0.032, 0.16]), turn: 0.08 },
		{ tone: '#cfe0f2', size: /** @type {[number, number, number]} */ ([0.2, 0.028, 0.15]), turn: -0.12 },
		{ tone: '#f6e7a9', size: /** @type {[number, number, number]} */ ([0.18, 0.024, 0.13]), turn: 0.22 }
	];

	/** The floating shelves, each a board with a low rail at the back for things to lean on. */
	const shelves = [
		{ id: 'books', at: BOOKS_AT, pieces: BOOK_SHELF },
		{ id: 'media', at: MEDIA_AT, pieces: MEDIA_SHELF }
	].map((entry) => {
		const left = Math.min(...entry.pieces.map((piece) => piece.x - piece.w / 2));
		const right = Math.max(...entry.pieces.map((piece) => piece.x + piece.w / 2));
		return { ...entry, width: right - left + 0.14 };
	});

	const rackHeight = CDS.length * 0.0128 + 0.024;
	const playingCd = $derived(spinning === 'cd');
	const playingRecord = $derived(spinning === 'vinyl');

	/** @param {string} key @param {boolean} on */
	const hoverPiece = (key, on) => onhover(on ? key : hovered === key ? null : hovered);
</script>

<T.PerspectiveCamera bind:ref={lens} makeDefault fov={FOV} near={0.1} far={40} />

<T.HemisphereLight args={['#ffffff', '#efe6f4', 1.25]} />
<T.DirectionalLight position={[2.4, 5.6, 3.2]} intensity={2.2} castShadow oncreate={sun} />
<T.DirectionalLight position={[-3, 2.5, 1]} intensity={0.35} color="#e9f1ff" />

<!-- No floor, only the shadows it would catch, so the furniture stands on the page itself. -->
<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
	<T.PlaneGeometry args={[9, 9]} />
	<T.ShadowMaterial opacity={0.11} />
</T.Mesh>

<!-- The table. -->
<Box size={[TABLE.w, 0.045, TABLE.d]} radius={0.016} color={PALETTE.white} position={[0, TABLE.top - 0.0225, 0]} />
{#each [-1, 1] as sx (sx)}
	{#each [-1, 1] as sz (sz)}
		<Box
			size={[0.05, TABLE.top - 0.045, 0.05]}
			radius={0.014}
			color={PALETTE.sky}
			position={[sx * (TABLE.w / 2 - 0.1), (TABLE.top - 0.045) / 2, sz * (TABLE.d / 2 - 0.09)]}
		/>
	{/each}
	<Box size={[0.03, 0.06, TABLE.d - 0.24]} radius={0.01} color={PALETTE.sky} position={[sx * (TABLE.w / 2 - 0.1), TABLE.top - 0.075, 0]} />
{/each}
<Box size={[TABLE.w - 0.26, 0.06, 0.03]} radius={0.01} color={PALETTE.sky} position={[0, TABLE.top - 0.075, -(TABLE.d / 2 - 0.09)]} />

<T.Group position.y={TABLE.top}>
	<!-- A little television tuned to "On this day". -->
	<Hotspot id="tv" size={[0.36, 0.34, 0.28]} position={[-0.66, 0, -0.2]} rotation={[0, 0.28, 0]} {hovered} {onhover} onpick={() => onpick('tv')} {still}>
		<T.Group position.y={0.02}>
			<Readout size={[0.34, 0.25, 0.26]} color={PALETTE.mint} radius={0.045} screen={{ w: 0.235, h: 0.172, at: [-0.035, 0.008] }} paint={paintTv}>
				{#each [0.07, 0.02] as y (y)}
					<T.Mesh position={[0.13, 0.125 + y - 0.04, 0.131]} rotation.x={Math.PI / 2} castShadow>
						<T.CylinderGeometry args={[0.016, 0.016, 0.012, 32]} />
						<T.MeshStandardMaterial color={PALETTE.white} roughness={0.4} />
					</T.Mesh>
				{/each}
				{#each [-0.42, 0.36] as tilt (tilt)}
					<T.Mesh position={[0.03 + tilt * 0.12, 0.25 + 0.075, -0.02]} rotation.z={tilt} castShadow>
						<T.CylinderGeometry args={[0.003, 0.003, 0.17, 8]} />
						<T.MeshStandardMaterial color="#d8d4cc" roughness={0.3} metalness={0.6} />
					</T.Mesh>
				{/each}
			</Readout>
		</T.Group>
		{#each [-0.12, 0.12] as x (x)}
			<Box size={[0.05, 0.02, 0.18]} radius={0.008} color={PALETTE.white} position={[x, 0.01, 0]} />
		{/each}
	</Hotspot>

	<!-- The clock at home, in Ithaca, standing on its feet. -->
	<Hotspot id="clock" size={[0.42, 0.17, 0.08]} position={[-0.18, 0, -0.3]} rotation={[0, 0.08, 0]} {hovered} {onhover} onpick={() => onpick('clock')} {still}>
		<T.Group position.y={0.018} rotation.x={-0.12}>
			<Readout size={[0.4, 0.14, 0.04]} color={PALETTE.white} radius={0.02} screen={{ w: 0.362, h: 0.104 }} paint={paintClock} />
		</T.Group>
		{#each [-0.15, 0.15] as x (x)}
			<Box size={[0.04, 0.02, 0.07]} radius={0.008} color={PALETTE.butter} position={[x, 0.01, 0]} />
		{/each}
	</Hotspot>

	<!-- My age, counting. -->
	<Hotspot id="age" size={[0.28, 0.1, 0.08]} position={[0.26, 0, -0.27]} rotation={[0, -0.14, 0]} {hovered} {onhover} onpick={() => onpick('age')} {still}>
		<Readout size={[0.27, 0.088, 0.066]} color={PALETTE.peach} radius={0.022} screen={{ w: 0.24, h: 0.062 }} paint={paintAge} />
	</Hotspot>

	<!-- The calligraphy set: hanji on a felt mat, an inkstone with its stick, a brush on its rest. -->
	<Hotspot id="brush" size={[0.7, 0.07, 0.4]} position={[INK_AT.x, 0, INK_AT.z]} rotation={[0, -0.06, 0]} lift={0.012} {hovered} {onhover} onpick={() => onpick('brush')} {still}>
		<Box size={[PAPER.w + 0.08, 0.004, PAPER.d + 0.07]} radius={0.002} color="#2d2d31" roughness={1} sheen={0} position={[-0.08, 0.002, 0]} />
		<T.Mesh material={paperFace} position={[-0.08, 0.0052, 0]} rotation.x={-Math.PI / 2} receiveShadow>
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

	<!-- The CD player, with whatever CD is on. -->
	<Hotspot id="discman" size={[0.17, 0.05, 0.17]} position={[0.5, 0, 0.2]} rotation={[0, -0.2, 0]} {hovered} {onhover} onpick={() => onpick('discman')} {still}>
		<CdPlayer item={cd.item} i={cd.i} spinning={playingCd && !still} color={PALETTE.lilac} />
	</Hotspot>

	<!-- A stack of books and a lamp. -->
	<T.Group position={[0.62, 0, -0.08]}>
		{#each books as book, n (book.tone)}
			<Box size={book.size} radius={0.006} color={book.tone} rotation={[0, book.turn, 0]} position={[0, books.slice(0, n).reduce((y, b) => y + b.size[1], 0) + book.size[1] / 2, 0]} />
		{/each}
	</T.Group>
	<T.Group position={[0.78, 0, -0.3]}>
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

<!-- The floating shelves: books over the table, films, a tape and a magazine over the cabinet. -->
{#each shelves as entry (entry.id)}
	<T.Group position={[entry.at.x, entry.at.y, entry.at.z]}>
		<Box size={[entry.width, 0.028, 0.21]} radius={0.008} color={PALETTE.white} position={[0, -0.014, 0.105]} />
		<Box size={[entry.width, 0.05, 0.012]} radius={0.004} color={PALETTE.white} position={[0, 0.025, 0.006]} />
		{#each entry.pieces as piece (piece.key)}
			<T.Group position.x={piece.x}>
				<Piece
					{piece}
					{still}
					lifted={hovered === piece.key}
					onpick={() => onpick(piece.key)}
					onhover={(on) => hoverPiece(piece.key, on)}
				/>
			</T.Group>
		{/each}
	</T.Group>
{/each}

<!-- Pixel art in a frame, hanging in the air between the shelves. -->
<Hotspot id="arc" size={[0.46, 0.46, 0.06]} position={[-0.42, 1.08, -0.7]} lift={0.01} {hovered} {onhover} onpick={() => onpick('arc')} {still}>
	<Box size={[0.46, 0.46, 0.03]} radius={0.012} color={PALETTE.white} position={[0, 0.23, 0.015]} />
	<T.Mesh material={canvasArt} position={[0, 0.23, 0.0315]} receiveShadow>
		<T.PlaneGeometry args={[0.38, 0.38]} />
	</T.Mesh>
</Hotspot>

<!-- The cabinet, with the turntable, the CD rack and the podcasts on tape. -->
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

<T.Group position={[CABINET.x - 0.24, CABINET.top, CABINET.z]}>
	<Turntable
		item={record?.item}
		{still}
		spinning={playingRecord}
		finish="#f3ebe3"
		onpick={() => onpick('turntable')}
		onhover={(on) => hoverPiece('turntable', on)}
	/>
</T.Group>

<Hotspot id="rack" size={[0.2, rackHeight, 0.2]} position={[CABINET.x + 0.33, CABINET.top, CABINET.z - 0.02]} rotation={[0, -0.2, 0]} {hovered} {onhover} onpick={() => onpick('rack')} {still}>
	<CdRack items={CDS.map((track) => track.item)} current={playingCd ? cd.item : undefined} />
</Hotspot>

<T.Group position={[CABINET.x + 0.1, CABINET.top, CABINET.z + 0.06]} rotation.y={0.3}>
	{#each CASSETTES as tape, n (tape.title)}
		<Box size={[0.11, 0.017, 0.07]} radius={0.004} color={tape.tone} rotation={[0, n * 0.18, 0]} position={[0, 0.0085 + n * 0.0172, 0]} />
	{/each}
</T.Group>

<!-- The records, leaning on the front of the cabinet. -->
<T.Group position={[CABINET.x - 0.3, 0, CABINET.z + CABINET.d / 2]}>
	{#each SLEEVES as piece (piece.key)}
		<T.Group position={[-piece.x, 0, piece.x * 0.5]}>
			<Piece
				{piece}
				{still}
				lifted={hovered === piece.key}
				onpick={() => onpick(piece.key)}
				onhover={(on) => hoverPiece(piece.key, on)}
			/>
		</T.Group>
	{/each}
</T.Group>

<!-- A snake plant past the table's far end. -->
<T.Group position={[1.3, 0, -0.5]}>
	<Plant piece={{ key: 'room-snake', type: 'plant', variant: 'snake', w: 0.34, h: 0.82, d: 0, x: 0 }} />
</T.Group>
