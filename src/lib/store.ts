import { writable } from 'svelte/store';

export const seo = writable({
	title: 'bethanycollins.me',
	description: "Bethany Collins' home on the web"
});
