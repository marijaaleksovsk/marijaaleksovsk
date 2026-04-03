const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const JWT_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 300);

// Fixed values requested by user.
const JW_SITE_ID = "J9NOqzGU";
const JW_DRM_POLICY_ID = "VbI1n33Q";
const JW_PLAYLIST_ID = "jIFrRDZa";
const PLAYER_LIBRARY_URL = "https://cdn.jwplayer.com/libraries/mi9MJ9PC.js";

function getApiSecret() {
  return process.env.JW_API_SECRET || "";
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwtHs256(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${signature}`;
}

function buildSignedPlaylistUrl(apiSecret) {
  const requestPath = `/v2/playlists/${JW_PLAYLIST_ID}/drm/${JW_DRM_POLICY_ID}`;
  const exp = Math.ceil(Date.now() / 1000) + JWT_TTL_SECONDS;
  const token = signJwtHs256({ resource: requestPath, exp }, apiSecret);

  const signedPlaylistUrl =
    `https://cdn.jwplayer.com${requestPath}` +
    `?token=${encodeURIComponent(token)}`;

  return { signedPlaylistUrl, exp };
}

function sendJson(res, statusCode, payload, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function serveIndex(res) {
  const indexPath = path.join(__dirname, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

async function handleRequest(req, res) {
  const parsed = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && parsed.pathname === "/healthz") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && parsed.pathname === "/api/bootstrap") {
    // Called by frontend on EVERY page load for each user session.
    const noStoreHeaders = { "Cache-Control": "no-store" };
  const jwApiSecret = getApiSecret();

  if (!jwApiSecret) {
      return sendJson(
        res,
        500,
        {
      error: "JW_API_SECRET is missing. Store it as a server-side environment variable."
        },
        noStoreHeaders
      );
  }

  try {
    const generatedAtUnix = Math.ceil(Date.now() / 1000);
      const { signedPlaylistUrl, exp } = buildSignedPlaylistUrl(jwApiSecret);

      return sendJson(
        res,
        200,
        {
      site_id: JW_SITE_ID,
      drm_policy_id: JW_DRM_POLICY_ID,
      playlist_id: JW_PLAYLIST_ID,
      player_library_url: PLAYER_LIBRARY_URL,
      generated_at_unix: generatedAtUnix,
      expires_at_unix: exp,
      signed_drm_playlist_url: signedPlaylistUrl
        },
        noStoreHeaders
      );
  } catch (error) {
      return sendJson(
        res,
        502,
        {
      error: "Failed to generate DRM bootstrap payload",
      detail: error.message
        },
        noStoreHeaders
      );
    }
  }

  if (req.method === "GET" && parsed.pathname === "/") {
    return serveIndex(res);
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Not found" }));
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    sendJson(res, 500, { error: "Unhandled server error", detail: error.message });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});
