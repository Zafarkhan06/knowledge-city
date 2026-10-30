# User stories

Roles are defined in [app-roles.md](app-roles.md) and jobs in [jobs-to-be-done.md](jobs-to-be-done.md). Each story serves at least one job. A status only changes after every criterion for that story has been checked in the running app, by an automated browser test or by hand.

| ID | Role | Story | Serves | Priority | Status |
|---|---|---|---|---|---|
| S-1 | Bill Payer | Split a bill equally, including the tip | J-1 | Must | Implemented |
| S-2 | Bill Payer | Shares always add up exactly, and leftover cents go to named people | J-2 | Must | Implemented |
| S-3 | Bill Payer | Clear messages for numbers the app can't use | J-3 | Must | Not implemented |
| S-4 | Bill Payer | Allowed range for each input | J-3 | Must | Not implemented |
| S-5 | Bill Payer | Change a number after a result or an error | J-4 | Must | Not implemented |
| S-6 | Bill Payer | Start over | J-4 | Must | Not implemented |
| S-7 | Bill Payer | Works on phone and desktop | J-1 | Must | Not implemented |
| S-8 | Group Organiser | Each person pays for what they had plus their part of the tip | J-5 | Later | Not implemented |
| S-9 | Group Organiser | Clear messages that name the person whose amount is wrong | J-3 | Later | Not implemented |
| S-10 | Bill Payer | Number keyboard on a phone | J-1 | Must | Not implemented |

Delivery requirements D-1 and D-2 (how the build is run and checked) are at the end of this document. They are not stories, because no role wants them.

---

## Shared rules

These rules apply to every story. The acceptance criteria quote the exact text defined here.

### Assumptions

- **A-1 Currency.** Amounts are shown with two decimal places and no currency symbol, so the app works for any currency that uses two decimal places. Currencies with no minor unit (for example JPY, KRW) still show `.00`. Currencies with three decimal places (for example KWD, BHD) are limited to two.
- **A-2 What the tip is calculated on.** The Bill amount is the final amount on the bill, including any tax and service charge, and the tip is a percentage of that amount. Tipping on a pre-tax subtotal is not supported in the first build. If service is already included, the person enters a tip of 0.
- **A-3 Tip type.** The tip is a percentage, not a fixed amount.
- **A-4 Decimal separator.** Both `.` and `,` are accepted as the decimal separator, because the number keyboard on phones set to many European and South American languages only offers a comma. I believe this is true of the iPhone decimal keypad but have not checked it on a device. The consequence is that thousands separators are not accepted: `1,000` is read as 1 with three decimal places and rejected. It never silently becomes 1000 or 1.00. Results always use `.`.
- **A-5 Limits.** The Bill amount allows up to 100000000.00 so that currencies with large numbers (for example IDR, VND, where a group dinner can cost millions) still fit. The Number of people allows up to 50, which covers a large table; beyond that it is an event, not a bill split. The Tip percentage allows up to 100, because anything higher is almost certainly a typo (150 for 15.0). Exact whole-cent arithmetic stays safe far beyond these limits.
- **A-6 Starting state.** All fields start empty. There is no default tip or number of people, and nothing is remembered between visits. An empty tip is an error, not 0, so a forgotten tip is never silently treated as no tip.
- **A-7 When results appear.** Results appear when the person presses Calculate (or Enter in a field), not while typing, so error messages don't flash up halfway through typing a number. Any edit removes the result.
- **A-8 People are numbered, not named.** Leftover cents go to Person 1 first, then Person 2, and so on. If the person who paid counts themselves as Person 1, they absorb the odd cent and nobody else is asked for it.
- **A-9 Shares of 0.00.** If the total in cents is smaller than the number of people (for example 0.03 split between 5), some people are shown 0.00. This is correct, so it is not treated as an error.
- **A-10 Plain text inputs.** The fields are plain text inputs that ask the phone for a number keyboard. They are not browser number fields, because those block or silently empty some inputs (letters in Chrome, `12,50` in some languages), which would make the app's own messages inconsistent between browsers and impossible to test.
- **A-11 One line per person.** The result lists every person on their own line, even with 50 people.
- **A-12 No network use.** Nothing is saved or sent anywhere, and the page loads nothing except its own files.

### What is on the page (first build)

- Three fields, in this order: **Bill amount**, **Tip percentage**, **Number of people**. All start empty.
- Two buttons: **Calculate** and **Start over**. Pressing Enter in any field does the same as pressing Calculate.

