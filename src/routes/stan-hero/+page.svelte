<script lang="ts">
  import { onMount } from 'svelte';

  const totalLayers = 8;
  const imagePaths: string[] = Array.from({ length: totalLayers }, (_, i) => `/stan/stan-hero-${i + 1}.png`);

  // Toggle visibility of the second image (stan-hero-2)
  let showSecondImage: boolean = true;

  // Background image and title for the overlay card
  let overlayImageUrl: string = '/stan/woman.jpg';
  let overlayTitle: string = 'Alexandra Silva';

  // Background position (percent)
  let bgPosX = 50;
  let bgPosY = 50;

  // Mapped background size (%) and pixel offsets for accurate overlay mapping
  let bgSizeX = 100;
  let bgSizeY = 100;
  let bgPosXPx = 0;
  let bgPosYPx = 0;

  const OVERLAY_W = 270; // keep in sync with CSS
  const OVERLAY_H = 590;

  type SavedImage = { id: string; url: string; createdAt: number };
  let savedImages: SavedImage[] = [];
  let activeImageId: string | null = null;
  const STORAGE_KEY = 'stanOverlayImagesV1';

  function generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function persistImages() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedImages));
    } catch {}
  }

  function selectImage(img: SavedImage) {
    overlayImageUrl = img.url;
    activeImageId = img.id;
    // reset panning to center for a new image
    bgPosX = 50;
    bgPosY = 50;
    loadNaturalSize(img.url);
  }

  function addImage(url: string) {
    const img: SavedImage = { id: generateId(), url, createdAt: Date.now() };
    savedImages = [img, ...savedImages];
    persistImages();
    selectImage(img);
  }

  function handleUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // data URL
      if (result) addImage(result);
    };
    reader.readAsDataURL(file);

    // reset input so uploading the same file again retriggers change
    input.value = '';
  }

  // natural image size for precise crop positioning
  let natW = 1;
  let natH = 1;
  function loadNaturalSize(url: string) {
    const im = new Image();
    im.onload = () => {
      natW = im.naturalWidth || im.width;
      natH = im.naturalHeight || im.height;
      queueMicrotask(updateCropVars);
    };
    im.src = url;
  }

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SavedImage[] = JSON.parse(raw);
        if (Array.isArray(parsed)) savedImages = parsed;
      }
    } catch {}

    // Ensure default exists and is selectable on first load
    if (!savedImages.length) {
      addImage(overlayImageUrl);
    } else {
      const first = savedImages[0];
      if (first) selectImage(first);
      else loadNaturalSize(overlayImageUrl);
    }

  	window.addEventListener('resize', updateCropVars);
  });

  // Crop/pan & resize interactions
  let cropEl: HTMLElement | null = null;
  let dragging = false;
  let resizing = false;
  let resizeDir: 'nw' | 'ne' | 'sw' | 'se' | null = null;
  let startPoint = { x: 0, y: 0 };
  let startPos = { x: 50, y: 50 };
  let startRect = { left: 0, top: 0, w: 0, h: 0 };

  function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v));
  }

  function onCropDown(e: PointerEvent) {
    if (resizing) return;
    dragging = true;
    startPoint = { x: e.clientX, y: e.clientY };
    startPos = { x: bgPosX, y: bgPosY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHandleDown(dir: 'nw'|'ne'|'sw'|'se', e: PointerEvent) {
    e.stopPropagation();
    resizing = true;
    resizeDir = dir;
    startPoint = { x: e.clientX, y: e.clientY };
    startRect = { left: cropLeft, top: cropTop, w: cropW, h: cropH };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onCropMove(e: PointerEvent) {
    if (dragging && !resizing) {
      if (!cropEl) return;
      const rect = cropEl.getBoundingClientRect();
      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;
      const nx = clamp(startPos.x + (dx / rect.width) * 100, 0, 100);
      const ny = clamp(startPos.y + (dy / rect.height) * 100, 0, 100);
      bgPosX = Math.round(nx);
      bgPosY = Math.round(ny);
      updateCropVars();
      return;
    }

    if (resizing && resizeDir) {
      // maintain overlay aspect ratio
      const R = 27 / 59; // w/h
      const right = startRect.left + startRect.w;
      const bottom = startRect.top + startRect.h;
      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;

      let left = startRect.left;
      let top = startRect.top;
      let w = startRect.w;
      let h = startRect.h;

      const maxW_se = Math.min(dW - left, (dH - top) * R);
      const maxW_ne = Math.min(dW - left, (bottom - oY) * R);
      const maxW_sw = Math.min(right - oX, (dH - top) * R);
      const maxW_nw = Math.min(right - oX, (bottom - oY) * R);

      const MIN_W = 30; // min size for UX

      if (resizeDir === 'se') {
        w = clamp(startRect.w + dx, MIN_W, maxW_se);
        h = w / R;
      }
      if (resizeDir === 'ne') {
        w = clamp(startRect.w + dx, MIN_W, maxW_ne);
        h = w / R;
        top = bottom - h;
      }
      if (resizeDir === 'sw') {
        w = clamp(startRect.w - dx, MIN_W, maxW_sw);
        h = w / R;
        left = right - w;
      }
      if (resizeDir === 'nw') {
        w = clamp(startRect.w - dx, MIN_W, maxW_nw);
        h = w / R;
        left = right - w;
        top = bottom - h;
      }

      // keep within image display bounds
      left = clamp(left, oX, oX + dW - w);
      top = clamp(top, oY, oY + dH - h);

      cropLeft = left;
      cropTop = top;
      cropW = w;
      cropH = h;

      // convert rect center back to position percents
      const centerXRel = ((left - oX) + w / 2) / dW;
      const centerYRel = ((top - oY) + h / 2) / dH;
      bgPosX = Math.round(clamp(centerXRel * 100, 0, 100));
      bgPosY = Math.round(clamp(centerYRel * 100, 0, 100));

      updateCropVars();
    }
  }

  function onCropEnd(e: PointerEvent) {
    if (dragging || resizing) {
      dragging = false;
      resizing = false;
      resizeDir = null;
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
  }

  // Derived crop rectangle (in pixels inside the cropper)
  let cropLeft = 0;
  let cropTop = 0;
  let cropW = 0;
  let cropH = 0;

  // Expose displayed image box in cropper for math
  let dW = 0, dH = 0, oX = 0, oY = 0;

  function updateCropVars() {
    if (!cropEl) return;
    const rect = cropEl.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    const arImg = natW / natH;

    if (cw / ch > arImg) {
      dH = ch;
      dW = ch * arImg;
      oX = (cw - dW) / 2;
      oY = 0;
    } else {
      dW = cw;
      dH = cw / arImg;
      oX = 0;
      oY = (ch - dH) / 2;
    }

    const R = 27 / 59; // overlay-proxy aspect ratio (w/h)

    // Initialize crop size once (if zero) else preserve and clamp
    const MAX_H = Math.min(140, dH);
    const MIN_H = Math.min(80, dH);
    if (cropW === 0 || cropH === 0) {
      const initH = clamp(dH * 0.6, MIN_H, MAX_H);
      cropH = initH;
      cropW = initH * R;
    } else {
      // clamp current size to bounds while keeping ratio
      const maxW = Math.min(dW, dH * R);
      const minW = Math.min(MIN_H * R, maxW);
      cropW = clamp(cropW, minW, maxW);
      cropH = cropW / R;
    }

    const centerX = oX + (bgPosX / 100) * dW;
    const centerY = oY + (bgPosY / 100) * dH;

    cropLeft = clamp(centerX - cropW / 2, oX, oX + dW - cropW);
    cropTop = clamp(centerY - cropH / 2, oY, oY + dH - cropH);

    // map to overlay: compute size% so selection fits overlay exactly
    bgSizeX = (dW / cropW) * 100;
    bgSizeY = (dH / cropH) * 100;

    const BgW = OVERLAY_W * (bgSizeX / 100);
    const BgH = OVERLAY_H * (bgSizeY / 100);
    const relLeft = (cropLeft - oX) / dW;
    const relTop = (cropTop - oY) / dH;
    bgPosXPx = -relLeft * BgW;
    bgPosYPx = -relTop * BgH;
  }

  $: (bgPosX, bgPosY, overlayImageUrl, cropEl), updateCropVars();
</script>

<div class="viewport">
  <div class="controls">
    <label>
      <input type="checkbox" bind:checked={showSecondImage} />
      Show stan-hero-2
    </label>
  </div>

  <div class="workspace">
    <div class="sidebar">
      <label class="upload-btn">
        <input type="file" accept="image/*" on:change={handleUpload} />
        Upload Overlay
      </label>

      <div class="title-field">
        <label>Title</label>
        <input type="text" bind:value={overlayTitle} placeholder="Enter title" />
      </div>

      <div class="thumbs" aria-label="Previously uploaded overlays">
        {#each savedImages as img (img.id)}
          <button
            class="thumb {activeImageId === img.id ? 'active' : ''}"
            style={`background-image:url('${img.url}')`}
            aria-label="Select overlay image"
            on:click={() => selectImage(img)}
          />
        {/each}
      </div>

      <div class="crop-section">
        <div class="cropper {dragging || resizing ? 'grabbing' : ''}"
             bind:this={cropEl}
             on:pointerdown={onCropDown}
             on:pointermove={onCropMove}
             on:pointerup={onCropEnd}
             on:pointerleave={onCropEnd}
             aria-label="Drag to pan; use handles to resize">
          <div class="full-image" style={`background-image:url('${overlayImageUrl}')`}></div>
          <div class="mask"
               style={`--crop-left:${cropLeft}px; --crop-top:${cropTop}px; --crop-w:${cropW}px; --crop-h:${cropH}px;`}></div>
          <div class="frame" style={`left:${cropLeft}px; top:${cropTop}px; width:${cropW}px; height:${cropH}px;`}>
            <div class="handle nw" on:pointerdown={(e)=>onHandleDown('nw', e)}></div>
            <div class="handle ne" on:pointerdown={(e)=>onHandleDown('ne', e)}></div>
            <div class="handle sw" on:pointerdown={(e)=>onHandleDown('sw', e)}></div>
            <div class="handle se" on:pointerdown={(e)=>onHandleDown('se', e)}></div>
          </div>
        </div>
        <div class="pos-readout">{bgPosX}% · {bgPosY}%</div>
      </div>
    </div>

    <div class="stack" role="img" aria-label="Stan hero composite">
      {#each imagePaths as src, idx}
        {#if idx === 1}
          <!-- Image 2 with toggleable visibility -->

          <img
            src={src}
            alt={`Stan hero layer ${idx + 1}`}
            class="layer"
            data-idx={idx + 1}
            style={`z-index:${idx + 1}; opacity:${showSecondImage ? 1 : 0};`}
            decoding="async"
            loading="eager"
          />
          <!-- Rotated overlay positioned immediately above image 2 in the stacking order -->
          <div
            class="overlay-proxy card-transform"
            aria-hidden="true"
            data-idx={idx + 1}
            style={`z-index:${idx + 1}; background-image:url('${overlayImageUrl}'); background-size:${bgSizeX}% ${bgSizeY}%; background-position:${bgPosXPx}px ${bgPosYPx}px;`}
          >
            <div class="overlay-content">
              <h1>{overlayTitle}</h1>
              <p>The man who made Marvel</p>
            </div>
          </div>

        {:else}
          <img
            src={src}
            alt={`Stan hero layer ${idx + 1}`}
            class="layer"
            data-idx={idx + 1}
            style={`z-index:${idx + 1};`}
            decoding="async"
            loading="eager"
          />
        {/if}
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  .viewport {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;

    .controls {
      position: fixed;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      padding: 8px 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      z-index: 1000;
      font: 14px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    }

    .workspace {
      display: flex;
      align-items: flex-start;
      gap: 20px;

      .sidebar {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 220px;

        .upload-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          font-weight: 600;
          user-select: none;
          overflow: hidden;

          input[type="file"] {
            position: absolute;
            inset: 0;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }
        }

        .title-field {
          display: grid;
          gap: 6px;

          label { font-size: 12px; color: #6b7280; }
          input {
            height: 36px;
            padding: 0 10px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            outline: none;
            color: black;
            background: #fff;
          }
        }

        .thumbs {
          display: grid;
          grid-template-columns: repeat(2, 72px);
          gap: 10px;

          .thumb {
            width: 72px;
            height: 72px;
            border-radius: 10px;
            border: 2px solid transparent;
            background-size: cover;
            background-position: 50% 50%;
            background-repeat: no-repeat;
            box-shadow: 0 6px 14px rgba(0,0,0,0.08);
            cursor: pointer;

            &.active {
              border-color: #6366f1;
              box-shadow: 0 0 0 3px rgba(99,102,241,.15);
            }
          }
        }

        .crop-section {
          display: grid;
          gap: 8px;

          .pos-readout { font-size: 12px; color: #6b7280; }

          .cropper {
            position: relative;
            width: 200px;
            aspect-ratio: 1 / 1; // viewport for entire image
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #fff;
            overflow: hidden;
            user-select: none;
            touch-action: none;
            cursor: grab;

            &.grabbing { cursor: grabbing; }

            .full-image {
              position: absolute;
              inset: 0;
              background-size: contain;
              background-position: 50% 50%;
              background-repeat: no-repeat;
            }

            // translucent outside mask with a clear rectangular hole
            .mask { position:absolute; inset:0; pointer-events:none; }
            .mask::before {
              content:"";
              position:absolute;
              left: var(--crop-left);
              top: var(--crop-top);
              width: var(--crop-w);
              height: var(--crop-h);
              box-shadow: 0 0 0 9999px rgba(0,0,0,0.45);
              border: 2px solid #fff;
              border-radius: 16px;
            }

            // visible frame (with resize handles)
            .frame {
              position: absolute;
              border: 2px solid #7c3aed;
              border-radius: 16px;
              pointer-events: none; // allow base drag

              .handle {
                pointer-events: all; // enable on handles
                position: absolute;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #7c3aed;
                border: 2px solid #fff;
                transform: translate(-50%, -50%);
                box-shadow: 0 1px 2px rgba(0,0,0,0.2);
              }
              .nw { left: 0; top: 0; cursor: nwse-resize; }
              .ne { left: 100%; top: 0; cursor: nesw-resize; }
              .sw { left: 0; top: 100%; cursor: nesw-resize; }
              .se { left: 100%; top: 100%; cursor: nwse-resize; }
            }
          }
        }
      }

      .stack {
        position: relative;
        width: 600px;
        height: 600px;
        perspective: 430px;

        .layer,
        .overlay-proxy {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transform-origin: center center;
        }

        .layer { object-fit: contain; pointer-events: none; }

        .card-transform { transform: rotateX(4deg) rotateY(-11deg) rotateZ(9deg) translate(170px, -55px) scale(0.75); }

        .overlay-proxy {
          pointer-events: none;
          border-radius: 20px;
          width: 270px;
          height: 590px;
          box-shadow: 24px 24px 48px 0 rgba(0, 0, 0, 0.1);
          position: relative;

          // background-size/background-position set inline for exact mapping
          background-repeat: no-repeat;
        }

        .overlay-content{
          text-align: center;
          box-sizing: border-box;
          padding: 28px;

          h1{
            width: 100%;
            font-size: 26px;
            font-weight: 600;
            color: #000;
            overflow-wrap: anywhere;
          }
          p{ font-size: 16px; font-weight: 400; color: #000; display: none; }
        }
      }
    }
  }
</style>
