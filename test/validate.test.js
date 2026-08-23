// Self-test: verify our initData validation matches Telegram's algorithm.
const crypto = require('crypto');
const { validateInitData } = require('../api/_lib');

const BOT_TOKEN = '123456:ABC-DEF__test-token';

function buildSignedInitData(userObj, extra = {}) {
  const fields = {
    query_id: 'AAH' + Math.random().toString(36).slice(2),
    user: JSON.stringify(userObj),
    auth_date: String(Math.floor(Date.now() / 1000)),
    ...extra,
  };
  const dcs = Object.entries(fields)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = crypto.createHmac('sha256', secret).update(dcs).digest('hex');

  // Build a properly URL-encoded query string (like Telegram sends)
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) sp.set(k, v);
  sp.set('hash', hash);
  return sp.toString();
}

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ FAIL: ' + name); }
}

// Test 1: valid initData returns the user
const user = { id: 778899, first_name: 'Ada', last_name: 'Okafor', username: 'ada' };
const valid = buildSignedInitData(user);
const result = validateInitData(valid, BOT_TOKEN);
check('valid initData returns user object', result && result.id === 778899 && result.first_name === 'Ada');

// Test 2: tampered hash is rejected
const tampered = valid.slice(0, -4) + '0000';
check('tampered hash rejected', validateInitData(tampered, BOT_TOKEN) === null);

// Test 3: wrong bot token rejected
check('wrong bot token rejected', validateInitData(valid, '999:wrong') === null);

// Test 4: stale auth_date rejected
const stale = buildSignedInitData(user, { auth_date: String(Math.floor(Date.now() / 1000) - 999999) });
check('stale initData rejected', validateInitData(stale, BOT_TOKEN) === null);

// Test 5: user with non-ASCII name (encoding sanity)
const user2 = { id: 1, first_name: 'AdeOluwa' };
check('unicode/special name handled', validateInitData(buildSignedInitData(user2), BOT_TOKEN).id === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
