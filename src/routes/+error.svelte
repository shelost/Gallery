<script>
  import { page } from "$app/state";
  import { fly } from "svelte/transition";
</script>

<section in:fly={{ y: 100, duration: 100, delay: 100 }}>
  <h1>{page.status}</h1>
  <p>
    {page.error.message}
  </p>
  <span style="font-size: 10em"> </span>
</section>

<style lang="scss">
  section {
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
    color: white;
  }

  h1 {
    font-family: var(--font-headers);
    font-size: 160px;
    font-weight: 600;
    color: rgba(white, 0.8);
  }

  p {
    font-size: 18px;
    font-weight: 200;
    letter-spacing: -0.1px;
    color: rgba(white, 0.5);
  }
</style>
