const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'Documentation', 'Coin-Toss-Project-Specification.pdf');

const BROWN = '#704c35';
const BROWN_LIGHT = '#a8866e';
const BROWN_LIGHTER = '#d4c3b0';
const BROWN_BG = '#f7f2ec';
const BROWN_BG_CODE = '#f0ebe5';
const GREY_DARK = '#444444';
const GREY_MED = '#777777';
const GREY_LIGHT = '#cccccc';
const WHITE = '#ffffff';

const MARGIN = 56;
const BOTTOM_LIMIT = 800;
const CONTENT_WIDTH = 595.28 - MARGIN * 2;

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 56, bottom: 56, left: MARGIN, right: MARGIN },
  bufferPages: true,
  info: {
    Title: 'Coin Toss \u2014 Finance and Budgeting Manager \u2014 Project Specification',
    Author: 'Coin Toss',
  },
});

doc.pipe(fs.createWriteStream(outputPath));

function ensureSpace(h) {
  if (doc.y + h > BOTTOM_LIMIT) doc.addPage();
}

function sectionHeading(letter, text) {
  if (doc.y > 56) doc.addPage();
  doc.rect(MARGIN, doc.y, CONTENT_WIDTH, 34).fill(BROWN);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(17);
  doc.text(letter + '.  ' + text, MARGIN + 14, doc.y + 8, { width: CONTENT_WIDTH - 28 });
  doc.y += 34;
  doc.moveDown(0.4);
  doc.fillColor(GREY_DARK).font('Helvetica').fontSize(11);
}

function subHeading(text) {
  ensureSpace(40);
  doc.moveDown(0.25);
  doc.fontSize(12.5).fillColor(BROWN).font('Helvetica-Bold').text(text);
  doc.moveDown(0.15);
  doc.fillColor(GREY_DARK).font('Helvetica').fontSize(11);
}

function body(text) {
  doc.fontSize(11).fillColor(GREY_DARK).font('Helvetica').text(text, { align: 'left', lineGap: 2.5 });
  doc.moveDown(0.25);
}

function spacer(h) {
  doc.moveDown(h || 0.3);
}

function codeBlock(text) {
  doc.moveDown(0.1);
  const lines = text.split('\n');
  const fs2 = 7.5;
  const lh = 9.5;
  const bh = lines.length * lh + 12;
  ensureSpace(bh + 6);

  const sx = MARGIN;
  const sy = doc.y;
  const bw = CONTENT_WIDTH;

  doc.rect(sx, sy, bw, bh).fill(BROWN_BG_CODE);
  doc.rect(sx, sy, 3, bh).fill(BROWN);

  doc.font('Courier').fontSize(fs2).fillColor(GREY_DARK);
  let yp = sy + 6;
  for (const line of lines) {
    const t = line.length > 96 ? line.substring(0, 96) : line;
    doc.text(t, sx + 10, yp, { width: bw - 18, align: 'left' });
    yp += lh;
  }
  doc.y = sy + bh;
  doc.font('Helvetica').fillColor(GREY_DARK).fontSize(11);
  doc.moveDown(0.35);
}

function note(text) {
  doc.fontSize(9.5).fillColor(BROWN).font('Helvetica-Oblique').text(text);
  doc.fillColor(GREY_DARK).font('Helvetica').fontSize(11);
  doc.moveDown(0.25);
}

function separator() {
  ensureSpace(15);
  doc.moveDown(0.2);
  doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT_WIDTH, doc.y).strokeColor(BROWN_LIGHTER).lineWidth(0.5).stroke();
  doc.moveDown(0.2);
}

