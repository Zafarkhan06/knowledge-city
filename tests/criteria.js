// Expected results copied from docs/user-stories.md.
// The unit tests and the browser tests both use this file, so they check exactly the same numbers.

// shareLines(['33.34', 1], ['33.33', 2]) -> ['Person 1: 33.34', 'Person 2: 33.33', 'Person 3: 33.33']
function shareLines(...groups) {
  const lines = [];
  for (const [amount, count] of groups) {
    for (let i = 0; i < count; i++) lines.push(`Person ${lines.length + 1}: ${amount}`);
  }
  return lines;
}

// '28.75' -> 2875n. Every amount on screen has exactly two decimal places.
function toCents(amount) {
  return BigInt(amount.replace('.', ''));
}

function sumOfShares(lines) {
  return lines.reduce((sum, line) => sum + toCents(line.split(': ')[1]), 0n);
}

// Criteria in S-1 and S-2 that enter three values, press Calculate and check the result.
const RESULT_CASES = [
  {
    id: 'S-1.2', name: 'normal case, splits evenly',
    input: { bill: '100.00', tip: '15', people: '4' },
    expected: { tip: 'Tip: 15.00', total: 'Total: 115.00', shares: shareLines(['28.75', 4]), note: '' },
  },
  {
    id: 'S-1.3', name: 'five people',
    input: { bill: '250.00', tip: '18', people: '5' },
    expected: { tip: 'Tip: 45.00', total: 'Total: 295.00', shares: shareLines(['59.00', 5]), note: '' },
  },
  {
    id: 'S-1.4', name: 'bill with no decimals and zero tip',
    input: { bill: '60', tip: '0', people: '2' },
    expected: { tip: 'Tip: 0.00', total: 'Total: 60.00', shares: shareLines(['30.00', 2]), note: '' },
  },
  {
    id: 'S-1.5', name: 'decimal tip',
    input: { bill: '80.00', tip: '12.5', people: '2' },
    expected: { tip: 'Tip: 10.00', total: 'Total: 90.00', shares: shareLines(['45.00', 2]), note: '' },
  },
  {
    id: 'S-1.6', name: 'one person',
    input: { bill: '47.30', tip: '20', people: '1' },
    expected: { tip: 'Tip: 9.46', total: 'Total: 56.76', shares: shareLines(['56.76', 1]), note: '' },
  },
  {
    id: 'S-1.7', name: 'comma as decimal separator',
    input: { bill: '12,50', tip: '10', people: '2' },
    expected: {
      tip: 'Tip: 1.25', total: 'Total: 13.75', shares: shareLines(['6.88', 1], ['6.87', 1]),
      note: "The total doesn't split evenly, so Person 1 pays 0.01 more.",
    },
  },
  {
    id: 'S-1.8', name: 'spaces around the bill amount are ignored',
    input: { bill: ' 100 ', tip: '15', people: '4' },
    expected: { tip: 'Tip: 15.00', total: 'Total: 115.00', shares: shareLines(['28.75', 4]), note: '' },
  },
  {
    id: 'S-2.1', name: '100.00 split 3 ways, Person 1 pays the leftover cent',
    input: { bill: '100.00', tip: '0', people: '3' },
    expected: {
      tip: 'Tip: 0.00', total: 'Total: 100.00', shares: shareLines(['33.34', 1], ['33.33', 2]),
      note: "The total doesn't split evenly, so Person 1 pays 0.01 more.",
    },
  },
  {
    id: 'S-2.2', name: 'two leftover cents',
    input: { bill: '84.50', tip: '18', people: '3' },
    expected: {
      tip: 'Tip: 15.21', total: 'Total: 99.71', shares: shareLines(['33.24', 2], ['33.23', 1]),
      note: "The total doesn't split evenly, so the first 2 people each pay 0.01 more.",
    },
  },
  {
    id: 'S-2.3', name: '49 leftover cents across 50 people',
    input: { bill: '0.99', tip: '0', people: '50' },
    expected: {
      tip: 'Tip: 0.00', total: 'Total: 0.99', shares: shareLines(['0.02', 49], ['0.01', 1]),
      note: "The total doesn't split evenly, so the first 49 people each pay 0.01 more.",
    },
  },
  {
    id: 'S-2.4', name: 'exactly half a cent rounds up',
    input: { bill: '10.05', tip: '10', people: '1' },
    expected: { tip: 'Tip: 1.01', total: 'Total: 11.06', shares: shareLines(['11.06', 1]), note: '' },
  },
  {
    id: 'S-2.5', name: 'less than half a cent rounds down',
    input: { bill: '10.01', tip: '15', people: '1' },
    expected: { tip: 'Tip: 1.50', total: 'Total: 11.51', shares: shareLines(['11.51', 1]), note: '' },
  },
  {
    id: 'S-2.6', name: 'half a cent with a decimal tip rounds up',
    input: { bill: '10.04', tip: '12.5', people: '1' },
    expected: { tip: 'Tip: 1.26', total: 'Total: 11.30', shares: shareLines(['11.30', 1]), note: '' },
  },
  {
    id: 'S-2.7', name: 'no floating-point noise',
    input: { bill: '0.20', tip: '50', people: '1' },
    expected: { tip: 'Tip: 0.10', total: 'Total: 0.30', shares: shareLines(['0.30', 1]), note: '' },
    absentFromPage: ['0.30000000000000004'],
  },
  {
    id: 'S-2.8', name: 'very large: maximum bill at 100% tip',
    input: { bill: '100000000.00', tip: '100', people: '1' },
    expected: { tip: 'Tip: 100000000.00', total: 'Total: 200000000.00', shares: shareLines(['200000000.00', 1]), note: '' },
    absentFromPage: ['e+'],
  },
  {
    id: 'S-2.9', name: 'very large, 50 people',
    input: { bill: '100000000.00', tip: '15', people: '50' },
    expected: { tip: 'Tip: 15000000.00', total: 'Total: 115000000.00', shares: shareLines(['2300000.00', 50]), note: '' },
  },
  {
    id: 'S-2.10', name: 'very small: tip rounds to 0.00',
    input: { bill: '0.01', tip: '15', people: '1' },
    expected: { tip: 'Tip: 0.00', total: 'Total: 0.01', shares: shareLines(['0.01', 1]), note: '' },
  },
  {
    id: 'S-2.11', name: 'total smaller than the number of people',
    input: { bill: '0.03', tip: '0', people: '5' },
    expected: {
      tip: 'Tip: 0.00', total: 'Total: 0.03', shares: shareLines(['0.01', 3], ['0.00', 2]),
      note: "The total doesn't split evenly, so the first 3 people each pay 0.01 more.",
    },
  },
];

