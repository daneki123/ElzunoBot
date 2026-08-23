// Request a withdrawal: converts points → NGN, deducts points, creates pending request.
const { validateInitData, getUser, updateUser, getBank, createWithdrawal, CFG, json, readBody } = require('./_lib');

module.exports = async (event) => {
  const raw = await readBody(event);
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch {}

  const user = validateInitData(payload.initData);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);

  const amountNgn = Math.floor(Number(payload.amount_ngn));
  if (!amountNgn || amountNgn < CFG.MIN_WITHDRAWAL_NGN) {
    return json({ ok: false, error: 'below_minimum', min: CFG.MIN_WITHDRAWAL_NGN }, 400);
  }

  const rows = await getUser(user.id);
  if (!rows || !rows.length) return json({ ok: false, error: 'no_user' }, 400);
  const u = rows[0];

  const pointsNeeded = amountNgn * CFG.POINTS_PER_NAIRA;
  if ((u.balance || 0) < pointsNeeded) {
    return json({ ok: false, error: 'insufficient', need_points: pointsNeeded }, 400);
  }

  const bank = await getBank(user.id);
  if (!bank || !bank.length) return json({ ok: false, error: 'no_bank' }, 400);
  const b = bank[0];

  // Deduct points now (held while pending). Refunded automatically if rejected.
  await updateUser(user.id, { balance: (u.balance || 0) - pointsNeeded });

  const created = await createWithdrawal({
    telegram_id: user.id,
    amount_ngn: amountNgn,
    points_spent: pointsNeeded,
    bank_name: b.bank_name,
    account_number: b.account_number,
    account_name: b.account_name,
    status: 'pending',
  });

  return json({ ok: true, withdrawal: created && created[0], new_balance: (u.balance || 0) - pointsNeeded });
};