let altRow = false;
function tableRow(row, colWidths, isHeader, isLast) {
  const pad = 5;
  const minH = 22;
  const rh = Math.max(minH, ...row.map(function(c, i) {
    const cpl = Math.floor((colWidths[i] - pad * 2) / 4);
    const lines = Math.ceil((c || '').length / Math.max(cpl, 1));
    return lines * 11 + pad * 2;
  }));

  ensureSpace(rh + 2);

  const sy = doc.y;
  let x = MARGIN;
  const totalW = colWidths.reduce(function(a, b) { return a + b; }, 0);

  if (isHeader) {
    altRow = false;
    doc.rect(x, sy, totalW, rh).fill(BROWN);
  } else {
    altRow = !altRow;
    if (altRow) doc.rect(x, sy, totalW, rh).fill(BROWN_BG);
  }

  doc.fontSize(8.5);
  row.forEach(function(cell, i) {
    const w = colWidths[i];

    if (!isHeader && i === 0) {
      doc.rect(x, sy, Math.min(w, 55), rh).fill(altRow ? BROWN_LIGHTER : BROWN_LIGHT);
      doc.fillColor(WHITE).font('Helvetica-Bold');
      doc.text(cell, x + pad, sy + pad, { width: Math.min(w, 55) - pad * 2, align: 'left' });
    } else if (isHeader) {
      doc.fillColor(WHITE).font('Helvetica-Bold');
      doc.text(cell, x + pad, sy + pad, { width: w - pad * 2, align: 'left' });
    } else {
      doc.fillColor(GREY_DARK).font('Helvetica');
      doc.text(cell, x + pad, sy + pad, { width: w - pad * 2, align: 'left' });
    }
    if (i < row.length - 1) {
      doc.moveTo(x + w, sy).lineTo(x + w, sy + rh).strokeColor(GREY_LIGHT).lineWidth(0.5).stroke();
    }
    x += w;
  });

  doc.moveTo(MARGIN, sy).lineTo(MARGIN, sy + rh).strokeColor(GREY_LIGHT).lineWidth(0.5).stroke();
  doc.moveTo(MARGIN + totalW, sy).lineTo(MARGIN + totalW, sy + rh).strokeColor(GREY_LIGHT).lineWidth(0.5).stroke();
  doc.moveTo(MARGIN, sy + rh).lineTo(MARGIN + totalW, sy + rh).strokeColor(GREY_LIGHT).lineWidth(0.5).stroke();

  doc.y = sy + rh;
  if (isLast) doc.moveDown(0.4);
}

// ==================== TITLE PAGE ====================
const tcY = 260;

doc.moveTo(MARGIN, tcY - 40).lineTo(MARGIN + CONTENT_WIDTH, tcY - 40).strokeColor(BROWN_LIGHT).lineWidth(0.5).stroke();

doc.fontSize(40).fillColor(BROWN).font('Helvetica-Bold').text('Coin Toss', { align: 'center' }, tcY - 30);
doc.moveDown(0.15);
doc.fontSize(17).fillColor(BROWN_LIGHT).font('Helvetica').text('Finance and Budgeting Manager', { align: 'center' });
doc.moveDown(0.4);
doc.fontSize(13).fillColor(GREY_MED).font('Helvetica-Oblique').text('Preliminary Project Specification', { align: 'center' });

doc.moveTo(MARGIN, tcY + 45).lineTo(MARGIN + CONTENT_WIDTH, tcY + 45).strokeColor(BROWN_LIGHT).lineWidth(0.5).stroke();

doc.moveDown(3);

const bY = doc.y;
const bH = 95;
doc.rect(MARGIN, bY, CONTENT_WIDTH, bH).fill(BROWN_BG);
doc.rect(MARGIN, bY, 4, bH).fill(BROWN);

const feats = [
  'Track income, expenses, and transfers with receipts',
  'Set budgets with weekly, monthly, or yearly limits',
  'Create savings goals and track progress over time',
  'View analytics with charts and health scoring',
  'Multi-currency support (7 currencies)',
  'Automated recurring transactions via daily cron job',
];
doc.fontSize(10).fillColor(GREY_DARK).font('Helvetica');
let fyp = bY + 12;
for (const f of feats) {
  doc.fillColor(BROWN).text('\u2022', MARGIN + 14, fyp, { width: 14 });
  doc.fillColor(GREY_DARK).text(f, MARGIN + 30, fyp, { width: CONTENT_WIDTH - 46 });
  fyp += 13;
}
doc.y = bY + bH;

doc.moveDown(1.5);
doc.fontSize(9).fillColor(GREY_MED).font('Helvetica').text('Tech Stack:  React 18  |  TypeScript  |  Express  |  Prisma  |  PostgreSQL (Supabase)  |  Vercel', { align: 'center' });

doc.addPage();

// ==================== SECTION A ====================
sectionHeading('A', 'System Description');

subHeading('1. What the System Does');
body('Coin Toss is a personal finance and budgeting web application. It helps users track their income, expenses, budgets, and savings goals in one place. The system provides a visual dashboard with charts, analytics, and notifications to give users a clear picture of their financial health. It replaces spreadsheets and complex budgeting software with a simple, intuitive interface accessible from both desktop and mobile devices.');

