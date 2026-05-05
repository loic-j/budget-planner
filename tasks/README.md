# Tasks

Full project breakdown. Each folder contains a `README.md` with task details and, once started, an `implementation.md` with progress notes.

## Status legend

| Badge         | Meaning                   |
| ------------- | ------------------------- |
| `TODO`        | Not started               |
| `IN_PROGRESS` | Currently being worked on |
| `DONE`        | Complete and verified     |

---

## Task List

### Foundation

| #                                | Task                                  | Status | Depends on |
| -------------------------------- | ------------------------------------- | ------ | ---------- |
| [01](./01-database-schema/)      | Database schema & migrations          | `DONE` | —          |
| [02](./02-better-auth-backend/)  | Better Auth — backend setup           | `DONE` | 01         |
| [03](./03-better-auth-frontend/) | Better Auth — frontend + auth screens | `DONE` | 02         |

### Backend API

| #                                      | Task                                          | Status | Depends on     |
| -------------------------------------- | --------------------------------------------- | ------ | -------------- |
| [04](./04-budget-crud-api/)            | Budget CRUD API                               | `DONE` | 01, 02         |
| [05](./05-budget-members-invites-api/) | Budget members & invites API                  | `DONE` | 04             |
| [06](./06-persons-api/)                | Persons management API                        | `DONE` | 04             |
| [07](./07-categories-api/)             | Categories API + preset seeding               | `DONE` | 04             |
| [08](./08-expenses-api/)               | Expenses API (regular + loans + amortization) | `DONE` | 04, 06, 07     |
| [09](./09-revenues-api/)               | Revenues API                                  | `DONE` | 04, 06, 07     |
| [10](./10-savings-api/)                | Savings API                                   | `DONE` | 04, 06, 07     |
| [11](./11-assets-api/)                 | Assets API                                    | `DONE` | 04             |
| [12](./12-projection-engine/)          | Projection engine                             | `DONE` | 08, 09, 10, 11 |

### Frontend

| #                                  | Task                                  | Status | Depends on |
| ---------------------------------- | ------------------------------------- | ------ | ---------- |
| [13](./13-app-shell/)              | App shell, theme, routing, auth guard | `DONE` | 03, 04     |
| [14](./14-budget-list-screen/)     | Budget list screen                    | `DONE` | 13, 04     |
| [15](./15-budget-settings-screen/) | Budget settings screen                | `DONE` | 13, 04, 06 |
| [16](./16-expenses-screen/)        | Expenses screen                       | `DONE` | 13, 08, 12 |
| [17](./17-revenues-screen/)        | Revenues screen                       | `DONE` | 13, 09, 12 |
| [18](./18-savings-screen/)         | Savings screen                        | `DONE` | 13, 10, 12 |
| [19](./19-assets-screen/)          | Assets screen                         | `DONE` | 13, 11, 12 |
| [20](./20-dashboard-screen/)       | Dashboard screen                      | `DONE` | 13, 12     |
| [21](./21-projections-screen/)     | Projections screen                    | `DONE` | 13, 12     |
| [22](./22-members-screen/)         | Members screen                        | `DONE` | 13, 05     |
| [23](./23-user-profile/)           | User profile screen                   | `DONE` | 03, 13     |
