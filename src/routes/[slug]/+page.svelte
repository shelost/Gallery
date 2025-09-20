<script lang="ts">
	import { writable } from 'svelte/store'
	import * as Store from '$lib/store.js';
	import { formatDate } from '$lib/utils';
	import {onMount} from 'svelte'
    import { goto } from '$app/navigation';
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

    onMount(() => {
        setTimeout(() => {
            visible = true;
        }, 10);
    });

    function goBack(){
        history.back()
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
            <img src = 'arrow.svg' alt = 'Back' />
            <h2>
                Back
            </h2>
        </button>
    </div>
    <div id = 'main'>
        <hgroup>
            <h1 class = 'title'>
                {data.meta.title}
            </h1>
          
            {#if data.meta.type == 'blog'}
                <p class = 'blurb'>
                    {data.meta.blurb}
                </p>
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
        h2{
            color: black;
            font-size: 18px;
        }
        img{
            height: 16px;
            transform: rotate(180deg);
        }
    }

    .banner{
        width: 100%;
    }

    hgroup{
        padding: 20px 0 60px 0;
        color: $text;

        .title{
            font-family: "ivypresto-text", 'Newsreader', sans-serif;
            font-size: 48px;
            letter-spacing: -2.2px;
            font-weight: 600;
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

        .blurb{
            font-family: var(--font-body);
            font-size: 16px;
            letter-spacing: -.2px;
            font-weight: 450;
            text-align: center;
            margin: 32px auto 24px auto;
            background: $text;
            border-radius: 12px;
            background: none;
            width: 400px;
            max-width: 100%;
            line-height: 115%;
            color: rgba($text, .5);
        }
    }



    @media screen and (max-width: 800px) {
  
        #container{
            margin: 40px auto;
        }

        #sidebar{
            display: none;
        }

        #main{
            width: 90vw;
            padding: 0;
        }

    }


</style>