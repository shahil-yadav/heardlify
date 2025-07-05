import { useInfiniteQuery } from '@sveltestack/svelte-query';
import { searchPlaylists } from './search-playlists';
import { variables } from '$lib/variables';

interface getPlaylistArgs {
	limit?: number;
	query: string;
}

export function getPlaylists({ limit = 10, query }: getPlaylistArgs) {
	return useInfiniteQuery(
		['search', query],
		async ({ pageParam }) => {
			if (!query) return Promise.resolve({ playlists: { items: [], offset: 0, total: 0 } });
			return await searchPlaylists(variables.searchApiBasePath, query, pageParam, limit);
		},
		{
			getNextPageParam: (lastGroup) => {
				if (!lastGroup.playlists) return undefined;
				const next = lastGroup.playlists.offset + limit;
				return next < lastGroup.playlists.total ? next : undefined;
			}
		}
	);
}
