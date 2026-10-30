// Unit tests for src/calc.js (no browser). Run with: npm run test:unit
const { test } = require('node:test');
const assert = require('node:assert/strict');
const BillSplit = require('../../src/calc.js');
const { RESULT_CASES, MORE_RESULT_CASES, SEQUENCE_CASES, ERROR_CASES, toCents, sumOfShares } = require('../criteria.js');

for (const c of [...RESULT_CASES, ...MORE_RESULT_CASES]) {
  test(`${c.id} ${c.name}`, () => {
    const outcome = BillSplit.calculate(c.input.bill, c.input.tip, c.input.people);
    assert.equal(outcome.ok, true);
    assert.deepEqual(outcome.lines, c.expected);
    // The shares always add up to exactly the Total.
    assert.equal(sumOfShares(outcome.lines.shares), toCents(c.expected.total.replace('Total: ', '')));
  });
}

for (const c of SEQUENCE_CASES) {
  test(`${c.id} ${c.name}`, () => {
    let input = {};
    for (const step of c.steps) {
      input = { ...input, ...(step.input || step.change) };
      const outcome = BillSplit.calculate(input.bill, input.tip, input.people);
      assert.equal(outcome.ok, true);
      assert.deepEqual(outcome.lines, step.expected);
    }
  });
}

// Each field's message must match exactly, including '' for fields that are fine.
for (const c of ERROR_CASES) {
  test(`${c.id} ${c.name}`, () => {
    const outcome = BillSplit.calculate(c.input.bill, c.input.tip, c.input.people);
    assert.equal(outcome.ok, false);
    assert.deepEqual(outcome.messages, c.messages);
    assert.equal(outcome.lines, undefined);
  });
}

test('Display rule: two decimal places, dot separator, no grouping or exponent', () => {
  assert.equal(BillSplit.formatMoney(0n), '0.00');
  assert.equal(BillSplit.formatMoney(5n), '0.05');
  assert.equal(BillSplit.formatMoney(2875n), '28.75');
  assert.equal(BillSplit.formatMoney(20000000000n), '200000000.00');
});

// Generated inputs across the whole allowed range, with a fixed seed so every run checks the same values.
function seededRandom(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatedInputs(count) {
  const random = seededRandom(20261031);
  const inputs = [];
  for (let i = 0; i < count; i++) {
    const digits = 1 + Math.floor(random() * 11);                    // bills from 0.01 up to 100000000.00
    let bill = BigInt(Math.floor(random() * 10 ** digits));
    if (bill < 1n) bill = 1n;
    if (bill > 10000000000n) bill = 10000000000n;
    const tip = BigInt(Math.floor(random() * 10001));                 // 0.00% to 100.00%, in hundredths
    const people = BigInt(1 + Math.floor(random() * 50));             // 1 to 50
    inputs.push({ bill, tip, people });
  }
  return inputs;
}

test('Calculation rule 2: tip is rounded to the nearest 0.01, exactly half rounds up (2,000 generated inputs)', () => {
  for (const { bill, tip, people } of generatedInputs(2000)) {
    const split = BillSplit.splitBill(bill, tip, people);
    // bill (cents) x tip (hundredths of a percent) is the exact tip in ten-thousandths of a cent.
    const difference = bill * tip - split.tip * 10000n;
    assert.ok(difference >= -5000n && difference < 5000n, `bill ${bill} tip ${tip}: tip ${split.tip}`);
    assert.equal(split.total, bill + split.tip);
  }
});

test('Calculation rule 4: shares add up to the total, differ by at most 0.01, extra cents go to the first people (2,000 generated inputs)', () => {
  for (const { bill, tip, people } of generatedInputs(2000)) {
    const split = BillSplit.splitBill(bill, tip, people);
    const shares = split.shares;
    const context = `bill ${bill} tip ${tip} people ${people}`;
    assert.equal(BigInt(shares.length), people, context);
    assert.equal(shares.reduce((a, b) => a + b, 0n), split.total, context);
    const largest = shares[0];
    const smallest = shares[shares.length - 1];
    assert.ok(largest - smallest <= 1n, context);
    for (let i = 1; i < shares.length; i++) assert.ok(shares[i] <= shares[i - 1], context);
    const paysMore = largest > smallest ? shares.filter((s) => s === largest).length : 0;
    assert.equal(BigInt(paysMore), split.leftover, context);
  }
});
