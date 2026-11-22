/**
 * Sutherland–Hodgman: a ring cut to a lon/lat box, closed along the box edge. Shared by the
 * sheets and the bake scripts.
 * @param {number[][]} ring
 * @param {number} minx
 * @param {number} miny
 * @param {number} maxx
 * @param {number} maxy
 */
export function clipRect(ring, minx, miny, maxx, maxy) {
	/** @param {number[][]} pts @param {(p: number[]) => boolean} insideEdge @param {(a: number[], b: number[]) => number[]} cut */
	const clip = (pts, insideEdge, cut) => {
		if (!pts.length) return [];
		/** @type {number[][]} */
		const out = [];
		for (let i = 0; i < pts.length; i++) {
			const a = pts[i];
			const b = pts[(i + 1) % pts.length];
			const ain = insideEdge(a);
			const bin = insideEdge(b);
			if (ain && bin) out.push(b);
			else if (ain && !bin) out.push(cut(a, b));
			else if (!ain && bin) out.push(cut(a, b), b);
		}
		return out;
	};
	let pts = ring;
	pts = clip(pts, (p) => p[0] >= minx, (a, b) => {
		const t = (minx - a[0]) / (b[0] - a[0] || 1e-9);
		return [minx, a[1] + t * (b[1] - a[1])];
	});
	pts = clip(pts, (p) => p[0] <= maxx, (a, b) => {
		const t = (maxx - a[0]) / (b[0] - a[0] || 1e-9);
		return [maxx, a[1] + t * (b[1] - a[1])];
	});
	pts = clip(pts, (p) => p[1] >= miny, (a, b) => {
		const t = (miny - a[1]) / (b[1] - a[1] || 1e-9);
		return [a[0] + t * (b[0] - a[0]), miny];
	});
	pts = clip(pts, (p) => p[1] <= maxy, (a, b) => {
		const t = (maxy - a[1]) / (b[1] - a[1] || 1e-9);
		return [a[0] + t * (b[0] - a[0]), maxy];
	});
	return pts;
}
