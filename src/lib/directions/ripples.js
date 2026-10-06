import { on } from 'svelte/events';
import { clamp, fitCanvas, hash, random } from './motion.js';

/**
 * An ARC grid that behaves like the koi pond's water: the cursor trails ripples through the
 * cells, a click marks a cell and sends a sanguine ring, and every few seconds one of the glyphs
 * stirs on its own. The class owns drawing and input, so RippleGrid.svelte only pushes props in.
 */

/** Target cell size and the gap between cells, in CSS pixels. */
const CELL = 22;
const GAP = 2;
const RIPPLE_MS = 1500;
/** How fast a ring travels, in cells per millisecond, and how many cells wide it is. */
const SPEED = 0.014;
const BAND = 1.25;
const MAX_RIPPLES = 10;
const GLYPH = 5;

/** 0 is water, 1 an ink cell, 2 a sanguine one. @typedef {0 | 1 | 2} Mark */
/** @typedef {{ x: number, y: number, born: number, strength: number, warm: boolean }} Ripple */

/** A left-right symmetric glyph, like an ARC object. @param {() => number} next @returns {boolean[]} */
function glyph(next) {
	const half = Math.ceil(GLYPH / 2);
	for (;;) {
		/** @type {boolean[]} */
		const cells = [];
		for (let y = 0; y < GLYPH; y++) {
			const left = Array.from({ length: half }, () => next() < 0.55);
			cells.push(...left, ...left.slice(0, GLYPH - half).reverse());
		}
		if (cells.filter(Boolean).length >= 9) return cells;
	}
}

export class RippleGrid {
	#canvas;
	#context;
	#colors = { paper: '#f6f4ef', cell: '#ece9e1', ink: '#1c1b18', accent: '#a8432b' };
	/** CSS size and pixel ratio of the canvas, kept by fitCanvas(). */
	#size = { width: 0, height: 0, ratio: 0 };
	#cols = 0;
	#rows = 0;
	#cell = CELL;
	#x0 = 0;
	#y0 = 0;
	/** @type {Uint8Array} */
	#marks = new Uint8Array(0);
	/** Cell indexes of each glyph, so a stir starts from inside one. @type {number[][]} */
	#glyphs = [];
	/** @type {Ripple[]} */
	#ripples = [];
	#last = -1;
	#running = false;
	#still = false;
	#dirty = false;
	#frame = 0;
	#next = 0;
	#random = random(23);
	#observer;
	#listeners;

