# Tip and Bill Splitter

A small browser app that splits a restaurant bill, including the tip, equally between a group, with amounts that are exact and always add up.

Open `src/index.html` by double-clicking it. Nothing needs to be installed. Online: https://zafarkhan06.github.io/knowledge-city/src/

## What it is and who it's for

It's for the person who picks up the bill at a group meal and needs everyone's share, tip included, quickly and on their phone at the table. They enter the bill amount, a tip percentage and the number of people, press Calculate, and see the tip, the total and what each person pays.

- **Exact money.** Everything is worked out in whole cents with no floating-point arithmetic. The tip is rounded to the nearest 0.01, and exactly half a cent rounds up.
- **Shares always add up to the total.** When the total can't be split evenly, the leftover cents go one each to Person 1, Person 2 and so on, and a note says so. For example, 100.00 split 3 ways gives 33.34, 33.33 and 33.33.
- **Clear messages.** Anything the app can't use gets a message under that field, and no result is shown until it's fixed. The page never shows NaN or Infinity.
- **No stale results.** Any edit removes the old result, and Start over clears everything.
- **Phone and desktop.** It works on phone-sized screens and on desktop. There are no accounts and no network calls, and nothing is saved.

The product documents are in [docs/](docs/): [app roles](docs/app-roles.md), [jobs to be done](docs/jobs-to-be-done.md) and [user stories](docs/user-stories.md) with acceptance criteria.
- **Built and checked:** stories S-1 to S-7, and S-10 (the number keyboard, checked on a real phone).
- **Planned for later:** S-8 and S-9, splitting by what each person ordered.

## Why I chose it

I picked a bill splitter over a basic or scientific calculator because it has a real person with a concrete problem: the one who paid the bill and has to collect from everyone before they leave the table. It's small enough to build and check properly, but it still has real decisions to make about rounding, who pays the leftover cent and what to do with bad input.

## Prerequisites

- **To use the app:** a current Chrome, Edge, Firefox or Safari.
- **To run the tests:**
  - Node.js 21 or later, with npm. Playwright 1.64 needs Node 20 or later, and the unit-test command passes a file pattern to `node --test`, which Node supports from 21.0.0 according to its documentation. Tested with Node 24.21.0.
  - About 1.1 GB of disk space for the three browser engines that Playwright downloads.

## Open the app

- **On this computer:** double-click `src/index.html`. It runs straight from the file (`file://`) in Chrome, Edge, Firefox and Safari.
- **Online:** https://zafarkhan06.github.io/knowledge-city/src/. The site's root address, https://zafarkhan06.github.io/knowledge-city/, redirects there.

## Run the tests

From the project root:

```
npm install
npx playwright install chromium firefox webkit
npm test
```

`npm test` runs two layers:

- **`npm run test:unit`** uses Node's built-in test runner (`node --test`), with no browser. It checks:
  - every result and every exact message in S-1 to S-4
  - the rounding and leftover-cent rules across 2,000 generated inputs
  - a scan of `src/` for any way to reach the network
- **`npm run test:browser`** uses Playwright. It opens `src/index.html` from disk in Chromium, Firefox and WebKit, and checks every S-1 to S-7 criterion and D-2. S-7.3's "readable without zooming" was also checked by hand. Each test name starts with its criterion ID.

A passing run shows 76 unit tests passed, and 260 browser tests passed with 1 skipped (D-2 in Firefox, see Known issues).

## Project layout

- `src/` is the app: `index.html`, `styles.css`, `calc.js` (the rules as plain functions with no page access) and `app.js` (connects the page to `calc.js`). It has no dependencies and loads as plain scripts, so it works from `file://`.
- `docs/` holds the product documents.
- `tests/` holds the tests:
  - `criteria.js`: expected results and messages copied from the docs
  - `unit/`
  - `browser/`
  - `playwright.config.js`
