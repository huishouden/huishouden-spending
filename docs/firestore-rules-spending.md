# Firestore rules addition for spending (to apply in piekstra/huishouden-tasks)

One Firebase project has one rules file, and household-tasks deploys it. Spending stores its data
under the same household documents and reuses `isMember()`, so the addition is one block inside
the existing `match /households/{householdId} { ... }`, next to `lists`, `items`, `staples`, `menus`:

```
      // Spending transactions, mirrored from the household's Sheet by its Apps Script (which
      // writes with the owner's IAM credentials, bypassing rules). Browsers only read.
      match /spendingTransactions/{txId} {
        allow read: if isMember();
        allow write: if false;
      }
```

Note on list queries: the spending app subscribes to the whole subcollection, which `isMember()`
allows because it does not depend on the document being read.

## Household membership

The app finds its household with `where('members', 'array-contains', <signed-in email>)`, so every
account that should see spending must be in the household's `members` (the tasks app's invite flow
adds them). An account that is not a member keeps using the Sheets path.
