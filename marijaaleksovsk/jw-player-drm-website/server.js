const express = require("express");
const path = require("path");
const { SignJWT } = require("jose");

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_JW_SITE_ID = "J9NOqzGU";
const DEFAULT_DRM_POLICY_ID = "VbI1n33Q";
const DEFAULT_PLAYLIST_ID = "jIFrRDZa";
const DEFAULT_JWT_TTL_SECONDS = 300;

const app = express();
function getRuntimeConfig() {
  return {
    jwSiteId: process.env.JW_SITE_ID || DEFAULT_JW_SITE_ID,
    jwDrmPolicyId: process.env.JW_DRM_POLICY_ID || DEFAULT_DRM_POLICY_ID,
    jwPlaylistId: process.env.JW_PLAYLIST_ID || DEFAULT_PLAYLIST_ID,
    jwApiSecret: process.env.JW_API_SECRET || "",
    jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS || DEFAULT_JWT_TTL_SECONDS)
  };
}

async function buildSignedPlaybackUrl(mediaId, cfg) {
  const requestPath = `/v2/sites/${cfg.jwSiteId}/media/${mediaId}/playback.json`;
  const exp = Math.ceil(Date.now() / 1000) + cfg.jwtTtlSeconds;
  const secret = new TextEncoder().encode(cfg.jwApiSecret);
  const token = await new SignJWT({
    drm_policy_id: cfg.jwDrmPolicyId,
    resource: requestPath
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .sign(secret);

  const signedPlaybackUrl =
    `https://cdn.jwplayer.com${requestPath}` +
    `?drm_policy_id=${encodeURIComponent(cfg.jwDrmPolicyId)}` +
    `&token=${encodeURIComponent(token)}`;

  return { signedPlaybackUrl, exp };
}

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

function sendPublicConfig(res) {
  const cfg = getRuntimeConfig();
  res.json({
    site_id: cfg.jwSiteId,
    drm_policy_id: cfg.jwDrmPolicyId,
    playlist_id: cfg.jwPlaylistId,
    playlist_url: `https://cdn.jwplayer.com/v2/playlists/${cfg.jwPlaylistId}`
  });
}

// Keep both routes for compatibility.
app.get("/api/public-config", (_req, res) => sendPublicConfig(res));
app.get("/api/player-config", (_req, res) => sendPublicConfig(res));

app.get("/api/drm-playback-url", async (req, res) => {
  const mediaId = req.query.media_id;
  if (!mediaId || typeof mediaId !== "string") {
    return res.status(400).json({
      error: "Missing required query parameter: media_id"
    });
  }

  if (!/^[A-Za-z0-9_-]+$/.test(mediaId)) {
    return res.status(400).json({
      error: "media_id contains invalid characters"
    });
  }

  const cfg = getRuntimeConfig();

  if (!cfg.jwApiSecret) {
    return res.status(500).json({
      error: "Server is missing JW_API_SECRET. Set env var in Render."
    });
  }

  try {
    const signed = await buildSignedPlaybackUrl(mediaId, cfg);
    return res.json({
      site_id: cfg.jwSiteId,
      drm_policy_id: cfg.jwDrmPolicyId,
      media_id: mediaId,
      signedPlaybackUrl: signed.signedPlaybackUrl,
      expires_at_unix: signed.exp
    });
  } catch (_err) {
    return res.status(500).json({
      error: "Failed to generate signed playback URL"
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
