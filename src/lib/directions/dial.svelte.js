import { prefersReducedMotion } from 'svelte/motion';
import { clamp, springTo } from './motion.js';

/** How long a flick carries on, in seconds: it lands on the detent this much of its speed reaches. */
const COAST = 0.55;
/** How quickly it settles after a slow release, and the quickest it settles after any, per second. */
const SNAP = 12;
/** The slowest it settles after a flick, per second, so a hard one doesn't crawl. */
const LAZY = 2.5;
/** How quickly it turns to a detent it's sent to, per second. */
const AIM = 9;
/** The fastest a flick spins it, in radians a second. */
const LIMIT = 18;
/** How much of the end of a drag counts towards a flick, in milliseconds. */
const WINDOW = 90;

/** @param {number} i @param {number} n */
const wrap = (i, n) => ((i % n) + n) % n;

/**
 * A dial with evenly spaced detents, like a game-show wheel. It follows a drag exactly, carries on
 * after a flick until it settles on a detent, and turns the shortest way to one it's sent to.
 * Detent `i` is at the top once it has turned `i` detents anticlockwise, so pushing the top of it
 * leftwards counts up.
 */
export class Dial {
	/** How far it has turned, in radians clockwise. */
	angle = $state(0);
	/** Which way the top is moving: 1 leftwards, counting up; -1 rightwards; 0 at rest. */
	way = $state(0);

	/** @type {() => number} */
	#count;
	/** @type {(held: boolean, quiet: boolean) => void} */
	#oncross;
	/** @type {'still' | 'held' | 'spin'} */
	#mode = 'still';
	/** Whether the spin under way is the dial following along, rather than being turned. */
	#quiet = false;
	/** A detent to follow to once the spin under way is over, or -1. */
	#pending = -1;
	#velocity = 0;
	#target = 0;
	#rate = SNAP;
	/** The drag's recent angles: one from before `WINDOW`, then every one since. @type {{ t: number, angle: number }[]} */
	#trail = [];
	#frame = 0;
	#then = 0;

	/**
	 * @param {() => number} count how many detents there are
	 * @param {(held: boolean, quiet: boolean) => void} oncross called whenever a new detent comes
	 *   to the top: `held` while a finger turns it, `quiet` while it's only following along
	 */
	constructor(count, oncross) {
		this.#count = count;
		this.#oncross = oncross;
	}

	/** The width of a detent, in radians. */
	get step() {
		return (2 * Math.PI) / this.#count();
	}

	/** The detent at the top, from 0. */
	get selected() {
		return wrap(Math.round(-this.angle / this.step), this.#count());
	}

	/** How far the top is from the middle of its detent, from -0.5 to 0.5 of one; pegs sit at ±0.5. */
	get phase() {
		const turned = -this.angle / this.step;
		return turned - Math.round(turned);
	}

	/** Takes hold of it, stopping any spin. */
	grab() {
		this.#halt();
		this.#mode = 'held';
		this.#pending = -1;
		this.#trail = [{ t: performance.now(), angle: this.angle }];
	}

	/** Turns it while it's held. @param {number} delta radians clockwise */
	turn(delta) {
		if (this.#mode !== 'held') return;
		const t = performance.now();
		this.#trail.push({ t, angle: this.angle + delta });
		this.#prune(t);
		this.#move(this.angle + delta, true, false);
	}

	/**
	 * Lets go. A flick carries on to the detent its speed would reach, slowing from the moment
	 * it's let go; a slow release settles on the nearest. Returns the detent it will land on.
	 */
	release() {
		if (this.#mode !== 'held') return this.selected;
		const t = performance.now();
		this.#prune(t);
		const [from] = this.#trail;
		const span = (t - from.t) / 1000;
		const velocity = span > 0 ? clamp((this.angle - from.angle) / span, -LIMIT, LIMIT) : 0;
		const landing = Math.round(-(this.angle + velocity * COAST) / this.step);
		const target = -landing * this.step;
		const offset = this.angle - target;
		const rate = velocity * offset < 0 ? clamp((-2 * velocity) / offset, LAZY, SNAP) : SNAP;
		this.#spin(target, velocity, rate, false);
		return wrap(landing, this.#count());
	}

	/**
	 * Turns to detent `i` the shortest way. A quiet turn only follows along: while the dial is
	 * held, or still spinning from being turned, it waits until that's over.
	 * @param {number} i
	 * @param {{ quiet?: boolean }} [options]
	 */
	aim(i, { quiet = false } = {}) {
		if (quiet && (this.#mode === 'held' || (this.#mode === 'spin' && !this.#quiet))) {
			this.#pending = i;
			return;
		}
		const n = this.#count();
		const here = Math.round(-this.angle / this.step);
		let delta = wrap(i - here, n);
		if (delta > n / 2) delta -= n;
		this.#spin(-(here + delta) * this.step, this.#mode === 'spin' ? this.#velocity : 0, AIM, quiet);
	}

	/** Puts it on detent `i` at once. @param {number} i */
	place(i) {
		this.#halt();
		this.#pending = -1;
		this.angle = -i * this.step;
		this.way = 0;
	}

	dispose() {
		this.#halt();
	}

	/** Drops all but one of the drag's angles from before `WINDOW`. @param {number} t */
	#prune(t) {
		while (this.#trail.length > 1 && t - this.#trail[1].t > WINDOW) this.#trail.shift();
	}

	/**
	 * @param {number} target
	 * @param {number} velocity
	 * @param {number} rate
	 * @param {boolean} quiet
	 */
	#spin(target, velocity, rate, quiet) {
		this.#mode = 'spin';
		this.#target = target;
		this.#velocity = velocity;
		this.#rate = rate;
		this.#quiet = quiet;
		if (prefersReducedMotion.current) return this.#settle();
		if (this.#frame) return;
		this.#then = performance.now();
		this.#frame = requestAnimationFrame(this.#tick);
	}

	/** @param {number} now */
	#tick = (now) => {
		const dt = clamp((now - this.#then) / 1000, 0, 0.05);
		this.#then = now;
		const [angle, velocity] = springTo(this.angle, this.#velocity, this.#target, this.#rate, dt);
		this.#velocity = velocity;
		if (Math.abs(angle - this.#target) < 2e-3 && Math.abs(velocity) < 2e-2) return this.#settle();
		this.#move(angle, false, this.#quiet);
		this.#frame = requestAnimationFrame(this.#tick);
	};

	/** Comes to rest on the target, then follows to wherever it was asked to while it was busy. */
	#settle() {
		this.#move(this.#target, false, this.#quiet);
		this.#halt();
		this.way = 0;
		this.angle -= 2 * Math.PI * Math.round(this.angle / (2 * Math.PI));
		const pending = this.#pending;
		this.#pending = -1;
		if (pending >= 0 && pending !== this.selected) this.aim(pending, { quiet: true });
	}

	/**
	 * @param {number} angle
	 * @param {boolean} held
	 * @param {boolean} quiet
	 */
	#move(angle, held, quiet) {
		const before = Math.round(-this.angle / this.step);
		if (angle !== this.angle) this.way = angle < this.angle ? 1 : -1;
		this.angle = angle;
		if (Math.round(-angle / this.step) !== before) this.#oncross(held, quiet);
	}

	#halt() {
		cancelAnimationFrame(this.#frame);
		this.#frame = 0;
		this.#mode = 'still';
	}
}
