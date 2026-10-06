/**
 * A 192 × 96 dot-matrix screen on a canvas, in the spirit of Teenage Engineering
 * hardware. Text uses a 5 × 7 font, pictures are ordered-dithered through a 4 × 4
 * Bayer matrix, and every dot is painted as a square with a hairline gap so the
 * matrix reads as a physical display at any size.
 */

/**
 * @typedef {'graph' | 'curve' | 'arc' | 'lines' | 'film'} LcdGlyph
 * @typedef {{ kind: 'glyph', glyph: LcdGlyph, value?: string } | { kind: 'image', src: string } | { kind: 'video', src: string, poster?: string }} LcdSource
 * @typedef {{ header: { left: string, right: string }, title: string, meta: string, marquee: string, source: LcdSource | null }} LcdView
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 */

export const LCD_W = 192;
export const LCD_H = 96;

const OFF = 0;
const DIM = 1;
const ON = 2;

const FPS = 15;
const MEDIA = { x: 3, y: 15, w: 96, h: 64 };
const MARQUEE = { x: 3, y: 86, w: LCD_W - 6, h: 8 };
const TEXT_X = 107;
const TEXT_CHARS = 14;

/** @param {number} r @param {number} g @param {number} b */
function pack(r, g, b) {
	return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

const GAP = pack(21, 20, 17);
const DOTS = [pack(34, 32, 27), pack(122, 117, 104), pack(242, 236, 223)];

/** 5 × 7 glyphs as five column bytes, bit 0 at the top. */
const FONT_HEX = {
	' ': '0000000000',
	'!': '00005f0000',
	'"': '0007000700',
	'#': '147f147f14',
	$: '242a7f2a12',
	'%': '2313086462',
	'&': '3649552250',
	"'": '0005030000',
	'(': '001c224100',
	')': '0041221c00',
	'*': '082a1c2a08',
	'+': '08083e0808',
	',': '0050300000',
	'-': '0808080808',
	'.': '0060600000',
	'/': '2010080402',
	0: '3e5149453e',
	1: '00427f4000',
	2: '4261514946',
	3: '2141454b31',
	4: '1814127f10',
	5: '2745454539',
	6: '3c4a494930',
	7: '0171090503',
	8: '3649494936',
	9: '064949291e',
	':': '0036360000',
	';': '0056360000',
	'<': '0814224100',
	'=': '1414141414',
	'>': '0041221408',
	'?': '0201510906',
	'@': '324979413e',
	A: '7e1111117e',
	B: '7f49494936',
	C: '3e41414122',
	D: '7f4141221c',
	E: '7f49494941',
	F: '7f09090901',
	G: '3e4149497a',
	H: '7f0808087f',
	I: '00417f4100',
	J: '2040413f01',
	K: '7f08142241',
	L: '7f40404040',
	M: '7f020c027f',
	N: '7f0408107f',
	O: '3e4141413e',
	P: '7f09090906',
	Q: '3e4151215e',
	R: '7f09192946',
	S: '4649494931',
	T: '01017f0101',
	U: '3f4040403f',
	V: '1f2040201f',
	W: '3f4038403f',
	X: '6314081463',
	Y: '0708700807',
	Z: '6151494543',
	_: '4040404040',
	'·': '0000080000',
	'→': '08083e1c08'
};

const FONT = new Map(
	Object.entries(FONT_HEX).map(([char, hex]) => [
		char,
		/** @type {string[]} */ (hex.match(/../g)).map((byte) => parseInt(byte, 16))
	])
);

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Uppercase text the font can draw. Anything else, including Hangul, is dropped. @param {string} text */
export function toLcdText(text) {
	return Array.from(
		text
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[‘’]/g, "'")
			.replace(/[“”]/g, '"')
			.replace(/[–—]/g, '-')
			.replace(/…/g, '...')
			.toUpperCase()
	)
		.filter((char) => FONT.has(char) || /\s/.test(char))
		.join('')
		.replace(/\s+/g, ' ')
		.trim();
}

/** @param {string} text */
function textWidth(text) {
	return text.length ? text.length * 6 - 1 : 0;
}

