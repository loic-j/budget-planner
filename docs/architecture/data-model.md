# Data Model

## Entity Relationship Diagram

```
User ──< BudgetMember >── Budget
User ──< BudgetInvite
User ──< Session
User ──< Account

Budget ──< Person
Budget ──< Category
Budget ──< Expense
Budget ──< Revenue
Budget ──< Saving
Budget ──< Asset

Expense >──? Category
Expense >──? Person
Expense ──< LoanDetail ──< LoanPayment

Revenue >──? Category
Revenue >──? Person

Saving >──? Category
Saving >──? Person

Asset >──? LoanDetail   (optional: "this house has this mortgage")
```

---

## Auth & Membership

### User

Core user entity. Managed by Better Auth.

| Field         | Type     | Notes         |
| ------------- | -------- | ------------- |
| id            | cuid     | PK            |
| email         | String   | Unique        |
| name          | String?  | Display name  |
| emailVerified | Boolean  | Default false |
| role          | Role     | USER \| ADMIN |
| created_at    | DateTime | Auto          |
| updated_at    | DateTime | Auto-updated  |

### BudgetMember

A user's access to a budget.

| Field     | Type       | Notes                     |
| --------- | ---------- | ------------------------- |
| id        | cuid       | PK                        |
| budgetId  | String     | FK → Budget               |
| userId    | String     | FK → User                 |
| role      | BudgetRole | OWNER \| EDITOR \| VIEWER |
| joined_at | DateTime   | Auto                      |

Unique constraint: `(budgetId, userId)`

### BudgetInvite

Invite link token. User visits `/invite/:token` to join budget.

| Field      | Type       | Notes                        |
| ---------- | ---------- | ---------------------------- |
| id         | cuid       | PK                           |
| budgetId   | String     | FK → Budget                  |
| token      | String     | Unique, URL-safe random      |
| role       | BudgetRole | EDITOR \| VIEWER only        |
| createdBy  | String     | FK → User (who created link) |
| expires_at | DateTime?  | Null = never expires         |
| max_uses   | Int?       | Null = unlimited             |
| use_count  | Int        | Default 0                    |
| created_at | DateTime   | Auto                         |

---

## Budget

Core plan entity. Owns all financial data.

| Field          | Type     | Notes                                 |
| -------------- | -------- | ------------------------------------- |
| id             | cuid     | PK                                    |
| name           | String   |                                       |
| description    | String?  |                                       |
| ownerId        | String   | FK → User                             |
| start_date     | DateTime | Budget projection start date          |
| end_date       | DateTime | Budget projection end date (editable) |
| currency       | String   | ISO 4217 (e.g. "EUR", "USD")          |
| initial_saving | Decimal  | Starting savings balance              |
| created_at     | DateTime | Auto                                  |
| updated_at     | DateTime | Auto-updated                          |

---

## Persons

People attached to a budget. Used to scope revenues, savings, and expenses to individuals.

### Person

| Field       | Type       | Notes                                      |
| ----------- | ---------- | ------------------------------------------ |
| id          | cuid       | PK                                         |
| budgetId    | String     | FK → Budget                                |
| type        | PersonType | ADULT \| CHILD                             |
| name        | String     |                                            |
| sex         | Sex        | MALE \| FEMALE \| OTHER                    |
| dob         | DateTime?  | Date of birth (null if child not yet born) |
| planned_dob | DateTime?  | Planned date of birth (future child only)  |
| created_at  | DateTime   | Auto                                       |
| updated_at  | DateTime   | Auto-updated                               |

Rules:

- ADULT: `dob` required, `planned_dob` null
- CHILD (born): `dob` set, `planned_dob` null
- CHILD (planned): `dob` null, `planned_dob` set
- Age is derived from `dob`, never stored

---

## Categories

Scoped per budget. Presets are seeded into each budget at creation time — user can edit or delete them. Custom categories are user-created after that. All rows always have `budgetId` set.

### Category

| Field      | Type         | Notes                                         |
| ---------- | ------------ | --------------------------------------------- |
| id         | cuid         | PK                                            |
| budgetId   | String       | FK → Budget (always set)                      |
| type       | CategoryType | EXPENSE \| REVENUE \| SAVING                  |
| name       | String       |                                               |
| icon       | String       | Icon identifier (e.g. "home", "food")         |
| is_preset  | Boolean      | True if seeded from system preset at creation |
| created_at | DateTime     | Auto                                          |

