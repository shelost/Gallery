/**
 * One relief, many windows. The sheet is built past the frame the cell asked for,
 * and the cell's canvas is only the camera. Land outside the subject stays in the
 * mesh, so a crop never ends in an empty ocean where a continent continues.
 */
import {
	AmbientLight,
	BufferAttribute,
	BufferGeometry,
	CanvasTexture,
	Color,
	DirectionalLight,
	Mesh,
	MeshStandardMaterial,
	NeutralToneMapping,
	PerspectiveCamera,
	Scene,
	SRGBColorSpace,
	Vector3,
	WebGLRenderer
} from 'three';
import { createMarches, paintMarches } from './marches.js';
import { insetAspect, NUDGE, paint, placesOf, project, reliefFor, sample, screenPins, squareFrame } from './sheets.js';
import { groundHeight, loadRelief, metresAt } from './relief.js';

const SEA = '#9cb7d1';
/** Radians up from the ground. Far enough over that a wide sheet stays readable. */
const EL = 0.98;
/** One play of a map's change, and the beat before it starts. */
const DURATION = 2600;
const HOLD = 280;
/** The texture a window paints: finer in the expanded view. */
const BOARD = 960;
const BOARD_LARGE = 1600;

/**
 * An eased play head: smoothstep for a gentle start, blended with ease-out so the change
 * settles instead of stopping.
 * @param {number} t
 */
export function glide(t) {
	const smooth = t * t * (3 - 2 * t);
	const out = 1 - (1 - t) * (1 - t);
	return smooth * 0.4 + out * 0.6;
}

/**
 * @typedef {{
 *   world: typeof import('./sheets.js').antique,
 *   period?: number,
 *   from?: number,
 *   frame?: import('./sheets.js').Frame,
 *   star?: boolean,
 *   hide?: string[],
 *   underlay?: boolean,
 *   marks?: import('./empire.js').Region[],
 *   fromMarks?: import('./empire.js').Region[],
 *   spread?: import('./sheets.js').Spread,
 *   focus?: (string | import('./empire.js').Region)[],
 *   borders?: boolean,
 *   solo?: boolean,
 *   dramatic?: boolean,
 *   cities?: string[] | false,
 *   labels?: { lon: number, lat: number, text: string, flag?: string }[],
 *   marches?: import('./marches.js').March[]
 * }} MapSpec
 */

/**
 * @typedef {{ name: string, x: number, y: number, glow?: boolean, kind?: string }} Pin
 */

/**
 * @typedef {MapSpec & {
 *   seed?: HTMLCanvasElement,
 *   autoplay?: boolean,
 *   controls?: { replay: () => void },
 *   flat?: boolean,
 *   onPins?: (pins: Pin[]) => void
 * }} WindowOpts
 */

/**
 * The spec with its frame squared, so every window, flat or relief, is square.
 * @param {WindowOpts} opts
 * @returns {WindowOpts}
 */
const squared = (opts) => ({ ...opts, frame: opts.frame ? squareFrame(opts.frame) : undefined });

/**
 * One frame of the map's change onto a 2D board.
 * @param {CanvasRenderingContext2D} ctx
 * @param {MapSpec} opts
 * @param {import('./sheets.js').Frame | null} frame
 * @param {number} progress 0 to 1, before easing
 * @param {number} scale
 */
function paintBoard(ctx, opts, frame, progress, scale) {
	const period = opts.period ?? 0;
	const head = glide(progress);
	paint(ctx, opts.world, opts.from ?? period, period, opts.dramatic ? Math.pow(head, 0.55) : head, 0.35, {
		frame: frame ?? undefined,
		scale,
		star: opts.star,
		hide: opts.hide,
		underlay: opts.underlay,
		marks: opts.marks,
		fromMarks: opts.fromMarks,
		spread: opts.spread,
		focus: opts.focus,
		borders: opts.borders,
		solo: opts.solo,
		cities: opts.cities,
		labels: opts.labels
	});
}

/** @type {WeakMap<object, number>} */
const ids = new WeakMap();
let nextId = 0;