/**
 * Word-wraps to a fixed number of lines, marking the last one when text is cut.
 * @param {string} text @param {number} width in characters @param {number} maxLines
 */
function wrap(text, width, maxLines) {
	const lines = [];
	let line = '';
	for (const raw of text.split(' ').filter(Boolean)) {
		const word = raw.slice(0, width);
		const next = line ? `${line} ${word}` : word;
		if (next.length <= width) {
			line = next;
			continue;
		}
		lines.push(line);
		line = word;
		if (lines.length === maxLines) {
			const last = lines[maxLines - 1];
			lines[maxLines - 1] = `${last.slice(0, width - 2)}..`;
			return lines;
		}
	}
	if (line) lines.push(line);
	return lines;
}

/** A grid of dot intensities with an optional clipping rectangle. */
class Raster {
	/** @param {number} width @param {number} height */
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.dots = new Uint8Array(width * height);
		/** @type {Rect | null} */
		this.clip = null;
	}

	clear() {
		this.dots.fill(OFF);
	}

	/** @param {number} x @param {number} y @param {number} value */
	set(x, y, value) {
		const clip = this.clip;
		if (clip && (x < clip.x || y < clip.y || x >= clip.x + clip.w || y >= clip.y + clip.h)) return;
		if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
		this.dots[y * this.width + x] = value;
	}

	/** @param {number} x @param {number} y @param {number} w @param {number} h @param {number} value */
	fill(x, y, w, h, value) {
		for (let j = 0; j < h; j++) {
			for (let i = 0; i < w; i++) this.set(x + i, y + j, value);
		}
	}

	/** @param {number} x @param {number} y @param {number} w @param {number} h @param {number} value */
	frame(x, y, w, h, value) {
		for (let i = 0; i < w; i++) {
			this.set(x + i, y, value);
			this.set(x + i, y + h - 1, value);
		}
		for (let j = 1; j < h - 1; j++) {
			this.set(x, y + j, value);
			this.set(x + w - 1, y + j, value);
		}
	}

	/** Bresenham line. @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 @param {number} value */
	line(x0, y0, x1, y1, value) {
		let x = Math.round(x0);
		let y = Math.round(y0);
		const endX = Math.round(x1);
		const endY = Math.round(y1);
		const dx = Math.abs(endX - x);
		const dy = -Math.abs(endY - y);
		const stepX = x < endX ? 1 : -1;
		const stepY = y < endY ? 1 : -1;
		let error = dx + dy;
		for (;;) {
			this.set(x, y, value);
			if (x === endX && y === endY) return;
			const doubled = 2 * error;
			if (doubled >= dy) {
				error += dy;
				x += stepX;
			}
			if (doubled <= dx) {
				error += dx;
				y += stepY;
			}
		}
	}

	/** @param {string} text @param {number} x @param {number} y @param {number} value @param {number} [scale] */
	text(text, x, y, value, scale = 1) {
		let cursor = x;
		for (const char of text) {
			const columns = FONT.get(char);
			if (columns) {
				for (let c = 0; c < 5; c++) {
					for (let r = 0; r < 7; r++) {
						if ((columns[c] >> r) & 1) this.fill(cursor + c * scale, y + r * scale, scale, scale, value);
					}
				}
			}
			cursor += 6 * scale;
		}
	}
}

/** @param {Uint32Array} histogram @param {number} rank */
function percentile(histogram, rank) {
	let sum = 0;
	for (let value = 0; value < 256; value++) {
		sum += histogram[value];
		if (sum >= rank) return value;
	}
	return 255;
}

/** Luminance of RGBA pixels, stretched between the 4th and 96th percentiles. @param {Uint8ClampedArray} rgba */
function levels(rgba) {
	const count = rgba.length / 4;
	const luma = new Float32Array(count);
	const histogram = new Uint32Array(256);
	for (let i = 0; i < count; i++) {
		const value = 0.2126 * rgba[i * 4] + 0.7152 * rgba[i * 4 + 1] + 0.0722 * rgba[i * 4 + 2];
		luma[i] = value;
		histogram[value | 0]++;
	}
	const low = percentile(histogram, count * 0.04);
	const range = Math.max(32, percentile(histogram, count * 0.96) - low);
	for (let i = 0; i < count; i++) luma[i] = Math.min(1, Math.max(0, (luma[i] - low) / range));
	return luma;
}

