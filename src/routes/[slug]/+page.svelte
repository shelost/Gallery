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


<div id = 'container'>
    <div id = 'sidebar'>

        <button on:click = {() => {goto('/')}}>
            Back
        </button>
    </div>
    <div id = 'main'>

        <hgroup>
            <h1>
                {data.meta.title}
            </h1>
        </hgroup>


        {#if data.meta.preview}
            <img class = 'bento' src = 'bento/{data.meta.preview}.svg'>
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
        padding: 28px;
        border-radius: 12px;
        //box-shadow: 0 10px 40px rgba(black, .05);
    }

    hgroup{
        padding: 0px 0;
        padding-bottom: 24px;
    }

    h1{
        font-size: 48px;
        letter-spacing: -1.8px;
        font-weight: 750;
        text-align: left;
    }

</style>