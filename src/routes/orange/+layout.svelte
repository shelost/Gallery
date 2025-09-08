<script>
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="orange-gradient.png" />
</svelte:head>

<style lang="scss">
  :global(html, body) {
    background: rgb(255, 238, 201) !important;
    margin: 0;
    min-height: 100vh;
  }
</style>

{@render children()}
