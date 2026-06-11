export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: TransactionCategory;
  notes?: string;
}

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Transport'
  | 'Housing'
  | 'Utilities'
  | 'Entertainment'
  | 'Shopping'
  | 'Healthcare'
  | 'Travel'
  | 'Education'
  | 'Groceries'
  | 'Other';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Gifts'
  | 'Refunds'
  | 'Other Income';

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Transport',
  'Housing',
  'Utilities',
  'Groceries',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Travel',
  'Education',
  'Other'
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Refunds',
  'Other Income'
];

export const ALL_CATEGORIES: TransactionCategory[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES
];

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  // Expense Category Colors
  'Food & Dining': '#eab308', // Amber-500
  'Transport': '#3b82f6',     // Blue-500
  'Housing': '#ef4444',       // Red-500
  'Utilities': '#10b981',     // Emerald-500
  'Groceries': '#06b6d4',     // Cyan-500
  'Entertainment': '#ec4899', // Pink-500
  'Shopping': '#a855f7',      // Purple-500
  'Healthcare': '#14b8a6',    // Teal-500
  'Travel': '#6366f1',        // Indigo-500
  'Education': '#f43f5e',     // Rose-500
  'Other': '#6b7280',         // Gray-500

  // Income Category Colors
  'Salary': '#22c55e',        // Green-500
  'Freelance': '#84cc16',     // Lime-500
  'Investments': '#0284c7',   // Sky-600
  'Gifts': '#f472b6',         // Pink-400
  'Refunds': '#2563eb',       // Blue-600
  'Other Income': '#4b5563'   // Gray-600
};

export interface PandasQuery {
  id: string;
  label: string;
  code: string;
  description: string;
  expectedOutputFormat: 'table' | 'text' | 'chart';
}

// Global utility for localized Rupees format
export function formatRupees(amount: number): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });
}
