import { CanvasTexture, SRGBColorSpace } from 'three';

/** Pixels per meter, capped so small screens stay sharp without huge canvases. */
const DENSITY = 4200;
const MAX = 1024;

/**
 * A canvas the size of a screen in the room, as a texture that can be repainted.
 * @param {number} w meters
 * @param {number} h meters
 */
export function surface(w, h) {
	const scale = Math.min(DENSITY, MAX / Math.max(w, h));
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(w * scale);
	canvas.height = Math.round(h * scale);
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = 4;
	return {
		texture,
		/** @param {(ctx: CanvasRenderingContext2D, w: number, h: number) => void} paint */
		paint(paint) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			paint(ctx, canvas.width, canvas.height);
			texture.needsUpdate = true;
		}
	};
}
