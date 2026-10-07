/** A 25ms noise burst with a fast decay; filtered differently per control. @param {AudioContext} context */
function makeBurst(context) {
	const length = Math.floor(context.sampleRate * 0.025);
	const buffer = context.createBuffer(1, length, context.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 6);
	return buffer;
}

const VOICES = {
	key: { rate: 0.8, frequency: 1400, gain: 0.8 },
	detent: { rate: 1.6, frequency: 3200, gain: 0.5 },
	latch: { rate: 2.2, frequency: 4200, gain: 0.45 },
	thunk: { rate: 0.45, frequency: 520, gain: 1 }
};

/** @typedef {keyof typeof VOICES} Voice */

/**
 * Optional key and knob sounds, synthesized on demand. Muted until the visitor turns them on,
 * unless the sound is the point of the interaction.
 */
export class Clicks {
	muted = $state(true);

	constructor({ muted = true } = {}) {
		this.muted = muted;
	}

	/** @type {AudioContext | null} */
	#context = null;
	/** @type {AudioBuffer | null} */
	#burst = null;

	toggle() {
		this.muted = !this.muted;
		this.tick('key');
	}

	/**
	 * Opens the audio. Browsers only start it inside a tap, so a control that clicks while it's
	 * dragged wakes it on every press, and the clicks of the drag can sound.
	 */
	wake() {
		if (typeof AudioContext === 'undefined') return null;
		const context = (this.#context ??= new AudioContext());
		if (context.state === 'suspended') context.resume();
		return context;
	}

	/** @param {Voice} kind */
	tick(kind) {
		if (this.muted) return;
		const context = this.wake();
		if (!context) return;
		const voice = VOICES[kind];
		const source = context.createBufferSource();
		source.buffer = this.#burst ??= makeBurst(context);
		source.playbackRate.value = voice.rate;
		const filter = context.createBiquadFilter();
		filter.type = 'bandpass';
		filter.frequency.value = voice.frequency;
		filter.Q.value = 2.5;
		const gain = context.createGain();
		gain.gain.value = voice.gain;
		source.connect(filter).connect(gain).connect(context.destination);
		source.start();
	}

	dispose() {
		this.#context?.close();
		this.#context = null;
		this.#burst = null;
	}
}
