# Apps Script: Gmail card alerts → Sheet (legacy)

> **Legacy.** Spending now does all of this in the browser for any household: statement import,
> Check email for card alerts, and cards and category rules in its own settings. This script is kept
> for the household that set it up until it switches (see "Moving from the Sheet" in the main
> README). New households don't need it. Don't delete it while a Sheet still runs it.

`Code.gs` is the script bound to the household spending Sheet. This folder is its source of truth;
the copy inside the Sheet is deployed from here with [clasp](https://github.com/google/clasp).

## One-time setup (per machine)

1. Enable the Apps Script API for your Google account: https://script.google.com/home/usersettings
2. `bunx clasp login` as the account that owns the Sheet and receives the card alerts.
3. `.clasp.json` in the repo root holds the script ID (not a secret):
   ```json
   { "scriptId": "<Sheet > Extensions > Apps Script > Project Settings > Script ID>", "rootDir": "apps-script" }
   ```

## Day to day

| Command | Does |
|---|---|
| `bun run script:status` | Lists the files that would be pushed (`Code.gs`, `appsscript.json`) |
| `bun run script:pull` | Overwrites local files with what is in the Sheet (check `git diff` after) |
| `bun run script:push` | Runs the parser tests, then replaces the Sheet's script with this folder |

After a push that changes trigger behaviour, run `setupAutoSyncTrigger` once from the Apps Script
editor (an existing trigger keeps calling the same function, so a code-only push needs nothing).
The first run after upgrading from an older version rescans 30 days by itself. Triggers run as the
account that installed them, and Gmail access is that account's mailbox.

## Tests

`bun test apps-script` loads `Code.gs` into a sandbox and checks parsing and duplicate matching
against `fixtures/alerts.json`.

## Firestore mirror (`Firestore.gs`)

Every sync copies the Sheet into Firestore at
`households/{householdId}/spendingTransactions/{txId}`, which the dashboard reads live with a
long-lived sign-in (no hourly Google token). Members' browsers write the same collection too; the
mirror only touches the documents it wrote itself (ids in its `FS_MIRROR_*` state). Only changed rows are written; fingerprints of the
last mirrored state live in Script Properties `FS_MIRROR_*`.

- Household: Script Property `SPENDING_HOUSEHOLD_ID`, auto-set when exactly one household exists.
- Manifest scopes needed in addition to the existing ones:
  `https://www.googleapis.com/auth/datastore` and `https://www.googleapis.com/auth/script.external_request`.
  The next run after pushing asks the owner to re-authorize once.
- `resetFirestoreMirror` (run from the editor) rewrites every document.
- Security rules: see `docs/firestore-rules-spending.md`.
