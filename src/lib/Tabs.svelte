<script lang="ts">
	import { onMount } from 'svelte';

	export let items: { [key: string]: string }[] = [];
	export let activeTabValue;

	onMount(() => {
		// Set default tab value
		if (items?.length && items[0].value) {
			activeTabValue = items[0].value;
		}
	});

	const handleClick = (tabValue) => () => (activeTabValue = tabValue);
</script>

<ul>
	{#if items?.length}
		{#each items as item}
			<li class={activeTabValue === item.value ? 'active' : ''}>
				<span on:click={handleClick(item.value)}>{item.label}</span>
			</li>
		{/each}
	{/if}
</ul>

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		padding-left: 0;
		margin-bottom: 0;
		list-style: none;
		border-bottom: 1px solid #dee2e6;
	}

	span {
		border: 1px solid transparent;
		border-top-left-radius: 0.25rem;
		border-top-right-radius: 0.25rem;
		display: block;
		padding: 0.5rem 1rem;
		cursor: pointer;
	}

	span:hover {
		border-color: #e9ecef #e9ecef #dee2e6;
	}

	li.active > span {
		color: #495057;
		background-color: #fff;
		transition: background-color ease 1s;
		border-color: #dee2e6 #dee2e6 #fff;
	}
</style>
