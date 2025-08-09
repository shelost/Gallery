<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  const totalLayers = 8;
  const imagePaths: string[] = Array.from({ length: totalLayers }, (_, i) => `/stan/stan-hero-${i + 1}.png`);

  // Toggle visibility of the second image (stan-hero-2)
  let showSecondImage: boolean = false;

  // Background image and title for the overlay card
  const DEFAULT_IMAGE = '/stan/woman.jpg';
  const DEFAULT_TITLE = 'Alexandra Silva';
  let overlayImageUrl: string = DEFAULT_IMAGE;
  let overlayTitle: string = DEFAULT_TITLE;

  // Foreground content color (for overlay text/icons)
  let contentColor: 'black' | 'white' = 'white';

  // Use CSS cover by default; disable once the user crops/pans
  let useCover: boolean = true;

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

  function restoreDefaults() {
    overlayTitle = DEFAULT_TITLE;
    contentColor = 'white';
    useCover = true;
    bgPosX = 50;
    bgPosY = 50;
    cropW = 0; // re-init size
    cropH = 0;
    overlayImageUrl = DEFAULT_IMAGE;
    // Keep only the default image in storage
    savedImages = [{ id: generateId(), url: DEFAULT_IMAGE, createdAt: Date.now() }];
    persistImages();
    activeImageId = savedImages[0].id;
    loadNaturalSize(overlayImageUrl);
    updateCropVars();
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

    // seed with default if empty
    if (!savedImages.length) {
      savedImages = [{ id: generateId(), url: DEFAULT_IMAGE, createdAt: Date.now() }];
      persistImages();
    }
    const current = savedImages.find((s) => s.url === overlayImageUrl) ?? savedImages[0];
    selectImage(current);

    window.addEventListener('resize', updateCropVars);
  });

  // Computed: show carousel only if at least one custom (non-default) image exists
  $: showCarousel = savedImages.some((s) => s.url !== DEFAULT_IMAGE);

  // Download composite (base stack) as high-res PNG
  let isDownloading = false;
  // reference to the live rendered stack for screenshotting
  let stackEl: HTMLElement | null = null;

  /**
   * Capture the current visual representation of the stack (including overlay-proxy)
   * at high-resolution via html2canvas. We lazily import the library so it
   * doesn’t affect initial bundle size or performance.
   */
  async function downloadStack(scale = 2) {
    if (isDownloading || !stackEl) return;
    isDownloading = true;
    try {
      // Lazy-load html-to-image which preserves CSS transforms more reliably
      const htmlToImage = await import('html-to-image');

      // Fetch Google Font CSS explicitly and pass to html-to-image to avoid
      // cross-origin stylesheet cssRules access while still embedding fonts.
      const FONT_CSS_URLS = [
        'https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&display=swap',
        'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap',
        'https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@200..800;1,200..800&display=swap'
      ];
      const fontEmbedCSS = (
        await Promise.all(
          FONT_CSS_URLS.map((u) =>
            fetch(u, { cache: 'no-store' })
              .then((r) => (r.ok ? r.text() : ''))
              .catch(() => '')
          )
        )
      ).join('\n');

      const dataUrl = await htmlToImage.toPng(stackEl as HTMLElement, {
        cacheBust: true,
        backgroundColor: 'transparent',
        width: 600,
        height: 600,
        pixelRatio: scale,
        fontEmbedCSS,
        skipFonts: false
      });

      const url = dataUrl;
      const a = document.createElement('a');
      const safeTitle = (overlayTitle || 'image')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      a.download = `stan-hero-${safeTitle || 'image'}.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      isDownloading = false;
    }
  }

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
    useCover = false;
    dragging = true;
    startPoint = { x: e.clientX, y: e.clientY };
    startPos = { x: bgPosX, y: bgPosY };
    if (cropEl) cropEl.setPointerCapture(e.pointerId);
  }

  function onHandleDown(dir: 'nw'|'ne'|'sw'|'se', e: PointerEvent) {
    e.stopPropagation();
    useCover = false;
    resizing = true;
    resizeDir = dir;
    startPoint = { x: e.clientX, y: e.clientY };
    startRect = { left: cropLeft, top: cropTop, w: cropW, h: cropH };
    if (cropEl) cropEl.setPointerCapture(e.pointerId);
  }

  function onCropMove(e: PointerEvent) {
    if (dragging && !resizing) {
      if (!cropEl) return;
      const rect = cropEl.getBoundingClientRect();
      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;
      const nx = clamp(startPos.x + (dx / rect.width) * 100, 0, 100);
      const ny = clamp(startPos.y + (dy / rect.height) * 100, 0, 100);
      bgPosX = nx;
      bgPosY = ny;
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

      // Maximum width by staying inside the displayed image box
      const maxW_se = Math.min((oX + dW) - left, ((oY + dH) - top) * R);
      const maxW_ne = Math.min((oX + dW) - left, (bottom - oY) * R);
      const maxW_sw = Math.min(right - oX, ((oY + dH) - top) * R);
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
      bgPosX = clamp(centerXRel * 100, 0, 100);
      bgPosY = clamp(centerYRel * 100, 0, 100);

      updateCropVars();
    }
  }

  function onCropEnd(e: PointerEvent) {
    if (dragging || resizing) {
      dragging = false;
      resizing = false;
      resizeDir = null;
      try { if (cropEl) cropEl.releasePointerCapture(e.pointerId); } catch {}
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

    // When in cover mode, preview should match CSS cover: centered ROI of overlay aspect
    if (useCover) {
      // ROI in original image coordinates
      let roiWImg: number;
      let roiHImg: number;
      if (natW / natH >= R) {
        // image is wider: scale to height, full height visible
        roiHImg = natH;
        roiWImg = natH * R;
      } else {
        // image is taller/narrower: scale to width, full width visible
        roiWImg = natW;
        roiHImg = natW / R;
      }
      // scale into cropper "contain" size
      const t = Math.min(dW / natW, dH / natH);
      cropW = roiWImg * t;
      cropH = roiHImg * t;
      cropLeft = oX + (dW - cropW) / 2;
      cropTop = oY + (dH - cropH) / 2;

      // No need to update bg mapping here (overlay uses cover); exit early
      return;
    }

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
    <!--
  <div class="controls">
    <label>
      <input type="checkbox" bind:checked={showSecondImage} />
      Show stan-hero-2
    </label>
  </div>
  -->

  <div class="workspace">
    <div class="sidebar">
      <!-- Text Section -->
      <div class="section">
        <h3>Text</h3>
        <div class="title-field">
          <input type="text" bind:value={overlayTitle} placeholder="Enter title" />
        </div>

        <div class="toggle-row">
          <label class="switch theme" aria-label="Toggle text color">
            <input type="checkbox" checked={contentColor==='white'} on:change={(e:any)=> contentColor = e.currentTarget.checked ? 'white' : 'black'} />
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">{contentColor === 'white' ? 'White' : 'Black'}</span>
        </div>
      </div>

      <!-- Image Section -->
      <div class="section">
        <h3>Image</h3>
        <label class="upload-btn">
          <input type="file" accept="image/*" on:change={handleUpload} />
          <h2>+ Upload Image</h2>
        </label>

        {#if showCarousel}
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
        {/if}
      </div>

      <!-- Crop Section -->
      <div class="section">
        <h3>Crop</h3>
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
          <div class="pos-readout">{Math.round(bgPosX)}% · {Math.round(bgPosY)}%</div>
        </div>
      </div>

      <button class="link-btn" on:click={restoreDefaults}>Restore Default</button>
    </div>

    <div class="stack" role="img" aria-label="Stan hero composite" bind:this={stackEl}>
      {#each imagePaths as src, idx}
        {#if idx === 1}
          <img
            src={src}
            alt={`Stan hero layer ${idx + 1}`}
            class="layer"
            data-idx={idx + 1}
            style={`z-index:${idx + 1}; opacity:${showSecondImage ? 1 : 0};`}
            decoding="async"
            loading="eager"
          />

          <div
            class="overlay-proxy card-transform"
            aria-hidden="true"
            data-idx={idx + 1}
            style={`z-index:${idx + 1}; background-image:url('${overlayImageUrl}'); ${useCover ? 'background-size: cover; background-position: 50% 50%;' : `background-size:${bgSizeX}% ${bgSizeY}%; background-position:${bgPosXPx}px ${bgPosYPx}px;`} --content-color:${contentColor==='white' ? '#fff' : '#000'}; --icon-filter:${contentColor==='white' ? 'invert(1) brightness(2)' : 'none'};`}
          >
            <div class="overlay-content" class:white={contentColor==='white'}>
              <h1>{overlayTitle}</h1>
              <p>The man who made Marvel</p>
              <div class = 'social-icons'>
                <img class = 'icon' src = 'youtube.svg' alt = 'YouTube' />
                <img class = 'icon' src = 'tiktok.svg' alt = 'TikTok' />
                <img class = 'icon' src = 'twitter.svg' alt = 'YouTube' />
                <img class = 'icon' src = 'icon/linkedin.svg' alt = 'LinkedIn' />
                <img  class = 'icon' src = 'instagram.svg' alt = 'Instagram' />
              </div>
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

  <button class="fab" title="Download high‑res stack" on:click={() => downloadStack(2)} disabled={isDownloading}>

    <h2>
        ⬇ Download
    </h2>

  </button>
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
      gap: 24px;

      .sidebar {
        display: flex;
        flex-direction: column;
        gap: 32px;
        min-width: 280px;
        max-width: 280px;

        .section {
          display: grid;
          gap: 10px;

          h3 { 
                margin: 0;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: .2px; 
                text-transform: uppercase;
                color: #6b7280;
            }
        }

        .toggle-row {
          display: grid;
          grid-template-columns: auto auto 1fr;
          align-items: center;
          gap: 10px;

          .toggle-label { font-size: 12px; color: #6b7280; }

          // Toggle switch (adapted) https://www.w3schools.com/howto/howto_css_switch.asp
          .switch {
            position: relative; display: inline-block; width: 32px; height: 20px;

            input { opacity: 0; width: 0; height: 0; }

            .slider {
              position: absolute; cursor: pointer; inset: 0; border-radius: 30px; transition: .2s;
              background: #000; border: 1px solid #111;

              &::before {
                content: ""; position: absolute; width: 14px; height: 14px; left: 2px; top: 50%; transform: translateY(-50%);
                background: #fff; border-radius: 50%; transition: .2s;
              }
            }

            input:checked + .slider { background: #fff; border-color: #d0d0d0; }
            input:checked + .slider::before { background: #000; transform: translate(12px, -50%); }
          }
        }

        .upload-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 34px;
          padding: 0 12px;
          border-radius: 6px;
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          font-weight: 600;
          user-select: none;
          overflow: hidden;


          h2{
            font-size: 13px;
            font-weight: 550;
            letter-spacing: -.15px;
          }

          input[type="file"] {
            position: absolute;
            inset: 0;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }

          &:hover{
            background: #edf1f9;
          }
        }

        .title-field {
          display: grid;
          gap: 6px;

          label { font-size: 12px; color: #6b7280; }
          input {
            height: 36px;
            padding: 0 10px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            outline: none;
            color: black;
            background: #fff;
          }
        }

        .thumbs {
          display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px;
          .thumb {
            flex: 0 0 auto; width: 48px; height: 48px; border-radius: 6px; border: 2px solid transparent;
            background-size: cover; background-position: center; background-repeat: no-repeat; box-shadow: 0 6px 14px rgba(0,0,0,0.08); cursor: pointer;
            &.active { border-color: #6355FF; }
          }
        }

        .crop-section {
          display: grid;
          gap: 8px;

          .pos-readout {
            font-family: 'Geist', 'Inter', sans-serif; 
            font-size: 12px; 
            font-weight: 500;
            color: #6b7280; 
        }

          .cropper {
            position: relative;
            width: 280px;
            aspect-ratio: 1 / 1; // viewport for entire image
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            box-shadow: -4px 8px 16px rgba(black,0.15);
            background: #fff;
            overflow: hidden;
            user-select: none;
            touch-action: none;
            cursor: grab;

            &.grabbing { cursor: grabbing; }

            .full-image { position: absolute; inset: 0; background-size: contain; background-position: 50% 50%; background-repeat: no-repeat; }

            // translucent outside mask with a clear rectangular hole
            .mask { position:absolute; inset:0; pointer-events:none; }
            .mask::before {
              content:""; position:absolute; left: var(--crop-left); top: var(--crop-top); width: var(--crop-w); height: var(--crop-h);
              box-shadow: 0 0 0 9999px rgba(0,0,0,0.45); border: 2px solid #fff; border-radius: 16px;
            }

            // visible frame (with resize handles)
            .frame {
              position: absolute; border: 2px solid #7c3aed; border-radius: 16px; pointer-events: none; // allow base drag
              .handle { pointer-events: all; position: absolute; width: 12px; height: 12px; border-radius: 50%; background: #7c3aed; border: 2px solid #fff; transform: translate(-50%, -50%); box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
              .nw { left: 0; top: 0; cursor: nwse-resize; } .ne { left: 100%; top: 0; cursor: nesw-resize; }
              .sw { left: 0; top: 100%; cursor: nesw-resize; } .se { left: 100%; top: 100%; cursor: nwse-resize; }
            }
          }
        }

        .link-btn { 
            box-shadow: none;
            appearance: none; 
            background: transparent; 
            border: none; 
            color: #6355FF; 
            font-weight: 600; 
            cursor: pointer;
            text-align: left;
            padding: 0;
            margin: 0;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            font-family: 'Geist', 'Inter', sans-serif;
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

          .overlay-content{
            text-align: center;
            box-sizing: border-box;
            padding: 36px;
            color: var(--content-color, #000);

            &.white{
                filter: drop-shadow(0 12px 16px rgba(black,0.4));
            }

            .social-icons{ margin-top: 18px; display: flex; justify-content: center; gap: 10px; .icon{ width: 24px; filter: var(--icon-filter, none); } }

            h1{ width: 100%; font-size: 28px; font-weight: 600; color: inherit; overflow-wrap: anywhere; }
            p{ font-size: 16px; font-weight: 400; color: inherit; display: none; }
          }
        }
      }
    }

    .fab {
      position: fixed;
      right: 20px;
      bottom: 20px;
      border: none;
      border-radius: 999px;
      padding: 10px 18px;
      background: #6355FF;
      color: #fff;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(black, 0.25);
      h2{
        font-family: 'Geist', 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 550;
        letter-spacing: -.1px;
        color: white !important;
      }
    }
    .fab[disabled] { opacity: .6; cursor: default; }
  }
</style>
