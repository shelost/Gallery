import { CanvasTexture, SRGBColorSpace } from 'three';

/** @typedef {import('$lib/directions/content.js').ShelfItem} ShelfItem */
/** @typedef {import('$lib/directions/content.js').ShelfFormat} ShelfFormat */

export const SERIF = '"Instrument Serif", Georgia, serif';
export const SANS = '"Akt", "Google Sans Flex", system-ui, sans-serif';
export const MONO = '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace';
const KOREAN = '"Gowun Batang", serif';
/** Pixels per meter of cover. */
const DENSITY = 2600;
const MAX = 1024;

/** Covers on one shelf of music take turns between these. */
const MOTIFS = ['sun', 'bands', 'type'];

/** The fonts the covers are printed in, so nothing is drawn in a fallback face. */
export async function loadCoverFonts() {
	if (typeof document === 'undefined' || !document.fonts) return;
	const faces = [`64px ${SERIF}`, `64px ${SANS}`, `64px ${KOREAN}`];
	const timeout = new Promise((done) => setTimeout(done, 2500));
	await Promise.race([Promise.all(faces.map((face) => document.fonts.load(face).catch(() => []))), timeout]);
}

/**
 * @param {number} w
 * @param {number} h
 * @param {(ctx: CanvasRenderingContext2D, w: number, h: number) => void} paint
 */
function texture(w, h, paint) {
	const scale = Math.min(DENSITY, MAX / Math.max(w, h));
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(w * scale);
	canvas.height = Math.round(h * scale);
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	paint(ctx, canvas.width, canvas.height);
	const map = new CanvasTexture(canvas);
	map.colorSpace = SRGBColorSpace;
	map.anisotropy = 4;
	return map;
}

/**
 * Breaks text into lines that fit the width, word by word, or glyph by glyph for Korean.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} width
 */