### Inputs and limits

| Input | Accepts | Minimum | Maximum | Decimal places |
|---|---|---|---|---|
| Bill amount | a number | 0.01 | 100000000.00 | 0, 1 or 2 |
| Tip percentage | a number | 0 | 100 | 0, 1 or 2 |
| Number of people | a whole number | 1 | 50 | none |

Both limits are inclusive: 0.01, 100000000.00, 0, 100, 1 and 50 are all accepted.

### Number format

- Spaces before and after the number are ignored (` 100 ` is read as 100).
- A number is an optional leading `-`, then digits with at most one decimal separator, which can be `.` or `,`. There must be at least one digit. The digits can be on one side of the separator only: `.5` and `,5` are read as 0.50, and `5.` and `5,` are read as 5.00. This applies to Bill amount and Tip percentage.
- Anything else counts as "not a number": letters, currency symbols, `%`, spaces inside the number, a `+` sign, exponents such as `1e3`, more than one separator (`1,000.00`, `1.000.000`), or a `-`, `.` or `,` with no digits.
- Any number that starts with `-` gets the range message for its field, whatever follows. This includes `-0` and `-0.00`, and it takes priority over the decimal-places and whole-number messages, so `-12.345` in Bill amount and `-2.5` in Number of people both get the range message.
- In Number of people, any decimal separator at all (`2.5`, `4.0`, `3,5`, `.5`, `5.`) gets the "whole number" message, unless the number starts with `-`.

### Error messages (exact text)

Each field shows at most one message: the first one in this order that applies (empty, then not a number, then starts with `-` (range message), then whole number or decimal places, then range). The message appears directly under its field.

| Field | Problem | Example inputs | Message |
|---|---|---|---|
| Bill amount | empty or only spaces | *(nothing)* | `Enter the bill amount.` |
| Bill amount | not a number | `abc`, `$50`, `1e3`, `1 000`, `1,000.00` | `Bill amount must be a number, for example 84.50.` |
| Bill amount | more than 2 decimal places | `12.345`, `1,000` | `Bill amount can have at most 2 decimal places.` |
| Bill amount | below 0.01 or above 100000000.00, or starts with `-` | `0`, `-20`, `-12.345`, `100000000.01` | `Bill amount must be between 0.01 and 100000000.00.` |
| Tip percentage | empty or only spaces | *(nothing)* | `Enter a tip percentage. Enter 0 for no tip.` |
| Tip percentage | not a number | `abc`, `15%` | `Tip percentage must be a number, for example 15.` |
| Tip percentage | more than 2 decimal places | `12.555` | `Tip percentage can have at most 2 decimal places.` |
| Tip percentage | below 0 or above 100, or starts with `-` | `-5`, `-0`, `-0.00`, `100.01`, `150` | `Tip percentage must be between 0 and 100.` |
| Number of people | empty or only spaces | *(nothing)* | `Enter the number of people.` |
| Number of people | not a number | `abc`, `four` | `Number of people must be a number, for example 4.` |
| Number of people | not a whole number | `2.5`, `4.0`, `3,5`, `.5`, `5.` | `Number of people must be a whole number.` |
| Number of people | below 1 or above 50, or starts with `-` | `0`, `-3`, `-2.5`, `51` | `Number of people must be between 1 and 50.` |

While any field has an error, no result is shown.

### How amounts are calculated

1. Every amount is worked out exactly, as a whole number of cents (hundredths). No step uses approximate floating-point arithmetic, so a result like `0.30000000000000004` or a cent lost to rounding error cannot happen.
2. **Tip** = Bill amount × Tip percentage ÷ 100, rounded to the nearest 0.01. Exactly half a cent rounds up. Examples: 10% of 10.05 is 1.005, which becomes 1.01; 15% of 10.01 is 1.5015, which becomes 1.50.
3. **Total** = Bill amount + Tip.
4. **Shares (leftover-cent rule).** Each person's share is Total ÷ Number of people, rounded down to 0.01. The cents left over (always fewer than the number of people) are given out one each to Person 1, Person 2, Person 3 and so on, in order. So shares differ by at most 0.01, anyone who pays more is at the top of the list, and the shares always add up to exactly the Total.

### How results are shown