/**
 * A stable id per marks array, so a repaint check never serializes province rings.
 * @param {object | undefined} value
 */
function idOf(value) {
	if (!value) return 0;
	let id = ids.get(value);
	if (!id) {
		id = ++nextId;
		ids.set(value, id);
	}
	return id;
}

/**
 * @param {import('./sheets.js').Frame} frame
 * @param {number} margin
 */
function grow(frame, margin) {
	const mx = (frame.lon1 - frame.lon0) * margin;
	const my = (frame.lat1 - frame.lat0) * margin;
	return {
		lon0: frame.lon0 - mx,
		lon1: frame.lon1 + mx,
		lat0: Math.max(-72, frame.lat0 - my),
		lat1: Math.min(78, frame.lat1 + my)
	};
}

/**
 * The cell's view, and the larger ground built around it.
 * @param {{ world: typeof import('./sheets.js').antique, frame?: import('./sheets.js').Frame }} opts
 */
function sheetBox(opts) {
	const { world } = opts;
	const view = opts.frame ?? (world.mode === 'equirect' ? world.frame : null);
	return { view, box: view ? grow(view, opts.frame ? 0.55 : 0.04) : null };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MapSpec} opts
 * @param {number} progress
 */
function paintFlat(canvas, opts, progress) {
	const width = Math.max(8, Math.round(canvas.clientWidth || canvas.width || 0));
	if (width < 8) return;
	const ratio = insetAspect(opts.world, opts.frame ?? null);
	const height = Math.max(8, Math.round(width / ratio));
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	paintBoard(ctx, opts, opts.frame ?? null, progress, 0.7);
	if (opts.marches?.length) {
		paintMarches(ctx, opts.world, opts.frame ?? null, width, height, opts.marches, glide(progress));
	}
	opts.onPins?.(screenPins(opts.world, opts.frame ?? null, width, height, opts.labels ?? [], opts.cities));
}

/**
 * A map window on a 2D canvas: flat until it nears the screen, relief once it does. The first
 * time it is mostly on screen its change plays once, and `controls.replay` plays it again.
 * A `seed` canvas is shown first, so a window opened from another starts on the same picture.
 * @param {HTMLCanvasElement} canvas
 * @param {WindowOpts} raw
 */
export function mountWindow(canvas, raw) {
	const opts = squared(raw);
	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let progress = still || opts.autoplay === false ? 1 : 0;
	/** @type {ReturnType<typeof openWindow> | null} */
	let relief = null;
	let mounted = true;
	let tick = 0;

	const show = () => {
		if (relief) relief.show(progress);
		else paintFlat(canvas, opts, progress);
	};

	const play = () => {
		cancelAnimationFrame(tick);
		if (still) {
			progress = 1;
			show();
			return;
		}
		const start = performance.now() + HOLD;
		progress = 0;
		show();
		const step = (/** @type {number} */ now) => {
			if (!mounted) return;
			progress = Math.min(1, Math.max(0, (now - start) / (opts.dramatic ? 5200 : DURATION)));
			show();
			if (progress < 1) tick = requestAnimationFrame(step);
		};
		tick = requestAnimationFrame(step);
	};
	if (opts.controls) opts.controls.replay = play;

	if (opts.seed) {
		canvas.width = opts.seed.width;
		canvas.height = opts.seed.height;
		canvas.getContext('2d')?.drawImage(opts.seed, 0, 0);
	} else paintFlat(canvas, opts, progress);

	loadRelief(reliefFor(opts.world, opts.frame ?? null)).then(() => {
		if (mounted && !relief) paintFlat(canvas, opts, progress);
	});
	const near = new IntersectionObserver(
		(entries) => {
			const visible = entries.some((entry) => entry.isIntersecting);
			if (visible && !relief && !opts.flat) relief = openWindow(canvas, opts, progress);
			else if (!visible && relief) {
				relief.stop();
				relief = null;
				paintFlat(canvas, opts, progress);
			}
		},
		{ rootMargin: '240px' }
	);
	near.observe(canvas);
	let armed = true;
	const seen = new IntersectionObserver(
		(entries) => {
			const entry = entries[0];
			if (!entry) return;
			const rootH = entry.rootBounds?.height ?? 0;
			const fits = entry.boundingClientRect.height <= rootH * 0.98;
			const full = fits
				? entry.intersectionRatio >= 0.92
				: entry.intersectionRatio >= 0.7 && entry.intersectionRect.height >= rootH * 0.85;
			if (full && armed && opts.autoplay !== false) {
				armed = false;
				play();
			} else if (entry.intersectionRatio === 0) {
				cancelAnimationFrame(tick);
				progress = 0;
				show();
				armed = true;
			}
		},
		{ threshold: [0, 0.92, 1] }
	);
	seen.observe(canvas);
	const resize = new ResizeObserver(() => {
		if (!relief) paintFlat(canvas, opts, progress);
	});
	resize.observe(canvas);
	return () => {
		mounted = false;
		cancelAnimationFrame(tick);
		near.disconnect();
		seen.disconnect();
		resize.disconnect();
		relief?.stop();
	};
}

