// Shared backend helpers: Telegram initData validation + Supabase REST client.
// Uses Node 18+ global fetch and built-in crypto. Vercel (req, res) style.

const crypto = require('crypto');

/* ----------------------------- Config ----------------------------- */
const CFG = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
  WEBAPP_URL: process.env.WEBAPP_URL,
  BOT_USERNAME: process.env.BOT_USERNAME || 'ElzunoBot',
  ADMIN_TELEGRAM_ID: process.env.ADMIN_TELEGRAM_ID,

  // Economy
  BASE_CLAIM: 100,
  REFERRAL_BONUS: 500,
  BONUS_AMOUNT: 50,
  CLAIM_COOLDOWN_MS: 24 * 60 * 60 * 1000,
  BONUS_COOLDOWN_MS: 3 * 60 * 60 * 1000,

  // Daily streak (7-day cycle; resets if a day is missed)
  STREAK_REWARDS: [100, 150, 200, 300, 500, 750, 1000],
  STREAK_RESET_MS: 48 * 60 * 60 * 1000,

  // NGN withdrawal
  POINTS_PER_NAIRA: 100,        // 100 points = ₦1
  MIN_WITHDRAWAL_NGN: 1000,

  MAX_AGE_SEC: 24 * 60 * 60,
};

/* --------------- Validate Telegram initData (HMAC-SHA256) ---------- */
function validateInitData(initData, botToken = CFG.BOT_TOKEN) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const userRaw = params.get('user');
  const authDate = params.get('auth_date');
  if (!hash || !userRaw || !authDate) return null;

  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(authDate, 10) > CFG.MAX_AGE_SEC) return null;

  const dcs = [...params.entries()]
    .filter(([k]) => k !== 'hash')
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
  if (calc !== hash) return null;

  try { return JSON.parse(userRaw); } catch { return null; }
}

/* --------------------- Supabase REST (PostgREST) ------------------ */
async function sb(method, table, { select = '*', filter, body, prefer } = {}) {
  const url = new URL(`${CFG.SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  if (filter) for (const [k, v] of Object.entries(filter)) url.searchParams.set(k, v);

  const headers = {
    apikey: CFG.SUPABASE_SERVICE_ROLE,
    Authorization: `Bearer ${CFG.SUPABASE_SERVICE_ROLE}`,
  };
  if (body) headers['Content-Type'] = 'application/json';
  if (prefer) headers['Prefer'] = prefer;

  const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return text; }
}

const getUser = (id) => sb('GET', 'users', { filter: { telegram_id: `eq.${id}` } });
const upsertUser = (u) => sb('POST', 'users', { body: u, prefer: 'return=representation,resolution=merge-duplicates' });
const updateUser = (id, patch) => sb('PATCH', 'users', { filter: { telegram_id: `eq.${id}` }, body: patch, prefer: 'return=representation' });

const getBank = (id) => sb('GET', 'bank_accounts', { filter: { telegram_id: `eq.${id}` } });
const upsertBank = (b) => sb('POST', 'bank_accounts', { body: b, prefer: 'return=representation,resolution=merge-duplicates' });

const createWithdrawal = (w) => sb('POST', 'withdrawals', { body: w, prefer: 'return=representation' });
const getWithdrawal = (id) => sb('GET', 'withdrawals', { filter: { id: `eq.${id}` } });
const userWithdrawals = (id) => sb('GET', 'withdrawals', { select: 'id,amount_ngn,points_spent,status,created_at,processed_at', filter: { telegram_id: `eq.${id}`, order: 'created_at.desc', limit: '20' } });
const pendingWithdrawals = () => sb('GET', 'withdrawals', { filter: { status: 'eq.pending', order: 'created_at.asc' } });
const setWithdrawalStatus = (id, status) => sb('PATCH', 'withdrawals', { filter: { id: `eq.${id}` }, body: { status, processed_at: new Date().toISOString() }, prefer: 'return=representation' });

const naira = (points) => points / CFG.POINTS_PER_NAIRA;

module.exports = {
  CFG, validateInitData, sb,
  getUser, upsertUser, updateUser,
  getBank, upsertBank,
  createWithdrawal, getWithdrawal, userWithdrawals, pendingWithdrawals, setWithdrawalStatus,
  naira,
};
