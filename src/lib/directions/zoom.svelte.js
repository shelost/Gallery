import { flushSync } from 'svelte';
import { withViewTransition } from './motion.js';

/**
 * Shared-element zoom: a tile grows into a detail sheet and shrinks back into
 * its slot. The tile and the sheet take turns carrying the `zoom` transition name.
 */
export class Zoom {
	/** Work whose detail sheet is open. */
	current = $state(/** @type {string | null} */ (null));
	/** Tile that carries the shared transition name while closed. */
	origin = $state(/** @type {string | null} */ (null));

	/**
	 * @param {string} id the work to open
	 * @param {string} [tile] the tile it grows from, when one work has several
	 */
	show(id, tile = id) {
		if (this.current) {
			this.origin = tile;
			this.current = id;
			return;
		}
		this.origin = tile;
		flushSync();
		withViewTransition(() => {
			this.current = id;
		});
	}

	hide() {
		withViewTransition(() => {
			this.current = null;
		}).then(() => {
			if (this.current === null) this.origin = null;
		});
	}

	/** @param {string} tile */
	tileName(tile) {
		return this.origin === tile && this.current === null ? 'zoom' : 'none';
	}
}
