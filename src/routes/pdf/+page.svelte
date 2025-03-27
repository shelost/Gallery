<script>
  import { onMount, onDestroy } from 'svelte';
  import { writable, get, derived } from 'svelte/store';
  import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
  import { fade, fly, scale } from 'svelte/transition';
  import { sineInOut } from 'svelte/easing';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { fabric } from 'fabric';

  // Set the worker source path
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/legacy/build/pdf.worker.min.mjs';

  // Main state variables
  let containerEl;
  let pdfViewer;
  let canvasContainer;
  let pdfPageCanvases = [];
  let fabricCanvases = [];
  let pdfDocument;
  let currentPage = writable(1);
  let totalPages = writable(0);
  let pdfScale = writable(1.0);
  let pdfRotation = writable(0);
  let isLoading = writable(true);
  let loadingProgress = writable(0);
  let viewMode = writable('default'); // default, book, single, double
  let showSidebar = writable(true);
  let isFullscreen = writable(false);
  let autoScrollEnabled = writable(false);
  let autoScrollSpeed = writable(1);
  let pageWidth = 0;
  let pageHeight = 0;
  let currentPdfUrl = null;
  let thumbnails = [];
  let aiSummary = writable('');
  let aiQuery = '';
  let aiResponse = writable('');
  let isProcessingAiRequest = writable(false);
  let activeDrawingTool = writable(null);
  let activeDrawingColor = writable('#FF5722');
  let activeDrawingSize = writable(2);
  let bookScene, bookCamera, bookRenderer, bookControls;
  let bookGroup;
  let bookPages = [];
  let isAnimating = false;

  // Annotation related stores
  const annotations = writable([]);
  const undoStack = writable([]);
  const redoStack = writable([]);

  // Tool options
  const drawingTools = [
    { id: 'highlighter', name: 'Highlighter', icon: 'border_color' },
    { id: 'pen', name: 'Pen', icon: 'edit' },
    { id: 'text', name: 'Text', icon: 'text_fields' },
    { id: 'rectangle', name: 'Rectangle', icon: 'crop_square' },
    { id: 'circle', name: 'Circle', icon: 'circle' },
    { id: 'arrow', name: 'Arrow', icon: 'arrow_right_alt' },
    { id: 'eraser', name: 'Eraser', icon: 'auto_fix_high' }
  ];

  const colorOptions = [
    { id: 'red', color: '#FF5722' },
    { id: 'blue', color: '#2196F3' },
    { id: 'green', color: '#4CAF50' },
    { id: 'yellow', color: '#FFEB3B' },
    { id: 'purple', color: '#9C27B0' },
    { id: 'black', color: '#000000' }
  ];

  // Subscribe to auto-scroll
  $: if ($autoScrollEnabled) {
    startAutoScroll();
  } else {
    stopAutoScroll();
  }

  // Subscribe to view mode changes
  $: if ($viewMode === 'book' && pdfDocument) {
    initBookView();
  } else if (bookRenderer) {
    cleanupBookView();
  }

  // Helper functions
  function getPageViewport(pageNum, scale, rotation) {
    return pdfDocument.getPage(pageNum).then(page => {
      return page.getViewport({ scale: scale || $pdfScale, rotation: rotation || $pdfRotation });
    });
  }

  // Load a sample PDF by default
  onMount(async () => {
    // Only run PDF initialization on client side
    if (typeof window !== 'undefined') {
      // Load a default PDF
      loadPdf('https://arxiv.org/pdf/2303.08774.pdf');

      // Handle resize events
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        cleanupBookView();
      }
    };
  });

  function handleResize() {
    if (get(viewMode) === 'book' && bookRenderer) {
      bookCamera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
      bookCamera.updateProjectionMatrix();
      bookRenderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    }

    // Redraw the current page at the appropriate scale
    if (pdfDocument) {
      renderCurrentPage();
    }
  }

  async function loadPdf(url) {
    if (typeof window === 'undefined') return; // Skip on server

    try {
      isLoading.set(true);
      loadingProgress.set(0);

      // Clear previous state
      pdfPageCanvases = [];
      fabricCanvases = [];
      thumbnails = [];
      currentPdfUrl = url;

      // Load the PDF
      const loadingTask = pdfjsLib.getDocument(url);

      loadingTask.onProgress = progress => {
        if (progress.total) {
          loadingProgress.set(Math.min(100, Math.round(progress.loaded / progress.total * 100)));
        }
      };

      pdfDocument = await loadingTask.promise;
      totalPages.set(pdfDocument.numPages);
      currentPage.set(1);

      // Generate thumbnails for the sidebar
      await generateThumbnails();

      // Render the first page
      renderCurrentPage();

      // Generate AI summary
      generateAiSummary();

      isLoading.set(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      isLoading.set(false);
    }
  }

  async function renderCurrentPage() {
    if (!pdfDocument) return;

    try {
      const pageNum = get(currentPage);
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: get(pdfScale), rotation: get(pdfRotation) });

      pageWidth = viewport.width;
      pageHeight = viewport.height;

      // Get or create canvas for this page
      let canvas = pdfPageCanvases[pageNum - 1];
      let fabricCanvas = fabricCanvases[pageNum - 1];

      if (!canvas) {
        // Create new canvas for PDF rendering
        canvas = document.createElement('canvas');
        canvas.className = 'pdf-page';
        pdfViewer.appendChild(canvas);
        pdfPageCanvases[pageNum - 1] = canvas;

        // Create fabric.js canvas for annotations
        // Create a wrapper element for canvas to avoid DOM issues
        const wrapperDiv = document.createElement('div');
        wrapperDiv.style.position = 'absolute';
        wrapperDiv.style.top = '0';
        wrapperDiv.style.left = '0';
        wrapperDiv.style.pointerEvents = 'none';
        pdfViewer.appendChild(wrapperDiv);

        // Create a second canvas for annotations that overlays the PDF canvas
        const annotationCanvas = document.createElement('canvas');
        annotationCanvas.className = 'annotation-layer';
        wrapperDiv.appendChild(annotationCanvas);

        try {
          fabricCanvas = new fabric.Canvas(annotationCanvas);
          fabricCanvases[pageNum - 1] = fabricCanvas;

          // Setup event listeners for fabric canvas
          setupFabricCanvasEvents(fabricCanvas, pageNum);
        } catch (error) {
          console.error('Error initializing fabric canvas:', error);
        }
      }

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (fabricCanvas) {
        fabricCanvas.setDimensions({
          width: viewport.width,
          height: viewport.height
        });
      }

      // Render PDF content
      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Show only current page canvas
      pdfPageCanvases.forEach((c, i) => {
        if (i === pageNum - 1) {
          c.style.display = 'block';
        } else {
          c.style.display = 'none';
        }
      });

      // Reload any annotations for this page
      loadAnnotationsForPage(pageNum);

      // Update book view if active
      if (get(viewMode) === 'book') {
        updateBookPageTexture(pageNum);
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }

  function setupFabricCanvasEvents(canvas, pageNum) {
    // Add drawing functionality based on active tool
    canvas.isDrawingMode = false;

    // Set better defaults for free drawing
    canvas.freeDrawingBrush.width = 2;
    canvas.freeDrawingBrush.color = get(activeDrawingColor);

    // Track drawing state
    let isDrawing = false;
    let startX, startY;
    let currentShape = null;

    canvas.on('mouse:down', function(options) {
      if (!get(activeDrawingTool)) return;

      isDrawing = true;
      startX = options.pointer.x;
      startY = options.pointer.y;

      const tool = get(activeDrawingTool);
      const color = get(activeDrawingColor);
      const size = get(activeDrawingSize);

      if (tool === 'highlighter') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = size * 10;
        canvas.freeDrawingBrush.opacity = 0.3;
      } else if (tool === 'pen') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = size;
        canvas.freeDrawingBrush.opacity = 1;
      } else if (tool === 'rectangle') {
        canvas.isDrawingMode = false;
        currentShape = new fabric.Rect({
          left: startX,
          top: startY,
          width: 1,
          height: 1,
          fill: 'transparent',
          stroke: color,
          strokeWidth: size
        });
        canvas.add(currentShape);
      } else if (tool === 'circle') {
        canvas.isDrawingMode = false;
        currentShape = new fabric.Circle({
          left: startX,
          top: startY,
          radius: 1,
          fill: 'transparent',
          stroke: color,
          strokeWidth: size
        });
        canvas.add(currentShape);
      } else if (tool === 'arrow') {
        canvas.isDrawingMode = false;
        // Create arrow with line and triangle
        const line = new fabric.Line([startX, startY, startX + 1, startY + 1], {
          stroke: color,
          strokeWidth: size
        });
        currentShape = line;
        canvas.add(line);
      } else if (tool === 'text') {
        canvas.isDrawingMode = false;
        addTextAnnotation(options.pointer, { color, size });
      } else if (tool === 'eraser') {
        canvas.isDrawingMode = false;
        // Find objects under the pointer for erasing
        const objects = canvas.getObjects();
        const toRemove = [];
        for (let i = 0; i < objects.length; i++) {
          if (objects[i].containsPoint(options.pointer)) {
            toRemove.push(objects[i]);
          }
        }
        // Remove found objects
        toRemove.forEach(obj => canvas.remove(obj));
        if (toRemove.length > 0) {
          saveAnnotationState(pageNum);
        }
      }
    });

    canvas.on('mouse:move', function(options) {
      if (!isDrawing || !currentShape) return;

      const tool = get(activeDrawingTool);
      const pointer = options.pointer;

      if (tool === 'rectangle') {
        const width = Math.abs(pointer.x - startX);
        const height = Math.abs(pointer.y - startY);

        currentShape.set({
          left: Math.min(startX, pointer.x),
          top: Math.min(startY, pointer.y),
          width: width,
          height: height
        });
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(pointer.x - startX, 2) +
          Math.pow(pointer.y - startY, 2)
        ) / 2;

        const centerX = (startX + pointer.x) / 2;
        const centerY = (startY + pointer.y) / 2;

        currentShape.set({
          left: centerX - radius,
          top: centerY - radius,
          radius: radius
        });
      } else if (tool === 'arrow') {
        currentShape.set({
          x2: pointer.x,
          y2: pointer.y
        });
      }

      canvas.renderAll();
    });

    canvas.on('mouse:up', function() {
      if (!isDrawing) return;

      isDrawing = false;
      currentShape = null;

      // Save current state to history
      saveAnnotationState(pageNum);

      // Reset drawing mode
      if (get(activeDrawingTool) !== 'pen' && get(activeDrawingTool) !== 'highlighter') {
        canvas.isDrawingMode = false;
      }
    });

    canvas.on('path:created', function() {
      // Save current state to history when a path is created with drawing
      saveAnnotationState(pageNum);
    });
  }

  function addTextAnnotation(pointer, style) {
    const text = new fabric.IText('Click to edit text', {
      left: pointer.x,
      top: pointer.y,
      fontSize: style.size * 10,
      fill: style.color,
      editable: true
    });

    const currentPageValue = get(currentPage);
    fabricCanvases[currentPageValue - 1].add(text);
    fabricCanvases[currentPageValue - 1].setActiveObject(text);
    text.enterEditing();
  }

  function saveAnnotationState(pageNum) {
    if (!fabricCanvases[pageNum - 1]) return;

    const json = fabricCanvases[pageNum - 1].toJSON();

    // Save to annotations store
    annotations.update(all => {
      const newAll = [...all];
      newAll[pageNum - 1] = json;
      return newAll;
    });

    // Add to undo stack
    undoStack.update(stack => {
      const newStack = [...stack];
      newStack.push({ page: pageNum, data: json });
      return newStack.slice(-20); // Limit stack size
    });

    // Clear redo stack on new action
    redoStack.set([]);
  }

  function loadAnnotationsForPage(pageNum) {
    if (!fabricCanvases[pageNum - 1]) return;

    const canvas = fabricCanvases[pageNum - 1];

    // Get annotations for this page
    const pageAnnotations = get(annotations)[pageNum - 1];

    if (pageAnnotations) {
      canvas.loadFromJSON(pageAnnotations, canvas.renderAll.bind(canvas));
    }
  }

  async function generateThumbnails() {
    const numPages = pdfDocument.numPages;
    thumbnails = [];

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnails

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport: viewport
        };

        await page.render(renderContext).promise;
        thumbnails[i - 1] = canvas.toDataURL();
      } catch (error) {
        console.error(`Error generating thumbnail for page ${i}:`, error);
        thumbnails[i - 1] = ''; // Placeholder for failed thumbnail
      }
    }
  }

  function initBookView() {
    if (!canvasContainer || !pdfDocument) return;

    // Clean up previous scene if any
    cleanupBookView();

    // Setup Three.js scene
    bookScene = new THREE.Scene();
    bookScene.background = new THREE.Color(0xf0f0f0);

    bookCamera = new THREE.PerspectiveCamera(
      75,
      canvasContainer.clientWidth / canvasContainer.clientHeight,
      0.1,
      1000
    );
    bookCamera.position.set(0, 0, 5);

    bookRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    bookRenderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    canvasContainer.appendChild(bookRenderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    bookScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    bookScene.add(directionalLight);

    // Create book
    bookGroup = new THREE.Group();
    bookScene.add(bookGroup);

    // Create book pages
    createBookPages();

    // Setup controls
    bookControls = new OrbitControls(bookCamera, bookRenderer.domElement);
    bookControls.enableDamping = true;
    bookControls.dampingFactor = 0.25;
    bookControls.screenSpacePanning = false;
    bookControls.maxPolarAngle = Math.PI / 1.5;
    bookControls.minDistance = 3;
    bookControls.maxDistance = 10;

    // Start animation loop
    animateBookView();
  }

  function createBookPages() {
    const numPages = pdfDocument.numPages;
    const pageThickness = 0.01;
    const pageWidth = 3;
    const pageHeight = 4;

    bookPages = [];

    for (let i = 0; i < numPages; i++) {
      const pageGeometry = new THREE.BoxGeometry(pageWidth, pageHeight, pageThickness);

      // Create a texture for the page content
      const texture = new THREE.TextureLoader().load(thumbnails[i] || 'data:image/png;base64,iVBORw0KG');

      const pageMaterial = [
        new THREE.MeshStandardMaterial({ color: 0xffffff }), // Right edge
        new THREE.MeshStandardMaterial({ color: 0xffffff }), // Left edge
        new THREE.MeshStandardMaterial({ color: 0xffffff }), // Top edge
        new THREE.MeshStandardMaterial({ color: 0xffffff }), // Bottom edge
        new THREE.MeshStandardMaterial({ map: texture }), // Front face (with page content)
        new THREE.MeshStandardMaterial({ color: 0xffffff }) // Back face
      ];

      const page = new THREE.Mesh(pageGeometry, pageMaterial);

      // Position pages
      page.position.z = i * pageThickness - (numPages * pageThickness) / 2;

      bookGroup.add(page);
      bookPages.push(page);
    }
  }

  function updateBookPageTexture(pageNum) {
    if (!bookPages || !bookPages[pageNum - 1]) return;

    // Get the canvas from the rendered page
    const canvas = pdfPageCanvases[pageNum - 1];
    if (!canvas) return;

    // Create a new texture from the canvas
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    // Update the page material
    const page = bookPages[pageNum - 1];
    if (page.material[4].map) {
      page.material[4].map.dispose();
    }
    page.material[4].map = texture;
    page.material[4].needsUpdate = true;
  }

  function animateBookView() {
    if (!bookRenderer || !bookScene || !bookCamera) return;

    const animate = () => {
      if (!bookRenderer) return; // Stop animation if view has changed

      requestAnimationFrame(animate);

      if (bookControls) {
        bookControls.update();
      }

      bookRenderer.render(bookScene, bookCamera);
    };

    animate();
  }

  function cleanupBookView() {
    if (bookRenderer) {
      if (canvasContainer.contains(bookRenderer.domElement)) {
        canvasContainer.removeChild(bookRenderer.domElement);
      }
      bookRenderer.dispose();
      bookRenderer = null;
    }

    if (bookScene) {
      // Dispose of all geometries and materials
      bookScene.traverse(object => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => {
              if (material.map) material.map.dispose();
              material.dispose();
            });
          } else {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        }
      });

      bookScene = null;
    }

    if (bookControls) {
      bookControls.dispose();
      bookControls = null;
    }

    bookCamera = null;
    bookGroup = null;
    bookPages = [];
  }

  // Navigation functions
  function goToPage(pageNum) {
    if (!pdfDocument) return;

    if (pageNum < 1) {
      pageNum = 1;
    } else if (pageNum > get(totalPages)) {
      pageNum = get(totalPages);
    }

    currentPage.set(pageNum);
    renderCurrentPage();

    // Animate page turn in book view
    if (get(viewMode) === 'book') {
      animatePageTurn(pageNum);
    }
  }

  function nextPage() {
    goToPage(get(currentPage) + 1);
  }

  function prevPage() {
    goToPage(get(currentPage) - 1);
  }

  function animatePageTurn(targetPage) {
    if (!bookGroup || isAnimating) return;

    isAnimating = true;

    // Calculate the rotation for each page
    const currentPageValue = get(currentPage);
    const numPages = pdfDocument.numPages;

    // Calculate how many pages to turn
    const pagesToTurn = targetPage - currentPageValue;

    // Simple animation without TWEEN.js
    let start = null;
    const duration = 1000; // 1 second

    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const rotation = progress * Math.PI; // Rotate from 0 to π (180 degrees)

      // Update page rotations
      for (let i = 0; i < numPages; i++) {
        if (i >= currentPageValue - 1 && i < targetPage - 1) {
          // Pages that need to turn
          if (bookPages[i]) {
            bookPages[i].rotation.y = rotation;
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isAnimating = false;
      }
    }

    requestAnimationFrame(step);
  }

  function zoomIn() {
    pdfScale.update(scale => Math.min(scale + 0.1, 3.0));
    renderCurrentPage();
  }

  function zoomOut() {
    pdfScale.update(scale => Math.max(scale - 0.1, 0.5));
    renderCurrentPage();
  }

  function resetZoom() {
    pdfScale.set(1.0);
    renderCurrentPage();
  }

  function rotateClockwise() {
    pdfRotation.update(rotation => (rotation + 90) % 360);
    renderCurrentPage();
  }

  function rotateCounterClockwise() {
    pdfRotation.update(rotation => (rotation - 90 + 360) % 360);
    renderCurrentPage();
  }

  let autoScrollInterval;

  function startAutoScroll() {
    if (autoScrollInterval) clearInterval(autoScrollInterval);

    autoScrollInterval = setInterval(() => {
      if (pdfViewer) {
        pdfViewer.scrollTop += get(autoScrollSpeed) * 2;

        // If reached the bottom of the page and not the last page, go to next page
        if (pdfViewer.scrollTop + pdfViewer.clientHeight >= pdfViewer.scrollHeight &&
            get(currentPage) < get(totalPages)) {
          nextPage();
        }
      }
    }, 50);
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerEl.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      isFullscreen.set(true);
    } else {
      document.exitFullscreen();
      isFullscreen.set(false);
    }
  }

  function downloadPdf() {
    if (currentPdfUrl) {
      const a = document.createElement('a');
      a.href = currentPdfUrl;
      a.download = currentPdfUrl.split('/').pop() || 'download.pdf';
      a.click();
    }
  }

  function downloadAnnotatedPdf() {
    // This would be implemented with a backend service to generate a new PDF with annotations
    alert("Downloading annotated PDF. This feature would typically require a backend service.");
  }

  function undoAnnotation() {
    const stack = get(undoStack);
    if (stack.length === 0) return;

    const item = stack.pop();

    // Save current state to redo stack
    redoStack.update(rs => {
      if (fabricCanvases[item.page - 1]) {
        const currentState = fabricCanvases[item.page - 1].toJSON();
        return [...rs, { page: item.page, data: currentState }];
      }
      return rs;
    });

    // Update undo stack
    undoStack.set(stack);

    // Get previous state
    const prevState = stack.length > 0
      ? stack[stack.length - 1].data
      : { objects: [] };

    // Apply previous state
    if (fabricCanvases[item.page - 1]) {
      fabricCanvases[item.page - 1].loadFromJSON(prevState, () => {
        fabricCanvases[item.page - 1].renderAll();
      });
    }
  }

  function redoAnnotation() {
    const stack = get(redoStack);
    if (stack.length === 0) return;

    const item = stack.pop();

    // Update redo stack
    redoStack.set(stack);

    // Apply state
    if (fabricCanvases[item.page - 1]) {
      fabricCanvases[item.page - 1].loadFromJSON(item.data, () => {
        fabricCanvases[item.page - 1].renderAll();

        // Add to undo stack
        undoStack.update(us => [...us, item]);
      });
    }
  }

  async function generateAiSummary() {
    try {
      isProcessingAiRequest.set(true);

      // This would normally call an AI API
      // For demo purposes, we'll just set a placeholder
      setTimeout(() => {
        aiSummary.set("This is an AI-generated summary of the document. In a real implementation, this would extract key points from the PDF content using an LLM. The summary would highlight the main topics, findings, and conclusions from the document to help readers quickly understand its contents.");
        isProcessingAiRequest.set(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      isProcessingAiRequest.set(false);
    }
  }

  async function handleAiQuerySubmit() {
    if (!aiQuery.trim()) return;

    try {
      isProcessingAiRequest.set(true);

      // This would normally call an AI API with the query and PDF content
      // For demo purposes, we'll just set a placeholder response
      setTimeout(() => {
        aiResponse.set(`This is an AI-generated response to your query: "${aiQuery}". In a real implementation, an LLM would analyze the PDF content and provide a detailed answer to your specific question, with citations to relevant pages in the document.`);
        isProcessingAiRequest.set(false);
        aiQuery = ''; // Clear the input field
      }, 2000);
    } catch (error) {
      console.error('Error processing AI query:', error);
      isProcessingAiRequest.set(false);
    }
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      loadPdf(url);
    }
  }

  // Keyboard shortcuts
  function handleKeyDown(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return; // Don't process shortcuts when typing in input fields
    }

    switch (event.key) {
      case 'ArrowRight':
        nextPage();
        break;
      case 'ArrowLeft':
        prevPage();
        break;
      case '+':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
      case '0':
        resetZoom();
        break;
      case 'r':
        rotateClockwise();
        break;
      case 'f':
        toggleFullscreen();
        break;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<svelte:head>
  <title>PDF Viewer</title>
  <meta name="description" content="Advanced PDF viewer with annotations, 3D book view, and AI capabilities" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</svelte:head>

<!-- Prevent errors by only rendering the interactive UI on the client side -->
{#if typeof window !== 'undefined'}
<main>
  <div id="container" bind:this={containerEl}>

    <div id="left" class="content-card">
      <h1>PDF Viewer</h1>
      <h2>View, annotate, and interact with PDF documents</h2>

      <!-- File upload -->
      <div class="control-section">
        <label for="file-upload" class="file-upload-label">
          <span class="material-icons">upload_file</span>
          Upload PDF
        </label>
        <input id="file-upload" type="file" accept="application/pdf" on:change={handleFileUpload} class="file-upload">
      </div>

      <!-- Page navigation -->
      <div class="control-section">
        <h3>Navigation</h3>
        <div class="control-row">
          <button on:click={prevPage} disabled={$currentPage === 1}>
            <span class="material-icons">navigate_before</span>
          </button>
          <span class="page-indicator">{$currentPage} / {$totalPages}</span>
          <button on:click={nextPage} disabled={$currentPage === $totalPages}>
            <span class="material-icons">navigate_next</span>
          </button>
        </div>
      </div>

      <!-- View options -->
      <div class="control-section">
        <h3>View Mode</h3>
        <div class="view-modes">
          <button class:active={$viewMode === 'default'} on:click={() => viewMode.set('default')}>
            <span class="material-icons">menu_book</span>
            <span>Default</span>
          </button>
          <button class:active={$viewMode === 'book'} on:click={() => viewMode.set('book')}>
            <span class="material-icons">auto_stories</span>
            <span>3D Book</span>
          </button>
          <button class:active={$viewMode === 'single'} on:click={() => viewMode.set('single')}>
            <span class="material-icons">description</span>
            <span>Single</span>
          </button>
          <button class:active={$viewMode === 'double'} on:click={() => viewMode.set('double')}>
            <span class="material-icons">chrome_reader_mode</span>
            <span>Double</span>
          </button>
        </div>
      </div>

      <!-- Auto-scroll control -->
      <div class="control-section">
        <h3>Auto-Scroll</h3>
        <div class="auto-scroll-controls">
          <label class="toggle">
            <input type="checkbox" bind:checked={$autoScrollEnabled}>
            <span class="toggle-slider"></span>
            <span class="toggle-label">Enabled</span>
          </label>

          <div class="speed-control">
            <span>Speed:</span>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              bind:value={$autoScrollSpeed}
              disabled={!$autoScrollEnabled}
            >
          </div>
        </div>
      </div>

      <!-- Page thumbnails (conditionally shown on mobile) -->
      <div class="page-thumbnails-compact">
        {#if thumbnails.length > 0}
          <div class="thumbnails-scroll">
            {#each thumbnails as thumb, i}
              <div
                class="thumbnail"
                class:active={$currentPage === i + 1}
                on:click={() => goToPage(i + 1)}
              >
                <img src={thumb} alt={`Page ${i + 1}`}>
                <span class="page-num">{i + 1}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div id="content" class="content-card">
      {#if $isLoading}
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading PDF... {$loadingProgress}%</div>
        </div>
      {:else}
        <!-- PDF Viewer content -->
        <div class="pdf-controls">
          <div class="pdf-tools">
            <button on:click={zoomOut} title="Zoom Out">
              <span class="material-icons">zoom_out</span>
            </button>
            <span>{Math.round($pdfScale * 100)}%</span>
            <button on:click={zoomIn} title="Zoom In">
              <span class="material-icons">zoom_in</span>
            </button>
            <button on:click={resetZoom} title="Reset Zoom">
              <span class="material-icons">search</span>
            </button>
            <div class="separator"></div>
            <button on:click={rotateCounterClockwise} title="Rotate Left">
              <span class="material-icons">rotate_left</span>
            </button>
            <button on:click={rotateClockwise} title="Rotate Right">
              <span class="material-icons">rotate_right</span>
            </button>
            <div class="separator"></div>
            <button on:click={downloadPdf} title="Download Original">
              <span class="material-icons">download</span>
            </button>
            <button on:click={downloadAnnotatedPdf} title="Download with Annotations">
              <span class="material-icons">save</span>
            </button>
            <div class="separator"></div>
            <button on:click={toggleFullscreen} title="Fullscreen">
              <span class="material-icons">{$isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
          </div>

          {#if $viewMode !== 'book'}
            <div class="annotation-tools">
              {#each drawingTools as tool}
                <button
                  class:active={$activeDrawingTool === tool.id}
                  on:click={() => activeDrawingTool.set($activeDrawingTool === tool.id ? null : tool.id)}
                  title={tool.name}
                >
                  <span class="material-icons">{tool.icon}</span>
                </button>
              {/each}

              <div class="separator"></div>

              <div class="color-picker">
                {#each colorOptions as color}
                  <button
                    class="color-option"
                    class:active={$activeDrawingColor === color.color}
                    on:click={() => activeDrawingColor.set(color.color)}
                    style="background-color: {color.color}"
                    title={color.id}
                  ></button>
                {/each}
              </div>

              <div class="separator"></div>

              <div class="size-picker">
                <button
                  class:active={$activeDrawingSize === 1}
                  on:click={() => activeDrawingSize.set(1)}
                  title="Small"
                >S</button>
                <button
                  class:active={$activeDrawingSize === 2}
                  on:click={() => activeDrawingSize.set(2)}
                  title="Medium"
                >M</button>
                <button
                  class:active={$activeDrawingSize === 3}
                  on:click={() => activeDrawingSize.set(3)}
                  title="Large"
                >L</button>
              </div>

              <div class="separator"></div>

              <button on:click={undoAnnotation} title="Undo">
                <span class="material-icons">undo</span>
              </button>
              <button on:click={redoAnnotation} title="Redo">
                <span class="material-icons">redo</span>
              </button>
            </div>
          {/if}
        </div>

        <div class="pdf-view-container" bind:this={canvasContainer}>
          <div class="pdf-viewer" bind:this={pdfViewer}>
            <!-- PDF pages will be rendered here by JavaScript -->
          </div>
        </div>
      {/if}
    </div>

    <div id="right" class="content-card">
      <!-- Page thumbnails -->
      <div class="page-thumbnails">
        <h3>Pages</h3>
        {#if thumbnails.length > 0}
          <div class="thumbnails-scroll">
            {#each thumbnails as thumb, i}
              <div
                class="thumbnail"
                class:active={$currentPage === i + 1}
                on:click={() => goToPage(i + 1)}
              >
                <img src={thumb} alt={`Page ${i + 1}`}>
                <span class="page-num">{i + 1}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- AI features -->
      <div class="ai-section">
        <h3>AI Assistant</h3>

        <!-- Summary toggle -->
        <details class="summary-details">
          <summary>Document Summary</summary>
          <div class="summary-content">
            {#if $isProcessingAiRequest}
              <div class="loading-indicator">Generating summary...</div>
            {:else}
              <p>{$aiSummary}</p>
            {/if}
          </div>
        </details>

        <!-- Question input -->
        <div class="query-section">
          <textarea
            placeholder="Ask a question about this document..."
            bind:value={aiQuery}
            disabled={$isProcessingAiRequest}
          ></textarea>
          <button
            on:click={handleAiQuerySubmit}
            disabled={!aiQuery || $isProcessingAiRequest}
          >
            <span class="material-icons">send</span>
          </button>
        </div>

        <!-- Response -->
        {#if $aiResponse}
          <div class="response-section" in:fly={{ y: 20, duration: 300 }}>
            <h4>Answer</h4>
            <p>{$aiResponse}</p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <footer>
    Designed with ♥ for your document viewing needs
  </footer>
</main>
{:else}
<div class="loading">
  <p>Loading PDF viewer...</p>
</div>
{/if}

<style lang="scss">
  :global(:root) {
    --app-background: #f5f5f7;
    --card-background: #ffffff;
    --text-primary: #1d1d1f;
    --text-secondary: #86868b;
    --accent: #0071e3;
    --border-radius: 12px;
    --shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  main {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.5rem;
    color: var(--text-secondary);
  }

  .control-section {
    margin: 20px 0;

    h3 {
      margin-bottom: 12px;
    }

    .control-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .page-indicator {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }
  }

  .view-modes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;

    button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      transition: 0.2s ease;
      box-shadow: none;

      &:hover {
        background: rgba(0, 0, 0, 0.08);
      }

      &.active {
        background: #030025;
        color: white;
      }

      .material-icons {
        font-size: 20px;
        margin-bottom: 4px;
      }

      span:not(.material-icons) {
        font-size: 12px;
        font-weight: 500;
      }
    }
  }

  .auto-scroll-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .toggle {
      display: flex;
      align-items: center;
      cursor: pointer;

      input[type="checkbox"] {
        display: none;
      }

      .toggle-slider {
        position: relative;
        width: 40px;
        height: 20px;
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 20px;
        transition: 0.2s ease;
        margin-right: 8px;

        &:before {
          content: "";
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: 0.2s ease;
        }
      }

      input:checked + .toggle-slider {
        background-color: #030025;

        &:before {
          transform: translateX(20px);
        }
      }

      .toggle-label {
        font-size: 14px;
        font-weight: 500;
      }
    }

    .speed-control {
      display: flex;
      align-items: center;
      gap: 8px;

      span {
        font-size: 14px;
        font-weight: 500;
        min-width: 50px;
      }

      input[type="range"] {
        flex: 1;
      }
    }
  }

  .file-upload-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: #030025;
    color: white;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: 0.2s ease;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3), inset -1px 2px 3px rgba(255, 255, 255, 0.3);

    &:hover {
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.4), inset -1px 2px 3px rgba(255, 255, 255, 0.3);
    }

    .material-icons {
      font-size: 18px;
    }
  }

  .file-upload {
    display: none;
  }

  .page-thumbnails {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    h3 {
      margin-bottom: 12px;
    }

    .thumbnails-scroll {
      flex-grow: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 8px;
      -ms-overflow-style: none;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
    }

    .thumbnail {
      position: relative;
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid transparent;
      transition: 0.2s ease;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: scale(1.02);
      }

      &.active {
        border-color: #030025;
      }

      img {
        width: 100%;
        height: auto;
        display: block;
      }

      .page-num {
        position: absolute;
        bottom: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-top-left-radius: 6px;
      }
    }
  }

  .page-thumbnails-compact {
    display: none;
    margin-top: 20px;

    .thumbnails-scroll {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;
      -ms-overflow-style: none;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        height: 0;
        display: none;
      }
    }

    .thumbnail {
      flex: 0 0 60px;
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid transparent;
      transition: 0.2s ease;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      position: relative;

      &:hover {
        transform: scale(1.05);
      }

      &.active {
        border-color: #030025;
      }

      img {
        width: 100%;
        height: auto;
        display: block;
      }

      .page-num {
        position: absolute;
        bottom: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-top-left-radius: 6px;
      }
    }
  }

  .pdf-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 16px 0;
    flex-wrap: wrap;
    gap: 16px;

    .pdf-tools, .annotation-tools {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      button {
        background: rgba(0, 0, 0, 0.05);
        color: var(--text-primary);
        border-radius: 8px;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.2s ease;
        box-shadow: none;

        &:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        &.active {
          background: #030025;
          color: white;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .material-icons {
          font-size: 20px;
        }
      }

      span:not(.material-icons) {
        font-size: 14px;
        padding: 0 6px;
        font-weight: 500;
      }

      .separator {
        width: 1px;
        height: 24px;
        background: rgba(0, 0, 0, 0.1);
        margin: 0 4px;
      }

      .color-picker {
        display: flex;
        gap: 4px;

        .color-option {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid transparent;

          &.active {
            border-color: #030025;
            transform: scale(1.1);
          }
        }
      }

      .size-picker {
        display: flex;
        gap: 4px;

        button {
          font-size: 12px;
          font-weight: 600;
          width: 24px;
          height: 24px;
        }
      }
    }
  }

  .pdf-view-container {
    position: relative;
    height: calc(100% - 60px);
    overflow: hidden;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.03);
  }

  .pdf-viewer {
    width: 100%;
    height: 100%;
    overflow: auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: relative;

    canvas.pdf-page {
      margin: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      position: relative;
      z-index: 1;
    }

    .annotation-layer {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 2;
      pointer-events: auto;
    }

    // Fabric canvas specific styling
    .canvas-container {
      position: absolute !important;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      pointer-events: auto;
    }
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    z-index: 10;

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: #030025;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    .loading-text {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .ai-section {
    margin-top: 20px;

    h3 {
      margin-bottom: 12px;
    }

    .summary-details {
      margin-bottom: 16px;

      summary {
        cursor: pointer;
        font-weight: 500;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        transition: 0.2s ease;

        &:hover {
          background: rgba(0, 0, 0, 0.08);
        }
      }

      .summary-content {
        margin-top: 12px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
        font-size: 14px;
        line-height: 1.5;
      }
    }

    .query-section {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      textarea {
        flex: 1;
        resize: none;
        height: 80px;
        padding: 12px;
        border: none;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.05);
        font-family: var(--font-body);
        font-size: 14px;

        &:focus {
          outline: none;
          background: rgba(0, 0, 0, 0.08);
        }
      }

      button {
        align-self: flex-end;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #030025;
        color: white;
        border-radius: 10px;
        transition: 0.2s ease;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
        }

        &:disabled {
          background: rgba(0, 0, 0, 0.2);
          transform: none;
          box-shadow: none;
        }
      }
    }

    .response-section {
      background: #f9f9fc;
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;

      h4 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #030025;
      }

      p {
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-primary);
      }
    }

    .loading-indicator {
      text-align: center;
      padding: 12px;
      font-style: italic;
      color: var(--text-secondary);
    }
  }

  footer {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.2px;
    color: rgba(0, 0, 0, 0.5);
    margin-top: 48px;
  }

  /* Make the UI responsive */
  @media (max-width: 1200px) {
    #container {
      flex-direction: column;
      height: auto;
      width: 95%;
      margin: 20px auto;
      gap: 20px;
    }

    #left, #right, #content {
      width: 100%;
    }

    #left {
      order: 1;
    }

    #content {
      order: 2;
      height: 70vh;
    }

    #right {
      order: 3;
    }

    .page-thumbnails {
      display: none;
    }

    .page-thumbnails-compact {
      display: block;
    }
  }
</style>