	/** @param {HTMLCanvasElement} canvas */
	constructor(canvas) {
		this.#canvas = canvas;
		this.#context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
		const style = getComputedStyle(canvas);
		for (const [key, token] of /** @type {const} */ ([
			['paper', '--paper'],
			['cell', '--paper-2'],
			['ink', '--ink'],
			['accent', '--sanguine']
		])) {
			const value = style.getPropertyValue(token).trim();
			if (value) this.#colors[key] = value;
		}
		this.resize();

		this.#observer = new ResizeObserver(() => this.resize());
		this.#observer.observe(canvas);
		this.#listeners = [
			on(canvas, 'pointermove', this.#onmove),
			on(canvas, 'pointerleave', this.#onleave),
			on(canvas, 'click', this.#onclick)
		];
	}

	/**
	 * Animates while the grid is on screen. In still mode nothing ripples, but clicks still mark cells.
	 * @param {boolean} visible
	 * @param {boolean} still
	 */
	setMotion(visible, still) {
		const running = visible && !still;
		this.#still = still;
		if (still) this.#ripples = [];
		if (running !== this.#running) {
			this.#running = running;
			cancelAnimationFrame(this.#frame);
			if (running) {
				this.#next = performance.now() + 1200;
				this.#frame = requestAnimationFrame(this.#tick);
			}
		}
		if (!running) this.#draw(performance.now());
	}

	/** Stirs the same glyph every time for the same id. @param {string} id */
	pulse(id) {
		if (!this.#running || !this.#glyphs.length) return;
		const next = random(hash(id));
		const cells = this.#glyphs[Math.floor(next() * this.#glyphs.length)];
		this.#stir(cells[Math.floor(next() * cells.length)], 1);
	}

	resize() {
		const size = fitCanvas(this.#canvas, this.#context, this.#size);
		if (!size) return;

		const { width, height } = (this.#size = size);
		this.#cols = Math.max(GLYPH + 2, Math.floor(width / CELL));
		this.#rows = Math.max(GLYPH + 2, Math.floor(height / CELL));
		this.#cell = Math.floor(Math.min(width / this.#cols, height / this.#rows));
		this.#x0 = Math.round((width - this.#cols * this.#cell + GAP) / 2);
		this.#y0 = Math.round((height - this.#rows * this.#cell + GAP) / 2);
		this.#compose();
		this.#ripples = [];
		this.#draw(performance.now());
	}

	destroy() {
		cancelAnimationFrame(this.#frame);
		this.#observer.disconnect();
		for (const off of this.#listeners) off();
	}

	/** Places a few glyphs with a cell of water around each, the same ones for the same grid. */
	#compose() {
		const cols = this.#cols;
		const rows = this.#rows;
		const next = random(cols * 131 + rows);
		const marks = new Uint8Array(cols * rows);
		const taken = new Uint8Array(cols * rows);
		const wanted = clamp(Math.round((cols * rows) / 90), 2, 6);
		this.#glyphs = [];

		for (let attempt = 0; attempt < 60 && this.#glyphs.length < wanted; attempt++) {
			const left = 1 + Math.floor(next() * (cols - GLYPH - 1));
			const top = 1 + Math.floor(next() * (rows - GLYPH - 1));
			let free = true;
			for (let y = top - 1; y <= top + GLYPH && free; y++) {
				for (let x = left - 1; x <= left + GLYPH; x++) {
					if (taken[clamp(y, 0, rows - 1) * cols + clamp(x, 0, cols - 1)]) free = false;
				}
			}
			if (!free) continue;

			const mark = this.#glyphs.length === 0 ? 2 : 1;
			/** @type {number[]} */
			const cells = [];
			glyph(next).forEach((filled, i) => {
				const index = (top + Math.floor(i / GLYPH)) * cols + left + (i % GLYPH);
				taken[index] = 1;
				if (!filled) return;
				marks[index] = mark;
				cells.push(index);
			});
			this.#glyphs.push(cells);
		}
		this.#marks = marks;
	}

	/** @param {number} index @param {number} strength @param {boolean} [warm] */
	#stir(index, strength, warm = false) {
		if (this.#still) return;
		this.#ripples.push({
			x: index % this.#cols,
			y: Math.floor(index / this.#cols),
			born: performance.now(),
			strength,
			warm
		});
		if (this.#ripples.length > MAX_RIPPLES) this.#ripples.shift();
		this.#dirty = true;
	}

	/** @param {number} now */
	#tick = (now) => {
		if (now >= this.#next && this.#glyphs.length) {
			const cells = this.#glyphs[Math.floor(this.#random() * this.#glyphs.length)];
			this.#stir(cells[Math.floor(this.#random() * cells.length)], 0.55);
			this.#next = now + 2600 + this.#random() * 3200;
		}
		this.#ripples = this.#ripples.filter((ripple) => now - ripple.born < RIPPLE_MS);
		if (this.#dirty) {
			this.#draw(now);
			this.#dirty = this.#ripples.length > 0;
		}
		this.#frame = requestAnimationFrame(this.#tick);
	};

	/** Water cells darken as a ring passes; marked cells shrink a little, as if lifted. @param {number} now */
	#draw(now) {
		const context = this.#context;
		const { paper, cell, ink, accent } = this.#colors;
		const size = this.#cell;
		const inner = size - GAP;
		context.fillStyle = paper;
		context.fillRect(0, 0, this.#size.width, this.#size.height);

		for (let row = 0; row < this.#rows; row++) {
			for (let col = 0; col < this.#cols; col++) {
				const index = row * this.#cols + col;
				const mark = this.#marks[index];
				let wave = 0;
				let warm = 0;
				for (const ripple of this.#ripples) {
					const age = now - ripple.born;
					const ring = Math.abs(Math.hypot(col - ripple.x, row - ripple.y) - age * SPEED);
					if (ring >= BAND) continue;
					const amount = (1 - ring / BAND) * (1 - age / RIPPLE_MS) * ripple.strength;
					wave += amount;
					if (ripple.warm) warm += amount;
				}
				wave = Math.min(1, wave);

				const x = this.#x0 + col * size;
				const y = this.#y0 + row * size;
				if (mark) {
					const lift = wave * inner * 0.14;
					context.fillStyle = mark === 2 ? accent : ink;
					context.fillRect(x + lift, y + lift, inner - lift * 2, inner - lift * 2);
					continue;
				}
				context.fillStyle = cell;
				context.fillRect(x, y, inner, inner);
				if (wave > 0.02) {
					context.globalAlpha = wave * 0.42;
					context.fillStyle = warm > wave / 2 ? accent : ink;
					context.fillRect(x, y, inner, inner);
					context.globalAlpha = 1;
				}
			}
		}
	}

	/** The cell under a pointer event, or -1 between the grid and the frame. @param {MouseEvent} event */
	#cellAt(event) {
		const rect = this.#canvas.getBoundingClientRect();
		const col = Math.floor((event.clientX - rect.left - this.#x0) / this.#cell);
		const row = Math.floor((event.clientY - rect.top - this.#y0) / this.#cell);
		if (col < 0 || row < 0 || col >= this.#cols || row >= this.#rows) return -1;
		return row * this.#cols + col;
	}

	/** @param {PointerEvent} event */
	#onmove = (event) => {
		const index = this.#cellAt(event);
		if (index === this.#last) return;
		this.#last = index;
		if (index >= 0) this.#stir(index, 0.4);
	};

	#onleave = () => {
		this.#last = -1;
	};

	/** Marks or clears a water cell, the way Arcaide annotates one. @param {MouseEvent} event */
	#onclick = (event) => {
		const index = this.#cellAt(event);
		if (index < 0) return;
		const mark = this.#marks[index];
		if (mark !== 2) this.#marks[index] = mark ? 0 : 1;
		this.#stir(index, 1, true);
		if (!this.#running) this.#draw(performance.now());
	};
}
