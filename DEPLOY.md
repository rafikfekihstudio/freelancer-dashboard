# Deploy to Vercel — `dashboard.raficfekihstudio.com`

## Prerequisites

- A [Vercel](https://vercel.com) account (free — sign up with GitHub)
- A [Turso](https://turso.tech) account (free — sign up with GitHub)
- Your code pushed to a **GitHub** repository
- Access to Namecheap DNS for `raficfekihstudio.com`

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create a Turso database

Turso is a hosted SQLite database. It's free and your data persists permanently (unlike Vercel's temporary disk).

```bash
# Install the Turso CLI (one time)
curl -sSfL https://get.turso.tech | sh

# Log in
turso auth login

# Create a database
turso db create freelancer-dashboard

# Get the database URL
turso db show freelancer-dashboard --url
# → libsql://freelancer-dashboard-YOURNAME.turso.io

# Create an auth token
turso db tokens create freelancer-dashboard
# → copy this long token string
```

**Keep both values** — you'll need them for Vercel.

---

## Step 3 — Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Continue with GitHub"** and authorize
3. Select your repo
4. Vercel auto-detects Next.js — **do not change** the framework preset
5. Under **"Environment Variables"**, add these:

| Name | Value |
|------|-------|
| `AUTH_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — paste the output |
| `TURSO_DB_URL` | The `libsql://...turso.io` URL from Step 2 |
| `TURSO_DB_AUTH_TOKEN` | The token string from Step 2 |
| `SITE_NAME` | `Dashboard` (or whatever you want) |
| `SITE_DESCRIPTION` | `Freelance photo retouching dashboard` |
| `RESEND_API_KEY` | *(optional)* Your Resend API key for emails |
| `EMAIL_FROM` | *(optional)* e.g. `noreply@raficfekihstudio.com` |

6. Click **"Deploy"**

Wait ~2 minutes for the build. You'll get a URL like `your-app.vercel.app`.

---

## Step 4 — Push the database schema to Turso

After the first deploy, run this from your **local machine**:

```bash
# Windows PowerShell — set your Turso credentials
$env:TURSO_DB_URL="libsql://freelancer-dashboard-YOURNAME.turso.io"
$env:TURSO_DB_AUTH_TOKEN="your-token-here"

# Push the schema to Turso
npm run db:push

# (Optional) Seed demo data
npm run db:demo
```

Now your Turso database has the tables and (optionally) demo data.

---

## Step 5 — Add your domain on Vercel

1. In Vercel dashboard, go to your project → **"Domains"**
2. Type `dashboard.raficfekihstudio.com` and click **"Add"**
3. Vercel shows you the DNS records to set

**Keep this page open** — you'll need the target value.

---

## Step 6 — Update DNS at Namecheap

1. Log in to [Namecheap](https://ap.www.namecheap.com/)
2. **"Domain List"** → click **"Manage"** next to `raficfekihstudio.com`
3. Click **"Advanced DNS"**
4. Under **"Host Records"**, add:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| `CNAME` | `dashboard` | `cname.vercel-dns.com` | Automatic |

5. Click the **"✓"** (checkmark) to save

DNS propagation takes 5–30 minutes (usually <10 min for CNAME).

---

## Step 7 — Verify

1. Go back to Vercel Domains page
2. After propagation, the status changes to **"Valid"** with a green checkmark
3. Visit `https://dashboard.raficfekihstudio.com`
4. Log in with the demo credentials (if you seeded)

---

## Making changes after deploy

Any time you want to update:
1. Make changes locally in your code editor
2. Run `npm run build` to check for errors
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Describe your change"
   git push
   ```
4. Vercel auto-deploys (takes ~2 min)

If you changed the database schema, also run:
```bash
$env:TURSO_DB_URL="libsql://..."
$env:TURSO_DB_AUTH_TOKEN="..."
npm run db:push
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `AUTH_SECRET` missing on login | Add `AUTH_SECRET` to Vercel env vars and redeploy |
| `TURSO_*` env vars not set | Vercel → Project → Settings → Environment Variables — add them and redeploy |
| "Database does not exist" | Run `npm run db:push` locally with Turso credentials |
| Images not loading | Uploaded images are stored in `public/uploads/` — they get committed to Git |
| Build fails | Make sure the "Framework" is set to **Next.js** in Vercel project settings |
| DNS not propagating | Use `whatsmydns.net` to check — if stuck >1 hour, double-check CNAME value matches Vercel |
