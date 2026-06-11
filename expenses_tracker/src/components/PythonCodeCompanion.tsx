import React, { useState, useMemo } from 'react';
import { Transaction, ALL_CATEGORIES, formatRupees } from '../types';
import { Terminal, Copy, Check, FileCode, Play, Sparkles, BookOpen, Database, HelpCircle } from 'lucide-react';

interface PythonCodeCompanionProps {
  expenses: Transaction[]; // Named 'expenses' for compatibility with other component imports
}

export default function PythonCodeCompanion({ expenses: transactions }: PythonCodeCompanionProps) {
  const [activeTab, setActiveTab] = useState<'simulator' | 'standalone' | 'export'>('simulator');
  const [selectedPandasCommand, setSelectedPandasCommand] = useState<string>('groupby_type');
  const [copied, setCopied] = useState(false);

  // Helper to copy strings to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert transactions to JSON string for local companion view
  const pythonDataString = useMemo(() => {
    const dataList = transactions.map(t => ({
      title: t.title,
      type: t.type,
      amount: t.amount,
      date: t.date,
      category: t.category,
      notes: t.notes || ""
    }));
    return JSON.stringify(dataList, null, 4);
  }, [transactions]);

  // Convert transactions to exact CSV string format
  const csvString = useMemo(() => {
    let csv = "date,title,type,category,amount,notes\n";
    transactions.forEach(t => {
      const titleClean = t.title.includes(',') ? `"${t.title}"` : t.title;
      const notesClean = t.notes ? (t.notes.includes(',') ? `"${t.notes}"` : t.notes) : "";
      csv += `${t.date},${titleClean},${t.type},${t.category},${t.amount},${notesClean}\n`;
    });
    return csv;
  }, [transactions]);

  // Mock Pandas outputs calculating on live React data
  const simulatedConsoleOutput = useMemo(() => {
    if (transactions.length === 0) {
      return "# Empty DataFrame. Try adding some transactions first!";
    }

    switch (selectedPandasCommand) {
      case 'groupby_type': {
        const typeMap: Record<string, number> = { income: 0, expense: 0 };
        transactions.forEach(t => {
          typeMap[t.type] = (typeMap[t.type] || 0) + t.amount;
        });

        let output = `>>> df.groupby('type')['amount'].sum()\n\n`;
        output += `type\n`;
        output += `------------------------------------\n`;
        Object.entries(typeMap).forEach(([t, sum]) => {
          output += `${t.padEnd(20)} ₹ ${sum.toFixed(2).padStart(12)}\n`;
        });
        const savings = (typeMap.income || 0) - (typeMap.expense || 0);
        output += `------------------------------------\n`;
        output += `Net Savings:         ₹ ${savings.toFixed(2)}\n`;
        output += `Name: amount, dtype: float64`;
        return output;
      }

      case 'groupby_category': {
        const catMap: Record<string, number> = {};
        transactions.forEach(t => {
          catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        });
        
        let output = `>>> df.groupby('category')['amount'].sum()\n\n`;
        output += `category\n`;
        output += `------------------------------------\n`;
        Object.entries(catMap).forEach(([cat, sum]) => {
          output += `${cat.padEnd(20)} ₹ ${sum.toFixed(2).padStart(12)}\n`;
        });
        output += `Name: amount, dtype: float64`;
        return output;
      }

      case 'groupby_month': {
        const monthMap: Record<string, { income: number; expense: number }> = {};
        transactions.forEach(t => {
          const m = t.date ? t.date.substring(0, 7) : 'Unknown';
          if (!monthMap[m]) {
            monthMap[m] = { income: 0, expense: 0 };
          }
          if (t.type === 'income') {
            monthMap[m].income += t.amount;
          } else {
            monthMap[m].expense += t.amount;
          }
        });

        const sortedMonths = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));

        let output = `>>> df.groupby(['month', 'type'])['amount'].sum()\n\n`;
        output += `${"Month".padEnd(10)} | ${"Income".padStart(14)} | ${"Expenses".padStart(14)} | ${"Savings".padStart(14)}\n`;
        output += `-------------------------------------------------------------\n`;
        sortedMonths.forEach(([mon, vals]) => {
          const net = vals.income - vals.expense;
          output += `${mon.padEnd(10)} | ₹ ${vals.income.toFixed(2).padStart(12)} | ₹ ${vals.expense.toFixed(2).padStart(12)} | ₹ ${net.toFixed(2).padStart(12)}\n`;
        });
        return output;
      }

      case 'describe': {
        const amounts = transactions.map(t => t.amount);
        const count = amounts.length;
        const sum = amounts.reduce((s, a) => s + a, 0);
        const mean = sum / count;
        
        // standard deviation
        const variance = amounts.reduce((s, a) => s + Math.pow(a - mean, 2), 0) / Math.max(1, count - 1);
        const std = Math.sqrt(variance);

        const sorted = [...amounts].sort((a, b) => a - b);
        const min = sorted[0] || 0;
        const max = sorted[count - 1] || 0;
        const p25 = sorted[Math.floor(count * 0.25)] || 0;
        const p50 = sorted[Math.floor(count * 0.50)] || 0;
        const p75 = sorted[Math.floor(count * 0.75)] || 0;

        let output = `>>> df['amount'].describe()\n\n`;
        output += `${"count".padEnd(15)} ${count.toFixed(6).padStart(15)}\n`;
        output += `${"mean".padEnd(15)} ${mean.toFixed(6).padStart(15)}\n`;
        output += `${"std".padEnd(15)} ${std.toFixed(6).padStart(15)}\n`;
        output += `${"min".padEnd(15)} ${min.toFixed(6).padStart(15)}\n`;
        output += `${"25%".padEnd(15)} ${p25.toFixed(6).padStart(15)}\n`;
        output += `${"50%".padEnd(15)} ${p50.toFixed(6).padStart(15)}\n`;
        output += `${"75%".padEnd(15)} ${p75.toFixed(6).padStart(15)}\n`;
        output += `${"max".padEnd(15)} ${max.toFixed(6).padStart(15)}\n`;
        output += `Name: amount, dtype: float64`;
        return output;
      }

      case 'filter_high': {
        const highVal = transactions.filter(t => t.amount > 5000);
        let output = `>>> df[df['amount'] > 5000.00]\n\n`;
        if (highVal.length === 0) {
          output += "Empty DataFrame: No items or cashflow exceed ₹ 5,000.00 in this set";
          return output;
        }

        output += `${"index".padEnd(6)} ${"date".padEnd(12)} ${"type".padEnd(8)} ${"title".padEnd(18)} ${"amount".padStart(12)}\n`;
        output += `-----------------------------------------------------------------------------\n`;
        highVal.forEach((t, i) => {
          const title = t.title.substring(0, 16);
          output += `${String(i).padEnd(6)} ${t.date.padEnd(12)} ${t.type.padEnd(8)} ${title.padEnd(18)} ₹ ${t.amount.toFixed(2).padStart(10)}\n`;
        });
        return output;
      }

      default:
        return ">>> # Command selected";
    }
  }, [transactions, selectedPandasCommand]);

  // Complete standalone CLI script content
  const standalonePythonCode = useMemo(() => {
    return `#!/usr/bin/env python3
"""
Python Personal Income & Expense Tracker CLI
An offline tool with full adding, deletion, querying, and Matplotlib reports to visualize monthly trends.
Compatible with SQLite for robust persistent file storage. Amounts stored in Rupees (₹).
"""

import sqlite3
import argparse
import sys
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt

DB_FILE = "transactions.db"

def init_db():
    """Initializes the SQLite database with proper unified transactions schema."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            type TEXT NOT NULL, -- 'income' or 'expense'
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            category TEXT NOT NULL,
            notes TEXT
        )
    """)
    conn.commit()
    conn.close()

def add_transaction(title, tx_type, amount, date, category, notes):
    """Inserts a new transaction record into the local SQLite database."""
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO transactions (title, type, amount, date, category, notes) VALUES (?, ?, ?, ?, ?, ?)",
        (title, tx_type, amount, date, category, notes)
    )
    conn.commit()
    conn.close()
    print(f"✔ Successfully saved {tx_type}: '{title}' (₹ {amount:.2f})")

def list_transactions():
    """Fetches and displays logged transaction entries as a Pandas DataFrame table."""
    conn = sqlite3.connect(DB_FILE)
    df = pd.read_sql_query("SELECT id, date, type, title, category, amount, notes FROM transactions ORDER BY date DESC", conn)
    conn.close()

    if df.empty:
        print("ℹ No transaction logs found. Add one using '--add' command!")
        return

    print("\\n=== Current Recorded Transactions ===")
    print(df.to_string(index=False))
    print("======================================\\n")

def delete_transaction(transaction_id):
    """Deletes a transaction row matching the unique ID."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    if deleted:
        print(f"✔ Deleted transaction row with ID {transaction_id}.")
    else:
        print(f"✖ Error: No record found matching ID {transaction_id}.")

def show_summary():
    """Generates a text report and launches Matplotlib for monthly spending and saving trends."""
    conn = sqlite3.connect(DB_FILE)
    df = pd.read_sql_query("SELECT * FROM transactions", conn)
    conn.close()

    if df.empty:
        print("✖ No data recorded to generate transaction trends charts.")
        return

    # Parse groupings
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M')

    income_df = df[df['type'] == 'income']
    expense_df = df[df['type'] == 'expense']

    monthly_income = income_df.groupby('month')['amount'].sum()
    monthly_expense = expense_df.groupby('month')['amount'].sum()

    category_totals = expense_df.groupby('category')['amount'].sum()

    total_in = income_df['amount'].sum()
    total_out = expense_df['amount'].sum()
    net_savings = total_in - total_out

    print("\\n" + "="*45)
    print("      PYTHON CASHFLOW & SAVINGS SUMMARY")
    print("="*45)
    print(f"Total Transactions: {len(df)}")
    print(f"Total Credits (In):  ₹ {total_in:.2f}")
    print(f"Total Debits (Out):  ₹ {total_out:.2f}")
    print(f"Net Savings Rate:   ₹ {net_savings:.2f}")
    print(f"Savings Ratio (%):  {((net_savings/total_in*100) if total_in > 0 else 0):.1f}%")
    print("\\n--- Expense Category Breakdown ---")
    for cat, val in category_totals.items():
        print(f" - {cat:<18}: ₹ {val:.2f}")
    print("="*45 + "\\n")

    # Combine data for monthly visuals
    all_months = df['month'].unique()
    all_months = sorted(all_months)
    chart_data = pd.DataFrame(index=[str(m) for m in all_months], columns=['Income', 'Expenses']).fillna(0.0)

    for m in all_months:
        chart_data.loc[str(m), 'Income'] = income_df[income_df['month'] == m]['amount'].sum()
        chart_data.loc[str(m), 'Expenses'] = expense_df[expense_df['month'] == m]['amount'].sum()

    # Matplotlib double visualization
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    
    # 1. Income vs Expense Trend Bar Chart
    chart_data.plot(kind='bar', ax=ax1, color=['#22c55e', '#ef4444'], width=0.6)
    ax1.set_title("Monthly Income vs Expenses (Rupees ₹)", fontsize=11, fontweight='bold', pad=10)
    ax1.set_xlabel("Month")
    ax1.set_ylabel("Total (Rupees)")
    ax1.grid(True, linestyle='--', alpha=0.3)
    ax1.tick_params(axis='x', rotation=30)

    # 2. Expense Category Pie
    if not category_totals.empty:
        category_totals.plot(kind='pie', autopct='%1.1f%%', ax=ax2, startangle=140, 
                             colors=['#eab308', '#3b82f6', '#ef4444', '#10b981', '#a855f7', '#ec4899'])
        ax2.set_title("Spending Category Distribution", fontsize=11, fontweight='bold', pad=10)
        ax2.set_ylabel("") # Remove default label
    else:
        ax2.text(0.5, 0.5, "No Expense Data Available", ha='center', va='center', fontsize=12)

    plt.tight_layout()
    print("📊 Launching interactive visual cashflow figures... Close the chart window to return.")
    plt.show()

def main():
    parser = argparse.ArgumentParser(description="Python Personal Finance & cashflow CLI")
    parser.add_argument("--init", action="store_true", help="Initialize SQLite database setup helper")
    parser.add_argument("--add", action="store_true", help="Add a new transaction record")
    parser.add_argument("--type", type=str, choices=['income', 'expense'], default='expense', help="Specify if income or expense")
    parser.add_argument("--delete", type=int, help="Specify an ID to delete from the transaction db")
    parser.add_argument("--list", action="store_true", help="List all current transaction entries")
    parser.add_argument("--summary", action="store_true", help="Display net savings and plot monthly trend")
    
    # Arguments for insertion
    parser.add_argument("--title", type=str, help="Transaction title/source description")
    parser.add_argument("--amount", type=float, help="Transaction value in Rupees")
    parser.add_argument("--date", type=str, help="Transaction date (YYYY-MM-DD)")
    parser.add_argument("--category", type=str, help="Transaction tag category")
    parser.add_argument("--notes", type=str, default="", help="Additional notations")

    args = parser.parse_args()
    init_db()

    if args.add:
        if not args.title or args.amount is None or not args.category:
            print("✖ Error: --add requires '--title', '--amount', and '--category'")
            sys.exit(1)
        add_transaction(args.title, args.type, args.amount, args.date, args.category, args.notes)
    elif args.delete is not None:
        delete_transaction(args.delete)
    elif args.list:
        list_transactions()
    elif args.summary:
        show_summary()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
`;
  }, []);

  // Compact copyable script to load live React table data into pandas
  const livePandasLoaderCode = useMemo(() => {
    return `import pandas as pd
import io

# Live cashflow dataset exported as CSV from the React Applet
csv_data = """${csvString.trim()}"""

# Load the data directly into a Pandas DataFrame
df = pd.read_csv(io.StringIO(csv_data))

# Convert columns to appropriate types
df['date'] = pd.to_datetime(df['date'])
df['amount'] = pd.to_numeric(df['amount'])

# Print general dataset info
print("--- DATAFRAME FIRST FIVE RECORD ENTRIES ---")
print(df.head())
print("\\n--- FINANCIAL BREAKDOWNS BY TYPE (Rupees) ---")
print(df.groupby('type')['amount'].sum())
print("\\n--- DETAILED SUMMARY METRICS ---")
print(df.describe())
`;
  }, [csvString]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-50 text-amber-600 rounded-lg">
              <FileCode size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-800 font-display">
                Python Code Companion
              </h2>
              <p className="text-xs text-slate-400">
                Execute local scripts and simulate analytical Pandas workflows
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('simulator'); setCopied(false); }}
            className={`flex-1 sm:flex-none text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pandas Simulator
          </button>
          <button
            onClick={() => { setActiveTab('standalone'); setCopied(false); }}
            className={`flex-1 sm:flex-none text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'standalone'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            CLI Script
          </button>
          <button
            onClick={() => { setActiveTab('export'); setCopied(false); }}
            className={`flex-1 sm:flex-none text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dataset Export
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'simulator' && (
        <div className="space-y-4">
          <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-xs text-amber-800 leading-relaxed flex gap-3">
            <span className="p-1 text-amber-600 font-bold text-lg select-none leading-none">💡</span>
            <div>
              <p className="font-semibold mb-0.5">Live Dataset Interactive Pandas Interpreter</p>
              <p className="text-slate-600">
                The terminal below acts as an interactive Python workspace. Select a Pandas analytical aggregation from the selectors to preview the real-time calculated DataFrame output!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Command selectors list */}
            <div className="space-y-2 md:col-span-1">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Select Pandas Command:
              </label>

              {[
                { id: 'groupby_type', label: "Income vs Expense sum", code: "df.groupby('type')['amount'].sum()" },
                { id: 'groupby_category', label: "Category aggregate", code: "df.groupby('category')['amount'].sum()" },
                { id: 'groupby_month', label: "Monthly Trends matrix", code: "df.groupby(['month', 'type'])['amount'].sum()" },
                { id: 'describe', label: "Finance summary stats", code: "df['amount'].describe()" },
                { id: 'filter_high', label: "High operations > ₹5,000", code: "df[df['amount'] > 5000]" },
              ].map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => setSelectedPandasCommand(cmd.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                    selectedPandasCommand === cmd.id
                      ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-25/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate block font-semibold text-slate-800 group-hover:text-blue-700">
                      {cmd.label}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 truncate mt-0.5 group-hover:text-slate-600">
                      {cmd.code}
                    </p>
                  </div>
                  <Play
                    size={12}
                    className={`shrink-0 transition-transform ${
                      selectedPandasCommand === cmd.id ? 'translate-x-0.5 text-blue-600' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Simulated Console Screen */}
            <div className="md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between bg-slate-900 border-b border-slate-850 px-4 py-2 rounded-t-xl select-none">
                  <div className="flex items-center gap-1.5">
                    <Terminal size={14} className="text-amber-500" />
                    <span className="text-xxs font-mono text-slate-300 font-semibold uppercase">
                      Pandas Terminal Emulator
                    </span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-750" />
                </div>

                <div className="bg-slate-950 p-4 rounded-b-xl max-h-72 overflow-y-auto font-mono text-xs text-emerald-400 border border-slate-900/60 leading-relaxed shadow-inner">
                  <span className="text-slate-500 block mb-2"># Live interpreter loaded. DataFrame: `df` ({transactions.length} rows)</span>
                  <pre className="whitespace-pre-wrap">{simulatedConsoleOutput}</pre>
                </div>
              </div>

              {/* Actions below interpreter */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleCopy(simulatedConsoleOutput)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xxs font-bold uppercase tracking-wider p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors ml-auto cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copied ? "Copied Console" : "Copy Output"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'standalone' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-250 p-4 rounded-xl text-xs text-slate-700 leading-relaxed">
            <div className="flex items-center gap-2 mb-2">
              <Database size={16} className="text-slate-500" />
              <p className="font-semibold text-slate-800">Local SQLite Python Command Line Tool</p>
            </div>
            <p className="mb-2">
              Want to run your personal finance tracker program locally? Below is a standalone Python 3 program equipped with an SQLite database engine, cashflow filters, unified entry lists, and built-in Matplotlib dual trends bar charts.
            </p>
            <p className="font-bold text-slate-800">How to Setup & Run locally:</p>
            <ol className="list-decimal pl-4 space-y-1 mt-1 font-mono text-[11px] text-slate-600">
              <li>Open terminal and install dependencies: <span className="bg-slate-100 text-slate-850 px-1.5 py-0.2 rounded font-bold">pip install pandas matplotlib</span></li>
              <li>Save this code to a local script named <span className="bg-slate-100 text-slate-850 px-1.5 py-0.2 rounded font-bold">finance_tracker.py</span></li>
              <li>Add expense: <span className="text-blue-700">python finance_tracker.py --add --type expense --title "Coffee" --amount 180 --category "Food & Dining"</span></li>
              <li>Add income: <span className="text-emerald-700">python finance_tracker.py --add --type income --title "Consulting Pay" --amount 35000 --category "Freelance"</span></li>
              <li>Display list of rows: <span className="text-blue-700">python finance_tracker.py --list</span></li>
              <li>Show summary savings & charts: <span className="text-blue-700">python finance_tracker.py --summary</span></li>
            </ol>
          </div>

          {/* Standalone Script View Code */}
          <div className="relative">
            <button
              onClick={() => handleCopy(standalonePythonCode)}
              className="absolute right-3 top-3 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors border border-slate-700 flex items-center gap-1 cursor-pointer"
              title="Copy Standalone Script"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider">{copied ? "Copied" : "Copy Script"}</span>
            </button>

            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-md">
              <div className="bg-slate-850 border-b border-slate-800 px-4 py-2.5">
                <span className="text-xxs font-mono text-slate-350 font-bold uppercase tracking-widest block">
                  finance_tracker.py (SQLite CLI + Matplotlib)
                </span>
              </div>
              <div className="p-4 overflow-x-auto max-h-72 text-xxs font-mono text-slate-200 bg-slate-950 scrollbar-thin">
                <pre>{standalonePythonCode}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Need to analyze your live cashflow data from this app in Python locally? Directly copy this Python initialization script. It embeds your active data as a multi-line CSV string, feeding it right into Pandas for zero-friction analysis:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live Data Block */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xxs font-bold text-slate-400 uppercase tracking-widest">
                  Live React Data (CSV Form)
                </label>
                <button
                  onClick={() => handleCopy(csvString)}
                  className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={10} /> Copy CSV
                </button>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto text-xxs font-mono text-slate-700">
                {transactions.length === 0 ? (
                  <span className="text-slate-400 italic">No recorded data in tables</span>
                ) : (
                  <pre>{csvString}</pre>
                )}
              </div>
            </div>

            {/* pandas Loading Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xxs font-bold text-slate-400 uppercase tracking-widest">
                  Pandas CSV Load Script
                </label>
                <button
                  onClick={() => handleCopy(livePandasLoaderCode)}
                  className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={10} /> Copy Loader
                </button>
              </div>
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3 max-h-56 overflow-y-auto text-xxs font-mono border border-slate-800">
                <pre>{livePandasLoaderCode}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
