// Request a withdrawal: converts points → NGN, deducts points, creates pending request.
const { validateInitData, getUser, updateUser, getBank, createWithdrawal, CFG } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const body = req.body || {};
    const user = validateInitData(body.initData);
    if (!user) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const amountNgn = Math.floor(Number(body.amount_ngn));
    if (!amountNgn || amountNgn < CFG.MIN_WITHDRAWAL_NGN) {
      return res.status(400).json({ ok: false, error: 'below_minimum', min: CFG.MIN_WITHDRAWAL_NGN });
    }

    const rows = await getUser(user.id);
    if (!rows || !rows.length) return res.status(400).json({ ok: false, error: 'no_user' });
    const u = rows[0];

    const pointsNeeded = amountNgn * CFG.POINTS_PER_NAIRA;
    if ((u.balance || 0) < pointsNeeded) {
      return res.status(200).json({ ok: false, error: 'insufficient', need_points: pointsNeeded });
    }

    const bank = await getBank(user.id);
    if (!bank || !bank.length) return res.status(200).json({ ok: false, error: 'no_bank' });
    const b = bank[0];

    await updateUser(user.id, { balance: (u.balance || 0) - pointsNeeded });

    const created = await createWithdrawal({
      telegram_id: user.id, amount_ngn: amountNgn, points_spent: pointsNeeded,
      bank_name: b.bank_name, account_number: b.account_number, account_name: b.account_name, status: 'pending',
    });

    return res.status(200).json({ ok: true, withdrawal: created && created[0], new_balance: (u.balance || 0) - pointsNeeded });
  } catch (e) {
    console.error('withdraw error:', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
