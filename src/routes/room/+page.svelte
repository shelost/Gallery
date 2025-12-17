<script>
  import { Canvas } from '@threlte/core';
  import Scene from './Scene.svelte';
</script>

<div class="h-screen w-full bg-lavender">
  <Canvas>
    <Scene />
  </Canvas>

  <div class='mast'>

    <h1> Heewon's Room </h1>

    <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
    </nav>

    <button>
        <h2>
            Hello
        </h2>
    </button>

  </div>

</div>

<style lang="scss">

    .bg-lavender {
        background-color: #e0e0ff; 
    }
    .h-screen {
        height: 100vh;
    }
    .w-full {
        width: 100%;
    }
    :global(body) {
        margin: 0;
        overflow: hidden;
    }

    .mast{
        position: absolute;
        bottom: 0;
        left: 0;
        height: 100%;
        z-index: 10;
        padding: 32px;
        box-sizing: border-box;

        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: space-between;

        h1{
            font-family: 'Source Serif 4', sans-serif;
            font-size: 40px;
            font-weight: 400;
            letter-spacing: -1.5px;
            line-height: 130%;
            margin-bottom: 2px;
            color: #030025;
        }
    }

    nav{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        gap: 12px;
      
        a{
            font-size: 16px;
            color: black;
        }
    }

    button{
        background: #6355FF;
        padding: 16px 32px;
        border-radius: 100px;
        box-shadow: 0 2px 4px rgba(black, .2);

        h2{
            font-family: 'Source Serif 4', sans-serif;
            color: white !important;
            letter-spacing: -0.5px;
            font-size: 20px;
        }
    }

</style>