/**
 * Relief on an offscreen WebGL canvas, then copied onto the 2D cell.
 * The cell itself never takes a WebGL context, so disposing 3D cannot blank it.
 * @param {HTMLCanvasElement} display
 * @param {WindowOpts} opts
 * @param {number} start
 */
function openWindow(display, opts, start) {
	const glCanvas = document.createElement('canvas');
	const renderer = new WebGLRenderer({
		canvas: glCanvas,
		antialias: true,
		alpha: false,
		preserveDrawingBuffer: true
	});
	renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
	renderer.toneMapping = NeutralToneMapping;
	renderer.outputColorSpace = SRGBColorSpace;
	const scene = new Scene();
	scene.background = new Color(SEA);
	const camera = new PerspectiveCamera(34, 1, 0.04, 80);
	scene.add(new AmbientLight(0xfff6ea, 0.78));
	const sun = new DirectionalLight(0xfff1dc, 1.7);
	sun.position.set(-1.6, 2.4, 1.2);
	scene.add(sun);
	const fillLight = new DirectionalLight(0xd5e2ee, 0.38);
	fillLight.position.set(1.4, 0.5, -0.6);
	scene.add(fillLight);

	let disposed = false;
	let progress = start;
	/** @type {BufferGeometry | null} */
	let geometry = null;
	/** @type {CanvasTexture | null} */
	let texture = null;
	/** @type {Mesh | null} */
	let mesh = null;
	/** @type {((progress: number) => void) | null} */
	let repaint = null;
	let painted = '';
	/** @type {Vector3[]} */
	let corners = [];
	/** @type {{ minX: number, maxX: number, minZ: number, maxZ: number }} */
	let bounds = { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };
	/** @type {'frame' | 'sheet'} */
	let fill = 'sheet';
	let meshSize = { width: 2, depth: 2 };
	/** @type {import('./sheets.js').Frame | null} */
	let sheet = null;
	/** @type {ReturnType<typeof createMarches> | null} */
	let marches = null;
	let lastPins = '';

	/**
	 * Project city dots from mesh space into the cell, as percent.
	 * @param {WindowOpts} spec
	 * @param {PerspectiveCamera} cam
	 * @param {import('./sheets.js').Frame | null} box
	 * @param {{ width: number, depth: number }} size
	 */
	const emitPins = (spec, cam, box, size) => {
		if (!spec.onPins) return;
		const pins = [];
		for (const place of placesOf(spec.world, spec.labels ?? [], spec.cities)) {
			let x;
			let z;
			if (box) {
				const u = (place.lon - box.lon0) / (box.lon1 - box.lon0);
				const vNorth = (place.lat - box.lat0) / (box.lat1 - box.lat0);
				if (u < -0.02 || u > 1.02 || vNorth < -0.02 || vNorth > 1.02) continue;
				x = (u - 0.5) * size.width;
				z = (0.5 - vNorth) * size.depth;
			} else {
				const pt = project(spec.world, place.lon, place.lat, 1, 1, null);
				if (!pt) continue;
				x = (pt[0] - 0.5) * size.width;
				z = (pt[1] - 0.5) * size.depth;
			}
			const clip = new Vector3(x, 0.06, z).project(cam);
			if (clip.z > 1 || clip.z < -1) continue;
			const shift = NUDGE[place.name] ?? { x: 0, y: 0 };
			const sx = (clip.x * 0.5 + 0.5) * 100 + shift.x;
			const sy = (-clip.y * 0.5 + 0.5) * 100 + shift.y;
			if (sx < 1.5 || sx > 98.5 || sy < 2 || sy > 98) continue;
			pins.push({
				name: place.name,
				glow: place.glow,
				kind: place.kind,
				flag: place.flag,
				x: sx,
				y: sy
			});
		}
		const key = pins.map((pin) => `${pin.name}:${pin.x.toFixed(1)}:${pin.y.toFixed(1)}`).join('|');
		if (key === lastPins) return;
		lastPins = key;
		spec.onPins(pins);
	};

	const target = new Vector3(0, 0.03, 0);
	/** @param {number} dist */
	const place = (dist) => {
		camera.position.set(0, target.y + dist * Math.sin(EL), dist * Math.cos(EL));
		camera.lookAt(target);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld();
	};

	/**
	 * True when the canvas corners all land on the relief, so the cell is a
	 * window and not a tile floating in the background color.
	 * @param {{ minX: number, maxX: number, minZ: number, maxZ: number }} box
	 */
	const viewportOnMesh = (box) => {
		for (const x of [-1, 1]) {
			for (const y of [-1, 1]) {
				const point = new Vector3(x, y, 0.5).unproject(camera).sub(camera.position);
				if (point.y >= -1e-5) return false;
				const t = (0.02 - camera.position.y) / point.y;
				if (!(t > 0)) return false;
				const gx = camera.position.x + point.x * t;
				const gz = camera.position.z + point.z * t;
				if (gx <= box.minX || gx >= box.maxX || gz <= box.minZ || gz >= box.maxZ) return false;
			}
		}
		return true;
	};

	/**
	 * A whole sheet fills the cell. A framed crop stays in frame, and the
	 * ground built past that crop covers the corners the tilt would leave empty.
	 * @param {Vector3[]} frameCorners
	 * @param {{ minX: number, maxX: number, minZ: number, maxZ: number }} box
	 * @param {'frame' | 'sheet'} mode
	 */
	const fit = (frameCorners, box, mode) => {
		if (mode === 'sheet') {
			let near = 0.35;
			let far = 48;
			for (let step = 0; step < 22; step++) {
				const dist = (near + far) / 2;
				place(dist);
				if (viewportOnMesh(box)) near = dist;
				else far = dist;
			}
			place(near * 0.97);
			return;
		}
		let dist = 3.5;
		for (let step = 0; step < 16; step++) {
			place(dist);
			let maxN = 0.001;
			for (const corner of frameCorners) {
				const projected = corner.clone().project(camera);
				maxN = Math.max(maxN, Math.abs(projected.x), Math.abs(projected.y));
			}
			dist = Math.min(80, Math.max(0.3, dist * (maxN / 0.97)));
		}
		place(dist);
		for (let step = 0; step < 6 && !viewportOnMesh(box); step++) {
			dist *= 0.9;
			place(dist);
		}
	};

	const draw = () => {
		if (disposed) return;
		const width = display.clientWidth || 0;
		if (width < 8) return;
		const ratio = insetAspect(opts.world, opts.frame ?? null);
		const height = Math.max(8, Math.round(width / ratio));
		renderer.setSize(width, height, false);
		camera.aspect = width / Math.max(1, height);

		const size = width > 560 ? BOARD_LARGE : BOARD;
		const key = [
			opts.world.id,
			opts.period ?? 0,
			opts.frame ? `${opts.frame.lon0},${opts.frame.lon1},${opts.frame.lat0},${opts.frame.lat1}` : 'sheet',
			opts.star === false ? '0' : '1',
			(opts.hide ?? []).join(','),
			opts.underlay ? 'u' : '',
			idOf(opts.marks),
			size
		].join('|');
		if (key !== painted) {
			painted = key;
			geometry?.dispose();
			texture?.dispose();
			if (mesh) {
				scene.remove(mesh);
				const material = mesh.material;
				if (!Array.isArray(material)) material.dispose();
			}
			const built = buildSheet(opts, size, progress);
			geometry = built.geometry;
			texture = built.texture;
			repaint = built.repaint;
			mesh = new Mesh(
				geometry,
				new MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0 })
			);
			scene.add(mesh);
			if (marches) {
				scene.remove(marches.group);
				marches.dispose();
				marches = null;
			}
			if (opts.marches?.length) {
				marches = createMarches(opts.marches, built.place, built.visible);
				scene.add(marches.group);
			}
			corners = built.corners;
			bounds = built.bounds;
			fill = built.fill;
			meshSize = { width: built.width, depth: built.depth };
			sheet = built.box;
		}
		if (corners.length) fit(corners, bounds, fill);
		display.dataset.cam = `${fill} ${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)}`;
		marches?.update(glide(progress));
		renderer.render(scene, camera);
		display.width = glCanvas.width;
		display.height = glCanvas.height;
		const ctx = display.getContext('2d');
		if (ctx) ctx.drawImage(glCanvas, 0, 0);
		emitPins(opts, camera, sheet, meshSize);
	};

	const observer = new ResizeObserver(draw);
	observer.observe(display);
	loadRelief(reliefFor(opts.world, sheetBox(opts).box)).then(() => {
		if (disposed) return;
		painted = '';
		draw();
	});
	draw();

	return {
		/** @param {number} next */
		show(next) {
			progress = next;
			if (repaint && texture) {
				repaint(progress);
				texture.needsUpdate = true;
			}
			draw();
		},
		stop() {
			disposed = true;
			observer.disconnect();
			geometry?.dispose();
			texture?.dispose();
			if (mesh && !Array.isArray(mesh.material)) mesh.material.dispose();
			if (marches) {
				scene.remove(marches.group);
				marches.dispose();
			}
			renderer.dispose();
		}
	};
}