- `index.html` at the root only redirects to `src/index.html`, so the site's root address opens the app.
- `transcripts/` will hold two files: the Claude Code session, and the separate Claude chat I used to draft my prompts to it.
- `package.json` is only for the tests. Its single dev dependency is `@playwright/test`.

## How it was built

- **AI tool:** Claude Code (command line), with the model Claude Opus 5.5 (1M context). Claude Code's advisor setting was on, with Fable 5.1 as the reviewer model that Claude consulted at several points.
- **Prompt drafting:** I used a separate Claude chat to help me draft my prompts to Claude Code.
- **Code changed by hand:** none. Claude Code wrote all the code, tests and docs under my direction.
- **My checks:** I reviewed each step and did the checks by hand:
  - opening the app in Chrome, Edge, Firefox and Safari (D-1)
  - the 360 px layout (S-7.3)
  - Safari's keyboard behaviour (S-7.5)
  - Firefox's Network tab (D-2)
  - the number keyboard on a real phone, using the GitHub Pages version (S-10)
- **Process:** product docs first, then a plan, then four slices. In each slice:
  1. Tests were written first from the acceptance criteria and run before any new code. In slices 1 to 3 the new tests failed until the code existed. In slice 4 the existing app already passed 10 of the 12 new tests, and no new code was needed to pass them.
  2. Code was then written until the tests passed.
  3. Wherever a test passed before its code existed, a bug was deliberately planted to prove the test could catch it.

  Each slice was committed separately.

## Assumptions

The full list is A-1 to A-12 in [docs/user-stories.md](docs/user-stories.md). In short:

- Amounts have two decimal places and no currency symbol. Currencies without cents (JPY) still show `.00`; currencies with three decimals (KWD) are limited to two.
- The bill amount is the final total, including tax and service, and the tip is a percentage of it.
- `.` or `,` is accepted as the decimal separator, with no thousands separators. Results always use `.`.
- Limits:
  - Bill amount: 0.01 to 100000000.00
  - Tip percentage: 0 to 100
  - Number of people: whole numbers from 1 to 50
- All fields start empty. An empty tip is an error, not 0.
- Results appear when you press Calculate or Enter, not while typing.
- People are numbered, not named. Leftover cents go to Person 1 first.
- A share of 0.00 is possible, for example 0.03 split between 5.

## Known issues

- **Flaky test runner (not the app).** On the Mac used to build this (macOS 27), the Playwright run hung once for certain and very likely a second time, and the hang couldn't be reproduced. The config stops any run after 5 minutes and reports it as failed. There are no automatic retries, so a hang stays visible. If it happens, run `npm test` again.
- **Playwright's Firefox on macOS 27.** Its bundled Firefox 157 fails to start ("Could not find profile folder"), because macOS 27 protects `~/Library/Application Support/Firefox`. On macOS, the test config gives Firefox an empty home folder of its own (`CFFIXED_USER_HOME`). This is Playwright issue [microsoft/playwright#42768](https://github.com/microsoft/playwright/issues/42768). The issue describes Firefox hanging, while here it exited straight away. It's reported fixed in Playwright 1.65, which wasn't released yet on 31 October 2026, when this was built.
- **D-2 in Firefox is checked by hand.** Playwright's Firefox reports no requests for `file://` pages, so that one browser test is skipped, with the reason given in the test. The source scan in `tests/unit/no-network.test.js` and a manual check of Firefox's Network tab cover it instead.
- **Safari keyboard.** With Safari's default settings, Tab skips buttons on every website. Use Option+Tab to reach Calculate and Start over.
- **Screen readers.** Each message is linked to its field and the result is announced, but this hasn't been tested with a screen reader.
- **Comma-only keypads not verified (A-4).** On the phone used for the S-10 check, the keypad for Bill amount and Tip percentage showed `.` as the decimal key. Whether some phone languages offer only a comma hasn't been checked. The app accepts `,` as well, in case they do.
- **Not built:** splitting by what each person ordered (S-8, S-9), tipping on a pre-tax subtotal, fixed-amount tips and names for people.
