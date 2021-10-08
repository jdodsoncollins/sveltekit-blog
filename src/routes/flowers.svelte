<script lang="ts">
	import dinner_party_1 from '$lib/assets/dinner_party_1.jpeg?width=672';
	import dinner_party_2 from '$lib/assets/dinner_party_2.jpeg?width=672';
	import dinner_party_3 from '$lib/assets/dinner_party_3.jpeg?width=672';
	import dinner_party_4 from '$lib/assets/dinner_party_4.jpeg?width=672';
	import dinner_party_5 from '$lib/assets/dinner_party_5.jpeg?width=672';
	import dinner_party_6 from '$lib/assets/dinner_party_6.jpeg?width=672';
	import dinner_party_7 from '$lib/assets/dinner_party_7.jpeg?width=672';
	import table_arrangement_1 from '$lib/assets/table_arrangement_1.jpeg?width=672';
	import table_arrangement_2 from '$lib/assets/table_arrangement_2.jpeg?width=672';
	import table_arrangement_3 from '$lib/assets/table_arrangement_3.jpeg?width=672';
	import table_arrangement_4 from '$lib/assets/table_arrangement_4.jpeg?width=672';
	import wedding_1 from '$lib/assets/wedding_1.jpeg?width=672';
	import wedding_2 from '$lib/assets/wedding_2.jpeg?width=672';
	import wedding_3 from '$lib/assets/wedding_3.jpeg?width=672';
	import wedding_4 from '$lib/assets/wedding_4.jpeg?width=672';
	import wedding_5 from '$lib/assets/wedding_5.jpeg?width=672';
	import wedding_6 from '$lib/assets/wedding_6.jpeg?width=672';
	import wedding_7 from '$lib/assets/wedding_7.jpeg?width=672';
	import wedding_8 from '$lib/assets/wedding_8.jpeg?width=672';
	import wedding_9 from '$lib/assets/wedding_9.jpeg?width=672';
	import wedding_10 from '$lib/assets/wedding_10.jpeg?width=672';

	import { Lightbox } from 'svelte-lightbox';

	const weddings = [
		wedding_1,
		wedding_2,
		wedding_3,
		wedding_4,
		wedding_5,
		wedding_6,
		wedding_7,
		wedding_8,
		wedding_9,
		wedding_10
	];
	const tableArrangements = [
		table_arrangement_1,
		table_arrangement_2,
		table_arrangement_3,
		table_arrangement_4
	];
	const dinnerParties = [
		dinner_party_1,
		dinner_party_2,
		dinner_party_3,
		dinner_party_4,
		dinner_party_5,
		dinner_party_6,
		dinner_party_7
	];

	let selectedImg;
	const handleClick = (parameter) => {
		selectedImg = parameter;
		console.log(selectedImg);
	};
</script>

<main>
	<p>
		Mrs. Hurst sang with her sister, and while they were thus employed, Elizabeth could not help
		observing, as she turned over some music-books that lay on the instrument, how frequently Mr.
		Darcy’s eyes were fixed on her. She hardly knew how to suppose that she could be an object of
		admiration to so great a man; and yet that he should look at her because he disliked her, was
		still more strange. She could only imagine, however, at last that she drew his notice because
		there was something more wrong and reprehensible, according to his ideas of right, than in any
		other person present. The supposition did not pain her. She liked him too little to care for his
		approbation.
	</p>

	<p>
		After playing some Italian songs, Miss Bingley varied the charm by a lively Scotch air; and soon
		afterwards Mr. Darcy, drawing near Elizabeth, said to her:
	</p>

	<p>
		“Do not you feel a great inclination, Miss Bennet, to seize such an opportunity of dancing a
		reel?”
	</p>
	<h3 class="pt-16">Wedding</h3>
	<div class="horizontal-snap">
		{#each weddings as wedding}
			<img src={wedding} alt="Wedding Arrangement" on:click={() => handleClick(wedding)} />
		{/each}
	</div>
	<h3 class="pt-16">Dinner Party</h3>
	<div class="horizontal-snap">
		{#each dinnerParties as dinnerParty}
			<img src={dinnerParty} alt="Table Arrangement" on:click={() => handleClick(dinnerParty)} />
		{/each}
	</div>
	<h3 class="pt-16">Table Arrangements</h3>
	<div class="horizontal-snap">
		{#each tableArrangements as tableArrangement}
			<img
				src={tableArrangement}
				alt="Table Arrangement"
				on:click={() => handleClick(tableArrangement)}
			/>
		{/each}
	</div>
	<Lightbox isVisible={!!selectedImg}>
		<img src={selectedImg} />
	</Lightbox>
</main>

<style lang="scss">
	main {
		height: 75vh;
		.horizontal-snap {
			margin: 0 auto;
			display: grid;
			grid-auto-flow: column;
			gap: 1rem;
			height: calc(280px + 1rem);
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
	}
</style>
