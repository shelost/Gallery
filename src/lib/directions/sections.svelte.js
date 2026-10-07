import { prefersReducedMotion } from 'svelte/motion';

/** @typedef {{ id: string, label: string, numeral?: string }} Item */

/** How far below the top of the viewport a section counts as reached. */
const REACH = 200;
/** How fast a glide closes in, per second: it lands in about half a second, however far. */
const STIFFNESS = 13;
/** Events that mean the reader is taking the page back. */
const TAKEOVERS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

/** How far the page can scroll. */
const bottom = () => document.documentElement.scrollHeight - window.innerHeight;

/**
 * The page's sections as something to steer by, shared by the section bar and the click wheel:
 * which one the reader has reached, a glide that flies the page to any of them and changes course
 * mid-flight without a jolt, and a run that keeps the page scrolling by itself. Either lets go the
 * moment the reader scrolls, taps or types anywhere outside the controls marked `data-steer`.
 */
export class Sections {
	/** The section reached, or -1 above the first. A glide holds its destination until it lands. */
	active = $state(-1);
	/** How far down the page the reader is, from 0 to 1. */
	progress = $state(0);
	/** Pixels a second the page is running at by itself, down for positive, or 0. */
	speed = $state(0);

	/** @type {() => Item[]} */
	#items;
	/** @type {'still' | 'glide' | 'run'} */
	#mode = 'still';
	#y = 0;
	#velocity = 0;
	#target = 0;
	/** How much faster a run gets each second, up to `#limit`. */
	#gain = 0;
	#limit = Infinity;
	/** The speed to run on at once a glide lands, or 0. */
	#resume = 0;
	#frame = 0;
	#then = 0;

	/** @param {() => Item[]} items */
	constructor(items) {
		this.#items = items;
	}

	get items() {
		return this.#items();
	}

	get running() {
		return this.speed !== 0;
	}

	/** The last section whose top has passed `REACH`, or -1; at the very bottom, the last one. */
	reached() {
		const items = this.items;
		if (window.scrollY > 0 && window.scrollY >= bottom() - 2) return items.length - 1;
		for (let i = items.length - 1; i >= 0; i--) {
			const section = document.getElementById(items[i].id);
			if (section && section.getBoundingClientRect().top <= REACH) return i;
		}
		return -1;
	}

	track = () => {
		const end = bottom();
		this.progress = end > 0 ? Math.min(1, Math.max(0, window.scrollY / end)) : 0;
		if (this.#mode !== 'glide') this.active = this.reached();
	};

	/**
	 * Flies the page to a section, or to the top for -1. Asked again mid-flight, it changes course
	 * without losing speed; with `resume`, a run under way picks back up once it lands.
	 * @param {number} i
	 * @param {{ resume?: boolean }} [options]
	 */
	go(i, { resume = false } = {}) {
		const speed = this.speed;
		this.active = i;
		this.speed = 0;
		this.#resume = resume ? speed : 0;
		const target = this.#top(i);
		if (prefersReducedMotion.current) {
			this.#halt();
			window.scrollTo({ top: target, behavior: 'instant' });
			if (this.#resume) this.run(this.#resume);
			return;
		}
		if (this.#mode !== 'glide') this.#velocity = speed;
		this.#target = target;
		this.#mode = 'glide';
		this.#start();
	}

	/**
	 * A section on or back; false at either end.
	 * @param {number} way
	 * @param {{ resume?: boolean }} [options]
	 */
	step(way, options) {
		const next = Math.max(-1, Math.min(this.items.length - 1, this.active + way));
		if (next === this.active) return false;
		this.go(next, options);
		return true;
	}

	/**
	 * Keeps the page scrolling by itself at `speed` pixels a second, gaining `gain` a second up
	 * to `limit`, until it reaches the end it's heading for.
	 * @param {number} speed
	 * @param {{ gain?: number, limit?: number }} [options]
	 */
	run(speed, { gain = 0, limit = Infinity } = {}) {
		this.speed = speed;
		this.#gain = gain;
		this.#limit = limit;
		this.#resume = 0;
		this.#mode = 'run';
		this.#start();
	}

	/** Lets go of the page wherever it is. */
	stop() {
		this.#halt();
		this.speed = 0;
		this.#resume = 0;
		this.track();
	}

	/** Follows the scroll, and hands the page back when the reader takes it. Returns the teardown. */
	listen() {
		/** @param {Event} event */
		const takeover = (event) => {
			if (this.#mode === 'still') return;
			if (event.target instanceof Element && event.target.closest('[data-steer]')) return;
			this.stop();
		};
		window.addEventListener('scroll', this.track, { passive: true });
		for (const type of TAKEOVERS) window.addEventListener(type, takeover, { passive: true });
		this.track();
		return () => {
			window.removeEventListener('scroll', this.track);
			for (const type of TAKEOVERS) window.removeEventListener(type, takeover);
			this.#halt();
		};
	}

	/** Where the page scrolls to put a section at the top, short of its scroll margin. @param {number} i */
	#top(i) {
		const section = i < 0 ? null : document.getElementById(this.items[i]?.id ?? '');
		if (!section) return 0;
		const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
		return Math.max(0, Math.min(bottom(), section.getBoundingClientRect().top + window.scrollY - margin));
	}

	#start() {
		if (this.#frame) return;
		this.#y = window.scrollY;
		this.#then = performance.now();
		this.#frame = requestAnimationFrame(this.#tick);
	}

	#halt() {
		cancelAnimationFrame(this.#frame);
		this.#frame = 0;
		this.#mode = 'still';
	}

	/**
	 * A frame of motion. A glide is a critically damped spring, stepped exactly, so it neither
	 * overshoots nor jolts when its target moves; a run moves at its speed.
	 * @param {number} now
	 */
	#tick = (now) => {
		const dt = Math.max(0, Math.min(0.05, (now - this.#then) / 1000));
		this.#then = now;
		const end = bottom();
		let y = this.#y;
		if (this.#mode === 'glide') {
			const target = Math.min(this.#target, end);
			const offset = y - target;
			const decay = Math.exp(-STIFFNESS * dt);
			const pull = this.#velocity + STIFFNESS * offset;
			y = target + (offset + pull * dt) * decay;
			this.#velocity = (this.#velocity - STIFFNESS * pull * dt) * decay;
			if (Math.abs(y - target) < 0.5 && Math.abs(this.#velocity) < 20) {
				y = target;
				this.#mode = 'still';
				if (this.#resume) this.run(this.#resume);
			}
		} else if (this.#mode === 'run') {
			this.speed = Math.sign(this.speed) * Math.min(this.#limit, Math.abs(this.speed) + this.#gain * dt);
			y = Math.min(end, Math.max(0, y + this.speed * dt));
			if ((this.speed < 0 && y <= 0) || (this.speed > 0 && y >= end)) {
				this.#mode = 'still';
				this.speed = 0;
			}
		}
		this.#y = y;
		window.scrollTo({ top: y, behavior: 'instant' });
		this.#frame = this.#mode === 'still' ? 0 : requestAnimationFrame(this.#tick);
	};
}
