// Save / fetch the user's bank account details (for NGN withdrawal).
const { validateInitData, getBank, upsertBank, CFG, json, readBody } = require('./_lib');

module.exports = async (event) => {
  const raw = await readBody(event);
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch {}

  const user = validateInitData(payload.initData);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);

  // GET (no body) → return saved bank details
  if (!payload.bank_name && !payload.account_number) {
    const bank = await getBank(user.id);
    return json({ ok: true, bank: bank && bank.length ? bank[0] : null });
  }

  // POST → save
  const { bank_name, account_number, account_name } = payload;
  if (!bank_name || !account_number || !account_name) {
    return json({ ok: false, error: 'missing_fields' }, 400);
  }
  await upsertBank({
    telegram_id: user.id,
    bank_name: String(bank_name).trim(),
    account_number: String(account_number).trim(),
    account_name: String(account_name).trim(),
    updated_at: new Date().toISOString(),
  });
  return json({ ok: true });
};