- Every amount has exactly two decimal places, uses `.` as the decimal separator, and has no thousands separators and no currency symbol: `0.00`, `28.75`, `200000000.00`.
- After a successful Calculate the result shows, in this order:
  1. `Tip: X`
  2. `Total: Y`
  3. one line per person, from Person 1 down: `Person 1: Z`, `Person 2: Z`, and so on
  4. only when there are leftover cents, one note:
     - one leftover cent: `The total doesn't split evenly, so Person 1 pays 0.01 more.`
     - N leftover cents, where N is 2 or more: `The total doesn't split evenly, so the first N people each pay 0.01 more.`
- The page never shows `NaN`, `Infinity`, `undefined`, or a number in exponent form such as `1e+21`.
- Changing any field removes the whole result straight away, so an old result is never shown next to changed numbers. Changing a field also removes that field's own error message. Other fields' messages stay until Calculate is pressed again.

---

## Stories

### S-1 Split a bill equally, including the tip

As a Bill Payer, I want to enter the bill amount, a tip percentage and the number of people and get the tip, the total and what each person pays, so that I can tell everyone what they owe straight away.

- **Serves:** J-1
- **Priority:** Must
- **Status:** Implemented

**Acceptance criteria**

- **S-1.1** Given I have a current browser, when I open the page, then I see empty fields labelled "Bill amount", "Tip percentage" and "Number of people", a "Calculate" button and a "Start over" button, and no result and no error messages.
- **S-1.2** Given Bill amount is `100.00`, Tip percentage is `15` and Number of people is `4`, when I press Calculate, then I see `Tip: 15.00`, `Total: 115.00`, then `Person 1: 28.75`, `Person 2: 28.75`, `Person 3: 28.75`, `Person 4: 28.75`, and no leftover note.
- **S-1.3** Given Bill amount is `250.00`, Tip percentage is `18` and Number of people is `5`, when I press Calculate, then I see `Tip: 45.00`, `Total: 295.00`, and `Person 1: 59.00` through `Person 5: 59.00` (five lines, all 59.00).
- **S-1.4** Given Bill amount is `60` (no decimals), Tip percentage is `0` and Number of people is `2`, when I press Calculate, then I see `Tip: 0.00`, `Total: 60.00`, `Person 1: 30.00`, `Person 2: 30.00`.
- **S-1.5** Given Bill amount is `80.00`, Tip percentage is `12.5` and Number of people is `2`, when I press Calculate, then I see `Tip: 10.00`, `Total: 90.00`, `Person 1: 45.00`, `Person 2: 45.00`.
- **S-1.6** Given Bill amount is `47.30`, Tip percentage is `20` and Number of people is `1`, when I press Calculate, then I see `Tip: 9.46`, `Total: 56.76`, `Person 1: 56.76`.
- **S-1.7** Given Bill amount is `12,50` (comma as decimal separator), Tip percentage is `10` and Number of people is `2`, when I press Calculate, then I see `Tip: 1.25`, `Total: 13.75`, `Person 1: 6.88`, `Person 2: 6.87`, and the note `The total doesn't split evenly, so Person 1 pays 0.01 more.`
- **S-1.8** Given Bill amount is ` 100 ` (with spaces before and after), Tip percentage is `15` and Number of people is `4`, when I press Calculate, then I see the same result as S-1.2.
- **S-1.9** Given the values from S-1.2 are entered, when I press Enter while the cursor is in any one of the three fields, then I see the same result as S-1.2.

### S-2 Shares always add up exactly, and leftover cents go to named people

As a Bill Payer, I want the shares to always add up to exactly the total, with any leftover cents going to people named in the result, so that I collect exactly what I paid and can explain the odd cent to the table.

- **Serves:** J-2
- **Priority:** Must
- **Status:** Implemented

**Acceptance criteria**

