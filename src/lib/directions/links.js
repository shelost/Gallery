import { resolve } from '$app/paths';

/** @param {string} href */
export function isExternal(href) {
	return /^https?:\/\//.test(href);
}

/**
 * Anchor attributes for a work link. Other sites open in a new tab; site routes
 * go through resolve() so they respect the configured base path.
 * @param {string} href
 * @returns {{ href: string, target?: string, rel?: string }}
 */
export function linkProps(href) {
	if (isExternal(href)) return { href, target: '_blank', rel: 'external noreferrer' };
	if (href.startsWith('mailto:') || href.startsWith('#')) return { href };
	return { href: resolve(/** @type {any} */ (href)) };
}
