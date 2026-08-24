// Admin tools: list pending withdrawals + approve/reject (gated by ADMIN_TELEGRAM_ID).
const { validateInitData, pendingWithdrawals, getWithdrawal, setWithdrawalStatus, getUser, updateUser, CFG } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const body = req.body || {};
    const user = validateInitData(body.initData);
    if (!user) return res.status(401).json({ ok: false, error: 'unauthorized' });
    if (String(user.id) !== String(CFG.ADMIN_TELEGRAM_ID)) return res.status(403).json({ ok: false, error: 'forbidden' });

    if (body.action && body.id) {
      const rows = await getWithdrawal(body.id);
      if (!rows || !rows.length) return res.status(404).json({ ok: false, error: 'not_found' });
      const w = rows[0];
      if (w.status !== 'pending') return res.status(400).json({ ok: false, error: 'not_pending' });

      if (body.action === 'approve') {
        await setWithdrawalStatus(w.id, 'paid');
        return res.status(200).json({ ok: true, status: 'paid' });
      }
      if (body.action === 'reject') {
        await setWithdrawalStatus(w.id, 'rejected');
        const u = await getUser(w.telegram_id);
        if (u && u.length) await updateUser(w.telegram_id, { balance: (u[0].balance || 0) + w.points_spent });
        return res.status(200).json({ ok: true, status: 'rejected' });
      }
      return res.status(400).json({ ok: false, error: 'bad_action' });
    }

    const list = await pendingWithdrawals();
    return res.status(200).json({ ok: true, pending: Array.isArray(list) ? list : [] });
  } catch (e) {
    console.error('admin error:', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
