<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

  let containerEl;
  let renderer;
  let scene;
  let camera;
  let controls;
  let model; // The currently active 3D model in the scene
  let screenMaterial;
  let canvasTexture;
  let screenshotCanvas;
  let uploadedImage = null;
  let isLoading = true;
  let loadingProgress = 0;
  let currentModelType = "phone"; // Track which model is active

  // Camera angle variables
  let cameraRotationX = 0;
  let cameraRotationY = 0;
  let cameraRotationZ = 0;

  // Separate flags for different interaction types
  let isUserInteracting = false;
  let isAdjustingSliders = false;
  let isUpdatingFromCamera = false; // New flag to track updates originating from the camera

  // Monitor changes to camera angles and update the 3D view
  $: {
    if (camera && controls && !isAdjustingSliders && !isUpdatingFromCamera) {
      // Only update camera if the values change and we're not already adjusting sliders
      // or we're not already updating from the camera
      updateCameraRotation(cameraRotationX, cameraRotationY, cameraRotationZ);
    }
  }

  // Models configuration - makes it easy to add new models in the future
  const availableModels = [
    {
      id: "block",
      name: "Block",
      description: "Simple block model of an iPhone"
    },
    {
      id: "phone",
      name: "Phone",
      description: "Alternative model name, same as block model"
    }
    // To add a new model, just add a new entry here with a unique id, name, and description
  ];

  onMount(() => {
      initThreeJS();

    // Initialize with white screen
    createWhiteScreenTexture();

    // Load model after texture is created
    loadModel(currentModelType);

    // Then load wallpaper.png as default image
    loadDefaultWallpaper();

      return () => {
        // Cleanup
        if (renderer) renderer.dispose();
        if (scene) scene.clear();
      };
  });

  function createWhiteScreenTexture() {
    // Create a canvas with white background
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match iPhone aspect ratio (19.5:9)
    canvas.width = 1170;
    canvas.height = Math.round(canvas.width * (19.5/9)); // Approximately 2535

    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple border for debugging (can be removed in production)
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Update the texture
    canvasTexture.image = canvas;
    canvasTexture.needsUpdate = true;

    console.log("Standard white screen texture created");
  }

  function initThreeJS() {
    // Setup scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    // Add a debug helper for visibility during development
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Setup camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 2.5); // More zoomed-in initial position

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    containerEl.appendChild(renderer.domElement);

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, 0.5, -1);
    scene.add(directionalLight2);

    // Setup controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 7;

    // Store initial camera orientation for detecting rotation changes
    let lastCameraQuaternion = new THREE.Quaternion();

    // Add event listeners for orbit controls
    controls.addEventListener('start', () => {
      isUserInteracting = true;
      // Store initial orientation when interaction starts
      lastCameraQuaternion.copy(camera.quaternion);
    });

    controls.addEventListener('end', () => {
      isUserInteracting = false;

      // Force an update of slider values from camera when interaction ends
      updateCameraAnglesFromCamera();

      // Reset the stored quaternion
      lastCameraQuaternion.copy(camera.quaternion);
    });

    // During camera movement, detect significant changes and update
    controls.addEventListener('change', () => {
      if (!isAdjustingSliders) {
        // Check if camera orientation has changed significantly
        const quaternionDiff = new THREE.Quaternion().copy(camera.quaternion);
        quaternionDiff.premultiply(lastCameraQuaternion.clone().invert());

        // Convert to axis-angle to measure the rotation amount
        const angle = 2 * Math.acos(Math.abs(quaternionDiff.w));

        // If the change is significant, update the sliders
        if (angle > 0.01) {
          updateCameraAnglesFromCamera();
          // Update the last quaternion
          lastCameraQuaternion.copy(camera.quaternion);
        }
      }
    });

    // Setup texture for iPhone screen
    canvasTexture = new THREE.Texture();
    screenMaterial = new THREE.MeshBasicMaterial({
      map: canvasTexture,
      color: 0xffffff,
      side: THREE.FrontSide
    });

    console.log("Screen material created");

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Create screenshot canvas
    screenshotCanvas = document.createElement('canvas');

    // Create initial texture - white screen
    const initialCanvas = document.createElement('canvas');
    const ctx = initialCanvas.getContext('2d');
    initialCanvas.width = 512;
    initialCanvas.height = 1024;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, initialCanvas.width, initialCanvas.height);

    // Start animation loop
    onWindowResize()
    animate();
  }

  function onWindowResize() {
    // Update camera aspect ratio and renderer size
    camera.aspect = containerEl.clientWidth / containerEl.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
  }

  function loadModel(modelType) {
    // Ensure we have a valid model type
    const modelConfig = getModelById(modelType);
    currentModelType = modelConfig.id; // This ensures we have a valid model type

    const loader = new GLTFLoader();

    // List of iPhone model URLs to try in sequence
    const modelUrls = [
      // iPhone 13/14 model
      'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/iphone-13/model.gltf',
      // iPhone 12 Pro model
      'https://modelviewer.dev/shared-assets/models/iphone.glb',
      // iPhone 15 Pro Max model
      'https://raw.githubusercontent.com/pmndrs/market-assets/master/models/iphone-15/model.gltf',
      // iPhone X model
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/IPhone/glTF/IPhone.gltf',
      // Google Poly iPhone model
      'https://storage.googleapis.com/poly-public-assets/iphone/iphone.glb'
    ];

    // Function to handle the successful loading of a model
    function onModelLoaded(gltf) {
      model = gltf.scene;

      // Scale and position the model
      model.scale.set(2, 2, 2); // Larger scale for better visibility
      model.rotation.y = Math.PI;

      // Center the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x = -center.x;
      model.position.y = -center.y;
      model.position.z = -center.z;
      scene.add(model);

      // Position camera at ideal distance from model
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.2; // Reduced from 1.5 to 1.2 for a more zoomed-in view

      // Set the camera position
      camera.position.z = cameraZ;
      // Reset controls target to the center of the model
      controls.target.set(0, 0, 0);
      controls.update();

      // Update camera angle variables to match the initial position
      updateCameraAnglesFromCamera();

      console.log("Successfully loaded iPhone model");

      // Find the screen mesh - using more generic detection
      let screenFound = false;
      model.traverse((node) => {
        if (node.isMesh) {
          console.log("Found mesh:", node.name);

          // Try to find screen by name variations
          if (node.name.toLowerCase().includes('screen') ||
              node.name.toLowerCase().includes('display') ||
              node.name.toLowerCase().includes('glass') ||
              node.name.toLowerCase().includes('lcd')) {
            console.log("Applying screen material to:", node.name);
            node.material = screenMaterial;
            screenFound = true;
          }
        }
      });

      // If no screen found by name, try to find it by geometry
      if (!screenFound) {
        // Use a for...of loop approach to enable proper breaking
        const meshes = [];

        // First collect all meshes
        model.traverse((node) => {
          if (node.isMesh && node.geometry && node.geometry.attributes && node.geometry.attributes.position) {
            meshes.push(node);
          }
        });

        // Then process them in a way that allows breaking
        for (const node of meshes) {
          // Simple check for flat surface (this is a heuristic)
          const positions = node.geometry.attributes.position.array;
          const count = positions.length / 3;

          if (count > 100) { // Only check larger meshes
            let minZ = Infinity;
            let maxZ = -Infinity;

            for (let i = 0; i < count; i++) {
              const z = positions[i * 3 + 2];
              minZ = Math.min(minZ, z);
              maxZ = Math.max(maxZ, z);
            }

            // If the surface is relatively flat and large
            if (maxZ - minZ < 0.1) {
              console.log("Found potential screen by geometry:", node.name);
              node.material = screenMaterial;
              screenFound = true;
              break; // This is now a valid break statement
            }
          }
        }
      }

      isLoading = false;
    }

    // Function to handle progress updates
    function onProgress(xhr) {
      loadingProgress = Math.round((xhr.loaded / xhr.total) * 100);
    }

    // Create a fallback model if all else fails
    function createFallbackModel() {
      // Get the valid model configuration
      const modelConfig = getModelById(currentModelType);
      console.log(`Creating ${modelConfig.name} (${modelConfig.id}) iPhone model`);

      // Always use the block model for simplicity and reliability
      const newModel = createBlockModel();

      // Ensure texture is properly initialized
      if (canvasTexture.image) {
        console.log("Ensuring texture is applied to the new model");
        canvasTexture.needsUpdate = true;
      } else {
        console.log("No texture found, creating initial white screen");
        createWhiteScreenTexture();
      }

      return newModel;
    }

    // Create the block model (original rectangular shape)
    function createBlockModel() {
      const phoneWidth = 0.75;
      const phoneHeight = phoneWidth * 19.5/9;
      const phoneDepth = 0.08;
      const bezelSize = 0.04;

      // Create phone body - simple box geometry
      const phoneGeometry = new THREE.BoxGeometry(phoneWidth, phoneHeight, phoneDepth);
      const phoneMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
      specular: 0x555555,
      shininess: 30
    });
      const phoneBody = new THREE.Mesh(phoneGeometry, phoneMaterial);
      phoneBody.name = "blockBody";

      // Create phone screen with even bezels all around
      const screenWidth = phoneWidth - (bezelSize * 2);
      const screenHeight = phoneHeight - (bezelSize * 2);

      const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
      const screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.z = phoneDepth/2 + 0.001; // Position slightly above body surface
      screen.name = "blockScreen";

    // Create phone group
      const phoneGroup = new THREE.Group();
      phoneGroup.name = "block";
      phoneGroup.add(phoneBody);
      phoneGroup.add(screen);

      // Position camera
      positionCameraForModel(phoneGroup);

      return phoneGroup;
    }

    // Helper function to position camera for a model
    function positionCameraForModel(phoneGroup) {
      const box = new THREE.Box3().setFromObject(phoneGroup);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.2; // Reduced from 1.5 to 1.2 for a more zoomed-in view

      // Set the camera position
      camera.position.z = cameraZ;
      // Reset controls target to the center of the model
      controls.target.set(0, 0, 0);
      controls.update();
    }

    // Try loading models sequentially
    function tryLoadModel(index) {
      if (index >= modelUrls.length) {
        // All models failed, use fallback
        console.log(`All model URLs failed, using fallback ${currentModelType} model`);
        model = createFallbackModel();
    scene.add(model);
        isLoading = false;
        return;
      }

      const modelConfig = getModelById(currentModelType);
      console.log(`Trying to load ${modelConfig.name} model from URL: ${modelUrls[index]}`);

      loader.load(
        modelUrls[index],
        (gltf) => {
          // Set model type name before processing
          gltf.scene.name = currentModelType;
          onModelLoaded(gltf);
        },
        onProgress,
        (error) => {
          console.error(`Error loading ${modelConfig.name} model from ${modelUrls[index]}:`, error);
          // Try the next URL
          tryLoadModel(index + 1);
        }
      );
    }

    // Start trying to load models
    tryLoadModel(0);
  }

  function animate() {
    requestAnimationFrame(animate);

    // Update orbit controls
    controls.update();

    // Only apply explicit camera rotations when:
    // 1. Not adjusting sliders
    // 2. Not updating from camera
    // 3. Not user interacting with controls
    // 4. And no recent manual rotation occurred (checked via the flags)
    if (camera && controls && !isAdjustingSliders && !isUpdatingFromCamera && !isUserInteracting) {
      // Limit the frequency of reapplying rotations to prevent fighting with OrbitControls
      const now = Date.now();
      if (!animate.lastRotationUpdate || now - animate.lastRotationUpdate > 500) {
        // Apply explicit rotations and update the timestamp
        updateCameraRotation(cameraRotationX, cameraRotationY, cameraRotationZ);
        animate.lastRotationUpdate = now;
      }
    }

    // Render the scene
    renderer.render(scene, camera);
  }

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        updateScreenTexture(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function updateScreenTexture(img) {
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match iPhone aspect ratio (19.5:9)
    canvas.width = 1170;
    canvas.height = Math.round(canvas.width * (19.5/9)); // Approximately 2535

    // Fill with white background first
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions to fit image while maintaining aspect ratio
    const scale = Math.min(
      canvas.width / img.width,
      canvas.height / img.height
    );

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    console.log(`Updating screen texture: image=${img.width}x${img.height}, scaled=${scaledWidth}x${scaledHeight}`);

    // Draw the image centered on the canvas
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // Add visible border for debugging (can be removed in production)
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Update the texture
    canvasTexture.image = canvas;
    canvasTexture.needsUpdate = true;

    console.log("Screen texture updated successfully");
  }

  function takeScreenshot() {
    // Render the current view
    renderer.render(scene, camera);

    // Get the image data
    const imgData = renderer.domElement.toDataURL('image/png');

    // Create a download link
    const link = document.createElement('a');
    link.href = imgData;
    link.download = 'iphone-mockup.png';
    link.click();
  }

  // Function to load the default wallpaper
  function loadDefaultWallpaper() {
    const img = new Image();
    img.onload = () => {
      console.log("Default wallpaper loaded successfully");
      uploadedImage = img; // Store as the current image
      updateScreenTexture(img);
    };
    img.onerror = (err) => {
      console.error("Error loading default wallpaper:", err);
      // Fall back to white screen if wallpaper can't be loaded
      createWhiteScreenTexture();
    };
    // Try both relative and absolute paths
    img.src = "wallpaper.png";
  }

  // Function to switch between models
  function switchModel(modelType) {
    // Get the validated model configuration
    const modelConfig = getModelById(modelType);

    // Don't reload if already on this model
    if (modelConfig.id === currentModelType) return;

    console.log(`Switching from ${currentModelType} to ${modelConfig.name} (${modelConfig.id})`);
    isLoading = true;

    // Update current model type
    currentModelType = modelConfig.id;

    // Remember canvas texture state
    const currentTexture = canvasTexture.image;

    // Remove existing model from the scene
    if (model) {
      scene.remove(model);
    }

    // Load the new model
    loadModel(modelConfig.id);

    // Restore texture after model switch
    setTimeout(() => {
      if (currentTexture) {
        console.log("Restoring screen texture after model switch");
        canvasTexture.image = currentTexture;
        canvasTexture.needsUpdate = true;
      } else {
        console.log("No texture to restore, creating white screen");
        createWhiteScreenTexture();
      }
    }, 500); // Small delay to ensure model is loaded
  }

  // Helper function to get model configuration by ID
  function getModelById(modelId) {
    return availableModels.find(model => model.id === modelId) || availableModels[0];
  }

  function updateCameraAnglesFromCamera() {
    if (!camera || !controls) return;

    // Prevent loops by setting a flag
    isUpdatingFromCamera = true;

    // Calculate spherical coordinates from camera position
    const radius = controls.getDistance();

    // Get the vector from target to camera
    const cameraDirection = new THREE.Vector3();
    cameraDirection.subVectors(camera.position, controls.target).normalize();

    // Calculate phi and theta angles
    const phi = Math.acos(cameraDirection.y);
    const theta = Math.atan2(cameraDirection.x, cameraDirection.z);

    // Convert to degrees for the sliders
    // X rotation is 90-phi (in degrees)
    const xDegrees = Math.round(90 - THREE.MathUtils.radToDeg(phi));
    // Y rotation is theta (in degrees)
    const yDegrees = Math.round(THREE.MathUtils.radToDeg(theta));

    // Create view direction vector (from camera to target)
    const viewDir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();

    // Create a clean reference frame
    // World up vector
    const worldUp = new THREE.Vector3(0, 1, 0);

    // Camera right vector (perpendicular to view and world up)
    const idealRight = new THREE.Vector3().crossVectors(worldUp, viewDir).normalize();

    // Camera ideal up vector (perpendicular to view and right)
    const idealUp = new THREE.Vector3().crossVectors(viewDir, idealRight).normalize();

    // Get camera's actual up vector in world space
    const cameraUpWorld = new THREE.Vector3(0, 1, 0);
    cameraUpWorld.applyQuaternion(camera.quaternion);

    // Project camera's up vector onto the plane perpendicular to view direction
    const projectedCameraUp = new THREE.Vector3().copy(cameraUpWorld);
    projectedCameraUp.sub(viewDir.clone().multiplyScalar(cameraUpWorld.dot(viewDir))).normalize();

    // Calculate the signed angle between ideal up and actual projected up
    // First get the raw angle
    const angle = Math.acos(Math.min(1, Math.max(-1, idealUp.dot(projectedCameraUp))));

    // Then determine the sign by seeing which side of the idealRight vector our projected up is on
    const cross = new THREE.Vector3().crossVectors(idealUp, projectedCameraUp);
    const sign = Math.sign(cross.dot(viewDir));

    // Calculate Z degrees and round to nearest integer
    const zDegrees = Math.round(THREE.MathUtils.radToDeg(angle) * sign);

    console.log(`Camera angles extracted: X=${xDegrees}, Y=${yDegrees}, Z=${zDegrees}`);
    console.log(`Debug: angle=${angle.toFixed(2)}, sign=${sign}, ideal up:`, idealUp, 'camera up:', projectedCameraUp);

    // Update rotation values with thresholds
    if (Math.abs(xDegrees - cameraRotationX) >= 0.5) cameraRotationX = xDegrees;
    if (Math.abs(yDegrees - cameraRotationY) >= 0.5) cameraRotationY = yDegrees;
    if (Math.abs(zDegrees - cameraRotationZ) >= 0.5) cameraRotationZ = zDegrees;

    // Reset the flag with minimal delay
    setTimeout(() => {
      isUpdatingFromCamera = false;
    }, 10);
  }

  // Update the camera based on the rotation input values
  function updateCameraRotation(x, y, z) {
    if (!camera || !controls) return;

    // Ensure all values are valid numbers, default to current values if not
    const xVal = !isNaN(parseFloat(x)) ? parseFloat(x) : cameraRotationX;
    const yVal = !isNaN(parseFloat(y)) ? parseFloat(y) : cameraRotationY;
    const zVal = !isNaN(parseFloat(z)) ? parseFloat(z) : cameraRotationZ;

    console.log(`Updating camera rotation: X=${xVal}, Y=${yVal}, Z=${zVal}`);

    try {
      // Step 1: Position the camera based on X and Y rotations (spherical coordinates)
      const radius = controls.getDistance();
      const phi = THREE.MathUtils.degToRad(90 - xVal);
      const theta = THREE.MathUtils.degToRad(yVal);

      const sinPhiRadius = radius * Math.sin(phi);
      camera.position.x = sinPhiRadius * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = sinPhiRadius * Math.cos(theta);

      // Step 2: Create a clean quaternion by looking at the target
      // We'll use this as the base orientation before applying Z rotation
      camera.lookAt(controls.target);
      const lookAtQuaternion = camera.quaternion.clone();

      // Step 3: Apply Z rotation as a rotation around the view direction
      if (Math.abs(zVal) > 0.001) { // Small epsilon to avoid rounding errors
        // Get the view direction vector (camera to target)
        const viewDir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();

        // Create a rotation quaternion for Z rotation around view direction
        const zRad = THREE.MathUtils.degToRad(zVal);
        const zRotation = new THREE.Quaternion().setFromAxisAngle(viewDir, zRad);

        // Apply the Z rotation to our lookAt quaternion
        // This ensures we're always starting from a clean orientation
        camera.quaternion.copy(lookAtQuaternion);
        camera.quaternion.premultiply(zRotation);
      }

      // Update camera matrices
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);

      // Force update controls to sync with new camera position
      controls.update();

      // Render immediately for feedback
      renderer.render(scene, camera);
    } catch (error) {
      console.error("Error updating camera rotation:", error);
    }
  }
