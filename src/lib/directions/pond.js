import { on } from 'svelte/events';
import { clamp, fitCanvas, hash, random } from './motion.js';

/**
 * A koi pond drawn on a 2D canvas. Each koi carries one work, and featured works swim in
 * vermilion. The class owns the simulation, the drawing, and pointer input, so KoiPond.svelte
 * only pushes props into it.
 */

/** @typedef {'dawn' | 'day' | 'dusk' | 'night'} PondTime */
/**
 * @typedef {{
 *   water: string,
 *   koi: string,
 *   pale: string,
 *   ink: string,
 *   ring: string,
 *   shadow: string,
 *   food: string
 * }} PondPalette
 */
/** @typedef {{ x: number, y: number }} Point */
/** @typedef {{ x: number, y: number, below: boolean }} Anchor */
/**
 * @typedef {{
 *   id: string,
 *   color: 'koi' | 'pale' | 'ink',
 *   unit: number,
 *   size: number,
 *   x: number,
 *   y: number,
 *   angle: number,
 *   turn: number,
 *   speed: number,
 *   base: number,
 *   phase: number,
 *   lift: number,
 *   spine: Point[]
 * }} Koi
 */
/**
 * @typedef {{
 *   koi: { id: string, featured?: boolean }[],
 *   onhover: (id: string | null) => void,
 *   onpick: (id: string) => void,
 *   onframe: (anchor: Anchor | null) => void
 * }} PondOptions
 */

/** @type {Record<PondTime, PondPalette>} */
export const PALETTES = {
	dawn: {
		water: '#eee7e2',
		koi: '#d65a35',
		pale: '#fffbf7',
		ink: '#2d2a2a',
		ring: 'rgba(70, 50, 48, 0.3)',
		shadow: 'rgba(80, 50, 45, 0.12)',
		food: '#7a6656'
	},
	day: {
		water: '#e5e9e3',
		koi: '#d4532c',
		pale: '#fcfbf8',
		ink: '#2a2b2a',
		ring: 'rgba(36, 44, 40, 0.3)',
		shadow: 'rgba(30, 46, 40, 0.13)',
		food: '#6f624f'
	},
	dusk: {
		water: '#e8ddcd',
		koi: '#c94b26',
		pale: '#fff9ef',
		ink: '#2b261f',
		ring: 'rgba(66, 48, 26, 0.32)',
		shadow: 'rgba(70, 45, 20, 0.14)',
		food: '#5e4c35'
	},
	night: {
		water: '#1b2328',
		koi: '#e2643d',
		pale: '#e9ece8',
		ink: '#5f6d74',
		ring: 'rgba(232, 236, 230, 0.32)',
		shadow: 'rgba(0, 0, 0, 0.42)',
		food: '#cfc5ad'
	}
};

/** The pond inked on paper, for a comic panel. @type {PondPalette} */
export const INK = {
	water: '#f1eee7',
	koi: '#b0452a',
	pale: '#fdfcf9',
	ink: '#262521',
	ring: 'rgba(28, 27, 24, 0.34)',
	shadow: 'rgba(28, 27, 24, 0.12)',
	food: '#3a3732'
};

/** The palette for an hour on the visitor's clock. @param {number} hour @returns {PondTime} */
export function timeOfDay(hour) {
	if (hour >= 5 && hour < 9) return 'dawn';
	if (hour >= 9 && hour < 17) return 'day';
	if (hour >= 17 && hour < 20) return 'dusk';
	return 'night';
}

/** Half-widths along the spine, head to tail, as a share of the koi's size. */
const PROFILE = [0.62, 0.86, 1, 0.98, 0.9, 0.78, 0.64, 0.5, 0.36, 0.24];
const RIPPLE_MS = 1100;
const FOOD_MS = 7000;
const FRAME_MS = 1000 / 60;

