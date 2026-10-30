// Slice 2: S-3 (clear messages for numbers the app can't use) and S-4 (allowed range for each input).
const { test, expect } = require('@playwright/test');
const { ERROR_CASES, MORE_RESULT_CASES, SEQUENCE_CASES, NO_MESSAGES } = require('../criteria.js');
const { button, openApp, fillForm, applyChange, expectMessages, expectResult } = require('./helpers.js');

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

for (const c of ERROR_CASES) {
  test(`${c.id} ${c.name}`, async ({ page }) => {
    await fillForm(page, c.input);
    await button.calculate(page).click();
    await expectMessages(page, c.messages);
    await expect(page.locator('#result')).toBeHidden();
  });
}

// S-3.14: no tip, total or share is shown (the result stays hidden), and NaN, Infinity
// or undefined appear nowhere on the page.
test('S-3.14 no result, NaN, Infinity or undefined after any invalid input in S-3', async ({ page }) => {
  for (const c of ERROR_CASES.filter((c) => c.id.startsWith('S-3.'))) {
    await fillForm(page, c.input);
    await button.calculate(page).click();
    await expect(page.locator('#result'), c.name).toBeHidden();
    for (const text of ['NaN', 'Infinity', 'undefined']) {
      await expect(page.locator('body'), c.name).not.toContainText(text);
    }
  }
});

for (const c of MORE_RESULT_CASES) {
  test(`${c.id} ${c.name}`, async ({ page }) => {
    await fillForm(page, c.input);
    await button.calculate(page).click();
    await expectResult(page, c.expected);
    await expectMessages(page, NO_MESSAGES);
  });
}

for (const c of SEQUENCE_CASES) {
  test(`${c.id} ${c.name}`, async ({ page }) => {
    for (const step of c.steps) {
      if (step.input) await fillForm(page, step.input);
      else await applyChange(page, step.change);
      await button.calculate(page).click();
      await expectResult(page, step.expected);
    }
  });
}
