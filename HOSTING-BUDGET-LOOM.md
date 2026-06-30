# Budget Loom hosting guide

## What changed

- App branding was renamed from BudgetFlow AI to **Budget Loom**.
- Common hosting rewrite files were added: `netlify.toml` and `vercel.json`. These help stop browser-refresh/sign-in redirects like `/app` from becoming a hosting-provider 404 on static-style deployments.
- The safest production route after sign-in is still `/app`; your host must be configured to serve the app for deep links.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build locally

```bash
npm run build
npm run preview
```

## Recommended hosting

This project is a TanStack Start app. Use a host that supports the build output, such as Vercel, Netlify, Cloudflare Pages/Workers, or Lovable publish.

### Vercel

1. Push the project to GitHub.
2. Import the repo in Vercel.
3. Build command: `npm run build`.
4. Add your environment variables from `.env` in Vercel Project Settings → Environment Variables.
5. Deploy.

### Netlify

1. Push the project to GitHub.
2. Import the repo in Netlify.
3. Build command: `npm run build`.
4. Publish directory: `.output/public`.
5. Add environment variables from `.env`.
6. Deploy.

## Fixing the 404 after sign-in

The 404 normally happens because authentication redirects the browser to `/app`, but the host does not know how to serve that route directly. The included `netlify.toml` and `vercel.json` add fallback routing.

Also update Supabase authentication URLs:

1. Supabase Dashboard → Authentication → URL Configuration.
2. Site URL: your production URL, for example `https://budget-loom.vercel.app`.
3. Redirect URLs: add these:
   - `https://your-domain.com/auth`
   - `https://your-domain.com/app`
   - `http://localhost:5173/auth`
   - `http://localhost:5173/app`

For Google OAuth, also update Google Cloud Console OAuth redirect URLs to match your deployed domain.