subHeading('2. Target Audience');
body('People who want a clear picture of where their money goes. This includes young professionals starting to budget, freelancers tracking income from multiple sources, families managing household finances, and anyone who prefers a simple visual tool over complicated accounting software.');

subHeading('3. What Need It Addresses');
body('Managing personal finances with spreadsheets is error-prone, hard to visualize, and difficult to maintain. Existing budgeting apps are often too complex or locked behind paywalls. Coin Toss solves this by providing a free, simple, visual tool that automatically tracks spending, sets budgets, monitors savings goals, and sends alerts when budgets are close to their limits.');

separator();
subHeading('Key Features');
const featureList = [
  ['Sign up / Log in', 'JWT auth with access + refresh tokens, httpOnly cookies, account lockout after 5 failed attempts'],
  ['Track transactions', 'Add income, expenses, and transfers. Search, filter, sort, and upload receipt photos'],
  ['Set budgets', 'Per-category limits with weekly, monthly, or yearly periods. Color-coded progress bars'],
  ['Savings goals', 'Set targets and track progress. Add contributions with atomic increments'],
  ['View analytics', 'Net worth, monthly trends, category breakdowns, and a financial health score (0-100)'],
  ['Categories', 'Custom + default categories. Deletion reassigns data atomically to fallback'],
  ['Notifications', 'Alerts when budgets approach limits or goals are reached'],
  ['Recurring transactions', 'Templates for repeating payments, auto-created by a daily cron job'],
  ['Multi-currency', '7 currencies with real-time exchange rates from frankfurter.app'],
  ['Settings', 'Edit profile, change password, switch currency, toggle dark mode, delete account'],
];
for (const item of featureList) {
  ensureSpace(20);
  const name = item[0], desc = item[1];
  const lineY = doc.y;
  const nameW = 125, descX = MARGIN + nameW + 10, descW = CONTENT_WIDTH - nameW - 10;

  doc.fontSize(11).fillColor(BROWN).font('Helvetica-Bold');
  const nameLines = doc.heightOfString(name, { width: nameW, align: 'left' });
  doc.text(name, MARGIN, lineY, { width: nameW, align: 'left' });

  doc.fillColor(GREY_DARK).font('Helvetica');
  const descLines = doc.heightOfString(desc, { width: descW, align: 'left' });
  doc.text(desc, descX, lineY, { width: descW, align: 'left' });

  doc.y = lineY + Math.max(nameLines, descLines) + 3;
}

// ==================== SECTION B ====================
sectionHeading('B', 'Wireframes / Mockups');

body('The design follows a Minimalist SaaS Dashboard style with a warm brown color scheme (#704c35). The app uses card-based layouts, chart visualizations, and a responsive design that adapts between desktop (sidebar navigation) and mobile (bottom navigation bar).');

subHeading('1. Dashboard View');
body('The main landing page after login. Features a left sidebar (desktop) or bottom nav (mobile) with links: Dashboard, Transactions, Budgets, Goals, Analytics, Notifications, Settings. Content: four KPI cards (Balance, Income, Expenses, Savings), two charts (bar + pie), a budget usage progress bar, and the five most recent transactions.');

codeBlock('+--------------------------------------------+\n|  Dashboard                      Health: 72 |\n+--------------------------------------------+\n|                                            |\n| +--------+ +--------+ +--------+ +-------+ |\n| |Balance | | Income | |Expense | |Save   | |\n| |$12,450 | | $5,230 | | $3,180 | |$2,050 | |\n| +--------+ +--------+ +--------+ +-------+ |\n|                                            |\n| +------------------+ +------------------+ |\n| | Income vs Expense| | Income vs Expense| |\n| |   (Bar Chart)    | |  (Pie/Donut)     | |\n| +------------------+ +------------------+ |\n|                                            |\n| Budget Usage: 48% of $3,000  [=====-----] |\n|                                            |\n| +-- Recent Transactions -----------------+ |\n| | Grocery Store    -$85.00    Jun 15     | |\n| | Salary          +$12,000   Jun 01     | |\n| | Electric Bill    -$320.00   Jun 03     | |\n| +----------------------------------------+ |\n+--------------------------------------------+');

subHeading('2. Transactions Page');
body('Searchable, filterable table (desktop) or card list (mobile) of all transactions. Search bar, type filter (All / Income / Expense / Transfer), pagination (15 per page). Each row shows description, category, date, type badge, and amount. Add Transaction button opens a dialog form.');

