# Wireframes / Mockups

Simple drawings of what each page looks like. Actual screenshots are in the [`screenshots/`](screenshots/) folder.

---

## App Layout

### Desktop (768px and wider)

```
┌──────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌────────────────────────────────────────┐  │
│ │          │ │  Page Title                            │  │
│ │ COIN     │ └────────────────────────────────────────┘  │
│ │ TOSS     │ ┌────────────────────────────────────────┐  │
│ │          │ │                                        │  │
│ │ Dashboard│ │         Page Content                   │  │
│ │ Txns     │ │                                        │  │
│ │ Budgets  │ │                                        │  │
│ │ Goals    │ │                                        │  │
│ │ Analytics│ │                                        │  │
│ │ Notifs   │ │                                        │  │
│ │ Settings │ │                                        │  │
│ │          │ │                                        │  │
│ │ ──────── │ └────────────────────────────────────────┘  │
│ │ ♦ Jane   │                                            │
│ │  j@e.com │                                            │
│ │ 🌑 Logout│                                            │
│ └──────────┘                                            │
└──────────────────────────────────────────────────────────┘
   256px sidebar          Rest of the screen
```

- Left sidebar with logo, 7 navigation links, user info, dark mode toggle, and logout
- Main content area fills the rest

### Mobile (narrower than 768px)

```
┌──────────────────────┐
│  Coin Toss      🌑   │  ← Top bar with logo + dark mode
├──────────────────────┤
│                      │
│   Page Content       │
│                      │
│   (Full width,       │
│    card-based)       │
│                      │
├──────────────────────┤
│ 🏠  💱  🐷  🎯  ⋯   │  ← Bottom nav (Home, Txns, Budgets, Goals, More)
└──────────────────────┘
```

- No sidebar. Sticky top bar with logo and dark mode toggle.
- Bottom nav has 4 main pages + "More" button that opens a sheet for Analytics, Notifications, Settings, and Logout.

---

## 1. Login Page (`/login`)

```
┌────────────────────────────────┐
│      background gradient         │
│                                 │
│   ┌──────────────────────┐      │
│   │   🪙 Coin Toss      │      │
│   │                      │      │
│   │  ┌────────────────┐  │      │
│   │  │  Email          │  │      │
│   │  └────────────────┘  │      │
│   │  ┌────────────────┐  │      │
│   │  │  Password       │  │      │
│   │  └────────────────┘  │      │
│   │  ☐ Remember me     │      │
│   │                      │      │
│   │  [  Sign In       ]  │      │
│   │                      │      │
│   │  Forgot password?    │      │
│   │  Create account      │      │
│   └──────────────────────┘      │
│                                 │
└─────────────────────────────────┘
```

- Centered card on a gradient background
- "Remember me" keeps you logged in for 30 days (1 day otherwise)
- Links below: "Forgot password?" and "Create account"

Screenshots: `screenshots/login.png`, `screenshots/login-mobile.png`

---

## 2. Register Page (`/register`)

```
┌────────────────────────────────┐
│   ┌──────────────────────┐     │
│   │   🪙 Coin Toss      │     │
│   │                      │     │
│   │  Name *              │     │
│   │  ┌────────────────┐   │     │
│   │  Email *           │     │
│   │  ┌────────────────┐   │     │
│   │  Password *        │     │
│   │  ┌────────────────┐   │     │
│   │  Confirm *         │     │
│   │  ┌────────────────┐   │     │
│   │                      │     │
│   │  [ Create Account ]  │     │
│   │                      │     │
│   │  Already have? Sign in    │
│   └──────────────────────┘     │
└────────────────────────────────┘
```

- Password must be 8+ chars with uppercase, lowercase, and a number
- Red `*` marks required fields
- Link to go back to login

Screenshots: `screenshots/register.png`, `screenshots/register-mobile.png`

---

## 3. Forgot Password (`/forgot-password`)

```
┌────────────────────────────────┐
│   ┌──────────────────────┐     │
│   │   🪙 Coin Toss      │     │
│   │  Reset Password      │     │
│   │                      │     │
│   │  ┌────────────────┐   │     │
│   │  │  Email          │   │     │
│   │  └────────────────┘   │     │
│   │                      │     │
│   │  [ Send Link ]       │     │
│   │                      │     │
│   │  ← Back to login     │     │
│   └──────────────────────┘     │
└────────────────────────────────┘
```

- Always shows "Check your email" — never reveals if the email exists (security)
- Link to go back to login

Screenshots: `screenshots/forgot-password.png`, `screenshots/forgot-password-mobile.png`

---

## 4. Reset Password (`/reset-password?token=xxx`)

