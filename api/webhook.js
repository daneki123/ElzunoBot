// Telegram bot webhook — handles /start (with referral deep-link) and onboarding.
const { CFG, getUser, upsertUser, updateUser } = require('./_lib');

async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${CFG.BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json();
}
async function setMenuButton(chatId) {
  return tg('setChatMenuButton', { chat_id: chatId, menu_button: { type: 'web_app', text: '⚡ Open Elzuno', web_app: { url: CFG.WEBAPP_URL } } });
}

module.exports = async (req, res) => {
  // Always respond to Telegram so messages don't pile up.
  try {
    const update = req.body || {};
    const msg = update.message;
    if (!msg || !msg.text) return res.status(200).json({ ok: true });

    const chatId = msg.chat.id;
    const from = msg.from;

    if (msg.text.startsWith('/start')) {
      const payload = msg.text.split(' ')[1] || '';
      const existing = await getUser(from.id);
      const isNew = !existing || !existing.length;

      if (isNew) {
        let referrerId = null;
        if (payload.startsWith('ref')) {
          const rid = parseInt(payload.slice(3), 10);
          if (rid && rid !== from.id) referrerId = rid;
        }
        await upsertUser({ telegram_id: from.id, username: from.username || null, first_name: from.first_name || null, referrer_id: referrerId });
      } else {
        await updateUser(from.id, { username: from.username || null, first_name: from.first_name || null });
      }

      await setMenuButton(chatId);

      const refLink = `https://t.me/${CFG.BOT_USERNAME}?start=ref${from.id}`;
      const welcome = isNew
        ? `Welcome to Elzuno ⚡, ${from.first_name || 'friend'}!\n\nTap below to open the app and claim your first ${CFG.BASE_CLAIM} points. Invite friends to earn more, and cash out to Naira.`
        : `Welcome back to Elzuno ⚡, ${from.first_name || 'friend'}!\n\nYour invite link:\n${refLink}`;

      await tg('sendMessage', { chat_id: chatId, text: welcome, reply_markup: { inline_keyboard: [[{ text: '⚡ Open Elzuno', web_app: { url: CFG.WEBAPP_URL } }]] } });
    } else {
      await tg('sendMessage', { chat_id: chatId, text: 'Tap below to open Elzuno 👇', reply_markup: { inline_keyboard: [[{ text: '⚡ Open Elzuno', web_app: { url: CFG.WEBAPP_URL } }]] } });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook error:', e && e.message);
    return res.status(200).json({ ok: true, error: 'handled' }); // still 200 so Telegram stops retrying
  }
};