codeBlock('+--------------------------------------------+\n|  Transactions          [+ Add Transaction] |\n+--------------------------------------------+\n| [Search]  [Type: All v]                    |\n|                                            |\n| Description   | Category | Date   | Type  |\n| Grocery Store | Food     | Jun 15 | EXP   |\n| Salary        | Work     | Jun 01 | INC   |\n| Electric Bill | Utilities| Jun 03 | EXP   |\n|                                            |\n| < Page 1 of 3 >                           |\n+--------------------------------------------+');

subHeading('3. Budgets Page');
body('Budget cards in a 2-column grid (desktop) or single column (mobile). Each card: category name with color dot, spent vs limit, progress bar. Bar colors: brown under 90%, yellow 90-99%, red at 100%+.');

codeBlock('+--------------------------------------------+\n|  Budgets                [+ Add Budget]     |\n+--------------------------------------------+\n|                                            |\n| +------------------+ +------------------+ |\n| | Food             | | Rent             | |\n| | $450 / $600      | | $1,200 / $1,200  | |\n| | [===== 75%]      | | [========== 100%]|\n| | [Edit] [Delete]  | | [Edit] [Delete]  | |\n| +------------------+ +------------------+ |\n+--------------------------------------------+');

subHeading('4. Goals Page');
body('Savings goal cards in a 2-column grid (desktop) or single column (mobile). Each card: goal name, current vs target, progress bar with %, optional deadline, and Contribute / Edit / Delete buttons.');

codeBlock('+--------------------------------------------+\n|  Savings Goals          [+ Add Goal]       |\n+--------------------------------------------+\n|                                            |\n| +------------------+ +------------------+ |\n| | Vacation          | | Emergency        | |\n| | $1,200 / $3,000   | | $800 / $5,000    | |\n| | [===== 40%]       | | [== 16%]        | |\n| | Due: Sep 15       | |                  | |\n| | [Contribute]      | | [Contribute]     | |\n| | [Edit] [Delete]   | | [Edit] [Delete]  | |\n| +------------------+ +------------------+ |\n+--------------------------------------------+');

subHeading('5. Analytics Page');
body('Four KPI cards (average spending, savings rate, health score, net worth), area chart for monthly spending trends (6 months), pie chart for expense breakdown by category, bar chart for cash flow over 12 months. All charts stack vertically on mobile.');

subHeading('6. Additional Pages');
body('Login: Centered card on a gradient background with email, password, remember me checkbox, links to register and forgot password.');
body('Register: Similar layout with name, email, password, and confirm password fields.');
body('Settings: Six sections \u2014 Profile, Password, Appearance (dark mode toggle), Currency and Locale, Session (sign out), and Danger Zone (delete account).');
body('Notifications: List of notifications with unread count badge, mark all read button, and delete per notification.');

// ==================== SECTION C ====================
sectionHeading('C', 'DB Schema (ERD)');

body('PostgreSQL (via Supabase) with 8 tables. All money amounts stored in USD using Decimal(12,2). Passwords hashed with bcrypt (cost 12). Reset tokens hashed with SHA-256.');

