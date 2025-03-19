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

    console.log(data)

 </script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.meta.title} />
    <link rel="icon" href="smiley.png" />
</svelte:head>

<div id = 'container'>
    <div id = 'sidebar'>

        <button class = 'light back' on:click = {() => {goto('/')}}>
            Back
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


        {#if data.meta.preview}
            <img class = 'banner' src = 'bento/{data.meta.preview}.svg'>
        {/if}
        <div class="prose preview">
            <svelte:component this={data.content} />
        </div>
    </div>
</div>


<style lang="scss">

    #container{
        display: flex;
        justify-content: right;
        padding: 48px 0 72px 0;
        //border: 1px solid red;
    }

    #sidebar{
        width: 140px;
		height: calc(100vh - 52px);
		border-radius: 6px;
		padding: 16px;
		position: fixed;
		top: 10px;
		left: 10px;
		z-index: 3;
    }

    #main{
        width: calc(100% - 160px);
        width: clamp(50%, 800px, 90%);
        padding: 28px;
        border-radius: 12px;
        margin: auto;
        //box-shadow: 0 10px 40px rgba(black, .05);
    }

    .banner{
        width: 100%;
    }

    hgroup{
        padding: 0px 0;
        padding-bottom: 24px;

        h1{
            font-size: 36px;
            letter-spacing: -.8px;
            font-weight: 600;
            text-align: left;
            margin: 0 0 4px 0;
        }

        h2{
            font-size: 24px;
            letter-spacing: -.6px;
            font-weight: 500;
            text-align: left;
            color: rgba(#030025, .25);
            margin-bottom: 20px;
        }

        p{
            font-size: 14px;
            letter-spacing: -.32px;
            font-weight: 450;
            text-align: left;
        }
    }


    .prose{
        :global(p){
            font-size: 14px;
            letter-spacing: -.32px;
            font-weight: 450;
            text-align: left;

        }
    }


</style>