// Exact message text from the "Error messages" table in docs/user-stories.md.
const MESSAGES = {
  billEmpty: 'Enter the bill amount.',
  billNotNumber: 'Bill amount must be a number, for example 84.50.',
  billDecimals: 'Bill amount can have at most 2 decimal places.',
  billRange: 'Bill amount must be between 0.01 and 100000000.00.',
  tipEmpty: 'Enter a tip percentage. Enter 0 for no tip.',
  tipNotNumber: 'Tip percentage must be a number, for example 15.',
  tipDecimals: 'Tip percentage can have at most 2 decimal places.',
  tipRange: 'Tip percentage must be between 0 and 100.',
  peopleEmpty: 'Enter the number of people.',
  peopleNotNumber: 'Number of people must be a number, for example 4.',
  peopleWhole: 'Number of people must be a whole number.',
  peopleRange: 'Number of people must be between 1 and 50.',
};
const M = MESSAGES;

// In S-3 and S-4 the fields not under test hold these values and show no message.
const VALID = { bill: '100.00', tip: '15', people: '4' };
const NO_MESSAGES = { bill: '', tip: '', people: '' };

// One case per input value: that field gets the message, the other two stay valid and silent.
function oneFieldWrong(id, name, fieldName, values, message) {
  return values.map((value) => ({
    id,
    name: `${name}: ${fieldName} ${JSON.stringify(value)}`,
    input: { ...VALID, [fieldName]: value },
    messages: { ...NO_MESSAGES, [fieldName]: message },
  }));
}

// Criteria in S-3 and S-4 where pressing Calculate shows messages and no result.
const ERROR_CASES = [
  {
    id: 'S-3.1', name: 'all three fields empty',
    input: { bill: '', tip: '', people: '' },
    messages: { bill: M.billEmpty, tip: M.tipEmpty, people: M.peopleEmpty },
  },
  ...oneFieldWrong('S-3.2', 'only spaces', 'bill', ['   '], M.billEmpty),
  ...oneFieldWrong('S-3.3', 'text in bill', 'bill', ['abc', '$50', '1e3', '1 000', '1,000.00'], M.billNotNumber),
  ...oneFieldWrong('S-3.4', 'negative bill', 'bill', ['-20'], M.billRange),
  ...oneFieldWrong('S-3.5', 'too many decimals in bill', 'bill', ['12.345', '1,000'], M.billDecimals),
  ...oneFieldWrong('S-3.6', 'text in tip', 'tip', ['abc', '15%'], M.tipNotNumber),
  ...oneFieldWrong('S-3.7', 'negative tip', 'tip', ['-5'], M.tipRange),
  ...oneFieldWrong('S-3.8', 'too many decimals in tip', 'tip', ['12.555'], M.tipDecimals),
  ...oneFieldWrong('S-3.9', 'empty tip is not treated as 0', 'tip', [''], M.tipEmpty),
  ...oneFieldWrong('S-3.10', 'text in people', 'people', ['abc', 'four'], M.peopleNotNumber),
  ...oneFieldWrong('S-3.11', 'decimal people', 'people', ['2.5', '4.0', '3,5'], M.peopleWhole),
  ...oneFieldWrong('S-3.12', 'negative people', 'people', ['-3'], M.peopleRange),
  {
    id: 'S-3.13', name: 'several errors at once',
    input: { bill: 'abc', tip: '-5', people: '2.5' },
    messages: { bill: M.billNotNumber, tip: M.tipRange, people: M.peopleWhole },
  },
  ...oneFieldWrong('S-3.18', 'people with a separator at either end', 'people', ['.5', ',5', '5.', '5,'], M.peopleWhole),
  ...oneFieldWrong('S-3.19', 'minus zero in tip', 'tip', ['-0', '-0.00'], M.tipRange),
  ...oneFieldWrong('S-3.20', 'minus sign before the decimal-places check', 'bill', ['-12.345'], M.billRange),
  ...oneFieldWrong('S-3.21', 'minus sign before the whole-number check', 'people', ['-2.5'], M.peopleRange),
  ...oneFieldWrong('S-4.2', 'below bill minimum', 'bill', ['0', '0.00'], M.billRange),
  ...oneFieldWrong('S-4.4', 'above bill maximum', 'bill', ['100000000.01', '99999999999999999999'], M.billRange),
  ...oneFieldWrong('S-4.6', 'above tip maximum', 'tip', ['100.01', '150'], M.tipRange),
  ...oneFieldWrong('S-4.8', 'outside people range', 'people', ['0', '51'], M.peopleRange),
  {
    id: 'S-4.2+S-4.6+S-4.8', name: 'slice 1 gap closed: bill 0, tip 150, 51 people together',
    input: { bill: '0', tip: '150', people: '51' },
    messages: { bill: M.billRange, tip: M.tipRange, people: M.peopleRange },
  },
];

