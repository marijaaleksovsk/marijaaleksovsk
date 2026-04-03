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

1. Frontend calls `GET /api/drm-playback-url?media_id=<MEDIA_ID>`
2. Backend generates a JWT for:
   - site ID: `J9NOqzGU`
   - DRM policy ID: `VbI1n33Q`
3. Backend returns signed playback URL
4. Player loads the signed URL and receives DRM policy for playback

## API response shape

`GET /api/drm-playback-url?media_id=<MEDIA_ID>`

```json
{
  "playbackUrl": "https://cdn.jwplayer.com/v2/sites/J9NOqzGU/media/<MEDIA_ID>/playback.json?drm_policy_id=VbI1n33Q&token=<JWT>"
}
```
