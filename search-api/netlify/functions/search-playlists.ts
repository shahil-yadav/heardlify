import jsonifyError from '$/utils/jsonify-error';
import logs from '$/utils/mongodb-api/logs';
import NetlifyFunctionHelpers from '$/utils/netlify-function-helpers';
import spotifyAccountApi from '$/utils/spotify-account-api';
import spotifyApi from '$/utils/spotify-api';
import { Handler } from '@netlify/functions';
import deezerApi from '$utils/deezer-api';
import { z } from 'zod';
import { pl } from 'zod/dist/types/v4/locales';

const PlaylistSummarySchema = z.object({
	id: z.string(),
	images: z.object({ url: z.string() }).array(),
	name: z.string(),
	description: z.string(),
	owner: z.object({ display_name: z.string() })
});

export type IPlaylistSummary = z.infer<typeof PlaylistSummarySchema>;

export type ISearchPlaylistsResponse = {
	playlists: {
		items: IPlaylistSummary[];
		offset: number;
		total: number;
	};
};

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

// Since the param is of type `any`, use Zod Validation
function mapDeezerObjectToDto(item: any): IPlaylistSummary {
	return PlaylistSummarySchema.parse({
		id: item.id.toString(),
		description: item.description ?? '',
		images: [
			item.picture,
			item.picture_small,
			item.picture_medium,
			item.picture_big,
			item.picture_xl
		].map((url) => ({ url })),
		name: item.title,
		owner: {
			display_name: item.creator.name ?? ''
		}
	});
}

function isSpotifyId(value: string) {
	const spotifyIdRegexp = new RegExp(
		'^[0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz]{22}$'
	);
	return spotifyIdRegexp.test(value);
}

function isDeezerId(value: string) {
	return Number.isInteger(Number(value));
}

function isSpotifyPlaylistUrl(value: string) {
	// e.g. 'https://open.spotify.com/playlist/1p3I3zrVPmJXbmYUcA7kJz?si=iNcr5LgOSG-JMLU6D-o84A'
	const isUrl = value.includes('https://open.spotify.com/playlist/');
	return isUrl;
}

function isDeezerPlaylistUrl(value: string) {
	const regex = /^https:\/\/www\.deezer\.com\/[a-z]{2}\/playlist\/\d+$/i;
	return regex.test(value);
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
			const item = await deezerApi.playlists.getOne(q);
			results = {
				playlists: {
					// items: [mapSpotifyObjectToDto(item)],
					items: [mapDeezerObjectToDto(item)],
					offset: 0,
					total: 1
				}
			};
		} else if (
			// isSpotifyPlaylistUrl(q)
			isDeezerPlaylistUrl(q)
		) {
			const playlistId = getPlaylistIdFromPlaylistUrl(q);
			// const item = await spotifyApi.playlists.getOne(playlistId, authToken.access_token);
			const item = await deezerApi.playlists.getOne(playlistId);
			results = {
				playlists: {
					// items: [mapSpotifyObjectToDto(item)],
					items: [mapDeezerObjectToDto(item)],
					offset: 0,
					total: 1
				}
			};
		} else {
			// const searchResult = await spotifyApi.search.searchPlaylists(
			// 	authToken.access_token,
			// 	q,
			// 	offset,
			// 	limit
			// );

			// TODO: This (if block) will throw deliberately throw error
			const searchResult = await deezerApi.search.searchPlaylists(q, offset, limit);
			results = {
				playlists: {
					items: [],
					offset: 0,
					total: 0
				}
			};
			// results = {
			// 	playlists: {
			// 		items: searchResult.playlists.items.filter(Boolean).map(mapSpotifyObjectToDto),
			// 		offset: searchResult.playlists.offset,
			// 		total: searchResult.playlists.total
			// 	}
			// };
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