</script>

<svelte:head>
  <title>iPhone Mockup Viewer</title>
</svelte:head>

<div id = 'container'>
  <div id = 'mast'>
    <h1>iPhone Mockup Viewer</h1>

    {#if isLoading}
      <div class="loading">
        <div class="progress-bar">
          <div class="progress" style="width: {loadingProgress}%"></div>
        </div>
        <p>Loading model... {loadingProgress}%</p>
      </div>
    {:else}
      <div class="upload-container">
        <label for="image-upload" class="upload-button">
          Upload Design
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          on:change={handleImageUpload}
        />

        {#if uploadedImage}
          <div class="image-preview">
            <img src={uploadedImage.src} alt="Uploaded design" />
          </div>
        {/if}
      </div>

      <div class="instructions">
        <p>Drag to rotate the iPhone</p>
        <p>Scroll to zoom in/out</p>
      </div>

      <div class="model-switcher">
        <h3>Phone Model</h3>
        <div class="model-buttons">
          {#each availableModels as model}
            <button
              class="model-button {currentModelType === model.id ? 'active' : ''}"
              on:click={() => switchModel(model.id)}
              title={model.description}
            >
              {model.name}
            </button>
          {/each}
        </div>
      </div>

      <div class="camera-controls">
        <h3>Camera Angle Controls</h3>
        <div class="control-row">
          <label for="rotationX">X:</label>
          <input
            type="range"
            id="rotationX"
            min="-180"
            max="180"
            step="1"
            bind:value={cameraRotationX}
            on:input={(e) => {
              isAdjustingSliders = true;
              // Parse the value directly from the input event
              const val = parseFloat(e.target.value) || 0;
              // Immediately apply the rotation and render
              updateCameraRotation(val, cameraRotationY, cameraRotationZ);
              // Ensure immediate visual feedback
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
            }}
            on:change={() => {
              // Allow time for the final value to be applied
              setTimeout(() => {
                // Force a render to ensure the view is updated
                if (renderer && scene && camera) {
                  renderer.render(scene, camera);
                }
                isAdjustingSliders = false;
              }, 100);
            }}
          />
          <input
            type="number"
            min="-180"
            max="180"
            bind:value={cameraRotationX}
            on:input={(e) => {
              isAdjustingSliders = true;
              // Parse the value directly from the input event
              const val = parseFloat(e.target.value) || 0;
              // Update the rotation using the explicitly parsed value
              updateCameraRotation(val, cameraRotationY, cameraRotationZ);
              // Ensure immediate visual feedback
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
            }}
            on:change={() => {
              // Force a render to ensure the view is updated
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
              isAdjustingSliders = false;
            }}
          />
        </div>
        <div class="control-row">
          <label for="rotationY">Y:</label>
          <input
            type="range"
            id="rotationY"
            min="-180"
            max="180"
            step="1"
            bind:value={cameraRotationY}
            on:input={(e) => {
              isAdjustingSliders = true;
              // Parse the value directly from the input event
              const val = parseFloat(e.target.value) || 0;
              // Immediately apply the rotation and render
              updateCameraRotation(cameraRotationX, val, cameraRotationZ);
              // Ensure immediate visual feedback
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
            }}
            on:change={() => {
              // Allow time for the final value to be applied
              setTimeout(() => {
                // Force a render to ensure the view is updated
                if (renderer && scene && camera) {
                  renderer.render(scene, camera);
                }
                isAdjustingSliders = false;
              }, 100);
            }}
          />
          <input
            type="number"
            min="-180"
            max="180"
            bind:value={cameraRotationY}
            on:input={(e) => {
              isAdjustingSliders = true;
              // Parse the value directly from the input event
              const val = parseFloat(e.target.value) || 0;
              // Update the rotation using the explicitly parsed value
              updateCameraRotation(cameraRotationX, val, cameraRotationZ);
              // Ensure immediate visual feedback
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
            }}
            on:change={() => {
              // Force a render to ensure the view is updated
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
              isAdjustingSliders = false;
            }}
          />
        </div>
        <div class="control-row">
          <label for="rotationZ">Z:</label>
          <input
            type="range"
            id="rotationZ"
            min="-180"
            max="180"
            step="1"
            bind:value={cameraRotationZ}
            on:input={(e) => {
              isAdjustingSliders = true;
              // Parse the value directly from the input event
              const val = parseFloat(e.target.value) || 0;
              // Immediately apply the rotation and render
              updateCameraRotation(cameraRotationX, cameraRotationY, val);
              // Ensure immediate visual feedback
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
            }}
            on:change={() => {
              // Same approach as X and Y sliders
              setTimeout(() => {
                if (renderer && scene && camera) {
                  renderer.render(scene, camera);
                }
                isAdjustingSliders = false;
              }, 100);
            }}
          />
          <input
            type="number"
            min="-180"
            max="180"
            bind:value={cameraRotationZ}
            on:input={(e) => {
              isAdjustingSliders = true;
              // Parse the value directly from the input event
              const val = parseFloat(e.target.value) || 0;
              // Update the rotation using the explicitly parsed value
              updateCameraRotation(cameraRotationX, cameraRotationY, val);
              // Ensure immediate visual feedback
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
            }}
            on:change={() => {
              // Same approach as X and Y inputs
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
              isAdjustingSliders = false;
            }}
          />
        </div>
        <button class="reset-button" on:click={() => {
          // Reset all rotation values to zero
          cameraRotationX = 0;
          cameraRotationY = 0;
          cameraRotationZ = 0;

          // Position camera along the z-axis at the current distance
          const distance = controls.getDistance();
          camera.position.set(0, 0, distance);

          // Make camera look directly at the target without any Z rotation
          camera.up.set(0, 1, 0); // Reset the up vector to ensure no Z rotation
          camera.lookAt(controls.target);

          // Update the last quaternion to match the reset state
          if (typeof lastCameraQuaternion !== 'undefined') {
            lastCameraQuaternion.copy(camera.quaternion);
          }

          // Update camera matrices
          camera.updateProjectionMatrix();
          camera.updateMatrixWorld(true);

          // Update controls
          controls.update();

          // Render the scene
          renderer.render(scene, camera);
        }}>Reset Camera</button>
      </div>

      <button class="download-button" on:click={takeScreenshot} disabled={!uploadedImage}>
        Download Mockup
      </button>
    {/if}

    <div class="credits">
      <p>Created with SvelteKit & Three.js</p>
    </div>
  </div>

    <div id = 'content'>
  <div class="viewer" bind:this={containerEl}></div>
   </div>
</div>

<style lang="scss">
  .app-container {
    display: flex;
    width: 100%;
    height: 100vh;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .sidebar {
    width: 300px;
    padding: 20px;
    background: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 10;

    @media (max-width: 768px) {
      width: 100%;
      height: auto;
    }

    h1 {
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: 500;
    }
  }

  .viewer {
    flex: 1;
    background: #f5f5f5;
    position: relative;

    height: 80vh;
    aspect-ratio: 1;


    & canvas {
      width: 100% !important;
      height: 100% !important;
      outline: none;
    }
  }

  .loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #eee;
      border-radius: 4px;
      margin-bottom: 10px;
      overflow: hidden;

      .progress {
        height: 100%;
        background: #007aff;
        transition: width 0.3s ease;
      }
    }
  }

  .upload-container {
    margin-bottom: 20px;

    input[type="file"] {
      display: none;
    }
  }

  .upload-button {
    display: block;
    width: 100%;
    padding: 12px;
    background: #007aff;
    color: white;
    text-align: center;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;

    &:hover {
      background: #0056b3;
    }
  }

  .image-preview {
    margin-top: 15px;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 0;
    overflow: hidden;

    height: 100px;
    width: fit-content;

    img {
      height: 100%;
      width: auto;
      display: block;
      padding: 0;
    }
  }

  .instructions {
    margin-bottom: 20px;

    p {
      margin: 8px 0;
      font-size: 14px;
      color: #666;
    }
  }

  .download-button {
    padding: 12px;
    background: #34c759;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #2aa447;
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }

  .credits {
    margin-top: auto;
    font-size: 12px;
    color: #999;
    text-align: center;
  }

  .model-switcher {
    margin-bottom: 20px;

    h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 18px;
      font-weight: 500;
    }
  }

  .model-buttons {
    display: flex;
    gap: 10px;

    .model-button {
      padding: 12px;
      background: #007aff;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #0056b3;
      }

      &.active {
        background: #34c759;
      }
    }
  }

  .camera-controls {
    margin-top: 1.5rem;
  }

  .camera-controls h3 {
    margin-bottom: 1rem;
    color: #333;
  }

  .control-row {
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
    width: 100%;
  }

  .control-row label {
    width: 25px;
    font-weight: bold;
    color: #555;
  }

  .control-row input[type="range"] {
    flex: 1;
    margin: 0 10px;
    height: 8px;
    border-radius: 4px;
    -webkit-appearance: none;
    background: #e0e0e0;
    outline: none;
    opacity: 0.7;
    transition: opacity 0.2s;
    cursor: pointer;
  }

  .control-row input[type="range"]:hover {
    opacity: 1;
  }

  .control-row input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4a90e2;
    cursor: pointer;
  }

  .control-row input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4a90e2;
    cursor: pointer;
  }

  .control-row input[type="number"] {
    width: 60px;
    text-align: center;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .reset-button {
    width: 100%;
    padding: 8px 15px;
    margin-top: 1rem;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
  }

  .reset-button:hover {
    background-color: #357abD;
  }

  /* Touch friendly adjustments for mobile */
  @media (max-width: 768px) {
    .control-row input[type="range"] {
      height: 10px;
    }

    .control-row input[type="range"]::-webkit-slider-thumb {
      width: 20px;
      height: 20px;
    }

    .control-row input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
    }

    .control-row input[type="number"] {
      width: 55px;
      padding: 8px 5px;
      font-size: 1rem;
    }

    .reset-button {
      padding: 10px 15px;
      font-size: 1rem;
    }
  }
</style>