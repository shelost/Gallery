<script lang="ts">
  import { writable } from "svelte/store";
  import * as Store from "$lib/store.js";
  import { formatDate } from "$lib/utils";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { beforeNavigate, afterNavigate } from "$app/navigation";
  import {
    blur,
    crossfade,
    draw,
    fade,
    fly,
    scale,
    slide,
  } from "svelte/transition";

  export let data;

  let visible = false;
  let tocItems: Array<{ id: string; text: string; level: number }> = [];
  let activeId: string = "";
  let mobileTocOpen = false;

  // Save scroll position before navigating away (internal navigation)
  beforeNavigate(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`scroll-${data.slug}`, window.scrollY.toString());
    }
  });

  // Restore scroll position after navigating back
  afterNavigate(() => {
    if (typeof window !== "undefined") {
      const savedScroll = sessionStorage.getItem(`scroll-${data.slug}`);
      if (savedScroll !== null) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll, 10));
        }, 100);
      }
    }
  });

  onMount(() => {
    // Save scroll position before navigating to external links or closing tab
    const handleBeforeUnload = () => {
      sessionStorage.setItem(`scroll-${data.slug}`, window.scrollY.toString());
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Handle Escape key to close mobile TOC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileTocOpen) {
        mobileTocOpen = false;
      }
    };
    window.addEventListener("keydown", handleEscape);

    setTimeout(() => {
      visible = true;
    }, 10);

    // Generate table of contents and add image captions after content is rendered
    setTimeout(() => {
      generateTOC();
      setupIntersectionObserver();
      addImageCaptions();
    }, 100);

    // Restore scroll position on initial mount
    const savedScroll = sessionStorage.getItem(`scroll-${data.slug}`);
    if (savedScroll !== null) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }, 150);
    }

    return () => {
      // Cleanup
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleEscape);

      if (typeof window !== "undefined") {
        const headings = document.querySelectorAll(
          ".prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6",
        );
        headings.forEach((heading) => {
          observer?.unobserve(heading);
        });
      }
    };
  });

  function goBack() {
    history.back();
  }

  function generateTOC() {
    const prose = document.querySelector(".prose");
    if (!prose) return;

    const headings = prose.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const items: Array<{ id: string; text: string; level: number }> = [];

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent || "";

      // Generate a slug from the heading text
      let id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .trim();

      // Ensure unique IDs
      if (!heading.id) {
        let uniqueId = id;
        let counter = 1;
        while (document.getElementById(uniqueId)) {
          uniqueId = `${id}-${counter}`;
          counter++;
        }
        heading.id = uniqueId;
        id = uniqueId;
      } else {
        id = heading.id;
      }

      items.push({ id, text, level });
    });

    tocItems = items;
  }

  function addImageCaptions() {
    const prose = document.querySelector(".prose");
    if (!prose) return;

    const images = prose.querySelectorAll("img[title]");

    images.forEach((img) => {
      const title = img.getAttribute("title");
      if (!title) return;

      // Check if already wrapped in a figure
      if (img.parentElement?.tagName === "FIGURE") return;

      // Create figure and figcaption elements
      const figure = document.createElement("figure");
      const figcaption = document.createElement("figcaption");
      figcaption.textContent = title;

      // Replace img with figure containing img and caption
      img.parentNode?.insertBefore(figure, img);
      figure.appendChild(img);
      figure.appendChild(figcaption);
    });
  }

  let isScrolling = false;

  function scrollToHeading(id: string) {
    const element = document.getElementById(id);
    if (element) {
      // Temporarily disable observer during manual scroll
      isScrolling = true;
      activeId = id;

      element.scrollIntoView({ behavior: "smooth", block: "start" });

      // Close mobile TOC after clicking
      mobileTocOpen = false;

      // Re-enable observer after scroll completes
      setTimeout(() => {
        isScrolling = false;
      }, 1000);
    }
  }

  function toggleMobileToc() {
    mobileTocOpen = !mobileTocOpen;
  }

  function closeMobileToc() {
    mobileTocOpen = false;
  }

  let observer: IntersectionObserver | null = null;
  let visibleHeadings = new Set<string>();

  function setupIntersectionObserver() {
    const headings = document.querySelectorAll(
      ".prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6",
    );

    if (headings.length === 0) return;

    // Set the first heading as active initially
    if (headings[0].id) {
      activeId = headings[0].id;
    }

    observer = new IntersectionObserver(
      (entries) => {
        // Skip updates if we're currently scrolling from a click
        if (isScrolling) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleHeadings.add(entry.target.id);
          } else {
            visibleHeadings.delete(entry.target.id);
          }
        });

        // Find the topmost visible heading
        if (visibleHeadings.size > 0) {
          const allHeadings = Array.from(headings);
          for (const heading of allHeadings) {
            if (visibleHeadings.has(heading.id)) {
              activeId = heading.id;
              break;
            }
          }
        }
      },
      {
        rootMargin: "-100px 0px -66%",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    headings.forEach((heading) => {
      observer?.observe(heading);
    });
  }
