// D-2 source check, independent of any browser: the app's files reference nothing outside src/.
// Backs up the browser test, which can't observe file:// loads in Firefox.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', '..', 'src');
const files = fs.readdirSync(SRC).filter((name) => /\.(html|css|js)$/.test(name));

// Ways a page can reach the network.
const NETWORK_PATTERNS = [
  /https?:\/\//i,
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /sendBeacon/,
  /\bimport\s*\(/,
  /@import/i,
  /url\s*\(/i,
  /(?:src|href|action)\s*=\s*["']\/\//i,
];

test('D-2 (source check) the app files exist: index.html, styles.css, calc.js, app.js', () => {
  assert.deepEqual([...files].sort(), ['app.js', 'calc.js', 'index.html', 'styles.css']);
});

for (const name of files) {
  test(`D-2 (source check) ${name} has no way to reach the network`, () => {
    const text = fs.readFileSync(path.join(SRC, name), 'utf8');
    for (const pattern of NETWORK_PATTERNS) {
      assert.doesNotMatch(text, pattern, `${name} matches ${pattern}`);
    }
  });
}

test('D-2 (source check) index.html only loads its own files', () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const loaded = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']*)["']/g)].map((match) => match[1]);
  // 'data:,' is the empty inline favicon, which stops browsers asking for favicon.ico.
  assert.deepEqual(loaded.sort(), ['app.js', 'calc.js', 'data:,', 'styles.css']);
});