- **S-2.1** Given Bill amount is `100.00`, Tip percentage is `0` and Number of people is `3`, when I press Calculate, then I see `Tip: 0.00`, `Total: 100.00`, `Person 1: 33.34`, `Person 2: 33.33`, `Person 3: 33.33`, and the note `The total doesn't split evenly, so Person 1 pays 0.01 more.` The three shares add up to exactly 100.00.
- **S-2.2** Given Bill amount is `84.50`, Tip percentage is `18` and Number of people is `3`, when I press Calculate, then I see `Tip: 15.21`, `Total: 99.71`, `Person 1: 33.24`, `Person 2: 33.24`, `Person 3: 33.23`, and the note `The total doesn't split evenly, so the first 2 people each pay 0.01 more.` The shares add up to exactly 99.71.
- **S-2.3** Given Bill amount is `0.99`, Tip percentage is `0` and Number of people is `50`, when I press Calculate, then I see `Tip: 0.00`, `Total: 0.99`, `Person 1: 0.02` through `Person 49: 0.02` (49 lines, all 0.02), `Person 50: 0.01`, and the note `The total doesn't split evenly, so the first 49 people each pay 0.01 more.` The shares add up to exactly 0.99.
- **S-2.4** (exactly half a cent rounds up) Given Bill amount is `10.05`, Tip percentage is `10` and Number of people is `1`, when I press Calculate, then I see `Tip: 1.01`, `Total: 11.06`, `Person 1: 11.06`. (10% of 10.05 is exactly 1.005. A plain floating-point calculation gives 1.00 here, so this criterion catches it.)
- **S-2.5** (less than half a cent rounds down) Given Bill amount is `10.01`, Tip percentage is `15` and Number of people is `1`, when I press Calculate, then I see `Tip: 1.50`, `Total: 11.51`, `Person 1: 11.51`.
- **S-2.6** (half a cent with a decimal tip) Given Bill amount is `10.04`, Tip percentage is `12.5` and Number of people is `1`, when I press Calculate, then I see `Tip: 1.26`, `Total: 11.30`, `Person 1: 11.30`. (12.5% of 10.04 is exactly 1.255. A plain floating-point calculation gives 1.25.)
- **S-2.7** (no floating-point noise) Given Bill amount is `0.20`, Tip percentage is `50` and Number of people is `1`, when I press Calculate, then I see `Tip: 0.10`, `Total: 0.30`, `Person 1: 0.30`, and nowhere on the page does `0.30000000000000004` appear.
- **S-2.8** (very large) Given Bill amount is `100000000.00`, Tip percentage is `100` and Number of people is `1`, when I press Calculate, then I see `Tip: 100000000.00`, `Total: 200000000.00`, `Person 1: 200000000.00`, with no exponent form, no thousands separators and no rounding.
- **S-2.9** (very large, many people) Given Bill amount is `100000000.00`, Tip percentage is `15` and Number of people is `50`, when I press Calculate, then I see `Tip: 15000000.00`, `Total: 115000000.00`, and `Person 1: 2300000.00` through `Person 50: 2300000.00` (50 lines), and no leftover note.
- **S-2.10** (very small) Given Bill amount is `0.01`, Tip percentage is `15` and Number of people is `1`, when I press Calculate, then I see `Tip: 0.00`, `Total: 0.01`, `Person 1: 0.01`.
- **S-2.11** (total smaller than the number of people) Given Bill amount is `0.03`, Tip percentage is `0` and Number of people is `5`, when I press Calculate, then I see `Tip: 0.00`, `Total: 0.03`, `Person 1: 0.01`, `Person 2: 0.01`, `Person 3: 0.01`, `Person 4: 0.00`, `Person 5: 0.00`, and the note `The total doesn't split evenly, so the first 3 people each pay 0.01 more.`

### S-3 Clear messages for numbers the app can't use

As a Bill Payer, I want a clear message next to any number the app can't use, and no result until I fix it, so that a typo never turns into a wrong amount.

- **Serves:** J-3
- **Priority:** Must
- **Status:** Not implemented

In S-3.2 to S-3.12 and S-3.18 to S-3.21, the two fields not under test hold valid values (Bill amount `100.00`, Tip percentage `15`, Number of people `4`) and show no message.

**Acceptance criteria**

