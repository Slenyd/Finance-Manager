const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'תיק אפיון', 'Coin-Toss-Project-Specification.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  info: {
    Title: 'Coin Toss - Finance and Budgeting Manager - Project Specification',
    Author: 'Coin Toss',
  },
});

doc.pipe(fs.createWriteStream(outputPath));

const pageWidth = doc.page.width - 120;
const primaryColor = '#704c35';

function heading(text, size = 16) {
  doc.fontSize(size).fillColor(primaryColor).font('Helvetica-Bold').text(text, { align: 'left' });
  doc.moveDown(0.3);
  doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor(primaryColor).lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc.fillColor('black').font('Helvetica');
}

function subHeading(text) {
  doc.fontSize(13).fillColor(primaryColor).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
  doc.fillColor('black').font('Helvetica');
}

function body(text) {
  doc.fontSize(11).fillColor('black').font('Helvetica').text(text, { align: 'right' });
  doc.moveDown(0.3);
}

function tableRow(row, colWidths, isHeader = false, isLast = false) {
  const rowHeight = Math.max(22, Math.ceil(row.reduce((max, cell, i) => {
    const charsPerLine = Math.floor((colWidths[i] - 8) / 4.5);
    const lines = Math.ceil(cell.length / Math.max(charsPerLine, 1));
    return Math.max(max, lines * 11 + 10);
  }, 0)));

  if (doc.y + rowHeight > doc.page.height - 60) {
    doc.addPage();
    if (!isHeader) {
      doc.fontSize(9).fillColor(primaryColor).font('Helvetica-Bold');
      doc.text('(continued)', 60, doc.y, { align: 'left' });
      doc.moveDown(0.3);
      const headerRow = ['Method', 'Endpoint', 'Description', 'Body / Query'];
      let hx = 60;
      headerRow.forEach((cell, i) => {
        const w = colWidths[i];
        doc.rect(hx, doc.y, w, 22).stroke('#cccccc');
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9);
        doc.text(cell, hx + 4, doc.y + 6, { width: w - 8, align: 'right' });
        hx += w;
      });
      doc.y += 22;
    }
  }

  const startY = doc.y;
  let x = 60;

  doc.fontSize(9);

  row.forEach((cell, i) => {
    const w = colWidths[i];
    doc.rect(x, startY, w, rowHeight).stroke('#cccccc');
    if (isHeader) {
      doc.fillColor(primaryColor).font('Helvetica-Bold');
    } else {
      doc.fillColor('black').font('Helvetica');
    }
    doc.text(cell, x + 4, startY + 6, { width: w - 8, align: 'right' });
    x += w;
  });

  doc.y = startY + rowHeight;
  if (isLast) doc.moveDown(0.5);
}

function bullet(text) {
  doc.fontSize(11).fillColor('black').font('Helvetica').text(`  - ${text}`, { indent: 20 });
  doc.moveDown(0.15);
}

function codeBlock(text) {
  doc.moveDown(0.2);
  doc.font('Courier').fontSize(9).fillColor('#333333');
  const lines = text.split('\n');
  for (const line of lines) {
    doc.text(line, 80, doc.y, { width: pageWidth - 40 });
  }
  doc.font('Helvetica').fillColor('black');
  doc.moveDown(0.5);
}

function spacer(h = 0.5) {
  doc.moveDown(h);
}

