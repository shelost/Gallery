<script>
    import { writable } from 'svelte/store'
    import { activeImage, showPreview } from '$lib/store';
    import {
		blur,
		crossfade,
		draw,
		fade,
		fly,
		scale,
		slide
	} from 'svelte/transition';

    export let images = []
    export let col = 3

    let Preview

    let preview = writable(false)
    let active = writable(null)

    function handleClick(event, image, index){
        showPreview.set(true)
        activeImage.set(image)
    }

    function closeModal(event) {
		// Only close the modal if the click was on the background (not the modal itself)
		if (event.target.id === 'pop') {
			showPreview.set(false)
		}else{
			//goto(`/${$selected.slug}`, {noScroll: true})
		}
	}

</script>


<div class = 'gallery grid col-{col}' in:fade>

    {#each images as image, index}

        <div class = 'elem'
            in:fly={{y: 50, delay: 200+index*50}}
            on:click = {(event) => {handleClick(event, image, index)}}
        >
            <img src = '../img/{image.url}.{image.type ? image.type : "png"}' alt = 'Image'>
            <p> {image.caption} </p>
        </div>

    {/each}

</div>


<style lang="scss">

    .gallery{
		display: flex;
		//justify-content: space-between;
		//flex-wrap: wrap;
		// width: 114%;
	    // transform: translateX(-6%);
        //border: 1px solid red;
		margin: 32px 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        column-gap: 36px;
        row-gap: 32px;
        transition: 0.2s ease;

        &.col-2{
            grid-template-columns: repeat(2, 1fr);
            //gap: 24px;
        }

        &.col-4{
            grid-template-columns: repeat(4, 1fr);
            //gap: 24px;
        }

        &.col-6{
            grid-template-columns: repeat(6, 1fr);
        }

        &.col-8{
            column-gap: 3%;
            grid-template-columns: repeat(8, 1fr);
            .elem{
                img{
                    border-radius: 18px;
                }
            }
        }

        .elem{
            width: 100%;
            margin-bottom: 0;
            transition: 0.2s ease;
            img{
                box-shadow: none;
                border-radius: 6px;
                margin-bottom: 6px;
                background: white;

                box-shadow: -12px 18px 24px rgba(black, 0.1);
                //border: 1px solid rgba(white, 0.4);
                width: 100%;
            }
            p{
                color: rgba(black, 0.5);
                font-size: 13px;
                font-weight: 500;
                margin: 0;
            }

            &:hover{
                opacity: 0.95;
            }
        }
	}


    @media screen and (max-width: 800px){
        .gallery{
            //border: 2px solid red;

            display: flex;
            flex-direction: column;
            gap: 32px;
        }
    }


</style>