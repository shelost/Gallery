import { Brush } from './brush.js';
import { Surface } from './surface.js';

/**
 * Timelapse: record everything that happens to a surface, then replay it.
 *
 * Instead of capturing frames, a Tape logs brush input (with each stroke's full
 * brush state and bristle seed) plus history operations. Replaying that log
 * through fresh brushes repaints the sheet stroke for stroke, at any speed or
 * resolution, for a few kilobytes per stroke.
 *
 * @typedef {import('./presets.js').BrushPreset} BrushPreset
 * @typedef {{ type: 'begin', t: number, brush: number, x: number, y: number, p: number, heading?: [number, number], preset: BrushPreset, size: number, color: string, ink: number, tip: number, seed: number, record: boolean }} BeginOp
 * @typedef {{ type: 'point', t: number, brush: number, x: number, y: number, p: number }} PointOp
 * @typedef {{ type: 'end', t: number, brush: number }} EndOp
 * @typedef {{ type: 'remember' | 'undo' | 'redo' | 'wipe' | 'draw', t: number, paint?: (ctx: CanvasRenderingContext2D) => void }} MarkOp
 * @typedef {BeginOp | PointOp | EndOp | MarkOp} Op
 */

/** Longest pause kept between strokes, in ms of real time. */
const IDLE = 220;
/** A timelapse always plays at least this much faster than life. */
const MIN_SPEED = 2;

export class Tape {
	constructor() {
		/** @type {Op[]} */
		this.ops = [];
		this.strokes = 0;
		/** @type {((strokes: number) => void) | null} */
		this.onstroke = null;
		/** @type {WeakMap<Brush, number>} */
		this.ids = new WeakMap();
		this.next = 1;
	}

	/** @param {Brush} brush */
	id(brush) {
		let id = this.ids.get(brush);
		if (!id) this.ids.set(brush, (id = this.next++));
		return id;
	}

	/**
	 * @param {Brush} brush
	 * @param {number} x @param {number} y @param {number} p
	 * @param {[number, number]} [heading]
	 */
	begin(brush, x, y, p, heading) {
		this.ops.push({
			type: 'begin',
			t: performance.now(),
			brush: this.id(brush),
			x,
			y,
			p,
			heading,
			preset: { ...brush.preset },
			size: brush.size,
			color: brush.color,
			ink: brush.ink,
			tip: brush.tip,
			seed: brush.seed,
			record: brush.record
		});
	}

	/** @param {Brush} brush @param {number} x @param {number} y @param {number} p */
	point(brush, x, y, p) {
		this.ops.push({ type: 'point', t: performance.now(), brush: this.id(brush), x, y, p });
	}

	/** @param {Brush} brush */
	end(brush) {
		this.ops.push({ type: 'end', t: performance.now(), brush: this.id(brush) });
		this.strokes++;
		this.onstroke?.(this.strokes);
	}

	/**
	 * @param {MarkOp['type']} type
	 * @param {MarkOp['paint']} [paint]
	 */
	mark(type, paint) {
		this.ops.push({ type, t: performance.now(), paint });
	}

	clear() {
		this.ops = [];
		this.strokes = 0;
		this.onstroke?.(0);
	}
}

/**
 * Map every op to a playback time: strokes keep their rhythm, idle gaps are
 * trimmed, and the whole thing is sped up to fit the target length.
 * @param {Op[]} ops
 * @param {number} target ms
 */
function timeline(ops, target) {
	/** @type {number[]} */
	const times = [];
	let clock = 0;
	let open = 0;
	let previous = ops[0]?.t ?? 0;
	for (const op of ops) {
		const gap = Math.max(0, op.t - previous);
		previous = op.t;
		clock += open > 0 ? gap : Math.min(gap, IDLE);
		times.push(clock);
		if (op.type === 'begin') open++;
		else if (op.type === 'end') open = Math.max(0, open - 1);
	}
	const speed = Math.max(MIN_SPEED, clock / target);
	return { times: times.map((t) => t / speed), length: clock / speed };
}

/**
 * Replay a tape onto a surface (which should start blank).
 * @param {Tape} tape
 * @param {Surface} surface
 * @param {{ duration?: number, onframe?: (progress: number) => void }} [options] duration: target length in ms
 * @returns {{ done: Promise<boolean>, stop: () => void, length: number }} done resolves true if it played to the end
 */
