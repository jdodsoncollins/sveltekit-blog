<script lang="ts">
	import dinner_party_1 from '$lib/assets/parties/party_1.jpg';
	import dinner_party_2 from '$lib/assets/parties/party_2.jpg';
	import dinner_party_3 from '$lib/assets/parties/party_3.jpg';
	import dinner_party_4 from '$lib/assets/parties/party_4.jpg';
	import dinner_party_5 from '$lib/assets/parties/party_5.jpg';
	import dinner_party_6 from '$lib/assets/parties/party_6.jpg';
	import dinner_party_7 from '$lib/assets/parties/party_7.jpg';
	import table_arrangement_1 from '$lib/assets/table_arrangement/table_arrangement_1.jpg';
	import table_arrangement_2 from '$lib/assets/table_arrangement/table_arrangement_2.jpg';
	import table_arrangement_3 from '$lib/assets/table_arrangement/table_arrangement_3.jpg';
	import table_arrangement_4 from '$lib/assets/table_arrangement/table_arrangement_4.jpg';
	import table_arrangement_5 from '$lib/assets/table_arrangement/table_arrangement_5.jpg';
	import table_arrangement_6 from '$lib/assets/table_arrangement/table_arrangement_6.jpg';
	import table_arrangement_7 from '$lib/assets/table_arrangement/table_arrangement_7.jpg';
	import table_arrangement_8 from '$lib/assets/table_arrangement/table_arrangement_8.jpg';
	import table_arrangement_9 from '$lib/assets/table_arrangement/table_arrangement_9.jpg';
	import table_arrangement_10 from '$lib/assets/table_arrangement/table_arrangement_10.jpg';
	import wedding_1 from '$lib/assets/wedding/wedding_1.jpg';
	import wedding_2 from '$lib/assets/wedding/wedding_2.jpg';
	import wedding_3 from '$lib/assets/wedding/wedding_3.jpg';
	import wedding_4 from '$lib/assets/wedding/wedding_4.jpg';
	import wedding_5 from '$lib/assets/wedding/wedding_5.jpg';
	import wedding_6 from '$lib/assets/wedding/wedding_6.jpg';
	import wedding_7 from '$lib/assets/wedding/wedding_7.jpg';
	import wedding_8 from '$lib/assets/wedding/wedding_8.jpg';
	import wedding_9 from '$lib/assets/wedding/wedding_9.jpg';
	import wedding_10 from '$lib/assets/wedding/wedding_10.jpg';
	import wedding_11 from '$lib/assets/wedding/wedding_11.jpg';
	import wedding_12 from '$lib/assets/wedding/wedding_12.jpg';
	import making_1 from '$lib/assets/making/making_1.jpg';
	import making_2 from '$lib/assets/making/making_2.jpg';
	import making_3 from '$lib/assets/making/making_3.jpg';
	import making_4 from '$lib/assets/making/making_4.jpg';

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
		wedding_10,
		wedding_11,
		wedding_12
	];
	const tableArrangements = [
		table_arrangement_1,
		table_arrangement_2,
		table_arrangement_3,
		table_arrangement_4,
		table_arrangement_5,
		table_arrangement_6,
		table_arrangement_7,
		table_arrangement_8,
		table_arrangement_9,
		table_arrangement_10
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
	const makings = [making_1, making_2, making_3, making_4];

	let selectedImg;
	const handleClick = (parameter) => {
		selectedImg = parameter;
	};
</script>

<h1 class="text-2xl mb-8">Florals</h1>
<p>
	I've been a freelance floral designer for the past four years and have designed florals for dozens
	of weddings, dinner parties, bridal/baby showers, among other events. If you are interested, send
	me an <a href="mailto:bethanywilsoncollins@gmail.com" target="_blank">📩 email</a> and I can provide
	details.
</p>
<h2 class="pt-8">Wedding</h2>
<div class="horizontal-snap">
	{#each weddings as wedding}
		<img src={wedding} alt="Wedding Arrangement" on:click={() => handleClick(wedding)} />
	{/each}
</div>
<h2 class="pt-8">Dinner Party</h2>
<div class="horizontal-snap">
	{#each dinnerParties as dinnerParty}
		<img src={dinnerParty} alt="Table Arrangement" on:click={() => handleClick(dinnerParty)} />
	{/each}
</div>
<h2 class="pt-8">Table Arrangements</h2>
<div class="horizontal-snap">
	{#each tableArrangements as tableArrangement}
		<img
			src={tableArrangement}
			alt="Table Arrangement"
			on:click={() => handleClick(tableArrangement)}
		/>
	{/each}
</div>
<h2 class="pt-8">Behind the Scenes Look!</h2>
<div class="horizontal-snap">
	{#each makings as making}
		<img src={making} alt="Behind the Scenes Flower Making" on:click={() => handleClick(making)} />
	{/each}
</div>
<Lightbox isVisible={!!selectedImg}>
	<img src={selectedImg} />
</Lightbox>

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
