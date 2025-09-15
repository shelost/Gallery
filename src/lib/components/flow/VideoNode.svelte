<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { fade } from 'svelte/transition';
  import FocusButton from '$lib/components/shared/FocusButton.svelte';

  interface VideoNodeData {
    videoUrl?: string;
    label?: string;
    width?: number;
    height?: number;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
  }

  type $$Props = NodeProps;

  export let id: $$Props['id'];
  export let parentId: $$Props['parentId'] = undefined;
  export let data: VideoNodeData = {
    videoUrl: '',
    label: 'Video',
    width: 400,
    height: 225,
    autoplay: true,
    loop: true,
    muted: true,
    controls: false
  };
  export let selected: $$Props['selected'] = false;

  /**
   * Handle wheel events for frame scrolling context
   * Allow frame container scrolling when this video node is inside a frame
   */
  function handleWheel(event: WheelEvent) {
    // Check if this node is inside a frame (has parentId)
    if (parentId) {
      // If inside a frame, let the wheel event bubble up to the frame container
      // This allows the frame's handleFrameWheel to manage scrolling
      console.log(`📜 [VideoNode ${id}] Allowing wheel event to bubble for frame scrolling`);
      // Don't call event.stopPropagation() - let it bubble up to frame
    } else {
      // If not in a frame, stop propagation to prevent canvas panning
      // This maintains consistent behavior with other nodes
      event.stopPropagation();
      console.log(`📜 [VideoNode ${id}] Stopping wheel propagation (not in frame)`);
    }
  }
</script>

<div class="floatable top header" style="display: none;">
  <h3>{data?.label || 'Video'}</h3>
  <FocusButton nodeId={id} />
</div>

<div
  class="flow-node"
  class:selected
  in:fade={{ duration: 200 }}
  on:wheel={handleWheel}
>
  <div class="video-container">
    {#if data?.videoUrl}
      <video
        src={data.videoUrl}
        width={data?.width || 400}
        height={data?.height || 225}
        autoplay={data?.autoplay !== false}
        loop={data?.loop !== false}
        muted={data?.muted !== false}
        controls={data?.controls || false}
        playsinline
        class="video-element"
      >
        <track kind="captions" />
      </video>
    {:else}
      <div class="video-placeholder" style="width: {data?.width || 400}px; height: {data?.height || 225}px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
        <p>No video selected</p>
      </div>
    {/if}

  </div>

  <Handle type="source" position={Position.Bottom} />
  <Handle type="target" position={Position.Top} />
</div>

<style lang="scss">
  .flow-node {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    box-shadow: -4px 8px 24px rgba(black, 0.15);
    overflow: hidden;
    transition: all 0.2s ease;

    &.selected {
      border: 1px solid #ff3d7f;
      //box-shadow: 0 0 0 2px #ff3d7f;
    }

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }
  }

  .video-container {
    position: relative;
  }

  .video-element {
    display: block;
    border-radius: 4px;
    object-fit: cover;
    background: #000;
  }

  .video-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border-radius: 8px;
    color: #999;

    svg {
      margin-bottom: 8px;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .video-label {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    backdrop-filter: blur(4px);
  }

  :global(.svelte-flow__handle) {
    width: 12px;
    height: 12px;
    background: #ff3d7f;
    border: 2px solid white;
  }

  :global(.svelte-flow__handle-top) {
    top: -6px;
  }

  :global(.svelte-flow__handle-bottom) {
    bottom: -6px;
  }
</style>
