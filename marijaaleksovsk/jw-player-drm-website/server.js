const express = require("express");
const path = require("path");
const { SignJWT } = require("jose");

const PORT = Number(process.env.PORT || 3000);
const JWT_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 300);

// Fixed values requested by user.
const JW_SITE_ID = "J9NOqzGU";
const JW_DRM_POLICY_ID = "VbI1n33Q";
const JW_PLAYLIST_ID = "jIFrRDZa";
const PLAYER_LIBRARY_URL = "https://cdn.jwplayer.com/libraries/mi9MJ9PC.js";

const app = express();

function getApiSecret() {
  return process.env.JW_API_SECRET || "";
}

async function buildSignedPlaylistUrl(apiSecret) {
  const requestPath = `/v2/playlists/${JW_PLAYLIST_ID}/drm/${JW_DRM_POLICY_ID}`;
  const exp = Math.ceil(Date.now() / 1000) + JWT_TTL_SECONDS;
  const secret = new TextEncoder().encode(apiSecret);

  const token = await new SignJWT({ resource: requestPath })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .sign(secret);

  const signedPlaylistUrl =
    `https://cdn.jwplayer.com${requestPath}` +
    `?token=${encodeURIComponent(token)}`;

  return { signedPlaylistUrl, exp };
}

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

// Called by frontend on EVERY page load for each user session.
app.get("/api/bootstrap", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const jwApiSecret = getApiSecret();

  if (!jwApiSecret) {
    return res.status(500).json({
      error: "JW_API_SECRET is missing. Store it as a server-side environment variable."
    });
  }

  try {
    const generatedAtUnix = Math.ceil(Date.now() / 1000);
    const { signedPlaylistUrl, exp } = await buildSignedPlaylistUrl(jwApiSecret);

    return res.json({
      site_id: JW_SITE_ID,
      drm_policy_id: JW_DRM_POLICY_ID,
      playlist_id: JW_PLAYLIST_ID,
      player_library_url: PLAYER_LIBRARY_URL,
      generated_at_unix: generatedAtUnix,
      expires_at_unix: exp,
      signed_drm_playlist_url: signedPlaylistUrl
    });
  } catch (error) {
    return res.status(502).json({
      error: "Failed to generate DRM bootstrap payload",
      detail: error.message
    });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});
