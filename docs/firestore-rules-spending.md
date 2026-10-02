# Firestore rules for Spending (in huishouden/tasks)

One Firebase project has one rules file, and huishouden/tasks deploys it. Spending's blocks sit
inside `match /households/{householdId}` there and reuse `isMember()`; its tests are in
`test/rules/firestore.rules.test.ts` (describe "Huishouden Spending").

| Collection | Members may | Fields (exact list) |
|---|---|---|
| `spendingTransactions/{id}` | read, create, update, delete | date (YYYY-MM-DD), description, amount, category, card, type, source (`statement` or `alert`), last4, emailId, createdAt, updatedAt, by |
| `spendingSettings/main` | read, create, update | monthlyBudget, currencySymbol, ignoredKeywords, alertLabels, emailCheckedAt, emailCheckedBy, updatedAt, updatedBy |
| `spendingCards/{id}` | read, create, update, delete | name, last4, issuer, alertWords, csv (remembered statement columns), createdAt, updatedAt, by |
| `spendingRules/{id}` | read, create, update, delete | contains, category, createdAt, updatedAt, by |

The field lists match `src/data/model.ts`. The legacy Apps Script mirror (`apps-script/Firestore.gs`)
writes `spendingTransactions` with its owner's IAM credentials, which bypass rules.

## Household membership

The app finds its household with `where('members', 'array-contains', <signed-in email>)`. Someone
signed in who is in no household sees the sample household and is pointed to the Huishouden home
screen to start one or be invited.
