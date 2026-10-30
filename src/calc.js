// Bill splitting rules from docs/user-stories.md, as plain functions with no page access.
// Money is held as whole cents in BigInt, so no step ever uses floating-point arithmetic.
// index.html loads this as a classic script (it creates the global BillSplit);
// the Node unit tests load it with require.
var BillSplit = (function () {
  'use strict';

  // Optional minus, digits, at most one '.' or ',' decimal separator, more digits.
  var NUMBER_PATTERN = /^(-?)(\d*)([.,]?)(\d*)$/;

  // Splits typed text into its parts, or returns null if it is not a number at all.
  function readNumber(text) {
    var match = NUMBER_PATTERN.exec(String(text).trim());
    if (!match || (match[2] === '' && match[4] === '')) return null;
    return { negative: match[1] === '-', whole: match[2], separator: match[3], fraction: match[4] };
  }

  // Bill amount to cents, Tip percentage to hundredths of a percent ('12.5' -> 1250n).
  // Returns null for input that can't be used; the messages for it arrive with S-3 and S-4.
  function parseHundredths(text) {
    var number = readNumber(text);
    if (number === null || number.negative || number.fraction.length > 2) return null;
    return BigInt(number.whole || '0') * 100n + BigInt((number.fraction + '00').slice(0, 2));
  }

  function parsePeople(text) {
    var number = readNumber(text);
    if (number === null || number.negative || number.separator) return null;
    var people = BigInt(number.whole);
    return people >= 1n ? people : null;
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

  // Typed text in, the exact lines to show out.
  function calculate(billText, tipText, peopleText) {
    var bill = parseHundredths(billText);
    var tip = parseHundredths(tipText);
    var people = parsePeople(peopleText);
    if (bill === null || tip === null || people === null) return { ok: false };

    var split = splitBill(bill, tip, people);
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
