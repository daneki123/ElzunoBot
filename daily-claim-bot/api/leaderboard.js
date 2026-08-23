// Leaderboard — top 10 by balance. Public GET.
const { sb, json } = require('./_lib');

module.exports = async () => {
  const rows = await sb('GET', 'users', {
    select: 'telegram_id,first_name,username,balance',
    filter: { order: 'balance.desc', limit: '10' },
  });
  return json({ ok: true, leaderboard: Array.isArray(rows) ? rows : [] });
};
