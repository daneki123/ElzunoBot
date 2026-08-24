// Leaderboard — top 10 by balance. Public GET.
const { sb } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const rows = await sb('GET', 'users', { select: 'telegram_id,first_name,username,balance', filter: { order: 'balance.desc', limit: '10' } });
    return res.status(200).json({ ok: true, leaderboard: Array.isArray(rows) ? rows : [] });
  } catch (e) {
    console.error('leaderboard error:', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
