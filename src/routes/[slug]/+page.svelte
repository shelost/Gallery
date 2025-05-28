<script lang="ts">
	import { writable } from 'svelte/store'
	import * as Store from '$lib/store';
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
        <button class = 'button text back' on:click = {goBack}>
            <img src = 'arrow.svg' alt = 'Back' />
            <h2>
                Back
            </h2>
        </button>
    </div>
    <div id = 'main'>

        <hgroup>
            <h1>
                {data.meta.title}
            </h1>
            <h2>
                {data.meta.description}
            </h2>
            <p>
                {data.meta.blurb}
            </p>
        </hgroup>


        <!--
        {#if data.meta.preview}
            <img class = 'banner' src = 'bento/{data.meta.preview}.svg'>
        {/if}
        -->
        <div class="prose preview">
                <svelte:component this={data.content} />
            </div>
        </div>
    </div>
{/if}


<style lang="scss">

    #container{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        box-sizing: border-box;

        //border: 1px solid red;
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
        color: white;
        box-shadow: none;
        h2{
            color: white !important;
            font-size: 18px;
        }
        img{
            filter: invert(1) brightness(10);
            height: 20px;
            transform: rotate(180deg);
        }
    }

    .banner{
        width: 100%;
    }

    hgroup{
        padding: 20px 0 60px 0;
        color: white;

        h1{
            font-family: "ivypresto-headline", 'Newsreader', sans-serif;
            font-size: 64px;
            letter-spacing: -.1px;
            font-weight: 500;
            text-align: center;
            margin: 0 0 24px 0;
            color: rgba(white, .8);
        }

        h2{
            font-size: 20px;
            letter-spacing: -.2px;
            font-weight: 300;
            text-align: center;
            color: rgba(white, .36);
            margin-bottom: 20px;
        }

        p{
            font-size: 14px;
            letter-spacing: -.32px;
            font-weight: 450;
            text-align: center;
            margin-top: 32px;
            background: white;
            border-radius: 12px;
            box-shadow: -16px 28px 40px rgba(black, 0.1);
            padding: 18px;
            display: none;
        }
    }



    @media screen and (max-width: 800px) {
        #container{
            flex-direction: column;
            width: 90vw;
            padding: 0;
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