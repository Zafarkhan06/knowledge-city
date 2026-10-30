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

module.exports = { RESULT_CASES, shareLines, toCents, sumOfShares };
