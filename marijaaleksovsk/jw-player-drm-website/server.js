const express = require("express");
const path = require("path");
const { SignJWT } = require("jose");

const PORT = Number(process.env.PORT || 3000);
const JW_SITE_ID = process.env.JW_SITE_ID || "J9NOqzGU";
const JW_DRM_POLICY_ID = process.env.JW_DRM_POLICY_ID || "VbI1n33Q";
const JW_API_SECRET = process.env.JW_API_SECRET || "";
const JWT_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 300);

const app = express();
const secret = new TextEncoder().encode(JW_API_SECRET);

async function buildSignedPlaybackUrl(mediaId) {
  const requestPath = `/v2/sites/${JW_SITE_ID}/media/${mediaId}/playback.json`;
  const exp = Math.ceil(Date.now() / 1000) + JWT_TTL_SECONDS;
  const token = await new SignJWT({
    drm_policy_id: JW_DRM_POLICY_ID,
    resource: requestPath
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .sign(secret);

  const signedPlaybackUrl =
    `https://cdn.jwplayer.com${requestPath}` +
    `?drm_policy_id=${encodeURIComponent(JW_DRM_POLICY_ID)}` +
    `&token=${encodeURIComponent(token)}`;

  return { signedPlaybackUrl, exp };
}

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/drm-playback-url", async (req, res) => {
  const mediaId = req.query.media_id;
  if (!mediaId || typeof mediaId !== "string") {
    return res.status(400).json({
      error: "Missing required query parameter: media_id"
    });
  }

  if (!JW_API_SECRET) {
    return res.status(500).json({
      error: "Server is missing JW_API_SECRET. Set env var in Render."
    });
  }

  try {
    const signed = await buildSignedPlaybackUrl(mediaId);
    return res.json({
      site_id: JW_SITE_ID,
      drm_policy_id: JW_DRM_POLICY_ID,
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