// ==================== TITLE PAGE ====================
doc.fontSize(26).fillColor(primaryColor).font('Helvetica-Bold').text('Coin Toss', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(16).fillColor('#666666').font('Helvetica').text('Finance and Budgeting Manager', { align: 'center' });
doc.moveDown(0.8);
doc.fontSize(13).fillColor('#666666').font('Helvetica-Oblique').text('Preliminary Project Specification', { align: 'center' });
spacer(2);

doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor(primaryColor).lineWidth(2).stroke();
spacer(1);

// ==================== SECTION A: SYSTEM DESCRIPTION ====================
heading('A. System Description');
spacer(0.3);

subHeading('1. What the System Does');
body('Coin Toss is a personal finance and budgeting web application. It helps users track their income, expenses, budgets, and savings goals in one place. The system provides a visual dashboard with charts, analytics, and notifications to give users a clear picture of their financial health. It replaces spreadsheets and complex budgeting software with a simple, intuitive interface accessible from both desktop and mobile devices.');
spacer(0.3);

subHeading('2. Target Audience');
body('People who want a clear picture of where their money goes. This includes young professionals starting to budget, freelancers tracking income from multiple sources, families managing household finances, and anyone who prefers a simple visual tool over complicated accounting software.');
spacer(0.3);

subHeading('3. What Need It Addresses');
body('Managing personal finances with spreadsheets is error-prone, hard to visualize, and difficult to maintain. Existing budgeting apps are often too complex or locked behind paywalls. Coin Toss solves this by providing a free, simple, visual tool that automatically tracks spending, sets budgets, monitors savings goals, and sends alerts when budgets are close to their limits.');
spacer(0.5);

// ==================== SECTION B: WIREFRAMES / MOCKUPS ====================
heading('B. Wireframes / Mockups');
spacer(0.3);

body('The design follows a Minimalist SaaS Dashboard style with a warm brown color scheme (#704c35). The app uses card-based layouts, chart visualizations, and a responsive design that adapts between desktop (sidebar navigation) and mobile (bottom navigation bar).');
spacer(0.3);

subHeading('1. Dashboard View');
body('The main landing page after login. Features a left sidebar (desktop) or bottom nav (mobile) with navigation links: Dashboard, Transactions, Budgets, Goals, Analytics, Notifications, Settings.');
body('Main content area displays four KPI cards at the top: Balance, Income, Expenses, and Savings. Below the KPI cards, two charts are displayed side by side: a bar chart showing this month income vs expenses, and a pie chart showing the income vs expense breakdown. A budget usage progress bar appears below the charts. At the bottom, a list of the five most recent transactions is shown.');
spacer(0.3);

codeBlock(`+--------------------------------------------+
|  Dashboard                      Health: 72 |
+--------------------------------------------+
|                                            |
| +--------+ +--------+ +--------+ +-------+ |
| |Balance | | Income | |Expense | |Save   | |
| |$12,450 | | $5,230 | | $3,180 | |$2,050 | |
| +--------+ +--------+ +--------+ +-------+ |
|                                            |
| +------------------+ +------------------+ |
| | Income vs Expense| | Income vs Expense| |
| |   (Bar Chart)    | |  (Pie/Donut)     | |
| +------------------+ +------------------+ |
|                                            |
| Budget Usage: 48% of $3,000  [=====-----] |
|                                            |
| +-- Recent Transactions -----------------+ |
| | Grocery Store    -$85.00    Jun 15     | |
| | Salary          +$12,000   Jun 01     | |
| | Electric Bill    -$320.00   Jun 03     | |
| +----------------------------------------+ |
+--------------------------------------------+`);

spacer(0.3);
subHeading('2. Transactions Page');
body('Displays a searchable, filterable table (desktop) or card list (mobile) of all transactions. Features a search bar, type filter (All / Income / Expense / Transfer), and pagination (15 per page). Each row shows description, category, date, type badge, and amount. Edit and delete buttons appear on each row. An Add Transaction button opens a dialog form.');
spacer(0.3);

codeBlock(`+--------------------------------------------+
|  Transactions          [+ Add Transaction] |
+--------------------------------------------+
| [Search]  [Type: All v]                    |
|                                            |
| Description   | Category | Date   | Type  |
| Grocery Store | Food     | Jun 15 | EXP   |
| Salary        | Work     | Jun 01 | INC   |
| Electric Bill | Utilities| Jun 03 | EXP   |
|                                            |
| < Page 1 of 3 >                           |
+--------------------------------------------+`);

spacer(0.3);
subHeading('3. Budgets Page');
body('Shows budget cards in a 2-column grid (desktop) or single column (mobile). Each card displays the category name with a color dot, the spent amount vs limit, and a progress bar. Progress bars change color: normal (brown) under 90%, warning (yellow) at 90-99%, and exceeded (red) at 100%+. An Add Budget button opens a dialog form.');
spacer(0.3);

codeBlock(`+--------------------------------------------+
|  Budgets                [+ Add Budget]     |
+--------------------------------------------+
|                                            |
| +------------------+ +------------------+ |
| | Food             | | Rent             | |
| | $450 / $600      | | $1,200 / $1,200  | |
| | [===== 75%]      | | [========== 100%]|
| | [Edit] [Delete]  | | [Edit] [Delete]  | |
| +------------------+ +------------------+ |
+--------------------------------------------+`);

spacer(0.3);
subHeading('4. Goals Page');
body('Shows savings goal cards in a 2-column grid (desktop) or single column (mobile). Each card shows the goal name, current amount vs target amount, a progress bar with percentage, an optional deadline, and buttons to Contribute, Edit, and Delete. The Contribute button opens a small dialog to add funds.');
spacer(0.3);

codeBlock(`+--------------------------------------------+
|  Savings Goals          [+ Add Goal]       |
+--------------------------------------------+
|                                            |
| +------------------+ +------------------+ |
| | Vacation          | | Emergency        | |
| | $1,200 / $3,000   | | $800 / $5,000    | |
| | [===== 40%]       | | [== 16%]        | |
| | Due: Sep 15       | |                  | |
| | [Contribute]      | | [Contribute]     | |
| | [Edit] [Delete]   | | [Edit] [Delete]  | |
| +------------------+ +------------------+ |
+--------------------------------------------+`);

spacer(0.3);
subHeading('5. Analytics Page');
body('Displays four KPI cards (average spending, savings rate, health score, net worth), followed by an area chart showing monthly spending trends over six months, a pie chart showing expense breakdown by category, and a bar chart showing cash flow over twelve months. All charts stack vertically on mobile.');
spacer(0.3);

subHeading('6. Additional Pages');
body('Login: Centered card on a gradient background with email, password, remember me checkbox, and links to register and forgot password.');
body('Register: Similar layout with name, email, password, and confirm password fields.');
body('Settings: Six sections - Profile, Password, Appearance (dark mode toggle), Currency and Locale, Session (sign out), and Danger Zone (delete account).');
body('Notifications: List of notifications with unread count badge, mark all read button, and delete per notification.');
spacer(0.5);

// ==================== SECTION C: DB SCHEMA ====================
heading('C. DB Schema (ERD)');
spacer(0.3);

body('The database uses PostgreSQL (via Supabase) with 8 tables. All money amounts are stored in USD using Decimal(12,2). Passwords are hashed with bcrypt (cost factor 12).');
spacer(0.3);

subHeading('1. users');
codeBlock(`{
  id:            UUID,          // Primary key, auto-generated
  name:          String,        // Display name (2-100 chars)
  email:         String,        // Login email, unique
  password_hash: String,        // Bcrypt hash (cost 12)
  role:          Enum,          // 'USER' | 'ADMIN' (default: 'USER')
  is_verified:   Boolean,       // Email verified? (default: false)
  is_locked:     Boolean,       // Account locked? (default: false)
  failed_logins: Integer,       // Consecutive failed attempts (default: 0)
  lock_until:    Timestamp,    // Lock expiry time (null if not locked)
  reset_token:   String,        // SHA-256 hash of reset token (null if none)
  reset_expires: Timestamp,    // Reset token expiry (1 hour)
  currency:      String,        // Display currency (default: 'USD')
  locale:        String,        // Locale for formatting (default: 'en-US')
  token_version: Integer,       // Incremented to invalidate tokens (default: 0)
  created_at:    Timestamp,    // Auto-generated
  updated_at:    Timestamp     // Auto-updated
}`);

subHeading('2. transactions');
codeBlock(`{
  id:             UUID,          // Primary key
  user_id:        UUID,          // FK -> users.id (cascade delete)
  category_id:    UUID,          // FK -> categories.id (set null on delete)
  amount:         Decimal(12,2), // Amount in USD, always positive
  description:    String,        // 1-255 chars
  type:           Enum,          // 'INCOME' | 'EXPENSE' | 'TRANSFER'
  date:           Timestamp,    // When it happened
  payment_method: String,        // Optional (max 50 chars)
  notes:          String,        // Optional (max 1000 chars)
  receipt_url:    String,        // Vercel Blob URL (optional)
  is_recurring:   Boolean,       // Auto-created by cron? (default: false)
  tags:           String[],     // User tags (max 10, each max 30 chars)
  created_at:     Timestamp,
  updated_at:     Timestamp
}
Indexes: [user_id, date], [user_id, type], [user_id, category_id],
         [user_id, date, type]`);

subHeading('3. categories');
codeBlock(`{
  id:         UUID,          // Primary key
  user_id:    UUID,          // FK -> users.id (null = system default)
  name:       String,        // 1-50 chars
  icon:       String,        // Lucide icon name (default: 'circle')
  color:      String,        // Hex color (default: '#6366f1')
  type:       Enum,          // 'INCOME' | 'EXPENSE'
  created_at: Timestamp,
  updated_at: Timestamp
}
Unique: [user_id, name, type]  -- prevents duplicates per user`);

subHeading('4. budgets');
codeBlock(`{
  id:          UUID,          // Primary key
  user_id:     UUID,          // FK -> users.id (cascade delete)
  category_id: UUID,          // FK -> categories.id (restrict delete)
  limit:       Decimal(12,2), // Max spending amount in USD
  period:      Enum,          // 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  start_date:  Timestamp,    // Period start (default: now)
  end_date:    Timestamp,    // Period end (default: end of month)
  created_at:  Timestamp,
  updated_at: Timestamp
}
Unique: [user_id, category_id, period]
Computed: spent = sum of expenses in category within date range
          percentage = (spent / limit) * 100`);

subHeading('5. savings_goals');
codeBlock(`{
  id:             UUID,          // Primary key
  user_id:        UUID,          // FK -> users.id (cascade delete)
  name:           String,        // Goal name (1-100 chars)
  target_amount:  Decimal(12,2), // Savings target in USD
  current_amount: Decimal(12,2), // Amount saved (default: 0, atomic update)
  deadline:       Timestamp,    // Optional target date (null = no deadline)
  created_at:     Timestamp,
  updated_at:     Timestamp
}
Computed: progress = (current_amount / target_amount) * 100`);

subHeading('6. recurring_transactions');
codeBlock(`{
  id:           UUID,          // Primary key
  user_id:      UUID,          // FK -> users.id (cascade delete)
  category_id:  UUID,          // FK -> categories.id (restrict delete)
  amount:       Decimal(12,2), // Amount per generated transaction
  description:  String,        // Description for generated transactions
  type:         Enum,          // 'INCOME' | 'EXPENSE' | 'TRANSFER'
  interval:     Enum,          // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  day_of_month: Integer,       // For MONTHLY/YEARLY (1-31)
  day_of_week:  Integer,       // For WEEKLY (0=Sun - 6=Sat)
  start_date:   Timestamp,    // When to start (default: now)
  end_date:     Timestamp,    // When to stop (null = forever)
  next_date:    Timestamp,    // Next due date
  is_active:    Boolean,       // Still running? (default: true)
  created_at:   Timestamp,
  updated_at:   Timestamp
}
Index: [next_date]  -- cron job queries due templates`);

subHeading('7. notifications');
codeBlock(`{
  id:         UUID,          // Primary key
  user_id:    UUID,          // FK -> users.id (cascade delete)
  title:      String,        // Short title
  message:    String,        // Full message body
  type:       Enum,          // 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  is_read:    Boolean,       // Read by user? (default: false)
  created_at: Timestamp,
  updated_at: Timestamp
}
Indexes: [user_id], [is_read]`);

subHeading('8. refresh_tokens');
codeBlock(`{
  id:         UUID,          // Primary key
  user_id:    UUID,          // FK -> users.id (cascade delete)
  token:      String,        // Refresh token string (unique)
  family:     String,        // Family ID (same login = same family)
  expires_at: Timestamp,    // Token expiry
  is_revoked: Boolean,       // Revoked? (default: false)
  created_at: Timestamp,
  updated_at: Timestamp
}
Indexes: [user_id], [token] (unique)
Rules: Reusing a revoked token revokes the entire family (theft detection)`);

spacer(0.3);
subHeading('Table Relationships Summary');
tableRow(['From', 'To', 'Type', 'On Delete'], [100, 100, 80, 80], true);
tableRow(['User', 'Transaction', '1 to many', 'Cascade'], [100, 100, 80, 80]);
tableRow(['User', 'Category', '1 to many', 'Cascade'], [100, 100, 80, 80]);
tableRow(['User', 'Budget', '1 to many', 'Cascade'], [100, 100, 80, 80]);
tableRow(['User', 'SavingsGoal', '1 to many', 'Cascade'], [100, 100, 80, 80]);
tableRow(['User', 'RecurringTxn', '1 to many', 'Cascade'], [100, 100, 80, 80]);
tableRow(['User', 'Notification', '1 to many', 'Cascade'], [100, 100, 80, 80]);
tableRow(['User', 'RefreshToken', '1 to many', 'Cascade'], [100, 100, 80, 80]);
tableRow(['Category', 'Transaction', '1 to many', 'Set Null'], [100, 100, 80, 80]);
tableRow(['Category', 'Budget', '1 to many', 'Restrict'], [100, 100, 80, 80]);
tableRow(['Category', 'RecurringTxn', '1 to many', 'Restrict'], [100, 100, 80, 80], false, true);

spacer(0.5);

// ==================== SECTION D: USER FLOW ====================
heading('D. User Flow');
spacer(0.3);

subHeading('1. Registration and Login Flow');
codeBlock(`User opens the app
      |
      v
Does the user have an access token (login session)?
      |
      +-- No --> Show /login page
      |               |
      |               +-- User enters email + password --> Correct?
      |               |       |
      |               |       +-- Yes --> Store tokens --> Go to /dashboard
      |               |       |
      |               |       +-- No --> Show error message
      |               |
      |               +-- "Create account" link --> /register
      |               |       |
      |               |       +-- Fill name + email + password
      |               |       +-- Account created --> Go to /login
      |               |
      |               +-- "Forgot password?" --> /forgot-password
      |                               |
      |                               +-- Enter email --> Send reset link
      |                               +-- /reset-password?token=xxx
      |                               +-- Enter new password --> /login
      |
      +-- Yes --> Try using the token to fetch data
                   |
                   +-- Token valid --> Go to /dashboard
                   |
                   +-- Token expired --> Try refreshing with refresh token
                                        |
                                        +-- Refresh works --> /dashboard
                                        +-- Refresh fails --> /login`);

spacer(0.3);
subHeading('2. Main App Navigation');
body('Once logged in, the user sees the dashboard. From the sidebar (desktop) or bottom nav (mobile), they can navigate to: Transactions, Budgets, Goals, Analytics, Notifications, and Settings. Each page loads its data from the API with a loading spinner, then displays the content or an error card with a retry button.');
spacer(0.3);

codeBlock(`              +---------------------------+
              |       /dashboard           |
              |  KPIs, charts, recent     |
              +-------------+-------------+
                            |
         +--------+---------+---------+----------+
         |        |         |         |          |
         v        v         v         v          v
   /transac-  /budgets   /goals   /analytics  /notifications
   tions     Add/Edit    Add/Edit  View       Mark read
   Add/Edit  Delete      Delete    charts     Delete
   Delete    View %      Contribute (read-only)
   Search
                           |
                           v
                        /settings
                    Edit profile
                    Change password
                    Change currency
                    Toggle dark mode
                    Sign out / Delete account`);

spacer(0.3);
subHeading('3. Token Refresh Flow');
codeBlock(`Frontend sends request with expired access token
      |
      v
Backend returns 401 Unauthorized
      |
      v
Frontend intercepts the 401 error
      |
      +-- Another refresh already in progress?
      |       +-- Yes --> Wait in queue, retry with new token
      |       +-- No  --> Send POST /auth/refresh
      |                    |
      |                    +-- Success --> Retry original request
      |                    +-- Fail --> Logout user --> Redirect to /login`);

spacer(0.3);
subHeading('4. Adding a Transaction Flow');
codeBlock(`User clicks "Add Transaction"
      |
      v
Dialog opens with form fields:
  Amount, Description, Type, Category, Date,
  Payment Method, Notes, Tags
      |
      v
User fills form and clicks "Save"
      |
      v
Frontend validates with Zod schema
      |
      +-- Validation fails --> Show field errors
      |
      +-- Validation passes --> API POST /transactions
                                   |
                                   +-- 201 Created --> Close dialog,
                                   |                   refresh transaction list
                                   |
                                   +-- Error --> Show error message in dialog`);

spacer(0.3);
subHeading('5. Category Deletion Flow');
codeBlock(`User clicks "Delete" on a category
      |
      v
Is it a system default category?
      |
      +-- Yes --> Return 403 Forbidden (cannot delete system categories)
      |
      +-- No --> Start database transaction:
                   1. Find or create "Uncategorized" fallback of same type
                   2. Reassign all transactions to fallback
                   3. Reassign all budgets to fallback
                   4. Reassign all recurring templates to fallback
                   5. Delete the category
                   6. Commit (all steps succeed or all fail)`);

spacer(0.3);
subHeading('6. Recurring Transactions (Daily Cron Job)');
codeBlock(`Cron job fires at midnight (Vercel Cron)
      |
      v
Check X-Cron-Secret header matches server config?
      |
      +-- No --> Return 401 (reject)
      |
      +-- Yes --> Find all active recurring templates
                  where next_date <= now()
                  |
                  +-- None found --> Return { processed: 0 }
                  +-- Found N templates --> For each:
                       1. Create a new Transaction (copy fields)
                       2. Advance next_date to next interval
                       3. If next_date > end_date, set is_active = false
                       4. Return { processed: N }`);

spacer(0.5);

// ==================== SECTION E: ENDPOINTS TABLE ====================
heading('E. API Endpoints');
spacer(0.3);
body('Base URL: /api/v1. Auth required for most endpoints (Bearer token in Authorization header). All money amounts in USD.');
spacer(0.3);

const endpoints = [
  ['Method', 'Endpoint', 'Description', 'Body / Query'],
  ['POST', '/auth/register', 'Create a new account', 'name, email, password, passwordConfirmation'],
  ['POST', '/auth/login', 'Log in and get tokens', 'email, password, rememberMe?'],
  ['POST', '/auth/logout', 'Log out, revoke tokens', 'refreshToken? (or cookie)'],
  ['POST', '/auth/refresh', 'Get new access token', 'refreshToken? (or cookie)'],
  ['POST', '/auth/forgot-password', 'Request password reset email', 'email'],
  ['POST', '/auth/reset-password', 'Reset password with token', 'token, password, passwordConfirmation'],
  ['GET', '/auth/me', 'Get logged-in user profile', '-'],
  ['PATCH', '/auth/profile', 'Update name and/or email', 'name?, email?'],
  ['PATCH', '/auth/me/password', 'Change password', 'currentPassword, newPassword, newPasswordConfirmation'],
  ['PATCH', '/auth/preferences', 'Update currency/locale', 'currency?, locale?'],
  ['DELETE', '/auth/account', 'Delete account permanently', '-'],
  ['GET', '/transactions', 'List transactions (paginated)', 'page, limit, sortBy, type, search, ...'],
  ['GET', '/transactions/summary', 'Get totals for date range', 'startDate?, endDate?'],
  ['GET', '/transactions/:id', 'Get one transaction', '-'],
  ['POST', '/transactions', 'Create a transaction', 'amount, description, type, categoryId?, ...'],
  ['PUT', '/transactions/:id', 'Update a transaction', 'amount?, description?, ...'],
  ['DELETE', '/transactions/:id', 'Delete a transaction', '-'],
  ['POST', '/transactions/bulk-delete', 'Delete multiple', 'ids[]'],
  ['GET', '/categories', 'List all categories', '-'],
  ['GET', '/categories/:id', 'Get one category', '-'],
  ['POST', '/categories', 'Create a category', 'name, type, icon?, color?'],
  ['PUT', '/categories/:id', 'Update a category', 'name?, icon?, color?'],
  ['DELETE', '/categories/:id', 'Delete a category (reassigns)', '-'],
  ['GET', '/budgets', 'List budgets (paginated)', 'page, limit'],
  ['GET', '/budgets/:id', 'Get one budget', '-'],
  ['POST', '/budgets', 'Create a budget', 'categoryId, limit, period?, ...'],
  ['PUT', '/budgets/:id', 'Update a budget', 'limit?, period?, ...'],
  ['DELETE', '/budgets/:id', 'Delete a budget', '-'],
  ['GET', '/goals', 'List goals (paginated)', 'page, limit'],
  ['GET', '/goals/:id', 'Get one goal', '-'],
  ['POST', '/goals', 'Create a goal', 'name, targetAmount, currentAmount?, deadline?'],
  ['PUT', '/goals/:id', 'Update a goal', 'name?, targetAmount?, ...'],
  ['DELETE', '/goals/:id', 'Delete a goal', '-'],
  ['POST', '/goals/:id/contribute', 'Add money to a goal', 'amount'],
  ['GET', '/notifications', 'List notifications (paginated)', 'page, limit'],
  ['PATCH', '/notifications/read-all', 'Mark all as read', '-'],
  ['PATCH', '/notifications/:id/read', 'Mark one as read', '-'],
  ['DELETE', '/notifications/:id', 'Delete a notification', '-'],
  ['GET', '/analytics/dashboard', 'Dashboard summary + KPIs', '-'],
  ['GET', '/analytics/overview', 'Combined dashboard + monthly', '-'],
  ['GET', '/analytics/monthly-spending', 'Income/expense by month', 'months? (default: 6)'],
  ['GET', '/analytics/category-breakdown', 'Expense breakdown by category', 'startDate?, endDate?'],
  ['GET', '/analytics/cash-flow', 'Income vs expenses over time', 'months? (default: 12)'],
  ['GET', '/analytics/net-worth', 'Net worth + monthly trend', '-'],
  ['POST', '/uploads/receipt', 'Upload receipt file (multipart)', 'file (multipart/form-data)'],
  ['POST', '/uploads/receipt/delete', 'Delete a receipt file', 'url'],
  ['GET', '/recurring', 'List recurring templates', '-'],
  ['GET', '/recurring/:id', 'Get one recurring template', '-'],
  ['POST', '/recurring', 'Create a recurring template', 'amount, description, type, interval, ...'],
  ['PATCH', '/recurring/:id', 'Update a recurring template', 'amount?, isActive?, ...'],
  ['DELETE', '/recurring/:id', 'Delete a recurring template', '-'],
  ['POST', '/cron/recurring', 'Process due recurring (cron)', 'X-Cron-Secret header'],
  ['GET', '/health', 'Health check (no auth)', '-'],
];

const colWidths = [45, 145, 175, 155];

tableRow(endpoints[0], colWidths, true);
for (let i = 1; i < endpoints.length; i++) {
  tableRow(endpoints[i], colWidths, false, i === endpoints.length - 1);
}

spacer(1);

doc.fontSize(10).fillColor('#666666').font('Helvetica-Oblique').text(`Summary: ${endpoints.length - 1} endpoints total — 7 public, 30 require JWT auth, 1 cron job with special auth, 6 rate-limited, 4 paginated.`, { align: 'center' });

spacer(1);

doc.fontSize(9).fillColor('#999999').font('Helvetica').text('Generated from the Coin Toss Finance Manager codebase.', { align: 'center' });

doc.end();

console.log('PDF generated at: ' + outputPath);