```
┌────────────────────────────────┐
│   ┌──────────────────────┐     │
│   │  New Password *      │     │
│   │  ┌────────────────┐   │     │
│   │  │  Password       │   │     │
│   │  └────────────────┘   │     │
│   │  ┌────────────────┐   │     │
│   │  │  Confirm       │   │     │
│   │  └────────────────┘   │     │
│   │                      │     │
│   │  [ Reset Password ]  │     │
│   └──────────────────────┘     │
└────────────────────────────────┘
```

- If the token is expired or invalid, shows an error with a link to request a new one
- On success, shows confirmation with a link to login

Screenshots: `screenshots/reset-password.png`, `screenshots/reset-password-mobile.png`

---

## 5. Dashboard (`/dashboard`)

```
┌────────────────────────────────────────────┐
│  Dashboard                      Health: 72  │
├────────────────────────────────────────────┤
│                                            │
│ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌─────┐│
│ │ Balance │ │ Income  │ │Expense │ │Save ││
│ │ $12,450 │ │ $5,230  │ │ $3,180 │ │$2050││
│ └─────────┘ └─────────┘ └────────┘ └─────┘│
│                                            │
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │ Income vs Expense│ │ Income vs Expense│ │
│ │   (Bar Chart)    │ │  (Pie/Donut)     │ │
│ └──────────────────┘ └──────────────────┘ │
│                                            │
│ Budget Usage: 48% of $3,000 ████████░░░░  │
│                                            │
│ ┌─ Recent Transactions ─────────────────┐  │
│ │ Grocery Store    -$85.00    Jun 15    │  │
│ │ Salary          +$12,000   Jun 01    │  │
│ │ Electric Bill    -$320.00   Jun 03    │  │
│ └───────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- 4 KPI cards at the top (Balance, Income, Expenses, Savings)
- Health score badge in the header
- Bar chart: this month's income vs expenses
- Pie chart: income vs expense breakdown
- Budget usage progress bar
- 5 most recent transactions
- On mobile: 2-column KPI cards, charts stacked

Screenshots: `screenshots/dashboard.png`, `screenshots/dashboard-mobile.png`

---

## 6. Transactions Page (`/transactions`)

```
┌────────────────────────────────────────────┐
│  Transactions          [+ Add Transaction] │
├────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐                 │
│ │🔍 Search │  │Type ▼ All│                 │
│ └──────────┘  └──────────┘                 │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ Description │ Category │ Date│Type│$│   │
│ │─────────────────────────────────────│   │
│ │ Grocery     │ Food     │Jun15│EXP│-85   │
│ │ Salary      │ Work     │Jun01│INC│+12k  │
│ │ Electric    │ Util     │Jun03│EXP│-320  │
│ └──────────────────────────────────────┘   │
│                                            │
│ ← Page 1 of 3 →                           │
└────────────────────────────────────────────┘
```

- Search bar + type filter (All/Income/Expense/Transfer)
- Table on desktop, card layout on mobile
- Paperclip icon for transactions with receipts
- Edit and delete buttons per row
- Pagination at the bottom (15 per page)

Screenshots: `screenshots/transactions.png`, `screenshots/transactions-mobile.png`

---

## 7. Budgets Page (`/budgets`)

```
┌────────────────────────────────────────────┐
│  Budgets                [+ Add Budget]     │
├────────────────────────────────────────────┤
│                                            │
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │ 🍔 Food          │ │ 🏠 Rent          │ │
│ │ Monthly          │ │ Monthly          │ │
│ │                  │ │                  │ │
│ │ $450 / $600      │ │ $1,200 / $1,200  │ │
│ │ ████████░░ 75%   │ │ ██████████ 100%  │ │
│ │                  │ │                  │ │
│ │ [Edit] [Delete]  │ │ [Edit] [Delete]  │ │
│ └──────────────────┘ └──────────────────┘ │
│                                            │
│ Color coding:                              │
│   Under 90%  = normal (primary)            │
│   90-99%     = warning (yellow)            │
│   100%+      = exceeded (red)              │
└────────────────────────────────────────────┘
```

- 2-column grid on desktop, single column on mobile
- Progress bar with color-coded thresholds
- Category color dot and name
- Empty state: "No budgets yet"

Screenshots: `screenshots/budgets.png`, `screenshots/budgets-mobile.png`

---

## 8. Goals Page (`/goals`)

```
┌────────────────────────────────────────────┐
│  Savings Goals          [+ Add Goal]       │
├────────────────────────────────────────────┤
│                                            │
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │ 🎯 Vacation       │ │ 🎯 Emergency     │ │
│ │ $1,200 / $3,000   │ │ $800 / $5,000    │ │
│ │ ██████░░░ 40%     │ │ ███░░░░░ 16%     │ │
│ │ Due: Sep 15       │ │                  │ │
│ │ [Contribute]      │ │ [Contribute]     │ │
│ │ [Edit] [Delete]   │ │ [Edit] [Delete]  │ │
│ └──────────────────┘ └──────────────────┘ │
└────────────────────────────────────────────┘
```

- 2-column grid on desktop, single column on mobile
- Progress percentage and bar
- Optional deadline display
- "Contribute" opens a small dialog to add funds

Screenshots: `screenshots/goals.png`, `screenshots/goals-mobile.png`

---

## 9. Analytics Page (`/analytics`)

```
┌────────────────────────────────────────────┐
│  Analytics                                 │
├────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌─────┐│
│ │Avg Spent│ │Savings% │ │Health  │ │Net $││
│ │$2,180/mo│ │18%      │ │72/100  │ │$12k ││
│ └─────────┘ └─────────┘ └────────┘ └─────┘│
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ Monthly Spending Trend (Area Chart)  │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ ┌────────────────┐ ┌────────────────────┐ │
│ │ Category       │ │ Cash Flow (Bars)   │ │
│ │ Breakdown      │ │ 12 months          │ │
│ │ (Pie/Donut)    │ │                    │ │
│ └────────────────┘ └────────────────────┘ │
└────────────────────────────────────────────┘
```

- 4 KPI cards (avg spending, savings rate, health score, net worth)
- Area chart: monthly spending trend over 6 months
- Pie chart: expense breakdown by category
- Bar chart: cash flow over 12 months
- On mobile: all charts stack, 2-column KPI cards

Screenshots: `screenshots/analytics.png`, `screenshots/analytics-mobile.png`

---

## 10. Notifications Page (`/notifications`)

```
┌────────────────────────────────────────────┐
│  Notifications (3 unread)  [Mark all read] │
├────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐   │
│ │ Budget Warning              unread   │   │
│ │ "Food budget reached 90%"            │   │
│ │ Jun 15                [🗑 Delete]    │   │
│ ├──────────────────────────────────────┤   │
│ │ Goal Reached              (read)     │   │
│ │ "Vacation goal is 100% complete"    │   │
│ │ Jun 14                [🗑 Delete]    │   │
│ └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