/**
 * @param {MapSpec} opts
 * @param {number} size board width in pixels
 * @param {number} progress
 */
function buildSheet(opts, size, progress) {
	const { world } = opts;
	const { view, box } = sheetBox(opts);
	const regions = reliefFor(world, box);
	const board = document.createElement('canvas');
	const ratio = insetAspect(world, box);
	board.width = size;
	board.height = Math.max(1, Math.round(size / ratio));
	const context = board.getContext('2d');
	const scale = 0.7 * (size / BOARD);
	const repaint = (/** @type {number} */ next) => {
		if (context) paintBoard(context, opts, box, next, scale);
	};
	repaint(progress);
	const texture = new CanvasTexture(board);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = 8;
	texture.needsUpdate = true;

	const midLat = box
		? ((box.lat0 + box.lat1) / 2) * (Math.PI / 180)
		: ((world.lat0 + world.lat1) / 2) * (Math.PI / 180);
	const xDeg = box ? (box.lon1 - box.lon0) * Math.cos(midLat) : ratio;
	const yDeg = box ? box.lat1 - box.lat0 : 1;
	const width = 2;
	const depth = box ? width * (yDeg / xDeg) : width / ratio;
	const span = Math.min(width, depth);
	const cols = 168;
	const rows = Math.max(56, Math.min(168, Math.round(cols * (depth / width))));
	const positions = new Float32Array(cols * rows * 3);
	const uvs = new Float32Array(cols * rows * 2);

	/** @param {number} u @param {number} vNorth */
	const locate = (u, vNorth) => {
		if (!box) {
			const [lon, lat] = sample(world, u, vNorth);
			return { lon, lat, x: (u - 0.5) * width, z: (0.5 - vNorth) * depth };
		}
		const lon = box.lon0 + u * (box.lon1 - box.lon0);
		const lat = box.lat0 + vNorth * (box.lat1 - box.lat0);
		return { lon, lat, x: (u - 0.5) * width, z: (0.5 - vNorth) * depth };
	};

	for (let row = 0; row < rows; row++) {
		const vNorth = row / (rows - 1);
		for (let col = 0; col < cols; col++) {
			const u = col / (cols - 1);
			const at = locate(u, vNorth);
			const y = groundHeight(metresAt(regions, at.lon, at.lat), span);
			const vertex = (row * cols + col) * 3;
			positions[vertex] = at.x;
			positions[vertex + 1] = y;
			positions[vertex + 2] = at.z;
			const uv = (row * cols + col) * 2;
			uvs[uv] = u;
			uvs[uv + 1] = vNorth;
		}
	}

	const indices = [];
	for (let row = 0; row < rows - 1; row++) {
		for (let col = 0; col < cols - 1; col++) {
			const a = row * cols + col;
			// North is −Z and height is +Y, so this order faces the camera above the sheet.
			indices.push(a, a + 1, a + cols, a + 1, a + cols + 1, a + cols);
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new BufferAttribute(positions, 3));
	geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();

	const corners = view
		? [
				[view.lon0, view.lat0],
				[view.lon1, view.lat0],
				[view.lon0, view.lat1],
				[view.lon1, view.lat1]
			].map(([lon, lat]) => {
				const u = box ? (lon - box.lon0) / (box.lon1 - box.lon0) : 0;
				const vNorth = box ? (lat - box.lat0) / (box.lat1 - box.lat0) : 0;
				const at = locate(u, vNorth);
				return new Vector3(at.x, 0.04, at.z);
			})
		: [
				new Vector3(-width / 2, 0.04, depth / 2),
				new Vector3(width / 2, 0.04, depth / 2),
				new Vector3(-width / 2, 0.04, -depth / 2),
				new Vector3(width / 2, 0.04, -depth / 2)
			];

	const viewX = view && box ? width * ((view.lon1 - view.lon0) / (box.lon1 - box.lon0)) : width;
	const viewZ = view && box ? depth * ((view.lat1 - view.lat0) / (box.lat1 - box.lat0)) : depth;
	const visible = Math.max(0.4, Math.min(viewX, viewZ));
	const lift = visible * 0.006;

	/**
	 * A point of the campaign, on this sheet. Null when it falls off the ground.
	 * @param {number} lon
	 * @param {number} lat
	 */
	const place = (lon, lat) => {
		let u;
		let vNorth;
		if (box) {
			u = (lon - box.lon0) / (box.lon1 - box.lon0);
			vNorth = (lat - box.lat0) / (box.lat1 - box.lat0);
		} else {
			const pt = project(world, lon, lat, 1, 1, null);
			if (!pt) return null;
			u = pt[0];
			vNorth = 1 - pt[1];
		}
		if (u < -0.04 || u > 1.04 || vNorth < -0.04 || vNorth > 1.04) return null;
		u = Math.min(1, Math.max(0, u));
		vNorth = Math.min(1, Math.max(0, vNorth));
		const at = locate(u, vNorth);
		let metres = 0;
		for (const [dx, dy] of [
			[0, 0],
			[0.06, 0],
			[-0.06, 0],
			[0, 0.06],
			[0, -0.06]
		]) {
			metres = Math.max(metres, metresAt(regions, lon + dx, lat + dy) ?? 0);
		}
		return new Vector3(at.x, groundHeight(metres, span) + lift, at.z);
	};

	return {
		geometry,
		texture,
		repaint,
		corners,
		fill: opts.frame ? 'frame' : 'sheet',
		bounds: { minX: -width / 2, maxX: width / 2, minZ: -depth / 2, maxZ: depth / 2 },
		width,
		depth,
		box,
		place,
		visible
	};
}
