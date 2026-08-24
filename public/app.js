// ===== Elzuno Mini App logic =====
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const $ = (id) => document.getElementById(id);
let S = {};
const DEMO = !tg || !tg.initData; // true when viewed outside Telegram (preview)

// ---------- AdsGram (rewarded ads) with mock fallback ----------
const ADSGRAM_BLOCK_ID = 'YOUR_ADSGRAM_BLOCK_ID'; // ← paste your real block ID from partner.adsgram.ai
const ADSGRAM_DEBUG = false; // set true while testing to get TEST ads (set false for production)
let _adsgram = null;
function initAds() {
  try {
    if (window.Adsgram && ADSGRAM_BLOCK_ID !== 'YOUR_ADSGRAM_BLOCK_ID') {
      _adsgram = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID, debug: ADSGRAM_DEBUG });
    }
  } catch (e) { console.warn('AdsGram init failed', e); }
}
function showRewardedAd() {
  return new Promise((resolve) => {
    if (!_adsgram) {
      // SDK didn't load — mock so the flow still works during testing
      console.log('[mock ad] add your AdsGram blockId to go live');
      setTimeout(() => resolve(true), 1200);
      return;
    }
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    try {
      _adsgram.addEventListener('onError', () => finish(false));
      _adsgram.addEventListener('onBannerNotFound', () => finish(false)); // no ad available right now
    } catch (e) {}
    // resolves when watched to the end; rejects on skip/error
    _adsgram.show().then(() => finish(true)).catch(() => finish(false));
  });
}

// ---------- Helpers ----------
const api = async (path, body) => {
  const res = await fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const initData = () => (tg ? tg.initData : '');
function fmtCountdown(ms){const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=s%60;return `${h}h ${m}m ${x}s`}
function fmtNaira(n){n=Number(n)||0;return '₦'+(n>=1?Math.floor(n).toLocaleString():n.toFixed(2))}
const hap = (t) => { try { tg?.HapticFeedback?.notificationOccurred(t); } catch {} };

// ---------- Navigation ----------
document.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', () => go(el.dataset.go)));
function go(screen) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.dataset.screen === screen));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.go === screen));
  if (screen === 'cash') DEMO ? demoCash() : loadCash();
  if (screen === 'top') DEMO ? demoLeaderboard() : loadLeaderboard();
  if (screen === 'admin') DEMO ? ($('adminList').innerHTML = '<div class="muted">Admin tools appear here for the owner.</div>') : loadAdmin();
  $('.screens').scrollTop = 0;
}

// ---------- Render ----------
let claimTimer = null;
function renderBalance() {
  $('homePoints').textContent = (S.balance || 0).toLocaleString();
  $('homeNaira').textContent = '≈ ' + fmtNaira(S.naira);
  $('topPoints').textContent = (S.balance || 0).toLocaleString();
  $('statRefs').textContent = S.referrals || 0;
  $('statValue').textContent = fmtNaira(S.naira);
  $('refLink').value = S.referral_link || '';
  $('refCount').textContent = S.referrals || 0;
  $('minWd').textContent = (S.min_withdrawal_ngn || 1000).toLocaleString();
  $('cashPoints').textContent = (S.balance || 0).toLocaleString();
  $('cashNaira').textContent = fmtNaira(S.naira);
  renderStreak();
}
function renderStreak() {
  const rewards = S.streak_rewards || [100, 150, 200, 300, 500, 750, 1000];
  const today = S.today_day || 1;
  const canClaim = S.can_claim;
  const doneDays = canClaim ? today - 1 : today;
  $('streakRow').innerHTML = rewards.map((r, i) => {
    const d = i + 1;
    let cls = 'streak-cell';
    if (d <= doneDays) cls += ' done';
    if (canClaim && d === today) cls += ' current';
    return `<div class="${cls}"><div class="sc-day">${d === 7 ? '7🏆' : 'D' + d}</div><div class="sc-reward">+${r}</div></div>`;
  }).join('');
  const reward = rewards[today - 1];
  $('claimBtn').innerHTML = canClaim ? `Claim Day ${today} · <b>+${reward}</b> 🔥` : `⏳ Come back tomorrow`;
}
function setClaimReady(ready) {
  clearInterval(claimTimer);
  if (ready) { $('claimBtn').disabled = false; $('claimStatus').textContent = 'Your daily reward is ready! 🎉'; }
  else $('claimBtn').disabled = true;
}
function startCountdown(ms) {
  setClaimReady(false);
  renderStreak();
  const tick = () => { if (ms <= 0) { clearInterval(claimTimer); setClaimReady(true); return; } $('claimStatus').textContent = 'Next claim in ' + fmtCountdown(ms); ms -= 1000; };
  tick(); claimTimer = setInterval(tick, 1000);
}

// ---------- Load (real) ----------
async function load() {
  if (DEMO) return demoMode();
  const data = await api('/api/balance', { initData: initData() });
  if (!data.ok) { $('claimStatus').textContent = 'Open inside Telegram to use Elzuno.'; return; }
  S = data; renderBalance();
  if (data.is_admin) $('adminTab').hidden = false;
  if (data.can_claim) setClaimReady(true); else startCountdown(data.next_claim_in_ms);
}

