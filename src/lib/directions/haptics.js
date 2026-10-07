/**
 * Haptics where the web allows them. Android buzzes on cue through the Vibration API. Safari on
 * iOS has none: it only buzzes when a switch control is really tapped, so `tappable` wires a
 * button's taps to a hidden one. Script can't flip it, so on an iPhone a drag can't be felt, only
 * taps.
 */

/** Whether this is an iPhone or iPad, iPads included when they say they're Macs. */
function ios() {
	return (
		typeof navigator !== 'undefined' &&
		(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
	);
}

/**
 * A buzz, on phones that take one from script. Browsers refuse until the visitor has tapped
 * something, so it waits for that rather than filling the console with refusals.
 * @param {number} ms
 */
export function buzz(ms) {
	if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
	if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
	navigator.vibrate(ms);
}

/**
 * An attachment that makes real taps on a positioned button buzz on iOS. A clear label over it
 * takes the tap and hands it on, as a trusted click, to a hidden switch, which buzzes as it
 * flips. The switch must never sit under the finger, where WebKit would swallow the touch.
 * @param {HTMLElement} node
 */
export function tappable(node) {
	if (!ios()) return;
	const label = document.createElement('label');
	label.setAttribute('aria-hidden', 'true');
	Object.assign(label.style, { position: 'absolute', inset: '0', borderRadius: 'inherit', touchAction: 'manipulation' });
	label.style.setProperty('-webkit-tap-highlight-color', 'transparent');
	const toggle = document.createElement('input');
	toggle.type = 'checkbox';
	toggle.setAttribute('switch', '');
	Object.assign(toggle.style, { position: 'absolute', width: '1px', height: '1px', margin: '0', visibility: 'hidden' });
	toggle.addEventListener('click', (event) => event.stopPropagation());
	label.append(toggle);
	node.append(label);
	return () => label.remove();
}
