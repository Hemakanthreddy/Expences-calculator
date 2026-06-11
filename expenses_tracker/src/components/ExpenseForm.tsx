import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionCategory, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatRupees } from '../types';
import { PlusCircle, Calendar, IndianRupee, Tag, FileText, Check, TrendingDown, TrendingUp } from 'lucide-react';

interface ExpenseFormProps {
  onAddExpense: (transaction: Omit<Transaction, 'id'>) => void;
}

export default function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    return localToday.toISOString().split('T')[0];
  });
  const [category, setCategory] = useState<TransactionCategory>('Food & Dining');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  // Set default category when type transitions
  useEffect(() => {
    if (type === 'expense') {
      setCategory('Food & Dining');
    } else {
      setCategory('Salary');
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return;

    onAddExpense({
      title: title.trim(),
      amount: parseFloat(amount),
      date,
      type,
      category,
      notes: notes.trim() || undefined,
    });

    // Reset Form
    setTitle('');
    setAmount('');
    setNotes('');
    
    // Show quick feedback
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div id="expense-form-container" className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6">
      
      {/* Transaction Type Picker Header */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            type === 'expense'
              ? 'bg-red-500 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingDown size={14} />
          Record Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            type === 'income'
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={14} />
          Record Income
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
          <PlusCircle size={20} />
        </div>
        <h2 id="form-heading" className="text-base font-semibold tracking-tight text-slate-800 font-display">
          {type === 'expense' ? 'New Expense Transaction' : 'New Income Transaction'}
        </h2>
      </div>

      <form id="expense-addition-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Title / Description */}
        <div>
          <label htmlFor="expense-title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Description / Source *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <FileText size={16} />
            </span>
            <input
              id="expense-title"
              type="text"
              required
              placeholder={type === 'expense' ? "e.g. Weekly Groceries, Gas refill" : "e.g. Monthly Salary, Freelance project"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount */}
          <div>
            <label htmlFor="expense-amount" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Amount (Rupees ₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold font-sans">
                ₹
              </span>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all font-mono text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="expense-date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Date *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Calendar size={16} />
              </span>
              <input
                id="expense-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Category drop down selection */}
        <div>
          <label htmlFor="expense-category" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Category *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Tag size={16} />
            </span>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 appearance-none cursor-pointer"
            >
              {currentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-xs">
              ▼
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="expense-notes" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Additional Notes <span className="text-slate-350 italic">(Optional)</span>
          </label>
          <textarea
            id="expense-notes"
            rows={2}
            placeholder="Add context, project name, vendor..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 resize-none"
          />
        </div>

        {/* Submit button depending on style toggled */}
        <button
          id="expense-submit-btn"
          type="submit"
          disabled={success}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
            success
              ? 'bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600'
              : type === 'expense'
                ? 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.99]'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]'
          }`}
        >
          {success ? (
            <>
              <Check size={18} />
              Saved Successfully!
            </>
          ) : (
            <>
              <PlusCircle size={18} />
              {type === 'expense' ? 'Add Expense Entry' : 'Add Income Entry'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
