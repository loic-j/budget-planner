# Business Requirements

## Overview

Budget Planner is a personal finance tool where users model their financial life over time. It provides projections of assets, liabilities, net worth, and cash flow based on user-defined inputs.

## User Roles

| Role  | Capabilities                                          |
| ----- | ----------------------------------------------------- |
| USER  | Create budgets, invite members, view/edit own budgets |
| ADMIN | Manage all users and budgets                          |

## Core Features

### Authentication

- Email/password registration and login
- Session-based auth (Better Auth)
- Email verification

### Budget Management

- Create a named budget plan
- Copy a budget to create a new version (fork)
- Delete a budget

### Budget Sharing & Collaboration

- Invite other users by email
- Roles per budget: OWNER, EDITOR, VIEWER
- Co-editing: multiple users can edit the same budget
- Owner can remove members or change their role

### Budget Inputs (per budget)

- **Profile**: age, retirement age, life expectancy
- **Revenues**: salary, freelance, rental income, dividends, other — monthly or annual
- **Expenses**: housing, food, transport, subscriptions, other — monthly or annual
- **Assets**: savings, investments, real estate, vehicles — with current value and growth rate
- **Liabilities**: mortgages, loans — with balance, rate, monthly payment
- **Life Events**: planned milestones (buy a house, have a child, retire) with estimated cost/date

### Projections & Charts

- Net worth over time (assets − liabilities)
- Monthly cash flow (revenues − expenses)
- Asset allocation breakdown
- Debt payoff timeline
- Retirement readiness indicator
- All charts rendered year by year from current age to life expectancy

## Budget Versioning

- A budget can be copied ("fork") to create a new version
- Copies are independent — editing one does not affect the original
- Users can compare two versions side by side (future feature)

## Constraints

- A user can own up to N budgets (limit TBD)
- Budget data is private by default — not visible without explicit share
- All monetary values stored in user's preferred currency (default EUR)
