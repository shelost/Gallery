# Sveltebrush 붓

Ink-brush painting and animated East Asian calligraphy on a `<canvas>`, for Svelte 5.

- **Freehand ink brush**: bristle simulation, an ink reservoir that runs dry, wet edges and bleed, and paper tooth. It uses real pen pressure where available and stroke speed otherwise.
- **Animated writing**: type Hanzi/Kanji or Hangul and watch it write itself stroke by stroke, horizontally or in vertical columns, optionally finished with a red seal (낙관).
- **Three traditional brushes**: Center Tip (중봉 中鋒), Side Tip (측봉 側鋒), and Flying White (비백 飛白).
- **Timelapse**: every stroke is recorded as brush input, not pixels. You can replay it on the canvas or export it as an MP4 (or WebM where MP4 recording isn't supported).
- **Procreate-style UI components** (optional): Brush Library, Brush Studio with a live drawing pad, a vertical slider, a colour wheel, and a canvas-rendered Inkstone (벼루). Hover a brush over its ink pool to load it, or drag its meter to set the level.

## Install

```sh
npm install sveltebrush
```

## Quick start

```svelte
<script>
	import { InkCanvas, Inkstone, ColorWheel, BRUSHES } from 'sveltebrush';

	let canvas;
	let ink = $state(1);
	let color = $state('#16110d');
	let strokes = $state(0);
</script>

<div style="height: 100dvh">
	<InkCanvas bind:this={canvas} bind:ink bind:strokes brush={BRUSHES[0]} {color} />
</div>

<Inkstone level={ink} {color} onload={(amount) => canvas.load(amount)} onset={(level) => canvas.dip(level)} />
<ColorWheel bind:value={color} />
<button onclick={() => canvas.write('永')}>Write</button>
<button disabled={!strokes} onclick={() => canvas.play()}>Play timelapse</button>
```

### `<InkCanvas>`

| Prop | | |
| --- | --- | --- |
| `brush` | `BrushPreset` | one of `BRUSHES`, or your own |
| `color` | `string` | ink colour, default `#16110d` |
| `bind:ink` | `number` | live reservoir level, 0–1.5 (above 1 floods) |
| `bind:history` | `{ undo, redo }` | undo/redo depth |
| `bind:strokes` | `number` | strokes recorded for the timelapse |
| `bind:playing` | `boolean` | true while a timelapse is replaying |
| `timelapse` | `boolean` | record strokes, default `true` |
| `infinite` | `boolean` | re-dip on every stroke |
| `onresize` | `({ width, height }) => void` | called after the paper is resized |

Methods (`bind:this`):

- Writing: `write(text, { vertical, speed, weight, seal, padding, maxCell })` and `stop()`.
- Paper and history: `clear()`, `undo()`, `redo()`.
- Ink: `load(amount)` and `dip(level)`.
- Timelapse: `play({ duration })` replays on the canvas, and touching the canvas or calling `stopPlayback()` ends it. `timelapse({ duration, resolution, background, onprogress, signal })` resolves to `{ blob, extension }`.
- Image export: `toBlob({ background, type })`.

Video is recorded in real time, so an export takes about as long as the timelapse (12 s by default) plus a short hold on the finished sheet. Keep the tab in the foreground while it renders.

### UI components

| Component | Props |
| --- | --- |
| `<Inkstone>` | `level`, `max`, `color`, `onload(amount)` while hovering the pool, `onset(level)` when the meter is dragged |
| `<ColorWheel>` | `bind:value` hex colour, `swatches` (default `INKS`) |
| `<BrushLibrary>` | `brushes`, `bind:selected` brush id, `onedit(brush)` |
| `<BrushStudio>` | `bind:brush`, `groups` (default `PROPERTIES`), `onreset`, `onclose` |
| `<Slider>` | `bind:value`, `min`, `max`, `step`, `label`, `hint`, `orientation`, `format` |

Set the Inkstone's size with the `--size` CSS variable (default `96px`).

### Engine only

The components are thin wrappers. `Surface`, `Brush`, `freehand`, `createWriter`, `Tape`, `play` and `renderVideo` work on any canvas:

```js
import { Surface, Brush, Tape, freehand, createWriter, renderVideo, preset } from 'sveltebrush';

const surface = new Surface(canvas);
surface.resize();
surface.tape = new Tape();
const brush = new Brush(surface, preset('side'));
const release = freehand(canvas, brush);
await createWriter(surface).write('風林火山', { width: surface.width, height: surface.height, vertical: true });
const video = await renderVideo(surface.tape, { width: surface.width, height: surface.height });
```

## Glyph data

Hangul strokes are generated from Unicode decomposition and ship with the library. Hanzi and Kanji stroke medians are fetched on demand from [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) via jsDelivr. That data is derived from [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) and the Arphic PL fonts, and is licensed under the [Arphic Public License](https://github.com/skishore/makemeahanzi/blob/master/APL/english/ARPHICPL.TXT).

## License

MIT for the library code. Glyph data is licensed as described above.
