import { BufferAttribute, BufferGeometry } from 'three';

/**
 * Statues come out of a worker as raw buffers; this turns them into geometry, standing on
 * y = 0 and centered over the origin, and keeps each one so it's only ever sculpted once.
 * The worker takes requests in order, so whatever's asked for first is ready first.
 */

/** @typedef {{ geometry: BufferGeometry, size: [number, number, number] }} Sculpture */

/** @type {Map<string, Promise<Sculpture>>} */
const made = new Map();
/** @type {Map<string, (sculpture: Sculpture) => void>} */
const waiting = new Map();
/** @type {Worker | undefined} */
let worker;

function sculptor() {
	if (worker) return worker;
	worker = new Worker(new URL('./sculpt.worker.js', import.meta.url), { type: 'module' });
	worker.onmessage = (/** @type {MessageEvent<{ id: string, positions: Float32Array, normals: Float32Array, indices: Uint32Array, open: Float32Array }>} */ { data }) => {
		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new BufferAttribute(data.positions, 3));
		geometry.setAttribute('normal', new BufferAttribute(data.normals, 3));
		const shade = new Float32Array(data.open.length * 3);
		for (let v = 0; v < data.open.length; v++) {
			const light = 0.2 + 0.8 * Math.pow(data.open[v], 1.4);
			shade.set([light, light, light], v * 3);
		}
		geometry.setAttribute('color', new BufferAttribute(shade, 3));
		geometry.setIndex(new BufferAttribute(data.indices, 1));
		geometry.computeBoundingBox();
		const box = /** @type {import('three').Box3} */ (geometry.boundingBox);
		geometry.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
		geometry.computeBoundingBox();
		geometry.computeBoundingSphere();
		const size = /** @type {[number, number, number]} */ ([box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z]);
		waiting.get(data.id)?.({ geometry, size });
		waiting.delete(data.id);
	};
	return worker;
}

/** The statue's geometry, sculpting it if it hasn't been yet. @param {string} id */
export function sculpture(id) {
	const known = made.get(id);
	if (known) return known;
	const promise = new Promise((resolve) => waiting.set(id, resolve));
	made.set(id, /** @type {Promise<Sculpture>} */ (promise));
	sculptor().postMessage({ id });
	return /** @type {Promise<Sculpture>} */ (promise);
}
