<script>
    import { formatDate, formatYear } from '$lib/utils'
    import { activeImage, showPreview, hoverCard, showHeader } from '$lib/store';
    import { goto } from '$app/navigation';
    import "material-icons/iconfont/material-icons.css";
	import { onMount } from 'svelte'
	import { page } from '$app/stores'

    export let post

    function titleCase(val) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }

    function handleClick(post, event) {
		let elem = event.currentTarget
		let rect = elem.getBoundingClientRect();
    }

    let icon = 'sports_esports'
    let theme = '#6355FF'
    let card = post.meta.card ? post.meta.card : ''

    switch(post.meta.type){
        case 'game':
            icon = 'sports_esports'
            theme = '#6355FF'
            break
        case 'blog':
            icon = 'feed'
            theme = '#FF2E65'
            break
        case 'gallery':
            icon = 'collections'
            theme = '#F959FF'
            break
        case 'comic':
            icon = 'question_answer'
            theme = '#FF7559'
            break
        case 'web':
            icon = 'computer'
            theme = '#0C75ED'
            break
        default:
            break
    }

</script>


<div class = 'card' on:mouseover on:mouseout on:click>

    <div class = 'label'>
        <span class="material-icons" style = 'color: {theme}'>
            { icon }
        </span>
        <h3> {titleCase(post.meta.type)} </h3>
    </div>

    <div class = 'post {post.meta.type}' >

    {#if post.meta.color}
        <div class = 'color' style = 'background: #{post.meta.color}'></div>
    {/if}

    {#if post.meta.card}
        <div class = 'thumbnail' style = 'background-image: url("/card/{post.meta.card}.png")'></div>
    {/if}

    <div class = 'expo'>
        <h3 class = 'series'> {post.meta.series} </h3>
        <h1 class="title"> {post.meta.title} </h1>
        <p class="description"> {post.meta.description} </p>
        <h2 class="date"> {formatYear(formatDate(post.meta.date))} </h2>
    </div>

    <div class = 'prose prose-text'>
        <svelte:component this={post.content} />
    </div>

</div>



<style lang="scss">


    @media screen and (max-width: 800px){

        .post{
            width: 90vw !important;
            //height: 80vh;
            margin-bottom: 40px;
        }
    }

    @media screen and (max-width: 800px){

        .post{
        }
    }


</style>