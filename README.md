# ⚡ Elzuno — Telegram Mini App

A futuristic Telegram earning app: **daily streak rewards**, **referral growth**, **rewarded ads**, and **NGN cash-out** — built on a 100% free stack.

![stack](https://img.shields.io/badge/stack-Telegram%20%E2%9C%93%20Vercel%20%E2%9C%93%20Supabase%20%E2%9C%93-229ED9)

## ✨ Features
- 🔥 **Daily streak** — 7-day cycle with rising rewards (+100 → +1000); resets if a day is missed.
- 👥 **Referrals** — invite link `t.me/ElzunoBot?start=ref<id>`; referrer earns +500 when a friend first claims.
- 🎁 **Rewarded ads** — watch an ad for bonus points (AdsGram integration point).
- 🏦 **NGN withdrawal** — users save bank details and cash out points to Naira.
- ⚙️ **Admin payouts** — you approve/reject withdrawals (reject auto-refunds points). Only visible to the owner.
- 🏆 **Leaderboard**, 🪙 futuristic neon/glass UI, secure initData auth.

## 🧱 Stack (all free)
| Piece | Service |
|---|---|
| Mini App (frontend) | Vercel (static) |
| Bot + API (backend) | Vercel serverless functions (webhook, no always-on server) |
| Database | Supabase free tier (Postgres) |
| Telegram | free |
| Ads | AdsGram (free — pays you in TON) |

## 📁 Structure
```
public/        # the Mini App (index.html, app.js, style.css) — futuristic neon UI
api/           # serverless backend
  _lib.js      #   config, initData auth, Supabase helpers
  webhook.js   #   Telegram bot (@ElzunoBot) — /start + referral deep-links
  balance.js   #   user state (balance, streak, naira, bank flag, admin)
  claim.js     #   daily STREAK claim
  bonus.js     #   rewarded-ad bonus
  bank.js      #   save/fetch bank details
  withdraw.js  #   request withdrawal (points → NGN)
  withdrawals.js #  withdrawal history
  admin.js     #   list pending + approve/reject (owner only)
  leaderboard.js # top 10
schema.sql     # Supabase tables (users, bank_accounts, withdrawals)
test/          # auth self-test (npm test)
```

## 🚀 Deploy
See **`START-HERE.md`** for the simple step-by-step. Quick version:
1. `@BotFather` → create **@ElzunoBot** → copy token.
2. Supabase → run `schema.sql` → copy URL + service_role key.
3. Push to GitHub → import on Vercel → Deploy → copy your URL.
4. Add env vars in Vercel, then Redeploy:

   `BOT_TOKEN` · `BOT_USERNAME` (= `ElzunoBot`) · `WEBAPP_URL` · `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE` · `ADMIN_TELEGRAM_ID`

5. Set the webhook once:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL>/api/webhook
   ```

## ⚙️ Economy (in `api/_lib.js`)
- `STREAK_REWARDS: [100,150,200,300,500,750,1000]` — daily streak payouts
- `STREAK_RESET_MS: 48h` — grace window before streak resets
- `REFERRAL_BONUS: 500`, `BONUS_AMOUNT: 50`
- `POINTS_PER_NAIRA: 100` (100 pts = ₦1), `MIN_WITHDRAWAL_NGIN: 1000`

> 💡 **Payouts are manual to start** (free, no paperwork): requests appear in your Admin tab; you transfer via your bank app and tap "Mark Paid". Automate later with Flutterwave/Paystack once you're a registered business.

## 🛡️ Security
All writes go through the backend with Telegram `initData` HMAC validation — the frontend has no database keys, and balances can't be faked. `npm test` verifies the auth logic.

## 🎨 Design
Futuristic neon/glass theme (animated aurora, grid + grain textures, glowing coin orb). The whole palette lives in `:root` at the top of `public/style.css` — change 4 lines to re-theme.