Preset seed list lives in app layer (not DB). On budget creation, all presets are copied as `Category` rows with `is_preset = true`. User can rename, delete, or add new ones freely.

### Preset expense categories

| Name                       | Icon key              |
| -------------------------- | --------------------- |
| Food                       | `food`                |
| Housing                    | `home`                |
| Transportation             | `car`                 |
| Entertainment              | `entertainment`       |
| Health                     | `health`              |
| Personal care              | `person`              |
| Travel                     | `plane`               |
| Gift                       | `gift`                |
| Education – Kindergarten   | `school-kindergarten` |
| Education – Primary school | `school-primary`      |
| Education – Junior high    | `school-junior`       |
| Education – High school    | `school-high`         |
| University                 | `university`          |
| Other                      | `other`               |

### Preset revenue categories

| Name                 | Icon key       |
| -------------------- | -------------- |
| Salary               | `salary`       |
| Freelance            | `freelance`    |
| Pension              | `pension`      |
| Unemployment benefit | `unemployment` |
| Other                | `other`        |

### Preset saving categories

| Name           | Icon key     |
| -------------- | ------------ |
| Emergency fund | `shield`     |
| Retirement     | `retirement` |
| Other          | `other`      |

---

## Expenses

Two types: **LOAN** (with full amortization) and **REGULAR** (recurring or one-time).

### Expense

| Field           | Type        | Notes                                        |
| --------------- | ----------- | -------------------------------------------- |
| id              | cuid        | PK                                           |
| budgetId        | String      | FK → Budget                                  |
| type            | ExpenseType | LOAN \| REGULAR                              |
| name            | String      |                                              |
| categoryId      | String?     | FK → Category (null for LOAN type)           |
| personId        | String?     | FK → Person (optional, scopes to individual) |
| amount          | Decimal     | Monthly payment (LOAN: auto-calculated)      |
| frequency       | Frequency   | See enum below                               |
| frequency_value | Int?        | Used with EVERY_X_MONTHS / EVERY_X_YEARS     |
| start_date      | DateTime?   | When expense begins                          |
| end_date        | DateTime?   | When expense ends (null = indefinite)        |
| created_at      | DateTime    | Auto                                         |
| updated_at      | DateTime    | Auto-updated                                 |

### LoanDetail

1:1 with `Expense` where `type = LOAN`. Stores loan parameters; `monthly_payment` is calculated and stored on creation/update.

| Field           | Type     | Notes                                                |
| --------------- | -------- | ---------------------------------------------------- |
| id              | cuid     | PK                                                   |
| expenseId       | String   | FK → Expense (unique)                                |
| loan_type       | LoanType | MORTGAGE \| CAR_LOAN \| PERSONAL \| STUDENT \| OTHER |
| total_amount    | Decimal  | Total loan principal                                 |
| interest_rate   | Decimal  | Annual rate in % (e.g. 3.5 = 3.5%)                   |
| duration_months | Int      | Loan term in months                                  |
| monthly_payment | Decimal  | Auto-calculated, stored (principal + interest)       |
| loan_start_date | DateTime | First payment date                                   |

Monthly payment formula (standard annuity):

```
r = interest_rate / 100 / 12
PMT = total_amount × r × (1+r)^duration_months / ((1+r)^duration_months − 1)
```

### LoanPayment

Full amortization schedule generated when loan is created or updated.

| Field             | Type     | Notes                                |
| ----------------- | -------- | ------------------------------------ |
| id                | cuid     | PK                                   |
| loanDetailId      | String   | FK → LoanDetail                      |
| payment_number    | Int      | 1 to duration_months                 |
| payment_date      | DateTime | Scheduled payment date               |
| amount            | Decimal  | Total payment (principal + interest) |
| principal_amount  | Decimal  |                                      |
| interest_amount   | Decimal  |                                      |
| remaining_balance | Decimal  | Balance after this payment           |
| created_at        | DateTime | Auto                                 |

---

## Revenues

Income streams, optionally scoped to a person.

### Revenue

| Field           | Type      | Notes                                    |
| --------------- | --------- | ---------------------------------------- |
| id              | cuid      | PK                                       |
| budgetId        | String    | FK → Budget                              |
| name            | String    |                                          |
| categoryId      | String?   | FK → Category                            |
| personId        | String?   | FK → Person (e.g. "spouse's salary")     |
| amount          | Decimal   |                                          |
| frequency       | Frequency | See enum below                           |
| frequency_value | Int?      | Used with EVERY_X_MONTHS / EVERY_X_YEARS |
| start_date      | DateTime? | When revenue begins                      |
| end_date        | DateTime? | When revenue ends (null = indefinite)    |
| created_at      | DateTime  | Auto                                     |
| updated_at      | DateTime  | Auto-updated                             |

