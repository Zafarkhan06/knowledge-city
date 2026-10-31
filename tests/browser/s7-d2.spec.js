// Slice 4: S-7 (works on phone and desktop) and D-2 (no network requests).
// S-7.3's "readable without zooming" also needs a human look; these tests check what a machine can:
// nothing wider than the window, no text cut off, and fields large enough that phones don't zoom in.
const { test, expect } = require('@playwright/test');
const { RESULT_CASES } = require('../criteria.js');
const { APP_URL, field, button, openApp, fillForm, expectResult } = require('./helpers.js');

const S_1_2 = RESULT_CASES.find((c) => c.id === 'S-1.2');
const S_2_2 = RESULT_CASES.find((c) => c.id === 'S-2.2');
const S_2_8 = RESULT_CASES.find((c) => c.id === 'S-2.8');
const PHONE = { width: 360, height: 640 };
const DESKTOP = { width: 1280, height: 800 };

async function expectNoSidewaysScroll(page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, 'the page should not scroll sideways').toBeLessThanOrEqual(clientWidth);
}

// The element sits inside the window width and its own text is not cut off.
async function expectFullyInside(locator, width, name) {
  await expect(locator, name).toBeVisible();
  const box = await locator.boundingBox();
  expect(box.x, `${name} starts inside the window`).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, `${name} ends inside the window`).toBeLessThanOrEqual(width);
  const cutOff = await locator.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(cutOff, `${name} text is not cut off`).toBe(false);
}

async function fontSize(locator) {
  return locator.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
}

// Number of lines the element's text is laid out on.
async function lineCount(locator) {
  return locator.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
  });
}

test('S-7.3 phone-sized screen: every part fits the width, nothing is cut off, no sideways scroll', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await openApp(page);
  await fillForm(page, S_2_2.input);
  await button.calculate(page).click();
  await expectResult(page, S_2_2.expected);

  // Without this tag a phone lays the page out about 980 px wide and the reader has to zoom.
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);

  const parts = {
    'Bill amount label': page.locator('label[for="bill"]'),
    'Tip percentage label': page.locator('label[for="tip"]'),
    'Number of people label': page.locator('label[for="people"]'),
    'Bill amount field': field.bill(page),
    'Tip percentage field': field.tip(page),
    'Number of people field': field.people(page),
    'Calculate button': button.calculate(page),
    'Start over button': button.startOver(page),
    'Tip line': page.locator('#result-tip'),
    'Total line': page.locator('#result-total'),
    'Person 1 line': page.locator('#result-shares li').nth(0),
    'Person 2 line': page.locator('#result-shares li').nth(1),
    'Person 3 line': page.locator('#result-shares li').nth(2),
    'Leftover note': page.locator('#result-note'),
  };
  for (const [name, part] of Object.entries(parts)) {
    await expectFullyInside(part, PHONE.width, name);
    expect(await fontSize(part), `${name} text is at least 14 px`).toBeGreaterThanOrEqual(14);
  }
  // Phones zoom in on fields whose text is smaller than 16 px when they are tapped.
  for (const name of ['Bill amount field', 'Tip percentage field', 'Number of people field']) {
    expect(await fontSize(parts[name]), `${name} text is at least 16 px`).toBeGreaterThanOrEqual(16);
  }
  await expectNoSidewaysScroll(page);
});

test('S-7.4 phone-sized screen: 200000000.00 is shown in full, on one line, wherever it appears', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await openApp(page);
  await fillForm(page, S_2_8.input);
  await button.calculate(page).click();
  await expectResult(page, S_2_8.expected);

  const lines = {
    'Tip line': page.locator('#result-tip'),
    'Total line': page.locator('#result-total'),
    'Person 1 line': page.locator('#result-shares li').first(),
  };
  for (const [name, line] of Object.entries(lines)) {
    await expectFullyInside(line, PHONE.width, name);
    expect(await lineCount(line), `${name} stays on one line`).toBe(1);
  }
  await expectNoSidewaysScroll(page);
});

// Safari with default settings skips buttons on plain Tab on every website; Option+Tab reaches them.
// WebKit behaves the same, so it uses Option+Tab as S-7.5 says.
test('S-7.5 desktop: Tab (Option+Tab in Safari) moves through the fields and buttons in order', async ({ page, browserName }) => {
  const key = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.setViewportSize(DESKTOP);
  await openApp(page);
  const order = [field.bill(page), field.tip(page), field.people(page), button.calculate(page), button.startOver(page)];
  for (const target of order) {
    await page.keyboard.press(key);
    await expect(target).toBeFocused();
  }
  await expectNoSidewaysScroll(page);
});

test("D-2 the page only requests its own files in src/, never an http or https address", async ({ page, browserName }) => {
  test.skip(
    browserName === 'firefox',
    "Playwright's Firefox reports no requests for file:// pages, so there is nothing to check here. " +
      'D-2 is checked by hand in Firefox, and tests/unit/no-network.test.js scans the source.',
  );
  const requested = [];
  page.on('request', (request) => requested.push(request.url()));
  await openApp(page);
  await page.reload();
  await fillForm(page, S_1_2.input);
  await button.calculate(page).click();
  await expectResult(page, S_1_2.expected);

  const srcFolder = new URL('.', APP_URL).href;
  const ownFiles = ['index.html', 'styles.css', 'calc.js', 'app.js'].map((name) => srcFolder + name);
  expect(requested.length, 'the browser reports the page loading its own files').toBeGreaterThan(0);
  for (const url of requested) {
    expect(url, 'no request may go to an http or https address').not.toMatch(/^https?:/);
    expect(ownFiles, `${url} should be one of the app's own files in src/`).toContain(url);
  }
});
