# Money Tracker

A dark-mode personal finance tracker built with Expo and React Native. The app is designed for quick iPhone entry first: add income or expenses, organize them by category, and review spending patterns from the dashboard and stats screens.

## What The App Does

Money Tracker keeps a local record of:

- Income entries, such as salary, freelance work, gifts, or investments.
- Expense entries, such as food, transport, shopping, healthcare, and utilities.
- Custom categories with colors and icons.
- A current balance summary.
- Expense mix, income sources, cash-flow trends, and savings rate.

Data is stored locally on the phone using SQLite. There is no cloud sync, account login, or remote backend in the current version.

## Main Tabs

### Home

The Home tab is the quick overview screen.

Use it to see:

- Current balance.
- Total income.
- Total spent.
- This month’s spending breakdown.
- Recent transactions.

Long press a transaction in the recent list to delete it.

### Add

The Add tab is the main entry workflow.

To add a transaction:

1. Choose `Expense` or `Income`.
2. Enter an amount manually or use a quick amount chip.
3. Select a category.
4. Adjust the date if needed.
5. Add an optional note.
6. Tap `Save Expense` or `Save Income`.

The preview at the top shows how the transaction will be recorded before you save it.

### Categories

The Categories tab manages how transactions are organized.

You can:

- Search existing categories.
- Filter by all, expense, or income categories.
- Create a new category with a name, type, icon, and color.
- Delete a category with a long press or the delete button.

Deleting a category also removes transactions tied to that category.

### Stats

The Stats tab is the analytics view.

It includes:

- Net balance for the selected period.
- Income, spending, and saved percentage.
- Month, year, and all-time filters.
- Transaction count.
- Average expense amount.
- Top spending category.
- Cash-flow trend chart.
- Expense category mix chart.
- Income source chart.

Use this tab to understand where money is going rather than just viewing individual transactions.

## Hidden Screens

Some screens are available through app navigation but are not shown as primary bottom tabs:

- `History`: full transaction list.
- `Search`: transaction filtering and CSV sharing.
- `Budgets`: local budget goal UI.
- `Recurring`: local recurring transaction UI.

These are still in the project, but the main daily workflow is Home, Add, Categories, and Stats.

## Running The App

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm start
```

Run on iPhone:

```bash
npm run ios
```

Run in a browser for layout checks:

```bash
npm run web
```

The browser build uses a small local web fallback store so the UI can render without bundling native SQLite. The iPhone build uses SQLite on-device.

## Project Structure

The codebase follows a domain-driven layout:

```text
app/
  Expo Router entry points. Route files stay thin.

src/domain/money/
  Money domain types, analytics, and repository contracts.

src/application/money/
  Use cases that orchestrate domain operations.

src/infrastructure/database/
  Platform storage adapters.
  Native uses SQLite. Web uses a local fallback.

src/features/money-tracking/
  Screens, components, and feature state for the money tracker UI.

src/composition/
  App wiring between use cases, repositories, and feature state.

src/shared/
  Formatting, ID generation, and theme tokens.
```

The key boundary is that UI does not talk directly to SQLite. Screens use feature state, feature state uses application use cases, and use cases depend on the money repository contract.

## Verification Commands

Run TypeScript:

```bash
npx tsc --noEmit
```

Run lint:

```bash
npm run lint
```

Both should pass before changing storage, domain logic, or shared UI behavior.
