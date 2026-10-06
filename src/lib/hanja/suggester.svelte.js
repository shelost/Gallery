import { tick } from 'svelte';
import { load, suggest, wordAt } from './lexicon.js';

/**
 * Input-method state for one textarea: the word at the caret and its candidates.
 * Attach it to the textarea with {@attach suggester.attach}; render the bar with <Suggestions>.
 */
export class Suggester {
	/** @type {Awaited<ReturnType<typeof load>> | null} */
	data = $state.raw(null);
	caret = $state(0);
	/** @type {HTMLTextAreaElement | null} */
	field = null;

	#read;
	#write;

	target = $derived(wordAt(this.#value, this.caret));
	candidates = $derived(this.data && this.target ? suggest(this.data, this.target.word) : []);

	/**
	 * @param {() => string} read the text
	 * @param {(value: string) => void} write
	 */
	constructor(read, write) {
		this.#read = read;
		this.#write = write;
	}

	get #value() {
		return this.#read?.() ?? '';
	}

	/** @param {import('./lexicon.js').Candidate} candidate */
	choose = async (candidate) => {
		const target = this.target;
		if (!target) return;
		const value = this.#value;
		const at = target.start + candidate.text.length;
		this.#write(value.slice(0, target.start) + candidate.text + value.slice(target.end));
		this.caret = at;
		await tick();
		this.field?.focus();
		this.field?.setSelectionRange(at, at);
	};

	/** @param {HTMLTextAreaElement} node */
	attach = (node) => {
		this.field = node;
		const sync = () => {
			this.caret = node.selectionStart;
			if (!this.data) load().then((data) => (this.data = data));
		};
		/** @param {KeyboardEvent} event */
		const pick = (event) => {
			if (event.key !== 'Tab' || event.shiftKey || event.isComposing || !this.candidates.length) return;
			event.preventDefault();
			this.choose(this.candidates[0]);
		};
		const events = ['input', 'keyup', 'click', 'focus', 'select'];
		for (const name of events) node.addEventListener(name, sync);
		node.addEventListener('keydown', pick);
		return () => {
			for (const name of events) node.removeEventListener(name, sync);
			node.removeEventListener('keydown', pick);
			this.field = null;
		};
	};
}
