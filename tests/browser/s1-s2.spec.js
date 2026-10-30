// Slice 1: S-1 (split a bill equally) and S-2 (shares always add up exactly).
const { test, expect } = require('@playwright/test');
const { RESULT_CASES } = require('../criteria.js');
const { field, button, openApp, fillForm, expectResult } = require('./helpers.js');

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('S-1.1 starting page: three empty labelled fields, two buttons, no result, no messages', async ({ page }) => {
  for (const input of Object.values(field)) {
    await expect(input(page)).toBeVisible();
    await expect(input(page)).toHaveValue('');
  }
  await expect(button.calculate(page)).toBeVisible();
  await expect(button.startOver(page)).toBeVisible();
  await expect(page.locator('#result')).toBeHidden();
  for (const message of await page.locator('.field-error').all()) {
    await expect(message).toHaveText('');
  }
});

for (const c of RESULT_CASES) {
  test(`${c.id} ${c.name}`, async ({ page }) => {
    await fillForm(page, c.input);
    await button.calculate(page).click();
    await expectResult(page, c.expected);
    for (const text of c.absentFromPage || []) {
      await expect(page.locator('body')).not.toContainText(text);
    }
  });
}

const S_1_2 = RESULT_CASES.find((c) => c.id === 'S-1.2');
const fieldNames = { bill: 'Bill amount', tip: 'Tip percentage', people: 'Number of people' };

for (const [name, label] of Object.entries(fieldNames)) {
  test(`S-1.9 pressing Enter in ${label} works like Calculate`, async ({ page }) => {
    await fillForm(page, S_1_2.input);
    await field[name](page).press('Enter');
    await expectResult(page, S_1_2.expected);
  });
}