// ---------- DEMO mode (preview only) ----------
function demoMode() {
  S = {
    balance: 12400, naira: 124, referrals: 7,
    referral_link: 'https://t.me/ElzunoBot?start=ref123456',
    min_withdrawal_ngn: 1000, points_per_naira: 100,
    streak_rewards: [100, 150, 200, 300, 500, 750, 1000],
    today_day: 4, can_claim: true,
  };
  renderBalance(); setClaimReady(true);
  demoLeaderboard();
  const banner = document.createElement('div');
  banner.className = 'preview-banner';
  banner.textContent = '👁 Preview mode — this is how Elzuno looks. Open it in Telegram to play for real.';
  $('.screens').prepend(banner);
}
function demoLeaderboard() {
  const sample = [['Ade', 98000], ['Chioma', 73200], ['Tunde', 54100], ['Bisi', 39900], ['You', 12400], ['Kunle', 9800], ['Zainab', 7600]];
  $('leaderboard').innerHTML = sample.map((u, i) => `<li><span class="rank">${i+1}</span><span class="name">${u[0]}</span><span class="pts">${u[1].toLocaleString()}</span></li>`).join('');
}
function demoCash() {
  $('bankName').value = 'GTBank'; $('acctNumber').value = '0123456789'; $('acctName').value = 'Adaeze Okoro';
  $('wdHistory').innerHTML = '<div class="wd-item"><div><b>₦1,000</b><br><span class="muted" style="margin:0">Yesterday</span></div><span class="badge paid">paid</span></div>'
    + '<div class="wd-item"><div><b>₦1,500</b><br><span class="muted" style="margin:0">2 days ago</span></div><span class="badge pending">pending</span></div>';
  if ($('proofChannel')) $('proofChannel').href = PROOF_CHANNEL;
  if ($('payoutsList')) $('payoutsList').innerHTML = '<div class="wd-item"><div><b>Adaeze O.</b><br><span class="muted" style="margin:0">Today</span></div><span class="badge paid">₦1,000 ✓</span></div><div class="wd-item"><div><b>Tunde A.</b><br><span class="muted" style="margin:0">Yesterday</span></div><span class="badge paid">₦2,500 ✓</span></div>';
}

// ---------- Actions: claim ----------
$('claimBtn').addEventListener('click', async () => {
  if (DEMO) { hap('success'); S.can_claim = false; renderBalance(); setClaimReady(false); startCountdown(86400000); return; }
  $('claimBtn').disabled = true;
  const data = await api('/api/claim', { initData: initData() });
  if (data.ok) { hap('success'); await load(); }
  else if (data.error === 'cooldown') startCountdown(data.retry_in_ms);
  else { $('claimStatus').textContent = 'Something went wrong. Try again.'; $('claimBtn').disabled = false; }
});

// ---------- Actions: rewarded ad ----------
$('adBtn').addEventListener('click', async () => {
  $('adBtn').disabled = true; $('adStatus').textContent = 'Playing ad…';
  const ok = await showRewardedAd();
  if (!ok) { $('adStatus').textContent = 'Ad skipped.'; $('adBtn').disabled = false; return; }
  if (DEMO) { hap('success'); S.balance += 50; S.naira = S.balance / 100; renderBalance(); $('adStatus').textContent = '+50 pts! 🎉'; $('adBtn').disabled = false; return; }
  const data = await api('/api/bonus', { initData: initData() });
  if (data.ok) { hap('success'); S.balance = data.balance; S.naira = data.balance/(S.points_per_naira||100); renderBalance(); $('adStatus').textContent = `+${data.gained} pts! 🎉`; }
  else if (data.error === 'cooldown') $('adStatus').textContent = 'Bonus ready in ' + fmtCountdown(data.retry_in_ms);
  else $('adStatus').textContent = 'Try again later.';
  $('adBtn').disabled = false;
});

// ---------- Actions: copy referral ----------
$('copyBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('refLink').value); $('copyBtn').textContent = 'Copied!'; hap('success'); setTimeout(() => ($('copyBtn').textContent = 'Copy'), 1500); }
  catch { $('refLink').select(); document.execCommand('copy'); }
});

