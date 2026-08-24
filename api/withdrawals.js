// User's withdrawal history.
const { validateInitData, userWithdrawals } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const body = req.body || {};
    const user = validateInitData(body.initData || req.query.initData);
    if (!user) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const list = await userWithdrawals(user.id);
    return res.status(200).json({ ok: true, withdrawals: Array.isArray(list) ? list : [] });
  } catch (e) {
    console.error('withdrawals error:', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
