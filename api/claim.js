// Daily STREAK claim: reward rises each consecutive day (7-day cycle), resets if a day is missed.
const { validateInitData, getUser, updateUser, CFG } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const body = req.body || {};
    const user = validateInitData(body.initData);
    if (!user) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const rows = await getUser(user.id);
    if (!rows || !rows.length) return res.status(400).json({ ok: false, error: 'no_user' });
    const u = rows[0];

    const now = Date.now();
    const last = u.last_claim ? new Date(u.last_claim).getTime() : 0;

    if (last && now - last < CFG.CLAIM_COOLDOWN_MS) {
      return res.status(200).json({ ok: false, error: 'cooldown', retry_in_ms: CFG.CLAIM_COOLDOWN_MS - (now - last) });
    }

    let day;
    if (!last) day = 1;
    else if (now - last < CFG.STREAK_RESET_MS) day = ((u.streak_day || 0) % CFG.STREAK_REWARDS.length) + 1;
    else day = 1;

    const gained = CFG.STREAK_REWARDS[day - 1];
    const newBalance = (u.balance || 0) + gained;
    await updateUser(user.id, { balance: newBalance, last_claim: new Date(now).toISOString(), streak_day: day });

    if (!last && u.referrer_id) {
      const ref = await getUser(u.referrer_id);
      if (ref && ref.length) {
        await updateUser(u.referrer_id, { balance: (ref[0].balance || 0) + CFG.REFERRAL_BONUS, referrals_count: (ref[0].referrals_count || 0) + 1 });
      }
    }

    return res.status(200).json({ ok: true, gained, balance: newBalance, streak_day: day });
  } catch (e) {
    console.error('claim error:', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
