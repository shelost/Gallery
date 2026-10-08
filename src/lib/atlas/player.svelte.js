/** How long a looping player rests on its last year before wrapping, in ms. */
const LOOP_HOLD = 2200;

/**
 * Drives a timeline's year forward in real time. The year itself lives with the caller and is
 * read and written through the two callbacks, so the slider and the player never disagree.
 */
export class YearPlayer {
	playing = $state(false);
	/** @type {() => number} */
	#read;
	/** @type {(year: number) => void} */
	#write;
	/** @type {() => { from: number, to: number, speed?: number, loop?: boolean }} */
	#options;
	#frame = 0;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	#hold;
	#last = 0;
	#exact = 0;

	/**
	 * @param {() => number} read
	 * @param {(year: number) => void} write
	 * @param {() => { from: number, to: number, speed?: number, loop?: boolean }} options read
	 *   lazily, so they can come from props; speed is in years per second
	 */
	constructor(read, write, options) {
		this.#read = read;
		this.#write = write;
		this.#options = options;
	}

	/** @param {number} now */
	#tick = (now) => {
		if (!this.playing) return;
		const { from, to, speed = 32, loop = false } = this.#options();
		this.#exact = Math.min(to, this.#exact + ((now - this.#last) / 1000) * speed);
		this.#last = now;
		this.#write(Math.round(this.#exact));
		if (this.#exact < to) {
			this.#frame = requestAnimationFrame(this.#tick);
		} else if (loop) {
			this.#hold = setTimeout(() => {
				this.#write(from);
				this.#start();
			}, LOOP_HOLD);
		} else {
			this.playing = false;
		}
	};

	#start() {
		this.#exact = this.#read();
		this.#last = performance.now();
		this.#frame = requestAnimationFrame(this.#tick);
	}

	play() {
		if (this.playing) return;
		const { from, to } = this.#options();
		if (this.#read() >= to) this.#write(from);
		this.playing = true;
		this.#start();
	}

	stop() {
		this.playing = false;
		cancelAnimationFrame(this.#frame);
		clearTimeout(this.#hold);
		this.#frame = 0;
		this.#hold = undefined;
	}

	toggle() {
		if (this.playing) this.stop();
		else this.play();
	}
}
