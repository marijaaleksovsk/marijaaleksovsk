# Vertical Video Experience (JW Player)

This repository contains a static demo of the JW Player Vertical Video orchestrator.

## What is included

- `index.html` — vertical-video experience setup using `@jwplayer/service-loader` and `@jwplayer/vertical-video`
- `render.yaml` — Render Blueprint for static deployment
- `.npmrc` — points `@jwplayer/*` packages to the internal Longtail registry

## Local setup

1. Provide an auth token for the internal registry:

   ```bash
   export NPM_TOKEN="YOUR_LONGTAIL_REGISTRY_TOKEN"
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build deployable static assets:

   ```bash
   npm run build
   ```

4. Serve locally:

   ```bash
   python3 -m http.server 4173 -d public
   ```

5. Open:

   ```text
   http://localhost:4173
   ```

## Deploy on Render

1. Push this repository to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select this GitHub repository/branch.
4. Add environment variable:
   - `NPM_TOKEN=<YOUR_LONGTAIL_REGISTRY_TOKEN>`
5. Deploy.

Render will create a static service named `vertical-video-experience` (from `render.yaml`).
Its URL will be:

```text
https://vertical-video-experience.onrender.com
```

If Render appends a suffix because the name is already taken, use the URL shown in the Render dashboard.