var tables = [
  { name: '1. users', schema: '{\n  id:            UUID,          // Primary key, auto-generated\n  name:          String,        // Display name (2-100 chars)\n  email:         String,        // Login email, unique\n  password_hash: String,        // Bcrypt hash (cost 12)\n  role:          Enum,          // \'USER\' | \'ADMIN\' (default: USER)\n  is_verified:   Boolean,       // Email verified? (default: false)\n  is_locked:     Boolean,       // Account locked? (default: false)\n  failed_logins: Integer,       // Failed attempts (default: 0)\n  lock_until:    Timestamp,    // Lock expiry (null if not locked)\n  reset_token:   String,        // SHA-256 hash of reset token (null)\n  reset_expires: Timestamp,    // Reset token expiry (1 hour)\n  currency:      String,        // Display currency (default: USD)\n  locale:        String,        // Locale (default: en-US)\n  token_version: Integer,       // Invalidate tokens (default: 0)\n  created_at:    Timestamp,\n  updated_at:    Timestamp\n}', notes: null },
  { name: '2. transactions', schema: '{\n  id:             UUID,          // Primary key\n  user_id:        UUID,          // FK -> users.id (cascade)\n  category_id:    UUID,          // FK -> categories.id (set null)\n  amount:         Decimal(12,2), // Amount in USD, always positive\n  description:    String,        // 1-255 chars\n  type:           Enum,          // INCOME | EXPENSE | TRANSFER\n  date:           Timestamp,    // When it happened\n  payment_method: String,        // Optional (max 50 chars)\n  notes:          String,        // Optional (max 1000 chars)\n  receipt_url:    String,        // Vercel Blob URL (optional)\n  is_recurring:   Boolean,       // Auto-created by cron? (false)\n  tags:           String[],     // Max 10, each max 30 chars\n  created_at:     Timestamp,\n  updated_at:     Timestamp\n}', notes: 'Indexes: [user_id, date], [user_id, type], [user_id, category_id], [user_id, date, type]' },
  { name: '3. categories', schema: '{\n  id:         UUID,          // Primary key\n  user_id:    UUID,          // FK -> users.id (null = default)\n  name:       String,        // 1-50 chars\n  icon:       String,        // Lucide icon name (default: circle)\n  color:      String,        // Hex color (default: #6366f1)\n  type:       Enum,          // INCOME | EXPENSE\n  created_at: Timestamp,\n  updated_at: Timestamp\n}', notes: 'Unique: [user_id, name, type]. System defaults (user_id = null) cannot be edited or deleted.' },
  { name: '4. budgets', schema: '{\n  id:          UUID,          // Primary key\n  user_id:     UUID,          // FK -> users.id (cascade)\n  category_id: UUID,          // FK -> categories.id (restrict)\n  limit:       Decimal(12,2), // Max spending in USD\n  period:      Enum,          // WEEKLY | MONTHLY | YEARLY\n  start_date:  Timestamp,    // Period start (default: now)\n  end_date:    Timestamp,    // Period end (default: end of month)\n  created_at:  Timestamp,\n  updated_at: Timestamp\n}', notes: 'Unique: [user_id, category_id, period]. Computed: spent = expenses in range, percentage = (spent / limit) * 100' },
  { name: '5. savings_goals', schema: '{\n  id:             UUID,          // Primary key\n  user_id:        UUID,          // FK -> users.id (cascade)\n  name:           String,        // Goal name (1-100 chars)\n  target_amount:  Decimal(12,2), // Savings target in USD\n  current_amount: Decimal(12,2), // Saved so far (default: 0, atomic)\n  deadline:       Timestamp,    // Optional (null = no deadline)\n  created_at:     Timestamp,\n  updated_at:     Timestamp\n}', notes: 'Computed: progress = (current_amount / target_amount) * 100' },
  { name: '6. recurring_transactions', schema: '{\n  id:           UUID,          // Primary key\n  user_id:      UUID,          // FK -> users.id (cascade)\n  category_id:  UUID,          // FK -> categories.id (restrict)\n  amount:       Decimal(12,2), // Amount per generated transaction\n  description:  String,        // Description for generated transactions\n  type:         Enum,          // INCOME | EXPENSE | TRANSFER\n  interval:     Enum,          // DAILY | WEEKLY | MONTHLY | YEARLY\n  day_of_month: Integer,       // For MONTHLY/YEARLY (1-31)\n  day_of_week:  Integer,       // For WEEKLY (0=Sun - 6=Sat)\n  start_date:   Timestamp,    // Default: now\n  end_date:     Timestamp,    // null = forever\n  next_date:    Timestamp,    // Next due date\n  is_active:    Boolean,       // Default: true\n  created_at:   Timestamp,\n  updated_at:   Timestamp\n}', notes: 'Index: [next_date] \u2014 cron job queries due templates.' },
  { name: '7. notifications', schema: '{\n  id:         UUID,          // Primary key\n  user_id:    UUID,          // FK -> users.id (cascade)\n  title:      String,        // Short title\n  message:    String,        // Full message body\n  type:       Enum,          // INFO | WARNING | ERROR | SUCCESS\n  is_read:    Boolean,       // Read? (default: false)\n  created_at: Timestamp,\n  updated_at: Timestamp\n}', notes: 'Indexes: [user_id], [is_read]. Pagination meta includes unreadCount.' },
  { name: '8. refresh_tokens', schema: '{\n  id:         UUID,          // Primary key\n  user_id:    UUID,          // FK -> users.id (cascade)\n  token:      String,        // Refresh token (unique)\n  family:     String,        // Family ID (same login = same family)\n  expires_at: Timestamp,    // Token expiry\n  is_revoked: Boolean,       // Revoked? (default: false)\n  created_at: Timestamp,\n  updated_at: Timestamp\n}', notes: 'Indexes: [user_id], [token] (unique). Reusing a revoked token revokes entire family.' },
];

