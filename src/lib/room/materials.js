import { CanvasTexture, SRGBColorSpace } from 'three';
import { random } from '$lib/directions/motion.js';

/**
 * Painted textures for the room's natural materials. Each is drawn once, the first time it's
 * asked for, and shared by every mesh that uses it.
 */

/** Polished brass, for a MeshStandardMaterial: the desk's pulls and the podium's plaque. */
export const BRASS = { color: '#c9a25a', metalness: 1, roughness: 0.32 };

/** @type {Map<string, CanvasTexture>} */
const made = new Map();

/**
 * @param {string} name
 * @param {number} w
 * @param {number} h
 * @param {(ctx: CanvasRenderingContext2D, w: number, h: number) => void} paint
 */
function painted(name, w, h, paint) {
	const existing = made.get(name);
	if (existing) return existing;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	paint(ctx, w, h);
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = 8;
	made.set(name, texture);
	return texture;
}

/**
 * Clear-finished pine: pale honey boards with the grain running their length, darker latewood
 * lines, and the odd knot.
 */
export function pine() {
	return painted('pine', 2048, 1024, (ctx, w, h) => {
		const next = random(7);
		const boards = 5;
		const board = h / boards;
		for (let b = 0; b < boards; b++) {
			const y0 = b * board;
			const shade = next() * 0.08;
			const base = ctx.createLinearGradient(0, y0, 0, y0 + board);
			base.addColorStop(0, `hsl(36 ${58 - shade * 80}% ${76 - shade * 40}%)`);
			base.addColorStop(1, `hsl(33 ${52 - shade * 80}% ${70 - shade * 40}%)`);
			ctx.fillStyle = base;
			ctx.fillRect(0, y0, w, board);

			for (let line = 0; line < 46; line++) {
				const y = y0 + next() * board;
				const amplitude = 2 + next() * 9;
				const period = 300 + next() * 900;
				const phase = next() * Math.PI * 2;
				ctx.strokeStyle = `rgba(${120 + next() * 30}, ${70 + next() * 20}, 25, ${0.05 + next() * 0.14})`;
				ctx.lineWidth = 0.6 + next() * 2.4;
				wave(ctx, w, y, amplitude, period, phase);
				ctx.stroke();
			}

			if (next() < 0.7) {
				const kx = next() * w;
				const ky = y0 + board * (0.25 + next() * 0.5);
				for (let ring = 7; ring > 0; ring--) {
					ctx.strokeStyle = `rgba(110, 60, 20, ${0.05 + (7 - ring) * 0.025})`;
					ctx.lineWidth = 1.4;
					ctx.beginPath();
					ctx.ellipse(kx, ky, ring * 6.5, ring * 2.6, 0, 0, Math.PI * 2);
					ctx.stroke();
				}
				ctx.fillStyle = 'rgba(95, 50, 18, 0.55)';
				ctx.beginPath();
				ctx.ellipse(kx, ky, 6, 2.6, 0, 0, Math.PI * 2);
				ctx.fill();
			}

			ctx.fillStyle = 'rgba(90, 55, 20, 0.22)';
			ctx.fillRect(0, y0, w, 1.5);
		}
	});
}

/** White Parian marble, with soft grey veins drifting across it. */
export function marble() {
	return painted('marble', 1024, 1024, (ctx, w, h) => {
		const next = random(23);
		ctx.fillStyle = '#f1eee8';
		ctx.fillRect(0, 0, w, h);
		const cloud = ctx.createRadialGradient(w * 0.4, h * 0.3, 0, w * 0.5, h * 0.5, w * 0.8);
		cloud.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
		cloud.addColorStop(1, 'rgba(214, 208, 198, 0.4)');
		ctx.fillStyle = cloud;
		ctx.fillRect(0, 0, w, h);
		ctx.filter = 'blur(1.5px)';
		for (let vein = 0; vein < 14; vein++) {
			let x = next() * w;
			let y = next() * h;
			let angle = next() * Math.PI * 2;
			ctx.strokeStyle = `rgba(120, 118, 115, ${0.08 + next() * 0.2})`;
			ctx.lineWidth = 0.6 + next() * 2.2;
			ctx.beginPath();
			ctx.moveTo(x, y);
			for (let step = 0; step < 90; step++) {
				angle += (next() - 0.5) * 0.5;
				x += Math.cos(angle) * 9;
				y += Math.sin(angle) * 9;
				ctx.lineTo(x, y);
			}
			ctx.stroke();
		}
		ctx.filter = 'none';
	});
}

