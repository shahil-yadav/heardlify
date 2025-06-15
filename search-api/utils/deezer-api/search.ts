import pushoverApi from '$utils/pushover-api';

// TODO: The functionality to search for playlists is not yet provided by deezer.com
async function searchPlaylists(q: string, offset = 0, limit = 10) {
	const url = 'https://developers.deezer.com/api/search';
	const text = 'The functionality to search for playlists is not yet provided by deezer.com';
	await pushoverApi.trySendNotification(`(${url.toString()}) ${text}`);
	throw new Error(text);
}

export default {
	searchPlaylists
};