- **S-3.1** (all empty) Given all three fields are empty, when I press Calculate, then I see `Enter the bill amount.` under Bill amount, `Enter a tip percentage. Enter 0 for no tip.` under Tip percentage, `Enter the number of people.` under Number of people, and no result.
- **S-3.2** (only spaces) Given Bill amount contains only spaces, when I press Calculate, then I see `Enter the bill amount.` under Bill amount and no result.
- **S-3.3** (text in bill) Given Bill amount is any one of `abc`, `$50`, `1e3`, `1 000`, `1,000.00`, when I press Calculate, then I see `Bill amount must be a number, for example 84.50.` under Bill amount and no result.
- **S-3.4** (negative bill) Given Bill amount is `-20`, when I press Calculate, then I see `Bill amount must be between 0.01 and 100000000.00.` and no result.
- **S-3.5** (too many decimals in bill) Given Bill amount is `12.345`, when I press Calculate, then I see `Bill amount can have at most 2 decimal places.` and no result. The same message appears for `1,000`.
- **S-3.6** (text in tip) Given Tip percentage is `abc` or `15%`, when I press Calculate, then I see `Tip percentage must be a number, for example 15.` under Tip percentage and no result.
- **S-3.7** (negative tip) Given Tip percentage is `-5`, when I press Calculate, then I see `Tip percentage must be between 0 and 100.` and no result.
- **S-3.8** (too many decimals in tip) Given Tip percentage is `12.555`, when I press Calculate, then I see `Tip percentage can have at most 2 decimal places.` and no result.
- **S-3.9** (empty tip is not treated as 0) Given Tip percentage is empty, when I press Calculate, then I see `Enter a tip percentage. Enter 0 for no tip.` and no result.
- **S-3.10** (text in people) Given Number of people is `abc` or `four`, when I press Calculate, then I see `Number of people must be a number, for example 4.` under Number of people and no result.
- **S-3.11** (decimal people) Given Number of people is any one of `2.5`, `4.0`, `3,5`, when I press Calculate, then I see `Number of people must be a whole number.` and no result.
- **S-3.12** (negative people) Given Number of people is `-3`, when I press Calculate, then I see `Number of people must be between 1 and 50.` and no result.
- **S-3.13** (several errors at once) Given Bill amount is `abc`, Tip percentage is `-5` and Number of people is `2.5`, when I press Calculate, then I see all three messages at the same time, each under its own field (`Bill amount must be a number, for example 84.50.`, `Tip percentage must be between 0 and 100.`, `Number of people must be a whole number.`), and no result.
- **S-3.14** (never NaN or Infinity) Given any of the invalid inputs in this story, when I press Calculate, then no amount, `NaN`, `Infinity` or `undefined` appears anywhere on the page.
- **S-3.15** (bill starting with a separator) Given Bill amount is `.5` or `,5`, Tip percentage is `0` and Number of people is `1`, when I press Calculate, then I see `Tip: 0.00`, `Total: 0.50`, `Person 1: 0.50`.
- **S-3.16** (bill ending with a separator) Given Bill amount is `5.` or `5,`, Tip percentage is `0` and Number of people is `1`, when I press Calculate, then I see `Tip: 0.00`, `Total: 5.00`, `Person 1: 5.00`.
- **S-3.17** (tip starting or ending with a separator) Given Bill amount is `100.00` and Number of people is `1`, when I press Calculate with Tip percentage `.5` or `,5`, then I see `Tip: 0.50`, `Total: 100.50`, `Person 1: 100.50`; and when I change Tip percentage to `5.` or `5,` and press Calculate, then I see `Tip: 5.00`, `Total: 105.00`, `Person 1: 105.00`.
- **S-3.18** (people with a separator at either end) Given Number of people is any one of `.5`, `,5`, `5.`, `5,`, when I press Calculate, then I see `Number of people must be a whole number.` and no result.
- **S-3.19** (minus zero in tip) Given Tip percentage is `-0` or `-0.00`, when I press Calculate, then I see `Tip percentage must be between 0 and 100.` and no result.
- **S-3.20** (minus sign before the decimal-places check) Given Bill amount is `-12.345`, when I press Calculate, then I see `Bill amount must be between 0.01 and 100000000.00.` (not the decimal-places message) and no result.
- **S-3.21** (minus sign before the whole-number check) Given Number of people is `-2.5`, when I press Calculate, then I see `Number of people must be between 1 and 50.` (not the whole-number message) and no result.

### S-4 Allowed range for each input

As a Bill Payer, I want every input to accept the full range of sensible values and reject anything outside it, so that impossible values such as 0 people or a 150% tip are caught instead of producing a strange result.

- **Serves:** J-3
- **Priority:** Must
- **Status:** Not implemented

**Acceptance criteria**

