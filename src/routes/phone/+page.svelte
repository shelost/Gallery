<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
  import { writable, derived, get } from 'svelte/store';
  import Header from '$lib/components/Header.svelte';

  let containerEl;
  let renderer;
  let scene;
  let camera;
  let controls;
  let model; // The currently active 3D model in the scene
  let screenMaterial; // Base screen material
  let phoneScreenMaterial; // Phone model specific screen material
  let blockScreenMaterial; // Block model specific screen material
  let canvasTexture;
  let screenshotCanvas;
  let uploadedImage = null; // Current active image
  let wallpapers = []; // Array to hold all available wallpapers (defaults + user uploaded)
  let currentWallpaperIndex = 0; // Index of the active wallpaper
  let isLoading = true;
  let loadingProgress = 0;
  let currentModelType = "iphone"; // Track which model is active

  // Animation variables for image fit transitions
  let isAnimatingFit = false;
  let animStartTime = 0;
  let animDuration = 400; // 400ms for the animation
  let prevScaleFactor = null;
  let targetScaleFactor = null;
  let currentScaleFactor = null;

  // Define default wallpapers
  const DEFAULT_WALLPAPERS = ["wallpaper.png", "wallpaper2.png", "wallpaper3.png"];
  const DEFAULT_WALLPAPER_COUNT = DEFAULT_WALLPAPERS.length;

  // Create stores for camera angles - this is the single source of truth
  const cameraRotationXStore = writable(0);
  const cameraRotationYStore = writable(0);
  const cameraRotationZStore = writable(0);  // Will be updated after camera setup

  // Create a store for image fit mode
  const imageFitMode = writable('fit'); // Default to 'fit' (contain)

  // Create a derived store that combines all three angles
  const cameraAngles = derived(
    [cameraRotationXStore, cameraRotationYStore, cameraRotationZStore],
    ([$x, $y, $z]) => ({ x: $x, y: $y, z: $z })
  );

  // Separate flags for different interaction types
  let isUserInteracting = false;
  let isAdjustingSliders = false;
  let isUpdatingFromCamera = false; // New flag to track updates originating from the camera

  // Module-level variable to track first-time initialization
  let isFirstTimeInitialization = true;

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
    },
    {
      id: "iphone",
      name: "iPhone",
      description: "Real iPhone 16 3D model from GLB file"
    }
    // To add a new model, just add a new entry here with a unique id, name, and description
  ];

  // iPhone color options - based on real iPhone colors
  const iphoneColors = [
    { id: "black", name: "Space Black", color: "#2e2e2e" },
    { id: "white", name: "Silver", color: "#e9e8ed" },
    { id: "blue", name: "Blue", color: "#437691" },
    { id: "pink", name: "Pink", color: "#F2ADDA" },
    { id: "yellow", name: "Yellow", color: "#f2e8ce" },
    { id: "green", name: "Green", color: "#4a8b60" }, // Original color
    { id: "purple", name: "Teal", color: "#9AADF6" },
    { id: "red", name: "Red", color: "#ff0000" }
  ];

  // Current selected iPhone color
  let currentIphoneColor = iphoneColors[6]; // Default to Purple

  // Subscribe to the combined store to update camera when angles change
  let unsubscribeAngles;

  onMount(() => {
    // Initialize stores subscription for camera updates
    unsubscribeAngles = cameraAngles.subscribe(angles => {
      if (camera && controls && !isAdjustingSliders && !isUpdatingFromCamera) {
        console.log(`Store update triggered: X=${angles.x}, Y=${angles.y}, Z=${angles.z}`);
        updateCameraRotation(angles.x, angles.y, angles.z);
      }
    });

    initThreeJS();

    // Initialize with white screen
    createWhiteScreenTexture();

    // Load model after texture is created
    loadModel(currentModelType);

    // Then load all default wallpapers
    loadDefaultWallpapers();

    // Add keyboard listener for testing Z rotation
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Cleanup
      if (renderer) renderer.dispose();
      if (scene) scene.clear();

      // Unsubscribe from the camera angles store
      if (unsubscribeAngles) unsubscribeAngles();

      // Remove keyboard listener
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Keyboard event handler (defined outside onMount for clarity)
  function handleKeyDown(event) {
    if (event.key === 'r') {
      console.log("Rotating camera with test function");
      testRotateCamera();
    }
  }

  function createWhiteScreenTexture() {
    // Create a canvas with white background
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match iPhone aspect ratio (19.5:9)
    canvas.width = 1170;
    canvas.height = Math.round(canvas.width * (19.5/9)); // Approximately 2535

    // Fill with white background
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update the texture
    canvasTexture.image = canvas;
    canvasTexture.needsUpdate = true;
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    console.log("Standard white screen texture created");
  }

  function initThreeJS() {
    // Setup scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Add a debug helper for visibility during development
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'axesHelper'; // Ensure it has a consistent name
    scene.add(axesHelper);

    // Setup camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 2.5); // More zoomed-in initial position

    // Setup renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true, // Enable stencil buffer for screen clipping
      alpha: true
    });
    renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    // Setup controls with enhanced settings for smoother control
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1; // Increased for more responsive feel
    controls.rotateSpeed = 0.8; // Adjusted for better control
    controls.minDistance = 2;
    controls.maxDistance = 7;
    controls.update();

    // Add event listeners for orbit controls with improved handling
    controls.addEventListener('start', () => {
      isUserInteracting = true;
      console.log("User interaction started");
    });

    controls.addEventListener('end', () => {
      isUserInteracting = false;
      console.log("User interaction ended");

      // Force an immediate update of camera angles when interaction ends
      // Make sure we're not already updating from somewhere else
      if (!isAdjustingSliders && !isUpdatingFromCamera) {
        console.log("Updating camera angles after user interaction");
        updateCameraAnglesFromCamera();
      } else {
        // Schedule an update for slightly later if flags are set
        setTimeout(() => {
          if (!isAdjustingSliders && !isUpdatingFromCamera) {
            console.log("Delayed update of camera angles after user interaction");
            updateCameraAnglesFromCamera();
          }
        }, 50);
      }
    });

    // Improved change handler with more frequent updates during camera movement
    controls.addEventListener('change', () => {
      // Only update during user interaction if neither flag is set
      if (!isAdjustingSliders && !isUpdatingFromCamera && isUserInteracting) {
        // Throttle updates during drag to reduce excessive calculations
        if (!controls._throttledUpdateAngles) {
          controls._throttledUpdateAngles = true;

          setTimeout(() => {
            if (isUserInteracting) {
              updateCameraAnglesFromCamera();
            }
            controls._throttledUpdateAngles = false;
          }, 50); // Throttle to 50ms intervals during drag
        }
      }
    });

    // Setup texture for iPhone screen - this will be shared across materials
    canvasTexture = new THREE.Texture();
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    // Create base screen material (for backward compatibility)
    screenMaterial = new THREE.MeshBasicMaterial({
      map: canvasTexture,
      color: 0xffffff,
      side: THREE.FrontSide
    });

    // Create specific materials for each model type
    blockScreenMaterial = new THREE.MeshBasicMaterial({
      map: canvasTexture,
      color: 0xffffff,
      side: THREE.FrontSide
    });

    // Phone model needs stencil properties for rounded corners
    phoneScreenMaterial = new THREE.MeshBasicMaterial({
      map: canvasTexture,
      color: 0xffffff,
      side: THREE.FrontSide
    });

    console.log("Screen materials created for different model types");

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Create screenshot canvas
    screenshotCanvas = document.createElement('canvas');

    // Create initial texture - white screen
    const initialCanvas = document.createElement('canvas');
    const ctx = initialCanvas.getContext('2d');
    initialCanvas.width = 512;
    initialCanvas.height = 1024;
    ctx.fillStyle = '#202020';
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

    console.log(`Loading ${modelConfig.name} (${modelConfig.id}) model...`);

    // For Block and Phone models, use the manually created ones
    // For iPhone model, try to load the GLB file
    if (modelConfig.id === "block" || modelConfig.id === "phone") {
      console.log(`Creating manual ${modelConfig.name} model`);
      model = createFallbackModel();
      scene.add(model);
      isLoading = false;

      // Schedule camera animation after a brief setup period
      setTimeout(() => {
        // Update camera position and angles
        if (camera && controls) {
          updateCameraAnglesFromCamera();
          renderer.render(scene, camera);

          // Start animation immediately after model is ready
          const targetX = -10;
          const targetY = 15;
          const targetZ = -5;
          const duration = 2000;
          animateCameraRotation(targetX, targetY, targetZ, duration);
        }
      }, 100);

      return;
    }

    // For iPhone model, load the GLB file
    console.log("Loading iPhone 16 GLB model...");
    const loader = new GLTFLoader();

    // List of iPhone model URLs to try in sequence
    const modelUrls = [
      // Local iPhone 16 model (prioritized)
      '/3d/iphone_16.glb'
      // Removed other URLs since we only want to use the local model for the iPhone option
    ];

    // Function to handle the successful loading of a model
    function onModelLoaded(gltf) {
      console.log("Model loaded successfully:", gltf);
      model = gltf.scene;

      // Log model information
      console.log("Model structure:", {
        name: gltf.scene.name,
        children: gltf.scene.children.length,
        meshes: gltf.scene.children.filter(child => child.isMesh).length
      });

      // Scale and position the model
      if (currentModelType === "iphone") {
        // Smaller scale for the iPhone model to ensure it's fully visible
        model.scale.set(0.33, 0.33, 0.33); // Significantly reduced scale to better match phone/block models
        // Rotate to show the front (screen) of the phone
        model.rotation.y = 0; // No rotation around Y axis to show the front
      } else {
        // Default scale and rotation for other models
        model.scale.set(2, 2, 2);
        model.rotation.y = Math.PI;
      }

      // Center the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x = -center.x;
      model.position.y = -center.y;
      model.position.z = -center.z;
      scene.add(model);

      // Position camera at ideal distance from model
      const size = box.getSize(new THREE.Vector3());
      console.log("Model size:", {
        width: size.x.toFixed(2),
        height: size.y.toFixed(2),
        depth: size.z.toFixed(2)
      });
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

      // Use a larger multiplier for the iPhone model to ensure it's not too zoomed in
      if (currentModelType === "iphone") {
        cameraZ *= 2.0; // Adjusted camera distance for better comparative size with block/phone models
      } else {
        cameraZ *= 1.2; // Default zoom level for other models
      }

      // Set the camera position
      camera.position.z = cameraZ;

      // For iPhone model, adjust the initial camera position for better framing
      if (currentModelType === "iphone") {
        // Adjust the vertical position to center the phone better
        camera.position.y = 0.25; // Slight adjustment upward if needed

        // Apply the current color to the model - use a longer timeout to ensure the model is fully processed
        setTimeout(() => {
          console.log("Initial color application for iPhone model");
          changeIphoneColor(currentIphoneColor);

          // If needed, try again with a longer delay as a fallback
          setTimeout(() => {
            // Check if any colored parts were found on the first attempt
            if (document.querySelector('.color-option.active')) {
              console.log("Verifying color application - applying selected color again if needed");
              changeIphoneColor(currentIphoneColor);
            }
          }, 500);
        }, 200);
      }

      // Reset controls target to the center of the model
      controls.target.set(0, 0, 0);
      controls.update();

      // Immediately extract and set the initial camera angles
      // This ensures the stores are initialized with correct values
      setTimeout(() => {
        updateCameraAnglesFromCamera();
        console.log(`Initial camera angles set: X=${get(cameraRotationXStore)}, Y=${get(cameraRotationYStore)}, Z=${get(cameraRotationZStore)}`);

        // Start default camera animation
        const targetX = -10;
        const targetY = 15;
        const targetZ = -5;
        const duration = 2000;
        console.log("Starting default camera animation for iPhone model");
        animateCameraRotation(targetX, targetY, targetZ, duration);
      }, 200);

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
              node.name.toLowerCase().includes('lcd') ||
              // Additional names that might be used in the iPhone model
              node.name.toLowerCase().includes('front') ||
              node.name.toLowerCase().includes('face')) {
            console.log("Applying screen material to:", node.name);
            // Create a special material for the iPhone model screen to handle UV differences
            if (currentModelType === "iphone") {
              console.log("Creating special material for iPhone screen");
              const iPhoneScreenMaterial = new THREE.MeshBasicMaterial({
                map: canvasTexture,
                color: 0xffffff,
                side: THREE.FrontSide
              });

              // Fix alignment and orientation issues by examining the geometry
              if (node.geometry && node.geometry.attributes && node.geometry.attributes.uv) {
                console.log("Fixing UVs for iPhone screen");

                // Get the UV array
                const uvAttribute = node.geometry.attributes.uv;
                const uvs = uvAttribute.array;

                // Create a new UV array to modify
                const newUvs = new Float32Array(uvs.length);

                // Analyze the UV range to detect if we need to remap horizontal coordinates
                let minU = 1, maxU = 0;
                for (let i = 0; i < uvs.length; i += 2) {
                  minU = Math.min(minU, uvs[i]);
                  maxU = Math.max(maxU, uvs[i]);
                }

                console.log(`UV Analysis - U range: ${minU.toFixed(3)} to ${maxU.toFixed(3)}`);
                const needsURemapping = (maxU - minU) < 0.9; // If using less than 90% of texture width

                // Flip and adjust UVs to match our expected orientation and scale
                for (let i = 0; i < uvs.length; i += 2) {
                  if (needsURemapping) {
                    // Remap U from its current range to full 0-1 range
                    newUvs[i] = (uvs[i] - minU) / (maxU - minU);
                  } else {
                    newUvs[i] = uvs[i]; // Keep original U if range is already good
                  }
                  // Always flip Y (1 - v to fix upside down)
                  newUvs[i + 1] = 1 - uvs[i + 1];
                }

                // Apply the fixed UVs
                uvAttribute.array = newUvs;
                uvAttribute.needsUpdate = true;
                console.log("Applied UV fixes: vertical flip" + (needsURemapping ? " and horizontal remapping" : ""));
              }

              node.material = iPhoneScreenMaterial;
            } else {
              // Use standard material for other models
              node.material = screenMaterial;
            }
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

              // For the iPhone model, let's also check if it's a large enough surface
              // compared to the overall model size
              const nodeBox = new THREE.Box3().setFromObject(node);
              const nodeSize = nodeBox.getSize(new THREE.Vector3());
              const modelBox = new THREE.Box3().setFromObject(model);
              const modelSize = modelBox.getSize(new THREE.Vector3());

              // If this is a large flat surface (at least 50% of model width and height)
              // it's likely to be the screen
              const isLikelyScreen =
                nodeSize.x > modelSize.x * 0.5 &&
                nodeSize.y > modelSize.y * 0.5;

              if (isLikelyScreen || currentModelType !== "iphone") {
                // Create a special material for the iPhone model screen
                if (currentModelType === "iphone") {
                  console.log("Creating special material for iPhone screen (detected by geometry)");
                  const iPhoneScreenMaterial = new THREE.MeshBasicMaterial({
                    map: canvasTexture,
                    color: 0xffffff,
                    side: THREE.FrontSide
                  });

                  // Fix alignment and orientation issues by examining the geometry
                  if (node.geometry && node.geometry.attributes && node.geometry.attributes.uv) {
                    console.log("Fixing UVs for iPhone screen");

                    // Get the UV array
                    const uvAttribute = node.geometry.attributes.uv;
                    const uvs = uvAttribute.array;

                    // Create a new UV array to modify
                    const newUvs = new Float32Array(uvs.length);

                    // Analyze the UV range to detect if we need to remap horizontal coordinates
                    let minU = 1, maxU = 0;
                    for (let i = 0; i < uvs.length; i += 2) {
                      minU = Math.min(minU, uvs[i]);
                      maxU = Math.max(maxU, uvs[i]);
                    }

                    console.log(`UV Analysis - U range: ${minU.toFixed(3)} to ${maxU.toFixed(3)}`);
                    const needsURemapping = (maxU - minU) < 0.9; // If using less than 90% of texture width

                    // Flip and adjust UVs to match our expected orientation and scale
                    for (let i = 0; i < uvs.length; i += 2) {
                      if (needsURemapping) {
                        // Remap U from its current range to full 0-1 range
                        newUvs[i] = (uvs[i] - minU) / (maxU - minU);
                      } else {
                        newUvs[i] = uvs[i]; // Keep original U if range is already good
                      }
                      // Always flip Y (1 - v to fix upside down)
                      newUvs[i + 1] = 1 - uvs[i + 1];
                    }

                    // Apply the fixed UVs
                    uvAttribute.array = newUvs;
                    uvAttribute.needsUpdate = true;
                    console.log("Applied UV fixes: vertical flip" + (needsURemapping ? " and horizontal remapping" : ""));
                  }

                  node.material = iPhoneScreenMaterial;
                } else {
                  // Use standard material for other models
                  node.material = screenMaterial;
                }
                screenFound = true;
                break;
              }
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

      // Use rounded model for "phone" type, block model for "block" type
      let newModel;
      if (modelConfig.id === "phone") {
        newModel = createRoundedPhoneModel();
      } else {
        newModel = createBlockModel();
      }

      // Ensure texture is properly initialized
      if (canvasTexture.image) {
        console.log("Ensuring texture is applied to the new model");
        canvasTexture.needsUpdate = true;
        canvasTexture.colorSpace = THREE.SRGBColorSpace;
      } else {
        console.log("No texture found, creating initial white screen");
        createWhiteScreenTexture();
      }

      return newModel;
    }

    // Create a rounded phone model that looks more like an iPhone
    function createRoundedPhoneModel() {
      const phoneWidth = 0.75;
      const phoneHeight = phoneWidth * 19.5/9; // iPhone 15/16 aspect ratio
      const phoneDepth = 0.08;
      const bezelSize = 0.04;

      // Define the screen corner radius first
      const screenCornerRadius = 0.08; // Base screen corner radius
      // Then define the phone body corner radius as screen radius + bezel size
      const cornerRadius = screenCornerRadius + bezelSize; // Phone body corner radius

      // -------- IMPROVED APPROACH: Create a true extruded rounded rectangle --------

      // Create a group to hold all phone parts
      const phoneGroup = new THREE.Group();
      phoneGroup.name = "phone";

      // Define dimensions
      const halfWidth = phoneWidth / 2;
      const halfHeight = phoneHeight / 2;
      const halfDepth = phoneDepth / 2;

      // 1. Create the rounded rectangle shape for front and back faces
      const roundedRectShape = new THREE.Shape();

      // Define the bezier control point offset for circular arcs
      const controlPointOffset = cornerRadius * 0.552284; // Mathematical constant for circular approximation

      // Define the path for a rounded rectangle
      // Start at the right side, midpoint
      roundedRectShape.moveTo(halfWidth, 0);

      // Draw to top-right corner
      roundedRectShape.lineTo(halfWidth, halfHeight - cornerRadius);

      // Draw top-right corner with cubic bezier curve
      roundedRectShape.bezierCurveTo(
        halfWidth, halfHeight - cornerRadius + controlPointOffset,
        halfWidth - cornerRadius + controlPointOffset, halfHeight,
        halfWidth - cornerRadius, halfHeight
      );

      // Draw to top-left corner
      roundedRectShape.lineTo(-halfWidth + cornerRadius, halfHeight);

      // Draw top-left corner with cubic bezier curve
      roundedRectShape.bezierCurveTo(
        -halfWidth + cornerRadius - controlPointOffset, halfHeight,
        -halfWidth, halfHeight - cornerRadius + controlPointOffset,
        -halfWidth, halfHeight - cornerRadius
      );

      // Draw to bottom-left corner
      roundedRectShape.lineTo(-halfWidth, -halfHeight + cornerRadius);

      // Draw bottom-left corner with cubic bezier curve
      roundedRectShape.bezierCurveTo(
        -halfWidth, -halfHeight + cornerRadius - controlPointOffset,
        -halfWidth + cornerRadius - controlPointOffset, -halfHeight,
        -halfWidth + cornerRadius, -halfHeight
      );

      // Draw to bottom-right corner
      roundedRectShape.lineTo(halfWidth - cornerRadius, -halfHeight);

      // Draw bottom-right corner with cubic bezier curve
      roundedRectShape.bezierCurveTo(
        halfWidth - cornerRadius + controlPointOffset, -halfHeight,
        halfWidth, -halfHeight + cornerRadius - controlPointOffset,
        halfWidth, -halfHeight + cornerRadius
      );

      // Close the shape
      roundedRectShape.lineTo(halfWidth, 0);

      // 2. Create the extruded geometry
      const extrudeSettings = {
        depth: phoneDepth,
        bevelEnabled: false,
        steps: 1, // Use more steps for smoother edges if needed
        curveSegments: 32 // Higher value for smoother rounded corners
      };

      const phoneGeometry = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);

      // 3. Create material for the phone body with iPhone-like finish
      const phoneMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444, // Darker gray color like iPhone
        specular: 0xAAAAAA, // More pronounced specular highlight
        shininess: 65,    // Higher shininess for metallic appearance
        flatShading: false, // Ensure smooth shading is enabled
        polygonOffset: true, // Helps prevent z-fighting on close surfaces
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });

      // 4. Create the phone body mesh
      const phoneBody = new THREE.Mesh(phoneGeometry, phoneMaterial);
      phoneBody.name = "phoneBody";

      // Center the phone body - Only center on XY plane, not Z
      phoneGeometry.center(); // This centers the geometry on all axes

      // Position the body so its front face is at z=0
      // The extrude geometry is created with depth extending in +Z direction from 0
      phoneBody.position.z = -phoneDepth/2;

      // Add to the phone group
      phoneGroup.add(phoneBody);

      // 5. Create the screen (inset from the body edges by bezel size)
      const screenWidth = phoneWidth - (bezelSize * 2);
      const screenHeight = phoneHeight - (bezelSize * 2);
      // Screen corner radius is now defined at the top of the function
      // const screenCornerRadius = cornerRadius - bezelSize * 0.5; // Slightly smaller corner radius for screen

      // -------- Create a properly clipped screen with stencil buffer --------
      const screenGroup = new THREE.Group();
      screenGroup.name = "screenGroup";

      // 1. Create the actual screen content plane
      const screenContentGeometry = new THREE.PlaneGeometry(
        screenWidth + 0.0002, // Small padding to avoid gaps
        screenHeight + 0.0002
      );
      // Use phone-specific screen material
      const screenContent = new THREE.Mesh(screenContentGeometry, phoneScreenMaterial);
      screenContent.name = "screenContent";

      // 2. Create the rounded screen shape for perfect corners
      const roundedScreenShape = new THREE.Shape();
      const halfScreenWidth = screenWidth / 2;
      const halfScreenHeight = screenHeight / 2;

      // Define the bezier control point offset for screen corners
      const screenControlPointOffset = screenCornerRadius * 0.552284;

      // Draw the rounded screen shape (similar to phone body but smaller)
      roundedScreenShape.moveTo(halfScreenWidth, 0);
      roundedScreenShape.lineTo(halfScreenWidth, halfScreenHeight - screenCornerRadius);
      roundedScreenShape.bezierCurveTo(
        halfScreenWidth, halfScreenHeight - screenCornerRadius + screenControlPointOffset,
        halfScreenWidth - screenCornerRadius + screenControlPointOffset, halfScreenHeight,
        halfScreenWidth - screenCornerRadius, halfScreenHeight
      );
      roundedScreenShape.lineTo(-halfScreenWidth + screenCornerRadius, halfScreenHeight);
      roundedScreenShape.bezierCurveTo(
        -halfScreenWidth + screenCornerRadius - screenControlPointOffset, halfScreenHeight,
        -halfScreenWidth, halfScreenHeight - screenCornerRadius + screenControlPointOffset,
        -halfScreenWidth, halfScreenHeight - screenCornerRadius
      );
      roundedScreenShape.lineTo(-halfScreenWidth, -halfScreenHeight + screenCornerRadius);
      roundedScreenShape.bezierCurveTo(
        -halfScreenWidth, -halfScreenHeight + screenCornerRadius - screenControlPointOffset,
        -halfScreenWidth + screenCornerRadius - screenControlPointOffset, -halfScreenHeight,
        -halfScreenWidth + screenCornerRadius, -halfScreenHeight
      );
      roundedScreenShape.lineTo(halfScreenWidth - screenCornerRadius, -halfScreenHeight);
      roundedScreenShape.bezierCurveTo(
        halfScreenWidth - screenCornerRadius + screenControlPointOffset, -halfScreenHeight,
        halfScreenWidth, -halfScreenHeight + screenCornerRadius - screenControlPointOffset,
        halfScreenWidth, -halfScreenHeight + screenCornerRadius
      );
      roundedScreenShape.lineTo(halfScreenWidth, 0);

      // Create the shape geometry with high segment count for smooth curves
      const roundedScreenGeometry = new THREE.ShapeGeometry(roundedScreenShape, 128);

      // Create stencil material for clipping
      const clipMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        colorWrite: false,
        depthWrite: false,
        stencilWrite: true,
        stencilRef: 1,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilZPass: THREE.ReplaceStencilOp
      });

      // Create the clipping mesh
      const clipMesh = new THREE.Mesh(roundedScreenGeometry, clipMaterial);
      clipMesh.name = "screenClip";
      clipMesh.renderOrder = 0;

      // Set up the screen content mesh to use the stencil
      phoneScreenMaterial.stencilWrite = true;
      phoneScreenMaterial.stencilRef = 1;
      phoneScreenMaterial.stencilFunc = THREE.EqualStencilFunc;
      phoneScreenMaterial.stencilZPass = THREE.KeepStencilOp;
      screenContent.renderOrder = 1;

      // Add everything to the screen group
      screenGroup.add(clipMesh);
      screenGroup.add(screenContent);

      // Position the screen group exactly at the front face of the phone
      // With just a tiny offset to prevent z-fighting
      screenGroup.position.z = 0.001;

      // Add the screen group to the phone
      phoneGroup.add(screenGroup);

      // Position camera for the model
      positionCameraForModel(phoneGroup);

      // Ensure stencil buffer is enabled
      renderer.localClippingEnabled = true;

      console.log("Created iPhone model with extruded rounded rectangle shape and clean flat sides");
      return phoneGroup;
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
      // Use block-specific screen material
      const screen = new THREE.Mesh(screenGeometry, blockScreenMaterial);
      screen.position.z = phoneDepth/2 + 0.001; // Position slightly above body surface
      screen.name = "blockScreen";

      // Create phone group
      const phoneGroup = new THREE.Group();
      phoneGroup.name = "block";
      phoneGroup.add(phoneBody);
      phoneGroup.add(screen);

      // Position camera
      positionCameraForModel(phoneGroup);

      console.log("Created block model with simple screen");
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

      console.log(`Positioning camera for model. Calculated distance: ${cameraZ}`);

      // Set the camera position along z-axis to ensure consistent orientation
      camera.position.set(0, 0, cameraZ);

      // Reset up vector to ensure no accidental Z rotation
      camera.up.set(0, 1, 0);

      // Set controls target to the center of the model
      controls.target.set(0, 0, 0);

      // Look at the target - this creates a default quaternion with no Z rotation
      camera.lookAt(controls.target);

      // Update all matrices and controls
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      controls.update();

      // Immediately extract and set initial camera angles
      // Temporarily disable flags to allow extraction
      const wasAdjusting = isAdjustingSliders;
      const wasUpdating = isUpdatingFromCamera;

      isAdjustingSliders = false;
      isUpdatingFromCamera = false;

      updateCameraAnglesFromCamera();

      // Force the Z rotation to 0 initially
      cameraRotationZStore.set(0);

      // Restore flags
      isAdjustingSliders = wasAdjusting;
      isUpdatingFromCamera = wasUpdating;

      // Log the extracted angles
      console.log(`Initial camera angles: X=${get(cameraRotationXStore)}, Y=${get(cameraRotationYStore)}, Z=${get(cameraRotationZStore)}`);
    }

    // Try loading models sequentially
    function tryLoadModel(index) {
      if (index >= modelUrls.length) {
        // All models failed, use fallback
        console.log(`Failed to load ${currentModelType} model, using fallback model`);
        // For iPhone model, switch to phone model as fallback
        if (currentModelType === "iphone") {
          console.log("Falling back to phone model since iPhone GLB failed to load");
          // Temporarily set to phone model to create the right fallback
          const originalModelType = currentModelType;
          currentModelType = "phone";
          model = createFallbackModel();
          currentModelType = originalModelType; // Restore so UI shows correct selection
        } else {
          model = createFallbackModel();
        }
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
        (progressEvent) => {
          onProgress(progressEvent);
          console.log(`Loading progress for ${modelUrls[index]}: ${Math.round((progressEvent.loaded / progressEvent.total) * 100)}%`);
        },
        (error) => {
          console.error(`Error loading ${modelConfig.name} model from ${modelUrls[index]}:`, error);
          console.log("Error details:", error.message || "No error message available");

          // Try the next URL
          console.log(`Moving to next model URL (${index + 1}/${modelUrls.length})`);
          tryLoadModel(index + 1);
        }
      );
    }

    // Start trying to load models
    tryLoadModel(0);
  }

  function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Simplified animate function:
    // 1. No Z rotation forcing (this was causing erratic behavior)
    // 2. Just render the scene

    // Render the scene
    renderer.render(scene, camera);
  }

  function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Process each uploaded file
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create a new wallpaper object
          const newWallpaper = {
            img: img,
            src: img.src,
            name: file.name || `Upload ${wallpapers.length - DEFAULT_WALLPAPER_COUNT + 1}`,
            isDefault: false
          };

          // Add to wallpapers array
          wallpapers = [...wallpapers, newWallpaper];

          // Make it the active wallpaper
          currentWallpaperIndex = wallpapers.length - 1;
          uploadedImage = img;

          // Update the screen texture
          updateScreenTexture(img);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Reset the input field to allow uploading the same file again
    event.target.value = '';
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

    // Get current image fit mode
    const fitMode = get(imageFitMode);
    console.log(`Updating screen texture with fit mode: ${fitMode}`);

    // Calculate scale factors for both modes
    const coverScale = Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    );

    const fitScale = Math.min(
      canvas.width / img.width,
      canvas.height / img.height
    );

    // If we're starting a new animation
    if (!isAnimatingFit) {
      // Set animation parameters based on current fit mode
      let scale;
      if (fitMode === 'cover') {
        prevScaleFactor = fitScale;  // We're coming from 'fit'
        targetScaleFactor = coverScale;
      } else {
        prevScaleFactor = coverScale; // We're coming from 'cover'
        targetScaleFactor = fitScale;
      }
      currentScaleFactor = prevScaleFactor;

      // Only animate if we have a previous state and it's different
      if (prevScaleFactor !== null && Math.abs(prevScaleFactor - targetScaleFactor) > 0.001) {
        isAnimatingFit = true;
        animStartTime = Date.now();
        animateFitTransition(img, canvas, ctx);
        return; // Exit here as animation will handle the rest
      }
    }

    // If no animation is needed, use the target scale directly
    let scale = fitMode === 'cover' ? coverScale : fitScale;

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    console.log(`Updating screen texture: image=${img.width}x${img.height}, scaled=${scaledWidth}x${scaledHeight}, mode=${fitMode}`);

    // Draw the image on the canvas according to calculated dimensions
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // Add post-processing for the texture if needed
    if (currentModelType === "iphone") {
      console.log("Post-processing texture for iPhone model");
      // No additional processing needed now that we fixed the UVs directly
      // This hook is kept for potential future texture adjustments
    }

    // Update the texture - this affects all materials that use this texture
    canvasTexture.image = canvas;
    canvasTexture.needsUpdate = true;

    // Ensure correct colorspace to match the renderer's output encoding
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    console.log("Screen texture updated successfully for all models");
  }

  // New function to animate the transition between fit modes
  function animateFitTransition(img, canvas, ctx) {
    if (!isAnimatingFit) return;

    const elapsed = Date.now() - animStartTime;
    const progress = Math.min(1, elapsed / animDuration);

    // Easing function for smoother animation (ease-in-out)
    const easedProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Interpolate between previous and target scale
    currentScaleFactor = prevScaleFactor + (targetScaleFactor - prevScaleFactor) * easedProgress;

    // Calculate dimensions
    const scaledWidth = img.width * currentScaleFactor;
    const scaledHeight = img.height * currentScaleFactor;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    // Clear canvas and redraw with current scale
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // Update texture
    canvasTexture.image = canvas;
    canvasTexture.needsUpdate = true;

    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(() => animateFitTransition(img, canvas, ctx));
    } else {
      // Animation complete
      isAnimatingFit = false;
    }
  }

  function takeScreenshot() {
    // Store original renderer and scene settings
    const originalBackgroundColor = scene.background;
    const axesHelper = scene.getObjectByName('axesHelper');
    const axesVisible = axesHelper ? axesHelper.visible : false;

    // Set transparent background
    scene.background = null;

    // Hide axes helper if it exists
    if (axesHelper) {
      axesHelper.visible = false;
    }

    // Make sure alpha is enabled on the renderer
    const originalAlpha = renderer.getClearAlpha();
    renderer.setClearAlpha(0);

    // Render the current view with transparent background
    renderer.render(scene, camera);

    // Get the image data with transparency
    const imgData = renderer.domElement.toDataURL('image/png');

    // Create a download link
    const link = document.createElement('a');
    link.href = imgData;
    link.download = 'iphone-mockup.png';
    link.click();

    // Restore original settings
    scene.background = originalBackgroundColor;
    if (axesHelper) {
      axesHelper.visible = axesVisible;
    }
    renderer.setClearAlpha(originalAlpha);

    // Re-render with original settings
    renderer.render(scene, camera);
  }

  // Function to load the default wallpaper
  function loadDefaultWallpapers() {
    console.log("Loading default wallpapers");

    // Create a promise for each default wallpaper
    const wallpaperPromises = DEFAULT_WALLPAPERS.map((wallpaperPath, index) => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          console.log(`Default wallpaper ${index + 1} loaded successfully: ${wallpaperPath}`);
          resolve({
            img: img,
            src: img.src,
            name: `o${index + 1}`,
            isDefault: true
          });
        };

        img.onerror = (err) => {
          console.error(`Error loading default wallpaper ${index + 1}: ${wallpaperPath}`, err);
          // Resolve with null so we can filter these out later
          resolve(null);
        };

        // Load the image
        img.src = wallpaperPath;
      });
    });

    // Wait for all wallpapers to load (or fail)
    Promise.all(wallpaperPromises).then(loadedWallpapers => {
      // Filter out any nulls (failed loads)
      const validWallpapers = loadedWallpapers.filter(wp => wp !== null);

      // Add successful loads to the wallpapers array
      wallpapers = validWallpapers;

      // If we have any wallpapers, use the first one as default
      if (wallpapers.length > 0) {
        currentWallpaperIndex = 0;
        uploadedImage = wallpapers[0].img;
        updateScreenTexture(uploadedImage);
      } else {
        // If all wallpapers failed to load, create a basic white screen
        console.log("No default wallpapers loaded, creating white screen");
        createWhiteScreenTexture();
      }
    });
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

    // Restore texture after model switch - it's shared between materials
    setTimeout(() => {
      if (currentTexture) {
        console.log("Restoring screen texture after model switch");
        canvasTexture.image = currentTexture;
        canvasTexture.needsUpdate = true;
        canvasTexture.colorSpace = THREE.SRGBColorSpace;
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

    try {
      // Get the current distance from camera to target
      const radius = controls.getDistance();

      // Get the normalized vector from target to camera
      const cameraDirection = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize();

      // -------------------- X and Y ANGLE EXTRACTION --------------------
      // Calculate phi (vertical angle) and theta (horizontal angle)
      // Using the same spherical coordinate system as in updateCameraRotation

      // Vertical angle (phi) - ranges from 0 (top) to 180 (bottom) degrees
      const phi = Math.acos(cameraDirection.y);

      // Horizontal angle (theta) - ranges from -180 to 180 degrees
      const theta = Math.atan2(cameraDirection.x, cameraDirection.z);

      // Convert to degrees for the sliders using exactly the same formulas as in updateCameraRotation
      // X rotation is 90-phi (in degrees) - round to whole number
      const xDegrees = Math.round(90 - THREE.MathUtils.radToDeg(phi));

      // Y rotation is theta (in degrees) - round to whole number
      const yDegrees = Math.round(THREE.MathUtils.radToDeg(theta));

      // -------------------- Z ANGLE EXTRACTION (IMPROVED) --------------------
      // Create a clean "ideal" camera quaternion with no Z rotation
      // that looks from the current position to the target
      const idealUpVector = new THREE.Vector3(0, 1, 0);
      const viewDir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();

      // Compute the right vector for a camera with no Z rotation
      // This is perpendicular to both the view direction and world up
      const idealRightVector = new THREE.Vector3().crossVectors(idealUpVector, viewDir).normalize();

      // Now compute the ideal up vector that's perpendicular to both view and right
      // This gives us the "pure" up vector with no Z rotation
      const pureUpVector = new THREE.Vector3().crossVectors(viewDir, idealRightVector).normalize();

      // Create a matrix from these ortho-normalized vectors
      const idealMatrix = new THREE.Matrix4();
      const xColumn = idealRightVector;
      const yColumn = pureUpVector;
      const zColumn = viewDir.clone().negate(); // Camera looks down negative Z

      idealMatrix.makeBasis(xColumn, yColumn, zColumn);
      const idealQuaternion = new THREE.Quaternion().setFromRotationMatrix(idealMatrix);

      // Compare this ideal quaternion (no Z rotation) with the actual camera quaternion
      const diffQuaternion = new THREE.Quaternion().copy(camera.quaternion);
      const idealQuaternionInverse = new THREE.Quaternion().copy(idealQuaternion).invert();
      diffQuaternion.multiply(idealQuaternionInverse);

      // Extract the rotation angle around the view direction axis
      const actualUp = new THREE.Vector3(0, 1, 0).applyQuaternion(diffQuaternion);

      // Project the actual up vector onto the plane perpendicular to view direction
      const projectedActualUp = new THREE.Vector3().copy(actualUp);
      projectedActualUp.sub(viewDir.clone().multiplyScalar(actualUp.dot(viewDir))).normalize();

      // Calculate angle between this projected up vector and the pure up vector
      let cosAngle = pureUpVector.dot(projectedActualUp);
      cosAngle = Math.max(-1, Math.min(1, cosAngle)); // Clamp to avoid precision errors
      let zAngle = Math.acos(cosAngle);

      // Determine the sign of the angle
      // If the cross product of pure up and projected actual up
      // points in the same direction as view dir, the angle is positive
      const crossProduct = new THREE.Vector3().crossVectors(pureUpVector, projectedActualUp);
      const sign = Math.sign(crossProduct.dot(viewDir));

      // Final Z rotation in degrees - round to nearest degree
      let zDegrees = Math.round(THREE.MathUtils.radToDeg(zAngle) * sign);

      // Normalize Z to -180 to 180 range
      while (zDegrees > 180) zDegrees -= 360;
      while (zDegrees < -180) zDegrees += 360;

      // Special case: If camera was just reset and Z is very close to 0,
      // force it to exactly 0 to prevent tiny offset issues
      if (Math.abs(zDegrees) < 1 && Math.abs(get(cameraRotationZStore)) < 1) {
        zDegrees = 0;
      }

      // Log all Z extractions for debugging
      console.log(`Camera angles extracted: X=${xDegrees}, Y=${yDegrees}, Z=${zDegrees}`);

      // Update stores directly (will trigger subscriptions)
      // Always update values to keep sliders in sync with the view
      const currentX = Math.round(get(cameraRotationXStore));
      const currentY = Math.round(get(cameraRotationYStore));
      const currentZ = Math.round(get(cameraRotationZStore));

      // Update values with a small threshold to avoid jitter
      // Store rounded values to ensure consistency
      if (Math.abs(xDegrees - currentX) >= 1) cameraRotationXStore.set(xDegrees);
      if (Math.abs(yDegrees - currentY) >= 1) cameraRotationYStore.set(yDegrees);
      if (Math.abs(zDegrees - currentZ) >= 1) cameraRotationZStore.set(zDegrees);

    } catch (error) {
      console.error("Error extracting camera angles:", error);
    }

    // Reset the flag with minimal delay
    setTimeout(() => {
      isUpdatingFromCamera = false;
    }, 10);
  }

  // Update the camera based on the rotation input values
  function updateCameraRotation(x, y, z) {
    if (!camera || !controls) return;

    // Prevent feedback loops
    if (isUpdatingFromCamera) return;

    // Ensure all values are valid numbers, default to current values if not
    // Round all values for consistency
    const xVal = !isNaN(parseFloat(x)) ? Math.round(parseFloat(x)) : Math.round(get(cameraRotationXStore));
    const yVal = !isNaN(parseFloat(y)) ? Math.round(parseFloat(y)) : Math.round(get(cameraRotationYStore));
    const zVal = !isNaN(parseFloat(z)) ? Math.round(parseFloat(z)) : Math.round(get(cameraRotationZStore));

    console.log(`Applying camera rotation: X=${xVal}, Y=${yVal}, Z=${zVal}`);

    try {
      // Flag to prevent control updates from overriding our values
      isAdjustingSliders = true;

      // -------------------------------------------------------------
      // APPROACH: Create a completely new camera orientation from scratch
      // -------------------------------------------------------------

      // Step 1: Get the current distance from camera to target
      const radius = controls.getDistance();

      // Step 2: Position camera based on X and Y rotations (spherical coordinates)
      // Convert the slider degrees to radians
      const phi = THREE.MathUtils.degToRad(90 - xVal); // vertical angle
      const theta = THREE.MathUtils.degToRad(yVal);    // horizontal angle

      // Calculate the new camera position
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);

      // Set the new camera position
      camera.position.set(x, y, z);

      // Step 3: Create a basic "look at target" orientation
      // Reset up vector to world up
      camera.up.set(0, 1, 0);
      camera.lookAt(controls.target);

      // Step 4: Apply Z rotation as a direct rotation around view axis
      // Always apply Z rotation logic, even when Z is zero
      const zRad = THREE.MathUtils.degToRad(zVal);

      // Get the view direction (this is our rotation axis)
      const viewAxis = new THREE.Vector3()
        .subVectors(controls.target, camera.position)
        .normalize();

      // Create rotation matrix around view axis
      const rotationMatrix = new THREE.Matrix4().makeRotationAxis(viewAxis, zRad);

      // Get current up vector
      const upVector = new THREE.Vector3(0, 1, 0);

      // Apply rotation to up vector
      upVector.applyMatrix4(rotationMatrix);

      // Set the new up vector
      camera.up.copy(upVector);

      // Re-look at the target with our new up vector
      camera.lookAt(controls.target);

      // Log all Z rotations, even small ones (for debugging)
      console.log(`Applied Z rotation: ${zVal}° with up vector:`, upVector);

      // Step 5: Update all matrices
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);

      // Step 6: Update controls and render
      controls.update();
      renderer.render(scene, camera);

      // Reset the adjusting flag after a delay
      setTimeout(() => {
        isAdjustingSliders = false;
      }, 50);
    } catch (error) {
      console.error("Error updating camera rotation:", error);
      isAdjustingSliders = false;
    }
  }

  function testRotateCamera() {
    if (!camera || !controls) return;

    // Set flags to prevent interference
    isAdjustingSliders = true;
    isUpdatingFromCamera = true;

    // Get the current Z rotation
    const currentZ = Math.round(get(cameraRotationZStore));
    const newZValue = currentZ + 15; // Add 15 degrees to current Z
    console.log(`Test rotation: Adding 15° to Z, from ${currentZ}° to ${newZValue}°`);

    try {
      // Update the Z store with rounded value
      cameraRotationZStore.set(Math.round(newZValue));

      // Reset flags after a small delay
      setTimeout(() => {
        // Apply rotation directly with rounded values
        updateCameraRotation(
          Math.round(get(cameraRotationXStore)),
          Math.round(get(cameraRotationYStore)),
          Math.round(newZValue)
        );

        // Reset the flags
        isUpdatingFromCamera = false;
        isAdjustingSliders = false;

        // Log result
        console.log(`Test rotation applied. New Z value: ${get(cameraRotationZStore)}`);
      }, 10);
    } catch (error) {
      console.error("Error in test rotation:", error);
      isAdjustingSliders = false;
      isUpdatingFromCamera = false;
    }
  }

  // Function to simulate rotation to specific angles
  function simulateRotationToAngles(xAngle, yAngle, zAngle) {
    console.log(`Simulating rotation to X=${xAngle}, Y=${yAngle}, Z=${zAngle}`);

    if (!camera || !controls) return;

    try {
      // Only set isAdjustingSliders flag but NOT isUpdatingFromCamera
      // so that camera updates are not blocked
      isAdjustingSliders = true;

      // Important: Apply the rotation directly to the camera
      // Step 1: Get the current distance from camera to target
      const radius = controls.getDistance();

      // Step 2: Calculate camera position based on X and Y angles
      const phi = THREE.MathUtils.degToRad(90 - xAngle);
      const theta = THREE.MathUtils.degToRad(yAngle);

      // Set new camera position
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.set(x, y, z);

      // Reset up vector
      camera.up.set(0, 1, 0);
      camera.lookAt(controls.target);

      // Apply Z rotation - always apply it, even when Z is zero
      const zRad = THREE.MathUtils.degToRad(zAngle);
      const viewAxis = new THREE.Vector3()
        .subVectors(controls.target, camera.position)
        .normalize();

      const rotationMatrix = new THREE.Matrix4().makeRotationAxis(viewAxis, zRad);
      const upVector = new THREE.Vector3(0, 1, 0);
      upVector.applyMatrix4(rotationMatrix);
      camera.up.copy(upVector);
      camera.lookAt(controls.target);

      // Log all Z rotations, even small ones (for debugging)
      console.log(`Applied Z rotation in simulation: ${zAngle}° with up vector:`, upVector);

      // Update matrices and controls
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      controls.update();

      // Force a render
      renderer.render(scene, camera);

      // Update the store values to match the new camera orientation
      // This will update the sliders
      // Use rounded values for consistency with the sliders
      cameraRotationXStore.set(Math.round(xAngle));
      cameraRotationYStore.set(Math.round(yAngle));
      cameraRotationZStore.set(Math.round(zAngle));

      console.log(`Camera position set to: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`);
      console.log(`Camera up vector: (${camera.up.x.toFixed(4)}, ${camera.up.y.toFixed(4)}, ${camera.up.z.toFixed(4)})`);

      // Reset the flags after a delay
      setTimeout(() => {
        isAdjustingSliders = false;
        console.log("Rotation simulation complete");
      }, 100);
    } catch (error) {
      console.error("Error simulating rotation:", error);
      isAdjustingSliders = false;
    }
  }

  // Function to animate rotation to target angles
  function animateCameraRotation(targetX, targetY, targetZ, duration = 2000) {
    console.log(`Starting animation to angles: X=${targetX}, Y=${targetY}, Z=${targetZ} over ${duration}ms`);

    if (!camera || !controls) return;

    // Round target values for consistency
    targetX = Math.round(targetX);
    targetY = Math.round(targetY);
    targetZ = Math.round(targetZ);

    // Get starting values
    const startX = Math.round(get(cameraRotationXStore));
    const startY = Math.round(get(cameraRotationYStore));
    const startZ = Math.round(get(cameraRotationZStore));

    // Skip animation if we're already at the target values
    if (Math.abs(startX - targetX) < 1 &&
        Math.abs(startY - targetY) < 1 &&
        Math.abs(startZ - targetZ) < 1) {
      console.log("Already at target values, skipping animation");
      return;
    }

    console.log(`Starting from angles: X=${startX}, Y=${startY}, Z=${startZ}`);

    // Calculate how much to change each frame
    const startTime = performance.now(); // More precise timing
    const endTime = startTime + duration;

    // Set flag to prevent interference
    isAdjustingSliders = true;
    isUpdatingFromCamera = true; // Also set this flag to prevent updates during animation

    // Flag for tracking that we're in animation
    console.log("===== ANIMATION STARTED =====");

    // Ensure camera.up is normalized
    camera.up.set(0, 1, 0);

    // Pre-start with a small movement to make animation visible immediately
    const quickStartProgress = 0.05; // 5% of the way instantly
    const initialX = startX + (targetX - startX) * quickStartProgress;
    const initialY = startY + (targetY - startY) * quickStartProgress;
    const initialZ = startZ + (targetZ - startZ) * quickStartProgress;
    simulateRotationToAngles(initialX, initialY, initialZ);

    // Animation function - start on next frame
    requestAnimationFrame(function() {
      animateStep(startTime, endTime);
    });

    // Separate the animation step for clarity
    function animateStep(startTime, endTime) {
      const now = performance.now();
      // If animation is complete
      if (now >= endTime) {
        // Apply final values exactly - use the exact target values
        simulateRotationToAngles(targetX, targetY, targetZ);

        console.log(`===== ANIMATION COMPLETE =====`);
        console.log(`Final camera angles: X=${get(cameraRotationXStore)}, Y=${get(cameraRotationYStore)}, Z=${get(cameraRotationZStore)}`);
        console.log(`Final camera up vector: (${camera.up.x.toFixed(4)}, ${camera.up.y.toFixed(4)}, ${camera.up.z.toFixed(4)})`);

        // CRITICAL: Clear both flags upon completion
        isAdjustingSliders = false;
        isUpdatingFromCamera = false;

        // Force a direct update to ensure stores match what we can see
        // Delay it slightly to ensure the animation has fully completed
        setTimeout(() => {
          // Force the values to match the target exactly in case of floating-point errors
          if (targetZ === 0) {
            // When resetting to zero, explicitly set the up vector
            camera.up.set(0, 1, 0);
            camera.updateMatrixWorld(true);
            controls.update();

            // Force the Z store to exactly 0
            cameraRotationZStore.set(0);
          }

          console.log("Running post-animation check...");
          updateCameraAnglesFromCamera();
        }, 100);
        return;
      }

      // Calculate progress (0 to 1)
      const progress = (now - startTime) / duration;

      // Use easeInOutCubic for smoother motion
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Calculate current values
      const currentX = startX + (targetX - startX) * eased;
      const currentY = startY + (targetY - startY) * eased;
      const currentZ = startZ + (targetZ - startZ) * eased;

      // Apply the rotation without fully completing animation
      simulateRotationToAngles(currentX, currentY, currentZ);

      // Continue animation
      requestAnimationFrame(function() {
        animateStep(startTime, endTime);
      });
    }
  }

  // Function to toggle axes helper visibility
  function toggleAxesHelper() {
    if (!scene) return;

    const axesHelper = scene.getObjectByName('axesHelper');
    if (axesHelper) {
      axesHelper.visible = !axesHelper.visible;
      renderer.render(scene, camera);
    }
  }

  // Function to change the iPhone color
  function changeIphoneColor(colorOption) {
    if (!model || currentModelType !== "iphone") return;

    currentIphoneColor = colorOption;
    console.log(`Changing iPhone color to ${colorOption.name} (${colorOption.color})`);

    // Ensure critical components are black first
    ensureCriticalComponentsAreBlack();

    // Try the targeted coloring approach for chassis
    const success = targetedColorApplication(colorOption.color);

    // Only use fallbacks if necessary
    if (!success) {
      console.log("Targeted coloring approach failed, trying fallback methods");
      let fallbackSuccess = mainColorApplication(colorOption.color);

      if (!fallbackSuccess) {
        console.log("Main coloring approach failed, trying more aggressive fallbacks");
        applyColorToAllNonExcludedParts(colorOption.color);
      }
    }

    // Final check to ensure critical components stayed black
    ensureCriticalComponentsAreBlack();

    // Render the scene with the new color
    renderer.render(scene, camera);
  }

  // New function to specifically ensure front bezels and dynamic island are always black
  function ensureCriticalComponentsAreBlack() {
    if (!model) return;

    console.log("Ensuring front bezels and dynamic island remain BLACK");

    // Critical components that must always be BLACK
    const criticalBlackComponents = [
      'bezel', 'frame', 'front-bezel', 'dynamic', 'island', 'notch',
      'front-camera', 'front-facing', 'front-sensor', 'truedepth'
    ];

    // BLACK color for these components
    const BLACK_COLOR = 0x000000;

    // Find all critical components and force them to be black
    model.traverse((node) => {
      if (node.isMesh && node.material) {
        const nodeName = (node.name || '').toLowerCase();

        // Check if this is a front-facing critical component by name
        const isCriticalComponent = criticalBlackComponents.some(term => nodeName.includes(term));

        // Additional check - components close to the screen are likely front bezels
        let isLikelyFrontBezel = false;

        if (!isCriticalComponent && node.geometry) {
          // Find components that might be front bezels based on position
          // Usually they're very close to the screen on the Z axis
          if (node.geometry.boundingBox) {
            const box = node.geometry.boundingBox;
            // Front components usually have minimal z thickness and are at front of phone
            if (Math.abs(box.max.z - box.min.z) < 0.05 && box.max.z > 0) {
              isLikelyFrontBezel = true;
              console.log(`Likely front bezel detected by position: ${nodeName}`);
            }
          }

          // Also check if it's a small component near the top of the phone
          // (dynamic island, notch area)
          if (node.position && Math.abs(node.position.y) > 0.5) {
            const size = calculateMeshSize(node);
            // Small components at the top of the phone are likely sensors, cameras, etc.
            if (size < 0.01) {
              isLikelyFrontBezel = true;
              console.log(`Likely front sensor/camera detected: ${nodeName} at position y=${node.position.y}`);
            }
          }
        }

        // Force color to BLACK for critical components
        if (isCriticalComponent || isLikelyFrontBezel) {
          console.log(`Forcing BLACK color for critical component: ${nodeName}`);

          if (Array.isArray(node.material)) {
            // Handle multi-material objects
            node.material = node.material.map(mat => {
              // Skip screen materials
              if (mat && mat.map && mat.map === canvasTexture) {
                return mat;
              }

              const clonedMat = mat ? mat.clone() : new THREE.MeshStandardMaterial();
              clonedMat.color.set(BLACK_COLOR);
              return clonedMat;
            });
          } else {
            // Skip if it's the screen material
            if (node.material.map && node.material.map === canvasTexture) {
              return;
            }

            // Apply BLACK to the material
            const newMaterial = node.material.clone();
            newMaterial.color.set(BLACK_COLOR);
            node.material = newMaterial;
          }
        }
      }
    });
  }

  // New targeted approach that specifically identifies chassis parts
  function targetedColorApplication(colorHex) {
    console.log("Using targeted color application for iPhone chassis");

    let coloredParts = 0;

    // Original chassis color is close to this (light green-turquoise)
    const chassisOriginalColor = "#6D9C9E";

    // Components that should NEVER be colored (must always keep original color)
    const preserveComponents = [
      // Front components that should remain black
      'bezel', 'front-bezel', 'dynamic', 'island', 'notch', 'front-camera',
      'front-facing', 'front-sensor', 'truedepth', 'faceID',

      // Back camera components
      'camera', 'lens', 'flash', 'lidar', 'sensor',

      // Screen and glass
      'screen', 'display', 'glass', 'lcd',

      // Other components
      'button', 'logo', 'speaker', 'mic', 'port', 'usb', 'lightning'
    ];

    // Chassis naming patterns (parts that SHOULD be colored)
    const chassisPatterns = [
      'chassis', 'body', 'frame', 'housing', 'case', 'back', 'shell',
      'enclosure', 'exterior', 'casing'
    ];

    // Log all meshes for debugging
    console.log("Analyzing all meshes in iPhone model:");

    model.traverse((node) => {
      if (node.isMesh && node.material) {
        const nodeName = (node.name || '').toLowerCase();

        // Check if this is a component that should never be colored
        const shouldPreserve = preserveComponents.some(term => nodeName.includes(term));

        // Check if it's a screen texture
        const hasScreenTexture = (
          node.material &&
          ((node.material.map && node.material.map === canvasTexture) ||
           (Array.isArray(node.material) &&
            node.material.some(mat => mat && mat.map && mat.map === canvasTexture)))
        );

        // Skip preserved components and screen parts
        if (shouldPreserve || hasScreenTexture) {
          console.log(`Preserving original color for: ${nodeName}`);
          return;
        }

        // Determine if this is a chassis part that should be colored
        let isChassisComponent = chassisPatterns.some(term => nodeName.includes(term));

        // If we couldn't identify by name, try to detect by the original chassis color
        if (!isChassisComponent && node.material) {
          // Get the color information
          if (Array.isArray(node.material)) {
            // For multi-materials
            for (const mat of node.material) {
              if (mat && mat.color) {
                const colorHex = '#' + mat.color.getHexString().toLowerCase();
                if (isCloseToOriginalChassisColor(colorHex)) {
                  isChassisComponent = true;
                  console.log(`Identified chassis by color match: ${nodeName}, color: ${colorHex}`);
                  break;
                }
              }
            }
          } else if (node.material.color) {
            // For single material
            const colorHex = '#' + node.material.color.getHexString().toLowerCase();
            if (isCloseToOriginalChassisColor(colorHex)) {
              isChassisComponent = true;
              console.log(`Identified chassis by color match: ${nodeName}, color: ${colorHex}`);
            }
          }
        }

        // SPECIAL CASE: If it's a large visible part but not explicitly preserved,
        // it's likely part of the chassis
        if (!isChassisComponent && !shouldPreserve) {
          // Get the size of the mesh
          const size = calculateMeshSize(node);
          // If it's a large component, it's likely part of the main body
          if (size > 0.01) { // Threshold may need adjustment
            isChassisComponent = true;
            console.log(`Identified chassis by size: ${nodeName}, size: ${size.toFixed(4)}`);
          }
        }

        // Apply color to identified chassis components
        if (isChassisComponent) {
          coloredParts++;
          console.log(`Applying color to chassis part: ${nodeName}`);

          if (Array.isArray(node.material)) {
            // Handle multi-material objects
            node.material = node.material.map(mat => {
              if (!mat || (mat.map && mat.map === canvasTexture)) {
                return mat;
              }
              const clonedMat = mat.clone();
              clonedMat.color.set(colorHex);
              return clonedMat;
            });
          } else {
            // Simple material
            const newMaterial = node.material.clone();
            newMaterial.color.set(colorHex);
            node.material = newMaterial;
          }
        } else {
          console.log(`Not coloring (not chassis): ${nodeName}`);
        }
      }
    });

    console.log(`Targeted approach colored ${coloredParts} chassis parts`);
    return coloredParts > 0;
  }

  // Helper function to determine if a color is close to the original chassis color
  function isCloseToOriginalChassisColor(colorHex) {
    // Reference chassis color (light green-turquoise)
    const reference = {
      r: 109, // 0x6D
      g: 156, // 0x9C
      b: 158  // 0x9E
    };

    try {
      // Parse the current color
      const r = parseInt(colorHex.substring(1, 3), 16);
      const g = parseInt(colorHex.substring(3, 5), 16);
      const b = parseInt(colorHex.substring(5, 7), 16);

      // Check for NaN values
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return false;
      }

      // Calculate color similarity (using a color distance formula)
      // Using a basic Euclidean distance in RGB space
      const distance = Math.sqrt(
        Math.pow(r - reference.r, 2) +
        Math.pow(g - reference.g, 2) +
        Math.pow(b - reference.b, 2)
      );

      // Determine if colors are "close enough" - may need tuning
      // Lower values = more strict matching
      const threshold = 60; // RGB distance threshold
      const isClose = distance < threshold;

      if (isClose) {
        console.log(`Color match: ${colorHex} is close to original chassis color, distance: ${distance.toFixed(2)}`);
      }

      return isClose;
    } catch (error) {
      console.error("Error comparing colors:", error);
      return false;
    }
  }

  // Main iPhone color application function - uses multiple strategies to identify colorable parts
  function mainColorApplication(colorHex) {
    console.log("Starting main color application process");

    // Debug: log all meshes in the model to help with diagnosis
    console.log("Available meshes in the iPhone model:");
    let meshCount = 0;
    let colorableMeshCount = 0;

    // List of parts that should NOT be colored (keep original appearance)
    const preserveComponents = [
      // Front facing components that should remain black
      'bezel', 'dynamic', 'island', 'notch', 'front-camera',

      // Basic phone components
      'screen', 'display', 'camera', 'lens', 'flash', 'glass', 'lcd',

      // Dynamic Island and UI elements
      'button', 'logo',

      // Other functional parts
      'speaker', 'mic', 'bump', 'port', 'usb', 'lightning',

      // Internal components that might be visible but shouldn't change color
      'sensor', 'antenna', 'metal', 'steel', 'aluminum', 'module'
    ];

    // Find and update materials for the iPhone body
    model.traverse((node) => {
      if (node.isMesh) {
        meshCount++;
        const nodeName = (node.name || '').toLowerCase();
        console.log(`Mesh #${meshCount}: ${node.name || 'unnamed'}`);

        // Skip components that should always maintain their original color
        const shouldPreserve = preserveComponents.some(term => nodeName.includes(term));

        // Also skip if it has the screen texture
        const hasScreenTexture = (node.material && node.material.map && node.material.map === canvasTexture);

        if (shouldPreserve || hasScreenTexture) {
          console.log(`  - Skipping ${node.name || 'unnamed'} (preserved component)`);
          return;
        }

        // Components that should definitely be colored (the main body parts)
        const definitelyColor = [
          'body', 'frame', 'chassis', 'case', 'back', 'housing',
          'shell', 'enclosure', 'cover', 'exterior'
        ];

        // Check if this is a main body part by name
        let shouldColor = definitelyColor.some(term => nodeName.includes(term));

        // If we couldn't identify by name, try by material color
        if (!shouldColor && node.material) {
          // Check material color
          if (Array.isArray(node.material)) {
            // For multi-materials, log each material color
            node.material.forEach((mat, index) => {
              if (mat && mat.color) {
                const colorHex = '#' + mat.color.getHexString().toLowerCase();
                console.log(`  - Material #${index} color: ${colorHex}`);

                // Check if this is close to the original chassis color
                if (isCloseToOriginalChassisColor(colorHex)) {
                  shouldColor = true;
                  console.log(`  - Detected material #${index} as chassis color`);
                }
              }
            });
          }
          // For single materials
          else if (node.material.color) {
            const colorHex = '#' + node.material.color.getHexString().toLowerCase();
            console.log(`  - Material color: ${colorHex}`);

            // Check if this is close to the original chassis color
            if (isCloseToOriginalChassisColor(colorHex)) {
              shouldColor = true;
              console.log(`  - Detected as chassis color: ${colorHex}`);
            }
          }
        }

        // Decide if this part should be colored
        if (shouldColor) {
          colorableMeshCount++;
          console.log(`  - Applying color to ${node.name || 'unnamed'}`);

          // Apply the color
          if (Array.isArray(node.material)) {
            // Handle multi-material objects
            node.material = node.material.map(mat => {
              if (mat && mat.map && mat.map === canvasTexture) {
                return mat; // Keep screen materials unchanged
              }

              const clonedMat = mat ? mat.clone() : new THREE.MeshStandardMaterial();
              clonedMat.color.set(colorHex);
              return clonedMat;
            });
          } else if (node.material) {
            // Simple material
            const newMaterial = node.material.clone();
            newMaterial.color.set(colorHex);
            node.material = newMaterial;
          }
        } else {
          console.log(`  - Not coloring ${node.name || 'unnamed'}`);
        }
      }
    });

    console.log(`Found ${meshCount} meshes, colored ${colorableMeshCount} meshes`);
    return colorableMeshCount > 0;
  }

  // Fallback function to color all parts except explicitly excluded ones
  function applyColorToAllNonExcludedParts(colorHex) {
    console.log("Applying fallback coloring approach");
    let coloredParts = 0;

    // Extended list of parts that should NOT be colored
    const excludedComponents = [
      // Front components that should remain black
      'bezel', 'dynamic', 'island', 'notch', 'front-camera',

      // Back camera components
      'camera', 'lens', 'flash', 'lidar', 'sensor',

      // Basic phone components
      'screen', 'display', 'glass', 'lcd',

      // Other functional parts
      'button', 'logo', 'speaker', 'mic', 'bump', 'port', 'usb', 'lightning',

      // Internal components
      'sensor', 'antenna', 'metal', 'steel', 'aluminum', 'module'
    ];

    model.traverse((node) => {
      if (!node.isMesh || !node.material) return;

      const nodeName = (node.name || '').toLowerCase();

      // Check if any excluded term appears in the node name
      const isExcluded = excludedComponents.some(term => nodeName.includes(term));

      // Also exclude if it uses the screen texture
      const hasScreenTexture = (node.material.map && node.material.map === canvasTexture);

      if (!isExcluded && !hasScreenTexture) {
        // Apply color to this part
        console.log(`Fallback: Coloring ${node.name || 'unnamed'}`);

        if (Array.isArray(node.material)) {
          node.material = node.material.map(mat => {
            if (!mat) return new THREE.MeshStandardMaterial({ color: colorHex });
            if (mat.map && mat.map === canvasTexture) return mat;

            const clonedMat = mat.clone();
            clonedMat.color.set(colorHex);
            return clonedMat;
          });
        } else {
          const newMaterial = node.material.clone();
          newMaterial.color.set(colorHex);
          node.material = newMaterial;
        }

        coloredParts++;
      }
    });

    console.log(`Fallback approach colored ${coloredParts} parts`);
    return coloredParts > 0;
  }

  // Helper function to calculate approximate size of a mesh
  function calculateMeshSize(mesh) {
    if (!mesh.geometry) return 0;

    // If geometry has a bounding box, use that
    const geometry = mesh.geometry;

    // If the bounding box isn't computed, compute it
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }

    // If we have a bounding box, use it to calculate volume
    if (geometry.boundingBox) {
      const box = geometry.boundingBox;
      const size = new THREE.Vector3();
      box.getSize(size);

      // Calculate volume (or surface area for flat objects)
      // For very flat objects, use area instead of volume
      if (size.x * size.y * size.z < 0.00001) {
        return size.x * size.y + size.y * size.z + size.x * size.z;
      }

      return size.x * size.y * size.z;
    }

    // Fallback if no bounding box: count vertices or faces
    if (geometry.attributes && geometry.attributes.position) {
      return geometry.attributes.position.count;
    }

    return 0;
  }

  // Legacy function is kept for backward compatibility
  function checkIfColoredPart(node) {
    // If the part has a material
    if (node.material) {
      // Check if it's a single material
      if (!Array.isArray(node.material)) {
        // If it has a color property (most materials do)
        if (node.material.color) {
          // Get the color as a hex string
          const colorHex = '#' + node.material.color.getHexString().toLowerCase();

          // Check for likely body colors
          return isLikelyBodyColor(colorHex);
        }
      } else {
        // For multi-materials, check if any of the materials match our criteria
        for (const mat of node.material) {
          if (mat.color) {
            const colorHex = '#' + mat.color.getHexString().toLowerCase();
            if (isLikelyBodyColor(colorHex)) return true;
          }
        }
      }
    }

    // If we get here, it's not a colored part
    return false;
  }

  // Helper to identify green colors in the model - replaced by isLikelyBodyColor
  function isGreenColor(hexColor) {
    return isLikelyBodyColor(hexColor); // Now redirects to our improved function
  }

  // Function to select a wallpaper
  function selectWallpaper(index) {
    if (index >= 0 && index < wallpapers.length) {
      currentWallpaperIndex = index;
      uploadedImage = wallpapers[index].img;
      updateScreenTexture(uploadedImage);
    }
  }

  // Function to remove a wallpaper
  function removeWallpaper(index, event) {
    // Stop event propagation to prevent selecting the wallpaper when removing
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Can't remove default wallpapers
    if (index < DEFAULT_WALLPAPER_COUNT) {
      console.log("Cannot remove default wallpaper");
      return;
    }

    console.log(`Removing wallpaper at index ${index}`);

    // Remove the wallpaper from the array
    wallpapers = [
      ...wallpapers.slice(0, index),
      ...wallpapers.slice(index + 1)
    ];

    // If the removed wallpaper was the active one, select another one
    if (currentWallpaperIndex === index) {
      // If we removed the last wallpaper, select the previous one
      if (index >= wallpapers.length) {
        currentWallpaperIndex = Math.max(0, wallpapers.length - 1);
      } else {
        // Otherwise, stay at the same index (which now points to the next wallpaper)
        currentWallpaperIndex = Math.min(index, wallpapers.length - 1);
      }

      // Update the active image
      if (wallpapers.length > 0) {
        uploadedImage = wallpapers[currentWallpaperIndex].img;
        updateScreenTexture(uploadedImage);
      }
    } else if (currentWallpaperIndex > index) {
      // If we removed a wallpaper before the current one, adjust the index
      currentWallpaperIndex--;
    }
  }
