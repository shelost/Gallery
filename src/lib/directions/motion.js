import { flushSync } from 'svelte';
import { prefersReducedMotion } from 'svelte/motion';

/** @param {number} value @param {number} min @param {number} max */
export function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

/**
 * Seeded generator (mulberry32). The same seed gives the same sequence on the server and the
 * client, so generated layouts hydrate without mismatches.
 * @param {number} seed
 * @returns {() => number} values in [0, 1)
 */
export function random(seed) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** FNV-1a, for seeding a generator from an id. @param {string} text */
export function hash(text) {
	let value = 2166136261;
	for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
	return value;
}

/**
 * Matches a 2D canvas's backing store to its CSS size at the device pixel ratio, and scales the
 * context so drawing stays in CSS pixels.
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} context
 * @param {{ width: number, height: number, ratio: number }} current
 * @returns {{ width: number, height: number, ratio: number } | null} the new size, or null when unchanged
 */
export function fitCanvas(canvas, context, current) {
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const ratio = window.devicePixelRatio || 1;
	if (!width || !height) return null;
	if (width === current.width && height === current.height && ratio === current.ratio) return null;
	canvas.width = Math.round(width * ratio);
	canvas.height = Math.round(height * ratio);
	context.setTransform(ratio, 0, 0, ratio, 0, 0);
	return { width, height, ratio };
}

/**
 * Attachment factory: reports when the element enters or leaves the viewport.
 * @param {(visible: boolean, entry: IntersectionObserverEntry) => void} onchange
 * @param {IntersectionObserverInit} [options]
 * @returns {import('svelte/attachments').Attachment<Element>}
 */
export function inView(onchange, options = {}) {
	return (node) => {
		const observer = new IntersectionObserver(([entry]) => onchange(entry.isIntersecting, entry), options);
		observer.observe(node);
		return () => observer.disconnect();
	};
}

/**
 * A lightly underdamped spring, settled by t = 1: things land with a few pixels of give
 * instead of decelerating along one flat curve.
 * @param {number} t
 */
export function spring(t) {
	if (t >= 1) return 1;
	const zeta = 0.8;
	const omega = 11;
	const damped = omega * Math.sqrt(1 - zeta * zeta);
	return 1 - Math.exp(-zeta * omega * t) * (Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t));
}

/**
 * Runs a state update inside a View Transition when the browser supports it
 * and the visitor has not asked for reduced motion.
 * @param {() => void} update
 * @returns {Promise<void>} resolves when the transition has finished
 */
export function withViewTransition(update) {
	if (typeof document === 'undefined' || !document.startViewTransition || prefersReducedMotion.current) {
		update();
		return Promise.resolve();
	}
	const transition = document.startViewTransition(() => flushSync(update));
	transition.ready.catch(() => {});
	return transition.finished.catch(() => {});
}
