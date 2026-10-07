import { mesh, occlusion } from './sdf.js';
import { STATUES } from './statues.js';

/** Sculpts one statue at a time, off the page, and hands its buffers back without copying them. */
self.onmessage = (/** @type {MessageEvent<{ id: string }>} */ { data: { id } }) => {
	const statue = STATUES.find((entry) => entry.id === id);
	if (!statue) return;
	const parts = statue.build();
	const { positions, normals, indices } = mesh(parts, statue.cell);
	const open = occlusion(parts, positions, normals, statue.cell * 6);
	self.postMessage({ id, positions, normals, indices, open }, { transfer: [positions.buffer, normals.buffer, indices.buffer, open.buffer] });
};
