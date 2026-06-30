# Budget Loom — Vercel Hosting Guide

This project is a TanStack Start app, so Vercel is a better target than Netlify for this build.

## 1. Push this folder to GitHub

```bash
git add .
git commit -m "Prepare Budget Loom for Vercel"
git push origin main
```

If Git says nothing to commit, continue to Vercel.

## 2. Import on Vercel

1. Go to https://vercel.com
2. Click **Add New Project**
3. Import `yohbee/Budget-Loom.ke`
4. Framework preset: **Other** if Vercel does not detect it automatically
5. Build command: `npm run build`
6. Install command: `npm install`
7. Do not set an output directory manually
8. Click **Deploy**

## 3. Add environment variables

In Vercel, open your project:

**Settings → Environment Variables**

Add the same variables from your local `.env`, especially the Supabase public URL and anon key.

Common names are:

```text
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the exact variable names from your `.env` file.

## 4. Fix Supabase auth redirect

After Vercel gives you a live URL, go to Supabase:

**Authentication → URL Configuration**

Set:

```text
Site URL: https://your-vercel-domain.vercel.app
```

Add redirect URLs:

```text
https://your-vercel-domain.vercel.app/auth
https://your-vercel-domain.vercel.app/app
http://localhost:5173/auth
http://localhost:5173/app
```

For custom domain later, also add:

```text
https://budgetloom.ke/auth
https://budgetloom.ke/app
```

## 5. Redeploy

After environment variables are added, go to:

**Vercel → Deployments → Redeploy**

Then test signup/login again.
