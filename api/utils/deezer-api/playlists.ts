import fetch from 'node-fetch';
import { IDetailedOption } from '$utils/option';
import * as process from 'node:process';
import { isNotNull, propertyIsNotNull } from '$utils/spotify-api/playlists';

async function getAllTracks(playlistId: string): Promise<IDetailedOption[]> {
	const url = `https://deezerdevs-deezer.p.rapidapi.com/playlist/${playlistId}`;
	const options = {
		method: 'GET',
		headers: {
			'x-rapidapi-key': process.env.X_RAPIDAPI_KEY_DEEZER ?? '',
			'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
		}
	};

	const response = await fetch(url, options);
	const result: any = await response.json();

	const tracks = result?.tracks?.data
		?.filter(isNotNull)
		.filter(propertyIsNotNull('preview'))
		.filter((t) => t.type === 'track')
		.map((i) => mapTrackToDetailedOption(i));

	return tracks;
}

function mapTrackToDetailedOption(track): IDetailedOption {
	const artists = [{ id: track.artist.id, name: track.artist.name }];
	const formattedArtists = artists.map((a) => a.name).join(', ');

	return {
		artists: {
			list: artists,
			formatted: formattedArtists
		},
		formatted: `${formattedArtists} - ${track.title}`,
		id: track.id,
		imgSrc: track.album.cover_xl,
		name: track.title,
		year: new Date(track.time_add * 1000).getFullYear(),
		previewUrl: track.preview
	};
}

async function getOne(playlistId: string) {
	const url = `https://deezerdevs-deezer.p.rapidapi.com/playlist/${playlistId}`;
	const options = {
		method: 'GET',
		headers: {
			'x-rapidapi-key': process.env.X_RAPIDAPI_KEY_DEEZER ?? '',
			'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
		}
	};

	const response = await fetch(url, options);
	const result: any = await response.json();
	return result;
}

export default {
	getAllTracks,
	getOne
};
