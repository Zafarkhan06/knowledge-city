// Bill splitting rules from docs/user-stories.md, as plain functions with no page access.
// Money is held as whole cents in BigInt, so no step ever uses floating-point arithmetic.
// index.html loads this as a classic script (it creates the global BillSplit);
// the Node unit tests load it with require.
var BillSplit = (function () {
  'use strict';

  // Exact text from the "Error messages" table in docs/user-stories.md.
  var MESSAGES = {
    bill: {
      empty: 'Enter the bill amount.',
      notNumber: 'Bill amount must be a number, for example 84.50.',
      decimals: 'Bill amount can have at most 2 decimal places.',
      range: 'Bill amount must be between 0.01 and 100000000.00.',
    },
    tip: {
      empty: 'Enter a tip percentage. Enter 0 for no tip.',
      notNumber: 'Tip percentage must be a number, for example 15.',
      decimals: 'Tip percentage can have at most 2 decimal places.',
      range: 'Tip percentage must be between 0 and 100.',
    },
    people: {
      empty: 'Enter the number of people.',
      notNumber: 'Number of people must be a number, for example 4.',
      whole: 'Number of people must be a whole number.',
      range: 'Number of people must be between 1 and 50.',
    },
  };

  // Inclusive limits: bill in cents, tip in hundredths of a percent, people as a count.
  var LIMITS = {
    bill: { min: 1n, max: 10000000000n },
    tip: { min: 0n, max: 10000n },
    people: { min: 1n, max: 50n },
  };

  // Optional minus, digits, at most one '.' or ',' decimal separator, more digits.
  var NUMBER_PATTERN = /^(-?)(\d*)([.,]?)(\d*)$/;

  // Splits typed text into its parts, or returns null if it is not a number at all.
  function readNumber(text) {
    var match = NUMBER_PATTERN.exec(String(text).trim());
    if (!match || (match[2] === '' && match[4] === '')) return null;
    return { negative: match[1] === '-', whole: match[2], separator: match[3], fraction: match[4] };
  }

  // Checks one field in the order the docs give: empty, not a number, starts with '-',
  // whole number or decimal places, range. Returns { value } or { message }.
  // Bill becomes cents and tip hundredths of a percent ('12.5' -> 1250n).
  function checkField(name, text) {
    var messages = MESSAGES[name];
    var limits = LIMITS[name];
    if (String(text).trim() === '') return { message: messages.empty };

    var number = readNumber(text);
    if (number === null) return { message: messages.notNumber };
    if (number.negative) return { message: messages.range };

    var value;
    if (name === 'people') {
      if (number.separator) return { message: messages.whole };
      value = BigInt(number.whole);
    } else {
      if (number.fraction.length > 2) return { message: messages.decimals };
      value = BigInt(number.whole || '0') * 100n + BigInt((number.fraction + '00').slice(0, 2));
    }
    if (value < limits.min || value > limits.max) return { message: messages.range };
    return { value: value };
  }

  // Calculation rules 2 to 4 in docs/user-stories.md.
  function splitBill(billCents, tipHundredths, people) {
    // Exact tip is bill x tip / 10000 cents. Adding 5000 before the whole-number division
    // rounds to the nearest cent with exactly half rounding up (every value here is >= 0).
    var tip = (billCents * tipHundredths + 5000n) / 10000n;
    var total = billCents + tip;
    var base = total / people;
    var leftover = total % people;
    var shares = [];
    for (var i = 0n; i < people; i++) shares.push(i < leftover ? base + 1n : base);
    return { tip: tip, total: total, shares: shares, leftover: leftover };
  }

  function formatMoney(cents) {
    return String(cents / 100n) + '.' + String(cents % 100n).padStart(2, '0');
  }

  function leftoverNote(leftover) {
    if (leftover === 0n) return '';
    if (leftover === 1n) return "The total doesn't split evenly, so Person 1 pays 0.01 more.";
    return "The total doesn't split evenly, so the first " + leftover + ' people each pay 0.01 more.';
  }

  // Typed text in; either the exact lines to show, or one message per field ('' if that field is fine).
  function calculate(billText, tipText, peopleText) {
    var bill = checkField('bill', billText);
    var tip = checkField('tip', tipText);
    var people = checkField('people', peopleText);
    if (bill.message || tip.message || people.message) {
      return {
        ok: false,
        messages: { bill: bill.message || '', tip: tip.message || '', people: people.message || '' },
      };
    }

    var split = splitBill(bill.value, tip.value, people.value);
    return {
      ok: true,
      lines: {
        tip: 'Tip: ' + formatMoney(split.tip),
        total: 'Total: ' + formatMoney(split.total),
        shares: split.shares.map(function (share, index) {
          return 'Person ' + (index + 1) + ': ' + formatMoney(share);
        }),
        note: leftoverNote(split.leftover),
      },
    };
  }

  return { calculate: calculate, splitBill: splitBill, formatMoney: formatMoney };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BillSplit;
