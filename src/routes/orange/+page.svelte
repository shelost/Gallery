<script>
  import { onMount } from 'svelte';
  // Using Vite's glob import to get all sub-pages.
  // This will find all +page.svelte files in immediate subdirectories.
  const modules = import.meta.glob('./*/+page.svelte');
  
  const subpages = Object.keys(modules).map(path => {
    // a path from glob looks like './dots/+page.svelte'
    // we extract the directory name from it.
    const subpage = path.replace('./', '').replace('/+page.svelte', '');
    return {
      path: `/orange/${subpage}`,
      name: subpage.charAt(0).toUpperCase() + subpage.slice(1) // Capitalize first letter for title
    };
  });

  let iframeWrappers = [];

  onMount(() => {
    const handleResize = () => {
      iframeWrappers.forEach(wrapper => {
        if (wrapper) {
          const containerWidth = wrapper.offsetWidth;
          const scale = containerWidth / 1400;
          wrapper.style.setProperty('--scale-factor', scale);
        }
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial scale calculation

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<svelte:head>
  <title>Orange</title>
  <link rel="icon" href="/orange-gradient.png" />
</svelte:head>

<div class="container">
  <h1>Orange</h1>
  <p>A collection of interactive Svelte experiments.</p>
  
  <div class="grid-container">
    {#each subpages as subpage, i}
      <div class="grid-item">
        <h2><a href={subpage.path} target="_blank" rel="noopener noreferrer">{subpage.name}</a></h2>
        <div class="iframe-wrapper" bind:this={iframeWrappers[i]}>
          <iframe
            src={subpage.path}
            title="{subpage.name} Preview"
            width="1400"
            height="900"
            scrolling="no"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
    
  :global(body) {
    margin: 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #212529;
  }

  h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  
  p {
    margin-bottom: 3rem;
    font-size: 1.2rem;
    color: #6c757d;
    text-align: center;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3rem;
  }

  .grid-item {
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    h2 {
      font-size: 1.75rem;
      margin-bottom: 1rem;
      text-align: center;
      font-weight: 600;

      a {
        text-decoration: none;
        color: inherit;
        transition: color 0.2s ease;

        &:hover {
          color: #007bff;
        }
      }
    }

    &:hover .iframe-wrapper {
      transform: translateY(-5px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.15);
    }
  }

  .iframe-wrapper {
    position: relative;
    width: 100%;
    padding-top: 64.28%; /* Aspect ratio: 900 / 1400 * 100% */
    border-radius: 8px;
    overflow: hidden;
    box-shadow: -12px 48px 60px rgba(0,0,0,0.1);
    background-color: #ffffff;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 1400px;
      height: 900px;
      border: 0;
      transform-origin: top left;
      transform: scale(var(--scale-factor, 0.5));
    }
  }

  /* Responsive adjustments */
  @media (max-width: 1400px) {
    .grid-container {
      gap: 2rem;
    }
  }

  @media (max-width: 1200px) {
    .grid-container {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 1.5rem;
    }
    h1 {
      font-size: 2.25rem;
    }
    p {
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }
    .grid-item h2 {
      font-size: 1.5rem;
    }
  }
</style>