for (var i = 0; i < tables.length; i++) {
  var t = tables[i];
  subHeading(t.name);
  codeBlock(t.schema);
  if (t.notes) note(t.notes);
}

separator();
subHeading('Table Relationships Summary');
var relCols = [110, 110, 90, 90];
tableRow(['From', 'To', 'Type', 'On Delete'], relCols, true);
var rels = [
  ['User', 'Transaction', '1 to many', 'Cascade'],
  ['User', 'Category', '1 to many', 'Cascade'],
  ['User', 'Budget', '1 to many', 'Cascade'],
  ['User', 'SavingsGoal', '1 to many', 'Cascade'],
  ['User', 'RecurringTxn', '1 to many', 'Cascade'],
  ['User', 'Notification', '1 to many', 'Cascade'],
  ['User', 'RefreshToken', '1 to many', 'Cascade'],
  ['Category', 'Transaction', '1 to many', 'Set Null'],
  ['Category', 'Budget', '1 to many', 'Restrict'],
  ['Category', 'RecurringTxn', '1 to many', 'Restrict'],
];
for (var j = 0; j < rels.length; j++) {
  tableRow(rels[j], relCols, false, j === rels.length - 1);
}

// ==================== SECTION D ====================
sectionHeading('D', 'User Flow');

subHeading('1. Registration and Login Flow');
codeBlock('User opens the app\n      |\n      v\nDoes the user have an access token (login session)?\n      |\n      +-- No --> Show /login page\n      |               |\n      |               +-- User enters email + password\n      |               |       +-- Correct --> Store tokens --> /dashboard\n      |               |       +-- Wrong  --> Show error message\n      |               |\n      |               +-- "Create account" --> /register\n      |               |       +-- Fill name + email + password\n      |               |       +-- Account created --> /login\n      |               |\n      |               +-- "Forgot password?" --> /forgot-password\n      |                       +-- Enter email --> Send reset link\n      |                       +-- /reset-password?token=xxx\n      |                       +-- Enter new password --> /login\n      |\n      +-- Yes --> Try fetching data with the token\n                   |\n                   +-- Token valid   --> /dashboard\n                   +-- Token expired --> Try refreshing\n                                        +-- Works --> /dashboard\n                                        +-- Fails  --> /login');

note('Access tokens expire after 15 minutes. Refresh tokens last 1 day (or 30 days with "Remember me"). After 5 failed logins, the account locks for 15 minutes. Password changes revoke all sessions.');

subHeading('2. Main App Navigation');
body('Once logged in, the user sees the dashboard. From the sidebar (desktop) or bottom nav (mobile), they can navigate to: Transactions, Budgets, Goals, Analytics, Notifications, and Settings. Each page loads its data from the API with a loading spinner, then displays the content or an error card with a retry button.');

codeBlock('              +---------------------------+\n              |       /dashboard           |\n              |  KPIs, charts, recent     |\n              +-------------+-------------+\n                            |\n         +--------+---------+---------+----------+\n         |        |         |         |          |\n         v        v         v         v          v\n   /transac-  /budgets   /goals   /analytics  /notifications\n   tions     Add/Edit    Add/Edit  View       Mark read\n   Add/Edit  Delete      Delete    charts     Delete\n   Delete    View %      Contribute (read-only)\n   Search\n                           |\n                           v\n                        /settings\n                    Edit profile / Change password\n                    Change currency / Toggle dark mode\n                    Sign out / Delete account');

subHeading('3. Token Refresh Flow');
codeBlock('Frontend sends request with expired access token\n      |\n      v\nBackend returns 401 Unauthorized\n      |\n      v\nFrontend intercepts the 401 error\n      |\n      +-- Another refresh already in progress?\n      |       +-- Yes --> Wait in queue, retry with new token\n      |       +-- No  --> Send POST /auth/refresh\n      |                    +-- Success --> Retry original request\n      |                    +-- Fail --> Logout --> /login');

note('The refresh token is stored in an httpOnly cookie \u2014 JavaScript cannot read it, preventing XSS attacks from stealing tokens.');