/** Shortest signed turn from one angle to another. @param {number} target @param {number} current */
function angleDelta(target, current) {
	let delta = target - current;
	while (delta > Math.PI) delta -= Math.PI * 2;
	while (delta < -Math.PI) delta += Math.PI * 2;
	return delta;
}

/**
 * Adds the pectoral fins and the tail to the current path. Every subpath winds clockwise,
 * so fins and body can share one fill without cutting holes.
 * @param {CanvasRenderingContext2D} context
 * @param {Koi} koi
 * @param {number} now
 */
function traceFins(context, koi, now) {
	const { spine, size } = koi;
	const root = spine[2];
	const facing = Math.atan2(spine[1].y - root.y, spine[1].x - root.x);
	for (const side of [1, -1]) {
		const angle = facing + side * 2.1;
		const cx = root.x + Math.cos(angle) * size * 0.5;
		const cy = root.y + Math.sin(angle) * size * 0.5;
		context.moveTo(cx + Math.cos(angle) * size * 0.5, cy + Math.sin(angle) * size * 0.5);
		context.ellipse(cx, cy, size * 0.5, size * 0.2, angle, 0, Math.PI * 2);
	}

	const tail = spine[spine.length - 1];
	const before = spine[spine.length - 2];
	const sweep = Math.sin(now * 0.008 * (koi.speed / koi.base) + koi.phase) * 0.35;
	context.save();
	context.translate(tail.x, tail.y);
	context.rotate(Math.atan2(tail.y - before.y, tail.x - before.x) + sweep);
	context.moveTo(-1, 0);
	context.quadraticCurveTo(size * 0.5, -size * 0.55, size * 1.05, -size * 0.45);
	context.lineTo(size * 0.72, 0);
	context.lineTo(size * 1.05, size * 0.45);
	context.quadraticCurveTo(size * 0.5, size * 0.55, -1, 0);
	context.closePath();
	context.restore();
}

/**
 * Adds the body outline, smoothed through the spine, and the rounded head to the current path.
 * @param {CanvasRenderingContext2D} context
 * @param {Koi} koi
 */
function traceBody(context, koi) {
	const { spine, size } = koi;
	const count = spine.length;
	/** @type {Point[]} */
	const left = [];
	/** @type {Point[]} */
	const right = [];
	for (let i = 0; i < count; i++) {
		const ahead = spine[i === 0 ? 0 : i - 1];
		const behind = spine[i === 0 ? 1 : i];
		const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
		const half = PROFILE[i] * size * 0.6;
		const nx = -Math.sin(angle) * half;
		const ny = Math.cos(angle) * half;
		left.push({ x: spine[i].x + nx, y: spine[i].y + ny });
		right.push({ x: spine[i].x - nx, y: spine[i].y - ny });
	}

	context.moveTo(left[0].x, left[0].y);
	for (let i = 1; i < count - 1; i++) {
		context.quadraticCurveTo(left[i].x, left[i].y, (left[i].x + left[i + 1].x) / 2, (left[i].y + left[i + 1].y) / 2);
	}
	context.lineTo(left[count - 1].x, left[count - 1].y);
	context.lineTo(right[count - 1].x, right[count - 1].y);
	for (let i = count - 2; i > 0; i--) {
		context.quadraticCurveTo(right[i].x, right[i].y, (right[i].x + right[i - 1].x) / 2, (right[i].y + right[i - 1].y) / 2);
	}
	context.lineTo(right[0].x, right[0].y);
	context.closePath();

	const head = spine[0];
	const radius = PROFILE[0] * size * 0.6;
	context.moveTo(head.x + radius, head.y);
	context.arc(head.x, head.y, radius, 0, Math.PI * 2);
}