// ---------- Cash screen ----------
const PROOF_CHANNEL = 'https://t.me/ElzunoProof'; // ← create this PUBLIC channel and paste its link here
function loadPayouts() {
  const link = $('proofChannel'); if (link) link.href = PROOF_CHANNEL;
  api('/api/payouts').then((data) => {
    const box = $('payoutsList'); if (!box) return;
    if (!data.ok || !data.payouts || !data.payouts.length) { box.textContent = 'Payouts appear here as users withdraw.'; return; }
    box.innerHTML = data.payouts.map((p) => `<div class="wd-item"><div><b>${p.name}</b><br><span class="muted" style="margin:0">${p.date ? new Date(p.date).toLocaleDateString() : ''}</span></div><span class="badge paid">₦${p.amount_ngn.toLocaleString()} ✓</span></div>`).join('');
  }).catch(() => {});
}
async function loadCash() {
  const bank = await api('/api/bank', { initData: initData() });
  if (bank.ok && bank.bank) { $('bankName').value = bank.bank.bank_name||''; $('acctNumber').value = bank.bank.account_number||''; $('acctName').value = bank.bank.account_name||''; }
  loadHistory();
  loadPayouts();
}
$('saveBankBtn').addEventListener('click', async () => {
  if (DEMO) { hap('success'); $('bankStatus').textContent = '✅ Saved (preview)'; return; }
  const body = { initData: initData(), bank_name: $('bankName').value, account_number: $('acctNumber').value, account_name: $('acctName').value };
  const data = await api('/api/bank', body);
  if (data.ok) { hap('success'); $('bankStatus').textContent = '✅ Saved'; }
  else if (data.error === 'missing_fields') $('bankStatus').textContent = 'Please fill all three fields.';
  else $('bankStatus').textContent = 'Could not save. Try again.';
});
$('withdrawBtn').addEventListener('click', async () => {
  if (DEMO) { $('wdStatus').textContent = 'Preview mode — withdrawals process on the live app.'; return; }
  const amt = $('wdAmount').value;
  if (!amt) { $('wdStatus').textContent = 'Enter an amount in ₦.'; return; }
  $('withdrawBtn').disabled = true; $('wdStatus').textContent = 'Processing…';
  const data = await api('/api/withdraw', { initData: initData(), amount_ngn: Number(amt) });
  if (data.ok) { hap('success'); S.balance = data.new_balance; S.naira = data.new_balance/(S.points_per_naira||100); renderBalance(); $('wdStatus').textContent = '✅ Request sent! Payout within 24–48h.'; $('wdAmount').value=''; loadHistory(); }
  else if (data.error === 'below_minimum') $('wdStatus').textContent = `Minimum withdrawal is ₦${(data.min||1000).toLocaleString()}.`;
  else if (data.error === 'insufficient') $('wdStatus').textContent = `Not enough points. You need ${(data.need_points||0).toLocaleString()} pts.`;
  else if (data.error === 'no_bank') $('wdStatus').textContent = 'Please save your bank details first.';
  else $('wdStatus').textContent = 'Could not request. Try again.';
  $('withdrawBtn').disabled = false;
});
async function loadHistory() {
  const data = await api('/api/withdrawals', { initData: initData() });
  const box = $('wdHistory');
  if (!data.ok || !data.withdrawals.length) { box.textContent = 'No withdrawals yet.'; return; }
  box.innerHTML = data.withdrawals.map((w) => `<div class="wd-item"><div><b>₦${w.amount_ngn.toLocaleString()}</b><br><span class="muted" style="margin:0">${new Date(w.created_at).toLocaleDateString()}</span></div><span class="badge ${w.status}">${w.status}</span></div>`).join('');
}

// ---------- Leaderboard ----------
async function loadLeaderboard() {
  const data = await api('/api/leaderboard');
  const ol = $('leaderboard');
  if (!data.leaderboard || !data.leaderboard.length) { ol.innerHTML = '<li class="muted">Be the first to claim!</li>'; return; }
  ol.innerHTML = data.leaderboard.map((u, i) => `<li><span class="rank">${i+1}</span><span class="name">${u.first_name||u.username||'Anon'}</span><span class="pts">${(u.balance||0).toLocaleString()}</span></li>`).join('');
}

// ---------- Admin ----------
async function loadAdmin() {
  const data = await api('/api/admin', { initData: initData() });
  const box = $('adminList');
  if (!data.ok) { box.textContent = 'Admin only.'; return; }
  if (!data.pending.length) { box.innerHTML = '<div class="muted">No pending withdrawals. 🎉</div>'; return; }
  box.innerHTML = data.pending.map((w) => `
    <div class="admin-card" data-id="${w.id}">
      <div class="ac-top"><div><div class="ac-name">₦${w.amount_ngn.toLocaleString()}</div>
      <div class="ac-sub">${w.account_name||''} · ${w.bank_name||''} · ${w.account_number||''}</div></div>
      <span class="badge pending">${(w.points_spent||0).toLocaleString()} pts</span></div>
      <div class="admin-actions">
        <button class="btn-pay" data-act="approve" data-id="${w.id}">✓ Mark Paid</button>
        <button class="btn-rej" data-act="reject" data-id="${w.id}">Reject</button>
      </div></div>`).join('');
  box.querySelectorAll('button[data-act]').forEach((b) => b.addEventListener('click', () => adminAction(b.dataset.act, b.dataset.id)));
}
async function adminAction(action, id) {
  if (action === 'approve' && !confirm('Have you sent the money? Mark as paid?')) return;
  const data = await api('/api/admin', { initData: initData(), action, id: Number(id) });
  if (data.ok) { hap('success'); loadAdmin(); } else alert('Action failed: ' + (data.error || 'unknown'));
}

// ---------- Boot ----------
initAds();
load();