function wrap(ctx, text, width) {
	const words = text.includes(' ') ? text.split(' ') : [...text];
	const joiner = text.includes(' ') ? ' ' : '';
	/** @type {string[]} */
	const lines = [];
	let line = '';
	for (const word of words) {
		const next = line ? line + joiner + word : word;
		if (line && ctx.measureText(next).width > width) {
			lines.push(line);
			line = word;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {{ x: number, y: number, width: number, size: number, font: string, align?: CanvasTextAlign, leading?: number, max?: number }} box
 * @returns {number} the y just under the last line
 */
export function block(ctx, text, { x, y, width, size, font, align = 'left', leading = 1.02, max = 4 }) {
	let px = size;
	ctx.textAlign = align;
	ctx.textBaseline = 'alphabetic';
	let lines = [];
	do {
		ctx.font = `${px}px ${font}`;
		lines = wrap(ctx, text, width);
		if (lines.length <= max) break;
		px *= 0.9;
	} while (px > size * 0.4);
	lines.forEach((line, n) => ctx.fillText(line, x, y + px + n * px * leading));
	return y + px + (lines.length - 1) * px * leading + px * 0.35;
}

/** @param {ShelfItem} item */
const face = (item) => (item.lang === 'ko' ? KOREAN : SERIF);

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} color
 * @param {number} alpha
 * @param {() => void} draw
 */
function tinted(ctx, color, alpha, draw) {
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	draw();
	ctx.restore();
}

/** @type {Record<ShelfFormat, (ctx: CanvasRenderingContext2D, w: number, h: number, item: ShelfItem, i: number) => void>} */
const PRINTERS = {
	book(ctx, w, h, item) {
		tinted(ctx, item.ink, 0.35, () => {
			ctx.lineWidth = w * 0.006;
			ctx.strokeRect(w * 0.07, h * 0.05, w * 0.86, h * 0.9);
		});
		ctx.fillStyle = item.ink;
		block(ctx, item.title, { x: w / 2, y: h * 0.2, width: w * 0.74, size: w * 0.16, font: face(item), align: 'center' });
		if (item.by) {
			block(ctx, item.by.toUpperCase(), { x: w / 2, y: h * 0.8, width: w * 0.74, size: w * 0.05, font: SANS, align: 'center', max: 2 });
		}
	},
	magazine(ctx, w, h, item) {
		tinted(ctx, item.ink, 0.12, () => {
			ctx.beginPath();
			ctx.arc(w * 0.7, h * 0.72, w * 0.42, 0, Math.PI * 2);
			ctx.fill();
		});
		ctx.fillStyle = item.ink;
		block(ctx, item.title, { x: w * 0.08, y: h * 0.05, width: w * 0.84, size: w * 0.17, font: face(item), leading: 0.92 });
		tinted(ctx, item.ink, 0.7, () => {
			ctx.fillRect(w * 0.08, h * 0.9, w * 0.84, h * 0.003);
		});
	},
	dvd(ctx, w, h, item) {
		ctx.fillStyle = item.ink;
		ctx.fillRect(0, 0, w, h * 0.09);
		ctx.fillStyle = item.tone;
		ctx.font = `600 ${h * 0.045}px ${SANS}`;
		ctx.textAlign = 'center';
		ctx.fillText('DVD', w / 2, h * 0.062);
		ctx.fillStyle = item.ink;
		block(ctx, item.title, { x: w / 2, y: h * 0.3, width: w * 0.8, size: w * 0.15, font: face(item), align: 'center' });
		const credit = [item.by, item.year].filter(Boolean).join(' · ');
		if (credit) block(ctx, credit.toUpperCase(), { x: w / 2, y: h * 0.86, width: w * 0.8, size: w * 0.05, font: SANS, align: 'center', max: 1 });
	},
	vhs(ctx, w, h, item) {
		tinted(ctx, item.ink, 0.85, () => {
			for (let n = 0; n < 3; n++) ctx.fillRect(0, h * (0.08 + n * 0.035), w, h * 0.012);
		});
		ctx.fillStyle = item.ink;
		ctx.font = `600 ${h * 0.04}px ${SANS}`;
		ctx.textAlign = 'right';
		ctx.fillText('VHS', w * 0.9, h * 0.94);
		block(ctx, item.title, { x: w * 0.1, y: h * 0.36, width: w * 0.8, size: w * 0.26, font: face(item) });
	},
	cassette(ctx, w, h, item) {
		ctx.fillStyle = item.ink;
		ctx.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.42);
		ctx.fillStyle = item.tone;
		block(ctx, item.title, { x: w * 0.12, y: h * 0.13, width: w * 0.76, size: h * 0.17, font: face(item), max: 2 });
		tinted(ctx, '#1c1b18', 0.85, () => {
			ctx.fillRect(w * 0.26, h * 0.6, w * 0.48, h * 0.22);
		});
		ctx.fillStyle = item.ink;
		for (const cx of [0.36, 0.64]) {
			ctx.beginPath();
			ctx.arc(w * cx, h * 0.71, h * 0.08, 0, Math.PI * 2);
			ctx.fill();
		}
	},
	cd: disc,
	vinyl: disc
};

/**
 * Album art: one of three motifs, then the title in the corner.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {ShelfItem} item
 * @param {number} i
 */
function disc(ctx, w, h, item, i) {
	const motif = MOTIFS[i % MOTIFS.length];
	if (motif === 'sun') {
		tinted(ctx, item.ink, 0.9, () => {
			ctx.beginPath();
			ctx.arc(w * 0.5, h * 0.4, w * 0.21, 0, Math.PI * 2);
			ctx.fill();
		});
	} else if (motif === 'bands') {
		tinted(ctx, item.ink, 0.22, () => {
			for (let n = 0; n < 4; n++) ctx.fillRect(0, h * (0.12 + n * 0.14), w, h * 0.07);
		});
	}
	ctx.fillStyle = item.ink;
	if (motif === 'type') {
		block(ctx, item.title, { x: w * 0.08, y: h * 0.06, width: w * 0.84, size: w * 0.2, font: face(item), leading: 0.9 });
	} else {
		block(ctx, item.title, { x: w * 0.08, y: h * 0.66, width: w * 0.84, size: w * 0.11, font: face(item), max: 2 });
	}
	if (item.by) {
		ctx.font = `${w * 0.045}px ${item.lang === 'ko' ? KOREAN : SANS}`;
		ctx.textAlign = 'left';
		ctx.fillText(item.by.toUpperCase(), w * 0.08, h * 0.93);
	}
}

/**
 * The printed front of a recommendation.
 * @param {ShelfItem} item
 * @param {ShelfFormat} format
 * @param {number} i
 * @param {number} w meters
 * @param {number} h meters
 */
export function cover(item, format, i, w, h) {
	return texture(w, h, (ctx, pw, ph) => {
		ctx.fillStyle = item.tone;
		ctx.fillRect(0, 0, pw, ph);
		PRINTERS[format](ctx, pw, ph, item, i);
		const sheen = ctx.createLinearGradient(0, 0, pw, ph);
		sheen.addColorStop(0, 'rgba(255,255,255,0.08)');
		sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
		sheen.addColorStop(1, 'rgba(0,0,0,0.06)');
		ctx.fillStyle = sheen;
		ctx.fillRect(0, 0, pw, ph);
	});
}

/**
 * The printed face of a CD: the album art inside a silver rim, around the hub and hole.
 * Outside the disc stays transparent.
 * @param {ShelfItem | undefined} item
 * @param {number} i
 */
export function compact(item, i) {
	return texture(0.12, 0.12, (ctx, size) => {
		const r = size / 2;
		const circle = (/** @type {number} */ radius) => {
			ctx.beginPath();
			ctx.arc(r, r, radius, 0, Math.PI * 2);
		};
		const rim = ctx.createConicGradient(0, r, r);
		['#e8ecf2', '#f6e4ee', '#dff0ea', '#ece6f8', '#e8ecf2'].forEach((color, n, all) => rim.addColorStop(n / (all.length - 1), color));
		ctx.fillStyle = rim;
		circle(r);
		ctx.fill();
		ctx.save();
		circle(r * 0.95);
		ctx.clip();
		ctx.fillStyle = item?.tone ?? '#f6d6dc';
		ctx.fillRect(0, 0, size, size);
		if (item) disc(ctx, size, size, item, i);
		ctx.restore();
		ctx.fillStyle = rim;
		circle(r * 0.22);
		ctx.fill();
		ctx.globalCompositeOperation = 'destination-out';
		circle(r * 0.075);
		ctx.fill();
	});
}

/**
 * The top of a record: grooves, and a center label in the album's colors.
 * @param {ShelfItem | undefined} item
 */
export function record(item) {
	return texture(0.3, 0.3, (ctx, size) => {
		const r = size / 2;
		ctx.fillStyle = '#111';
		ctx.fillRect(0, 0, size, size);
		ctx.lineWidth = 1;
		for (let n = 0.36; n < 0.98; n += 0.012) {
			ctx.strokeStyle = `rgba(255,255,255,${0.025 + ((n * 97) % 1) * 0.04})`;
			ctx.beginPath();
			ctx.arc(r, r, r * n, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.fillStyle = item?.tone ?? '#8c2f4a';
		ctx.beginPath();
		ctx.arc(r, r, r * 0.34, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = item?.ink ?? '#f6d6dc';
		if (item) {
			block(ctx, item.title, {
				x: r,
				y: r * 0.72,
				width: r * 0.5,
				size: r * 0.09,
				font: face(item),
				align: 'center',
				max: 3
			});
		}
		ctx.fillStyle = '#d9d4c8';
		ctx.beginPath();
		ctx.arc(r, r, r * 0.025, 0, Math.PI * 2);
		ctx.fill();
	});
}
