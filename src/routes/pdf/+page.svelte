<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  // Store for PDF document
  const pdfDoc = writable(null);
  const pageNum = writable(1);
  const pageCount = writable(0);
  const scale = writable(1.5);
  const isLoading = writable(false);
  const error = writable(null);

  // DOM elements
  let canvas;
  let dropArea;
  let fileInput;
  let pdfjs; // PDF.js library instance

  // Initialize PDF.js
  onMount(async () => {
    try {
      // Import PDF.js dynamically (only on client-side)
      const pdfjsLib = await import('pdfjs-dist');
      const pdfjsViewer = await import('pdfjs-dist/web/pdf_viewer');

      // Set worker path
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

      pdfjs = pdfjsLib;

      // Set up the file drop event handlers
      setupDropArea();
    } catch (err) {
      error.set(`Failed to load PDF.js: ${err.message}`);
    }
  });

  // Setup drop area event handlers
  function setupDropArea() {
    if (!dropArea) return;

    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.add('active');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.remove('active');
      }, false);
    });

    dropArea.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file && file.type === 'application/pdf') {
        loadPdfFromFile(file);
      } else {
        error.set('Please drop a valid PDF file.');
      }
    }, false);
  }

  // Handle file input change
  function handleFileInputChange(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      loadPdfFromFile(file);
    } else {
      error.set('Please select a valid PDF file.');
    }
  }

  // Load PDF from file
  async function loadPdfFromFile(file) {
    try {
      error.set(null);
      isLoading.set(true);

      const fileReader = new FileReader();

      fileReader.onload = async function() {
        try {
          const typedArray = new Uint8Array(this.result);
          const loadingTask = pdfjs.getDocument({ data: typedArray });

          const pdf = await loadingTask.promise;
          pdfDoc.set(pdf);
          pageCount.set(pdf.numPages);
          pageNum.set(1);

          renderPage(1);
        } catch (err) {
          error.set(`Error loading PDF: ${err.message}`);
        } finally {
          isLoading.set(false);
        }
      };

      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      error.set(`Error reading file: ${err.message}`);
      isLoading.set(false);
    }
  }

  // Render PDF page
  async function renderPage(num) {
    if (!$pdfDoc) return;

    try {
      isLoading.set(true);

      // Get page
      const page = await $pdfDoc.getPage(num);

      // Set viewport
      const viewport = page.getViewport({ scale: $scale });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render page
      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
      };

      await page.render(renderContext).promise;

      isLoading.set(false);
    } catch (err) {
      error.set(`Error rendering page ${num}: ${err.message}`);
      isLoading.set(false);
    }
  }

  // Navigation functions
  function prevPage() {
    if ($pageNum <= 1) return;
    pageNum.update(num => num - 1);
  }

  function nextPage() {
    if ($pageNum >= $pageCount) return;
    pageNum.update(num => num + 1);
  }

  function zoomIn() {
    scale.update(s => s + 0.25);
  }

  function zoomOut() {
    scale.update(s => Math.max(0.5, s - 0.25));
  }

  // Watch for page number changes
  $: if ($pageNum && $pdfDoc) {
    renderPage($pageNum);
  }

  // Watch for scale changes
  $: if ($scale && $pdfDoc) {
    renderPage($pageNum);
  }

  function updateCameraAnglesFromCamera() {
    // Calculate angles from camera...

    // Update stores directly
    if (Math.abs(xDegrees - currentX) >= 0.5) cameraRotationXStore.set(xDegrees);
    if (Math.abs(yDegrees - currentY) >= 0.5) cameraRotationYStore.set(yDegrees);
    if (Math.abs(zDegrees - currentZ) >= 0.5) cameraRotationZStore.set(zDegrees);
  }
</script>

<svelte:head>
  <title>PDF Viewer</title>
  <meta name="description" content="Upload and view PDF files" />
</svelte:head>

<main>
  <div class="container">
    <h1>PDF Viewer</h1>
    <p class="description">Upload a PDF file or drop it below to view it</p>

    <div class="upload-container">
      <div
        class="drop-area"
        bind:this={dropArea}
        class:active={false}
        class:has-pdf={$pdfDoc}
      >
        {#if !$pdfDoc && !$isLoading}
          <div class="drop-message">
            <div class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="64" width="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <p>Drag and drop a PDF file here</p>
            <p>- or -</p>
            <label class="file-input-label">
              Choose a file
              <input
                type="file"
                accept="application/pdf"
                bind:this={fileInput}
                on:change={handleFileInputChange}
              />
            </label>
          </div>
        {/if}

        {#if $isLoading}
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading PDF...</p>
          </div>
        {/if}

        {#if $error}
          <div class="error">
            <p>{$error}</p>
            <button on:click={() => error.set(null)}>Dismiss</button>
          </div>
        {/if}

        {#if $pdfDoc && !$isLoading}
          <div class="pdf-container">
            <div class="pdf-controls">
              <div class="page-controls">
                <button on:click={prevPage} disabled={$pageNum <= 1}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>

                <span>Page {$pageNum} of {$pageCount}</span>

                <button on:click={nextPage} disabled={$pageNum >= $pageCount}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>

              <div class="zoom-controls">
                <button on:click={zoomOut} disabled={$scale <= 0.5}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>

                <span>{Math.round($scale * 100)}%</span>

                <button on:click={zoomIn}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>
              </div>

              <button class="new-file-btn" on:click={() => { pdfDoc.set(null); error.set(null); }}>
                Upload New File
              </button>
            </div>

            <div class="canvas-container">
              <canvas bind:this={canvas}></canvas>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</main>

<style lang="scss">
  main {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
    background-color: #f5f7fa;
  }

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #2d3748;
    text-align: center;
  }

  .description {
    color: #4a5568;
    max-width: 600px;
    text-align: center;
    margin-bottom: 2rem;
  }

  .upload-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .drop-area {
    width: 100%;
    min-height: 300px;
    border: 3px dashed #cbd5e0;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
    transition: all 0.3s ease;
    padding: 2rem;
    position: relative;

    &.active {
      border-color: #4299e1;
      background-color: #ebf8ff;
    }

    &.has-pdf {
      min-height: 600px;
      border-style: solid;
    }
  }

  .drop-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    color: #4a5568;

    .icon {
      color: #a0aec0;
      margin-bottom: 1rem;
    }

    p {
      margin: 0.5rem 0;
    }
  }

  .file-input-label {
    background-color: #4299e1;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 1rem;
    font-weight: 600;
    transition: background-color 0.2s;

    &:hover {
      background-color: #3182ce;
    }

    input[type="file"] {
      display: none;
    }
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-left-color: #4299e1;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }

  .error {
    background-color: #fed7d7;
    color: #c53030;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;

    button {
      margin-top: 0.5rem;
      background-color: #c53030;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      cursor: pointer;

      &:hover {
        background-color: #9b2c2c;
      }
    }
  }

  .pdf-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .pdf-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background-color: #edf2f7;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .page-controls, .zoom-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    span {
      font-size: 0.9rem;
      color: #4a5568;
      min-width: 80px;
      text-align: center;
    }

    button {
      background-color: #e2e8f0;
      border: none;
      border-radius: 6px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s;
      color: #4a5568;

      &:hover:not(:disabled) {
        background-color: #cbd5e0;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .new-file-btn {
    background-color: #4299e1;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;

    &:hover {
      background-color: #3182ce;
    }
  }

  .canvas-container {
    width: 100%;
    display: flex;
    justify-content: center;
    overflow: auto;
    max-height: 70vh;
    background-color: #e2e8f0;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);

    canvas {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      background-color: white;
    }
  }
</style>