// ONE-CLICK health check + webhook auto-repair.
// Bookmark and visit:  https://your-app.vercel.app/api/setup?key=YOUR_ADMIN_TELEGRAM_ID
// It checks everything AND re-sets the webhook to the correct URL (built from your env
// vars, so a typo like //api/webhook is impossible).
const { CFG, sb } = require('./_lib');

module.exports = async (req, res) => {
  const report = { ok: true, checks: {} };
  const key = (req.query && req.query.key) || '';
  if (!CFG.ADMIN_TELEGRAM_ID || String(key) !== String(CFG.ADMIN_TELEGRAM_ID)) {
    return res.status(403).json({ ok: false, error: 'Wrong or missing ?key= — use your ADMIN_TELEGRAM_ID' });
  }

  // 1. Environment variables
  const envOk = !!(CFG.BOT_TOKEN && CFG.SUPABASE_URL && CFG.SUPABASE_SERVICE_ROLE && CFG.WEBAPP_URL && CFG.BOT_USERNAME);
  report.checks.env_vars = envOk ? 'OK — all 5 env vars are set' : 'FAIL — missing env vars in Vercel (BOT_TOKEN, BOT_USERNAME, WEBAPP_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE)';
  if (!envOk) report.ok = false;

  // 2. Bot token valid?
  if (CFG.BOT_TOKEN) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${CFG.BOT_TOKEN}/getMe`);
      const me = await r.json();
      report.checks.bot_token = me.ok ? `OK — talking to @${me.result.username}` : 'FAIL — token rejected. Was it regenerated in BotFather? Update BOT_TOKEN in Vercel and redeploy.';
      if (!me.ok) report.ok = false;
    } catch (e) { report.checks.bot_token = `FAIL — ${e.message}`; report.ok = false; }
  }

  // 3. Database alive?
  try {
    const r = await sb('GET', 'users', { select: 'telegram_id', filter: { limit: '1' } });
    report.checks.database = Array.isArray(r)
      ? `OK — Supabase connected (${r.length === 1 ? 'has users' : 'empty but reachable'})`
      : `PROBLEM — unexpected reply: ${JSON.stringify(r).slice(0, 140)}`;
  } catch (e) {
    report.checks.database = `FAIL — ${e.message} — if Supabase is PAUSED, open supabase.com and click Restore project.`;
    report.ok = false;
  }

  // 4. Auto-fix the webhook (always re-set to the correct, typo-free URL)
  if (CFG.BOT_TOKEN && CFG.WEBAPP_URL) {
    try {
      const correctUrl = `${CFG.WEBAPP_URL.replace(/\/+$/, '')}/api/webhook`; // strips trailing slashes — no more //
      const r = await fetch(`https://api.telegram.org/bot${CFG.BOT_TOKEN}/setWebhook`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: correctUrl }),
      });
      const set = await r.json();
      report.checks.webhook_fixed = set.ok ? `OK — webhook set to ${correctUrl}` : `FAIL — ${JSON.stringify(set)}`;
      if (!set.ok) report.ok = false;
    } catch (e) { report.checks.webhook_fixed = `FAIL — ${e.message}`; report.ok = false; }
  }

  // 5. Read back the live webhook status (shows pending messages + last error)
  if (CFG.BOT_TOKEN) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${CFG.BOT_TOKEN}/getWebhookInfo`);
      const info = await r.json();
      const w = info.result || {};
      report.checks.webhook_status = {
        url: w.url,
        pending_updates: w.pending_update_count,
        last_error: w.last_error_message ? `${w.last_error_message} @ ${new Date((w.last_error_date || 0) * 1000).toISOString()}` : 'none',
      };
    } catch (e) { report.checks.webhook_status = `FAIL — ${e.message}`; }
  }

  report.next_step = report.ok
    ? 'Everything is healthy. Send /start to the bot — it should reply within a second.'
    : 'Fix the FAIL items above (Vercel env vars or Supabase dashboard), then visit this URL again.';

  return res.status(200).json(report);
};
