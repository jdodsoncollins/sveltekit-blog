<script lang="ts">
	import ga_cert from '$lib/assets/bmc_ga_cert.png?width=672';
	import ga_google_cert from '$lib/assets/bmc_google_cert.jpg?width=672';
	import florage_wireframe_1 from '$lib/assets/florage_wireframe_1.png?width=672';
	import florage_wireframe_2 from '$lib/assets/florage_wireframe_2.png?width=672';
	import florage_wireframe_3 from '$lib/assets/florage_wireframe_3.png?width=672';
	import florage_wireframe_4 from '$lib/assets/florage_wireframe_4.png?width=672';
	import florage_wireframe_5 from '$lib/assets/florage_wireframe_5.png?width=672';
	import ga_presentation_mp4 from '$lib/assets/ga_presentation_mp4.mp4';
	import ga_presentation_webm from '$lib/assets/ga_presentation_webm.webm';
	import hitrecord_collage from '$lib/assets/hitrecord_collage.jpg';
	import Tabs from '$lib/Tabs.svelte';
	import { Lightbox } from 'svelte-lightbox';

	// List of tab items with labels and values.
	let tabItems = [
		{ label: 'General Assembly Product Management', value: 1 },
		{ label: 'Educational Consultant', value: 2 }
	];

	// Current active tab
	let currentTab;

	let selectedImg;
	const handleClick = (parameter) => {
		selectedImg = parameter;
	};

	const gaDocs = [
		ga_cert,
		ga_google_cert,
		florage_wireframe_1,
		florage_wireframe_2,
		florage_wireframe_3,
		florage_wireframe_4,
		florage_wireframe_5
	];
</script>

<h1 class="text-2xl mb-8">Projects</h1>

<Tabs bind:activeTabValue={currentTab} items={tabItems} />

<div class="py-4">
	{#if 1 === currentTab}
		<p>
			I recently completed a ten week class in <a
				href="https://generalassemb.ly/education/product-management/los-angeles"
				>Product Management at General Assembly</a
			>. I have created a prototype for a new e-commerce site that allows customers to discover and
			order from local floral designers. Through the class I've gained experience with the
			development life cycle: ideation, user interviews/research, creating high and low fidelity
			mockups, testing and validating assumptions, prioritizing features, implementing agile
			strategies, creating a product roadmap, exploring user stories, and writing acceptance
			criteria.
		</p>

		My product is called<em>&nbsp;Florage</em>, a creator marketplace for florists. Though it does not
		exist in reality (or not yet at least), it was created as if it would be funded and passed off
		to a development team next.
		<h3 class="py-4">Final presentation video</h3>
		<video controls>
			<source src={ga_presentation_mp4} type="video/mp4" />
			<source src={ga_presentation_webm} type="video/webm" />
			Your browser does not support the video tag.
		</video>

		<h3 class="pb-4 pt-8">Documents</h3>
		<div class="horizontal-snap">
			{#each gaDocs as gaDoc}
				<img src={gaDoc} alt="Table Arrangement" on:click={() => handleClick(gaDoc)} />
			{/each}
		</div>
		<Lightbox isVisible={!!selectedImg}>
			<img src={selectedImg} />
		</Lightbox>
	{/if}

	{#if 2 === currentTab}
		<p>
			I'm an ongoing consultant for <a href="https://hitrecord.org/classes"
				>HitRecord Class Projects</a
			>. This role is centered around pedagogical/e-learning practices that help make learning
			engaging for adults. Regardless of whether a class is for fun or academia, or for kids or
			adults, these practices are important and I'm happy to have helped with some of the classes
			shown.
		</p>

		<div class="my-8">
			<img
				class="grid place-items-center"
				src={hitrecord_collage}
				alt="HitRecord Collage Illustration"
			/>
		</div>
	{/if}
</div>

<style lang="scss">
	.horizontal-snap {
		margin: 0 auto;
		display: grid;
		grid-auto-flow: column;
		gap: 1rem;
		height: calc(320px + 1rem);
		padding: 1rem;
		overflow-y: auto;
		overscroll-behavior-x: contain;
		scroll-snap-type: x mandatory;
		img {
			scroll-snap-align: center;
			width: 220px;
			max-width: none;
			object-fit: contain;
		}
	}
</style>
