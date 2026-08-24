// Rewarded-ad bonus: small extra points on a shorter cooldown.
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
    const last = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
    if (last && now - last < CFG.BONUS_COOLDOWN_MS) {
      return res.status(200).json({ ok: false, error: 'cooldown', retry_in_ms: CFG.BONUS_COOLDOWN_MS - (now - last) });
    }

    const newBalance = (u.balance || 0) + CFG.BONUS_AMOUNT;
    await updateUser(user.id, { balance: newBalance, last_bonus: new Date(now).toISOString() });

    return res.status(200).json({ ok: true, gained: CFG.BONUS_AMOUNT, balance: newBalance });
  } catch (e) {
    console.error('bonus error:', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
