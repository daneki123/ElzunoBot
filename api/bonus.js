// Rewarded-ad bonus: small extra points on a shorter cooldown.
const { validateInitData, getUser, updateUser, CFG, json, readBody } = require('./_lib');

module.exports = async (event) => {
  const raw = await readBody(event);
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch {}

  const user = validateInitData(payload.initData);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);

  const rows = await getUser(user.id);
  if (!rows || !rows.length) return json({ ok: false, error: 'no_user' }, 400);
  const u = rows[0];

  const now = Date.now();
  const last = u.last_bonus ? new Date(u.last_bonus).getTime() : 0;
  if (last && now - last < CFG.BONUS_COOLDOWN_MS) {
    return json({ ok: false, error: 'cooldown', retry_in_ms: CFG.BONUS_COOLDOWN_MS - (now - last) });
  }

  const newBalance = (u.balance || 0) + CFG.BONUS_AMOUNT;
  await updateUser(user.id, { balance: newBalance, last_bonus: new Date(now).toISOString() });

  return json({ ok: true, gained: CFG.BONUS_AMOUNT, balance: newBalance });
};