export class Pond {
	#canvas;
	#context;
	#options;
	/** @type {Koi[]} */
	#koi = [];
	/** @type {{ x: number, y: number, born: number, eaten: boolean }[]} */
	#food = [];
	/** @type {{ x: number, y: number, born: number, strength: number }[]} */
	#ripples = [];
	#palette = PALETTES.day;
	#random = random(11);
	/** CSS size and pixel ratio of the canvas, kept by fitCanvas(). */
	#size = { width: 0, height: 0, ratio: 0 };
	#scale = 1;
	#pointer = { x: 0, y: 0, inside: false, type: 'mouse' };
	/** @type {string | null} */
	#hovered = null;
	/** @type {string | null} */
	#focus = null;
	#running = false;
	#still = false;
	#frame = 0;
	#last = 0;
	#nextSurface = 0;
	#observer;
	#listeners;

	/** @param {HTMLCanvasElement} canvas @param {PondOptions} options */
	constructor(canvas, options) {
		this.#canvas = canvas;
		this.#context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
		this.#options = options;
		this.resize();

		let plain = 0;
		this.#koi = options.koi.map((koi, index) =>
			this.#spawn(koi.id, koi.featured ? 'koi' : plain++ % 2 ? 'ink' : 'pale', index)
		);
		this.#settle();