- Unread count in the title as a badge
- Unread items have a highlighted background
- "Mark all read" button with loading spinner
- Delete button per notification

Screenshots: `screenshots/notifications.png`, `screenshots/notifications-mobile.png`

---

## 11. Settings Page (`/settings`)

```
┌────────────────────────────────────────────┐
│  Settings                                   │
├────────────────────────────────────────────┤
│ ┌─ Profile ──────────────────────────────┐ │
│ │  Name:  Jane Doe            [Edit]    │ │
│ │  Email: jane@example.com              │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ Password ────────────────────────────┐  │
│ │                    [Change Password]   │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ Appearance ───────────────────────────┐ │
│ │  🌙 Dark mode              [Toggle]    │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ Currency & Locale ───────────────────┐  │
│ │  Currency: [USD ▼]  (7 options)      │  │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ Session ──────────────────────────────┐ │
│ │  [Sign Out]                           │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ Danger Zone ─────────────────────────┐  │
│ │  [Delete Account]                    │  │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

- 6 sections: Profile, Password, Appearance, Currency & Locale, Session, Danger Zone
- Edit Profile and Change Password open dialog forms
- Currency dropdown: USD, EUR, GBP, JPY, CNY, INR, ILS
- Delete Account requires typing "DELETE" to confirm

Screenshots: `screenshots/settings.png`, `screenshots/settings-mobile.png`

---

## 12. Loading Page (`/loading`)

```
┌────────────────────────────────────────────┐
│                                            │
│            background gradient              │
│                                            │
│           🪙 Coin Toss                     │
│                                            │
│         Welcome back, Jane!                │
│                                            │
│          [Morph animation]                  │
│                                            │
└────────────────────────────────────────────┘
```

- Shows briefly (800ms) after login before going to the dashboard
- Shows the user's name from the auth store
- If not logged in, redirects to /login

---

## Shared Dialog Pattern

All add/edit dialogs follow this layout:

```
┌─ [Title] ───────────────────── [✕] ─┐
│                                      │
│  Field Label *                       │
│  ┌──────────────────────────────┐    │
│  │  Input value                 │    │
│  └──────────────────────────────┘    │
│                                      │
│  [Cancel]                    [Save]  │
│                                      │
└──────────────────────────────────────┘
```

- Red `*` on required fields
- Loading spinner on the Save button during submission
- Error messages appear below invalid fields
- On mobile: single column. On desktop: 2-column grid for some forms.