subHeading('4. Adding a Transaction Flow');
codeBlock('User clicks "Add Transaction"\n      |\n      v\nDialog opens with form fields:\n  Amount, Description, Type, Category, Date,\n  Payment Method, Notes, Tags\n      |\n      v\nUser fills form and clicks "Save"\n      |\n      v\nFrontend validates with Zod schema\n      |\n      +-- Validation fails  --> Show field errors\n      +-- Validation passes --> API POST /transactions\n                                   +-- 201 Created --> Close dialog,\n                                   |                  refresh list\n                                   +-- Error --> Show error message');

subHeading('5. Category Deletion Flow');
codeBlock('User clicks "Delete" on a category\n      |\n      v\nIs it a system default category?\n      |\n      +-- Yes --> Return 403 Forbidden\n      |\n      +-- No --> Start database transaction:\n                   1. Find or create "Uncategorized" fallback\n                   2. Reassign all transactions to fallback\n                   3. Reassign all budgets to fallback\n                   4. Reassign all recurring templates to fallback\n                   5. Delete the category\n                   6. Commit (all or nothing)');

note('Using a database transaction means if anything fails, nothing changes \u2014 no data is left orphaned.');

subHeading('6. Recurring Transactions (Daily Cron Job)');
codeBlock('Cron job fires at midnight (Vercel Cron)\n      |\n      v\nCheck X-Cron-Secret header matches?\n      |\n      +-- No --> Return 401 (reject)\n      |\n      +-- Yes --> Find all active templates where next_date <= now()\n                  |\n                  +-- None found --> Return { processed: 0 }\n                  +-- Found N templates --> For each:\n                       1. Create a new Transaction (copy fields)\n                       2. Advance next_date to next interval\n                       3. If next_date > end_date, set is_active = false\n                       4. Return { processed: N }');

// ==================== SECTION E ====================
sectionHeading('E', 'API Endpoints');

body('Base URL: /api/v1. Auth required for most endpoints (Bearer token in Authorization header). All money amounts in USD.');

var endpointGroups = [
  { label: 'Authentication', endpoints: [
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
  ]},
  { label: 'Transactions', endpoints: [
    ['GET', '/transactions', 'List transactions (paginated)', 'page, limit, sortBy, type, search, ...'],
    ['GET', '/transactions/summary', 'Get totals for date range', 'startDate?, endDate?'],
    ['GET', '/transactions/:id', 'Get one transaction', '-'],
    ['POST', '/transactions', 'Create a transaction', 'amount, description, type, categoryId?'],
    ['PUT', '/transactions/:id', 'Update a transaction', 'amount?, description?, ...'],
    ['DELETE', '/transactions/:id', 'Delete a transaction', '-'],
    ['POST', '/transactions/bulk-delete', 'Delete multiple', 'ids[]'],
  ]},
  { label: 'Categories', endpoints: [
    ['GET', '/categories', 'List all categories', '-'],
    ['GET', '/categories/:id', 'Get one category', '-'],
    ['POST', '/categories', 'Create a category', 'name, type, icon?, color?'],
    ['PUT', '/categories/:id', 'Update a category', 'name?, icon?, color?'],
    ['DELETE', '/categories/:id', 'Delete (reassigns data)', '-'],
  ]},
  { label: 'Budgets', endpoints: [
    ['GET', '/budgets', 'List budgets (paginated)', 'page, limit'],
    ['GET', '/budgets/:id', 'Get one budget', '-'],
    ['POST', '/budgets', 'Create a budget', 'categoryId, limit, period?'],
    ['PUT', '/budgets/:id', 'Update a budget', 'limit?, period?'],
    ['DELETE', '/budgets/:id', 'Delete a budget', '-'],
  ]},
  { label: 'Savings Goals', endpoints: [
    ['GET', '/goals', 'List goals (paginated)', 'page, limit'],
    ['GET', '/goals/:id', 'Get one goal', '-'],
    ['POST', '/goals', 'Create a goal', 'name, targetAmount, deadline?'],
    ['PUT', '/goals/:id', 'Update a goal', 'name?, targetAmount?'],
    ['DELETE', '/goals/:id', 'Delete a goal', '-'],
    ['POST', '/goals/:id/contribute', 'Add money to a goal', 'amount'],
  ]},
  { label: 'Notifications', endpoints: [
    ['GET', '/notifications', 'List (paginated)', 'page, limit'],
    ['PATCH', '/notifications/read-all', 'Mark all as read', '-'],
    ['PATCH', '/notifications/:id/read', 'Mark one as read', '-'],
    ['DELETE', '/notifications/:id', 'Delete a notification', '-'],
  ]},
  { label: 'Analytics', endpoints: [
    ['GET', '/analytics/dashboard', 'Dashboard summary + KPIs', '-'],
    ['GET', '/analytics/overview', 'Combined dashboard + monthly', '-'],
    ['GET', '/analytics/monthly-spending', 'Income/expense by month', 'months? (default: 6)'],
    ['GET', '/analytics/category-breakdown', 'Expense by category', 'startDate?, endDate?'],
    ['GET', '/analytics/cash-flow', 'Income vs expenses over time', 'months? (default: 12)'],
    ['GET', '/analytics/net-worth', 'Net worth + monthly trend', '-'],
  ]},
  { label: 'File Uploads', endpoints: [
    ['POST', '/uploads/receipt', 'Upload receipt file', 'file (multipart/form-data)'],
    ['POST', '/uploads/receipt/delete', 'Delete a receipt file', 'url'],
  ]},
  { label: 'Recurring Transactions', endpoints: [
    ['GET', '/recurring', 'List all recurring templates', '-'],
    ['GET', '/recurring/:id', 'Get one template', '-'],
    ['POST', '/recurring', 'Create a template', 'amount, description, type, interval'],
    ['PATCH', '/recurring/:id', 'Update a template', 'amount?, isActive?'],
    ['DELETE', '/recurring/:id', 'Delete a template', '-'],
  ]},
  { label: 'System', endpoints: [
    ['POST', '/cron/recurring', 'Process due recurring (cron)', 'X-Cron-Secret header'],
    ['GET', '/health', 'Health check (no auth)', '-'],
  ]},
];

