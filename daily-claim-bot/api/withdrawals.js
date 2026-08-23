// User's withdrawal history.
const { validateInitData, userWithdrawals, json, readBody } = require('./_lib');

module.exports = async (event) => {
  const raw = await readBody(event);
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch {}

  const user = validateInitData(payload.initData || event.queryStringParameters?.initData);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);

  const list = await userWithdrawals(user.id);
  return json({ ok: true, withdrawals: Array.isArray(list) ? list : [] });
};
