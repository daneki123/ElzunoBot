// Daily STREAK claim: reward rises each consecutive day (7-day cycle), resets if a day is missed.
const { validateInitData, getUser, updateUser, CFG, json, readBody } = require('./_lib');

module.exports = async (event) => {
  const raw = await readBody(event);
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch {}
  const user = validateInitData(payload.initData);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);

  const rows = await getUser(user.id);
  if (!rows || !rows.length) return json({ ok: false, error: 'no_user' }, 400);
  const u = rows[0];

  const now = Date.now();
  const last = u.last_claim ? new Date(u.last_claim).getTime() : 0;

  // Already claimed within the 24h cooldown
  if (last && now - last < CFG.CLAIM_COOLDOWN_MS) {
    return json({ ok: false, error: 'cooldown', retry_in_ms: CFG.CLAIM_COOLDOWN_MS - (now - last) });
  }

  // Work out today's streak day
  let day;
  if (!last) day = 1;                                                                    // first ever claim
  else if (now - last < CFG.STREAK_RESET_MS) day = ((u.streak_day || 0) % CFG.STREAK_REWARDS.length) + 1; // consecutive day
  else day = 1;                                                                          // missed a day → reset

  const gained = CFG.STREAK_REWARDS[day - 1];
  const newBalance = (u.balance || 0) + gained;
  await updateUser(user.id, {
    balance: newBalance,
    last_claim: new Date(now).toISOString(),
    streak_day: day,
  });

  // First-ever claim + has referrer → pay the referrer
  if (!last && u.referrer_id) {
    const ref = await getUser(u.referrer_id);
    if (ref && ref.length) {
      await updateUser(u.referrer_id, {
        balance: (ref[0].balance || 0) + CFG.REFERRAL_BONUS,
        referrals_count: (ref[0].referrals_count || 0) + 1,
      });
    }
  }

  return json({ ok: true, gained, balance: newBalance, streak_day: day });
};
