import { LEGACY } from '$lib/legacy.js';

/** @param {string} param */
export function match(param) {
	return Object.hasOwn(LEGACY, param);
}
