# JW Player DRM Website (Render-ready)

This project serves a JW Player page and a backend endpoint that generates a signed JWT per request for DRM playback.

## Files

- `index.html` - JW Player frontend
- `server.js` - Express server + JWT signing endpoint
- `package.json` - Node dependencies/scripts
- `.env.example` - required environment variables

## Environment variables

Set these in Render:

- `PORT` (Render sets this automatically)
- `JW_API_SECRET` - V1 API property secret for your DRM-enabled JWX property
- `JW_SITE_ID` - optional, defaults to `J9NOqzGU`
- `JW_DRM_POLICY_ID` - optional, defaults to `VbI1n33Q`
- `JWT_TTL_SECONDS` - optional, defaults to `300`

## Run locally

```bash
npm install
npm start
```

Server starts on `http://localhost:3000` by default.

## Working playback URL format

After deploying on Render, use:

```text
https://<your-render-service>.onrender.com/?media_id=<MEDIA_ID>
```

When this page loads:

1. Frontend calls `GET /api/player-config` to fetch public player config.
2. If `media_id` is present, frontend calls `GET /api/drm-playback-url?media_id=<MEDIA_ID>`.
3. Backend generates a JWT for:
   - site ID: `J9NOqzGU`
   - DRM policy ID: `VbI1n33Q`
4. Backend returns signed playback URL
5. Player loads the signed URL and receives DRM policy for playback

## API response shape

`GET /api/drm-playback-url?media_id=<MEDIA_ID>`

```json
{
  "site_id": "J9NOqzGU",
  "drm_policy_id": "VbI1n33Q",
  "media_id": "<MEDIA_ID>",
  "signedPlaybackUrl": "https://cdn.jwplayer.com/v2/sites/J9NOqzGU/media/<MEDIA_ID>/playback.json?drm_policy_id=VbI1n33Q&token=<JWT>",
  "expires_at_unix": 1710000000
}
```
