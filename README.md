# 💸 ExpenseFlow — Modern Expense Tracker

**ExpenseFlow** is a modern, professional, and intuitive Next.js application built to help users seamlessly manage, analyze, and optimize their personal finances.

Built with **Next.js App Router**, **TypeScript**, and **Tailwind CSS**, it delivers a desktop-and-mobile-responsive interface with spending analytics, interactive visual charts, category budgets, multi-currency support, dark/light themes, and full CSV/JSON data export.

---

## 🌟 Core Features

- ➕ **Expense Management**: Add, edit, and delete transactions with amount, date, category, payment method, and notes.
- 🎨 **Category System**: Color-coded badges and icons for **Food**, **Transportation**, **Entertainment**, **Shopping**, **Bills**, and **Other**.
- 🔍 **Search & Multi-Filter**: Filter by category, timeframe presets (*Today, This Week, This Month, Last Month, This Year*), custom date ranges, and amount thresholds. Sort by newest, oldest, highest, lowest amount, and description.
- 📊 **Spending Analytics & Charts**:
  - **Category Breakdown**: Interactive donut chart with percentages and progress bars.
  - **14-Day Spending Trend**: Area chart showing day-by-day cash outflows.
  - **Monthly Comparison**: Bar chart comparing spending across previous months.
  - **Summary Metrics**: Total spent, this month vs last month (% change), weekly spending, and daily average.
- 🎯 **Monthly Budget Tracking**: Visual progress bars, over-budget alerts, and custom per-category budget thresholds.
- 💱 **Multi-Currency Support**: Switch between **USD ($)**, **EUR (€)**, **GBP (£)**, **JPY (¥)**, **CAD (CA$)**, and **AUD (AU$)**.
- 🌓 **Dark & Light Mode**: Seamless dark mode styling with persistent theme preferences.
- 💾 **Persistence & Portability**: Automatic `localStorage` persistence, sample demo data loader, **CSV export** for spreadsheets, and **JSON export/import** for full data backups.
- 📱 **Mobile-First Responsive Design**: Desktop table layout and mobile-optimized swipeable card lists with bottom navigation.

---

## 🏗️ Architecture & Project Structure

```text
ExpenseTracker/
├── src/
│   ├── app/
│   │   ├── globals.css          # Tailwind directives, animations & theme vars
│   │   ├── layout.tsx           # Root layout with Theme, Toast, and Expense providers
│   │   └── page.tsx             # Main dashboard shell & tab controller
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── BudgetProgress.tsx    # Monthly targets & category budget editor
│   │   │   ├── RecentExpenses.tsx    # Quick recent transactions preview
│   │   │   ├── SpendingCharts.tsx    # Recharts donut, trend, & monthly bar charts
│   │   │   └── SummaryCards.tsx      # High-level metrics & MoM indicators
│   │   ├── expenses/
│   │   │   ├── DeleteConfirmModal.tsx    # Safe deletion dialog
│   │   │   ├── ExpenseExportImport.tsx  # CSV/JSON export & backup importer
│   │   │   ├── ExpenseFilters.tsx       # Search, date presets, sorting, & ranges
│   │   │   ├── ExpenseFormModal.tsx     # Validated add/edit expense modal
│   │   │   └── ExpenseList.tsx          # Responsive table & mobile cards
│   │   ├── layout/
│   │   │   └── Navbar.tsx            # Header, currency selector, theme switch & tabs
│   │   └── ui/
│   │       ├── CategoryBadge.tsx     # Color-coded category pill
│   │       ├── CategoryIcon.tsx      # Lucide icon mapping
│   │       ├── Modal.tsx             # Accessible animated dialog wrapper
│   │       └── Toast.tsx             # Floating notification alerts
│   ├── context/
│   │   ├── ExpenseContext.tsx   # Global state, filtered queries, & calculations
│   │   ├── ThemeContext.tsx     # Light / Dark / System theme management
│   │   └── ToastContext.tsx     # Dynamic user action feedback
│   ├── types/
│   │   └── expense.ts           # TypeScript interfaces & types
│   └── utils/
│       ├── constants.ts         # Categories, currencies, and default configurations
│       ├── csvExport.ts         # CSV formatting, JSON backup, and file parser
│       ├── formatters.ts        # Currency, date, and percentage formatters
│       ├── sampleData.ts        # Dynamic sample transactions generator
│       └── storage.ts           # Safe localStorage persistence helpers
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18.0.0 or higher (v20+ recommended)
- **npm** or **yarn** / **pnpm**

### 2. Installation
From the project root directory:
```bash
npm install
```

### 3. Running in Development Mode
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running the Production Build
To create an optimized production build:
```bash
npm run build
npm start
```

---

## 🧪 Testing Features Guide

1. **Adding an Expense**:
   - Click the **"Add Expense"** button in the top navbar or header.
   - Test validation by submitting an empty form (required errors will appear).
   - Enter a description (e.g. `Dinner with friends`), amount (e.g. `45.50`), select category `Food`, pick today's date, choose payment method `Credit Card`, and add optional notes.
   - Click **"Add Expense"**. A success toast appears, and all charts and totals immediately update.

2. **Viewing & Filtering Expenses**:
   - Click the **"Expenses"** tab in the navigation.
   - Use the **Search bar** to search for keywords (e.g. `grocery` or `subway`).
   - Click on the **Timeframe pills** (*Today, This Week, This Month, All Time*).
   - Click the sliders icon to test the **Custom Date Range** or **Min/Max Amount** filters.
   - Change the **Sort By** dropdown (e.g. *Amount: High to Low*).

3. **Editing & Deleting**:
   - In the Expenses list, click the **Pencil icon** to edit an expense's amount or description.
   - Click the **Trash icon** to open the confirmation modal before removing an expense.

4. **Visual Charts & Analytics**:
   - Switch between **"Categories"** (donut chart), **"14-Day Trend"** (area chart), and **"Monthly"** (bar chart).
   - Hover over chart segments to inspect detailed tooltips.

5. **Budget Limits**:
   - Click **"Adjust Budgets"** in the Monthly Budget Tracker card.
   - Update your monthly overall target or specific category limits to see real-time progress calculations and alerts.

6. **Currency Switching & Dark Mode**:
   - Select another currency from the header dropdown (e.g., `EUR €` or `GBP £`). All numbers across summaries, charts, lists, and tables update instantly.
   - Click the **Sun / Moon icon** to toggle between light and dark modes.

7. **Export & Backup**:
   - Click **"Export"** in the top navigation.
   - Click **"Export to CSV"** to download an Excel/Sheets-ready `.csv` file.
   - Click **"Export Backup (JSON)"** to save a snapshot.
   - Test the **"Reset Sample Data"** button to restore sample transactions anytime.