---

## Savings

Saving contributions, optionally scoped to a person or goal.

### Saving

| Field           | Type      | Notes                                      |
| --------------- | --------- | ------------------------------------------ |
| id              | cuid      | PK                                         |
| budgetId        | String    | FK → Budget                                |
| name            | String    |                                            |
| categoryId      | String?   | FK → Category                              |
| personId        | String?   | FK → Person                                |
| amount          | Decimal   |                                            |
| frequency       | Frequency | See enum below                             |
| frequency_value | Int?      | Used with EVERY_X_MONTHS / EVERY_X_YEARS   |
| start_date      | DateTime? | When contribution begins                   |
| end_date        | DateTime? | When contribution ends (null = indefinite) |
| target_amount   | Decimal?  | Goal amount (e.g. emergency fund target)   |
| created_at      | DateTime  | Auto                                       |
| updated_at      | DateTime  | Auto-updated                               |

---

## Assets

Manually entered. Represent things the budget holder owns. Used for net worth projection.

Linked optionally to a `LoanDetail` to pair an asset with its financing (e.g. house + mortgage). UI prompts this link when creating a `MORTGAGE` loan.

### Asset

| Field              | Type      | Notes                                                       |
| ------------------ | --------- | ----------------------------------------------------------- |
| id                 | cuid      | PK                                                          |
| budgetId           | String    | FK → Budget                                                 |
| loanDetailId       | String?   | FK → LoanDetail (optional, asset financed by loan)          |
| type               | AssetType | REAL_ESTATE \| INVESTMENT \| VEHICLE \| OTHER               |
| name               | String    |                                                             |
| current_value      | Decimal   | Value at `acquisition_date`                                 |
| acquisition_date   | DateTime  | When asset was acquired (used as projection start)          |
| annual_growth_rate | Decimal   | % per year — positive = appreciates, negative = depreciates |
| created_at         | DateTime  | Auto                                                        |
| updated_at         | DateTime  | Auto-updated                                                |

Asset value at any projection date T:

```
value(T) = current_value × (1 + annual_growth_rate/100) ^ years_since_acquisition
```

---

## Net Worth Formula

At any projection date T:

```
cash(T)      = initial_saving + Σ revenues(T) − Σ expenses(T)
assets(T)    = Σ asset.value(T)
liabilities  = Σ loan.remaining_balance(T)   ← from LoanPayment schedule

net_worth(T) = cash(T) + assets(T) − liabilities(T)
```

---

## Enums

```prisma
enum Role {
  USER
  ADMIN
}

enum BudgetRole {
  OWNER
  EDITOR
  VIEWER
}

enum PersonType {
  ADULT
  CHILD
}

enum Sex {
  MALE
  FEMALE
  OTHER
}

enum CategoryType {
  EXPENSE
  REVENUE
  SAVING
}

enum ExpenseType {
  LOAN
  REGULAR
}

enum LoanType {
  MORTGAGE
  CAR_LOAN
  PERSONAL
  STUDENT
  OTHER
}

enum Frequency {
  ONE_TIME
  MONTHLY
  YEARLY
  EVERY_X_MONTHS   // requires frequency_value
  EVERY_X_YEARS    // requires frequency_value
}

enum AssetType {
  REAL_ESTATE
  INVESTMENT
  VEHICLE
  OTHER
}
```

---

## Cascade Delete Rules

| Parent deleted | Children cascade-deleted                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| Budget         | Person, Category, Expense, Revenue, Saving, Asset, BudgetMember, BudgetInvite |
| Expense (LOAN) | LoanDetail → LoanPayment                                                      |
| LoanDetail     | Asset.loanDetailId set to null (Asset kept, link removed)                     |
| User           | BudgetMember rows (budget stays, member removed)                              |

---

## Not Yet Modeled

Out of scope for current phase:

- **Life events** — planned milestones (buy house, retire) with cost/date impact on projections
- **Budget forking** — copy a budget to create an independent version for comparison

---

## Conventions

- IDs: `cuid()` (URL-safe, sortable)
- Timestamps: `created_at`, `updated_at` (snake_case)
- Column names: snake_case
- Foreign keys: camelCase (Prisma convention)
- Monetary values: `Decimal` type, budget currency always
- Age: never stored — derived from `dob` at runtime