- **S-4.1** (bill minimum) Given Bill amount is `0.01`, Tip percentage is `0` and Number of people is `1`, when I press Calculate, then I see `Tip: 0.00`, `Total: 0.01`, `Person 1: 0.01`.
- **S-4.2** (below bill minimum) Given Bill amount is `0` or `0.00`, with Tip percentage `15` and Number of people `4`, when I press Calculate, then I see `Bill amount must be between 0.01 and 100000000.00.` and no result.
- **S-4.3** (bill maximum) Given Bill amount is `100000000.00`, Tip percentage is `0` and Number of people is `1`, when I press Calculate, then I see `Tip: 0.00`, `Total: 100000000.00`, `Person 1: 100000000.00`.
- **S-4.4** (above bill maximum) Given Bill amount is `100000000.01` or `99999999999999999999`, with Tip percentage `15` and Number of people `4`, when I press Calculate, then I see `Bill amount must be between 0.01 and 100000000.00.` and no result.
- **S-4.5** (tip minimum and maximum) Given Bill amount is `100.00` and Number of people is `1`, when I press Calculate with Tip percentage `0`, then I see `Tip: 0.00`, `Total: 100.00`, `Person 1: 100.00`; and when I change Tip percentage to `100` and press Calculate, then I see `Tip: 100.00`, `Total: 200.00`, `Person 1: 200.00`.
- **S-4.6** (above tip maximum) Given Tip percentage is `100.01` or `150`, with Bill amount `100.00` and Number of people `4`, when I press Calculate, then I see `Tip percentage must be between 0 and 100.` and no result.
- **S-4.7** (people minimum and maximum) Given Bill amount is `100.00` and Tip percentage is `0`, when I press Calculate with Number of people `1`, then I see `Person 1: 100.00`; and when I change Number of people to `50` and press Calculate, then I see `Person 1: 2.00` through `Person 50: 2.00` (50 lines) and no leftover note.
- **S-4.8** (outside people range) Given Number of people is `0` or `51`, with Bill amount `100.00` and Tip percentage `15`, when I press Calculate, then I see `Number of people must be between 1 and 50.` and no result.

### S-5 Change a number after a result or an error

As a Bill Payer, I want to change any number after getting a result or an error and work it out again without retyping the others, so that I can keep up when someone leaves or the tip changes.

- **Serves:** J-4
- **Priority:** Must
- **Status:** Not implemented

**Acceptance criteria**

- **S-5.1** (old result removed on edit) Given the result for Bill amount `100.00`, Tip percentage `15`, Number of people `4` is showing, when I change Number of people to `5`, then the whole result (tip, total, shares and any note) disappears straight away, before I press anything, and the fields still show `100.00`, `15` and `5`.
- **S-5.2** (recalculate after edit) Given S-5.1 has just happened, when I press Calculate, then I see `Tip: 15.00`, `Total: 115.00`, and `Person 1: 23.00` through `Person 5: 23.00` (five lines).
- **S-5.3** (change the tip) Given the result for `100.00`, `15`, `4` is showing, when I change Tip percentage to `20` and press Calculate, then I see `Tip: 20.00`, `Total: 120.00`, and `Person 1: 30.00` through `Person 4: 30.00`.
- **S-5.4** (fixing one error) Given I pressed Calculate with Bill amount `abc`, Tip percentage `15` and Number of people empty, so both `Bill amount must be a number, for example 84.50.` and `Enter the number of people.` are showing, when I change Bill amount to `100`, then the Bill amount message disappears and the Number of people message is still showing.
- **S-5.5** (fixing all errors) Given S-5.4 has just happened, when I enter `4` in Number of people and press Calculate, then I see the same result as S-1.2 and no error messages.
- **S-5.6** (old result does not come back) Given the result for `100.00`, `15`, `4` is showing, when I change Bill amount to `abc` and press Calculate, then I see `Bill amount must be a number, for example 84.50.` and no result. The earlier result does not reappear.
- **S-5.7** (calculating twice) Given the result for `100.00`, `15`, `4` is showing, when I press Calculate again without changing anything, then I see the same result once: `Tip: 15.00`, `Total: 115.00` and exactly four person lines.

### S-6 Start over

As a Bill Payer, I want to clear everything in one step, so that numbers from the last bill never end up in the next one.

- **Serves:** J-4
- **Priority:** Must
- **Status:** Not implemented

**Acceptance criteria**

- **S-6.1** (clear a result) Given the result for `100.00`, `15`, `4` is showing, when I press Start over, then all three fields are empty, no result and no error messages are showing, and the cursor is in Bill amount.
- **S-6.2** (clear errors) Given the three messages from S-3.1 are showing, when I press Start over, then all three fields are empty and no error messages are showing.
- **S-6.3** (new bill after starting over) Given I pressed Start over after the result for `100.00`, `15`, `4`, when I enter Bill amount `60`, Tip percentage `0`, Number of people `2` and press Calculate, then I see `Tip: 0.00`, `Total: 60.00`, `Person 1: 30.00`, `Person 2: 30.00` and nothing from the earlier bill.
- **S-6.4** (nothing to clear) Given the page has just opened and nothing has been entered, when I press Start over, then the page looks the same and no error messages appear.

### S-7 Works on phone and desktop

