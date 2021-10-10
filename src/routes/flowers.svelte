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
	};
</script>

<h1 class="text-2xl mb-8">Florals</h1>
<p>
	I've been a freelance floral designer for the past four years and have designed florals for dozens
	of weddings, dinner parties, bridal/baby showers, among other events.
</p>
<h3 class="pt-8">Wedding</h3>
<div class="horizontal-snap">
	{#each weddings as wedding}
		<img src={wedding} alt="Wedding Arrangement" on:click={() => handleClick(wedding)} />
	{/each}
</div>
<h3 class="pt-8">Dinner Party</h3>
<div class="horizontal-snap">
	{#each dinnerParties as dinnerParty}
		<img src={dinnerParty} alt="Table Arrangement" on:click={() => handleClick(dinnerParty)} />
	{/each}
</div>
<h3 class="pt-8">Table Arrangements</h3>
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
