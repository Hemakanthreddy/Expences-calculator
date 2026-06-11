import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionCategory } from './types';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import AnalyticsCharts from './components/AnalyticsCharts';
import PythonCodeCompanion from './components/PythonCodeCompanion';
import { Wallet, Smartphone, Database, RefreshCw, Sparkles, Trash2, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';

const MOCK_TRANSACTIONS: Transaction[] = [
  // January 2026 Incomes
  { id: 'tx-1', title: 'Monthly Salary Credit', amount: 85000.00, date: '2026-01-01', type: 'income', category: 'Salary', notes: 'Primary payroll transfer' },
  { id: 'tx-2', title: 'Freelance Design Project', amount: 18500.00, date: '2026-01-15', type: 'income', category: 'Freelance', notes: 'Logo design milestone' },
  
  // January 2026 Expenses
  { id: 'tx-3', title: 'Apartment Monthly Rent', amount: 22000.00, date: '2026-01-05', type: 'expense', category: 'Housing', notes: 'Deducted automatically' },
  { id: 'tx-4', title: 'Electric & Heating Bill', amount: 3120.00, date: '2026-01-18', type: 'expense', category: 'Utilities', notes: 'Winter season surcharge' },
  { id: 'tx-5', title: 'Supermarket Groceries', amount: 5640.00, date: '2026-01-22', type: 'expense', category: 'Groceries' },
  
  // February 2026 Incomes
  { id: 'tx-6', title: 'Monthly Salary Credit', amount: 85000.00, date: '2026-02-01', type: 'income', category: 'Salary' },
  { id: 'tx-7', title: 'Equity Mutual Fund Dividends', amount: 4800.00, date: '2026-02-10', type: 'income', category: 'Investments' },
  
  // February 2026 Expenses
  { id: 'tx-8', title: 'Apartment Monthly Rent', amount: 22000.00, date: '2026-02-05', type: 'expense', category: 'Housing' },
  { id: 'tx-9', title: 'Weekend Movie & Diner', amount: 4200.00, date: '2026-02-14', type: 'expense', category: 'Entertainment', notes: 'Valentines celebration' },
  { id: 'tx-10', title: 'Car Premium Fuel Refill', amount: 3500.00, date: '2026-02-20', type: 'expense', category: 'Transport' },
  
  // March 2026 Incomes
  { id: 'tx-11', title: 'Monthly Salary Credit', amount: 85000.00, date: '2026-03-01', type: 'income', category: 'Salary' },
  { id: 'tx-12', title: 'Consulting Honorarium', amount: 12000.00, date: '2026-03-25', type: 'income', category: 'Freelance', notes: 'Tech session speaker' },
  
  // March 2026 Expenses
  { id: 'tx-13', title: 'Apartment Monthly Rent', amount: 22000.00, date: '2026-03-05', type: 'expense', category: 'Housing' },
  { id: 'tx-14', title: 'Broadband Internet', amount: 1499.00, date: '2026-03-12', type: 'expense', category: 'Utilities' },
  { id: 'tx-15', title: 'Python Book Bundle', amount: 1850.00, date: '2026-03-28', type: 'expense', category: 'Education', notes: 'O\'Reilly library' }
];

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'dashboard' | 'python'>('dashboard');

  // Load from local storage with schema migration filter
  useEffect(() => {
    try {
      const saved = localStorage.getItem('expenses_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate legacy expenses with no type descriptor to standard transaction
        const migrated = parsed.map((item: any) => {
          if (!item.type) {
            return {
              ...item,
              type: 'expense',
              // Force category placeholder if invalid
              category: item.category || 'Other'
            };
          }
          return item;
        });
        setTransactions(migrated);
      } else {
        setTransactions(MOCK_TRANSACTIONS);
        localStorage.setItem('expenses_data', JSON.stringify(MOCK_TRANSACTIONS));
      }
    } catch (err) {
      console.error('Error loading transactions from localstorage', err);
      setTransactions(MOCK_TRANSACTIONS);
    }
  }, []);

  // Save to local storage on state shifts
  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem('expenses_data', JSON.stringify(newTransactions));
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const txWithId: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    const updated = [txWithId, ...transactions];
    saveTransactions(updated);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    saveTransactions(updated);
  };

  const handleResetMockData = () => {
    if (window.confirm("Reset transaction logs to default INR demonstration records? Your current additions will be replaced.")) {
      saveTransactions(MOCK_TRANSACTIONS);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear ALL logged transactions? This will reset your dashboard fully.")) {
      saveTransactions([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-6 px-4 sm:px-6 lg:px-8 flex flex-col font-sans">
      
      {/* Header Bar */}
      <header className="max-w-7xl w-full mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-100 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-850 flex items-center gap-2">
              Expense & Income Tracker
              <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
                v2.5 (Rupee ₹ Edition)
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage personal spending, records of inflows/saving trends, and generate local Python Pandas data matrices
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Workspace selector tabs */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
            <button
              onClick={() => setActiveWorkspaceTab('dashboard')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === 'dashboard'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone size={14} />
              Unified Dashboard
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('python')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === 'python'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Database size={14} />
              Python Companion
            </button>
          </div>

          {/* Quick reset actions */}
          <button
            onClick={handleResetMockData}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors rounded-xl border border-slate-100 hover:border-slate-200 cursor-pointer"
            title="Reset Mock Demo Data"
          >
            <RefreshCw size={15} />
          </button>
          
          <button
            onClick={handleClearAll}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-xl border border-slate-100 hover:border-slate-200 cursor-pointer"
            title="Wipe All Records"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
        
        {/* Left Form Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <ExpenseForm onAddExpense={handleAddTransaction} />
          
          {/* Developer Tool Tip */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-850 rounded-2xl p-5 text-white border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="relative">
              <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/35 px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">
                Developer Tool
              </span>
              <p className="font-semibold text-sm mb-1.5 font-display flex items-center gap-1.5 text-slate-200">
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                Matplotlib & SQLite Built-in
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Add incomes and expenses here, then explore the code exporter inside the <strong className="text-amber-400">Python Companion</strong> workspace to run data analytical scripts locally!
              </p>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setActiveWorkspaceTab('python')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xxs uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Generate Python Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tab Content Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeWorkspaceTab === 'dashboard' ? (
            <div className="space-y-6">
              {/* Analytics report */}
              <AnalyticsCharts expenses={transactions} />

              {/* Live search list */}
              <ExpenseList expenses={transactions} onDeleteExpense={handleDeleteTransaction} />
            </div>
          ) : (
            /* Python Code panel */
            <PythonCodeCompanion expenses={transactions} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto border-t border-slate-200 mt-12 pt-4 text-center text-xxs text-slate-400 font-mono flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© 2026 Expense & Income Tracker Applet • Full-Stack Local Playground</p>
        <div className="flex gap-4">
          <span className="hover:text-slate-600 cursor-help select-none">Python 3.10+ Compatible</span>
          <span>•</span>
          <span className="hover:text-slate-600 cursor-help select-none font-sans font-semibold">Uses Pandas & Matplotlib</span>
        </div>
      </footer>

    </div>
  );
}
