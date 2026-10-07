/** The room's pastels, and one vermilion for the odd accent pixel. */
const INKS = ['#cfe9de', '#f8d9ca', '#dfd6f5', '#d3e3f5'];
const ACCENT = '#ff004c';

/** Cells along each side of the grid. */
export const GRID = 9;

/**
 * Pixel art after the ARC puzzles: a sprite mirrored down the middle, in one of the room's
 * pastels with a rare accent pixel. The same seed always draws the same sprite.
 * @param {number} seed
 * @returns {{ x: number, y: number, color: string }[]}
 */
export function sprite(seed) {
	let s = seed * 7919 + 17;
	const next = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
	const ink = INKS[Math.floor(next() * INKS.length)];
	/** @type {{ x: number, y: number, color: string }[]} */
	const cells = [];
	for (let y = 1; y < GRID - 1; y++) {
		for (let x = 1; x <= Math.floor(GRID / 2); x++) {
			if (next() < 0.48) continue;
			const color = next() < 0.08 ? ACCENT : ink;
			cells.push({ x, y, color });
			if (x !== GRID - 1 - x) cells.push({ x: GRID - 1 - x, y, color });
		}
	}
	return cells;
}
