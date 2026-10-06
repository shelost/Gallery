/**
 * The one work lit on a page, wherever the pointer is: a row, a panel, or a koi.
 * Leaving only clears the work that's still lit, so moving straight from one
 * thing to the next never drops the new one.
 */
export class Spotlight {
	current = $state(/** @type {string | null} */ (null));

	/** @param {string} id @param {boolean} on */
	set = (id, on) => {
		if (on) this.current = id;
		else if (this.current === id) this.current = null;
	};
}
