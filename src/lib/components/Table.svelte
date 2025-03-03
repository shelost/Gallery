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

    export let data = {}

    console.log(data)

</script>


<div class = 'table' in:fade>

    {#if data.title}

        <div class = 'title'>
            <h1> {data.title} </h1>
            <h2> {data.subtitle} </h2>
        </div>
        {#each data.rows as row, index}
            <div class = 'group'>
                <div class = 'row title'>
                    <h1> {row.title} </h1>
                    <h2> {row.subtitle} </h2>
                </div>
                <div class = 'row'>
                    {#each row.cells as cell, i}
                        <div class = 'cell'>
                            <h3> {cell.header} </h3>
                            <p> {cell.content} </p>
                        </div>
                    {/each}
                </div>
            </div>

        {/each}

    {/if}

</div>


<style lang="scss">

    .table{
        width: 100%;
        margin: 24px 0;
        .title{
            text-align: center;
            margin-bottom: 32px;
            h1{
                font-size: 32px;
                border: none;
                margin-bottom: 4px;
            }
            h2{
                font-family: 'Inter', sans-serif;
                font-size: 16px;
                font-weight: 600;
                letter-spacing: -0.5px;
                max-inline-size: 100%;
                margin: 0;
            }
        }
        .row{
            display: flex;
            .cell{
                flex: 1;
                background: #F8F9FA;
                background: white;
                box-shadow: 2px 8px 24px rgba(#030025, 0.08);
                margin: 2px;
                border-radius: 4px;
                padding: 18px;
                h3{
                    font-family: 'DM Serif Display', 'Inter', sans-serif;
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: 0px;
                    margin: 0;
                    margin-bottom: 12px;
                }
                p{
                    font-size: 14px;
                    line-height: 140%;
                    margin: 0;
                }
            }
            &.title{
                flex-direction: column;
                text-align: center;
                padding: 16px 0;
                margin: 4px 0;
                background: #F8F9FA;
                box-shadow: 2px 6px 24px rgba(#030025, 0.12);
                border: 3px solid white;
                h1{
                    font-family: 'Inter', sans-serif;
                    letter-spacing: -0.25px;
                    font-size: 18px;
                    border: none;
                    margin: 0;
                    margin-bottom: 2px;
                }
                h2{
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 400;
                    letter-spacing: -0.25px;
                    margin: 0;
                    max-inline-size: 100%;
                }
            }
        }
    }

    @media screen and (max-width: 800px){
        .gallery{
            //border: 2px solid red;
        }
    }

</style>