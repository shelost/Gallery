/**
 * Pointer input → brush. Pens use real pressure; mice and fingers derive it from
 * speed (slow = heavy, fast = light), and a quick release flicks the tip out.
 * @param {HTMLCanvasElement} canvas
 * @param {import('./brush.js').Brush} brush
 * @param {{ infinite?: boolean }} [options] infinite: refill on every stroke (for preview pads)
 * @returns {() => void} cleanup
 */
export function freehand(canvas, brush, { infinite = false } = {}) {
	let pointer = -1;
	let pen = false;
	let pressure = 0.5;
	let velocity = 0;
	let x = 0;
	let y = 0;
	let t = 0;

	/** @param {PointerEvent} e */
	const locate = (e) => {
		const rect = canvas.getBoundingClientRect();
		return [e.clientX - rect.left, e.clientY - rect.top];
	};

	/** @param {PointerEvent} e */
	function down(e) {
		if (pointer !== -1 || e.button > 0) return;
		pointer = e.pointerId;
		canvas.setPointerCapture(pointer);
		pen = e.pointerType === 'pen';
		[x, y] = locate(e);
		t = e.timeStamp;
		velocity = 0;
		pressure = pen ? 0.2 + e.pressure : 0.55;
		if (infinite) brush.dip(1);
		brush.down(x, y, pressure);
		brush.flush();
	}

	/** @param {PointerEvent} e */
	function move(e) {
		if (e.pointerId !== pointer) return;
		const events = e.getCoalescedEvents?.() ?? [e];
		for (const event of events.length ? events : [e]) {
			const [nx, ny] = locate(event);
			const dt = Math.max(1, event.timeStamp - t);
			const dist = Math.hypot(nx - x, ny - y);
			velocity = velocity * 0.7 + (dist / dt) * 0.3;
			const target = pen ? 0.2 + event.pressure : Math.min(1.15, Math.max(0.3, 1.15 - velocity * 0.45));
			pressure += (target - pressure) * 0.25;
			x = nx;
			y = ny;
			t = event.timeStamp;
			brush.to(x, y, pressure);
		}
		brush.flush();
	}

	/** @param {PointerEvent} e */
	function up(e) {
		if (e.pointerId !== pointer) return;
		pointer = -1;
		if (!pen && velocity > 0.3) {
			const reach = Math.min(velocity * 60, brush.size * 3);
			for (let i = 1; i <= 10; i++) {
				const k = i / 10;
				brush.to(x + brush.dx * reach * k, y + brush.dy * reach * k, pressure * (1 - k));
			}
		}
		brush.up();
	}

	canvas.addEventListener('pointerdown', down);
	canvas.addEventListener('pointermove', move);
	canvas.addEventListener('pointerup', up);
	canvas.addEventListener('pointercancel', up);
	return () => {
		canvas.removeEventListener('pointerdown', down);
		canvas.removeEventListener('pointermove', move);
		canvas.removeEventListener('pointerup', up);
		canvas.removeEventListener('pointercancel', up);
	};
}
