/**
 * The room's one music player: a YouTube player kept out of sight, driven through the IFrame
 * API so it can be paused, scrubbed and read back, which a bare embed can't. YouTube won't play
 * in a frame under 200 × 200, so the frame keeps that size and is hidden by opacity instead.
 */

const API = 'https://www.youtube.com/iframe_api';
const PLAYING = 1;
const ENDED = 0;

/** @type {Promise<any> | null} */
let api = null;

/** Loads the IFrame API once, for every player on the page. @returns {Promise<any>} */
function youtube() {
	const w = /** @type {any} */ (window);
	if (w.YT?.Player) return Promise.resolve(w.YT);
	api ??= new Promise((resolve) => {
		const before = w.onYouTubeIframeAPIReady;
		w.onYouTubeIframeAPIReady = () => {
			before?.();
			resolve(w.YT);
		};
		const script = document.createElement('script');
		script.src = API;
		document.head.append(script);
	});
	return api;
}

export class Player {
	playing = $state(false);
	time = $state(0);
	duration = $state(0);

	/** @type {any} */
	#yt = null;
	/** The video in the player, or asked for before the player was ready. */
	#video = '';
	#wanted = false;
	/** @type {ReturnType<typeof setInterval> | undefined} */
	#clock;
	/** @type {() => void} */
	#onended;

	/** @param {{ onended?: () => void }} [options] */
	constructor({ onended = () => {} } = {}) {
		this.#onended = onended;
	}

	/**
	 * Puts the player in `host`, with `video` cued but not playing. Returns the teardown.
	 * @param {HTMLElement} host
	 * @param {string} video
	 */
	mount(host, video) {
		this.#video ||= video;
		const frame = document.createElement('div');
		host.append(frame);
		let gone = false;
		youtube().then((YT) => {
			if (gone) return;
			this.#yt = new YT.Player(frame, {
				width: 200,
				height: 200,
				videoId: this.#video,
				playerVars: { playsinline: 1, rel: 0, controls: 0, disablekb: 1 },
				events: {
					onReady: () => {
						if (this.#wanted) this.#yt.playVideo();
					},
					onStateChange: (/** @type {{ data: number }} */ event) => this.#changed(event.data)
				}
			});
		});
		return () => {
			gone = true;
			clearInterval(this.#clock);
			this.#yt?.destroy();
			this.#yt = null;
			frame.remove();
		};
	}

	/** Plays `video`, from the top if it's a different one. @param {string} video */
	play(video) {
		this.#wanted = true;
		const fresh = video !== this.#video;
		this.#video = video;
		if (!this.#yt?.playVideo) return;
		if (fresh) {
			this.time = 0;
			this.duration = 0;
			this.#yt.loadVideoById(video);
		} else this.#yt.playVideo();
	}

	pause() {
		this.#wanted = false;
		this.#yt?.pauseVideo?.();
	}

	/** @param {number} seconds */
	seek(seconds) {
		this.time = seconds;
		this.#yt?.seekTo?.(seconds, true);
	}

	/** @param {number} state */
	#changed(state) {
		this.playing = state === PLAYING;
		clearInterval(this.#clock);
		this.#read();
		if (this.playing) this.#clock = setInterval(() => this.#read(), 250);
		if (state === ENDED) this.#onended();
	}

	#read() {
		if (!this.#yt?.getCurrentTime) return;
		this.time = this.#yt.getCurrentTime() || 0;
		this.duration = this.#yt.getDuration() || 0;
	}
}
