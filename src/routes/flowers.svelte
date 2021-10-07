<script>
	import { Images } from 'svelte-images';
	import flowers_1 from '$lib/assets/flowers_1.jpg?width=672';
	const images = [
		{
			src: flowers_1
		},
		{
			src: flowers_1
		},
		{
			src: flowers_1
		},
		{
			src: flowers_1
		},
		{
			src: flowers_1
		},
		{
			src: flowers_1
		}
	];
</script>

<main>
	<Images {images} gutter={5} />
</main>

<style>
	main {
		height: 75vh;
	}
</style>