/**
 * Starts a path along one line of grain, wandering across the whole width.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} y
 * @param {number} amplitude
 * @param {number} period
 * @param {number} phase
 */
function wave(ctx, w, y, amplitude, period, phase) {
	ctx.beginPath();
	for (let x = 0; x <= w; x += 16) {
		const dy = Math.sin(x / period + phase) * amplitude + Math.sin(x / (period * 0.27) + phase) * amplitude * 0.25;
		if (x === 0) ctx.moveTo(x, y + dy);
		else ctx.lineTo(x, y + dy);
	}
}

/**
 * French-polished mahogany: a deep red-brown with the ribbon figure of quarter-sawn boards
 * running along it in light and dark bands, fine grain lines, and open pores.
 */
export function mahogany() {
	return painted('mahogany', 2048, 1024, (ctx, w, h) => {
		const next = random(11);
		const base = ctx.createLinearGradient(0, 0, 0, h);
		base.addColorStop(0, '#74331d');
		base.addColorStop(0.5, '#5f2716');
		base.addColorStop(1, '#6f301c');
		ctx.fillStyle = base;
		ctx.fillRect(0, 0, w, h);

		for (let band = 0; band < 30; band++) {
			ctx.strokeStyle = next() < 0.5 ? `rgba(156, 72, 38, ${0.1 + next() * 0.16})` : `rgba(38, 10, 5, ${0.1 + next() * 0.14})`;
			ctx.lineWidth = 6 + next() * 34;
			wave(ctx, w, next() * h, 2 + next() * 8, 500 + next() * 900, next() * Math.PI * 2);
			ctx.stroke();
		}

		for (let line = 0; line < 240; line++) {
			ctx.strokeStyle = `rgba(30, 8, 4, ${0.05 + next() * 0.15})`;
			ctx.lineWidth = 0.6 + next() * 1.6;
			wave(ctx, w, next() * h, 1 + next() * 5, 260 + next() * 700, next() * Math.PI * 2);
			ctx.stroke();
		}

		ctx.fillStyle = 'rgba(25, 6, 3, 0.32)';
		for (let pore = 0; pore < 3200; pore++) ctx.fillRect(next() * w, next() * h, 3 + next() * 10, 1);
	});
}

/** Green desk leather, mottled with wear and tooled in gilt with a double rule in from its edges. */
export function leather() {
	return painted('leather', 2048, 820, (ctx, w, h) => {
		const next = random(31);
		ctx.fillStyle = '#2d4a37';
		ctx.fillRect(0, 0, w, h);

		for (let spot = 0; spot < 90; spot++) {
			const x = next() * w;
			const y = next() * h;
			const r = 40 + next() * 170;
			const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
			glow.addColorStop(0, next() < 0.5 ? 'rgba(12, 28, 18, 0.24)' : 'rgba(92, 128, 98, 0.16)');
			glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
			ctx.fillStyle = glow;
			ctx.fillRect(x - r, y - r, r * 2, r * 2);
		}

		for (let grain = 0; grain < 16000; grain++) {
			ctx.fillStyle = next() < 0.5 ? `rgba(8, 18, 12, ${0.05 + next() * 0.09})` : `rgba(130, 160, 132, ${0.04 + next() * 0.07})`;
			ctx.fillRect(next() * w, next() * h, 1 + next() * 2, 1 + next() * 2);
		}

		const edge = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62);
		edge.addColorStop(0, 'rgba(0, 0, 0, 0)');
		edge.addColorStop(1, 'rgba(6, 14, 9, 0.38)');
		ctx.fillStyle = edge;
		ctx.fillRect(0, 0, w, h);

		ctx.strokeStyle = '#d2ae62';
		ctx.lineWidth = 6;
		ctx.strokeRect(40, 40, w - 80, h - 80);
		ctx.lineWidth = 2.5;
		ctx.strokeRect(62, 62, w - 124, h - 124);
	});
}
