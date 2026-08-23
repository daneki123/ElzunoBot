// GET/POST user balance + state. Creates the user if missing.
const { validateInitData, getUser, upsertUser, getBank, CFG, json, readBody, naira } = require('./_lib');

module.exports = async (event) => {
  const raw = await readBody(event);
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch {}

  const user = validateInitData(payload.initData || event.queryStringParameters?.initData);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);

  let rows = await getUser(user.id);
  if (!rows || !rows.length) {
    await upsertUser({ telegram_id: user.id, username: user.username || null, first_name: user.first_name || null });
    rows = await getUser(user.id);
  }
  const u = rows[0];
  const bank = await getBank(user.id);

  const now = Date.now();
  const last = u.last_claim ? new Date(u.last_claim).getTime() : 0;
  const canClaim = !last || now - last >= CFG.CLAIM_COOLDOWN_MS;

  const storedStreak = u.streak_day || 0;
  let todayDay;
  if (!last) todayDay = 1;
  else if (!canClaim) todayDay = storedStreak;
  else if (now - last < CFG.STREAK_RESET_MS) todayDay = (storedStreak % CFG.STREAK_REWARDS.length) + 1;
  else todayDay = 1;

  return json({
    ok: true,
    user: { id: u.telegram_id, first_name: u.first_name, username: u.username },
    balance: u.balance || 0,
    naira: naira(u.balance || 0),
    points_per_naira: CFG.POINTS_PER_NAIRA,
    min_withdrawal_ngn: CFG.MIN_WITHDRAWAL_NGN,
    min_withdrawal_points: CFG.MIN_WITHDRAWAL_NGN * CFG.POINTS_PER_NAIRA,
    has_bank: !!(bank && bank.length),
    is_admin: String(user.id) === String(CFG.ADMIN_TELEGRAM_ID),
    referrals: u.referrals_count || 0,
    referral_link: `https://t.me/${CFG.BOT_USERNAME}?start=ref${u.telegram_id}`,
    referral_bonus: CFG.REFERRAL_BONUS,
    can_claim: canClaim,
    next_claim_in_ms: canClaim ? 0 : CFG.CLAIM_COOLDOWN_MS - (now - last),
    streak_day: storedStreak,
    today_day: todayDay,
    streak_rewards: CFG.STREAK_REWARDS,
  });
};