		this.#observer = new ResizeObserver(() => this.resize());
		this.#observer.observe(canvas);
		this.#listeners = [
			on(canvas, 'pointermove', this.#onmove),
			on(canvas, 'pointerdown', this.#ondown),
			on(canvas, 'pointerup', this.#onup),
			on(canvas, 'pointerleave', this.#onleave),
			on(canvas, 'pointercancel', this.#onleave),
			on(canvas, 'click', this.#onclick)
		];
	}

	/** @param {PondPalette} palette */
	setPalette(palette) {
		this.#palette = palette;
		if (!this.#running) this.#redraw();
	}

	/**
	 * Runs the simulation while the pond is on screen. In still mode the koi hold their poses,
	 * so the pond reads as a painting.
	 * @param {boolean} visible
	 * @param {boolean} still
	 */
	setMotion(visible, still) {
		const running = visible && !still;
		const changed = running !== this.#running || still !== this.#still;
		this.#still = still;
		if (still) {
			this.#food = [];
			this.#ripples = [];
		}
		if (!changed) return;
		this.#running = running;
		cancelAnimationFrame(this.#frame);
		if (running) {
			this.#last = performance.now();
			this.#frame = requestAnimationFrame(this.#tick);
		} else {
			this.#redraw();
		}
	}

	/** One koi slows, rises toward the surface, and carries the label. @param {string | null} id */
	setFocus(id) {
		this.#focus = id;
		if (this.#running) return;
		for (const koi of this.#koi) koi.lift = koi.id === id ? 1 : 0;
		this.#redraw();
	}

	/** Sends a ripple from a koi, or from a fixed spot for works that do not swim. @param {string} id */
	pulse(id) {
		if (this.#still) return;
		const koi = this.#find(id);
		if (koi) {
			this.#ripple(koi.x, koi.y, 1);
			return;
		}
		const next = random(hash(id));
		this.#ripple(this.#size.width * (0.15 + next() * 0.7), this.#size.height * (0.15 + next() * 0.7), 1);
	}

	resize() {
		const size = fitCanvas(this.#canvas, this.#context, this.#size);
		if (!size) return;

		const sx = this.#size.width ? size.width / this.#size.width : 1;
		const sy = this.#size.height ? size.height / this.#size.height : 1;
		this.#size = size;
		this.#scale = clamp(Math.min(size.width, size.height * 1.3) / 620, 0.65, 1.2);

		for (const koi of this.#koi) {
			koi.size = koi.unit * this.#scale;
			for (const point of koi.spine) {
				point.x *= sx;
				point.y *= sy;
			}
			koi.x = koi.spine[0].x;
			koi.y = koi.spine[0].y;
		}
		this.#redraw();
	}

	destroy() {
		cancelAnimationFrame(this.#frame);
		this.#observer.disconnect();
		for (const off of this.#listeners) off();
	}

	/** @param {string} id @param {Koi['color']} color @param {number} index @returns {Koi} */
	#spawn(id, color, index) {
		const unit = color === 'koi' ? 15 : 10.5 + (index % 3) * 0.9;
		const size = unit * this.#scale;
		const x = this.#size.width * (0.15 + this.#random() * 0.7);
		const y = this.#size.height * (0.15 + this.#random() * 0.7);
		const angle = this.#random() * Math.PI * 2;
		const base = 0.5 + this.#random() * 0.3;
		const segment = size * 0.62;
		return {
			id,
			color,
			unit,
			size,
			x,
			y,
			angle,
			turn: 0,
			speed: base,
			base,
			phase: this.#random() * Math.PI * 2,
			lift: 0,
			spine: PROFILE.map((_, j) => ({
				x: x - Math.cos(angle) * segment * j,
				y: y - Math.sin(angle) * segment * j
			}))
		};
	}

	/** Swims the koi for a few simulated seconds, so they start mid-stroke instead of in straight lines. */
	#settle() {
		for (let i = 0; i < 240; i++) this.#step(1, i * FRAME_MS);
		this.#ripples = [];
		this.#nextSurface = performance.now() + 3000;
	}

	/** @param {number} now */
	#tick = (now) => {
		const k = Math.min(3, (now - this.#last) / FRAME_MS);
		this.#last = now;
		this.#step(k, now);
		this.#draw(now);
		this.#frame = requestAnimationFrame(this.#tick);
	};

	/** Advances every koi by k frames' worth of motion. @param {number} k @param {number} now */
	#step(k, now) {
		const width = this.#size.width;
		const height = this.#size.height;
		const scale = this.#scale;
		const margin = 36 * scale;
		const pointer = this.#pointer;

		for (const koi of this.#koi) {
			const focused = koi.id === this.#focus;
			koi.turn = clamp(koi.turn + (this.#random() - 0.5) * 0.01 * k, -0.03, 0.03);
			let steer = koi.turn;

			if (koi.x < margin || koi.x > width - margin || koi.y < margin || koi.y > height - margin) {
				steer += angleDelta(Math.atan2(height / 2 - koi.y, width / 2 - koi.x), koi.angle) * 0.07;
			}

			let target = null;
			let best = 160 * scale;
			for (const pellet of this.#food) {
				if (pellet.eaten) continue;
				const distance = Math.hypot(pellet.x - koi.x, pellet.y - koi.y);
				if (distance < best) {
					best = distance;
					target = pellet;
				}
			}
			if (target) {
				steer += angleDelta(Math.atan2(target.y - koi.y, target.x - koi.x), koi.angle) * 0.09;
				koi.speed = Math.min(koi.base * 2, koi.speed + 0.03 * k);
				if (best < koi.size * 0.8) {
					target.eaten = true;
					this.#ripple(target.x, target.y, 0.6, now);
				}
			}

			if (pointer.inside && koi.id !== this.#hovered) {
				const distance = Math.hypot(koi.x - pointer.x, koi.y - pointer.y);
				if (distance < 60 * scale) {
					steer += angleDelta(Math.atan2(koi.y - pointer.y, koi.x - pointer.x), koi.angle) * 0.12;
					koi.speed = Math.min(koi.base * 2.6, koi.speed + 0.08 * k);
				}
			}

			for (const other of this.#koi) {
				if (other === koi) continue;
				const distance = Math.hypot(other.x - koi.x, other.y - koi.y);
				if (distance > 0 && distance < 22 * scale) {
					steer += angleDelta(Math.atan2(koi.y - other.y, koi.x - other.x), koi.angle) * 0.025;
				}
			}

			koi.angle += steer * k;
			const cruise = focused ? koi.base * 0.35 : koi.base;
			koi.speed += (cruise - koi.speed) * (focused ? 0.06 : 0.015) * k;
			koi.lift += ((focused ? 1 : 0) - koi.lift) * Math.min(1, 0.12 * k);

			const heading = koi.angle + Math.sin(now * 0.005 * (koi.speed / koi.base) + koi.phase) * 0.12;
			koi.x = clamp(koi.x + Math.cos(heading) * koi.speed * scale * k, 2, width - 2);
			koi.y = clamp(koi.y + Math.sin(heading) * koi.speed * scale * k, 2, height - 2);

			const segment = koi.size * 0.62;
			koi.spine[0].x = koi.x;
			koi.spine[0].y = koi.y;
			for (let i = 1; i < koi.spine.length; i++) {
				const ahead = koi.spine[i - 1];
				const point = koi.spine[i];
				const angle = Math.atan2(point.y - ahead.y, point.x - ahead.x);
				point.x = ahead.x + Math.cos(angle) * segment;
				point.y = ahead.y + Math.sin(angle) * segment;
			}
		}

		if (now >= this.#nextSurface && this.#koi.length) {
			const koi = this.#koi[Math.floor(this.#random() * this.#koi.length)];
			this.#ripple(koi.x, koi.y, 0.35, now);
			this.#nextSurface = now + 4000 + this.#random() * 4000;
		}
		this.#food = this.#food.filter((pellet) => !pellet.eaten && now - pellet.born < FOOD_MS);
		this.#ripples = this.#ripples.filter((ripple) => now - ripple.born < RIPPLE_MS);
	}

	/** Still mode always draws the same instant, so redraws never twitch the tails. */
	#redraw() {
		this.#draw(this.#still ? 0 : performance.now());
	}

	/** @param {number} now */
	#draw(now) {
		const context = this.#context;
		const palette = this.#palette;
		const scale = this.#scale;
		context.clearRect(0, 0, this.#size.width, this.#size.height);

		context.lineWidth = 1;
		context.strokeStyle = palette.ring;
		for (const ripple of this.#ripples) {
			const t = (now - ripple.born) / RIPPLE_MS;
			if (t < 0 || t >= 1) continue;
			const eased = 1 - (1 - t) ** 3;
			const reach = scale * (0.6 + ripple.strength * 0.4);
			const outer = (3 + eased * 42) * reach;
			const inner = (2 + eased * 24) * reach;
			context.globalAlpha = (1 - t) * 0.8;
			context.beginPath();
			context.arc(ripple.x, ripple.y, outer, 0, Math.PI * 2);
			context.moveTo(ripple.x + inner, ripple.y);
			context.arc(ripple.x, ripple.y, inner, 0, Math.PI * 2);
			context.stroke();
		}
		context.globalAlpha = 1;

		context.fillStyle = palette.food;
		for (const pellet of this.#food) {
			context.beginPath();
			context.arc(pellet.x, pellet.y, 1.6 * scale, 0, Math.PI * 2);
			context.fill();
		}

		context.fillStyle = palette.shadow;
		for (const koi of this.#koi) {
			const depth = (5 + koi.lift * 7) * scale;
			context.save();
			context.translate(depth * 0.5, depth);
			context.beginPath();
			traceFins(context, koi, now);
			traceBody(context, koi);
			context.fill();
			context.restore();
		}

		const focused = this.#find(this.#focus);
		for (const koi of this.#koi) if (koi !== focused) this.#paint(koi, now);
		if (focused) this.#paint(focused, now);

		this.#options.onframe(focused ? this.#anchor(focused) : null);
	}

	/**
	 * Just above the body, or just below it near the top edge, so the label never covers its own koi.
	 * @param {Koi} koi
	 * @returns {Anchor}
	 */
	#anchor(koi) {
		let top = Infinity;
		let bottom = -Infinity;
		for (const point of koi.spine) {
			top = Math.min(top, point.y);
			bottom = Math.max(bottom, point.y);
		}
		const gap = koi.size * 0.7;
		const below = top - gap < 48;
		return {
			x: clamp(koi.spine[4].x, 90, this.#size.width - 90),
			y: below ? bottom + gap : top - gap,
			below
		};
	}

	/** Translucent fins first, then the solid body. @param {Koi} koi @param {number} now */
	#paint(koi, now) {
		const context = this.#context;
		context.fillStyle = this.#palette[koi.color];
		context.globalAlpha = 0.72;
		context.beginPath();
		traceFins(context, koi, now);
		context.fill();
		context.globalAlpha = 1;
		context.beginPath();
		traceBody(context, koi);
		context.fill();
	}

	/** @param {number} x @param {number} y @param {number} strength @param {number} [now] */
	#ripple(x, y, strength, now = performance.now()) {
		this.#ripples.push({ x, y, born: now, strength });
	}

	/** @param {number} x @param {number} y */
	#feed(x, y) {
		if (this.#still) return;
		const now = performance.now();
		const spread = 16 * this.#scale;
		this.#ripple(x, y, 1, now);
		for (let i = 0; i < 3; i++) {
			this.#food.push({
				x: x + (this.#random() - 0.5) * spread,
				y: y + (this.#random() - 0.5) * spread,
				born: now,
				eaten: false
			});
		}
	}

	/** @param {string | null} id */
	#find(id) {
		return id ? this.#koi.find((koi) => koi.id === id) : undefined;
	}

	/** The koi under a point, measured along its head and body. @param {number} x @param {number} y */
	#pick(x, y) {
		/** @type {string | null} */
		let hit = null;
		let best = Infinity;
		for (const koi of this.#koi) {
			const reach = koi.size * 0.6 + 8;
			for (let i = 0; i < koi.spine.length - 2; i++) {
				const distance = Math.hypot(koi.spine[i].x - x, koi.spine[i].y - y);
				if (distance < reach && distance < best) {
					best = distance;
					hit = koi.id;
				}
			}
		}
		return hit;
	}

	/** @param {string | null} id */
	#hover(id) {
		if (id === this.#hovered) return;
		this.#hovered = id;
		this.#canvas.style.cursor = id ? 'pointer' : '';
		const koi = this.#find(id);
		if (koi && !this.#still) this.#ripple(koi.x, koi.y, 0.5);
		this.#options.onhover(id);
	}

	/** @param {MouseEvent} event */
	#locate(event) {
		const rect = this.#canvas.getBoundingClientRect();
		this.#pointer.x = event.clientX - rect.left;
		this.#pointer.y = event.clientY - rect.top;
	}

	/** @param {PointerEvent} event */
	#onmove = (event) => {
		this.#locate(event);
		this.#pointer.type = event.pointerType;
		this.#pointer.inside = event.pointerType === 'mouse' || event.buttons > 0;
		if (event.pointerType === 'mouse') this.#hover(this.#pick(this.#pointer.x, this.#pointer.y));
	};

	/** @param {PointerEvent} event */
	#ondown = (event) => {
		this.#locate(event);
		this.#pointer.type = event.pointerType;
		this.#pointer.inside = true;
	};

	/** @param {PointerEvent} event */
	#onup = (event) => {
		if (event.pointerType !== 'mouse') this.#pointer.inside = false;
	};

	#onleave = () => {
		this.#pointer.inside = false;
		if (this.#pointer.type === 'mouse') this.#hover(null);
	};

	/** On touch, the first tap on a koi shows its label and the second opens it. @param {MouseEvent} event */
	#onclick = (event) => {
		this.#locate(event);
		const { x, y, type } = this.#pointer;
		const id = this.#pick(x, y);
		if (id && (type === 'mouse' || id === this.#hovered)) {
			this.#options.onpick(id);
		} else if (id) {
			this.#hover(id);
		} else {
			if (type !== 'mouse') this.#hover(null);
			this.#feed(x, y);
		}
	};
}
