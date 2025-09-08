<script>
  let { children } = $props();
</script>

<style lang="scss">
  :global(html, body) {
    background: rgb(255, 238, 201) !important;
    margin: 0;
    min-height: 100vh;
  }
</style>

{@render children()}
