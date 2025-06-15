import fetch from 'node-fetch';

async function getOne(playlistId: string) {
	const url = new URL(`https://deezerdevs-deezer.p.rapidapi.com/playlist/${playlistId}`);
	const headers: HeadersInit = {
		'x-rapidapi-key': process.env.X_RAPIDAPI_KEY_DEEZER ?? '',
		'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
	};

	const response = await fetch(url.toString(), { headers });
	const data = await response.json();
	return data;
}

export default {
	getOne
};
