<script lang="ts">
	import ScrollableContainer from './ScrollableContainer.svelte';
	import SearchBar from '$lib/components/SearchBar/SearchBar.svelte';
	import { useInfiniteQuery } from '@sveltestack/svelte-query';

	let query = '';
	let isScrolledContentAtBottomOfTheContainer = false;

	async function fetchData({ pageParam = 1 }) {
		const data = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${pageParam}`).then(
			(response) => response.json()
		);
		return { data, nextPage: data.at(-1).id === 100 ? undefined : pageParam + 1 };
	}

	$: queryResult = useInfiniteQuery(query, fetchData, {
		getNextPageParam: (data) => data.nextPage || undefined
	});

	$: if (
		isScrolledContentAtBottomOfTheContainer &&
		$queryResult.hasNextPage &&
		!$queryResult.isFetchingNextPage
	) {
		$queryResult.fetchNextPage();
	}
</script>

<SearchBar bind:query />

<ScrollableContainer
	bind:isScrolledContentAtBottomOfTheContainer
	--scrollable-container-height="75vh"
>
	{#if $queryResult.status === 'loading'}
		Loading...
	{:else if $queryResult.status === 'error'}
		<span>Error !! {$queryResult.error}</span>
	{:else}
		<pre>
			{#each $queryResult.data?.pages ?? [] as page}
				{JSON.stringify(page.data, null, 2)}
			{/each}
		</pre>
	{/if}
</ScrollableContainer>

<button
	on:click={() => $queryResult.fetchNextPage()}
	disabled={!$queryResult.hasNextPage || $queryResult.isFetchingNextPage}
>
	{#if $queryResult.isFetching}
		Loading...
	{:else if $queryResult.hasNextPage}
		Load More
	{:else}Nothing more to load{/if}
</button>

<style>
	pre {
		white-space: pre-wrap;
	}
</style>
