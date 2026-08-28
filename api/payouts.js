// PUBLIC feed of recent PAID withdrawals — visible proof that rewards are really paid out.
// No auth required (this is the "dedicated section publishing payout confirmations" for AdsGram clause 8).
const { sb } = require('./_lib');

function maskName(name) {
  if (!name) return 'A user';
  const p = String(name).trim().split(/\s+/);
  return (p[0] || 'User') + (p[1] ? ' ' + p[1][0].toUpperCase() + '.' : '');
}

module.exports = async (req, res) => {
  try {
    const rows = await sb('GET', 'withdrawals', {
      select: 'amount_ngn,account_name,processed_at',
      filter: { status: 'eq.paid', order: 'processed_at.desc', limit: '12' },
    });
    const payouts = (Array.isArray(rows) ? rows : []).map((w) => ({
      name: maskName(w.account_name),
      amount_ngn: w.amount_ngn,
      date: w.processed_at,
    }));
    return res.status(200).json({ ok: true, payouts });
  } catch (e) {
    console.error('payouts error:', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