</script>

<svelte:head>
  <title> 3D Phone Viewer </title>
</svelte:head>

<Header />


<div id='container'>


  <div id='left' class = 'content-card'>
    <h1> 3D Phone Viewer </h1>

    {#if isLoading}
    <div class="loading">
      <div class="progress-bar">
        <div class="progress" style="width: {loadingProgress}%"></div>
      </div>
      <p>Loading model... {loadingProgress}%</p>
    </div>
    {:else}
    <div class="upload-container">


      {#if wallpapers.length > 0}
      <div class="wallpaper-picker">
        <h3> Display Images </h3>
        <div class="wallpaper-grid">
          {#each wallpapers as wallpaper, index}
            <div
              class="wallpaper-item {currentWallpaperIndex === index ? 'active' : ''}"
              on:click={() => selectWallpaper(index)}
            >
              <div class="wallpaper-preview">
                <img src={wallpaper.src} alt={wallpaper.name} />
                {#if !wallpaper.isDefault}
                  <button
                    class="remove-wallpaper"
                    on:click={(e) => removeWallpaper(index, e)}
                    title="Remove wallpaper"
                  >
                    ✕
                  </button>
                {/if}
              </div>
              <div class="wallpaper-name">{wallpaper.name}</div>
            </div>
          {/each}
        </div>
      </div>
      {/if}


      <label for="image-upload" class="upload-button button">
        <h2> Upload Image </h2>
      </label>
      <input id="image-upload" type="file" accept="image/*" on:change={handleImageUpload} multiple />



    </div>

    {#if uploadedImage}
    <div class="image-fit-options">
      <h3>Image Fit</h3>
      <div class="fit-buttons">
        <button
          class="fit-button secondary {$imageFitMode === 'fit' ? 'active' : ''}"
          on:click={() => {
            if (!isAnimatingFit && $imageFitMode !== 'fit') {
              imageFitMode.set('fit');
              if (uploadedImage) updateScreenTexture(uploadedImage);
            }
          }}
          title="Fit entire image within screen (may show whitespace)"
        >
        <h2> Fit </h2>


        </button>
        <button
          class="fit-button secondary {$imageFitMode === 'cover' ? 'active' : ''}"
          on:click={() => {
            if (!isAnimatingFit && $imageFitMode !== 'cover') {
              imageFitMode.set('cover');
              if (uploadedImage) updateScreenTexture(uploadedImage);
            }
          }}
          title="Cover entire screen (may crop image edges)"
        >
        <h2> Cover </h2>


        </button>
      </div>
    </div>
    {/if}

    <div class="model-switcher">
      <h3>Phone Model</h3>
      <div class="model-buttons">
        {#each availableModels as model}
        <button class="model-button {currentModelType === model.id ? 'active' : ''}" on:click={() => switchModel(model.id)}
          title={model.description}>
          {model.name}
        </button>
        {/each}
      </div>
    </div>

    {#if currentModelType === "iphone"}
    <div class="color-switcher">
      <h3>iPhone Color</h3>
      <div class="color-options">
        {#each iphoneColors as color}
        <button
          class="color-option {currentIphoneColor.id === color.id ? 'active' : ''}"
          style="background-color: {color.color};"
          on:click={() => changeIphoneColor(color)}
          title={color.name}
        ></button>
        {/each}
      </div>
      <p class="selected-color-name">{currentIphoneColor.name}</p>
    </div>
    {/if}

    {/if}

  </div>

  <div id='content' class = 'content-card'>
    <div class="viewer" bind:this={containerEl}></div>
  </div>

  <div id = 'right' class = 'content-card'>

    <div class="axes-toggle">
      <h3>View</h3>
      <label class="toggle-switch">
        <input type="checkbox" checked on:change={toggleAxesHelper}>
        <span class="toggle-slider"></span>
        <span class="toggle-label">Show X/Y/Z Axes</span>
      </label>
    </div>

    <div class="camera-controls">
      <h3>Camera</h3>
      <div class="control-row">
        <label for="rotationX">X</label>
        <input type="range" id="rotationX" min="-90" max="90" step="1"
          value={Math.round($cameraRotationXStore)}
          on:input={(e) => {
            isAdjustingSliders = true;
            const val = parseFloat(e.target.value) || 0;
            cameraRotationXStore.set(val);
            updateCameraRotation(val, $cameraRotationYStore, $cameraRotationZStore);
            if (renderer && scene && camera) {
              renderer.render(scene, camera);
            }
          }}
          on:change={() => {
            setTimeout(() => {
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
              isAdjustingSliders = false;
            }, 100);
          }}
        />
        <input type="number" min="-90" max="90"
          value={Math.round($cameraRotationXStore)}
          on:input={(e) => {
            isAdjustingSliders = true;
            const val = parseFloat(e.target.value) || 0;
            cameraRotationXStore.set(val);
            updateCameraRotation(val, $cameraRotationYStore, $cameraRotationZStore);
            if (renderer && scene && camera) {
              renderer.render(scene, camera);
            }
          }}
          on:change={() => {
            if (renderer && scene && camera) {
              renderer.render(scene, camera);
            }
            isAdjustingSliders = false;
          }}
        />
      </div>
      <div class="control-row">
        <label for="rotationY">Y</label>
        <input type="range" id="rotationY" min="-180" max="180" step="1"
          value={Math.round($cameraRotationYStore)}
          on:input={(e) => {
            isAdjustingSliders = true;
            const val = parseFloat(e.target.value) || 0;
            cameraRotationYStore.set(val);
            updateCameraRotation($cameraRotationXStore, val, $cameraRotationZStore);
            if (renderer && scene && camera) {
              renderer.render(scene, camera);
            }
          }}
          on:change={() => {
            setTimeout(() => {
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
              isAdjustingSliders = false;
            }, 100);
          }}
        />
        <input type="number" min="-180" max="180"
          value={Math.round($cameraRotationYStore)}
          on:input={(e) => {
            isAdjustingSliders = true;
            const val = parseFloat(e.target.value) || 0;
            cameraRotationYStore.set(val);
            updateCameraRotation($cameraRotationXStore, val, $cameraRotationZStore);
            if (renderer && scene && camera) {
              renderer.render(scene, camera);
            }
          }}
          on:change={() => {
            if (renderer && scene && camera) {
              renderer.render(scene, camera);
            }
            isAdjustingSliders = false;
          }}
        />
      </div>
      <div class="control-row">
        <label for="rotationZ">Z</label>
        <input type="range" id="rotationZ" min="-180" max="180" step="1"
          value={Math.round($cameraRotationZStore)}
          on:input={(e) => {
            isAdjustingSliders = true;
            const val = parseFloat(e.target.value) || 0;
            console.log(`Z slider changed to: ${val}°`);
            // Update the store
            cameraRotationZStore.set(val);

            // Use updateCameraRotation for consistency
            updateCameraRotation(
              get(cameraRotationXStore),
              get(cameraRotationYStore),
              val
            );
          }}
          on:change={() => {
            setTimeout(() => {
              if (renderer && scene && camera) {
                renderer.render(scene, camera);
              }
              isAdjustingSliders = false;
            }, 100);
          }}
        />
        <input type="number" min="-180" max="180"
          value={Math.round($cameraRotationZStore)}
          on:input={(e) => {
            isAdjustingSliders = true;
            const val = parseFloat(e.target.value) || 0;
            console.log(`Z input value changed to: ${val}°`);
            // Update the store
            cameraRotationZStore.set(val);

            // Use updateCameraRotation for consistency
            updateCameraRotation(
              get(cameraRotationXStore),
              get(cameraRotationYStore),
              val
            );
          }}
          on:change={() => {
            if (renderer && scene && camera) {
              renderer.render(scene, camera);
            }
            isAdjustingSliders = false;
          }}
        />
      </div>
      <button class="reset-button secondary" on:click={() => {
        // Get current values for animation
        const currentX = get(cameraRotationXStore);
        const currentY = get(cameraRotationYStore);
        const currentZ = get(cameraRotationZStore);

        console.log(`===== RESET CAMERA BUTTON CLICKED =====`);
        console.log(`Current camera angles before reset: X=${currentX}, Y=${currentY}, Z=${currentZ}`);
        console.log(`Current camera up vector: (${camera.up.x.toFixed(4)}, ${camera.up.y.toFixed(4)}, ${camera.up.z.toFixed(4)})`);

        // Clear any existing flags to ensure a clean state
        isAdjustingSliders = false;
        isUpdatingFromCamera = false;

        // Force camera to use standard up vector before starting animation
        camera.up.set(0, 1, 0);
        camera.updateMatrixWorld(true);
        controls.update();

        // Small delay before starting animation to ensure clean state
        setTimeout(() => {
          // Use the existing animation function to smoothly transition to 0,0,0
          // Duration of 1000ms (1 second) for a smooth but not too slow animation
          animateCameraRotation(0, 0, 0, 1000);
        }, 50);

        // Additional check 1.5 seconds after reset completes (animation + 500ms buffer)
        setTimeout(() => {
          console.log(`===== POST-RESET CHECK =====`);
          console.log(`Camera angles after reset: X=${get(cameraRotationXStore)}, Y=${get(cameraRotationYStore)}, Z=${get(cameraRotationZStore)}`);
          console.log(`Camera up vector: (${camera.up.x.toFixed(4)}, ${camera.up.y.toFixed(4)}, ${camera.up.z.toFixed(4)})`);

          // Force an update
          updateCameraAnglesFromCamera();
        }, 1500);
      }}>
          <h2> Reset Camera </h2>
      </button>
    </div>

    <button class="download-button highlight" on:click={takeScreenshot} disabled={wallpapers.length === 0}>
      <h2> Download PNG </h2>
    </button>
  </div>

</div>

<style lang="scss">
  .app-container {
    display: flex;
    width: 100%;
    height: 100vh;

    font-family: 'Inter', sans-serif;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }


  #content{
    padding: 4px;
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
    background: #f5f5f5;
    position: relative;

    width: clamp(400px, calc(min(80vh, 100vw - 800px)), 800px);
    height: clamp(400px, calc(min(80vh, 100vw - 800px)), 800px);
    aspect-ratio: 1 !important;

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

    // /border: 1px solid black;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    width: 100%;
    border-radius: 20px 20px 24px 24px;
    box-sizing: border-box;

    box-shadow: 2px 4px 8px rgba(black, .03), inset -4px -8px 12px rgba(#030025, .05), inset 2px 2px 4px rgba(white, .2);

    background:rgb(248, 245, 255);
    padding: 16px 18px;
    // /margin-bottom: 20px;

    input[type="file"] {
      display: none;
    }
  }

  .upload-button {
    margin-top: 24px;
    width: 100%;
    h2{
      width: 100%;
      text-align: center;
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



  .credits {
    margin-top: auto;
    font-size: 12px;
    color: #999;
    text-align: center;
  }

  .model-switcher {
    display: none;
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


  }

  .camera-controls{
    width: 100%;

    h3{
      margin-bottom: 1rem;
    }
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 0.75rem;
    width: 100%;

    label{
      flex-shrink: 0;
      width: 12px;
      font-size: 14px;
      font-weight: bold;
      color: #555;      border-radius: 8px;
    }

    &:nth-child(2){
      input[type="range"]{
        background: rgba(#0074FF, .3);
      }
    }
    &:nth-child(3){
      input[type="range"]{
        background: rgba(green, .3);
      }
    }
    &:nth-child(4){
      input[type="range"]{
        background: rgba(red, .3);
      }
    }


    input[type="range"]{
      box-shadow: none;
      box-shadow: inset 4px 4px 6px rgba(#030025, .12);
    }
  }



  .control-row input[type="number"] {
    width: 44px;
    text-align: left;
    padding: 6px;
  }

  .download-button{
      width: 100%;
      margin-top: 4px;
      h2{
        text-align: center;
      }
  }

  .reset-button{
    width: 100%;
    margin-top: 8px;
    padding: 10px;
    h2{
      text-align: center;
      color: rgba(#030025, .6);
    }
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


  .axes-toggle h3 {
    margin-bottom: 1rem;
    color: #333;
  }

  .toggle-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 24px;
    background-color: #ccc;
    border-radius: 24px;
    transition: 0.4s;
    margin-right: 10px;
    box-shadow: inset -1px 2px 4px rgba(#030025, .1);
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: 0.4s;
    box-shadow: 2px 4px 8px rgba(#030025, .4), inset -1px -2px 3px rgba(#030025, .25);
  }

  input:checked + .toggle-slider {
    background-color: #6355FF;
  }

  input:checked + .toggle-slider:before {
    transform: translateX(16px);
    box-shadow: 2px 4px 8px rgba(#030025, .8), inset -1px -2px 3px rgba(#030025, .25);
  }

  .toggle-label {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -.32px;
    color: #555;
  }

  .color-switcher {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 12px;
  }

  .color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 8px;
    justify-content: flex-start;

    .color-option {
      width: 28px;
      height: 28px;
      min-width: 28px; /* Prevent horizontal stretching */
      min-height: 28px; /* Prevent vertical stretching */
      max-width: 28px; /* Ensure exact width */
      max-height: 28px; /* Ensure exact height */
      //border: 2px solid transparent;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      //box-shadow: 2px 4px 6px rgba(black, 0.1), inset -2px -4px 4px rgba(#030025, .1), inset 2px 2px 4px rgba(white, .2);
      flex: 0 0 auto; /* Don't allow flex to resize */
      padding: 0; /* Remove any padding */
      margin: 0; /* Use gap for spacing instead */

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }

      &.active {
        border: 2px solid #6355FF;
        // /border-color: #6355FF;
        transform: scale(1.15);
        box-shadow: 0 4px 12px rgba(black, .1);

        &:after {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          transition: .2s ease;
        }
      }
    }
  }


  .selected-color-name {
    margin-top: 8px;
    margin-bottom: 15px;
    font-size: 14px;
    color: #333;
    text-align: center;
    font-weight: 500;
    display: none;
  }

  .wallpaper-picker {

    //margin: 20px 0 40px 0;
    width: 200px;


    h3 {
        margin: 0 0 16px 0;
    }

    ::-webkit-scrollbar{
        width: 6px;
      }

      ::-webkit-scrollbar-track{
        background: rgba(black, .0);
      }

      ::-webkit-scrollbar-thumb{
        background: rgba(black, .2);
        border-radius: 10px;
      }

    .wallpaper-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      height: 140px;
      overflow-y: scroll;
      position: relative;


      // border: 2px solid blue;
    }

    .wallpaper-item {
      grid-column: span 1;
      width: 50px;
      position: relative;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.02);
      }

      .wallpaper-preview {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 0;
        padding-bottom: 177%; /* iPhone aspect ratio (19.5:9) */
        border-radius: 8px;
        flex-grow: 0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);



        img {
          position: absolute;
          top: 0;
          left: 0;
          width: 90%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          border: 2px solid transparent;
          border-radius: 8px;
          transition: .1s ease;
        }

        .remove-wallpaper {
          position: absolute;
          top: 5px;
          right: 5px;
          opacity: 0; /* Hide by default, show on hover */
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          line-height: 1;
          color: #ff3b30;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 10;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            background: #ff3b30;
            color: white;
            transform: scale(1.1);
          }
        }
      }

      &:hover .remove-wallpaper {
        opacity: 1; /* Show on hover */
      }

      .wallpaper-name {
        font-family: 'Inter', sans-serif;
        margin-top: 5px;
        font-size: 12px;
        color: #666;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      &.active {
        .wallpaper-preview img {
          border: 1px solid red;
        }

        .wallpaper-name {
          font-weight: 600;
          color: #007aff;
        }
      }
    }
  }

  .fit-buttons {
    display: flex;
    gap: 10px;
    margin-top: 10px;

    .fit-button{

      &.active{
        background: rgba(#030025, .2);
      }
    }
  }



  /*

  .fit-button {
    flex: 1;
    padding: 8px 12px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .fit-button:hover {
    background-color: #e0e0e0;
  }

  .fit-button.active {
    background-color: #4a8b60;
    color: white;
    border-color: #4a8b60;
  }
    */
</style>