// "Visit sponsor" (Monetag SmartLink) task: small bonus on a cooldown.
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
    const last = u.last_sponsor ? new Date(u.last_sponsor).getTime() : 0;
    if (last && now - last < CFG.SPONSOR_COOLDOWN_MS) {
      return res.status(200).json({ ok: false, error: 'cooldown', retry_in_ms: CFG.SPONSOR_COOLDOWN_MS - (now - last) });
    }

    const newBalance = (u.balance || 0) + CFG.SPONSOR_BONUS;
    await updateUser(user.id, { balance: newBalance, last_sponsor: new Date(now).toISOString() });

    return res.status(200).json({ ok: true, gained: CFG.SPONSOR_BONUS, balance: newBalance });
  } catch (e) {
    console.error('sponsor error:', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
