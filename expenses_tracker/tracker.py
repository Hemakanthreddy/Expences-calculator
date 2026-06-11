#!/usr/bin/env python3
"""
================================================================================
          RUPEE (₹) PERSONAL FINANCE TRACKER - VS CODE COMPANION
================================================================================
An interactive Python utility to manage your Incomes, Expenses, and savings.
Specifically optimized to run simply in VS Code with an interactive terminal menu!

🔌 DEPENDENCIES REQUIRED FOR CHARTS VISUALIZATION:
   pip install pandas matplotlib

🏃 TO RUN IN VS CODE:
   1. Open the terminal in VS Code (Ctrl + ` on Windows/Linux or Cmd + ` on Mac)
   2. Run: python tracker.py
================================================================================
"""

import os
import sys
import sqlite3
from datetime import datetime

# Local database file
DB_FILE = "finance_database.db"

# Sample initial data in Rupees (₹) to populate if empty
INITIAL_DATA = [
    ('Salary Credit', 'income', 65000.00, '2026-05-01', 'Salary', 'Primary job paycheck'),
    ('Freelance Work', 'income', 12500.00, '2026-05-15', 'Freelance', 'Web development task'),
    ('Apartment Rent', 'expense', 18000.00, '2026-05-05', 'Housing', 'Monthly rent debit'),
    ('Groceries Foods', 'expense', 4500.00, '2026-05-10', 'Groceries', 'Supermarket bill'),
    ('WiFi Fiber Internet', 'expense', 999.00, '2026-05-12', 'Utilities', 'Broadband bill'),
    ('Salary Credit', 'income', 65000.00, '2026-06-01', 'Salary', 'Primary job paycheck'),
    ('Home Rent', 'expense', 18000.00, '2026-06-05', 'Housing', 'Monthly rent debit'),
    ('Vehicle Petrol', 'expense', 2200.00, '2026-06-08', 'Transport', 'Car full tank'),
    ('Weekly Diner Foods', 'expense', 1500.00, '2026-06-10', 'Food & Dining', 'Dinner with friends')
]

def init_db():
    is_new = not os.path.exists(DB_FILE)
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

    if is_new:
        cursor.executemany(
            "INSERT INTO transactions (title, type, amount, date, category, notes) VALUES (?, ?, ?, ?, ?, ?)",
            INITIAL_DATA
        )
        conn.commit()
    conn.close()

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

# 1. Add Transaction
def add_new_item():
    print("\n--- RECORD NEW TRANSACTION ---")
    
    # Type selection
    tx_type = ""
    while tx_type not in ['income', 'expense']:
        choice = input("Enter Type (1 for Expense, 2 for Income): ").strip()
        if choice == '1':
            tx_type = "expense"
        elif choice == '2':
            tx_type = "income"
        else:
            print("Invalid selection! Please enter 1 or 2.")

    # Details Input
    title = input("Description/Name (e.g. Groceries): ").strip()
    if not title:
        title = "Untitled Entry"

    # Amount (INR)
    while True:
        try:
            amount = float(input("Amount (in Rupees ₹): ").strip())
            if amount <= 0:
                print("Amount should be greater than zero.")
                continue
            break
        except ValueError:
            print("Invalid number. Please specify a numeric amount.")

    # Date
    date_str = input("Date in YYYY-MM-DD (Press Enter for Today): ").strip()
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")

    # Category Selection
    if tx_type == 'expense':
        print("\nCommon Categories: Food & Dining, Transport, Housing, Utilities, Groceries, Education, Other")
    else:
        print("\nCommon Categories: Salary, Freelance, Investments, Gifts, Other Income")
    category = input("Enter Category: ").strip()
    if not category:
        category = "Other"

    notes = input("Additional notes (Optional): ").strip()

    # Save to SQLite
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO transactions (title, type, amount, date, category, notes) VALUES (?, ?, ?, ?, ?, ?)",
        (title, tx_type, amount, date_str, category, notes)
    )
    conn.commit()
    conn.close()

    print(f"\n✔ Success! Saved {tx_type}: '{title}' of ₹{amount:,.2f} on {date_str}!")
    input("\nPress Enter to return...")

# 2. View Transactions Table
def view_all_transactions():
    print("\n--- ALL RECORDED TRANSACTION LOGS ---")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, date, type, category, title, amount FROM transactions ORDER BY date DESC")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        print("No transactions recorded yet! Select option [1] to add your first logs.")
        input("\nPress Enter to return...")
        return

    print("="*82)
    print(f"{'ID':<4} | {'Date':<10} | {'Type':<7} | {'Category':<15} | {'Description':<25} | {'Amount (₹)':<12}")
    print("="*82)
    for r in rows:
        tx_id, date, tx_type, category, title, amount = r
        pref = "+" if tx_type == 'income' else "-"
        amt_f = f"{pref} ₹{amount:,.2f}"
        print(f"{tx_id:<4} | {date:<10} | {tx_type.upper():<7} | {category[:15]:<15} | {title[:25]:<25} | {amt_f:<12}")
    print("="*82)
    input("\nPress Enter to return...")

