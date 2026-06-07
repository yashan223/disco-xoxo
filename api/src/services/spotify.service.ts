import axios from 'axios';
import qs from 'querystring';
import { env } from '../utils/env';
import { User } from '../models/User.model';
import { logger } from '../utils/logger';
import type { SpotifyTrack } from '../types/shared';

const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// ─── Client Credentials Token (for search, no user auth) ─────────────────────
let clientCredentialsToken: string | null = null;
let clientCredentialsExpiry = 0;

async function getClientCredentialsToken(): Promise<string> {
  if (clientCredentialsToken && Date.now() < clientCredentialsExpiry) {
    return clientCredentialsToken;
  }
  const credentials = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');
  const response = await axios.post(
    `${SPOTIFY_ACCOUNTS_URL}/api/token`,
    qs.stringify({ grant_type: 'client_credentials' }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  clientCredentialsToken = response.data.access_token;
  clientCredentialsExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  return clientCredentialsToken!;
}

// ─── Refresh User Token ───────────────────────────────────────────────────────
async function refreshUserToken(userId: string): Promise<string> {
  const user = await User.findById(userId);
  if (!user?.spotifyRefreshToken) throw new Error('No refresh token');

  const credentials = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    `${SPOTIFY_ACCOUNTS_URL}/api/token`,
    qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: user.spotifyRefreshToken,
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  user.spotifyAccessToken = response.data.access_token;
  user.spotifyTokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
  if (response.data.refresh_token) {
    user.spotifyRefreshToken = response.data.refresh_token;
  }
  await user.save();
  return user.spotifyAccessToken!;
}

// ─── Get valid access token for a user ───────────────────────────────────────
async function getUserToken(userId: string): Promise<string> {
  const user = await User.findById(userId);
  if (!user?.spotifyAccessToken) throw new Error('Spotify not linked');
  if (user.spotifyTokenExpiry && user.spotifyTokenExpiry < new Date()) {
    return refreshUserToken(userId);
  }
  return user.spotifyAccessToken;
}

// ─── Map raw Spotify track to our SpotifyTrack type ──────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTrack(raw: any): SpotifyTrack {
  return {
    spotifyId: raw.id,
    title: raw.name,
    artist: raw.artists?.[0]?.name ?? 'Unknown',
    artists: raw.artists?.map((a: { name: string }) => a.name) ?? [],
    album: raw.album?.name ?? '',
    albumArt: raw.album?.images?.[0]?.url ?? '',
    duration: raw.duration_ms,
    uri: raw.uri,
    previewUrl: raw.preview_url,
    explicit: raw.explicit ?? false,
    popularity: raw.popularity ?? 0,
  };
}

// ─── Spotify Service ──────────────────────────────────────────────────────────
export const spotifyService = {
  // OAuth URL for user auth
  getAuthUrl(state: string): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-library-read',
      'user-library-modify',
      'user-top-read',
    ].join(' ');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.SPOTIFY_CLIENT_ID,
      scope: scopes,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
      state,
    });
    return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
  },

  // Exchange code for tokens
  async exchangeCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const credentials = Buffer.from(
      `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');
    const response = await axios.post(
      `${SPOTIFY_ACCOUNTS_URL}/api/token`,
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.SPOTIFY_REDIRECT_URI,
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  },

  // Get Spotify user profile
  async getSpotifyProfile(accessToken: string): Promise<{
    id: string;
    display_name: string;
    email: string;
    product: string;
    images: Array<{ url: string }>;
  }> {
    const response = await axios.get(`${SPOTIFY_API_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  },

  // Search Spotify
  async search(
    query: string,
    types: ('track' | 'album' | 'playlist' | 'artist')[],
    limit = 20
  ) {
    const token = await getClientCredentialsToken();
    const response = await axios.get(`${SPOTIFY_API_URL}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, type: types.join(','), limit },
    });
    return response.data;
  },

  // Get track by ID or URI
  async getTrack(trackId: string): Promise<SpotifyTrack> {
    const token = await getClientCredentialsToken();
    const id = trackId.replace('spotify:track:', '');
    const response = await axios.get(`${SPOTIFY_API_URL}/tracks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return mapTrack(response.data);
  },

  // Get album tracks
  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    const token = await getClientCredentialsToken();
    const id = albumId.replace('spotify:album:', '');
    const [albumRes, tracksRes] = await Promise.all([
      axios.get(`${SPOTIFY_API_URL}/albums/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${SPOTIFY_API_URL}/albums/${id}/tracks`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 },
      }),
    ]);
    const album = albumRes.data;
    return tracksRes.data.items.map((track: Record<string, unknown>) =>
      mapTrack({ ...track, album })
    );
  },

  // Get playlist tracks
  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    const token = await getClientCredentialsToken();
    const id = playlistId.replace('spotify:playlist:', '');
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await axios.get(
        `${SPOTIFY_API_URL}/playlists/${id}/tracks`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit, offset, fields: 'items(track),next' },
        }
      );
      const items = response.data.items;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items.forEach((item: any) => {
        if (item.track && item.track.id) tracks.push(mapTrack(item.track));
      });
      if (!response.data.next) break;
      offset += limit;
    }
    return tracks;
  },

  // Get user's playlists
  async getUserPlaylists(userId: string) {
    const token = await getUserToken(userId);
    const response = await axios.get(`${SPOTIFY_API_URL}/me/playlists`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 50 },
    });
    return response.data.items;
  },

  // Get user's liked songs
  async getUserLikedSongs(userId: string, limit = 50, offset = 0) {
    const token = await getUserToken(userId);
    const response = await axios.get(`${SPOTIFY_API_URL}/me/tracks`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit, offset },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.items.map((item: any) => mapTrack(item.track));
  },

  // Get user's saved albums
  async getUserSavedAlbums(userId: string) {
    const token = await getUserToken(userId);
    const response = await axios.get(`${SPOTIFY_API_URL}/me/albums`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 50 },
    });
    return response.data.items;
  },

  // Resolve a Spotify URL to track(s)
  async resolveSpotifyUrl(url: string): Promise<{
    type: 'track' | 'album' | 'playlist';
    tracks: SpotifyTrack[];
    name?: string;
  }> {
    // Parse Spotify URL or URI
    let type: 'track' | 'album' | 'playlist' = 'track';
    let id = '';

    // Handle spotify:track:ID, spotify:album:ID, spotify:playlist:ID
    const uriMatch = url.match(/^spotify:(track|album|playlist):([a-zA-Z0-9]+)$/);
    // Handle https://open.spotify.com/track/ID, etc.
    const urlMatch = url.match(
      /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/
    );

    const match = uriMatch || urlMatch;
    if (!match) throw new Error('INVALID_SPOTIFY_URL');

    type = match[1] as typeof type;
    id = match[2];

    if (type === 'track') {
      const track = await this.getTrack(id);
      return { type, tracks: [track], name: track.title };
    } else if (type === 'album') {
      const tracks = await this.getAlbumTracks(id);
      const token = await getClientCredentialsToken();
      const albumRes = await axios.get(`${SPOTIFY_API_URL}/albums/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { type, tracks, name: albumRes.data.name };
    } else {
      const tracks = await this.getPlaylistTracks(id);
      const token = await getClientCredentialsToken();
      const plRes = await axios.get(`${SPOTIFY_API_URL}/playlists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { fields: 'name' },
      });
      return { type, tracks, name: plRes.data.name };
    }
  },

  // Validate that a string is a Spotify URL/URI — reject everything else
  isValidSpotifyUrl(input: string): boolean {
    return (
      /^spotify:(track|album|playlist|artist):([a-zA-Z0-9]+)$/.test(input) ||
      /open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/.test(input)
    );
  },

  refreshUserToken,
  getUserToken,
};