</script>

<svelte:head>
  <title>{data.meta.title}</title>
  <meta property="og:type" content="article" />
  <meta property="og:title" content={data.meta.title} />
  <link rel="icon" href="smiley.png" />
</svelte:head>

{#if visible}
  <div id="container">
    <div id="sidebar">
      <button class="back" on:click={goBack}>
        <span class="material-icons">arrow_back</span>
        <h2>Back</h2>
      </button>

      {#if tocItems.length > 0}
        <nav class="toc">
          <ul>
            {#each tocItems as item}
              <li
                class="toc-item toc-level-{item.level}"
                class:active={activeId === item.id}
              >
                <button on:click={() => scrollToHeading(item.id)}>
                  {item.text}
                </button>
              </li>
            {/each}
          </ul>
        </nav>
      {/if}
    </div>
    <div id="main">
      <hgroup>
        {#if data.meta.banner && data.meta.type == "blog"}
          <div class="banner">
            <img src="blog/{data.meta.banner}.png" alt="Banner" />
          </div>
        {/if}

        <h1 class="title">
          {data.meta.title}
        </h1>

        {#if data.meta.type == "blog"}
          <p class="blurb">
            {data.meta.blurb}
          </p>
          <div class="author">
            <img src="heewon9.png" alt="Heewon" />
            <h3>Heewon Ahn</h3>
          </div>
          <h3 class="date">
            {formatDate(data.meta.date)}
          </h3>
        {:else}
          <h2 class="description">
            {data.meta.description}
          </h2>
        {/if}
      </hgroup>
      <div class="prose preview">
        <svelte:component this={data.content} />
      </div>
    </div>
  </div>

  <!-- Mobile Floating Action Button -->
  {#if tocItems.length > 0}
    <button
      class="mobile-fab"
      on:click={toggleMobileToc}
      aria-label="Table of Contents"
    >
      <span class="material-icons">{mobileTocOpen ? "close" : "menu"}</span>
    </button>
  {/if}

  <!-- Mobile TOC Slide-in Panel -->
  {#if tocItems.length > 0}
    {#if mobileTocOpen}
      <div
        class="mobile-toc-backdrop"
        on:click={closeMobileToc}
        on:keydown={(e) => e.key === "Escape" && closeMobileToc()}
        role="button"
        tabindex="-1"
        aria-label="Close table of contents"
        transition:fade={{ duration: 200 }}
      ></div>
      <nav
        class="mobile-toc-panel"
        transition:slide={{ axis: "x", duration: 300 }}
      >
        <div class="mobile-toc-header">
          <h3>Table of Contents</h3>
          <button
            class="mobile-toc-close"
            on:click={closeMobileToc}
            aria-label="Close"
          >
            <span class="material-icons">close</span>
          </button>
        </div>
        <ul class="mobile-toc-list">
          {#each tocItems as item}
            <li
              class="mobile-toc-item mobile-toc-level-{item.level}"
              class:active={activeId === item.id}
            >
              <button on:click={() => scrollToHeading(item.id)}>
                {item.text}
              </button>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}
  {/if}
{/if}

<style lang="scss">
  $text: #030025;

  #container {
    width: 100dvw;
    max-width: 1000px;
    margin: 80px auto 0px auto;
    box-sizing: border-box;
  }

  #sidebar {
    width: 140px;
    height: 100vh;
    border-radius: 6px;
    padding: 0px 0;
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 3;
    box-sizing: border-box;
  }

  #main {
    width: calc(100% - 160px);
    width: clamp(50%, 800px, 90%);
    padding: 0 0 200px 0;
    border-radius: 12px;
    margin: auto;
    //box-shadow: 0 10px 40px rgba(black, .05);
  }

  .back {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    background: none;
    color: black;
    box-shadow: none;

    span {
      font-size: 16px;
      line-height: 100%;
    }
    h2 {
      font-family: var(--font-headers);
      font-size: 16px;
      letter-spacing: -0.3px;
    }

    &:hover {
      opacity: 0.6;
    }
  }

  .toc {
    padding-top: 16px;
    padding-left: 8px;

    .toc-title {
      font-size: 14px;
      font-weight: 600;
      color: rgba($text, 0.6);
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .toc-item {
      margin: 0;
      padding: 0;

      button {
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 0px 0;
        color: rgba($text, 0.5);
        font-size: 13px;
        line-height: 140%;
        cursor: pointer;
        transition: color 0.2s ease;
        box-shadow: none;
        margin: 2px 0;
        font-weight: 500;
        letter-spacing: -0.2px;
        font-family: "Geist", sans-serif;

        &:hover {
          color: rgba($text, 1);
        }
      }

      &.active button {
        color: rgba($text, 1);
        font-weight: 600;
        text-shadow: -0.25px 0 0 rgba($text, 1);
      }

      &.toc-level-1 button {
        font-weight: 500;
        padding-left: 0;
      }

      &.toc-level-2 button {
        padding-left: 8px;
      }

      &.toc-level-3 button {
        padding-left: 24px;
        font-size: 12px;
      }

      &.toc-level-4 button {
        padding-left: 36px;
        font-size: 12px;
      }

      &.toc-level-5 button,
      &.toc-level-6 button {
        padding-left: 48px;
        font-size: 11px;
      }
    }
  }

  .banner {
    width: 100%;
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      object-position: center;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
    }
  }

  hgroup {
    padding: 100px 0 120px 0;
    color: $text;
    width: 70%;

    .title {
      font-family: var(--font-headers);
      font-size: 54px;
      letter-spacing: -2px;
      line-height: 0.85;
      font-weight: 550;
      text-align: left;
      margin: 0 0 24px 0;
      color: rgba($text, 1);
      text-shadow: -0.5px 0 0 rgba($text, 1);
    }

    .description {
      font-size: 18px;
      letter-spacing: -0.25px;
      font-weight: 400;
      text-align: center;
      color: rgba($text, 0.4);
      margin-bottom: 20px;
    }

    .date {
      font-family: var(--font-body);
      font-size: 15px;
      letter-spacing: -0.2px;
      font-weight: 500;
      text-align: center;
      color: rgba($text, 0.5);
      display: none;
    }

    .author {
      //border: 1px solid rgba($text, .1);
      padding: 8px 14px 8px 10px;
      border-radius: 40px;
      gap: 10px;
      margin: 24px 0;

      display: flex;
      align-items: center;
      justify-content: center;
      width: fit-content;

      background: white;
      box-shadow: -4px 8px 24px rgba(black, 0.1);

      img {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }

      h3 {
        font-family: var(--font-body);
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.3px;
        text-align: center;
      }
    }

    .blurb {
      font-family: var(--font-body);
      font-size: 24px;
      letter-spacing: -0.6px;
      font-weight: 300;
      text-align: left;
      // margin: 32px auto 32px auto;
      background: $text;
      border-radius: 12px;
      background: none;
      width: 600px;
      max-width: 100%;
      line-height: 1.05;
      color: rgba($text, 0.5);
    }
  }

  // Image captions
  .prose :global(figure) {
    margin: 32px 0;
    text-align: center;

    :global(img) {
      margin: 0 auto;
      display: block;
    }

    :global(figcaption) {
      margin-top: 12px;
      font-size: 14px;
      color: rgba($text, 0.6);
      font-style: italic;
      line-height: 140%;
      letter-spacing: -0.2px;
    }
  }

  @media screen and (max-width: 800px) {
    #container {
      margin: 40px auto;
    }

    #sidebar {
      display: none;
    }

    .toc {
      display: none;
    }

    #main {
      width: 90vw;
      padding: 0;
    }
  }

  /* Mobile Floating Action Button */
  .mobile-fab {
    display: none;
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: $text;
    color: white;
    border: none;
    box-shadow:
      0 4px 12px rgba(black, 0.2),
      0 8px 24px rgba(black, 0.15);
    cursor: pointer;
    z-index: 1000;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    align-items: center;
    justify-content: center;
    padding: 0;

    span {
      font-size: 24px;
      line-height: 1;
    }

    &:hover {
      transform: scale(1.05);
      box-shadow:
        0 6px 16px rgba(black, 0.25),
        0 12px 32px rgba(black, 0.2);
    }

    &:active {
      transform: scale(0.95);
    }

    @media screen and (max-width: 800px) {
      display: flex;
    }
  }

  /* Mobile TOC Backdrop */
  .mobile-toc-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(black, 0.5);
    z-index: 1001;
    backdrop-filter: blur(4px);
  }

  /* Mobile TOC Slide-in Panel */
  .mobile-toc-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(320px, 85vw);
    max-width: 320px;
    background: white;
    background-image:
      radial-gradient(
        50% 50% at 50% 50%,
        rgba(255, 255, 255, 0.75) 0%,
        rgba(255, 255, 255, 0) 100%
      ),
      linear-gradient(
        180deg,
        rgb(202, 216, 228) 0%,
        hsl(209, 36%, 86%) 15%,
        hsl(224, 44%, 95%) 50%
      );
    z-index: 1002;
    box-shadow: -4px 0 24px rgba(black, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .mobile-toc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 20px 16px 20px;
      border-bottom: 1px solid rgba($text, 0.1);

      h3 {
        font-family: var(--font-headers);
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.3px;
        color: $text;
        margin: 0;
      }

      .mobile-toc-close {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: rgba($text, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition:
          background 0.2s ease,
          color 0.2s ease;

        span {
          font-size: 24px;
          line-height: 1;
        }

        &:hover {
          background: rgba($text, 0.05);
          color: $text;
        }
      }
    }

    .mobile-toc-list {
      list-style: none;
      padding: 0;
      margin: 0;
      overflow-y: auto;
      flex: 1;
      padding: 16px 0 16px 8px;

      /* Custom scrollbar */
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: rgba($text, 0.05);
      }

      &::-webkit-scrollbar-thumb {
        background: rgba($text, 0.2);
        border-radius: 3px;

        &:hover {
          background: rgba($text, 0.3);
        }
      }
    }

    .mobile-toc-item {
      margin: 0;
      padding: 0;

      button {
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 0px 0;
        color: rgba($text, 0.5);
        font-size: 13px;
        line-height: 140%;
        cursor: pointer;
        transition: color 0.2s ease;
        box-shadow: none;
        margin: 2px 0;
        font-weight: 500;
        letter-spacing: -0.2px;
        font-family: "Geist", sans-serif;

        &:hover {
          color: rgba($text, 1);
        }
      }

      &.active button {
        color: rgba($text, 1);
        font-weight: 600;
        text-shadow: -0.25px 0 0 rgba($text, 1);
      }

      &.mobile-toc-level-1 button {
        font-weight: 500;
        padding-left: 0;
      }

      &.mobile-toc-level-2 button {
        padding-left: 8px;
      }

      &.mobile-toc-level-3 button {
        padding-left: 24px;
        font-size: 12px;
      }

      &.mobile-toc-level-4 button {
        padding-left: 36px;
        font-size: 12px;
      }

      &.mobile-toc-level-5 button,
      &.mobile-toc-level-6 button {
        padding-left: 48px;
        font-size: 11px;
      }
    }
  }
</style>
