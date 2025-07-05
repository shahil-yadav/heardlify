<script>
	import PlaylistSearch from '$lib/components/PlaylistSearch/PlaylistSearch.svelte';
	import PlaylistSummarySkeleton from '$lib/components/PlaylistSummary/PlaylistSummarySkeleton.svelte';
	import ScrollableContainer from '$lib/components/SearchBar/ScrollableContainer.svelte';
	import SearchBarPreview from '$lib/components/SearchBar/SearchBarPreview.svelte';
</script>

<div class="wrapper">
	<!-- <SearchBarPreview /> -->
	<PlaylistSearch date={new Date()} />
</div>

<style>
	.wrapper {
		padding: 0 50px;
		padding-top: 50px;
	}
</style>
