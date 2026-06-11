import React, { useState, useMemo } from 'react';
import { Transaction, CATEGORY_COLORS, ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatRupees, TransactionType, TransactionCategory } from '../types';
import { Trash2, Search, ArrowUpAZ, ArrowDownZA, Calendar, ListFilter, SlidersHorizontal, Info, ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface ExpenseListProps {
  expenses: Transaction[]; // Named 'expenses' for compatibility with other component imports
  onDeleteExpense: (id: string) => void;
}

type SortField = 'date' | 'amount' | 'title';
type SortOrder = 'asc' | 'desc';

export default function ExpenseList({ expenses: transactions, onDeleteExpense }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'All'>('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Toggle Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  // Get relevant categories for current type selection
  const relevantCategories = useMemo(() => {
    if (selectedType === 'income') return INCOME_CATEGORIES;
    if (selectedType === 'expense') return EXPENSE_CATEGORIES;
    return ALL_CATEGORIES;
  }, [selectedType]);

  // Filter and Sort Transactions
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by Type (Income/Expense/All)
    if (selectedType !== 'all') {
      result = result.filter(tx => tx.type === selectedType);
    }

    // Apply Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.title.toLowerCase().includes(term) ||
          (tx.notes && tx.notes.toLowerCase().includes(term))
      );
    }

    // Apply Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter((tx) => tx.category === selectedCategory);
    }

    // Apply Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, selectedType, searchTerm, selectedCategory, sortField, sortOrder]);

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(processedTransactions.length / itemsPerPage));
  
  // Guard current page from going out of bounds
  const currentPageClamped = Math.min(currentPage, totalPages);
  
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPageClamped - 1) * itemsPerPage;
    return processedTransactions.slice(startIdx, startIdx + itemsPerPage);
  }, [processedTransactions, currentPageClamped]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div id="expense-list-container" className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 flex flex-col h-full justify-between">
      <div>
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ListFilter size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-800 font-display">
                History & Transaction Logs
              </h2>
              <p className="text-xs text-slate-400">
                {processedTransactions.length} of {transactions.length} records matched
              </p>
            </div>
          </div>

          {/* Quick Filters Grid */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* View Type Toggle Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
              <button
                onClick={() => { setSelectedType('all'); setSelectedCategory('All'); setCurrentPage(1); }}
                className={`text-xxs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedType === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setSelectedType('income'); setSelectedCategory('All'); setCurrentPage(1); }}
                className={`text-xxs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedType === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-emerald-500'
                }`}
              >
                Incomes
              </button>
              <button
                onClick={() => { setSelectedType('expense'); setSelectedCategory('All'); setCurrentPage(1); }}
                className={`text-xxs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedType === 'expense' ? 'bg-white text-red-500 shadow-xs' : 'text-slate-500 hover:text-red-500'
                }`}
              >
                Expenses
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-44 text-slate-700">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset page to 1
                }}
                placeholder="Search logs..."
                className="w-full bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400"
              />
            </div>

            {/* Category selection */}
            <div className="relative shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as any);
                  setCurrentPage(1); // Reset page to 1
                }}
                className="w-full sm:w-36 bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer pr-8"
              >
                <option value="All">All Categories</option>
                {relevantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-2.5 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Sort Controls Bar */}
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-2 border border-slate-100 text-xxs font-semibold uppercase tracking-wider text-slate-500 mb-3 justify-between">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handleSort('title')}
              className={`hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1 ${
                sortField === 'title' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Description / Source {sortField === 'title' && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
            <button
              onClick={() => handleSort('date')}
              className={`hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1 ${
                sortField === 'date' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Date {sortField === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
          </div>
          <button
            onClick={() => handleSort('amount')}
            className={`hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1 ${
              sortField === 'amount' ? 'text-blue-600 font-bold' : ''
            }`}
          >
            Amount {sortField === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}
          </button>
        </div>

        {/* Transactions List */}
        {paginatedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-25 rounded-2xl border border-dashed border-slate-150">
            <Info size={32} className="text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm font-semibold">No records match your criteria</p>
            <p className="text-slate-400 text-xs mt-1">Try toggling filter types or checking search spelling.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
            {paginatedTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="group flex items-center justify-between p-3.5 hover:bg-slate-50/70 transition-colors bg-white hover:shadow-xs animate-fadeIn"
                >
                  {/* Category bullet & Description */}
                  <div className="flex items-center gap-3 min-w-0 max-w-[65%]">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: CATEGORY_COLORS[tx.category] || '#999' }}
                      title={tx.category}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate" title={tx.title}>
                        {tx.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-sm select-none ${
                          isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {tx.category}
                        </span>
                        {tx.notes && (
                          <p className="text-xs text-slate-400 italic truncate max-w-40 sm:max-w-64" title={tx.notes}>
                            — {tx.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount, Type Badge & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className={`font-bold text-sm font-mono flex items-center justify-end gap-1 ${
                        isIncome ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {isIncome ? '+' : '-'} {formatRupees(tx.amount)}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 select-none">
                        {tx.date}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteExpense(tx.id)}
                      className="p-1 px-1.5 text-slate-350 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 duration-150 cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
          <p className="text-xxs font-semibold uppercase tracking-wider text-slate-400">
            Page {currentPageClamped} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPageClamped === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            
            {/* Quick pages dots */}
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === currentPageClamped;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`text-xs font-mono font-medium rounded-md w-6 h-6 flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPageClamped === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
