// Save / fetch the user's bank account details (for NGN withdrawal).
const { validateInitData, getBank, upsertBank } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const body = req.body || {};
    const user = validateInitData(body.initData);
    if (!user) return res.status(401).json({ ok: false, error: 'unauthorized' });

    if (!body.bank_name && !body.account_number) {
      const bank = await getBank(user.id);
      return res.status(200).json({ ok: true, bank: bank && bank.length ? bank[0] : null });
    }

    const { bank_name, account_number, account_name } = body;
    if (!bank_name || !account_number || !account_name) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }
    await upsertBank({
      telegram_id: user.id,
      bank_name: String(bank_name).trim(),
      account_number: String(account_number).trim(),
      account_name: String(account_name).trim(),
      updated_at: new Date().toISOString(),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('bank error:', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
