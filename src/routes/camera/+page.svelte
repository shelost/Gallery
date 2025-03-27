<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
	import * as THREE from 'three'; // Using namespace import
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

	// --- Types ---
	type PoseDetectionType = typeof import('@tensorflow-models/pose-detection');
	type TfjsCoreType = typeof import('@tensorflow/tfjs-core');
	type Pose = PoseDetectionType['Pose'];
	type Keypoint = PoseDetectionType['Keypoint'];
	type PreviewOption = 'skeleton' | 'cartoon' | 'dots' | '3d-model';

	// --- Refs ---
	let videoElement: HTMLVideoElement;
	let previewCanvasElement: HTMLCanvasElement;
	let modelContainerElement: HTMLDivElement;
	let animationFrameId: number | null = null;
	let threeRenderer: THREE.WebGLRenderer | null = null;

	// --- State ---
	let stream: MediaStream | null = null;
	let detector: PoseDetectionType['PoseDetector'] | null = null;
	let currentPose: Pose | null = null;
	let isLoading = true;
	let errorMessage: string | null = null;
	let selectedPreview: PreviewOption = '3d-model';
	let selectedModelGender: 'male' | 'female' = 'male';
	let previewOptions: { value: PreviewOption; label: string }[] = [
		{ value: '3d-model', label: '3D Model' },
		{ value: 'skeleton', label: 'Skeleton' },
		{ value: 'cartoon', label: 'Simple Cartoon' },
		{ value: 'dots', label: 'Keypoint Dots' }
	];
	let videoWidth = 640;
	let videoHeight = 480;
	// Match initial Three.js canvas size to default video size, will be updated
	let canvasWidth = 640;
	let canvasHeight = 480;

	// --- Three.js Objects ---
	let threeScene: THREE.Scene | null = null;
	let threeCamera: THREE.PerspectiveCamera | null = null;
	let threeControls: OrbitControls | null = null;
	let maleModel: THREE.Object3D | null = null;
	let femaleModel: THREE.Object3D | null = null;
	let activeModel: THREE.Object3D | null = null;
	let threeAnimationId: number | null = null;
	// Holder for the resize listener function to remove it later
	let resizeListener: (() => void) | null = null;

	// --- Module Holders ---
	let poseDetection: PoseDetectionType | null = null;
	let tf: TfjsCoreType | null = null;

	// --- Constants ---
    const MIN_CONFIDENCE = 0.3;

	// --- Initialization ---
	onMount(async () => {
		// Guard for SSR
		if (!browser) {
			isLoading = false;
			errorMessage = 'Motion detection requires a browser environment.';
			return;
		}

		isLoading = true;
		errorMessage = null;
		console.groupCollapsed('Initialization'); // Group logs for tidiness
		try {
			// --- TensorFlow.js Setup ---
			console.log('Importing TensorFlow.js...');
			tf = await import('@tensorflow/tfjs-core');
			await import('@tensorflow/tfjs-backend-webgl');
			if (!tf) throw new Error("TensorFlow.js core module failed to load.");
			console.log('Setting WebGL backend...');
			await tf.setBackend('webgl');
			await tf.ready(); // Ensure backend is ready
			console.log(`TensorFlow.js backend: ${tf.getBackend()}`);

            // --- Pose Detection Model ---
            console.log('Importing Pose Detection model...');
			poseDetection = await import('@tensorflow-models/pose-detection');
			if (!poseDetection) throw new Error('PoseDetection module failed to load');

			// --- Camera Setup ---
			console.log('Setting up camera...');
			if (!navigator.mediaDevices?.getUserMedia) {
				throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
			}
			stream = await navigator.mediaDevices.getUserMedia({
				video: { width: videoWidth, height: videoHeight }
			});
			videoElement.srcObject = stream;
			await new Promise<void>((resolve, reject) => {
				videoElement.onloadedmetadata = () => {
					videoElement.play().then(() => {
						videoWidth = videoElement.videoWidth;
						videoHeight = videoElement.videoHeight;
						// Set initial canvas sizes based on actual video dimensions
						canvasWidth = videoWidth;
						canvasHeight = videoHeight;
						if (previewCanvasElement) {
							previewCanvasElement.width = canvasWidth;
							previewCanvasElement.height = canvasHeight;
						}
						console.log(`Video playing: ${videoWidth}x${videoHeight}`);
						resolve();
					}).catch(reject);
				};
				videoElement.onerror = (e) => reject(`Video error: ${e}`);
			});

            // --- Pose Detector ---
            console.log('Loading MoveNet detector...');
			const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
			detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
			console.log('MoveNet detector loaded.');

			// --- Initialize Three.js ---
			console.log('Initializing Three.js scene...');
			initThreeScene(); // Initialize THREE scene AFTER video dimensions known
			if (!threeScene || !threeRenderer) throw new Error("Three.js scene failed to initialize");
			console.log('Three.js scene initialized.');

			// --- Load 3D Models ---
			console.log('Loading 3D models...');
			await loadModels();
			console.log('3D models loaded and configured.');

			// --- Start Loops ---
			console.log('Starting detection loop...');
			detectPoseLoop();
            console.log('Starting Three.js render loop...');
            renderThreeScene(); // Start render loop AFTER scene is set up


		} catch (err: any) {
			console.error('Initialization failed:', err);
			errorMessage = `Error: ${err.message || 'Failed to initialize.'}`;
			if (err.name === 'NotAllowedError') {
				errorMessage = 'Camera permission denied. Please allow camera access.';
			} else if (err.message?.includes('Requested device not found')) {
                errorMessage = 'No camera found. Please ensure a camera is connected and enabled.';
            } else if (err instanceof Error && err.message.includes('WebGL')) {
				errorMessage = `WebGL Error: ${err.message}. Your browser or device might not support WebGL, or it might be disabled.`;
			}
			// Cleanup potentially partially initialized resources
			cleanupResources();
		} finally {
			isLoading = false;
			console.log('Initialization process finished.');
			console.groupEnd(); // End Initialization log group
		}
	});

    // --- Cleanup ---
	onDestroy(() => {
        if (!browser) return;
        console.log('Component destroying, cleaning up resources...');
		cleanupResources();
		console.log('Resources cleaned up.');
	});

	// Centralized cleanup function
	function cleanupResources() {
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
		if (threeAnimationId) cancelAnimationFrame(threeAnimationId);
		threeAnimationId = null;
		detector?.dispose();
        detector = null;
        disposeThreeScene();
		if (resizeListener && browser) {
            window.removeEventListener('resize', resizeListener);
            resizeListener = null;
        }
	}

	// --- Initialize Three.js Scene ---
	function initThreeScene() {
		// Should only run in browser and when container element is ready
		if (!browser) {
			console.error("Cannot init Three.js: Not in browser environment.");
			errorMessage = "Browser environment required for 3D rendering.";
			return;
		}

		if (!modelContainerElement) {
			console.error("Cannot init Three.js: modelContainerElement is missing or not bound yet.");
			errorMessage = "3D container element not available.";
			return;
		}

		try {
			console.log("Starting Three.js initialization...");
			console.log("Container element size:", {
				width: modelContainerElement.clientWidth,
				height: modelContainerElement.clientHeight
			});

			// Check for WebGL support
			try {
				const canvas = document.createElement('canvas');
				const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
				if (!gl) {
					throw new Error("WebGL not supported. Please ensure your browser and hardware support WebGL.");
				}
				console.log("WebGL supported!");
			} catch (webglError) {
				console.error("WebGL check failed:", webglError);
				errorMessage = `WebGL not available: ${webglError.message}`;
				return;
			}

			// Create the scene
			console.log("Creating Three.js scene...");
			threeScene = new THREE.Scene();
			threeScene.background = new THREE.Color(0x222222); // Dark grey background
			console.log("Scene created successfully");

			// Setup camera
			console.log("Setting up camera...");
			const aspect = canvasWidth / canvasHeight;
			threeCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
			threeCamera.position.set(0, 1.6, 4);
			console.log("Camera created with aspect:", aspect);

			// Create the renderer
			console.log("Creating WebGL renderer...");
			try {
				threeRenderer = new THREE.WebGLRenderer({
					antialias: true,
					alpha: true,
					powerPreference: 'high-performance',
					canvas: document.createElement('canvas'), // Pre-create canvas
					precision: 'highp',
					preserveDrawingBuffer: true // Important for screenshots
				});

				if (!threeRenderer) {
					throw new Error("WebGLRenderer created but returned null or undefined");
				}

				threeRenderer.setSize(canvasWidth, canvasHeight);
				threeRenderer.outputColorSpace = THREE.SRGBColorSpace;
				threeRenderer.shadowMap.enabled = true;
				threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
				threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
				console.log("Renderer created and configured");

				// Force a clear to make sure the renderer is working
				threeRenderer.setClearColor(0x222222, 1);
				threeRenderer.clear();
			} catch (rendererError) {
				console.error("Failed to create WebGL renderer:", rendererError);
				errorMessage = `WebGL renderer creation failed: ${rendererError.message}`;
				throw rendererError; // Rethrow to stop initialization
			}

			// Clear container and append renderer's canvas
			console.log("Appending renderer to container...");
			while (modelContainerElement.firstChild) {
				modelContainerElement.removeChild(modelContainerElement.firstChild);
			}
			modelContainerElement.appendChild(threeRenderer.domElement);
			console.log("Renderer DOM element appended to container");

			// Create Orbit Controls
			console.log("Setting up OrbitControls...");
			threeControls = new OrbitControls(threeCamera, threeRenderer.domElement);
			threeControls.enableDamping = true;
			threeControls.dampingFactor = 0.1;
			threeControls.screenSpacePanning = false;
			threeControls.minDistance = 1;
      		threeControls.maxDistance = 20;
			threeControls.maxPolarAngle = Math.PI / 2 + 0.1;
			threeControls.target.set(0, 1, 0);
			threeControls.update();
			console.log("OrbitControls created and configured");

			// Add lights
			console.log("Adding lights to scene...");
			const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
			threeScene.add(ambientLight);

			const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
			mainLight.position.set(3, 5, 4);
			mainLight.castShadow = true;
			mainLight.shadow.mapSize.set(1024, 1024);
			mainLight.shadow.camera.near = 0.5;
			mainLight.shadow.camera.far = 50;
            mainLight.shadow.bias = -0.001;
			threeScene.add(mainLight);

            const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.6);
			threeScene.add(hemiLight);
			console.log("Lights added to scene");

			// Debugging objects
			console.log("Adding debug objects...");
			const debugCube = new THREE.Mesh(
				new THREE.BoxGeometry(0.3, 0.3, 0.3),
				new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x330000 })
			);
			debugCube.position.set(0, 1, 0);
			debugCube.castShadow = true;
			threeScene.add(debugCube);
			console.log("Debug cube added");

			const floor = new THREE.Mesh(
				new THREE.PlaneGeometry(10, 10),
				new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide })
			);
			floor.rotation.x = -Math.PI / 2;
			floor.position.y = 0;
			floor.receiveShadow = true;
			threeScene.add(floor);
			console.log("Floor added");

			const gridHelper = new THREE.GridHelper(10, 10, 0xcccccc, 0x777777);
			gridHelper.position.y = 0.01;
			threeScene.add(gridHelper);
			console.log("Grid helper added");

			// Setup resize handler
			console.log("Setting up resize handler...");
			resizeListener = () => {
				if (!threeRenderer || !threeCamera || !modelContainerElement) return;
				const { clientWidth: width, clientHeight: height } = modelContainerElement;
				if (width === 0 || height === 0) return;

				console.log("Resizing renderer:", { width, height });
				threeCamera.aspect = width / height;
				threeCamera.updateProjectionMatrix();
				threeRenderer.setSize(width, height);
			};
			window.addEventListener('resize', resizeListener);
			resizeListener();
			console.log("Resize handler attached");

			// Test render - helpful for debugging
			console.log("Performing test render...");
			try {
				threeRenderer.render(threeScene, threeCamera);
				console.log("Test render successful!");
			} catch (renderError) {
				console.error("Test render failed:", renderError);
				throw new Error(`Render test failed: ${renderError.message}`);
			}

			console.log("Three.js scene setup complete!");

			// Force scene and renderer check
			if (!threeScene) throw new Error("Scene setup failed");
			if (!threeRenderer) throw new Error("Renderer setup failed");

		} catch (error) {
			console.error("Error during Three.js initialization:", error);
			errorMessage = `Three.js Init Error: ${error instanceof Error ? error.message : String(error)}`;
			// Clean up anything that might have been created
			disposeThreeScene();
		}
	}

	// --- Load 3D Models ---
	async function loadModels() {
		// Ensure scene exists
		if (!browser) {
			console.error("Cannot load models: Not in browser environment");
			return;
		}

		if (!threeScene) {
			console.error("Cannot load models: Three.js scene not available");
			errorMessage = "Three.js scene not initialized for model loading.";
			return;
		}

		console.group('Model Loading');
		try {
			// Create fallbacks immediately for display if loading fails
			console.log("Creating fallback humanoid models...");
			maleModel = createDefaultHumanoid(0x5599ff); // Blueish
			femaleModel = createDefaultHumanoid(0xff88aa); // Pinkish
			console.log("Fallback humanoid models created successfully");

			console.log("Adding fallback models to scene...");
			threeScene.add(maleModel);
			threeScene.add(femaleModel);
			console.log("Fallback models added to scene");

			// List model paths to try
			const modelPaths = [
				'/static/3d/basic_human_male.glb',  // Try with static prefix first
				'/3d/basic_human_male.glb',         // Then without
				'/static/3d/male_female.glb',
				'/3d/male_female.glb',
				'/static/3d/OpenBot.glb',
				'/3d/OpenBot.glb'
			];

			console.log("Will attempt to load models from the following paths:", modelPaths);

			// Create loader
			console.log("Creating GLTFLoader...");
			const loader = new GLTFLoader();
			let loadedSuccessfully = false;
			let loadedGltf: THREE.GLTF | null = null;

			// Try loading each model
			for (const path of modelPaths) {
				console.log(`Attempting to load model from: ${path}...`);
				try {
					const gltf = await loader.loadAsync(path, (xhr) => {
						console.log(`Model ${path} loading progress: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
					});
					console.log(`GLTF model loaded successfully from: ${path}`, gltf);
					loadedGltf = gltf; // Store the loaded GLTF
					loadedSuccessfully = true;
					break; // Stop trying once one model loads
				} catch (error) {
					console.warn(`Failed to load model from ${path}:`, error);
				}
			}

			if (loadedSuccessfully && loadedGltf) {
				console.log("Successfully loaded a GLTF model, removing fallbacks");
				// Remove fallbacks if real model loaded
				if (maleModel) threeScene.remove(maleModel);
				if (femaleModel) threeScene.remove(femaleModel);
				maleModel = null;
				femaleModel = null;
				console.log("Fallback models removed");

				// Process loaded GLTF
				console.log("Processing loaded GLTF scene...");
				const scene = loadedGltf.scene;

				// Dump scene structure for debugging
				console.log("Model hierarchy:", listSceneHierarchy(scene));

				// Ensure meshes cast/receive shadows
				let meshCount = 0;
				scene.traverse(node => {
					if (node instanceof THREE.Mesh) {
						meshCount++;
						console.log(`Processing mesh: ${node.name || '(unnamed)'}`);
						node.castShadow = true;
						node.receiveShadow = true;
						// Optional: Check materials
						if (Array.isArray(node.material)) {
							node.material.forEach(m => { if(m.metalness) m.metalness = Math.min(m.metalness, 0.8); }); // Tone down metalness if needed
						} else if (node.material instanceof THREE.Material) {
							if((node.material as any).metalness) (node.material as any).metalness = Math.min((node.material as any).metalness, 0.8);
						}
					}
				});
				console.log(`Processed ${meshCount} meshes in the model`);

				// Clone for both models
				console.log("Creating male and female models from loaded scene...");
				maleModel = scene.clone(); // Clone for male
				femaleModel = scene; // Use original for female
				console.log("Models created");

				console.log("Centering and scaling models...");
				centerAndScaleModel(maleModel, "Male");
				centerAndScaleModel(femaleModel, "Female");
				console.log("Models centered and scaled");

				console.log("Adding models to scene...");
				if (maleModel) threeScene.add(maleModel);
				if (femaleModel) threeScene.add(femaleModel);
				console.log("Models added to scene");

			} else {
				console.log("No GLTF models could be loaded. Using fallback humanoid models.");
				// Fallbacks are already created and added, just need scaling/positioning
				console.log("Centering and scaling fallback models...");
				centerAndScaleModel(maleModel, "Fallback Male");
				centerAndScaleModel(femaleModel, "Fallback Female");
				console.log("Fallback models centered and scaled");
			}

			// Set initial visibility based on selection
			console.log(`Setting active model to: ${selectedModelGender}`);
			activeModel = selectedModelGender === 'male' ? maleModel : femaleModel;
			if (maleModel) maleModel.visible = selectedModelGender === 'male';
			if (femaleModel) femaleModel.visible = selectedModelGender === 'female';

			if (activeModel) {
				console.log("Active model details:", {
					name: activeModel.name,
					visible: activeModel.visible,
					position: activeModel.position,
					scale: activeModel.scale
				});
			} else {
				console.warn("No active model available after loading!");
				errorMessage = "Failed to set up 3D model. Please try refreshing the page.";
			}

			// Test render the models
			console.log("Performing test render with models...");
			if (threeRenderer && threeScene && threeCamera) {
				try {
					threeRenderer.render(threeScene, threeCamera);
					console.log("Test render with models successful!");
				} catch (renderError) {
					console.error("Test render with models failed:", renderError);
					errorMessage = `Render with models failed: ${renderError.message}`;
				}
			}
		} catch (err) {
			console.error("Error during model loading:", err);
			errorMessage = `Model loading error: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			console.groupEnd(); // End Model Loading log group
		}
	}

	// Helper function to create a basic humanoid figure as fallback
	function createDefaultHumanoid(color: number | string) {
		// Uses MeshStandardMaterial to interact with lights correctly
		const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1 });
		const group = new THREE.Group();
		group.name = `FallbackHumanoid_${color}`;

		// Head
		const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16), material);
		head.position.y = 1.65; // Adjusted position
		head.castShadow = true;
		head.name = "Head";
		group.add(head);

		// Body
		const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.6, 4, 16), material); // Use Capsule
		body.position.y = 1.2; // Adjusted position
		body.castShadow = true;
		body.name = "Body";
		group.add(body);

		// Arms
		const armGeom = new THREE.CapsuleGeometry(0.05, 0.5, 4, 8);
		const leftArm = new THREE.Mesh(armGeom, material);
		leftArm.position.set(0.25, 1.35, 0); // Adjusted position
		leftArm.castShadow = true;
        leftArm.name = "LeftArm";
		group.add(leftArm);
		const rightArm = new THREE.Mesh(armGeom, material);
		rightArm.position.set(-0.25, 1.35, 0); // Adjusted position
		rightArm.castShadow = true;
        rightArm.name = "RightArm";
		group.add(rightArm);

		// Legs
		const legGeom = new THREE.CapsuleGeometry(0.07, 0.7, 4, 8);
		const leftLeg = new THREE.Mesh(legGeom, material);
		leftLeg.position.set(0.1, 0.5, 0); // Adjusted position
		leftLeg.castShadow = true;
        leftLeg.name = "LeftLeg";
		group.add(leftLeg);
		const rightLeg = new THREE.Mesh(legGeom, material);
		rightLeg.position.set(-0.1, 0.5, 0); // Adjusted position
		rightLeg.castShadow = true;
        rightLeg.name = "RightLeg";
		group.add(rightLeg);

		// Store references for animation
		group.userData = { isFallback: true, head, body, leftArm, rightArm, leftLeg, rightLeg };
		return group;
	}

	// --- Helper function to center and scale a model ---
	function centerAndScaleModel(model: THREE.Object3D | null, label: string) {
		if (!model) {
			console.warn(`Cannot center/scale null model (${label})`);
			return;
		}
		console.log(`Centering and scaling model: ${model.name || label}`);
		// Ensure matrices are updated
		model.updateMatrixWorld(true);

		const box = new THREE.Box3().setFromObject(model, true); // Use precise = true
		const size = new THREE.Vector3();
		const center = new THREE.Vector3();
		box.getSize(size);
		box.getCenter(center);

		console.log(`Model (${label}) dimensions:`, {
			w: size.x.toFixed(3), h: size.y.toFixed(3), d: size.z.toFixed(3),
			center: { x: center.x.toFixed(3), y: center.y.toFixed(3), z: center.z.toFixed(3) }
		});

		// Check for invalid dimensions (can happen with empty/degenerate models)
		if (!isFinite(size.x) || !isFinite(size.y) || !isFinite(size.z) || size.x <= 0 || size.y <= 0 || size.z <= 0) {
			console.warn(`Model (${label}) has invalid bounding box size. Applying default scale/position.`);
			model.position.set(0, 1, 0); // Position roughly standing
			model.scale.set(1, 1, 1);
			return;
		}

		// --- Apply Transformations ---
        // 1. Center the model's pivot (origin) at its bounding box center temporarily
        // (This assumes the model geometry itself isn't wildly offset from its origin)
		// model.position.sub(center); // This is tricky; better to calculate offset relative to desired position

		// 2. Scale the model
        const desiredHeight = 1.8; // Target height in scene units (e.g., meters)
		const scale = desiredHeight / size.y;
		model.scale.set(scale, scale, scale);
        console.log(`Applied scale: ${scale.toFixed(4)}`);

        // 3. Recompute bounding box *after scaling* to get correct offset for grounding
		model.updateMatrixWorld(true); // IMPORTANT: Update matrix after scaling
        const scaledBox = new THREE.Box3().setFromObject(model, true);
        // const scaledCenter = new THREE.Vector3();
        // scaledBox.getCenter(scaledCenter);

		// 4. Position the model
        // Calculate offset needed to place the model's bottom (scaledBox.min.y) at y=0 (floor)
        const groundOffset = -scaledBox.min.y;
		model.position.set(
			-center.x * scale, // Counteract original center offset, adjusted by scale
            groundOffset, // Place bottom of scaled model on the ground (y=0)
			-center.z * scale  // Counteract original center offset, adjusted by scale
		);

		console.log(`Model (${label}) final state:`, {
			scale: scale.toFixed(4),
			position: { x: model.position.x.toFixed(3), y: model.position.y.toFixed(3), z: model.position.z.toFixed(3) }
		});

		// Final check
		model.updateMatrixWorld(true);
		const finalBox = new THREE.Box3().setFromObject(model, true);
		console.log(`Model (${label}) final bounds: min Y: ${finalBox.min.y.toFixed(3)}, max Y: ${finalBox.max.y.toFixed(3)}`);
	}

	// Helper function to list scene hierarchy for debugging
	function listSceneHierarchy(node: THREE.Object3D, level = 0): object {
		const prefix = '  '.repeat(level);
		const info: Record<string, any> = {
			name: node.name || '(unnamed)',
			type: node.type,
			visible: node.visible,
			position: `(${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)}, ${node.position.z.toFixed(2)})`,
			children: []
		};
		if (node.children.length > 0) {
			info.children = node.children.map(child => listSceneHierarchy(child, level + 1));
		}
		return info;
	}

	// --- Update 3D Model Based on Pose ---
	function updateModelFromPose(pose: Pose) {
		if (!activeModel || !pose.keypoints || !tf) return; // Ensure TF is available too

		const keypoints = new Map(pose.keypoints.map(kp => [kp.name, kp]));

		const getKp = (name: string): Keypoint | null => {
			const kp = keypoints.get(name);
			return (kp && (kp.score ?? 0) >= MIN_CONFIDENCE) ? kp : null;
		};

        // Helper to get vector between two keypoints in 2D (normalized Z=0 for simplicity here)
        const getLimbVector = (p1Name: string, p2Name: string): THREE.Vector3 | null => {
            const p1 = getKp(p1Name);
            const p2 = getKp(p2Name);
            if (!p1 || !p2) return null;
            // Normalize coords relative to video size? Could make it more stable, but adds complexity.
            // For now, use raw coords. Need coordinate system mapping eventually.
            // We map webcam Y-down to 3D Y-up.
            return new THREE.Vector3(p2.x - p1.x, -(p2.y - p1.y), 0).normalize();
        };

        // Helper to get the midpoint between two keypoints
        const getMidpoint = (p1Name: string, p2Name: string): THREE.Vector3 | null => {
             const p1 = getKp(p1Name);
             const p2 = getKp(p2Name);
             if (!p1 || !p2) return null;
             // Map Y-down to Y-up
             return new THREE.Vector3((p1.x + p2.x)/2, -((p1.y + p2.y)/2), (p1.z ?? 0 + p2.z ?? 0) / 2); // Average Z if available
        };

        // Target vectors (assuming T-Pose is resting state along axes)
        const UP = new THREE.Vector3(0, 1, 0);
        const DOWN = new THREE.Vector3(0, -1, 0);
        const LEFT = new THREE.Vector3(-1, 0, 0);
        const RIGHT = new THREE.Vector3(1, 0, 0);

        // Function to align a bone (Object3D) from a start direction to a target direction
        // Note: This is still simplified 2D->3D mapping. Proper IK is much more complex.
        const alignBone = (bone: THREE.Object3D | null, targetVector: THREE.Vector3 | null, initialDirection: THREE.Vector3) => {
            if (!bone || !targetVector) return;
            // Calculate rotation needed to go from initialDirection to targetVector
            const quaternion = new THREE.Quaternion().setFromUnitVectors(initialDirection, targetVector);
            // Apply the rotation smoothly (optional Slerp)
            bone.quaternion.slerp(quaternion, 0.5); // Adjust 0.5 for more/less smoothing
        };


		if (activeModel.userData?.isFallback) {
			// Simple angle-based animation for fallback
			const { head, body, leftArm, rightArm, leftLeg, rightLeg } = activeModel.userData;

            const leftShoulder = getKp('left_shoulder');
			const rightShoulder = getKp('right_shoulder');
            const leftHip = getKp('left_hip');
            const rightHip = getKp('right_hip');

            // Torso lean based on shoulder tilt
            if(leftShoulder && rightShoulder && body) {
                 const shoulderAngle = Math.atan2(-(rightShoulder.y - leftShoulder.y), rightShoulder.x - leftShoulder.x);
                 // Apply rotation smoothly to Z-axis
                 body.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), shoulderAngle), 0.5);
            }

            // Limb Rotations (using simple atan2, less accurate 3D mapping)
            alignBone(leftArm, getLimbVector('left_shoulder', 'left_elbow'), DOWN);
            alignBone(rightArm, getLimbVector('right_shoulder', 'right_elbow'), DOWN);
            alignBone(leftLeg, getLimbVector('left_hip', 'left_knee'), DOWN);
            alignBone(rightLeg, getLimbVector('right_hip', 'right_knee'), DOWN);

            // Head facing (rough approximation)
            if (head && leftShoulder && rightShoulder) {
                 const shoulderMid = getMidpoint('left_shoulder', 'right_shoulder');
                 const nose = getKp('nose');
                 if (shoulderMid && nose) {
                     // Create vector from shoulder midpoint towards nose
                     const headDir = new THREE.Vector3(nose.x - shoulderMid.x, -(nose.y - shoulderMid.y), 0.5).normalize(); // Add slight Z forward bias
                     alignBone(head, headDir, UP); // Assuming head's initial direction is UP
                 }
            }

		} else {
			// --- GLTF Animation (Needs Rig/Bone Names) ---
            // This part is HIGHLY dependent on your specific GLTF model's skeleton.
            // You need to find the names of the bones you want to control.
            // Example using common naming conventions:

            const findBone = (namePart: string): THREE.Object3D | null => {
                let found: THREE.Object3D | null = null;
                activeModel?.traverse(node => {
                    if (found) return; // Stop searching if already found
                    if (node.type === 'Bone' && node.name.toLowerCase().includes(namePart.toLowerCase())) {
                        found = node;
                    }
                });
                 //if (!found) console.warn(`Bone containing '${namePart}' not found.`);
                return found;
            };

            const Spine = findBone('spine'); // Or 'hips', 'pelvis'
            const Neck = findBone('neck');
            const Head = findBone('head');
            const LeftUpperArm = findBone('LeftArm'); // Or 'LeftShoulder'
            const RightUpperArm = findBone('RightArm'); // Or 'RightShoulder'
            const LeftLowerArm = findBone('LeftForeArm'); // Or 'LeftElbow'
            const RightLowerArm = findBone('RightForeArm'); // Or 'RightElbow'
            const LeftUpperLeg = findBone('LeftUpLeg'); // Or 'LeftHip'
            const RightUpperLeg = findBone('RightUpLeg'); // Or 'RightHip'
            const LeftLowerLeg = findBone('LeftLeg'); // Or 'LeftKnee'
            const RightLowerLeg = findBone('RightLeg'); // Or 'RightKnee'


             // Body tilt (applied to spine/hips) - More advanced: use hip rotation too
            const leftShoulder = getKp('left_shoulder');
			const rightShoulder = getKp('right_shoulder');
            if(leftShoulder && rightShoulder && Spine) {
                 const shoulderAngle = Math.atan2(-(rightShoulder.y - leftShoulder.y), rightShoulder.x - leftShoulder.x);
                 Spine.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), shoulderAngle), 0.5);
            }

            // Basic limb alignment (map 2D vector to bone rotation)
            // NOTE: Assumes bone's local Y-axis points down the limb in T-Pose
            alignBone(LeftUpperArm, getLimbVector('left_shoulder', 'left_elbow'), DOWN);
            alignBone(RightUpperArm, getLimbVector('right_shoulder', 'right_elbow'), DOWN);
            alignBone(LeftLowerArm, getLimbVector('left_elbow', 'left_wrist'), DOWN); // Forearm alignment
            alignBone(RightLowerArm, getLimbVector('right_elbow', 'right_wrist'), DOWN); // Forearm alignment

            alignBone(LeftUpperLeg, getLimbVector('left_hip', 'left_knee'), DOWN);
            alignBone(RightUpperLeg, getLimbVector('right_hip', 'right_knee'), DOWN);
            alignBone(LeftLowerLeg, getLimbVector('left_knee', 'left_ankle'), DOWN); // Lower leg alignment
            alignBone(RightLowerLeg, getLimbVector('right_knee', 'right_ankle'), DOWN); // Lower leg alignment


             // Head Look At (rough approximation)
            if (Head && Neck && leftShoulder && rightShoulder) { // Might apply rotation to Neck instead of Head
                 const shoulderMid = getMidpoint('left_shoulder', 'right_shoulder');
                 const nose = getKp('nose');
                 if (shoulderMid && nose) {
                     const headDir = new THREE.Vector3(nose.x - shoulderMid.x, -(nose.y - shoulderMid.y), 1.0).normalize(); // Add strong forward Z bias
                     // This is still simplified, real head look requires different approach maybe LookAt constraint
                      alignBone(Neck ?? Head, headDir, UP); // Apply to Neck if found, else Head
                 }
            }
		}
	}

	// --- Toggle Between Male and Female Models ---
	function switchModel(gender: 'male' | 'female') {
		selectedModelGender = gender; // Update state immediately
		console.log(`Switching model to: ${gender}`);

		// Ensure both models exist before trying to switch
		if (!maleModel || !femaleModel || !threeScene) {
			console.warn("Cannot switch model, models not loaded or scene missing.");
			return;
		}

		// Ensure both are in the scene, just control visibility
		if (!threeScene.children.includes(maleModel)) threeScene.add(maleModel);
		if (!threeScene.children.includes(femaleModel)) threeScene.add(femaleModel);

		if (gender === 'male') {
			activeModel = maleModel;
			maleModel.visible = true;
			femaleModel.visible = false;
		} else {
			activeModel = femaleModel;
			maleModel.visible = false;
			femaleModel.visible = true;
		}

		console.log(`Active model is now: ${activeModel.name}`, activeModel);
        console.log(`Male visible: ${maleModel.visible}, Female visible: ${femaleModel.visible}`);

        // Small delay then check visibility again, in case of weird render timing
        setTimeout(() => {
            if(activeModel) {
                 console.log(`Active model visibility check: ${activeModel.visible}`);
            }
            if(modelContainerElement) {
                 modelContainerElement.style.backgroundColor = gender === 'male' ? '#222833' : '#332228'; // Subtle bg change for debug
            }
        }, 100);
	}

	// --- Pose Detection Loop ---
	async function detectPoseLoop() {
        // Check essential components are ready
		if (!detector || !videoElement || videoElement.readyState < 3 /*HAVE_FUTURE_DATA*/ || isLoading) {
			// If still loading, or resources not ready, wait for the next frame
            animationFrameId = requestAnimationFrame(detectPoseLoop);
			return;
		}

		try {
            const poses = await detector.estimatePoses(videoElement, {
                flipHorizontal: false // Adjust if your camera feed is mirrored
            });
            currentPose = poses?.[0] || null; // Get the first detected pose

            // --- Draw Non-3D Previews ---
            drawPreview(); // Draws Skeleton/Cartoon/Dots onto the 2D canvas if selected

            // --- Update 3D Model ---
            if (currentPose && selectedPreview === '3d-model' && activeModel) {
				updateModelFromPose(currentPose);
            }

		} catch (error) {
			console.error('Error during pose estimation:', error);
            errorMessage = "Pose estimation failed. See console.";
            // Stop the loop on error to prevent spamming console
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            return; // Exit loop
		}

        // Continue the loop
        animationFrameId = requestAnimationFrame(detectPoseLoop);
	}

	// --- Render Three.js Scene ---
	function renderThreeScene() {
        // Ensure loop stops if component is destroyed or renderer/scene are lost
		if (!threeRenderer) {
            console.log("Stopping render loop: Missing Three.js renderer.");
			if (threeAnimationId) cancelAnimationFrame(threeAnimationId);
            threeAnimationId = null;
            return;
        }

        if (!threeScene) {
            console.log("Stopping render loop: Missing Three.js scene.");
			if (threeAnimationId) cancelAnimationFrame(threeAnimationId);
            threeAnimationId = null;
            return;
        }

        if (!threeCamera) {
            console.log("Stopping render loop: Missing Three.js camera.");
			if (threeAnimationId) cancelAnimationFrame(threeAnimationId);
            threeAnimationId = null;
            return;
        }

		// Set up the next animation frame first to ensure the loop continues even if there's an error
		threeAnimationId = requestAnimationFrame(renderThreeScene);

        try {
            // IMPORTANT: Update controls if damping is enabled
            if (threeControls) {
                threeControls.update();
            }

            // Render the scene
            threeRenderer.render(threeScene, threeCamera);
        } catch (renderError) {
            console.error("Error during Three.js rendering:", renderError);
            errorMessage = `Render error: ${renderError instanceof Error ? renderError.message : String(renderError)}`;

            // Stop the animation loop after an error
            if (threeAnimationId) {
                cancelAnimationFrame(threeAnimationId);
                threeAnimationId = null;
            }
        }
	}

	// --- Clean Up Three.js Resources ---
	function disposeThreeScene() {
		console.groupCollapsed('Disposing Three.js Scene');
		try {
			// Stop render loop FIRST
			if (threeAnimationId) {
				cancelAnimationFrame(threeAnimationId);
				threeAnimationId = null;
                console.log("Cancelled render loop animation frame.");
			}

            // Dispose controls
            if (threeControls) {
                threeControls.dispose();
                threeControls = null;
                 console.log("Disposed OrbitControls.");
            }

			// Traverse scene and dispose materials/geometries
			if (threeScene) {
				console.log("Traversing scene to dispose resources...");
				threeScene.traverse((object) => {
                    let disposed = false;
					if (object instanceof THREE.Mesh) {
						if (object.geometry) {
							object.geometry.dispose();
                            disposed = true;
						}
						if (object.material) {
							if (Array.isArray(object.material)) {
								object.material.forEach((material) => material.dispose());
							} else {
								object.material.dispose();
							}
                            disposed = true;
						}
					}
                    // Dispose textures? More complex, need to track them.
                    //if(disposed) console.log(`Disposed resources for mesh: ${object.name}`);
				});
                console.log("Finished scene traversal for disposal.");
                // Clear the scene itself
                while(threeScene.children.length > 0){
                    threeScene.remove(threeScene.children[0]);
                }
			}

			// Dispose renderer and remove its canvas
			if (threeRenderer) {
				console.log("Disposing renderer...");
				threeRenderer.dispose();
                 console.log("Renderer disposed.");
				if (modelContainerElement && threeRenderer.domElement.parentNode === modelContainerElement) {
					modelContainerElement.removeChild(threeRenderer.domElement);
                    console.log("Removed renderer canvas from DOM.");
				} else {
                     console.warn("Renderer canvas parent was not the expected container or was already removed.");
                }
				threeRenderer = null;
			}

			// Nullify references
			threeScene = null;
			threeCamera = null;
			maleModel = null;
			femaleModel = null;
			activeModel = null;

			console.log('Three.js scene resources Nulled.');
		} catch (error) {
			console.error('Error during Three.js cleanup:', error);
		}
        console.groupEnd();
	}

    // --- Drawing Functions (2D Previews) ---
    function drawPreview() {
        // Decide which view (2D canvas or 3D container) should be visible
        const is3D = selectedPreview === '3d-model';
        if (previewCanvasElement) {
             previewCanvasElement.style.display = is3D ? 'none' : 'block';
        }
        if (modelContainerElement) {
             modelContainerElement.style.display = is3D ? 'block' : 'none';
             // Also explicitly set visibility if using that style
             modelContainerElement.style.visibility = is3D ? 'visible' : 'hidden';
        }

        // If not 3D, draw on the 2D canvas
        if (!is3D) {
            if (!previewCanvasElement) return;
            const ctx = previewCanvasElement.getContext('2d');
            if (!ctx) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

             // Optional: Draw video background for context?
             // ctx.save();
             // ctx.filter = 'blur(3px) brightness(0.5)';
             // ctx.drawImage(videoElement, 0, 0, canvasWidth, canvasHeight);
             // ctx.restore();


            if (!currentPose) {
                ctx.font = "16px sans-serif";
                ctx.fillStyle = "#aaa";
                ctx.textAlign = "center";
                ctx.fillText("Detecting pose...", canvasWidth / 2, canvasHeight / 2);
                return;
            }

            // Draw selected 2D preview type
            switch (selectedPreview) {
                case 'skeleton': drawSkeleton(ctx, currentPose.keypoints); break;
                case 'cartoon': drawSimpleCartoon(ctx, currentPose.keypoints); break;
                case 'dots': drawKeypointDots(ctx, currentPose.keypoints); break;
            }
        }
    }

    // drawKeypointDots, drawSkeleton, drawSimpleCartoon remain the same...
	function drawKeypointDots(ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) {
        ctx.fillStyle = 'lime'; // Brighter color
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        for (const keypoint of keypoints) {
             if ((keypoint.score ?? 0) >= MIN_CONFIDENCE) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI); // Slightly smaller dots
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    function drawSkeleton(ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) {
		if (!poseDetection) return; // Guard clause
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
		ctx.lineWidth = 2;
        const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
        adjacentPairs.forEach(([i, j]) => {
            const kp1 = keypoints[i];
            const kp2 = keypoints[j];
            if (kp1 && kp2 && (kp1.score ?? 0) >= MIN_CONFIDENCE && (kp2.score ?? 0) >= MIN_CONFIDENCE) {
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        });
        drawKeypointDots(ctx, keypoints); // Draw dots on top
	}

    function drawSimpleCartoon(ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) {
        const kpMap = new Map(keypoints.map(kp => [kp.name, kp]));
        const getKp = (name: string) => {
            const kp = kpMap.get(name);
            return (kp && (kp.score ?? 0) >= MIN_CONFIDENCE) ? kp : null;
        };
		ctx.save(); // Save context state
        ctx.strokeStyle = '#eee'; // Cartoon outline
        ctx.fillStyle = '#333'; // Fill color
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        const drawLimb = (p1Name: string, p2Name: string) => {
            const p1 = getKp(p1Name); const p2 = getKp(p2Name);
            if (p1 && p2) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
        };
        drawLimb('left_shoulder', 'right_shoulder');
        drawLimb('left_hip', 'right_hip');
        drawLimb('left_shoulder', 'left_hip');
        drawLimb('right_shoulder', 'right_hip');
        drawLimb('left_shoulder', 'left_elbow');
        drawLimb('left_elbow', 'left_wrist');
        drawLimb('right_shoulder', 'right_elbow');
        drawLimb('right_elbow', 'right_wrist');
        drawLimb('left_hip', 'left_knee');
        drawLimb('left_knee', 'left_ankle');
        drawLimb('right_hip', 'right_knee');
        drawLimb('right_knee', 'right_ankle');

		// Head
        const nose = getKp('nose');
        const leftEar = getKp('left_ear');
        const rightEar = getKp('right_ear');
        if (nose) {
			const shoulderMidX = ((getKp('left_shoulder')?.x ?? nose.x) + (getKp('right_shoulder')?.x ?? nose.x)) / 2;
			const shoulderMidY = ((getKp('left_shoulder')?.y ?? nose.y) + (getKp('right_shoulder')?.y ?? nose.y)) / 2;

			let headRadius = 25;
            if (leftEar && rightEar) {
                 const earDist = Math.sqrt(Math.pow(leftEar.x - rightEar.x, 2) + Math.pow(leftEar.y - rightEar.y, 2));
                 headRadius = Math.max(15, earDist * 0.6); // Base radius on ear distance if available
            }
            // Simple offset head based on nose and shoulder average
			const headCenterX = nose.x;
			const headCenterY = Math.min(nose.y, shoulderMidY) - headRadius * 0.8; // Place head above nose/shoulders

            ctx.fillStyle = '#ddd'; // Head fill
			ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
            ctx.fill();
			ctx.stroke();
        }
		ctx.restore(); // Restore context state
    }


    // --- Download Function ---
    function downloadPreview() {
        const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
        if (selectedPreview === '3d-model') {
            if (threeRenderer) {
				try {
                	// Force render frame right before capture for accuracy
					if (threeScene && threeCamera) threeRenderer.render(threeScene, threeCamera);
					const dataURL = threeRenderer.domElement.toDataURL('image/png');
					const link = document.createElement('a');
					link.download = `mocap-3d-${selectedModelGender}-${timestamp}.png`;
					link.href = dataURL;
					document.body.appendChild(link); // Required for Firefox
					link.click();
					document.body.removeChild(link);
					link.remove();
				} catch (e) {
					console.error("Failed to capture 3D view:", e);
					errorMessage = "Failed to capture 3D view. Ensure WebGL context is preserveDrawingBuffer=true if issues persist.";
                    // Note: preserveDrawingBuffer can impact performance
				}
            }
            return;
        }
		// Handle 2D canvas download
		if (!previewCanvasElement) return;
		try {
			const dataURL = previewCanvasElement.toDataURL('image/png');
			const link = document.createElement('a');
			link.download = `mocap-2d-${selectedPreview}-${timestamp}.png`;
			link.href = dataURL;
			document.body.appendChild(link); // Required for Firefox
			link.click();
			document.body.removeChild(link);
			link.remove();
		} catch (e) {
			console.error("Failed to capture 2D preview:", e);
			errorMessage = "Failed to capture 2D preview.";
		}
	}

    // --- Handle model gender change ---
	// Attached via on:change in the select element
    function handleModelChange(event: Event) {
        const target = event.target as HTMLSelectElement | null;
        if (target) {
             switchModel(target.value as 'male' | 'female');
        }
    }
</script>

<!-- HTML Structure -->
<svelte:head>
	<title>SvelteKit Motion Capture</title>
</svelte:head>

<div class="app-container">
	<!-- Camera View (Left) -->
	<div class="camera-view card">
		<h2><span class="icon">📷</span> Camera Feed</h2>
		{#if isLoading && !errorMessage}
			<div class="placeholder shimmer">Loading Camera & AI Model...</div>
		{:else if errorMessage && !stream}
            <!-- Show error only if camera failed to start -->
			<div class="placeholder error">{errorMessage}</div>
        {/if}
		<!-- Keep video element always present for binding -->
		<video
			bind:this={videoElement}
			playsinline
			muted
            width={videoWidth}
            height={videoHeight}
            style:max-width="100%"
            style:height="auto"
            class:hidden={isLoading || (errorMessage && !stream)}
			aria-label="Camera Feed"
		></video>
        {#if errorMessage && stream}
         	<div class="warning-message">{errorMessage}</div> <!-- Show non-critical errors below video -->
        {/if}
	</div>

	<!-- Preview View (Right) -->
	<div class="preview-view card">
		<h2><span class="icon">🎭</span> Preview</h2>
		<div class="controls">
            <label for="preview-select">Mode:</label>
			<select id="preview-select" bind:value={selectedPreview} disabled={isLoading || !!errorMessage}>
				{#each previewOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>

            {#if selectedPreview === '3d-model'}
            	<label for="model-select">Model:</label>
            	<select
                	id="model-select"
                	value={selectedModelGender}
					on:change={handleModelChange}
                	disabled={isLoading || !!errorMessage || !maleModel || !femaleModel}
            	>
                	<option value="male">Male</option>
                	<option value="female">Female</option>
            	</select>
            {/if}

			<button
                class="download-btn"
                on:click={downloadPreview}
                disabled={isLoading || !!errorMessage || (!currentPose && selectedPreview !== '3d-model')}
                title="Download current preview frame"
            >
				<span class="icon">💾</span> Download
			</button>
		</div>

        <!-- Preview Area -->
		{#if isLoading && !errorMessage}
			<div class="placeholder shimmer">Initializing Preview...</div>
        {:else if errorMessage}
            <div class="placeholder error">Preview unavailable. {errorMessage}</div>
		{:else}
            <!-- 2D Canvas -->
            <canvas
                bind:this={previewCanvasElement}
                width={canvasWidth}
                height={canvasHeight}
                class="preview-canvas"
                style:max-width="100%"
                style:height="auto"
                style:background-color="#2a2a2e"
				style:border="1px solid #444"
                style:display={selectedPreview !== '3d-model' ? 'block' : 'none'}
                aria-label="2D Pose Preview Canvas"
            ></canvas>

            <!-- 3D Container -->
            <div
                bind:this={modelContainerElement}
                class="model-container"
				aria-label="3D Model Preview Container"
                style:display={selectedPreview === '3d-model' ? 'block' : 'none'}
				style:height="{canvasHeight}px"
				style:max-height="70vh"
				style:border="3px solid #ff8800"
            >
			 	<!-- Three.js canvas gets appended here by initThreeScene -->
				{#if !threeRenderer}
				<div class="placeholder">
                    <p>Setting up 3D view...</p>
                    <p>Container size: {modelContainerElement?.clientWidth || 0}x{modelContainerElement?.clientHeight || 0}</p>
                    <p>If you see this for more than a few seconds, check the console for errors.</p>
                </div>
				{/if}
			</div>
        {/if}

        <!-- Description -->
        {#if !isLoading && !errorMessage}
            <p class="preview-desc">
            {#if selectedPreview === 'cartoon'} A simplified cartoon representation.
            {:else if selectedPreview === 'skeleton'} Detected keypoints (dots) and skeletal connections.
            {:else if selectedPreview === 'dots'} Detected keypoint locations only.
            {:else if selectedPreview === '3d-model'} Interactive 3D model animated by your pose. Drag to rotate, Scroll to zoom.
            {/if}
            </p>
        {/if}
	</div>
</div>


<!-- Styles -->
<style lang="scss">
	:global(body) {
		margin: 0;
		background-color: #e9ecef; // Light background for the page
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		color: #212529;
	}

	.app-container {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem; // Reduced gap
		padding: 1.5rem;
		min-height: calc(100vh - 3rem); // Ensure it fills viewport height minus padding
		box-sizing: border-box;
	}

	.card { // Common card styling
		flex: 1 1 450px; // Grow, shrink, base width
        min-width: 320px; // Prevent getting too small
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background-color: #ffffff;
		border-radius: 12px; // Softer corners
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
		box-sizing: border-box;
	}

    h2 {
		margin: 0 0 0.5rem 0;
		color: #343a40;
		border-bottom: 2px solid #dee2e6;
		padding-bottom: 0.75rem;
		font-size: 1.4rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		.icon { font-size: 1.2em; }
	}

	.placeholder {
		display: flex;
		flex-direction: column; // Allow text wrapping
		align-items: center;
		justify-content: center;
		min-height: 300px;
        height: 100%; // Try to fill card space
		flex-grow: 1; // Allow placeholder to grow if content above is small
		background-color: #f1f3f5;
		color: #6c757d;
		border-radius: 8px;
		text-align: center;
		padding: 1.5rem;
		box-sizing: border-box;
		font-style: italic;
		font-size: 0.95rem;

		&.error {
			background-color: #fff3cd; // Light yellow warning
			color: #856404;
			border: 1px solid #ffeeba;
			font-weight: 500;
			font-style: normal;
		}

        &.shimmer {
            background-image: linear-gradient(
                90deg, #f1f3f5 0px, #e9ecef 40px, #f1f3f5 80px
            );
            background-size: 600px; // Wider shimmer
            animation: shimmer 1.5s infinite linear;
        }
	}
     .warning-message {
        padding: 0.75rem 1rem;
        background-color: #fff9e6;
        color: #b38f00;
        border: 1px solid #ffe58f;
        border-radius: 6px;
        font-size: 0.85rem;
        text-align: center;
     }

	video {
		display: block;
		border-radius: 8px;
		background-color: #111; // Dark background for contrast
		border: 1px solid #dee2e6;
        object-fit: cover; // Cover the area, may crop slightly

		&.hidden {
			display: none;
		}
	}

    .preview-canvas {
		display: block; // Ensure it's block
		border-radius: 8px;
        object-fit: contain; // Ensure whole canvas is visible
	}

	.model-container {
		border-radius: 8px;
		background-color: #222; // Match scene background potentially
		overflow: hidden; // Crucial
		position: relative; // For absolute positioning of canvas inside
		width: 100%; // Take full width of parent card
        min-height: 300px; // Ensure minimum space
        flex-grow: 1; // Allow container to grow
        display: block; // Needs to be block or flex etc.

		/* Ensure the Three.js canvas fills this container */
		:global(canvas) { // Target the dynamically added canvas
			width: 100% !important;
			height: 100% !important;
			display: block; // Essential
			position: absolute; // Position within container bounds
			top: 0;
			left: 0;
		}
	}

	.controls {
		display: flex;
		gap: 0.75rem 1rem; // Row and column gap
		align-items: center;
		flex-wrap: wrap; // Allow controls to wrap on small screens
		padding-bottom: 0.5rem; // Add slight space below controls

		label {
			font-weight: 500;
			font-size: 0.9rem;
			color: #495057;
		}

		select, button {
			padding: 0.5em 1em;
			border: 1px solid #ced4da;
			border-radius: 6px; // Slightly softer corners
			font-size: 0.9rem;
			background-color: #fff;
			cursor: pointer;
			transition: all 0.15s ease-in-out;
            line-height: 1.5;

			&:focus {
				outline: none;
				border-color: #86b7fe;
				box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
			}

			&:disabled {
				background-color: #e9ecef;
				cursor: not-allowed;
				opacity: 0.65;
			}
		}

		button.download-btn {
			background-color: #28a745; // Green download button
			color: white;
			border-color: #28a745;
			display: inline-flex; // Align icon and text
			align-items: center;
			gap: 0.4em;
			margin-left: auto; // Push download button to the right if space allows

			.icon { font-size: 1.1em; }

			&:hover:not(:disabled) {
				background-color: #218838;
				border-color: #1e7e34;
			}
            &:active:not(:disabled) {
                 background-color: #1c6c2e;
            }
		}
	}

    .preview-desc {
		font-size: 0.8rem;
		color: #6c757d;
		text-align: center;
		margin-top: 0.5rem;
		margin-bottom: 0; // Remove bottom margin
	}

    @keyframes shimmer {
		0% { background-position: -300px 0; }
		100% { background-position: 300px 0; }
	}

    /* Responsive adjustments */
    @media (max-width: 900px) {
		.app-container {
			flex-direction: column;
            gap: 1rem;
            padding: 1rem;
		}
        .card {
             flex-basis: auto; // Let cards stack naturally
        }
	}
    @media (max-width: 500px) {
        .controls {
            button.download-btn {
                margin-left: 0; // Don't push button right on very small screens
                width: 100%; // Make button full width
                justify-content: center;
            }
            select {
                 flex-grow: 1; // Allow selects to fill space
            }
        }
         h2 { font-size: 1.2rem; }
    }

</style>