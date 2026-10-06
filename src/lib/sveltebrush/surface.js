/**
 * A sheet of paper. Ink that has soaked in lives on an offscreen "dried" canvas;
 * each brush paints its current stroke opaquely onto its own wet layer, which is
 * shown at the stroke's density and merged when the brush lifts. Painting
 * opaquely is what keeps overlapping bristles and frames from stacking into
 * visible seams. The wet layer is displayed and dried through the same
 * composite, so a stroke never changes when the brush lifts.
 */

const HISTORY = 12;

/** @typedef {{ record?: boolean }} CommitOptions record: push an undo point first */

/** @param {number} w @param {number} h */
const blank = (w, h) => {
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	return canvas;
};

/** @param {HTMLCanvasElement} source */
const copy = (source) => {
	const canvas = blank(source.width, source.height);
	canvas.getContext('2d')?.drawImage(source, 0, 0);
	return canvas;
};

/** @type {HTMLCanvasElement | null} */
let toothTile = null;

/** Tileable paper tooth: sparse specks and short fibres where ink fails to take. */
const tooth = () => {
	if (toothTile) return toothTile;
	toothTile = blank(256, 256);
	const ctx = /** @type {CanvasRenderingContext2D} */ (toothTile.getContext('2d'));
	ctx.fillStyle = '#000';
	for (let i = 0; i < 1600; i++) {
		ctx.globalAlpha = 0.4 + Math.random() * 0.6;
		const size = Math.random() < 0.85 ? 1 : 2;
		ctx.fillRect(Math.random() * 256, Math.random() * 256, size, size);
	}
	ctx.strokeStyle = '#000';
	ctx.lineCap = 'round';
	for (let i = 0; i < 160; i++) {
		const x = Math.random() * 256;
		const y = Math.random() * 256;
		const angle = (Math.random() - 0.5) * 0.8;
		const length = 6 + Math.random() * 18;
		ctx.globalAlpha = 0.25 + Math.random() * 0.5;
		ctx.lineWidth = 0.6 + Math.random() * 0.8;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.quadraticCurveTo(x + length / 2, y + (Math.random() - 0.5) * 4, x + Math.cos(angle) * length, y + Math.sin(angle) * length);
		ctx.stroke();
	}
	return toothTile;
};

export class Layer {
	/** @param {Surface} surface */
	constructor(surface) {
		this.surface = surface;
		this.canvas = blank(1, 1);
		this.ctx = /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext('2d'));
		this.opacity = 1;
		/** How much paper grain eats this stroke, 0–1. */
		this.tooth = 0;
		this.active = false;
		this.fit();
	}

	fit() {
		const { width, height, dpr } = this.surface;
		this.canvas.width = Math.max(1, Math.round(width * dpr));
		this.canvas.height = Math.max(1, Math.round(height * dpr));
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	/** @param {number} opacity @param {number} [tooth] */
	begin(opacity, tooth = 0) {
		this.active = true;
		this.opacity = opacity;
		this.tooth = tooth;
	}

	/**
	 * Merge into the paper.
	 * @param {CommitOptions} [options]
	 */
	commit(options) {
		this.surface.commit(this, options);
		this.active = false;
		this.clear();
	}

	clear() {
		this.ctx.save();
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.restore();
	}

	destroy() {
		this.surface.layers.delete(this);
	}
}

export class Surface {
	/**
	 * @param {HTMLCanvasElement} canvas visible canvas; sized from its CSS box
	 * @param {{ maxDpr?: number, dpr?: number, onchange?: () => void }} [options] dpr: fixed pixel ratio (e.g. for video)
	 */
	constructor(canvas, { maxDpr = 2, dpr, onchange } = {}) {
		this.canvas = canvas;
		this.ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
		this.dried = blank(1, 1);
		this.paper = /** @type {CanvasRenderingContext2D} */ (this.dried.getContext('2d'));
		/** Scratch sheet where paper tooth is cut out of a wet layer. */
		this.grain = blank(1, 1);
		this.grainCtx = /** @type {CanvasRenderingContext2D} */ (this.grain.getContext('2d'));
		/** @type {Set<Layer>} */
		this.layers = new Set();
		/** @type {HTMLCanvasElement[]} */
		this.past = [];
		/** @type {HTMLCanvasElement[]} */
		this.future = [];
		this.width = 0;
		this.height = 0;
		this.maxDpr = maxDpr;
		this.fixedDpr = dpr;
		this.dpr = 1;
		this.frame = 0;
		this.onchange = onchange;
		/** Records strokes and history for timelapse playback. @type {import('./timelapse.js').Tape | null} */
		this.tape = null;
	}

