# JW Player DRM Playlist Website

Simple website + backend service for DRM-protected JW playback.

On every page load, the browser calls a backend endpoint that generates a fresh JWT and returns a signed DRM playlist URL. The `JW_API_SECRET` remains server-side only.

## Fixed configuration

- `JW_SITE_ID=J9NOqzGU`
- `JW_DRM_POLICY_ID=VbI1n33Q`
- `JW_PLAYLIST_ID=jIFrRDZa`
- `PLAYER_LIBRARY_URL=https://cdn.jwplayer.com/libraries/mi9MJ9PC.js`

## Files

- `index.html` - simple player page
- `server.js` - backend bootstrap endpoint + JWT generation
- `package.json` - dependencies and start script
- `.env.example` - server environment template

## API endpoint

- `GET /api/bootstrap`
  - generates JWT using `JW_API_SECRET`
  - signs DRM playlist resource `/v2/playlists/jIFrRDZa/drm/VbI1n33Q`
  - returns `signed_drm_playlist_url` for `jwplayer().setup({ playlist: ... })`

## Page-load flow

1. User opens `/`
2. Frontend calls `GET /api/bootstrap`
3. Backend generates JWT for that request
4. Backend returns signed DRM playlist URL
5. Frontend initializes player with that URL

## Environment variables

- `PORT` (default: `3000`)
- `JW_API_SECRET` (**required**) - JW API property secret used for JWT signing
- `JWT_TTL_SECONDS` (optional, default: `300`)

## Secret storage guidance (JW authentication docs)

Do **not** put `JW_API_SECRET` in client-side code or in git (public or private).  
Store it only as a server-side secret in your host's environment settings.

Reference: https://docs.jwplayer.com/platform/reference/authentication

## Local run

```bash
npm install
JW_API_SECRET=your_real_secret npm start
```

Open: `http://localhost:3000`

## One-command dev script (Windows PowerShell)

1. Copy the example file:

```powershell
Copy-Item .env.local.example .env.local
```

2. Edit `.env.local` and set your secret:

```text
JW_API_SECRET=your_real_jw_v1_property_api_secret
```

3. Run one command:

```powershell
npm run dev:windows
```

This script loads `JW_API_SECRET` from `.env.local` and starts the server, so you do not need to manually set env vars each time.
