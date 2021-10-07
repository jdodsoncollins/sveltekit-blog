<script lang="ts">
	import Seo from '$lib/Seo.svelte';
	import Nav from '$lib/Nav.svelte';
	import '../app.postcss';
	import '../style.css';
	import { browser } from '$app/env';
	import lazyload from 'vanilla-lazyload';

	if (browser && !(document as any).lazyloadInstance) {
		(document as any).lazyloadInstance = new lazyload();
	}
</script>

<Seo />
<div class="body-wrapper max-w-screen-md mx-auto">
	<Nav />
	<slot />
</div>
