<script>
	import { page } from '$app/stores';
	console.log($page.path);
</script>

<nav class="pb-8 flex flex-col md:flex-row items-center">
	<div class="flex-1">
		<a href="/"><div class="logo-wrapper"><h1 class="logo pr-4 text-3xl">Bethany Collins</h1></div></a>
	</div>
	<div class="flex-1 flex md:justify-end">
		<a class="pr-4 font-display" href="/flowers"
			><span class:active={$page.path.includes('/flowers')}>Florals</span><span class="emoji pl-4"
				>🌸</span
			></a
		>
		<a class="px-4 font-display" href="/projects"
			><span class:active={$page.path.includes('/projects')}>Projects</span><span class="emoji pl-4"
				>🗂</span
			></a
		>
	</div>
</nav>

<style lang="scss">
	.emoji {
		font-size: 1.5em;
	}
	.logo-wrapper {
		display: inline;
	}
	.logo {
		display: inline;
		font-weight: 700;
	}
	a {
		@apply flex items-center;
		.active {
			text-decoration: underline;
		}
	}
</style>