/** @param {Raster} raster @param {Float32Array} luma @param {Rect} area */
function dither(raster, luma, area) {
	for (let y = 0; y < area.h; y++) {
		for (let x = 0; x < area.w; x++) {
			const threshold = (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
			raster.dots[(area.y + y) * raster.width + area.x + x] = luma[y * area.w + x] > threshold ? ON : OFF;
		}
	}
}

/** @param {Raster} raster @param {number} y */
function dotted(raster, y) {
	for (let x = 3; x < LCD_W - 3; x += 2) raster.set(x, y, DIM);
}

/** Viewfinder corners just outside a rectangle. @param {Raster} raster @param {Rect} rect */
function brackets(raster, { x, y, w, h }) {
	const left = x - 1;
	const top = y - 1;
	const right = x + w;
	const bottom = y + h;
	for (let i = 0; i < 4; i++) {
		raster.set(left + i, top, DIM);
		raster.set(left, top + i, DIM);
		raster.set(right - i, top, DIM);
		raster.set(right, top + i, DIM);
		raster.set(left + i, bottom, DIM);
		raster.set(left, bottom - i, DIM);
		raster.set(right - i, bottom, DIM);
		raster.set(right, bottom - i, DIM);
	}
}

/** @param {Raster} raster @param {Rect} area @param {number} t @param {boolean} still */
function loading(raster, area, t, still) {
	const count = still ? 3 : 1 + (Math.floor(t / 250) % 3);
	for (let i = 0; i < count; i++) {
		raster.fill(area.x + area.w / 2 - 7 + i * 6, area.y + area.h / 2 - 1, 2, 2, DIM);
	}
}

/* Drawn screens for work without media worth sampling. Each draws into the
   96 × 64 media area at (ox, oy); `t` is ms since the work was selected. */

const NODE_W = 24;
const NODE_H = 11;
const GRAPH_NODES = [
	{ x: 4, y: 8, label: 'TXT' },
	{ x: 4, y: 45, label: 'IMG' },
	{ x: 36, y: 26, label: 'LLM' },
	{ x: 68, y: 8, label: 'V.1' },
	{ x: 68, y: 45, label: 'V.2' }
];
const GRAPH_PATHS = [
	[0, 2],
	[1, 2],
	[2, 3],
	[2, 4]
].map(([from, to]) => {
	const a = GRAPH_NODES[from];
	const b = GRAPH_NODES[to];
	const x1 = a.x + NODE_W;
	const y1 = a.y + 5;
	const x2 = b.x - 1;
	const y2 = b.y + 5;
	const mid = Math.round((x1 + x2) / 2);
	/** @type {[number, number][]} */
	const points = [];
	for (let x = x1; x <= mid; x++) points.push([x, y1]);
	for (let y = y1; y !== y2; y += Math.sign(y2 - y1)) points.push([mid, y]);
	for (let x = mid; x <= x2; x++) points.push([x, y2]);
	return points;
});

/** Ovid: prompts flow into a model, and drafts flow out. */
function graph(/** @type {Raster} */ r, /** @type {number} */ ox, /** @type {number} */ oy, /** @type {number} */ t, /** @type {boolean} */ still) {
	const phase = still ? -1 : (t % 2400) / 2400;
	GRAPH_PATHS.forEach((points, i) => {
		for (const [x, y] of points) if ((x + y) % 2 === 0) r.set(ox + x, oy + y, DIM);
		const start = i < 2 ? 0 : 0.45;
		const progress = (phase - start) / 0.3;
		if (progress >= 0 && progress < 1) {
			const [x, y] = points[Math.floor(progress * points.length)];
			r.fill(ox + x - 1, oy + y - 1, 3, 3, ON);
		}
	});
	GRAPH_NODES.forEach((node, i) => {
		const hot = (i === 2 && phase >= 0.3 && phase < 0.45) || (i > 2 && phase >= 0.75);
		const x = ox + node.x;
		const y = oy + node.y;
		r.fill(x, y, NODE_W, NODE_H, hot ? ON : OFF);
		r.frame(x, y, NODE_W, NODE_H, ON);
		r.text(node.label, x + 3, y + 2, hot ? OFF : ON);
	});
}

/** Stan: the GMV curve traced like an oscilloscope. */
function curve(/** @type {Raster} */ r, /** @type {number} */ ox, /** @type {number} */ oy, /** @type {number} */ t, /** @type {boolean} */ still) {
	const { w, h } = MEDIA;
	for (let y = 3; y < h; y += 8) {
		for (let x = 3; x < w; x += 8) r.set(ox + x, oy + y, DIM);
	}
	const progress = still ? 1 : Math.min(1, (t % 3400) / 2600);
	const head = Math.round(progress * (w - 1));
	let previous = -1;
	for (let x = 0; x <= head; x++) {
		const k = x / (w - 1);
		const wobble = Math.sin(x * 1.3) * 0.8 + Math.sin(x * 0.37) * 1.2;
		const y = Math.round(h - 7 - Math.pow(k, 2.3) * (h - 20) + wobble * k);
		if (previous >= 0) r.line(ox + x - 1, oy + previous, ox + x, oy + y, ON);
		previous = y;
	}
	if (progress < 1) {
		for (let y = 0; y < h; y += 2) r.set(ox + head, oy + y, DIM);
		r.fill(ox + head - 1, oy + previous - 1, 3, 3, ON);
	} else {
		r.text('$30M', ox + w - 27, oy + 2, ON);
	}
	r.text('$0', ox + 2, oy + h - 17, DIM);
}

const ARC_IN = ['X....', 'XX...', '.XX..', '..X..', '..XXX'];
const ARC_OUT = ARC_IN.map((row) => [...row].reverse().join(''));

/** @param {Raster} r @param {number} x @param {number} y @param {string[]} rows @param {number} filled @param {number} cursor */
function arcGrid(r, x, y, rows, filled, cursor) {
	r.frame(x - 2, y - 2, 34, 34, DIM);
	for (let j = 0; j < 5; j++) {
		for (let i = 0; i < 5; i++) {
			const index = j * 5 + i;
			const cx = x + i * 6;
			const cy = y + j * 6;
			if (index < filled && rows[j][i] === 'X') r.fill(cx, cy, 5, 5, ON);
			else r.set(cx + 2, cy + 2, DIM);
			if (index === cursor) r.frame(cx - 1, cy - 1, 7, 7, ON);
		}
	}
}

/** Arcaide: an ARC puzzle solved cell by cell (the rule is a mirror). */
function arc(/** @type {Raster} */ r, /** @type {number} */ ox, /** @type {number} */ oy, /** @type {number} */ t, /** @type {boolean} */ still) {
	const top = oy + 21;
	const left = ox + 8;
	const right = ox + 58;
	const filled = still ? 25 : Math.min(25, Math.floor((t % 4150) / 110));
	const cursor = !still && filled < 25 && Math.floor(t / 180) % 2 === 0 ? filled : -1;
	r.text('IN', left, oy + 9, DIM);
	r.text('OUT', right, oy + 9, DIM);
	arcGrid(r, left, top, ARC_IN, 25, -1);
	arcGrid(r, right, top, ARC_OUT, filled, cursor);
	r.text('→', ox + 45, top + 11, ON);
}

const PAGE_LINES = [24, 27, 19, 26, 27, 15, 25, 22, 11];

/** Essays: a page that types itself, with the reading time beside it. */
function lines(/** @type {Raster} */ r, /** @type {number} */ ox, /** @type {number} */ oy, /** @type {number} */ t, /** @type {boolean} */ still, /** @type {string} */ value) {
	const x = ox + 6;
	const y = oy + 4;
	const w = 38;
	const h = 56;
	const fold = 8;
	r.line(x, y, x + w - fold, y, ON);
	r.line(x + w - fold, y, x + w - 1, y + fold - 1, ON);
	r.line(x + w - 1, y + fold - 1, x + w - 1, y + h - 1, ON);
	r.line(x, y + h - 1, x + w - 1, y + h - 1, ON);
	r.line(x, y, x, y + h - 1, ON);
	r.line(x + w - fold, y, x + w - fold, y + fold - 1, DIM);
	r.line(x + w - fold, y + fold - 1, x + w - 1, y + fold - 1, DIM);
	let budget = still ? Infinity : t / 14;
	PAGE_LINES.forEach((length, i) => {
		const shown = Math.max(0, Math.min(length, budget));
		budget -= length;
		for (let k = 0; k < shown; k++) if (k % 6 !== 5) r.set(x + 5 + k, y + 12 + i * 5, ON);
	});
	if (value) {
		r.text(value, ox + 52, oy + 12, ON, 3);
		r.text('MIN', ox + 53, oy + 38, DIM);
	}
}

/** Fallback for video that can't be sampled: a strip running past a play mark. */
function film(/** @type {Raster} */ r, /** @type {number} */ ox, /** @type {number} */ oy, /** @type {number} */ t, /** @type {boolean} */ still) {
	const { w, h } = MEDIA;
	const shift = still ? 0 : Math.floor(t / (1000 / FPS)) % 8;
	for (let x = -8; x < w + 8; x += 8) {
		r.fill(ox + x - shift, oy + 2, 4, 3, ON);
		r.fill(ox + x - shift, oy + h - 5, 4, 3, ON);
	}
	r.line(ox, oy + 7, ox + w - 1, oy + 7, DIM);
	r.line(ox, oy + h - 8, ox + w - 1, oy + h - 8, DIM);
	for (let i = 0; i < 15; i++) {
		const half = Math.round((15 - i) * 0.6);
		r.line(ox + 41 + i, oy + 32 - half, ox + 41 + i, oy + 32 + half, ON);
	}
}

const GLYPHS = { graph, curve, arc, lines, film };

/**
 * Draws an LcdView onto a canvas, resampling video at 15 fps while running.
 * Only dots that changed since the last frame are repainted.
 */
export class LcdRenderer {
	/** @param {HTMLCanvasElement} canvas */
	constructor(canvas) {
		this.canvas = canvas;
		this.context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
		this.raster = new Raster(LCD_W, LCD_H);
		this.painted = new Uint8Array(LCD_W * LCD_H).fill(255);
		this.cell = 0;
		this.gap = 0;
		/** Total columns on the glass; the 192-column screen is centred and the rest stay unlit. */
		this.columns = LCD_W;
		this.offset = 0;
		/** @type {ImageData | null} */
		this.image = null;
		/** @type {Uint32Array | null} */
		this.pixels = null;

		const scratch = document.createElement('canvas');
		scratch.width = MEDIA.w;
		scratch.height = MEDIA.h;
		this.scratch = /** @type {CanvasRenderingContext2D} */ (scratch.getContext('2d', { willReadFrequently: true }));

		this.video = document.createElement('video');
		this.video.muted = true;
		this.video.loop = true;
		this.video.playsInline = true;
		this.video.preload = 'auto';
		this.video.addEventListener('loadeddata', this.#onFrame);

		/** @type {Map<string, Float32Array>} */
		this.cache = new Map();
		/** @type {LcdView} */
		this.view = { header: { left: '', right: '' }, title: '', meta: '', marquee: '', source: null };
		this.sourceKey = '';
		/** @type {Float32Array | null} */
		this.luma = null;
		this.failed = false;
		this.since = 0;
		this.running = false;
		this.frame = 0;
		this.last = 0;

		this.observer = new ResizeObserver(() => this.resize());
		this.observer.observe(/** @type {Element} */ (canvas.parentElement));
		document.addEventListener('visibilitychange', this.#onVisibility);
		this.resize();
	}

	/** @param {LcdView} view */
	update(view) {
		this.view = {
			header: { left: toLcdText(view.header.left), right: toLcdText(view.header.right) },
			title: toLcdText(view.title),
			meta: toLcdText(view.meta),
			marquee: toLcdText(view.marquee),
			source: view.source
		};
		this.#setSource(view.source);
		if (!this.running) this.draw();
	}

	/** @param {boolean} running */
	setRunning(running) {
		if (running === this.running) return;
		this.running = running;
		cancelAnimationFrame(this.frame);
		if (running) {
			this.#playVideo();
			this.frame = requestAnimationFrame(this.#tick);
		} else {
			this.video.pause();
			this.draw();
		}
	}

	draw() {
		this.#compose(performance.now());
		this.#paint();
	}

	/** Sizes the canvas so each dot lands on whole device pixels and the matrix spans the glass. */
	resize() {
		const host = this.canvas.parentElement;
		if (!host) return;
		const ratio = window.devicePixelRatio || 1;
		const width = host.clientWidth * ratio;
		const cell = Math.max(2, Math.floor(width / LCD_W));
		const columns = Math.max(LCD_W, Math.floor(width / cell));
		if (cell === this.cell && columns === this.columns) return;
		this.cell = cell;
		this.gap = cell >= 3 ? 1 : 0;
		this.columns = columns;
		this.offset = Math.floor((columns - LCD_W) / 2);
		this.canvas.width = columns * cell;
		this.canvas.height = LCD_H * cell;
		this.canvas.style.width = `${(columns * cell) / ratio}px`;
		this.canvas.style.height = `${(LCD_H * cell) / ratio}px`;
		this.image = this.context.createImageData(this.canvas.width, this.canvas.height);
		this.pixels = new Uint32Array(this.image.data.buffer);
		this.pixels.fill(GAP);
		const dot = cell - this.gap;
		const stride = columns * cell;
		for (let y = 0; y < LCD_H; y++) {
			for (let x = 0; x < columns; x++) {
				const row = y * cell * stride + x * cell;
				for (let dy = 0; dy < dot; dy++) this.pixels.fill(DOTS[OFF], row + dy * stride, row + dy * stride + dot);
			}
		}
		this.context.putImageData(this.image, 0, 0);
		this.painted.fill(OFF);
		this.draw();
	}

	destroy() {
		cancelAnimationFrame(this.frame);
		this.running = false;
		this.observer.disconnect();
		document.removeEventListener('visibilitychange', this.#onVisibility);
		this.video.removeEventListener('loadeddata', this.#onFrame);
		this.video.pause();
		this.video.removeAttribute('src');
		this.video.load();
	}

	#tick = (/** @type {number} */ now) => {
		this.frame = requestAnimationFrame(this.#tick);
		if (now - this.last < 1000 / FPS - 2) return;
		this.last = now;
		this.#compose(now);
		this.#paint();
	};

	#onFrame = () => {
		if (!this.running) this.draw();
	};

	#onVisibility = () => {
		if (document.hidden) this.video.pause();
		else if (this.running) this.#playVideo();
	};

	#playVideo() {
		if (this.view.source?.kind === 'video') this.video.play().catch(() => {});
	}

	#videoReady() {
		return this.view.source?.kind === 'video' && this.video.readyState >= 2 && this.video.videoWidth > 0;
	}

	/** @param {LcdSource | null} source */
	#setSource(source) {
		const key = source ? JSON.stringify(source) : '';
		if (key === this.sourceKey) return;
		this.sourceKey = key;
		this.since = performance.now();
		this.luma = null;
		this.failed = false;
		this.video.pause();
		if (source?.kind === 'video') {
			if (source.poster) this.#loadImage(source.poster, key, false);
			this.video.src = source.src;
			if (this.running) this.#playVideo();
			return;
		}
		this.video.removeAttribute('src');
		this.video.load();
		if (source?.kind === 'image') this.#loadImage(source.src, key, true);
	}

	/** @param {string} src @param {string} key @param {boolean} required a failure falls back to the film glyph */
	#loadImage(src, key, required) {
		const cached = this.cache.get(src);
		if (cached) {
			this.luma = cached;
			return;
		}
		const image = new Image();
		if (/^https?:/.test(src)) image.crossOrigin = 'anonymous';
		image.onload = () => {
			if (key !== this.sourceKey) return;
			try {
				const luma = this.#sample(image, image.naturalWidth, image.naturalHeight);
				this.cache.set(src, luma);
				if (!this.#videoReady()) this.luma = luma;
			} catch {
				if (required) this.failed = true;
			}
			if (!this.running) this.draw();
		};
		image.onerror = () => {
			if (key !== this.sourceKey || !required) return;
			this.failed = true;
			if (!this.running) this.draw();
		};
		image.src = src;
	}

	/** Cover-crops a source into the media area and returns its levelled luminance. @param {CanvasImageSource} source @param {number} width @param {number} height */
	#sample(source, width, height) {
		const { w, h } = MEDIA;
		const scale = Math.max(w / width, h / height);
		const cropW = w / scale;
		const cropH = h / scale;
		const context = this.scratch;
		context.fillStyle = '#fff';
		context.fillRect(0, 0, w, h);
		context.imageSmoothingQuality = 'high';
		context.drawImage(source, (width - cropW) / 2, (height - cropH) / 2, cropW, cropH, 0, 0, w, h);
		return levels(context.getImageData(0, 0, w, h).data);
	}

	/** @param {number} now */
	#drawMedia(now) {
		const source = this.view.source;
		if (!source) return;
		const t = now - this.since;
		const still = !this.running;
		if (source.kind === 'glyph' || this.failed) {
			const value = source.kind === 'glyph' ? (source.value ?? '') : '';
			GLYPHS[source.kind === 'glyph' ? source.glyph : 'film'](this.raster, MEDIA.x, MEDIA.y, t, still, value);
			return;
		}
		if (this.#videoReady() && (this.running || !this.luma)) {
			try {
				this.luma = this.#sample(this.video, this.video.videoWidth, this.video.videoHeight);
			} catch {
				this.failed = true;
			}
		}
		if (this.luma) dither(this.raster, this.luma, MEDIA);
		else loading(this.raster, MEDIA, t, still);
	}

	/** @param {number} now */
	#compose(now) {
		const r = this.raster;
		const { header, title, meta, marquee } = this.view;
		r.clear();

		r.text(header.left, 3, 2, ON);
		r.text(header.right, LCD_W - 3 - textWidth(header.right), 2, ON);
		dotted(r, 11);

		r.clip = MEDIA;
		this.#drawMedia(now);
		r.clip = null;
		brackets(r, MEDIA);

		const titleLines = wrap(title, TEXT_CHARS, 3);
		titleLines.forEach((line, i) => r.text(line, TEXT_X, 16 + i * 10, ON));
		const metaTop = 21 + titleLines.length * 10;
		wrap(meta, TEXT_CHARS, Math.floor((80 - metaTop) / 9)).forEach((line, i) =>
			r.text(line, TEXT_X, metaTop + i * 9, DIM)
		);

		dotted(r, 82);
		if (marquee) {
			const tape = `${marquee}   ·   `;
			const width = tape.length * 6;
			const scrolled = this.running ? Math.max(0, Math.floor((now - this.since - 1200) / (1000 / FPS))) : 0;
			const offset = scrolled % width;
			r.clip = MARQUEE;
			r.text(tape, MARQUEE.x - offset, MARQUEE.y + 1, ON);
			if (this.running) r.text(tape, MARQUEE.x - offset + width, MARQUEE.y + 1, ON);
			r.clip = null;
		}
	}

	#paint() {
		const { pixels, image, cell, gap, raster, painted, offset } = this;
		if (!pixels || !image) return;
		const dot = cell - gap;
		const stride = this.columns * cell;
		let minX = LCD_W;
		let minY = LCD_H;
		let maxX = -1;
		let maxY = -1;
		for (let y = 0; y < LCD_H; y++) {
			for (let x = 0; x < LCD_W; x++) {
				const i = y * LCD_W + x;
				const value = raster.dots[i];
				if (painted[i] === value) continue;
				painted[i] = value;
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
				const color = DOTS[value];
				for (let dy = 0, row = y * cell * stride + (x + offset) * cell; dy < dot; dy++, row += stride) {
					pixels.fill(color, row, row + dot);
				}
			}
		}
		if (maxX < 0) return;
		this.context.putImageData(
			image,
			0,
			0,
			(minX + offset) * cell,
			minY * cell,
			(maxX - minX + 1) * cell,
			(maxY - minY + 1) * cell
		);
	}
}
