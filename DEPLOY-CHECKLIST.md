# 🚀 Daily-Claim Bot — Free Deployment Checklist

Follow these steps top to bottom. Every step is **free**. Tick them off as you go.

---

## STEP 1 — Create the Telegram bot (free, ~2 min)

- [ ] Open Telegram → search **@BotFather** → tap **Start**
- [ ] Send `/newbot`
- [ ] Type a name (e.g. `Daily Coins`)
- [ ] Type a username ending in `bot` (e.g. `dailycoins_bot`) — must be unique
- [ ] **Copy the token** BotFather gives you (looks like `7831...:AAH...`) → save it as **`BOT_TOKEN`**
- [ ] Note your bot username (without `@`) → save as **`BOT_USERNAME`**

---

## STEP 2 — Create the free database (Supabase, ~5 min)

- [ ] Go to **supabase.com** → Sign up (free, no card)
- [ ] **New Project** → name it → set a DB password → pick a region → Create
- [ ] Wait ~2 min for it to provision
- [ ] Go to **Project Settings → API** and copy:
  - **Project URL** → save as **`SUPABASE_URL`** (e.g. `https://abcd.supabase.co`)
  - **`service_role` secret key** → save as **`SUPABASE_SERVICE_ROLE`** (⚠️ the secret one, not the anon one)
- [ ] Go to **SQL Editor** → New query → paste the contents of `schema.sql` → **Run**
- [ ] Verify: open **Table Editor** → you should see a `users` table

---

## STEP 3 — Get the code onto your computer

- [ ] Download the whole **`daily-claim-bot`** folder from this workspace to your computer
- [ ] Keep the folder structure as-is (`api/`, `public/`, etc.)
  - (If you can't download a folder, recreate it: make an `api/` and `public/` folder and copy each file into the right one.)

---

## STEP 4 — Deploy free on Vercel (~5 min)

**Option A — Vercel CLI (fastest, no GitHub needed):**
- [ ] Install Node from **nodejs.org** (if not installed)
- [ ] Open a terminal **inside** the `daily-claim-bot` folder
- [ ] Run:  `npx vercel`
- [ ] Log in → accept the defaults (link to new project) → it builds and gives you a **URL**

**Option B — via GitHub:**
- [ ] Create a new GitHub repo → upload all the files (keeping folders)
- [ ] Go to **vercel.com** → sign up with GitHub → **Add New → Project** → import the repo → Deploy

→ Copy the production **URL** Vercel gives you (e.g. `https://daily-claim-xxx.vercel.app`) → save as **`WEBAPP_URL`**

---

## STEP 5 — Add your environment variables (required!)

- [ ] In Vercel: your project → **Settings → Environment Variables**
- [ ] Add these 5 (values from your notes / `.env.example`):

| Variable | Value |
|---|---|
| `BOT_TOKEN` | your BotFather token |
| `BOT_USERNAME` | bot username without `@` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE` | your Supabase service_role key |
| `WEBAPP_URL` | your Vercel URL from Step 4 |

- [ ] **Redeploy** so the new variables take effect: Deployments → ⋯ → **Redeploy**

---

## STEP 6 — Connect the bot to your app (run once)

Register the webhook by opening this URL in your browser (replace the two values):

```
https://api.telegram.org/bot<PASTE_BOT_TOKEN>/setWebhook?url=<PASTE_WEBAPP_URL>/api/webhook
```

- [ ] You should see:  `{"ok":true,"description":"Webhook was set",...}`

---

## STEP 7 — Test it 🎉

- [ ] In Telegram, open your bot → send `/start`
- [ ] You get a welcome message + an **🪙 Open & Claim** button
- [ ] Tap the button → the Mini App opens
- [ ] Tap **Claim** → balance goes to 100 → countdown starts
- [ ] Tap **Copy** on your referral link → it copies
- [ ] Leaderboard shows your name at #1

**Test the referral loop (this is your growth engine):**
- [ ] Open your referral link from a **second** Telegram account
- [ ] That account claims → your first account should gain **+500** bonus points

---

## STEP 8 — Turn on real ads (optional, when ready to earn)

- [ ] Sign up at **adsgram.ai** (free) → add your Mini App → copy your **block ID**
- [ ] Open `public/app.js` → replace `YOUR_ADSGRAM_BLOCK_ID` with your real block ID
- [ ] Redeploy on Vercel
- [ ] Now the **"Watch ad for +50"** button shows real rewarded ads (and earns you TON)

---

## STEP 9 — Get your first users (free)

- [ ] Share your referral link in 5–10 relevant Telegram groups
- [ ] Post it to your WhatsApp status daily for a week
- [ ] Make one 15-second TikTok/Reel showing the claim + invite flow
- [ ] DM 20–30 friends personally and ask them to try + share

---

## 🛠️ If something breaks

| Problem | Fix |
|---|---|
| Mini App shows "Open inside Telegram to play" | You opened it in a browser. Always test inside the Telegram app. |
| "unauthorized" error | `BOT_TOKEN` in Vercel doesn't match the bot, OR `WEBAPP_URL` is wrong/missing → fix env vars and redeploy. |
| Bot doesn't reply to `/start` | Webhook not set, or `WEBAPP_URL`/`BOT_TOKEN` wrong. Re-run Step 6. Check Vercel function logs. |
| Database error / 500 | `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE` wrong, or you didn't run `schema.sql`. |
| Supabase "paused" | Free projects sleep after 7 days idle — just open the app once to wake it. |

---

✅ Done with Steps 1–7? You have a **live, free, monetizable Telegram bot**. Steps 8–9 turn it into income.
