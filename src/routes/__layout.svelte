<script lang="ts">
	import Seo from '$lib/Seo.svelte';
	import Nav from '$lib/Nav.svelte';
	import Footer from '$lib/Footer.svelte';
	import '../app.postcss';
	import '../style.scss';
	import { browser } from '$app/env';
	import lazyload from 'vanilla-lazyload';

	if (browser && !(document as any).lazyloadInstance) {
		(document as any).lazyloadInstance = new lazyload();
	}
</script>

<Seo />
<div class="body-wrapper container mx-auto">
	<Nav />
	<slot />
	<Footer />
</div>

<style lang="scss">
	.body-wrapper {
		padding: 1em;
	}
</style>
