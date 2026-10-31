// Slice 3: S-5 (change a number after a result or an error) and S-6 (start over).
const { test, expect } = require('@playwright/test');
const { RESULT_CASES, MESSAGES: M, NO_MESSAGES, shareLines } = require('../criteria.js');
const { field, button, openApp, fillForm, expectMessages, expectResult } = require('./helpers.js');

const S_1_2 = RESULT_CASES.find((c) => c.id === 'S-1.2');
const EMPTY = { bill: '', tip: '', people: '' };

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

async function showS12Result(page) {
  await fillForm(page, S_1_2.input);
  await button.calculate(page).click();
  await expectResult(page, S_1_2.expected);
}

async function expectFieldValues(page, values) {
  for (const [name, value] of Object.entries(values)) {
    await expect(field[name](page)).toHaveValue(value);
  }
}

// Clicks into the field and types key by key, the way a person enters a new value.
async function typeInto(page, name, value) {
  await field[name](page).click();
  await field[name](page).pressSequentially(value);
}

test('S-5.1 editing a field removes the whole result straight away and keeps the values', async ({ page }) => {
  await showS12Result(page);
  // The cursor stays in the field: the result must go on the edit itself, not when the field loses focus.
  await field.people(page).fill('5');
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.getByText('Tip: 15.00')).toBeHidden();
  await expect(field.people(page)).toBeFocused();
  await expectFieldValues(page, { bill: '100.00', tip: '15', people: '5' });
});

test('S-5.2 calculating after the edit gives the new result', async ({ page }) => {
  await showS12Result(page);
  await field.people(page).fill('5');
  await button.calculate(page).click();
  await expectResult(page, { tip: 'Tip: 15.00', total: 'Total: 115.00', shares: shareLines(['23.00', 5]), note: '' });
});

test('S-5.3 changing the tip and calculating again', async ({ page }) => {
  await showS12Result(page);
  await field.tip(page).fill('20');
  await button.calculate(page).click();
  await expectResult(page, { tip: 'Tip: 20.00', total: 'Total: 120.00', shares: shareLines(['30.00', 4]), note: '' });
});

test("S-5.4 fixing one field removes only that field's message", async ({ page }) => {
  await fillForm(page, { bill: 'abc', tip: '15', people: '' });
  await button.calculate(page).click();
  await expectMessages(page, { bill: M.billNotNumber, tip: '', people: M.peopleEmpty });
  await field.bill(page).fill('100');
  await expectMessages(page, { bill: '', tip: '', people: M.peopleEmpty });
});

test('S-5.5 fixing every field gives the result and no messages', async ({ page }) => {
  await fillForm(page, { bill: 'abc', tip: '15', people: '' });
  await button.calculate(page).click();
  await field.bill(page).fill('100');
  await field.people(page).fill('4');
  await button.calculate(page).click();
  await expectResult(page, S_1_2.expected);
  await expectMessages(page, NO_MESSAGES);
});

test('S-5.6 an invalid edit after a result does not bring the old result back', async ({ page }) => {
  await showS12Result(page);
  await field.bill(page).fill('abc');
  await button.calculate(page).click();
  await expectMessages(page, { bill: M.billNotNumber, tip: '', people: '' });
  await expect(page.locator('#result')).toBeHidden();
});

test('S-5.7 calculating twice shows the result once', async ({ page }) => {
  await showS12Result(page);
  await button.calculate(page).click();
  await expectResult(page, S_1_2.expected);
  await expect(page.getByText('Total: 115.00', { exact: true })).toHaveCount(1);
});

test('S-6.1 Start over clears a result, empties the fields and puts the cursor in Bill amount', async ({ page }) => {
  await showS12Result(page);
  await button.startOver(page).click();
  await expectFieldValues(page, EMPTY);
  await expect(page.locator('#result')).toBeHidden();
  await expectMessages(page, NO_MESSAGES);
  await expect(field.bill(page)).toBeFocused();
});

test('S-6.2 Start over clears error messages', async ({ page }) => {
  await fillForm(page, EMPTY);
  await button.calculate(page).click();
  await expectMessages(page, { bill: M.billEmpty, tip: M.tipEmpty, people: M.peopleEmpty });
  await button.startOver(page).click();
  await expectFieldValues(page, EMPTY);
  await expectMessages(page, NO_MESSAGES);
});

test('S-6.3 a new bill after starting over shows nothing from the earlier bill', async ({ page }) => {
  await showS12Result(page);
  await button.startOver(page).click();
  await typeInto(page, 'bill', '60');
  await typeInto(page, 'tip', '0');
  await typeInto(page, 'people', '2');
  await button.calculate(page).click();
  await expectResult(page, { tip: 'Tip: 0.00', total: 'Total: 60.00', shares: shareLines(['30.00', 2]), note: '' });
  await expectMessages(page, NO_MESSAGES);
});

test('S-6.4 Start over on an untouched page changes nothing', async ({ page }) => {
  await button.startOver(page).click();
  await expectFieldValues(page, EMPTY);
  await expect(page.locator('#result')).toBeHidden();
  await expectMessages(page, NO_MESSAGES);
  for (const text of Object.values(M)) {
    await expect(page.locator('body')).not.toContainText(text);
  }
});