# 3. Delete Transaction
def delete_item():
    print("\n--- DELETE AN ENTRY ---")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, date, type, title, amount FROM transactions ORDER BY date DESC LIMIT 15")
    rows = cursor.fetchall()
    
    if not rows:
        print("No transactions available to delete.")
        conn.close()
        input("\nPress Enter to return...")
        return

    print("Last 15 logs added:")
    for r in rows:
        print(f" ID: {r[0]} | {r[1]} | {r[2].upper()} | {r[3]} | ₹{r[4]:,.2f}")
    
    try:
        delete_id = int(input("\nEnter the ID of the transaction to delete: ").strip())
        cursor.execute("DELETE FROM transactions WHERE id = ?", (delete_id,))
        affected = cursor.rowcount
        conn.commit()
        if affected > 0:
            print(f"✔ Success! Transaction with ID {delete_id} has been deleted.")
        else:
            print("✖ No transaction found matching that ID.")
    except ValueError:
        print("Invalid ID selection. Operation cancelled.")

    conn.close()
    input("\nPress Enter to return...")

# 4. Summary & Matplotlib Visualization
def show_visual_and_math_summary():
    clear_screen()
    print("\n--- PERSONAL FINANCE & MONTHLY TREND REPORT ---")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT type, SUM(amount), COUNT(id) FROM transactions GROUP BY type")
    type_sums = dict((row[0], (row[1], row[2])) for row in cursor.fetchall())
    
    total_income = type_sums.get('income', (0.0, 0))[0]
    total_expense = type_sums.get('expense', (0.0, 0))[0]
    net_savings = total_income - total_expense
    savings_percentage = (net_savings / total_income * 100) if total_income > 0 else 0.0

    print("="*50)
    print(f" Total Inflow (Income):      ₹ {total_income:,.2f}")
    print(f" Total Outflow (Expenses):   ₹ {total_expense:,.2f}")
    print("-" * 50)
    print(f" Net Monthly Savings:        ₹ {net_savings:,.2f}")
    print(f" Net Savings Percentage:     {savings_percentage:.1f}%")
    print("="*50)

    # List expense category breakdown
    cursor.execute("SELECT category, SUM(amount) FROM transactions WHERE type='expense' GROUP BY category ORDER BY SUM(amount) DESC")
    breakdown = cursor.fetchall()
    if breakdown:
        print("\n📊 SPENDING BY CATEGORY BREAKDOWN:")
        for category, amt in breakdown:
            ratio = (amt / total_expense * 100) if total_expense > 0 else 0
            print(f"  • {category:<18} : ₹ {amt:,.2f} ({ratio:.1f}%)")

    # Render Matplotlib graphs
    try:
        import pandas as pd
        import matplotlib.pyplot as plt

        df = pd.read_sql_query("SELECT * FROM transactions", conn)
        conn.close()

        if df.empty:
            print("\nDatabase is too empty to plot charts!")
            input("\nPress Enter to return...")
            return

        print("\n📈 Initializing Matplotlib interactive window... Close chart window to continue.")
        
        # Plotting
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.to_period('M').astype(str)

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

        # 1. Monthly Trends
        monthly_cashflow = df.groupby(['month', 'type'])['amount'].sum().unstack(fill_value=0.0)
        if 'income' not in monthly_cashflow.columns: monthly_cashflow['income'] = 0.0
        if 'expense' not in monthly_cashflow.columns: monthly_cashflow['expense'] = 0.0

        monthly_cashflow.plot(kind='bar', ax=ax1, color=['#ef4444', '#10b981'], width=0.6)
        ax1.set_title("Monthly Income vs Expenses Trend (Rupees ₹)", fontsize=11, fontweight='bold', pad=10)
        ax1.set_xlabel("Month")
        ax1.set_ylabel("Rupees (₹)")
        ax1.legend(["Expenses", "Income"])
        ax1.grid(True, linestyle='--', alpha=0.3)

        # 2. Expense category distribution
        expense_df = df[df['type'] == 'expense']
        if not expense_df.empty:
            category_sums = expense_df.groupby('category')['amount'].sum()
            category_sums.plot(kind='pie', autopct='%1.1f%%', ax=ax2, startangle=140,
                               colors=['#eab308', '#3b82f6', '#ef4444', '#10b981', '#a855f7', '#ec4899'])
            ax2.set_title("Expense Category Proportion", fontsize=11, fontweight='bold', pad=10)
            ax2.set_ylabel("")
        else:
            ax2.text(0.5, 0.5, "No expense logs to chart.", ha='center', va='center')

        plt.suptitle("Personal Finance Dashboard", fontsize=14, fontweight='bold')
        plt.tight_layout()
        plt.show()

    except ImportError:
        conn.close()
        print("\n💡 Tip: Install 'pandas' and 'matplotlib' to display beautiful visual graphs in VS Code!")
        print("   Terminal Command: pip install pandas matplotlib")
    
    input("\nPress Enter to return...")

# Unified Menu loop
def main():
    init_db()
    while True:
        clear_screen()
        print("""
=====================================================
    PERSONAL BUDGET & TRANSACTION TRACKER (₹ INR)
=====================================================
 [1]. Add Income or Expense
 [2]. View Financial Log Table
 [3]. Delete Transaction Entry
 [4]. Spending Trends & Visual Charts (Summary)
 [5]. Exit Program
=====================================================""")
        choice = input("Enter your choice [1-5]: ").strip()
        
        if choice == '1':
            add_new_item()
        elif choice == '2':
            view_all_transactions()
        elif choice == '3':
            delete_item()
        elif choice == '4':
            show_visual_and_math_summary()
        elif choice == '5':
            print("\nThank you for using Expense Tracker! Goodbye.")
            sys.exit(0)

if __name__ == "__main__":
    main()
