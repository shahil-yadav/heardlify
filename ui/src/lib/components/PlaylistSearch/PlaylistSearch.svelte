<script lang="ts">
	import { page } from '$app/stores';
	import { useInfiniteQuery } from '@sveltestack/svelte-query';
	import { onMount } from 'svelte';
	import { searchPlaylists } from '../../functions/search-playlists';
	import Search from '../icons/search.svelte';
	import Times from '../icons/Times.svelte';
	import Button from '../shared/Button.svelte';
	import debounce from 'lodash.debounce';

	import { variables } from '$lib/variables';
	import { goto } from '$app/navigation';

	import PlaylistSummary from '../PlaylistSummary/PlaylistSummary.svelte';

	import PlaylistSummarySkeleton from '../PlaylistSummary/PlaylistSummarySkeleton.svelte';
	import { persistedWritable } from './persisted-writable';
	import { browser } from '$app/env';
	import HelpModal from './HelpModal.svelte';
	import Portal from 'svelte-portal/src/Portal.svelte';
	import { getPortalContext } from '$lib/context/PortalContextProvider.svelte';

	export let date: Date;

	const portal = getPortalContext();
	let helpmodalOpen = false;

	const baseURL = variables.searchApiBasePath;

	let input: HTMLInputElement | null = null;
	const textvalue = persistedWritable('search', '13934751281');
	$: {
		if (browser) {
			textvalue.useLocalStorage();
			const defaultFromQuery = $page.url.searchParams.get('q');
			if (defaultFromQuery) {
				$textvalue = defaultFromQuery;
				goto($page.url.pathname);
			}
		}
	}

	const limit = 10;
	$: queryResult = useInfiniteQuery(
		['search', { textvalue: $textvalue }] as const,
		async ({ pageParam = 0, queryKey }) => {
			return $textvalue
				? await searchPlaylists(baseURL, queryKey[1].textvalue, pageParam, limit)
				: Promise.resolve({ playlists: { items: [], offset: 0, total: 0 } });
		},
		{
			getNextPageParam: (lastGroup) => {
				if (!lastGroup.playlists) return undefined;
				const next = lastGroup.playlists.offset + limit;
				return next < lastGroup.playlists.total ? next : undefined;
			}
		}
	);
	$: pages = $queryResult.data?.pages ?? [];
	async function load() {}
	function clear() {
		$textvalue = '';
		input?.focus();
	}

	onMount(() => {
		load();
	});

	let container: HTMLDivElement | null = null;
	$: {
		if (container) {
			const { scrollTop, clientHeight, scrollHeight } = container;
			if (scrollTop >= scrollHeight - clientHeight) {
				if ($queryResult.hasNextPage && !$queryResult.isFetchingNextPage) {
					$queryResult.fetchNextPage();
				}
			}
		}
	}
	$: {
		if ($textvalue === '/time') {
			let message = '';
			const currentTimeMachine = $page.url.searchParams.get('time-machine');
			if (currentTimeMachine) {
				$page.url.searchParams.delete('time-machine');
				message = 'Time Machine Disabled';
			} else {
				$page.url.searchParams.set('time-machine', String(true));
				message = 'Time Machine Activated';
			}

			portal.addAlert(message).then((o) => {
				$textvalue = '';
				window.location.href = $page.url.toString();
			});
		} else if ($textvalue === '/stats') {
			goto('/stats');
		}
	}
	const handleInput = debounce((newvalue: string) => {
		$textvalue = newvalue;
	}, 600);
</script>

<Portal target="body">
	<HelpModal bind:open={helpmodalOpen} />
</Portal>
<div class="whole-thing">
	<div style="width: 100%">
		<div class="input-container">
			<Search />
			<input
				class="input"
				type="text"
				bind:this={input}
				value={$textvalue}
				on:input={(e) => handleInput(e.currentTarget.value)}
				on:keyup={load}
			/>
			{#if $textvalue}
				<Button color="transparent" nopadding on:click={clear}><Times /></Button>
			{/if}
		</div>
		<button class="help-link" on:click={() => (helpmodalOpen = true)}
			>Still can't find your playlist?</button
		>
	</div>

	<div class="playlists" bind:this={container} on:scroll={() => (container = container)}>
		{#if !$textvalue}
			<div class="noresult-message">Start typing to find a Spotify playlist to Heardlify</div>
		{/if}
		{#if $textvalue}
			{#if pages[0]?.playlists.items.length < 1}
				<div class="noresult-message">
					Couldn't find a playlist containing <br /> "{$textvalue}"
				</div>
			{/if}

			{#each pages as page}
				{#each page.playlists.items as playlist}
					<PlaylistSummary {playlist} {date} />
				{/each}
			{/each}

			{#if $queryResult.isLoading || $queryResult.isFetchingNextPage}
				{#each [1, 0.5, 0.25, 0.1] as opacity}
					<PlaylistSummarySkeleton style="opacity: {opacity}" />
				{/each}
			{/if}
		{/if}
	</div>
</div>

<style>
	.whole-thing {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	.playlists {
		flex: 1;
	}
	.input-container {
		border-radius: 4px;
		border: solid 2px var(--color-mbg);
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-left: 8px;
		padding-right: 8px;
		gap: 8px;
		width: 100%;
	}
	.input {
		width: 100%;
		padding: 12px;
		outline: none;
		border: none;
		background-color: transparent;
		color: var(--color-fg);
		font-size: inherit;
	}

	.input-container:focus-within {
		border-color: var(--color-positive);
	}
	.playlists {
		width: 100%;

		overflow-y: auto;
	}

	.noresult-message {
		color: var(--color-line);
		text-align: center;
		padding: 12px;
	}
	.help-link {
		border: none;
		padding-top: 8px;
		background-color: transparent;
		text-decoration: underline;
		color: var(--color-line);
		text-align: end;
		justify-self: end;
		width: 100%;
		cursor: pointer;
	}
</style>
