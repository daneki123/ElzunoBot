// Admin tools: list pending withdrawals + approve/reject (gated by ADMIN_TELEGRAM_ID).
const { validateInitData, pendingWithdrawals, getWithdrawal, setWithdrawalStatus, getUser, updateUser, CFG, json, readBody } = require('./_lib');

module.exports = async (event) => {
  const raw = await readBody(event);
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch {}

  const user = validateInitData(payload.initData);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);
  if (String(user.id) !== String(CFG.ADMIN_TELEGRAM_ID)) return json({ ok: false, error: 'forbidden' }, 403);

  // Approve / reject
  if (payload.action && payload.id) {
    const rows = await getWithdrawal(payload.id);
    if (!rows || !rows.length) return json({ ok: false, error: 'not_found' }, 404);
    const w = rows[0];
    if (w.status !== 'pending') return json({ ok: false, error: 'not_pending' }, 400);

    if (payload.action === 'approve') {
      await setWithdrawalStatus(w.id, 'paid');
      return json({ ok: true, status: 'paid' });
    }
    if (payload.action === 'reject') {
      await setWithdrawalStatus(w.id, 'rejected');
      // Refund the points
      const u = await getUser(w.telegram_id);
      if (u && u.length) await updateUser(w.telegram_id, { balance: (u[0].balance || 0) + w.points_spent });
      return json({ ok: true, status: 'rejected' });
    }
    return json({ ok: false, error: 'bad_action' }, 400);
  }

  // List pending
  const list = await pendingWithdrawals();
  return json({ ok: true, pending: Array.isArray(list) ? list : [] });
};