var epCols = [42, 130, 175, 153];

for (var g = 0; g < endpointGroups.length; g++) {
  var group = endpointGroups[g];
  ensureSpace(35);
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor(BROWN).font('Helvetica-Bold').text(group.label);
  doc.moveDown(0.1);
  altRow = false;
  tableRow(['Method', 'Endpoint', 'Description', 'Body / Query'], epCols, true);
  for (var e = 0; e < group.endpoints.length; e++) {
    tableRow(group.endpoints[e], epCols, false, e === group.endpoints.length - 1);
  }
  doc.moveDown(0.2);
}

separator();
doc.moveDown(0.3);
var totalCount = 0;
endpointGroups.forEach(function(g) { totalCount += g.endpoints.length; });
doc.fontSize(10).fillColor(GREY_MED).font('Helvetica-Oblique').text('Summary: ' + totalCount + ' endpoints \u2014 7 public (no auth), 30 require JWT, 1 cron (special auth), 6 rate-limited, 4 paginated, 23 validated with Zod.', { align: 'center' });
doc.moveDown(0.4);
doc.fontSize(9).fillColor(GREY_MED).font('Helvetica').text('Generated from the Coin Toss Finance Manager codebase.', { align: 'center' });

// ==================== FOOTERS ====================
var total = doc.bufferedPageRange.start + doc.bufferedPageRange.count;
for (var p = 0; p < total; p++) {
  doc.switchToPage(p);
  var fy = doc.page.height - 36;
  doc.moveTo(MARGIN, fy).lineTo(MARGIN + CONTENT_WIDTH, fy).strokeColor(BROWN_LIGHTER).lineWidth(0.5).stroke();
  doc.fontSize(8).fillColor(GREY_MED).font('Helvetica');
  doc.text('Coin Toss \u2014 Project Specification', MARGIN, fy + 8, { width: CONTENT_WIDTH / 2, align: 'left' });
  doc.text('Page ' + (p + 1) + ' of ' + total, MARGIN + CONTENT_WIDTH / 2, fy + 8, { width: CONTENT_WIDTH / 2, align: 'right' });
  if (p > 0) {
    doc.fontSize(9).fillColor(BROWN_LIGHT).font('Helvetica-Bold').text('Coin Toss', MARGIN, 28, { width: CONTENT_WIDTH / 2, align: 'left' });
    doc.fillColor(GREY_MED).font('Helvetica').fontSize(8).text('Project Specification', MARGIN + CONTENT_WIDTH / 2, 30, { width: CONTENT_WIDTH / 2, align: 'right' });
  }
}

doc.end();
console.log('PDF generated at: ' + outputPath);