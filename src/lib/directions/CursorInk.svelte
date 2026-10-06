<script>
	import { on } from 'svelte/events';

	/**
	 * A transparent canvas over the whole page that inks the cursor's path in the accent colour
	 * and bursts a ring of action lines wherever you click. It never takes pointer events, sleeps
	 * whenever nothing is fading, and stays off for touch and reduced motion.
	 */

	/** How long a stretch of trail lasts, and how long a click burst takes to fade, in ms. */
	const TRAIL = 420;
	const BURST = 520;
	/** Action lines around each burst. */
	const TICKS = 8;
	/** Trail points kept at most, so a fast flick can't grow the path without bound. */
	const POINTS = 96;
	/** Samples closer than this (px) add nothing but jitter. */
	const STEP = 2;
	/** The ribbon's width at the cursor, and its opacity there; both fall to nothing at the tail. */
	const WIDTH = 3.4;
	const ALPHA = 0.45;

	/**
	 * Chaikin corner cutting: each pass replaces every corner with two points a quarter of the way
	 * along its edges, so the path rounds off without overshooting. Ends stay put.
	 * @param {{ x: number, y: number, t: number }[]} points
	 */
	function smooth(points) {
		if (points.length < 3) return points;
		const out = [points[0]];
		for (let i = 0; i < points.length - 1; i++) {
			const a = points[i];
			const b = points[i + 1];
			out.push(
				{ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25, t: a.t * 0.75 + b.t * 0.25 },
				{ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75, t: a.t * 0.25 + b.t * 0.75 }
			);
		}
		out.push(points[points.length - 1]);
		return out;
	}

	/** @param {HTMLCanvasElement} canvas */
	function ink(canvas) {
		const context = canvas.getContext('2d');
		if (!context) return;
		const ctx = context;

		const fine = matchMedia('(hover: hover) and (pointer: fine)');
		const still = matchMedia('(prefers-reduced-motion: reduce)');
		const accent = getComputedStyle(canvas).getPropertyValue('--accent').trim() || '#ff004c';
		/** The accent at zero alpha, for the tail of the gradient. Canvas reads hex, not color-mix(). */
		const [r, g, b] = (accent.match(/^#([\da-f]{6})$/i) ? accent.slice(1).match(/../g) ?? [] : ['ff', '00', '4c']).map((pair) =>
			parseInt(pair, 16)
		);
		const clear = `rgba(${r}, ${g}, ${b}, 0)`;

		/** @type {{ x: number, y: number, t: number }[]} */
		const trail = [];
		/** @type {{ x: number, y: number, t: number, turn: number }[]} */
		const bursts = [];
		let frame = 0;

		function size() {
			const ratio = Math.min(devicePixelRatio || 1, 2);
			canvas.width = Math.round(innerWidth * ratio);
			canvas.height = Math.round(innerHeight * ratio);
			ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		}

		function wake() {
			if (!frame) frame = requestAnimationFrame(draw);
		}

		/** @param {number} x @param {number} y @param {number} angle @param {number} from @param {number} to */
		function ray(x, y, angle, from, to) {
			const cos = Math.cos(angle);
			const sin = Math.sin(angle);
			ctx.beginPath();
			ctx.moveTo(x + cos * from, y + sin * from);
			ctx.lineTo(x + cos * to, y + sin * to);
			ctx.stroke();
		}

		/**
		 * The trail as one filled shape: a smoothed centre line, offset either side by a width that
		 * eases out toward the tail. Filling it once means no overlapping caps, so no beads.
		 * @param {number} now
		 */
		function ribbon(now) {
			const line = smooth(smooth(trail));
			const n = line.length;
			/** @type {{ x: number, y: number }[]} */
			const left = [];
			/** @type {{ x: number, y: number }[]} */
			const right = [];
			let nx = 0;
			let ny = 0;
			for (let i = 0; i < n; i++) {
				const before = line[Math.max(0, i - 1)];
				const after = line[Math.min(n - 1, i + 1)];
				const dx = after.x - before.x;
				const dy = after.y - before.y;
				const length = Math.hypot(dx, dy);
				if (length > 0.01) {
					nx = -dy / length;
					ny = dx / length;
				}
				const life = Math.max(0, 1 - (now - line[i].t) / TRAIL);
				const half = (WIDTH / 2) * Math.sin((life * Math.PI) / 2) * Math.min(1, i / 3);
				left.push({ x: line[i].x + nx * half, y: line[i].y + ny * half });
				right.push({ x: line[i].x - nx * half, y: line[i].y - ny * half });
			}

			const head = line[n - 1];
			const tail = line[0];
			const fade = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
			fade.addColorStop(0, clear);
			fade.addColorStop(1, accent);

			ctx.beginPath();
			ctx.moveTo(left[0].x, left[0].y);
			for (let i = 1; i < n - 1; i++) {
				ctx.quadraticCurveTo(left[i].x, left[i].y, (left[i].x + left[i + 1].x) / 2, (left[i].y + left[i + 1].y) / 2);
			}
			ctx.lineTo(left[n - 1].x, left[n - 1].y);
			ctx.lineTo(right[n - 1].x, right[n - 1].y);
			for (let i = n - 2; i > 0; i--) {
				ctx.quadraticCurveTo(right[i].x, right[i].y, (right[i].x + right[i - 1].x) / 2, (right[i].y + right[i - 1].y) / 2);
			}
			ctx.lineTo(right[0].x, right[0].y);
			ctx.closePath();
			ctx.globalAlpha = ALPHA;
			ctx.fillStyle = fade;
			ctx.fill();
		}

		/** @param {number} now */
		function draw(now) {
			frame = 0;
			ctx.clearRect(0, 0, innerWidth, innerHeight);
			while (trail.length && now - trail[0].t > TRAIL) trail.shift();
			while (bursts.length && now - bursts[0].t > BURST) bursts.shift();

			if (trail.length > 1) ribbon(now);

			ctx.strokeStyle = accent;
			ctx.lineCap = 'round';
			for (const burst of bursts) {
				const p = (now - burst.t) / BURST;
				const out = 1 - (1 - p) ** 3;
				ctx.globalAlpha = 1 - p;
				ctx.lineWidth = 0.5 + 2 * (1 - p);
				ctx.beginPath();
				ctx.arc(burst.x, burst.y, 5 + out * 22, 0, Math.PI * 2);
				ctx.stroke();
				for (let k = 0; k < TICKS; k++) {
					const from = 12 + out * 20;
					ray(burst.x, burst.y, burst.turn + (k * Math.PI * 2) / TICKS, from, from + 3 + 9 * (1 - p));
				}
			}

			ctx.globalAlpha = 1;
			if (trail.length || bursts.length) wake();
		}

		/** @param {PointerEvent} event */
		function live(event) {
			return event.pointerType !== 'touch' && fine.matches && !still.matches;
		}

		size();
		const off = [
			on(window, 'resize', size),
			on(
				window,
				'pointermove',
				(event) => {
					if (!live(event)) return;
					const now = performance.now();
					for (const sample of event.getCoalescedEvents?.() ?? [event]) {
						const last = trail[trail.length - 1];
						if (last && Math.hypot(sample.clientX - last.x, sample.clientY - last.y) < STEP) continue;
						trail.push({ x: sample.clientX, y: sample.clientY, t: Math.min(now, sample.timeStamp || now) });
					}
					while (trail.length > POINTS) trail.shift();
					wake();
				},
				{ passive: true }
			),
			on(
				window,
				'pointerdown',
				(event) => {
					if (!live(event)) return;
					bursts.push({ x: event.clientX, y: event.clientY, t: performance.now(), turn: Math.random() * Math.PI });
					wake();
				},
				{ passive: true }
			)
		];

		return () => {
			cancelAnimationFrame(frame);
			for (const stop of off) stop();
		};
	}
</script>

<canvas class="ink" aria-hidden="true" {@attach ink}></canvas>

<style>
	.ink {
		position: fixed;
		inset: 0;
		z-index: 100;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		mix-blend-mode: multiply;
	}
</style>
