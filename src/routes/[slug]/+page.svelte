<script lang="ts">
	import { writable } from 'svelte/store'
	import * as Store from '$lib/store.js';
	import { formatDate } from '$lib/utils';
	import {onMount} from 'svelte'
    import { goto } from '$app/navigation';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import {
		blur,
		crossfade,
		draw,
		fade,
		fly,
		scale,
		slide
	} from 'svelte/transition';

	export let data

    let visible = false;
    let tocItems: Array<{id: string, text: string, level: number}> = [];
    let activeId: string = '';

    // Save scroll position before navigating away (internal navigation)
    beforeNavigate(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(`scroll-${data.slug}`, window.scrollY.toString());
        }
    });

    // Restore scroll position after navigating back
    afterNavigate(() => {
        if (typeof window !== 'undefined') {
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
        window.addEventListener('beforeunload', handleBeforeUnload);

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
            window.removeEventListener('beforeunload', handleBeforeUnload);
            
            if (typeof window !== 'undefined') {
                const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6');
                headings.forEach(heading => {
                    observer?.unobserve(heading);
                });
            }
        };
    });

    function goBack(){
        history.back()
    }

    function generateTOC() {
        const prose = document.querySelector('.prose');
        if (!prose) return;

        const headings = prose.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const items: Array<{id: string, text: string, level: number}> = [];

        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1));
            const text = heading.textContent || '';
            
            // Generate a slug from the heading text
            let id = text.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/--+/g, '-')
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
        const prose = document.querySelector('.prose');
        if (!prose) return;

        const images = prose.querySelectorAll('img[title]');
        
        images.forEach((img) => {
            const title = img.getAttribute('title');
            if (!title) return;

            // Check if already wrapped in a figure
            if (img.parentElement?.tagName === 'FIGURE') return;

            // Create figure and figcaption elements
            const figure = document.createElement('figure');
            const figcaption = document.createElement('figcaption');
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
            
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Re-enable observer after scroll completes
            setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
    }

    let observer: IntersectionObserver | null = null;
    let visibleHeadings = new Set<string>();

    function setupIntersectionObserver() {
        const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6');
        
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
                rootMargin: '-100px 0px -66%',
                threshold: [0, 0.25, 0.5, 0.75, 1]
            }
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
<div id = 'container'>
    <div id = 'sidebar'>
        <button class = 'back' on:click = {goBack}>
            <span class="material-icons">arrow_back</span>
            <h2>
                Back
            </h2>
        </button>
        
        {#if tocItems.length > 0}
            <nav class="toc">
                <ul>
                    {#each tocItems as item}
                        <li class="toc-item toc-level-{item.level}" class:active={activeId === item.id}>
                            <button on:click={() => scrollToHeading(item.id)}>
                                {item.text}
                            </button>
                        </li>
                    {/each}
                </ul>
            </nav>
        {/if}
    </div>
    <div id = 'main'>
        <hgroup>

            {#if data.meta.banner}
                <div class = 'banner'>  <img src = 'blog/{data.meta.banner}.png' alt = 'Banner'> </div>
            {/if}

            <h1 class = 'title'>
                {data.meta.title}
            </h1>
          
            {#if data.meta.type == 'blog'}
                <p class = 'blurb'>
                    {data.meta.blurb}
                </p>
                <div class = 'author'>
                    <img src = 'heewon9.png' alt = 'Heewon' />
                    <h3>Heewon Ahn</h3>
                </div>
                <h3 class = 'date'>
                    {formatDate(data.meta.date)}
                </h3>
            {:else}
                <h2 class = 'description'>
                    {data.meta.description}
                </h2>
            {/if}

         
           
        </hgroup>
        <div class="prose preview">
                <svelte:component this={data.content} />
            </div>
        </div>
    </div>
{/if}


<style lang="scss">

    $text: #030025;

    #container{
        width: 100dvw;
        max-width: 1000px;
        margin: 80px auto 0px auto;
        box-sizing: border-box;
    }

    #sidebar{
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

    #main{
        width: calc(100% - 160px);
        width: clamp(50%, 800px, 90%);
        padding: 0 0 200px 0;
        border-radius: 12px;
        margin: auto;
        //box-shadow: 0 10px 40px rgba(black, .05);
    }

    .back{
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 4px;
        background: none;
        color: black;
        box-shadow: none;

        span{
            font-size: 16px;
            line-height: 100%;
        }
        h2{
            font-family: var(--font-headers);
            font-size: 16px;
            letter-spacing: -.3px;
        }
        
        &:hover{
            opacity: .6;
        }
    }

    .toc{
        padding-top: 16px;
        padding-left: 8px;

        .toc-title{
            font-size: 14px;
            font-weight: 600;
            color: rgba($text, .6);
            margin: 0 0 16px 0;
            text-transform: uppercase;
            letter-spacing: .5px;
        }

        ul{
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .toc-item{
            margin: 0;
            padding: 0;

            button{
                width: 100%;
                text-align: left;
                background: none;
                border: none;
                padding: 0px 0;
                color: rgba($text, .5);
                font-size: 14px;
                line-height: 140%;
                cursor: pointer;
                transition: color 0.2s ease;
                box-shadow: none;
                margin: 6px 0;
                font-weight: 400;
                letter-spacing: -.3px;
                font-family: var(--font-headers);

                &:hover{
                    color: rgba($text, 1);
                    font-weight: 900;
                    text-decoration: underline;
                }
            }

            &.active button{
                color: rgba($text, 1);
                font-weight: 600;
                text-shadow: -0.25px 0 0 rgba($text, 1);
            }

            &.toc-level-1 button{
                font-weight: 500;
                padding-left: 0;
            }

            &.toc-level-2 button{
                padding-left: 12px;
            }

            &.toc-level-3 button{
                padding-left: 24px;
                font-size: 12px;
            }

            &.toc-level-4 button{
                padding-left: 36px;
                font-size: 12px;
            }

            &.toc-level-5 button, 
            &.toc-level-6 button{
                padding-left: 48px;
                font-size: 11px;
            }
        }
    }

    .banner{
        width: 100%;
        img{
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            object-position: center;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 24px;
        }
    }

    hgroup{
        padding: 20px 0 60px 0;
        color: $text;

        .title{
            font-family: "ivypresto-text", 'Newsreader', sans-serif;
            font-size: 60px;
            letter-spacing: -4px;
            line-height: 1;
            font-weight: 500;
            text-align: center;
            margin: 0 0 24px 0;
            color: rgba($text, .8);
        }

        .description{
            font-size: 18px;
            letter-spacing: -.25px;
            font-weight: 400;
            text-align: center;
            color: rgba($text, .4);
            margin-bottom: 20px;
        }

        .date{
            font-family: var(--font-body);
            font-size: 16px;
            letter-spacing: -.2px;
            font-weight: 500;
            text-align: center;
            margin: auto;
            color: rgba($text, 1);
        }

        .author{
            border: 1px solid rgba($text, .2);
            padding: 8px 14px 8px 10px;
            border-radius: 40px;
            margin: 0 auto;
            gap: 10px;
            margin-bottom: 16px;

            display: flex;
            align-items: center;
            justify-content: center;
            width: fit-content;

            img{
                width: 24px;
                height: 24px;
                border-radius: 50%;
            }

            h3{
                font-family: var(--font-body);
                font-size: 16px;
                letter-spacing: -.2px;
                font-weight: 450;
                text-align: center;
            }
        }

        .blurb{
            font-family: var(--font-body);
            font-size: 18px;
            letter-spacing: -.2px;
            font-weight: 450;
            text-align: center;
            margin: 32px auto 24px auto;
            background: $text;
            border-radius: 12px;
            background: none;
            width: 600px;
            max-width: 100%;
            line-height: 1.3;
            color: rgba($text, .5);
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
            color: rgba($text, .6);
            font-style: italic;
            line-height: 140%;
            letter-spacing: -.2px;
        }
    }


    @media screen and (max-width: 800px) {
  
        #container{
            margin: 40px auto;
        }

        #sidebar{
            display: none;
        }

        .toc{
            display: none;
        }

        #main{
            width: 90vw;
            padding: 0;
        }

    }


</style>