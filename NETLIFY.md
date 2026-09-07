# Netlify Deployment

This app is fully static. No backend, no Functions — just a Vite build served from Netlify's CDN. All agent orchestration runs in the browser, all state lives in `localStorage`, and Gemini is called directly from the client.

## Deploy

1. Push this repo to GitHub/GitLab.
2. In Netlify: **Add new site → Import from Git**, pick the repo.
3. Netlify auto-detects `netlify.toml` (build command `npm run build`, publish dir `dist`).
4. Add the environment variables listed below.
5. Deploy.

CLI-based deploys:

```bash
npm install
npx netlify deploy --build       # preview
npx netlify deploy --build --prod # production
```

## Environment variables

Set these in **Site settings → Environment variables** on Netlify (or in a local `.env` for development):

| Variable | Purpose | Required |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Yes (or paste one in-app) |
| `VITE_MEM0_MCP_URL` | HTTP endpoint of a Mem0 MCP server, used when Real MCP mode is enabled | No |

## Security — READ THIS BEFORE MAKING THE SITE PUBLIC

Vite inlines every `VITE_`-prefixed variable into the built JavaScript. On a public deploy, **anyone who opens DevTools can read your `VITE_GEMINI_API_KEY` and spend your Gemini quota**. There is no way to hide it in a static build. Your options, in order of increasing safety:

- **Private/temporary demo.** Ship with the key, rotate it in Google AI Studio when you're done.
- **BYOK (bring your own key).** Leave `VITE_GEMINI_API_KEY` empty on Netlify and let each user paste their own key into the UI. It's saved only to that user's `localStorage`.
- **Add a proxy.** Restore a small Netlify Function whose only job is to forward Gemini calls with a server-side key, and change `src/services/gemini.ts` to call that endpoint instead of the SDK. This is the standard fix if you want a public site with your own key.

## What lives where

- Prompt files under `souls/` are imported into the client bundle via Vite's `?raw` loader (`src/services/souls.ts`).
- Mem0 memories → `localStorage['adk_mem0_memories']`.
- SKILL.md content → `localStorage['adk_skill_<agent>']`, metadata → `localStorage['adk_skills_meta']`.
- Run history (last 25) → `localStorage['adk_run_history']`.
- User-provided Gemini key → `localStorage['adk_gemini_api_key']`.

State is per-browser. Clearing site data resets the app to cold start.

## Real Mem0 MCP mode + CORS

The UI can point Mem0 at a real MCP server (`VITE_MEM0_MCP_URL`, or set from the config modal). The browser calls that endpoint directly, so the MCP server must allow CORS from your Netlify origin. If you can't add CORS headers to the MCP server, tunnel it through a Netlify Function or keep Real MCP mode disabled.

## Local dev

```bash
npm install
cp .env.example .env
# fill in VITE_GEMINI_API_KEY
npm run dev
```

Vite serves the app on `http://localhost:5173`.
