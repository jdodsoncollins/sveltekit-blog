<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ fetch }) {
		const res = await fetch(`/posts.json`);
		const posts = await res.json();

		return {
			props: {
				posts
			}
		};
	}
</script>

<script lang="ts">
	import { browser } from '$app/env';
	import { onMount } from 'svelte';
	import { paginate, PaginationNav } from 'svelte-paginate';
	import { seo } from '$lib/store';
	//https://www.npmjs.com/package/svelte-paginate

	export let posts;

	let items = posts;
	let currentPage = 1;
	let pageSize = 2;
	$: paginatedItems = paginate({ items, pageSize, currentPage });

	$seo = {
		title: 'bethanycollins.me',
		description: "Bethany Collins' blog"
	};

	onMount(() => {
		if (browser) {
			(document as any).lazyloadInstance.update();
		}
	});
</script>

<main>
	<article>
		<h1
			class="headline sm:text-xl md:text-3xl lg:text-7xl leading-relaxed font-black font-display mb-4"
		>
			bethanycollins.me
		</h1>
		<div class="article-list">
			{#each paginatedItems as { metadata: { title, description, tags, outline, slug }, path }}
				<div class="mb-4">
					<a sveltekit:prefetch href={path.replace(/\.[^/.]+$/, '')}
						><h2 class="text-3xl leading-relaxed">{title}</h2></a
					>
					<p>{description}</p>
				</div>
			{/each}
		</div>
		<div class="mx-auto">
			<PaginationNav
				totalItems={items.length}
				{pageSize}
				{currentPage}
				limit={1}
				showStepOptions={true}
				on:setPage={(e) => (currentPage = e.detail.page)}
			/>
		</div>
	</article>
</main>
