# App roles

The app has no accounts and no permissions, so a role here describes a kind of person in a particular situation, not a login. In both roles the person using the app is the one holding the phone at the table.

## R-1 Bill Payer

A Bill Payer is someone eating out with a group who has paid, or is about to pay, the whole bill and wants everyone to pay back an equal share, usually working it out on their phone at the table while people are getting ready to leave. They can enter the bill amount, a tip percentage and the number of people; see the tip, the total and exactly what each person pays; change any number and work it out again; and clear everything to start a new bill. They must never be shown shares that don't add up exactly to the total, a result worked out from a number the app couldn't read, or an old result next to numbers that have since changed.

**How their needs differ:** the Bill Payer cares most about speed and a single trustworthy answer. They enter three numbers, everyone pays the same, and the only complication is the leftover cent, which they need to be able to explain to the table. They are the focus of the first build.

## R-2 Group Organiser

A Group Organiser is someone collecting the money for a group meal where people ordered noticeably different amounts, and who wants each person to pay for what they had plus a fair part of the tip. They can enter what each person had and a tip percentage, add or remove people, and see what each person owes (split into their order and their tip) and the total. They must never be shown a split where anyone pays towards someone else's order, or shares that don't add up exactly to the total.

**How their needs differ:** the Group Organiser cares more about fairness between people than raw speed. They enter one amount per person, so there is more typing and more room for a mistake against a particular name, and each person needs to be able to check their own amount. Their stories are planned for after the first build.

**Not built yet:** the current app does none of the above for the Group Organiser. Their stories, S-8 and S-9, have priority Later.

## Why two roles, not one or three

These two could be merged into one role ("the person settling the bill"), because it is often the same person on different nights and the app has nothing that separates them. I kept them apart because they need different things from the app (three numbers and speed against one amount per person and a per-person breakdown), and that gives a clean scope line: R-1 for the first build, R-2 later.

I also considered a role for the other diners, the people being asked to pay. I left it out because they don't use the app. Their need, to trust the amount they are asked for, is covered by the "must never" rules for R-1 and R-2.
