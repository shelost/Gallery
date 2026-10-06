import { getContext, setContext } from 'svelte';

const KEY = Symbol('directions');

/** @typedef {{ open: (href: string) => void }} DirectionsContext */

/** @param {DirectionsContext} value */
export function setDirectionsContext(value) {
	setContext(KEY, value);
}

/** @returns {DirectionsContext} */
export function getDirectionsContext() {
	return getContext(KEY);
}
