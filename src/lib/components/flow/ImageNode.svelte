<script lang="ts">
    import { Handle, Position, type NodeProps, NodeResizer } from '@xyflow/svelte';
    import { useSvelteFlow } from '@xyflow/svelte';
    import { writable, get } from 'svelte/store';
    import { onMount, onDestroy } from 'svelte';
    import ViewModeButtons from '$lib/components/shared/ViewModeButtons.svelte';
    import AppDropdown from '$lib/components/shared/AppDropdown.svelte';
    import AppTextarea from '$lib/components/shared/AppTextarea.svelte';
    import { isTextFocused } from '$lib/stores/flowStores';
    import PerformanceWrapper from '$lib/components/shared/PerformanceWrapper.svelte';
    import { streamingImages, removeStreamingImage, setStreamingImage, updateStreamingImageStatus } from '$lib/stores/streamingImages';

    type $$Props = NodeProps;

    export let id: $$Props['id'];
    export let parentId: $$Props['parentId'] = undefined;
    export let data: $$Props['data'] = {
        imageUrl: null,
        label: 'Image Node',
        fitMode: 'fit', // 'fit' or 'manual'
        manualWidth: 200,
        manualHeight: 150,
        description: '' // AI-generated description for context (empty string when no description)
    };
    export let width: number | undefined = undefined;
    export let height: number | undefined = undefined;

    // Retrieve Svelte-Flow helpers but alias updateNodeData so we can override
    const { updateNodeData: updateNodeDataSF, updateNode } = useSvelteFlow();

    // Import reactive updater for nodes that are *not* part of the Svelte-Flow provider (i.e. children of frames)
    import { updateNodeDataReactive } from '$lib/stores/flowStores.js';
    import { uploadImageFile, processImageUrl, shouldRefreshSignedUrl, refreshSignedUrl } from '$lib/services/imageStorageService.js';

    /**
     * Unified updateNodeData that transparently writes to the correct store:
     * – Top-level nodes → use Svelte-Flow helper (keeps provider in sync)
     * – Child nodes inside a Frame (have parentId) → use reactive store helper
     */
    function updateNodeData(nodeId: string, newData: any) {
        if (parentId) {
            // Nested node – update global flow store directly
            updateNodeDataReactive(nodeId, newData);
        } else {
            // Top-level node – defer to Svelte-Flow utility
            updateNodeDataSF(nodeId, newData);
        }
    }

    const localImageUrl = writable<string | null>( (typeof data.imageUrl === 'string' ? data.imageUrl : null) );
    const nodeLabel = writable<string>( (typeof data.label === 'string' && data.label ? data.label : `Image ${id}`) );
    const isDraggingOver = writable(false);
    const errorMsg = writable<string | null>(null);

    // Reactive display image URL that prioritizes streaming images over permanent URLs
    let displayImageUrl: string | null = null;
    let isStreamingImageDisplayed = false;
    
    $: {
        const streamingData = $streamingImages.get(id);
        const permanentUrl = $localImageUrl;
        
        if (streamingData?.base64Url) {
            // Show streaming image during generation/upload
            displayImageUrl = streamingData.base64Url;
            isStreamingImageDisplayed = true;
        } else if (permanentUrl) {
            // Show permanent URL after upload completes
            displayImageUrl = permanentUrl;
            isStreamingImageDisplayed = false;
        } else {
            // No image available
            displayImageUrl = null;
            isStreamingImageDisplayed = false;
        }
    }
    let fileInput: HTMLInputElement;

    const showGenerator = writable(false);
    const prompt = writable('');
    const selectedModel = writable('gpt-image-1');
    const isGenerating = writable(false);
    const partialImageUrl = writable<string | null>(null);
    const showPartialImage = writable(false);
    const isUploading = writable(false);
    
    // Reactive upload status from streaming store
    let isStreamingUpload = false;
    $: {
        const streamingData = $streamingImages.get(id);
        isStreamingUpload = streamingData?.isUploading || false;
    }

    // Model options for dropdown with icons
    const imageModels = [
        {
            value: 'fal-ai/lcm-sd15-i2i',
            label: 'Fal LCM SD15',
            icon: 'logos/blackforest.svg'
        },
        {
            value: 'gpt-image-1',
            label: 'GPT Image',
            icon: 'logos/openai.svg'
        }
    ];

    const isNodeHovered = writable(false);

    // State for AI description generation
    let isGeneratingDescription = false;

    // Upload tracking to prevent duplicates
    let currentUploadHash = null;
    let uploadPromiseCache = new Map();
    let hasProcessedFinalImage = false; // Track if we've processed a final image

    /**
     * Generate a simple hash for image content to detect duplicates
     */
    function generateImageHash(imageUrl) {
        if (!imageUrl || typeof imageUrl !== 'string') return null;
        
        // For base64 images, use a portion of the data as hash
        if (imageUrl.startsWith('data:image')) {
            // Take a sample from the middle of the base64 string for hash
            const base64Data = imageUrl.split(',')[1] || '';
            const sampleLength = Math.min(200, base64Data.length); // Increased sample size
            const sampleStart = Math.floor((base64Data.length - sampleLength) / 2);
            return base64Data.substring(sampleStart, sampleStart + sampleLength);
        }
        
        // For URLs, use the URL itself as hash
        return imageUrl;
    }

    /**
     * Handle Supabase upload with deduplication
     */
    async function handleSupabaseUpload(imageUrl, uploadContext = 'generation') {
        if (!imageUrl || !imageUrl.startsWith('data:image')) {
            return imageUrl; // Not a base64 image, no upload needed
        }

        const imageHash = generateImageHash(imageUrl);
        if (!imageHash) {
            console.warn(`[ImageNode ${id}] Could not generate hash for image`);
            return imageUrl;
        }

        // Check if we're already uploading this exact image
        if (uploadPromiseCache.has(imageHash)) {
            console.log(`[ImageNode ${id}] Reusing existing upload promise for ${uploadContext}`);
            try {
                const cachedResult = await uploadPromiseCache.get(imageHash);
                return cachedResult || imageUrl;
            } catch (error) {
                console.error(`[ImageNode ${id}] Cached upload failed:`, error);
                uploadPromiseCache.delete(imageHash);
                return imageUrl;
            }
        }

        // Start new upload and cache the promise
        console.log(`[ImageNode ${id}] Starting new Supabase upload for ${uploadContext}`);
        const uploadPromise = processImageUrl(imageUrl, id);
        uploadPromiseCache.set(imageHash, uploadPromise);

        try {
            const result = await uploadPromise;
            const finalUrl = result || imageUrl;
            
            // Update cache with final result
            uploadPromiseCache.set(imageHash, Promise.resolve(finalUrl));
            
            console.log(`[ImageNode ${id}] Upload completed for ${uploadContext}: ${result ? 'success' : 'fallback'}`);
            return finalUrl;
        } catch (error) {
            console.error(`[ImageNode ${id}] Upload failed for ${uploadContext}:`, error);
            uploadPromiseCache.delete(imageHash);
            return imageUrl;
        }
    }

    /**
     * Clear upload cache when starting new generation
     */
    function clearUploadCache() {
        uploadPromiseCache.clear();
        currentUploadHash = null;
        hasProcessedFinalImage = false; // Reset final image flag
        console.log(`[ImageNode ${id}] Cleared upload cache and reset flags`);
    }

    const DEFAULT_NODE_WIDTH = 200;
    const DEFAULT_NODE_HEIGHT = 150;
    const MAX_DIMENSION = 1000;
    const MIN_DIMENSION = 50;
    const HOVER_BOUNDS_PADDING = 25;
    const NODE_BORDER_RADIUS = 6;

    // Track current image dimensions and aspect ratio
    let currentImageAspectRatio: number | null = null;
    let isResizing = false;
    let hasInitializedDimensions = false;

    function calculateImageDimensions(naturalWidth: number, naturalHeight: number): { width: number; height: number } {
        if (naturalWidth === 0 || naturalHeight === 0) {
            return { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
        }

        const aspectRatio = naturalWidth / naturalHeight;
        currentImageAspectRatio = aspectRatio;

        let newWidth = naturalWidth;
        let newHeight = naturalHeight;

        // Scale down if too large, maintaining aspect ratio
        if (newWidth > MAX_DIMENSION || newHeight > MAX_DIMENSION) {
            if (aspectRatio > 1) { // Landscape
                newWidth = MAX_DIMENSION;
                newHeight = MAX_DIMENSION / aspectRatio;
            } else { // Portrait
                newHeight = MAX_DIMENSION;
                newWidth = MAX_DIMENSION * aspectRatio;
            }
        }

        // Ensure minimum dimensions
        if (newWidth < MIN_DIMENSION) {
            newWidth = MIN_DIMENSION;
            newHeight = MIN_DIMENSION / aspectRatio;
        }
        if (newHeight < MIN_DIMENSION) {
            newHeight = MIN_DIMENSION;
            newWidth = MIN_DIMENSION * aspectRatio;
        }

        return {
            width: Math.round(newWidth),
            height: Math.round(newHeight)
        };
    }

    function updateNodeDimensions(newWidth: number, newHeight: number, updateMode: boolean = true) {
        if (isResizing && !updateMode) return; // Don't interfere with manual resizing unless explicitly updating mode

        updateNode(id, { width: newWidth, height: newHeight });

        // Update data to store the dimensions and mode
        const updatedData: any = {
            ...data,
            imageUrl: get(localImageUrl) || data.imageUrl || null, // Preserve latest image URL
            width: newWidth,
            height: newHeight,
            aspectRatio: currentImageAspectRatio
        };

        // If we're in manual mode or switching to manual mode, store manual dimensions
        if (data.fitMode === 'manual' || updateMode) {
            updatedData.manualWidth = newWidth;
            updatedData.manualHeight = newHeight;
        }

        updateNodeData(id, updatedData);

        hasInitializedDimensions = true;
        errorMsg.set(null);

        console.log(`[ImageNode ${id}] Updated dimensions to ${newWidth}x${newHeight} (mode: ${data.fitMode}, AR: ${currentImageAspectRatio?.toFixed(2)})`);
    }

    async function loadImageAndSetDimensions(imageUrl: string | null) {
        if (!imageUrl) {
            // No image - use appropriate dimensions based on mode
            if (!hasInitializedDimensions) {
                if (data.fitMode === 'manual' && data.manualWidth && data.manualHeight) {
                    updateNodeDimensions(data.manualWidth as number, data.manualHeight as number, false);
                } else {
                    updateNodeDimensions(DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, false);
                }
            }
            errorMsg.set(null);
            currentImageAspectRatio = null;
            return;
        }

        // Check if signed URL needs refreshing
        let finalImageUrl = imageUrl;
        if (shouldRefreshSignedUrl(imageUrl)) {
            console.log(`🔄 [ImageNode ${id}] Refreshing expired signed URL`);
            try {
                const refreshedUrl = await refreshSignedUrl(imageUrl);
                if (refreshedUrl !== imageUrl) {
                    finalImageUrl = refreshedUrl;
                    // Update the node data with refreshed URL
                    updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                    localImageUrl.set(finalImageUrl);
                    console.log(`✅ [ImageNode ${id}] URL refreshed successfully`);
                }
            } catch (error) {
                console.warn(`⚠️ [ImageNode ${id}] Failed to refresh signed URL:`, error);
                // Continue with original URL as fallback
            }
        }

        const img = new Image();
        img.onload = () => {
            const { width: newWidth, height: newHeight } = calculateImageDimensions(img.naturalWidth, img.naturalHeight);

            // Respect the fit mode - prioritize manual mode over initialization status
            if (data.fitMode === 'manual' && data.manualWidth && data.manualHeight) {
                // In manual mode, always use manual dimensions
                updateNodeDimensions(data.manualWidth as number, data.manualHeight as number, false);
            } else if (data.fitMode === 'fit' || !hasInitializedDimensions) {
                // In fit mode or first load without manual dimensions, use calculated dimensions
                updateNodeDimensions(newWidth, newHeight, false);
            }

            // Generate AI description if image is base64 and no description exists
            if (finalImageUrl.startsWith('data:image') && (!data.description || (typeof data.description === 'string' && data.description.trim() === ''))) {
                console.log(`🔍 [ImageNode ${id}] New base64 image detected, generating description`);
                generateImageDescription(finalImageUrl);
            }
        };

        img.onerror = async () => {
            // If image fails to load and it's a signed URL, try refreshing it
            if (shouldRefreshSignedUrl(finalImageUrl)) {
                console.log(`🔄 [ImageNode ${id}] Image load failed, attempting URL refresh`);
                try {
                    const refreshedUrl = await refreshSignedUrl(finalImageUrl);
                    if (refreshedUrl !== finalImageUrl) {
                        // Update the node data and retry loading
                        updateNodeData(id, { ...data, imageUrl: refreshedUrl });
                        localImageUrl.set(refreshedUrl);
                        loadImageAndSetDimensions(refreshedUrl);
                        return; // Exit early to retry with new URL
                    }
                } catch (error) {
                    console.warn(`⚠️ [ImageNode ${id}] Failed to refresh URL after load error:`, error);
                }
            }
            
            errorMsg.set('Failed to load image. URL may be expired or invalid.');
            currentImageAspectRatio = null;
            if (!hasInitializedDimensions) {
                if (data.fitMode === 'manual' && data.manualWidth && data.manualHeight) {
                    updateNodeDimensions(data.manualWidth as number, data.manualHeight as number, false);
                } else {
                    updateNodeDimensions(DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, false);
                }
            }
        };

        img.src = finalImageUrl;
    }

    // Handle manual resize while maintaining aspect ratio
    function handleResize() {
        if (!currentImageAspectRatio || !width || !height) return;

        // Switch to manual mode when manually resized
        const updatedData = {
            ...data,
            width: width,
            height: height,
            aspectRatio: currentImageAspectRatio,
            fitMode: 'manual',
            manualWidth: width,
            manualHeight: height
        };

        updateNodeData(id, updatedData);
        console.log(`[ImageNode ${id}] Switched to manual mode: ${width}x${height}`);
    }

    // Update dimensions when width or height props change (from ObjectToolbar)
    function updateDimensionsFromProps(newWidth?: number, newHeight?: number) {
        if (!currentImageAspectRatio) return;

        let targetWidth = newWidth || width || DEFAULT_NODE_WIDTH;
        let targetHeight = newHeight || height || DEFAULT_NODE_HEIGHT;

        // If only one dimension is provided, calculate the other
        if (newWidth && !newHeight) {
            targetHeight = Math.round(newWidth / currentImageAspectRatio);
        } else if (newHeight && !newWidth) {
            targetWidth = Math.round(newHeight * currentImageAspectRatio);
        }

        updateNode(id, { width: targetWidth, height: targetHeight });
        updateNodeData(id, {
            ...data,
            imageUrl: get(localImageUrl) || data.imageUrl || null,
            width: targetWidth,
            height: targetHeight,
            aspectRatio: currentImageAspectRatio
        });
    }

    onMount(() => {
        // Initialize dimensions on mount
        if (width !== undefined && height !== undefined) {
            hasInitializedDimensions = true;
        }

        // Ensure description property exists and is a string
        if (data.description === null || data.description === undefined) {
            updateNodeData(id, {
                ...data,
                description: ''
            });
        }

        // Load initial image
        loadImageAndSetDimensions($localImageUrl);

        // Listen for dimension updates from ObjectToolbar
        if (typeof window !== 'undefined') {
            window.addEventListener('imageNodeDimensionUpdate', handleDimensionUpdate);
            window.addEventListener('imageNodeResetToOriginal', handleResetToOriginal);
            window.addEventListener('imageNodeReplaceImage', handleReplaceImageRequest);
            window.addEventListener('imageNodeToggleFit', handleToggleFit);
            window.addEventListener('generateImageInNode', handleGenerateImageInNode);
            window.addEventListener('updateImageNodeDescription', handleUpdateDescription);
        }
    });

    onDestroy(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('imageNodeDimensionUpdate', handleDimensionUpdate);
            window.removeEventListener('imageNodeResetToOriginal', handleResetToOriginal);
            window.removeEventListener('imageNodeReplaceImage', handleReplaceImageRequest);
            window.removeEventListener('imageNodeToggleFit', handleToggleFit);
            window.removeEventListener('generateImageInNode', handleGenerateImageInNode);
            window.removeEventListener('updateImageNodeDescription', handleUpdateDescription);
        }

        // Clean up upload cache to prevent memory leaks
        clearUploadCache();
    });

    function handleDimensionUpdate(event: CustomEvent) {
        if (event.detail?.nodeId === id) {
            const { width: newWidth, height: newHeight } = event.detail;

            // When dimensions are manually updated, switch to manual mode
            const updatedData = {
                ...data,
                fitMode: 'manual',
                manualWidth: newWidth,
                manualHeight: newHeight,
                aspectRatio: currentImageAspectRatio
            };

            updateNodeData(id, updatedData);
            updateDimensionsFromProps(newWidth, newHeight);
        }
    }

    function handleResetToOriginal(event: CustomEvent) {
        if (event.detail?.nodeId === id && $localImageUrl) {
            // Reset initialization and reload image to get original dimensions
            hasInitializedDimensions = false;
            currentImageAspectRatio = null;
            loadImageAndSetDimensions($localImageUrl);
            console.log(`🔄 [ImageNode ${id}] Resetting to original image dimensions`);
        }
    }

    function handleReplaceImageRequest(event: CustomEvent) {
        if (event.detail?.nodeId === id) {
            openFilePicker();
            console.log(`📁 [ImageNode ${id}] Opening file picker from ObjectToolbar`);
        }
    }

    function handleToggleFit(event: CustomEvent) {
        if (event.detail?.nodeId === id) {
            const newFitMode = data.fitMode === 'fit' ? 'manual' : 'fit';

            if (newFitMode === 'fit') {
                // Switch to fit mode - auto-size to image
                const updatedData = {
                    ...data,
                    fitMode: 'fit'
                };
                updateNodeData(id, updatedData);

                // Reload image to get natural dimensions
                if ($localImageUrl) {
                    hasInitializedDimensions = false;
                    loadImageAndSetDimensions($localImageUrl);
                }
            } else {
                // Switch to manual mode - store current dimensions
                const updatedData = {
                    ...data,
                    fitMode: 'manual',
                    manualWidth: width || DEFAULT_NODE_WIDTH,
                    manualHeight: height || DEFAULT_NODE_HEIGHT
                };
                updateNodeData(id, updatedData);
            }

            console.log(`🎯 [ImageNode ${id}] Toggled fit mode to: ${newFitMode}`);
        }
    }

    function handleGenerateImageInNode(event: CustomEvent) {
        if (event.detail?.nodeId === id) {
            const { prompt: promptText, model: modelName } = event.detail;

            // Set the prompt and model
            prompt.set(promptText || '');
            selectedModel.set(modelName || 'gpt-image-1');

            // Show generator UI
            showGenerator.set(true);

            // Trigger generation
            generateImage();

            console.log(`🎨 [ImageNode ${id}] AI-triggered image generation: "${promptText}"`);
        }
    }

    function handleUpdateDescription(event: CustomEvent) {
        if (event.detail?.nodeId === id) {
            const { description } = event.detail;

            // Update node data with the new description
            const updatedData = {
                ...data,
                description: description || ''
            };

            updateNodeData(id, updatedData);
            console.log(`📝 [ImageNode ${id}] Description updated from AIInference: "${description}"`);
        }
    }

    // Reactive statements
    // Sync prop → local store, but **only** when the prop provides a *truthy* string.
    // This prevents "blank" resets that can happen when parent components rerender
    // without carrying over the latest `imageUrl`.
    $: {
        const newImgUrl = typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0 ? data.imageUrl : null;
        if (newImgUrl && newImgUrl !== $localImageUrl) {
            localImageUrl.set(newImgUrl);
            // Reset initialization flag when image changes
            hasInitializedDimensions = false;
            currentImageAspectRatio = null;
            loadImageAndSetDimensions(newImgUrl);
        }
    }

    $: if (data.label !== $nodeLabel) {
        nodeLabel.set( (typeof data.label === 'string' && data.label ? data.label : `Image ${id}`) );
    }

    // Handle resizing state
    let resizeTimeout: ReturnType<typeof setTimeout>;
    function handleResizeStart() {
        isResizing = true;
    }

    function handleResizeEnd() {
        // Clear any pending timeout
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        // Set a timeout to detect when resizing has stopped
        resizeTimeout = setTimeout(() => {
            isResizing = false;
            handleResize();
        }, 100);
    }

    async function handleFileSelect(files: FileList | null) {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            errorMsg.set('Please upload an image file.');
            return;
        }
        errorMsg.set(null);

        // Show loading state while uploading
        const tempDataUrl = URL.createObjectURL(file);
        localImageUrl.set(tempDataUrl);
        hasInitializedDimensions = false;
        loadImageAndSetDimensions(tempDataUrl);

        // Start uploading state
        isUploading.set(true);

        try {
            // Upload to Supabase Storage using deduplication logic
            console.log(`[ImageNode ${id}] Uploading file to Supabase Storage...`);
            
            // Convert file to data URL for hash generation
            const reader = new FileReader();
            const fileDataUrl = await new Promise<string>((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
            
            // Use upload deduplication (pass the actual file for upload)
            const supabaseUrl = await (async () => {
                const imageHash = generateImageHash(fileDataUrl);
                if (!imageHash) {
                    console.warn(`[ImageNode ${id}] Could not generate hash for file upload`);
                    return await uploadImageFile(file, id, null);
                }

                // Check if we're already uploading this exact file
                if (uploadPromiseCache.has(imageHash)) {
                    console.log(`[ImageNode ${id}] Reusing existing upload promise for file upload`);
                    try {
                        return await uploadPromiseCache.get(imageHash);
                    } catch (error) {
                        console.error(`[ImageNode ${id}] Cached file upload failed:`, error);
                        uploadPromiseCache.delete(imageHash);
                        return await uploadImageFile(file, id, null);
                    }
                }

                // Start new upload and cache the promise
                console.log(`[ImageNode ${id}] Starting new file upload to Supabase`);
                const uploadPromise = uploadImageFile(file, id, null);
                uploadPromiseCache.set(imageHash, uploadPromise);

                try {
                    const result = await uploadPromise;
                    // Update cache with final result
                    uploadPromiseCache.set(imageHash, Promise.resolve(result));
                    return result;
                } catch (error) {
                    console.error(`[ImageNode ${id}] File upload failed:`, error);
                    uploadPromiseCache.delete(imageHash);
                    return null;
                }
            })();
            
            if (supabaseUrl) {
                // Success - update with Supabase URL
                console.log(`[ImageNode ${id}] File uploaded successfully: ${supabaseUrl}`);
                localImageUrl.set(supabaseUrl);
                updateNodeData(id, { ...data, imageUrl: supabaseUrl });
                loadImageAndSetDimensions(supabaseUrl);
                errorMsg.set(null);
            } else {
                // Fallback to local data URL if upload fails
                console.warn(`[ImageNode ${id}] Upload failed, using fallback data URL`);
                localImageUrl.set(fileDataUrl);
                updateNodeData(id, { ...data, imageUrl: fileDataUrl });
                loadImageAndSetDimensions(fileDataUrl);
                errorMsg.set('Upload failed, using local storage (may affect save performance)');
            }
        } catch (error) {
            console.error(`[ImageNode ${id}] File upload error:`, error);
            // Fallback to local data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target && typeof e.target.result === 'string') {
                    const result: string = e.target.result;
                    localImageUrl.set(result);
                    updateNodeData(id, { ...data, imageUrl: result });
                    loadImageAndSetDimensions(result);
                }
            };
            reader.readAsDataURL(file);
            errorMsg.set('Upload failed, using local storage (may affect save performance)');
        } finally {
            // End uploading state
            isUploading.set(false);
            // Clean up temporary object URL
            URL.revokeObjectURL(tempDataUrl);
        }
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();
        isDraggingOver.set(false);
        const files = event.dataTransfer?.files;
        if (files) handleFileSelect(files);
    }

    function onDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
        isDraggingOver.set(true);
    }

    function onDragEnter(event: DragEvent) {
        event.preventDefault();
        isDraggingOver.set(true);
    }

    function onDragLeave(event: DragEvent) {
        if (event.relatedTarget && !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
            isDraggingOver.set(false);
        } else if (!event.relatedTarget) {
            isDraggingOver.set(false);
        }
    }

    function openFilePicker() {
        fileInput?.click();
    }

    function toggleGenerator() {
        showGenerator.update(s => !s);
    }

    // Helper function to validate image URL format
    function isValidImageUrl(url: string | null): boolean {
        if (!url || typeof url !== 'string') {
            return false;
        }
        // Check for common valid image URL formats
        return url.startsWith('data:image') || url.startsWith('http');
    }

    async function generateImage() {
        if (!get(prompt)?.trim() || get(isGenerating)) return;

        isGenerating.set(true);
        errorMsg.set(null);
        partialImageUrl.set(null);
        showPartialImage.set(false);

        // Clear upload cache to start fresh
        clearUploadCache();

        const model = get(selectedModel);
        const imageUrl = get(localImageUrl);
        let endpoint: string;
        let payload: any;

        if (model === 'gpt-image-1') {
            if (isValidImageUrl(imageUrl)) {
                // Image exists and is valid, use the edit endpoint
                endpoint = '/api/ai/image-edit';
                payload = {
                    prompt: get(prompt),
                    imageData: imageUrl,
                    aspectRatio: '1:1'
                };
            } else {
                // No image or invalid format, use the generate endpoint
                endpoint = '/api/ai/generate-image';
                payload = {
                    prompt: get(prompt),
                    model: 'gpt-image-1' // Explicitly set model for generate endpoint
                };
            }
        } else if (model === 'fal-ai/lcm-sd15-i2i') {
            endpoint = '/api/ai/fal-generate';
            payload = {
                prompt: get(prompt),
                image_url: imageUrl,
                model
            };
        } else {
            // Fallback for unsupported models
            isGenerating.set(false);
            errorMsg.set(`Model "${model}" not supported for image generation.`);
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Non-streaming error
                const err = await response.json().catch(() => null);
                throw new Error(err?.error || `Failed to generate image (${response.status})`);
            }

            let finalImageUrl: string | null = null;
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('text/event-stream')) {
                // --- STREAMING (SSE) HANDLING ---
                const reader = response.body?.getReader();
                if (!reader) throw new Error('No response stream');
                const decoder = new TextDecoder();
                let buffer = '';
                let done = false;

                const handleEventString = async (eventStr: string) => {
                    const trimmed = eventStr.trim();
                    if (!trimmed.startsWith('data:')) return;
                    const jsonText = trimmed.slice(5).trim();
                    if (!jsonText) return;
                    let eventData: any;
                    try { eventData = JSON.parse(jsonText); }
                    catch { return; }

                    console.log('[ImageNode] Streaming event:', eventData.type, eventData);

                    if (eventData.type === 'partial_image' && eventData.imageData) {
                        // Put partial image in streaming store for immediate display
                        setStreamingImage(id, eventData.imageData, false);
                        showPartialImage.set(true);
                    } else if ((eventData.type === 'final_image' || eventData.type === 'image_url') && eventData.imageUrl) {
                        console.log(`[ImageNode ${id}] Processing final image event`);
                        finalImageUrl = eventData.imageUrl;
                        
                        // Mark that we've processed a final image to prevent JSON fallback
                        hasProcessedFinalImage = true;
                        
                        // CRITICAL: Immediately stop showing partial image and generating state FIRST
                        showPartialImage.set(false);
                        partialImageUrl.set(null);
                        isGenerating.set(false);
                        
                        // Put final base64 image in streaming store for immediate display
                        // DO NOT set localImageUrl to base64 - keep it null until we have Supabase URL
                        setStreamingImage(id, finalImageUrl, false);
                        loadImageAndSetDimensions(finalImageUrl);
                        
                        // Handle Supabase upload with deduplication
                        if (finalImageUrl.startsWith('data:image')) {
                            console.log(`[ImageNode ${id}] Starting deduuplicated Supabase upload for final image`);
                            // Update streaming store to show upload status
                            updateStreamingImageStatus(id, true);
                            
                            try {
                                const supabaseUrl = await handleSupabaseUpload(finalImageUrl, 'final_image');
                                if (supabaseUrl && supabaseUrl !== finalImageUrl) {
                                    console.log(`[ImageNode ${id}] Supabase upload completed: ${supabaseUrl}`);
                                    // Now set the permanent URL and remove from streaming store
                                    localImageUrl.set(supabaseUrl);
                                    updateNodeData(id, { ...data, imageUrl: supabaseUrl });
                                    finalImageUrl = supabaseUrl;
                                    // Streaming store will be cleaned up by imageStorageService
                                } else {
                                    console.warn(`[ImageNode ${id}] Upload failed or returned same URL, using base64 fallback`);
                                    updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                                    // Keep the streaming image since upload failed
                                }
                                updateStreamingImageStatus(id, false);
                            } catch (uploadError) {
                                console.error(`[ImageNode ${id}] Upload error:`, uploadError);
                                updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                                isUploading.set(false);
                            }
                        } else {
                            // Already a URL (not base64), update node data directly
                            updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                        }
                        
                        console.log(`[ImageNode ${id}] Final image processed, generation completed`);
                    } else if (eventData.type === 'completed' && eventData.finalImageUrl) {
                        console.log(`[ImageNode ${id}] Processing completed event`);
                        
                        // Check if this is the same image we already processed
                        const completedImageUrl = eventData.finalImageUrl;
                        const completedHash = generateImageHash(completedImageUrl);
                        
                        // If we already processed a final image and the hashes match, skip duplicate processing
                        if (hasProcessedFinalImage && completedHash && uploadPromiseCache.has(completedHash)) {
                            console.log(`[ImageNode ${id}] Completed event for already processed image, skipping duplicate upload`);
                            
                            // Just ensure UI state is correct
                            showPartialImage.set(false);
                            partialImageUrl.set(null);
                            isGenerating.set(false);
                            
                            // Wait for existing upload to complete and update if needed
                            try {
                                const existingUrl = await uploadPromiseCache.get(completedHash);
                                if (existingUrl && existingUrl !== completedImageUrl) {
                                    localImageUrl.set(existingUrl);
                                    updateNodeData(id, { ...data, imageUrl: existingUrl });
                                }
                            } catch (error) {
                                console.warn(`[ImageNode ${id}] Error waiting for existing upload:`, error);
                            }
                        } else {
                            // This is a different image or we haven't processed a final image yet
                            finalImageUrl = completedImageUrl;
                            hasProcessedFinalImage = true; // Mark as processed
                            
                            // CRITICAL: Immediately stop showing partial image and generating state FIRST
                            showPartialImage.set(false);
                            partialImageUrl.set(null);
                            isGenerating.set(false);
                            
                            // Set the final image immediately for display
                            localImageUrl.set(finalImageUrl);
                            loadImageAndSetDimensions(finalImageUrl);
                            
                            // Handle Supabase upload with deduplication
                            if (finalImageUrl.startsWith('data:image')) {
                                console.log(`[ImageNode ${id}] Starting deduplicated Supabase upload for completed image`);
                                isUploading.set(true);
                                
                                try {
                                    const supabaseUrl = await handleSupabaseUpload(finalImageUrl, 'completed');
                                    if (supabaseUrl && supabaseUrl !== finalImageUrl) {
                                        console.log(`[ImageNode ${id}] Supabase upload completed: ${supabaseUrl}`);
                                        localImageUrl.set(supabaseUrl);
                                        updateNodeData(id, { ...data, imageUrl: supabaseUrl });
                                        finalImageUrl = supabaseUrl;
                                    } else {
                                        console.warn(`[ImageNode ${id}] Upload failed or returned same URL, using base64 fallback`);
                                        updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                                    }
                                    isUploading.set(false);
                                } catch (uploadError) {
                                    console.error(`[ImageNode ${id}] Upload error:`, uploadError);
                                    updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                                    isUploading.set(false);
                                }
                            } else {
                                // Already a URL (not base64), update node data directly
                                updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                            }
                        }
                        
                        console.log(`[ImageNode ${id}] Completed event processed`);
                    } else if (eventData.type === 'error') {
                        // CRITICAL: Clear all generating and upload states on error
                        showPartialImage.set(false);
                        partialImageUrl.set(null);
                        isGenerating.set(false);
                        isUploading.set(false);
                        // Clear streaming store on error
                        removeStreamingImage(id);
                        throw new Error(eventData.error || 'Generation error');
                    } else if (eventData.type === 'done' || eventData.type === 'finished') {
                        // Handle any other completion events
                        console.log(`[ImageNode ${id}] Processing ${eventData.type} event`);
                        isGenerating.set(false);
                        console.log(`[ImageNode ${id}] Generation marked as finished`);
                    }
                };

                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    if (value) {
                        buffer += decoder.decode(value, { stream: !done });
                        const parts = buffer.split('\n\n');
                        buffer = parts.pop() || '';
                        for (const part of parts) {
                            await handleEventString(part);
                        }
                    }
                }
                // Process leftover buffer
                if (buffer.trim().length > 0) await handleEventString(buffer);
            } else {
                // --- JSON RESPONSE HANDLING ---
                const result = await response.json();
                // Support both OpenAI style and our own
                if (result.imageUrl) {
                    finalImageUrl = result.imageUrl;
                } else if (result.url) {
                    finalImageUrl = result.url;
                } else if (Array.isArray(result.images) && result.images.length > 0 && result.images[0].url) {
                    finalImageUrl = result.images[0].url;
                }
            }

            if (!finalImageUrl) throw new Error('No image URL returned');

            // --- UPLOAD TO SUPABASE STORAGE FOR JSON RESPONSES ---
            // Only process JSON response uploads if we haven't already processed a streaming final image
            if (!hasProcessedFinalImage && finalImageUrl.startsWith('data:image')) {
                console.log(`[ImageNode ${id}] JSON response with base64 image, uploading to Supabase Storage...`);
                
                // Put the base64 image in streaming store for immediate display
                setStreamingImage(id, finalImageUrl, true); // true = uploading
                
                try {
                    const supabaseUrl = await handleSupabaseUpload(finalImageUrl, 'json_response');
                    if (supabaseUrl && supabaseUrl !== finalImageUrl) {
                        console.log(`[ImageNode ${id}] Successfully uploaded JSON response image to Supabase: ${supabaseUrl}`);
                        finalImageUrl = supabaseUrl;
                        // Set permanent URL and remove from streaming store
                        localImageUrl.set(finalImageUrl);
                        updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                        // Streaming store will be cleaned up by imageStorageService
                    } else {
                        console.warn(`[ImageNode ${id}] JSON response upload failed, using base64 URL as fallback`);
                        updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                        // Keep the streaming image since upload failed
                    }
                } catch (uploadError) {
                    console.warn(`[ImageNode ${id}] Failed to upload JSON response image to Supabase Storage:`, uploadError);
                    // Continue with base64 URL as fallback
                    updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                } finally {
                    updateStreamingImageStatus(id, false); // Stop upload indicator
                }
            } else if (hasProcessedFinalImage) {
                console.log(`[ImageNode ${id}] Skipping JSON response upload - already processed streaming final image`);
            }

            // --- PERSIST THE FINAL IMAGE URL TO THE NODE'S DATA ---
            // Only update if we haven't already updated from streaming
            if (!hasProcessedFinalImage && !finalImageUrl.startsWith('data:image')) {
                // For non-base64 URLs (already permanent), set directly
                updateNodeData(id, { ...data, imageUrl: finalImageUrl });
                localImageUrl.set(finalImageUrl);
                loadImageAndSetDimensions(finalImageUrl);
                console.log(`[ImageNode ${id}] Updated node data with JSON response image`);
            } else if (!hasProcessedFinalImage) {
                // For base64 URLs, just load dimensions (URL already handled above)
                loadImageAndSetDimensions(finalImageUrl);
                console.log(`[ImageNode ${id}] Loaded dimensions for base64 image`);
            } else {
                console.log(`[ImageNode ${id}] Skipping node data update - already updated from streaming`);
            }

        } catch (err: any) {
            console.error('Image generation error:', err);
            errorMsg.set(err.message || 'Failed to generate image');
            // Clear streaming store on error
            removeStreamingImage(id);
        } finally {
            isGenerating.set(false);
            showPartialImage.set(false);
            partialImageUrl.set(null);
            // Note: isUploading is handled by individual upload promise handlers
        }
    }

    // Handle model selection from dropdown
    function handleModelSelection(event) {
        const selectedValue = event.detail.value;
        selectedModel.set(selectedValue);
    }

    // Handle prompt submission from AppTextarea (Enter key)
    function handlePromptSubmit(event) {
        const { value } = event.detail;
        if (value?.trim() && !$isGenerating) {
            generateImage();
        }
    }

    /**
     * Generate AI description for the current image
     */
    async function generateImageDescription(imageUrl) {
        if (!imageUrl || !imageUrl.startsWith('data:image') || isGeneratingDescription) {
            return;
        }

        isGeneratingDescription = true;
        console.log(`🖼️ [ImageNode ${id}] Generating AI description for image`);

        try {
            const response = await fetch('/api/ai/vision-describe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: imageUrl,
                    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                    prompt: 'Describe this image in 1-2 concise sentences. Focus on the main subject, key visual elements, and any text or important details.'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            const description = result.description || result.response || '';

            // Update node data with the generated description (ensure it's a string)
            const updatedData = {
                ...data,
                description: description.trim() || ''
            };

            updateNodeData(id, updatedData);

            console.log(`✅ [ImageNode ${id}] Generated description: "${description}"`);

        } catch (error) {
            console.error(`❌ [ImageNode ${id}] Description generation failed:`, error);

            // Set empty description on failure (don't show error text in flow JSON)
            const updatedData = {
                ...data,
                description: ''
            };

            updateNodeData(id, updatedData);
        } finally {
            isGeneratingDescription = false;
        }
    }

    /**
     * Download the current image
     */
    function handleDownloadImage() {
        const imageUrl = $localImageUrl;
        if (!imageUrl || typeof imageUrl !== 'string') {
            console.warn('⚠️ [ImageNode] No valid image URL found for download');
            return;
        }

        // Infer extension from URL or fallback to png
        const urlParts = imageUrl.split('?')[0].split('#')[0].split('.');
        let extension = urlParts.length > 1 ? urlParts.pop() : 'png';
        if (!extension || extension.length > 5) extension = 'png';

        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `image-${id}-${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`⬇️ [ImageNode] Downloaded image: image-${id}-${Date.now()}.${extension}`);
    }

    /**
     * Handle wheel events for frame scrolling context
     * Allow frame container scrolling when this image node is inside a frame
     */
    function handleWheel(event: WheelEvent) {
        // Check if this node is inside a frame (has parentId)
        if (parentId) {
            // If inside a frame, let the wheel event bubble up to the frame container
            // This allows the frame's handleFrameWheel to manage scrolling
            console.log(`📜 [ImageNode ${id}] Allowing wheel event to bubble for frame scrolling`);
            // Don't call event.stopPropagation() - let it bubble up to frame
        } else {
            // If not in a frame, stop propagation to prevent canvas panning
            // This maintains consistent behavior with other nodes
            event.stopPropagation();
            console.log(`📜 [ImageNode ${id}] Stopping wheel propagation (not in frame)`);
        }
    }
</script>






<div class="floatable top header" style="display: none;">
    <div class="left-controls">
        <button class="download-btn" on:click|stopPropagation={handleDownloadImage} title="Download image">
            <span class="material-symbols-outlined">download</span>
        </button>
    </div>

    <h3>{data.label || 'Image'}</h3>

    <div class="right-controls">
        {#if $isGenerating}
            <div class="spinner-mini" title="Generating..."></div>
        {:else if $isUploading}
            <div class="spinner-mini" title="Uploading to storage..."></div>
        {/if}
        <ViewModeButtons nodeId={id} />
    </div>
</div>





<div
    class="flow-node image image-node-wrapper"
    style="width:{width || DEFAULT_NODE_WIDTH}px; height:{height || DEFAULT_NODE_HEIGHT}px; --hover-padding: {HOVER_BOUNDS_PADDING}px; --node-border-radius: {NODE_BORDER_RADIUS}px;"
    on:drop={onDrop}
    on:dragover={onDragOver}
    on:dragenter={onDragEnter}
    on:dragleave={onDragLeave}
    on:mouseenter={() => isNodeHovered.set(true)}
    on:mouseleave={() => isNodeHovered.set(false)}
    on:wheel={handleWheel}
    class:dragging-over={$isDraggingOver}
>

<NodeResizer
isVisible={true}
minWidth={MIN_DIMENSION}
minHeight={MIN_DIMENSION}
keepAspectRatio={true}
onResizeStart={handleResizeStart}
onResize={handleResizeEnd}
/>


<PerformanceWrapper nodeId={String(id)} nodeType="image" placeholderIcon="image" placeholderText={String(data.label || 'Image')}>



    <div class="image-container" title={displayImageUrl ? '' : 'Drop an image here to upload.'}>
        {#if $showPartialImage && $partialImageUrl}
            <div class="partial-image-wrapper">
                <img src={$partialImageUrl} alt="Generating..." class="image-preview partial-image" />
                <div class="generation-overlay">
                    <div class="generation-indicator">
                        <div class="spinner-small"></div>
                        <span>Generating...</span>
                    </div>
                </div>
            </div>
        {:else if displayImageUrl}
            <div class="final-image-wrapper">
                <img src={displayImageUrl} alt={$nodeLabel || 'Uploaded image'} class="image-preview" />
                {#if isStreamingUpload || $isUploading}
                    <div class="upload-overlay">
                        <div class="upload-indicator">
                            <div class="spinner-small"></div>
                            <span>Uploading...</span>
                        </div>
                    </div>
                {/if}
            </div>
        {:else if $isGenerating}
            <div class="generation-overlay">
                <div class="spinner"></div>
            </div>
        {:else}
            <div class="image-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </div>
        {/if}
    </div>

    <input
        type="file"
        accept="image/*"
        bind:this={fileInput}
        style="display: none;"
        on:change={(e) => handleFileSelect((e.target as HTMLInputElement).files)}
    />

    <div class="generator-ui floatover">
        <AppTextarea 
            bind:value={$prompt} 
            placeholder="Enter a prompt..." 
            submitOnEnter={true}
            maxHeight={100}
            on:submit={handlePromptSubmit}
        />
        <div class="generate-row hidden">
            <AppDropdown
                items={imageModels}
                bind:value={$selectedModel}
                on:change={handleModelSelection}
                width="140px"
            />
            <button class="generate-button" on:click={generateImage} disabled={$isGenerating || !$prompt?.trim()}>
                {#if $isGenerating}
                    <div class="spinner"></div>
                {:else}
                    <span class="material-symbols-outlined">auto_awesome</span>
                {/if}
            </button>
        </div>
    </div>



</PerformanceWrapper>

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />

</div>



{#if $errorMsg}
<div class="error-message">{$errorMsg}</div>
{/if}

<style lang="scss">
.image-node-wrapper {
    border-radius: var(--node-border-radius, 6px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.2s ease, border-color 0.2s ease; /* Removed width/height transition here as Svelte Flow handles it */
    position: relative;
    background-color: rgba(white, .5);
    box-shadow: -12px 36px 72px rgba(black, .08);

    &.selected{
        border: 5px solid var(--highlight);
    }


    &::before {
        content: '';
        position: absolute;
        top: calc(-1 * var(--hover-padding, 15px));
        left: calc(-1 * var(--hover-padding, 15px));
        right: calc(-1 * var(--hover-padding, 15px));
        bottom: calc(-1 * var(--hover-padding, 15px));
        background-color: transparent;
        z-index: -1;
        border-radius: calc(var(--node-border-radius, 6px) + var(--hover-padding, 15px));
    }

    &.dragging-over {
        border-color: #6355FF;
        box-shadow: 0 0 0 2px #6355FF40;
    }
}

.node-header {
    position: absolute;
    top: -36px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 36px;
    color: #eee;

    opacity: 0;
    visibility: hidden;
    transform: translateY(5px);
    transition: opacity 0.25s ease-in-out, visibility 0.25s ease-in-out, transform 0.25s ease-in-out;
    z-index: 10;
}

.image-node-wrapper:hover .node-header {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.label-text {
    flex-grow: 1;
    text-align: left;
    font-size: 11px;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.edit-source-button {
    background: transparent;
    border: none;
    color: #ccc;
    cursor: pointer;
    padding: 3px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    margin-left: 8px;
    &:hover {
        color: #fff;
        background-color: rgba(255, 255, 255, 0.1);
    }
    svg {
        stroke: currentColor;
    }
}

.image-container {
    width: 100%;
    height: 100%;
    background: rgba(white, .2);
    backdrop-filter: blur(8px);

    border-radius: 4px;

    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    overflow: hidden; /* This will clip the image/placeholder to the container's bounds/radius */
    position: relative; /* ensure overlay positions correctly */
}

.image-preview {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #777;
    font-size: 12px;
    text-align: center;
    padding: 10px;
    box-sizing: border-box;
    svg {
        margin-bottom: 8px;
        stroke: #777;
        width: 36px;
        height: 36px;
    }
    span {
        max-width: 80%;
    }
}

.error-message {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(211, 47, 47, 0.85);
    backdrop-filter: blur(3px);
    color: white;
    padding: 5px 10px;
    font-size: 11px;
    text-align: center;
    width: 100%;
    box-sizing: border-box;

    opacity: 0;
    visibility: hidden;
    transform: translateY(100%);
    transition: opacity 0.25s ease-in-out, visibility 0.25s ease-in-out, transform 0.25s ease-in-out;
    z-index: 10;
    border-top: 1px solid rgba(255,255,255,0.2);
}

.image-node-wrapper:hover .error-message {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.generator-ui {
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: calc(100% - 0px);
    background-image: linear-gradient(to bottom, rgba(black, 0) 12px, rgba(black, .2) 20px, rgba(black, 0.8));

    border-radius: 4px;
    padding: 24px 8px 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 10;
    //box-shadow: 0 -5px 15px rgba(0,0,0,0.2);

    :global(.app-textarea) {
        flex: 1;
        background: none;
        border: none;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 4px;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: -0.3px;
        font-family: inherit;
        resize: none;
        outline: none;
        transition: all 0.2s ease;

        &::placeholder {
            color: rgba(white, .5);
        }

        &:focus {
        }
    }

    .generate-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .generate-button {
        width: 32px;
        height: 32px;
        padding: 0;
        flex-shrink: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

        span {
            font-size: 18px;
            font-weight: 600;
            color: white;
        }

        &:hover:not(:disabled) {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        &:active:not(:disabled) {
            transform: translateY(0);
        }

        &:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            animation: spin 1s linear infinite;
        }
    }
}

.spinner {
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.partial-image-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.partial-image {
    opacity: 0.8;
    filter: blur(0.5px);
}

.generation-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(1px);
}

.generation-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: white;
    font-size: 12px;
    font-weight: 500;
}

.spinner-small {
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    animation: spin 1s linear infinite;
}

.final-image-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.upload-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: fit-content;
    padding: 4px 4px;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    pointer-events: none;
    background: rgba(11, 247, 11, 0.4);
}

.upload-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 24px;

    span{
        font-size: 12px;
        font-weight: 600;
        letter-spacing: -.25px;
    }
}

// Mini spinner for header
.spinner-mini{
    border: 2px solid rgba(black,0.2);
    border-top: 2px solid black;
    border-radius:50%;
    width:12px;
    height:12px;
    animation: spin 1s linear infinite;
    margin-left:6px;
}

.left-controls, .right-controls {
    display: flex;
    align-items: center;
    gap: 4px;
}

.download-btn {
    height: 22px;
    width: 22px;
    padding: 0;
    border: 1px solid rgba(black, .3);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: .2s ease;

    span {
        font-size: 16px;
        line-height: 1;
        color: #4285f4;
    }

    &:hover {
        background: rgba(#4285f4, .1);
        border-color: rgba(#4285f4, .3);
    }
}
</style>