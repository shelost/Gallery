import { prefersReducedMotion } from 'svelte/motion';
import { clamp, springTo } from './motion.js';

/** @typedef {{ id: string, label: string, numeral?: string }} Item */

/** How far below where a glide parks it a section's top can be and still count as reached. */
const REACH = 80;
/** How fast a glide closes in, per second: it lands in about half a second, however far. */
const STIFFNESS = 13;
/** Events that mean the reader is taking the page back. */
const TAKEOVERS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

/** How far the page can scroll. */
const bottom = () => document.documentElement.scrollHeight - window.innerHeight;

/**
 * The page's sections as something to steer by, shared by the section bar and the wheel: which
 * one the reader has reached, and a glide that flies the page to any of them and changes course
 * mid-flight without a jolt. A glide lets go the moment the reader scrolls, taps or types
 * anywhere outside the controls marked `data-steer`.
 */
export class Sections {
	/** The section reached, or -1 above the first. A glide holds its destination until it lands. */
	active = $state(-1);

	/** @type {() => Item[]} */
	#items;
	/**
	 * Where the last glide parked the page, and for which section. Until the page moves, that
	 * section stands, even where a short one leaves the next one's top in reach too.
	 * @type {{ y: number, i: number } | null}
	 */
	#parked = null;
	#gliding = false;
	#y = 0;
	#velocity = 0;
	#target = 0;
	#frame = 0;
	#then = 0;

	/** @param {() => Item[]} items */
	constructor(items) {
		this.#items = items;
	}

	get items() {
		return this.#items();
	}

	/** The last section whose top is within `REACH` of where it parks, or -1; at the very bottom, the last one. */
	reached() {
		const items = this.items;
		if (window.scrollY > 0 && window.scrollY >= bottom() - 2) return items.length - 1;
		for (let i = items.length - 1; i >= 0; i--) {
			const section = document.getElementById(items[i].id);
			if (!section) continue;
			const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
			if (section.getBoundingClientRect().top - margin <= REACH) return i;
		}
		return -1;
	}

	track = () => {
		if (this.#gliding) return;
		if (this.#parked && Math.abs(window.scrollY - this.#parked.y) < 2) {
			this.active = this.#parked.i;
			return;
		}
		this.#parked = null;
		this.active = this.reached();
	};

	/**
	 * Flies the page to a section, or to the top for -1. Asked again mid-flight, it changes course
	 * without losing speed.
	 * @param {number} i
	 */
	go(i) {
		this.active = i;
		const target = this.#top(i);
		if (prefersReducedMotion.current) {
			this.#halt();
			this.#parked = { y: target, i };
			window.scrollTo({ top: target, behavior: 'instant' });
			return;
		}
		this.#parked = null;
		this.#target = target;
		if (this.#gliding) return;
		this.#gliding = true;
		this.#y = window.scrollY;
		this.#velocity = 0;
		this.#then = performance.now();
		this.#frame = requestAnimationFrame(this.#tick);
	}

	/** Lets go of the page wherever it is. */
	stop() {
		this.#halt();
		this.track();
	}

	/** Follows the scroll, and hands the page back when the reader takes it. Returns the teardown. */
	listen() {
		/** @param {Event} event */
		const takeover = (event) => {
			if (!this.#gliding) return;
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
		return clamp(section.getBoundingClientRect().top + window.scrollY - margin, 0, bottom());
	}

	#halt() {
		cancelAnimationFrame(this.#frame);
		this.#frame = 0;
		this.#gliding = false;
	}

	/** @param {number} now */
	#tick = (now) => {
		const dt = clamp((now - this.#then) / 1000, 0, 0.05);
		this.#then = now;
		const target = Math.min(this.#target, bottom());
		[this.#y, this.#velocity] = springTo(this.#y, this.#velocity, target, STIFFNESS, dt);
		const landed = Math.abs(this.#y - target) < 0.5 && Math.abs(this.#velocity) < 20;
		if (landed) {
			this.#y = target;
			this.#parked = { y: target, i: this.active };
		}
		window.scrollTo({ top: this.#y, behavior: 'instant' });
		if (landed) this.#halt();
		else this.#frame = requestAnimationFrame(this.#tick);
	};
}