	/** Match the backing stores to the canvas's CSS size, keeping dried ink. */
	resize(width = this.canvas.clientWidth, height = this.canvas.clientHeight) {
		const dpr = this.fixedDpr ?? Math.min(this.maxDpr, globalThis.devicePixelRatio || 1);
		if (!width || !height || (width === this.width && height === this.height && dpr === this.dpr)) return;
		const previous = this.width ? copy(this.dried) : null;
		const [oldWidth, oldHeight] = [this.width, this.height];
		this.width = width;
		this.height = height;
		this.dpr = dpr;
		for (const canvas of [this.canvas, this.dried, this.grain]) {
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
		}
		this.paper.setTransform(dpr, 0, 0, dpr, 0, 0);
		if (previous) this.paper.drawImage(previous, 0, 0, oldWidth, oldHeight);
		for (const layer of this.layers) layer.fit();
		this.render();
	}

	layer() {
		const layer = new Layer(this);
		this.layers.add(layer);
		return layer;
	}

	invalidate() {
		if (!this.frame) {
			this.frame = requestAnimationFrame(() => {
				this.frame = 0;
				this.render();
			});
		}
	}

	render() {
		const { ctx, canvas } = this;
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(this.dried, 0, 0);
		for (const layer of this.layers) if (layer.active) this.composite(ctx, layer);
		ctx.restore();
	}

	/**
	 * Lay a wet layer onto a target (the screen or the paper) at its density,
	 * with the paper's tooth cut out. Expects an identity transform on `target`.
	 * @param {CanvasRenderingContext2D} target
	 * @param {Layer} layer
	 */
	composite(target, layer) {
		let source = layer.canvas;
		if (layer.tooth > 0.01) {
			const { grain, grainCtx } = this;
			grainCtx.save();
			grainCtx.setTransform(1, 0, 0, 1, 0, 0);
			grainCtx.globalCompositeOperation = 'copy';
			grainCtx.drawImage(layer.canvas, 0, 0);
			grainCtx.globalCompositeOperation = 'destination-out';
			grainCtx.globalAlpha = Math.min(1, layer.tooth);
			grainCtx.fillStyle = /** @type {CanvasPattern} */ (grainCtx.createPattern(tooth(), 'repeat'));
			grainCtx.fillRect(0, 0, grain.width, grain.height);
			grainCtx.restore();
			source = grain;
		}
		target.globalCompositeOperation = 'multiply';
		target.globalAlpha = layer.opacity;
		target.drawImage(source, 0, 0);
	}

	/**
	 * @param {Layer} layer
	 * @param {CommitOptions} [options]
	 */
	commit(layer, { record = true } = {}) {
		if (record) this.push();
		this.paper.save();
		this.paper.setTransform(1, 0, 0, 1, 0, 0);
		this.composite(this.paper, layer);
		this.paper.restore();
		this.invalidate();
	}

	/**
	 * Draw straight onto the paper (e.g. a seal), in CSS pixels.
	 * @param {(ctx: CanvasRenderingContext2D) => void} paint
	 */
	draw(paint) {
		this.tape?.mark('draw', paint);
		this.paper.save();
		paint(this.paper);
		this.paper.restore();
		this.invalidate();
	}

	/** Push an undo point. Call once before a group of strokes that should undo together. */
	remember() {
		this.tape?.mark('remember');
		this.push();
	}

	push() {
		this.past.push(copy(this.dried));
		if (this.past.length > HISTORY) this.past.shift();
		this.future = [];
		this.onchange?.();
	}

	/** @param {HTMLCanvasElement} state */
	restore(state) {
		this.paper.save();
		this.paper.setTransform(1, 0, 0, 1, 0, 0);
		this.paper.clearRect(0, 0, this.dried.width, this.dried.height);
		this.paper.drawImage(state, 0, 0, this.dried.width, this.dried.height);
		this.paper.restore();
		this.invalidate();
		this.onchange?.();
	}

	undo() {
		const state = this.past.pop();
		if (!state) return;
		this.tape?.mark('undo');
		this.future.push(copy(this.dried));
		this.restore(state);
	}

	redo() {
		const state = this.future.pop();
		if (!state) return;
		this.tape?.mark('redo');
		this.past.push(copy(this.dried));
		this.restore(state);
	}

	clear() {
		this.remember();
		this.wipe();
	}

	/** Clear without an undo point. */
	wipe() {
		this.tape?.mark('wipe');
		this.paper.save();
		this.paper.setTransform(1, 0, 0, 1, 0, 0);
		this.paper.clearRect(0, 0, this.dried.width, this.dried.height);
		this.paper.restore();
		this.invalidate();
	}

	/**
	 * Export the sheet, optionally on a paper colour.
	 * @param {{ background?: string, type?: string }} [options]
	 * @returns {Promise<Blob | null>}
	 */
	toBlob({ background, type = 'image/png' } = {}) {
		const out = blank(this.dried.width, this.dried.height);
		const ctx = /** @type {CanvasRenderingContext2D} */ (out.getContext('2d'));
		if (background) {
			ctx.fillStyle = background;
			ctx.fillRect(0, 0, out.width, out.height);
			ctx.globalCompositeOperation = 'multiply';
		}
		ctx.drawImage(this.dried, 0, 0);
		return new Promise((resolve) => out.toBlob(resolve, type));
	}

	destroy() {
		cancelAnimationFrame(this.frame);
		this.layers.clear();
	}
}
