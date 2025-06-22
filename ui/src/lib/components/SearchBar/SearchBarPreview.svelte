<script lang="ts">
	import SearchBar from '$lib/components/SearchBar/SearchBar.svelte';
	import { useInfiniteQuery, useQuery } from '@sveltestack/svelte-query';

	let query = '';

	async function fetchData({ pageParam = 1 }) {
		const data = await fetch(
			`https://jsonplaceholder.typicode.com/posts?_page=${pageParam}&_limit=2`
		).then((response) => response.json());
		return { data, nextPage: data.at(-1).id === 100 ? undefined : pageParam + 1 };
	}

	$: queryResult = useInfiniteQuery(query, fetchData, {
		getNextPageParam: (lastGroup) => lastGroup.nextPage || undefined
	});
</script>

<div class="wrapper">
	<SearchBar bind:query />

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
</div>

<style>
	pre {
		border: 2px solid var(--color-line);
		white-space: pre-wrap;
		height: calc(100vh - 350px);
		overflow: auto;
	}

	.wrapper {
		padding: 0 50px;
		padding-top: 50px;
	}
</style>
