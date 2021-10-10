<script lang="ts">
	import Seo from '$lib/Seo.svelte';
	import Nav from '$lib/Nav.svelte';
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
</div>
