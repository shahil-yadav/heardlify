import jsonifyError from '$/utils/jsonify-error';
import logs from '$/utils/mongodb-api/logs';
import NetlifyFunctionHelpers from '$/utils/netlify-function-helpers';
import spotifyAccountApi from '$/utils/spotify-account-api';
import spotifyApi from '$/utils/spotify-api';
import { Handler } from '@netlify/functions';
import { searchPlaylists, getPlaylist } from 'deezer-ts-api';
import z from 'zod';

export type IPlaylistSummary = {
	id: string;
	images: { url: string }[];
	name: string;
	description: string;
	owner: {
		display_name: string;
	};
};
export type ISearchPlaylistsResponse = {
	playlists: {
		items: IPlaylistSummary[];
		offset: number;
		total: number;
	};
};

function mapDeezerObjectToDto(item: {
	id: number;
	picture: string;
	picture_medium: string;
	picture_small: string;
	title: string;
	user: { name: string };
}): IPlaylistSummary {
	return {
		id: item.id.toString(),
		description: '',
		images: [item.picture, item.picture_medium, item.picture_small].map((url) => ({ url })),
		name: item.title,
		owner: {
			display_name: item.user.name
		}
	};
}

function mapSpotifyObjectToDto(item: SpotifyApi.PlaylistObjectSimplified): IPlaylistSummary {
	return {
		id: item.id,
		description: item.description ?? '',
		images: item.images.map((image) => ({ url: image.url })),
		name: item.name,
		owner: {
			display_name: item.owner.display_name ?? ''
		}
	};
}

function isDeezerId(value: string) {
	return z.number().safeParse(Number(value)).success;
}

function isSpotifyId(value: string) {
	const spotifyIdRegexp = new RegExp(
		'^[0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz]{22}$'
	);
	return spotifyIdRegexp.test(value);
}

function isSpotifyPlaylistUrl(value: string) {
	// e.g. 'https://open.spotify.com/playlist/1p3I3zrVPmJXbmYUcA7kJz?si=iNcr5LgOSG-JMLU6D-o84A'
	const isUrl = value.includes('https://open.spotify.com/playlist/');
	return isUrl;
}
function getPlaylistIdFromPlaylistUrl(value: string) {
	// e.g. 'https://open.spotify.com/playlist/1p3I3zrVPmJXbmYUcA7kJz?si=iNcr5LgOSG-JMLU6D-o84A'
	const path = new URL(value).pathname.split('/');
	const entityId = path[path.length - 1];
	return entityId;
}

export const handler: Handler = async (event, { awsRequestId }) => {
	const userSessionId = NetlifyFunctionHelpers.getCookie(event, 'sid');
	try {
		const q = event.queryStringParameters?.['q'];
		let offset = Number(event.queryStringParameters?.['offset']);
		let limit = Number(event.queryStringParameters?.['limit']);
		if (isNaN(offset) || offset < 0) offset = 0;
		if (isNaN(limit) || limit < 1 || limit > 100) limit = 10;

		if (!q) {
			await logs.logInfo({
				sessionId: awsRequestId,
				eventName: 'search-playlists:400',
				data: {
					event: { ...event },
					userSessionId
				}
			});
			return {
				statusCode: 400,
				body: JSON.stringify({ error: { status: 400, message: 'No search query' } }, null, 2),
				headers: {
					...NetlifyFunctionHelpers.getCorsHeaders(event)
				}
			};
		}

		// const authToken = await spotifyAccountApi.getClientCredentialsToken();

		let results: ISearchPlaylistsResponse;
		if (
			// isSpotifyId(q)
			isDeezerId(q)
		) {
			// const item = await spotifyApi.playlists.getOne(q, authToken.access_token);
			const item = await getPlaylist(parseInt(q, 10));
			results = {
				playlists: {
					items: [
						mapDeezerObjectToDto({
							id: item.id,
							picture: item.picture,
							picture_small: item.picture_small,
							picture_medium: item.picture_medium,
							title: item.title,
							user: { name: item.creator.name }
						})
					],
					offset: 0,
					total: 1
				}
			};
			// }
			// TODO: Will have fun with regex later onwards with Deezer's url

			// else if (isSpotifyPlaylistUrl(q)) {
			// 	const playlistId = getPlaylistIdFromPlaylistUrl(q);
			// 	const item = await spotifyApi.playlists.getOne(playlistId, authToken.access_token);
			// 	results = {
			// 		playlists: {
			// 			items: [mapSpotifyObjectToDto(item)],
			// 			offset: 0,
			// 			total: 1
			// 		}
			// 	};
		} else {
			// const searchResult = await spotifyApi.search.searchPlaylists(
			// 	authToken.access_token,
			// 	q,
			// 	offset,
			// 	limit
			// );
			const searchResults = await searchPlaylists(q, { index: offset });
			const getOffsetFromUrl = (url?: string) => {
				if (!url) return 0;
				const params = new URL(url).searchParams;
				const index = parseInt(params.get('index') ?? '', 10);
				return index;
			};
			results = {
				playlists: {
					// items: searchResult.playlists.items.filter(Boolean).map(mapSpotifyObjectToDto),
					items: searchResults.data.map(mapDeezerObjectToDto),
					// offset: searchResult.playlists.offset,
					offset: getOffsetFromUrl(searchResults.next),
					// total: searchResults.playlists.total
					total: searchResults.total
				}
			};
		}

		await logs.logInfo({
			sessionId: awsRequestId,
			eventName: 'search-playlists:200',
			data: {
				event: { ...event },
				userSessionId
			}
		});

		return {
			statusCode: 200,
			body: JSON.stringify(results, null, 2),
			headers: {
				...NetlifyFunctionHelpers.getCacheControlHeader({ public: true, maxAge: { days: 1 } }),
				...NetlifyFunctionHelpers.getCorsHeaders(event)
			}
		};
	} catch (error) {
		await logs.logError({
			sessionId: awsRequestId,
			eventName: 'search-playlists:500',
			data: {
				event: { ...event },
				userSessionId,
				error: jsonifyError(error)
			}
		});
		throw error;
	}
};
