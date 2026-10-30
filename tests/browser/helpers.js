// Shared steps for the browser tests.
// Fields and buttons are found by their visible label, the way a person finds them.
// The result parts are found by id: #result, #result-tip, #result-total, #result-shares li, #result-note.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { expect } = require('@playwright/test');

const APP_URL = pathToFileURL(path.join(__dirname, '..', '..', 'src', 'index.html')).href;

const field = {
  bill: (page) => page.getByLabel('Bill amount', { exact: true }),
  tip: (page) => page.getByLabel('Tip percentage', { exact: true }),
  people: (page) => page.getByLabel('Number of people', { exact: true }),
};

const button = {
  calculate: (page) => page.getByRole('button', { name: 'Calculate', exact: true }),
  startOver: (page) => page.getByRole('button', { name: 'Start over', exact: true }),
};

async function openApp(page) {
  await page.goto(APP_URL);
}

async function fillForm(page, input) {
  await field.bill(page).fill(input.bill);
  await field.tip(page).fill(input.tip);
  await field.people(page).fill(input.people);
}

// Changes only the named fields, the way a person edits one value.
async function applyChange(page, change) {
  for (const [name, value] of Object.entries(change)) {
    await field[name](page).fill(value);
  }
}

// Each field's message (#bill-error, #tip-error, #people-error): exact text, shown directly
// under the field, and linked to the field so screen readers announce it with the field.
async function expectMessages(page, messages) {
  for (const [name, text] of Object.entries(messages)) {
    const input = field[name](page);
    const message = page.locator(`#${name}-error`);
    await expect(message).toHaveText(text);
    await expect(input).toHaveAccessibleDescription(text);
    if (!text) {
      await expect(input).not.toHaveAttribute('aria-invalid', 'true');
      continue;
    }
    await expect(message).toBeVisible();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    const inputBox = await input.boundingBox();
    const messageBox = await message.boundingBox();
    const gap = messageBox.y - (inputBox.y + inputBox.height);
    expect(gap, `${name} message should start just below the field`).toBeGreaterThanOrEqual(0);
    expect(gap, `${name} message should start just below the field`).toBeLessThan(24);
  }
}

async function expectResult(page, expected) {
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#result-tip')).toHaveText(expected.tip);
  await expect(page.locator('#result-total')).toHaveText(expected.total);
  await expect(page.locator('#result-shares li')).toHaveText(expected.shares);
  if (expected.note) {
    await expect(page.locator('#result-note')).toBeVisible();
    await expect(page.locator('#result-note')).toHaveText(expected.note);
  } else {
    await expect(page.locator('#result-note')).toBeHidden();
  }
}

module.exports = { APP_URL, field, button, openApp, fillForm, applyChange, expectMessages, expectResult };
