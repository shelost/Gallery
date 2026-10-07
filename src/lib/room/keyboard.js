/** Keys per row, top to bottom, on a compact board. */
const ROWS = [14, 14, 13, 12, 10];

/**
 * Paints a keyboard seen from above: rows of rounded keycaps on a deck.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {{ deck: string, key: string, accent?: string }} colors `accent` picks out Enter
 */
export function paintKeys(ctx, w, h, { deck, key, accent }) {
	ctx.fillStyle = deck;
	ctx.fillRect(0, 0, w, h);
	const gap = w * 0.006;
	const row = (h - gap * (ROWS.length + 1)) / ROWS.length;
	ROWS.forEach((count, r) => {
		const unit = (w - gap * (count + 1)) / count;
		for (let k = 0; k < count; k++) {
			ctx.fillStyle = accent && r === 2 && k === count - 1 ? accent : key;
			ctx.beginPath();
			ctx.roundRect(gap + k * (unit + gap), gap + r * (row + gap), unit, row, row * 0.18);
			ctx.fill();
		}
	});
}