export function play(tape, surface, { duration = 12000, onframe } = {}) {
	const ops = tape.ops.slice();
	const { times, length } = timeline(ops, duration);
	/** @type {Map<number, Brush>} */
	const brushes = new Map();
	let index = 0;
	let clock = 0;
	let last = 0;
	let frame = 0;
	let over = false;
	/** @type {(value: boolean) => void} */
	let settle = () => {};
	const done = new Promise((resolve) => (settle = resolve));

	/** @param {boolean} finished */
	function finish(finished) {
		if (over) return;
		over = true;
		cancelAnimationFrame(frame);
		for (const brush of brushes.values()) brush.destroy();
		brushes.clear();
		settle(finished);
	}

	/** @param {Op} op */
	function apply(op) {
		if (op.type === 'begin') {
			let brush = brushes.get(op.brush);
			if (!brush) brushes.set(op.brush, (brush = new Brush(surface, op.preset)));
			brush.set(op.preset);
			if (brush.seed !== op.seed || brush.bristles.length !== Math.round(op.preset.bristles)) brush.hairs(op.seed);
			brush.size = op.size;
			brush.color = op.color;
			brush.record = op.record;
			brush.ink = op.ink;
			brush.tip = op.tip;
			brush.down(op.x, op.y, op.p, op.heading);
		} else if (op.type === 'point') {
			brushes.get(op.brush)?.to(op.x, op.y, op.p);
		} else if (op.type === 'end') {
			brushes.get(op.brush)?.up();
		} else if (op.type === 'draw') {
			if (op.paint) surface.draw(op.paint);
		} else {
			surface[op.type]();
		}
	}

	/** @param {number} now */
	function tick(now) {
		if (over) return;
		clock += Math.min(64, now - last);
		last = now;
		while (index < ops.length && times[index] <= clock) apply(ops[index++]);
		for (const brush of brushes.values()) brush.flush();
		surface.render();
		onframe?.(length ? Math.min(1, clock / length) : 1);
		if (index >= ops.length) return finish(true);
		frame = requestAnimationFrame(tick);
	}

	frame = requestAnimationFrame((now) => {
		last = now;
		tick(now);
	});
	return { done, stop: () => finish(false), length };
}

const VIDEO_TYPES = ['video/mp4;codecs=avc1.42E01F', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];

/** Best recordable video type in this browser: MP4 where supported, else WebM, else ''. */
export const videoType = () =>
	typeof MediaRecorder === 'undefined' ? '' : (VIDEO_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '');

/**
 * Render a tape to video. Recording runs in real time, so this takes about as
 * long as the timelapse itself (plus `hold`).
 * @param {Tape} tape
 * @param {{
 *   width: number,
 *   height: number,
 *   background?: string,
 *   resolution?: number,
 *   fps?: number,
 *   duration?: number,
 *   hold?: number,
 *   onprogress?: (progress: number) => void,
 *   signal?: AbortSignal
 * }} options width/height: sheet size in CSS px; resolution: longest video side in px; hold: ms to linger on the finished sheet
 * @returns {Promise<{ blob: Blob, extension: 'mp4' | 'webm' } | null>} null if aborted
 */
export async function renderVideo(
	tape,
	{ width, height, background = '#f1e8d6', resolution = 1920, fps = 30, duration = 12000, hold = 1500, onprogress, signal }
) {
	const type = videoType();
	if (!type) throw new Error('This browser cannot record video.');
	const scale = Math.min(2, resolution / Math.max(width, height));
	const even = (/** @type {number} */ n) => Math.max(2, Math.round(n / 2) * 2);
	const out = document.createElement('canvas');
	out.width = even(width * scale);
	out.height = even(height * scale);
	const ctx = /** @type {CanvasRenderingContext2D} */ (out.getContext('2d'));
	const sheet = new Surface(document.createElement('canvas'), { dpr: scale });
	sheet.resize(width, height);

	const paint = () => {
		ctx.globalCompositeOperation = 'source-over';
		ctx.fillStyle = background;
		ctx.fillRect(0, 0, out.width, out.height);
		ctx.globalCompositeOperation = 'multiply';
		ctx.drawImage(sheet.canvas, 0, 0, out.width, out.height);
	};
	paint();

	const recorder = new MediaRecorder(out.captureStream(fps), { mimeType: type, videoBitsPerSecond: 10_000_000 });
	/** @type {Blob[]} */
	const chunks = [];
	recorder.ondataavailable = (e) => {
		if (e.data.size) chunks.push(e.data);
	};
	const stopped = new Promise((resolve) => (recorder.onstop = resolve));
	recorder.start(250);

	const player = play(tape, sheet, {
		duration,
		onframe: (progress) => {
			paint();
			onprogress?.(progress * 0.92);
		}
	});
	signal?.addEventListener('abort', player.stop);
	let finished = await player.done;

	const until = performance.now() + hold;
	while (finished && performance.now() < until) {
		if (signal?.aborted) finished = false;
		paint();
		onprogress?.(0.92 + 0.08 * (1 - (until - performance.now()) / hold));
		await new Promise((resolve) => requestAnimationFrame(resolve));
	}
	recorder.stop();
	await stopped;
	sheet.destroy();
	if (!finished) return null;
	onprogress?.(1);
	return { blob: new Blob(chunks, { type: type.split(';')[0] }), extension: type.includes('mp4') ? 'mp4' : 'webm' };
}
