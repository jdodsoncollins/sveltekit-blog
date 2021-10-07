<script>
  import Seo from "$lib/Seo.svelte";
  import Nav from '$lib/Nav.svelte';
  import "../app.postcss";
  import "../style.css";
</script>

<Seo />
<div class="body-wrapper max-w-screen-md mx-auto">
  <Nav/>
  <slot />
</div>
