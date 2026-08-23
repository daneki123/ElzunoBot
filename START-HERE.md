# 🟢 Elzuno — Start Here (Super Simple)

Elzuno is a futuristic Telegram Mini App: a **daily streak** to keep users coming back, **referrals** to grow, and **NGN cash-out** to earn. Do one step at a time and tell me when each is done.

Think of it like opening a tiny shop:
- **Telegram bot** = the door 🚪 (your bot is **@ElzunoBot**)
- **Supabase** = the notebook that remembers points 📓
- **Vercel** = the building that puts Elzuno online 🏢

---

## STEP 1 — Your bot password (done already, just confirm)
Your bot is **@ElzunoBot**. If you haven't created it yet:
1. Telegram → **@BotFather** → `/newbot` → name `Elzuno` → username `ElzunoBot`
2. Copy the **token** it gives you. Keep it private.
3. (Optional) Set the bot's menu button + description in BotFather.

---

## STEP 2 — Make your points notebook (Supabase, ~5 min)
1. Go to **supabase.com** → sign up (free).
2. **New Project** → name it → DB password → Create.
3. Wait ~2 min.
4. **SQL Editor** → New query → paste everything in **`schema.sql`** → **Run**.
   This builds 3 tables: `users` (points + streak), `bank_accounts`, and `withdrawals`.
   ✅ *Safe to re-run* — it uses `IF NOT EXISTS` and adds the streak column if missing.
5. **Settings → API** → copy:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` secret key** → `SUPABASE_SERVICE_ROLE`

---

## STEP 3 — Put Elzuno on the internet (Vercel, ~5 min)
1. Download the **`daily-claim-bot`** folder (or the ZIP) to your computer.
2. Put it on **GitHub**: new repo `elzuno` → "uploading an existing file" → drag the whole folder in → Commit.
3. **vercel.com** → Sign Up → **Continue with GitHub** → Add New → Project → import `elzuno` → **Deploy**.
4. Copy the **URL** Vercel gives you (e.g. `https://elzuno.vercel.app`) → that's `WEBAPP_URL`.

---

## STEP 4 — Type in your 6 settings (Vercel → Settings → Environment Variables)

| NAME | VALUE |
|---|---|
| `BOT_TOKEN` | your BotFather token |
| `BOT_USERNAME` | `ElzunoBot` |
| `WEBAPP_URL` | your Vercel URL |
| `SUPABASE_URL` | your Supabase URL |
| `SUPABASE_SERVICE_ROLE` | your Supabase service_role key |
| `ADMIN_TELEGRAM_ID` | **your numeric Telegram ID** (message **@userinfobot** to get it) |

Then **Redeploy** so they take effect.

---

## STEP 5 — Connect the doorbell (run once in your browser)
Replace the two parts, then open this link:
```
https://api.telegram.org/bot<PASTE_TOKEN>/setWebhook?url=<PASTE_VERCEL_URL>/api/webhook
```
You should see: `{"ok":true,"description":"Webhook was set"...}`

---

## STEP 6 — Play it 🎉
1. Open **@ElzunoBot** → `/start`.
2. Tap **⚡ Open Elzuno** → the app opens.
3. Try the **Daily Streak** claim, **Earn** tab (referral link + watch ad), and **Cash** tab (save bank → withdraw).

👉 You (the admin) will also see the **⚙️ Admin** tab to approve/reject payouts.

---

💡 Do ONE step, then tell me "done" or paste any error. We'll go together. 🙂