// Criteria in S-3 and S-4 that give a result.
const MORE_RESULT_CASES = [
  ...['.5', ',5'].map((bill) => ({
    id: 'S-3.15', name: `bill starting with a separator: ${JSON.stringify(bill)}`,
    input: { bill, tip: '0', people: '1' },
    expected: { tip: 'Tip: 0.00', total: 'Total: 0.50', shares: shareLines(['0.50', 1]), note: '' },
  })),
  ...['5.', '5,'].map((bill) => ({
    id: 'S-3.16', name: `bill ending with a separator: ${JSON.stringify(bill)}`,
    input: { bill, tip: '0', people: '1' },
    expected: { tip: 'Tip: 0.00', total: 'Total: 5.00', shares: shareLines(['5.00', 1]), note: '' },
  })),
  {
    id: 'S-4.1', name: 'bill minimum',
    input: { bill: '0.01', tip: '0', people: '1' },
    expected: { tip: 'Tip: 0.00', total: 'Total: 0.01', shares: shareLines(['0.01', 1]), note: '' },
  },
  {
    id: 'S-4.3', name: 'bill maximum',
    input: { bill: '100000000.00', tip: '0', people: '1' },
    expected: { tip: 'Tip: 0.00', total: 'Total: 100000000.00', shares: shareLines(['100000000.00', 1]), note: '' },
  },
];

// Criteria that calculate, change one field, and calculate again.
const SEQUENCE_CASES = [
  ...[['.5', '5.'], [',5', '5,']].map(([first, second]) => ({
    id: 'S-3.17', name: `tip starting then ending with a separator: ${JSON.stringify(first)} then ${JSON.stringify(second)}`,
    steps: [
      {
        input: { bill: '100.00', tip: first, people: '1' },
        expected: { tip: 'Tip: 0.50', total: 'Total: 100.50', shares: shareLines(['100.50', 1]), note: '' },
      },
      {
        change: { tip: second },
        expected: { tip: 'Tip: 5.00', total: 'Total: 105.00', shares: shareLines(['105.00', 1]), note: '' },
      },
    ],
  })),
  {
    id: 'S-4.5', name: 'tip minimum then maximum',
    steps: [
      {
        input: { bill: '100.00', tip: '0', people: '1' },
        expected: { tip: 'Tip: 0.00', total: 'Total: 100.00', shares: shareLines(['100.00', 1]), note: '' },
      },
      {
        change: { tip: '100' },
        expected: { tip: 'Tip: 100.00', total: 'Total: 200.00', shares: shareLines(['200.00', 1]), note: '' },
      },
    ],
  },
  {
    id: 'S-4.7', name: 'people minimum then maximum',
    steps: [
      {
        input: { bill: '100.00', tip: '0', people: '1' },
        expected: { tip: 'Tip: 0.00', total: 'Total: 100.00', shares: shareLines(['100.00', 1]), note: '' },
      },
      {
        change: { people: '50' },
        expected: { tip: 'Tip: 0.00', total: 'Total: 100.00', shares: shareLines(['2.00', 50]), note: '' },
      },
    ],
  },
];

module.exports = {
  RESULT_CASES, MORE_RESULT_CASES, SEQUENCE_CASES, ERROR_CASES, MESSAGES, NO_MESSAGES,
  shareLines, toCents, sumOfShares,
};