As a Bill Payer, I want the calculator to work on my phone as well as in a desktop browser, so that I can use it at the table on whatever device I have.

- **Serves:** J-1
- **Priority:** Must
- **Status:** Not implemented

**Acceptance criteria**

Criterion IDs are kept stable: S-7.1 and S-7.2 became delivery requirements D-1 and D-2, and S-7.6 became S-10.1.

- **S-7.3** (phone-sized screen) Given the browser window is 360 × 640 pixels (for example Chrome's device toolbar), when I calculate with the values from S-2.2, then I can read every label, field, button, amount and the note without zooming, and the page does not scroll sideways.
- **S-7.4** (longest amount on a phone) Given the browser window is 360 × 640 pixels, when I calculate with the values from S-2.8, then `200000000.00` is shown in full on every line it appears and the page does not scroll sideways.
- **S-7.5** (desktop and keyboard) Given the browser window is 1280 × 800 pixels, when I press Tab repeatedly from the top of the page, then the focus moves through Bill amount, Tip percentage, Number of people, Calculate and Start over in that order, and the page does not scroll sideways.

### S-8 Each person pays for what they had plus their part of the tip

As a Group Organiser, I want to put in what each person had and a tip percentage and get what each person owes, so that everyone pays for their own order plus a tip in proportion to it.

- **Serves:** J-5
- **Priority:** Later
- **Status:** Not implemented

**Rules for this story**

- The page offers two ways to split: **Split equally** (selected when the page opens, and works as in S-1 to S-7) and **By what each person had**.
- In "By what each person had" there is one row per person, labelled Person 1, Person 2 and so on, each with an amount field. It starts with 2 rows and allows between 1 and 20. Each amount follows the Bill amount rules: 0.01 to 100000000.00, up to 2 decimal places, same number format. The Tip percentage field and its rules are the same as in the first build.
- **Each person's tip** = their amount × Tip percentage ÷ 100, rounded to the nearest 0.01, with exactly half a cent rounding up. Each person owes their amount plus their own tip.
- **Tip** shown = the sum of everyone's tips. **Total** = the sum of what everyone owes. Because each person's tip is rounded on its own, there are no leftover cents to hand out and the shares always add up to exactly the Total. The Tip shown can differ by a cent or two from Tip percentage × the combined amounts (see S-8.4).
- Each person's line shows what they owe, then their amount and their tip in brackets, for example `Person 1: 33.00 (30.00 + 3.00 tip)`.
- The rules in "How results are shown" for removing results and messages on edit apply here too.

**Acceptance criteria**

- **S-8.1** Given I have just opened the page, so "Split equally" is selected and the page is as described in S-1.1, when I choose "By what each person had", then I see two rows labelled "Person 1" and "Person 2", each with an empty amount field, an "Add person" button, the Tip percentage field, and the Calculate and Start over buttons.
- **S-8.2** Given I have added a third row and the amounts are `30.00`, `20.00`, `50.00` with Tip percentage `10`, when I press Calculate, then I see `Tip: 10.00`, `Total: 110.00`, `Person 1: 33.00 (30.00 + 3.00 tip)`, `Person 2: 22.00 (20.00 + 2.00 tip)`, `Person 3: 55.00 (50.00 + 5.00 tip)`.
- **S-8.3** Given the amounts are `12.50`, `7.25`, `20.00` with Tip percentage `18`, when I press Calculate, then I see `Tip: 7.16`, `Total: 46.91`, `Person 1: 14.75 (12.50 + 2.25 tip)`, `Person 2: 8.56 (7.25 + 1.31 tip)`, `Person 3: 23.60 (20.00 + 3.60 tip)`. (Person 2's tip is exactly 1.305, which rounds up to 1.31.)
- **S-8.4** (per-person rounding) Given the amounts are `10.05`, `10.05`, `10.05` with Tip percentage `10`, when I press Calculate, then each person's line is `11.06 (10.05 + 1.01 tip)`, and I see `Tip: 3.03` and `Total: 33.18`. (10% of the combined 30.15 would round to 3.02. The app shows 3.03 because each person's tip is rounded separately, and the shares still add up exactly to the Total.)
- **S-8.5** (remove a person) Given the three rows and result from S-8.2 are showing, when I press Remove on Person 2's row, then two rows remain, labelled Person 1 (`30.00`) and Person 2 (`50.00`), and the result disappears; and when I press Calculate, then I see `Tip: 8.00`, `Total: 88.00`, `Person 1: 33.00 (30.00 + 3.00 tip)`, `Person 2: 55.00 (50.00 + 5.00 tip)`.
- **S-8.6** (maximum people) Given there are 19 rows, when I press Add person, then a row labelled Person 20 appears, the Add person button becomes disabled, and the text `You can split between at most 20 people.` appears next to it.
- **S-8.7** (minimum people) Given there are two rows, when I press Remove on Person 2's row, then one row remains, labelled Person 1, and it has no Remove button.
- **S-8.8** (switching back) **Open question, not decided:** whether "By what each person had" shares the Tip percentage field with "Split equally", and so what happens to the values when switching. The wording below is a placeholder until that is decided. Given a result is showing in "By what each person had", when I choose "Split equally", then the result disappears and the Bill amount, Tip percentage and Number of people fields show whatever I last entered in them.

### S-9 Clear messages that name the person whose amount is wrong

As a Group Organiser, I want a message that names the person whose amount can't be used, so that I fix the right number before asking anyone to pay.

- **Serves:** J-3
- **Priority:** Later
- **Status:** Not implemented

In these criteria "By what each person had" is selected, the Tip percentage is `15` unless stated otherwise, and the other rows hold valid amounts.

**Acceptance criteria**

- **S-9.1** (empty) Given Person 2's amount is empty, when I press Calculate, then I see `Enter Person 2's amount.` under Person 2's row and no result.
- **S-9.2** (text) Given Person 2's amount is `abc`, when I press Calculate, then I see `Person 2's amount must be a number, for example 12.50.` and no result.
- **S-9.3** (negative or zero) Given Person 2's amount is `-5` or `0`, when I press Calculate, then I see `Person 2's amount must be between 0.01 and 100000000.00.` and no result.
- **S-9.4** (too many decimals) Given Person 2's amount is `7.255`, when I press Calculate, then I see `Person 2's amount can have at most 2 decimal places.` and no result.
- **S-9.5** (several rows wrong) Given Person 1's amount is `abc` and Person 3's amount is empty, when I press Calculate, then I see `Person 1's amount must be a number, for example 12.50.` under Person 1's row and `Enter Person 3's amount.` under Person 3's row at the same time, and no result.
- **S-9.6** (tip errors) Given the Tip percentage is empty, `abc`, `-5`, `12.555` or `150`, when I press Calculate, then I see the same Tip percentage message as in the first build (S-3.6 to S-3.9 and S-4.6) and no result.
- **S-9.7** (fixing one row) Given the two messages from S-9.5 are showing, when I change Person 1's amount to `10.00`, then Person 1's message disappears and Person 3's message is still showing.
- **S-9.8** (smallest amount) Given there is one row with amount `0.01`, when I press Calculate, then I see `Tip: 0.00`, `Total: 0.01`, `Person 1: 0.01 (0.01 + 0.00 tip)`.
- **S-9.9** (largest amounts) Given there are 20 rows, each with amount `100000000.00`, and Tip percentage `100`, when I press Calculate, then every person's line is `200000000.00 (100000000.00 + 100000000.00 tip)`, and I see `Tip: 2000000000.00` and `Total: 4000000000.00`.

### S-10 Number keyboard on a phone

As a Bill Payer, I want my phone to show a number keyboard for each input, so that I can put the numbers in quickly at the table.

- **Serves:** J-1
- **Priority:** Must
- **Status:** Not implemented

**Acceptance criteria**

- **S-10.1** (moved from S-7.6) Given I have opened the page on a phone, when I tap Bill amount or Tip percentage, then the keyboard shows digits and a decimal separator; and when I tap Number of people, then the keyboard shows digits. (This needs a real phone. It is planned to be checked on the version published to GitHub Pages.)

---

## Delivery requirements

These are requirements for the people running and reviewing this build, not something a Bill Payer or Group Organiser wants, so they are not stories and don't serve a job. They are checked in the same way as acceptance criteria.

- **D-1** (moved from S-7.1: opens from the file in all four browsers) Given current versions of Chrome, Edge, Firefox and Safari, when I open `src/index.html` in each by double-clicking the file (so the address starts with `file://`), then the page loads and the values from S-1.2 give exactly the S-1.2 result in every browser.
- **D-2** (moved from S-7.2: no network requests) Given `src/index.html` is open from the file with the browser's developer tools Network tab open, when I reload the page and calculate with the values from S-1.2, then every request listed is for one of the app's own files in `src/`, and no request goes to any `http://` or `https://` address.
