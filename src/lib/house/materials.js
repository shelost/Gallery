import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three';

/** Every surface in the model. An `opacity` below 1 makes the finish see-through. */
export const FINISHES = {
	wall: { color: '#f2efe8', roughness: 0.95 },
	cut: { color: '#3a3732', roughness: 1 },
	slab: { color: '#e5e0d6', roughness: 0.95 },
	oak: { color: '#d6bf9b', roughness: 0.7 },
	walnut: { color: '#7d5b43', roughness: 0.6 },
	stone: { color: '#e4e1da', roughness: 0.35 },
	tile: { color: '#dcdad4', roughness: 0.45 },
	rubber: { color: '#3b3a36', roughness: 0.95 },
	lacquer: { color: '#f6f4ef', roughness: 0.3 },
	fabric: { color: '#c8bfae', roughness: 1 },
	linen: { color: '#eeeae1', roughness: 1 },
	leather: { color: '#2c2a27', roughness: 0.55 },
	steel: { color: '#2f2f2f', roughness: 0.38, metalness: 0.7 },
	chrome: { color: '#d4d4d4', roughness: 0.18, metalness: 1 },
	ceramic: { color: '#fbfaf6', roughness: 0.15 },
	ink: { color: '#1f1e1b', roughness: 0.5 },
	sanguine: { color: '#a8432b', roughness: 0.55 },
	glass: { color: '#cfe0e3', roughness: 0.05, opacity: 0.28, depthWrite: false },
	mirror: { color: '#eef2f3', roughness: 0.03, metalness: 1 },
	roof: { color: '#cfc9be', roughness: 0.85 },
	foliage: { color: '#c4ccb6', roughness: 1 },
	site: { color: '#ebe7de', roughness: 1 },
	paving: { color: '#dcd6ca', roughness: 0.9 },
	highlight: { color: '#a8432b', roughness: 1, opacity: 0.3, depthWrite: false }
};

/** @typedef {keyof typeof FINISHES} Finish */
/**
 * A finish, or a box whose top face differs: `capped` is a wall's section cut, `tread` a white
 * stair with oak treads.
 * @typedef {Finish | 'capped' | 'tread'} Paint
 */
/** @typedef {Record<Finish, MeshStandardMaterial>} Palette */
/** @typedef {Palette & Record<'capped' | 'tread', MeshStandardMaterial[]>} Paints */

/** One material per finish, so a whole storey can fade without touching the others. @returns {Palette} */
export function createPalette() {
	return /** @type {Palette} */ (
		Object.fromEntries(
			Object.entries(FINISHES).map(([name, { opacity = 1, ...look }]) => {
				const material = new MeshStandardMaterial({ ...look, opacity, transparent: opacity < 1 });
				material.userData.opacity = opacity;
				return [name, material];
			})
		)
	);
}

/** Adds the two-tone paints. BoxGeometry orders its faces +x, −x, +y, −y, +z, −z. @param {Palette} palette @returns {Paints} */
export function compose(palette) {
	/** @param {MeshStandardMaterial} side @param {MeshStandardMaterial} top */
	const topped = (side, top) => [side, side, top, side, side, side];
	return { ...palette, capped: topped(palette.wall, palette.cut), tread: topped(palette.wall, palette.oak) };
}

/**
 * Scales every material toward `amount` of its own opacity. Opaque materials only switch to
 * blending while they're fading, since that needs a shader recompile.
 * @param {Palette} palette
 * @param {number} amount
 */
export function fadePalette(palette, amount) {
	for (const material of Object.values(palette)) {
		const opacity = material.userData.opacity * amount;
		const transparent = opacity < 1;
		if (material.transparent !== transparent) {
			material.transparent = transparent;
			material.needsUpdate = true;
		}
		material.opacity = opacity;
	}
}

/** @param {Palette} palette */
export function disposePalette(palette) {
	for (const material of Object.values(palette)) material.dispose();
}

/**
 * Drafting paper for the lot: a line every metre and a heavier one every `section` metres, as a
 * repeating texture so it mipmaps cleanly at a distance. Browser only.
 * @param {number} width
 * @param {number} depth
 * @param {number} [section]
 */
export function createDrafting(width, depth, section = 5) {
	const size = 512;
	const cell = size / section;
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	ctx.fillStyle = FINISHES.site.color;
	ctx.fillRect(0, 0, size, size);
	ctx.fillStyle = '#dcd7cb';
	for (let i = 1; i < section; i++) {
		ctx.fillRect(i * cell - 1, 0, 2, size);
		ctx.fillRect(0, i * cell - 1, size, 2);
	}
	ctx.fillStyle = '#cbc4b4';
	for (const edge of [0, size - 2]) {
		ctx.fillRect(edge, 0, 2, size);
		ctx.fillRect(0, edge, size, 2);
	}
	const map = new CanvasTexture(canvas);
	map.colorSpace = SRGBColorSpace;
	map.wrapS = map.wrapT = RepeatWrapping;
	map.repeat.set(width / section, depth / section);
	map.anisotropy = 8;
	return new MeshStandardMaterial({ map, roughness: FINISHES.site.roughness });
}
