import React, { useMemo, useState } from 'react';
import { Transaction, CATEGORY_COLORS, EXPENSE_CATEGORIES, formatRupees, ExpenseCategory } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, TrendingDown, Landmark, Calendar, Sparkles, Layers, DollarSign, Filter, Activity } from 'lucide-react';

interface AnalyticsChartsProps {
  expenses: Transaction[]; // Named 'expenses' for compatibility with other component imports
}

export default function AnalyticsCharts({ expenses: transactions }: AnalyticsChartsProps) {
  // Aggregate data by month for Grouped cashflow + Stacked spending categories
  const monthlyData = useMemo(() => {
    // Collect all unique year-months chronologically
    const map: Record<string, { label: string; income: number; expenses: number; [key: string]: any }> = {};

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const dateObj = new Date(tx.date);
      if (isNaN(dateObj.getTime())) return;

      const year = dateObj.getFullYear();
      const monthLabel = dateObj.toLocaleString('default', { month: 'short' });
      const key = `${year}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthLabel} ${year}`;

      if (!map[key]) {
        map[key] = {
          label,
          key,
          income: 0,
          expenses: 0,
          rawDate: dateObj
        };
        // Initialize all categories to 0
        EXPENSE_CATEGORIES.forEach(cat => {
          map[key][cat] = 0;
        });
      }

      const val = parseFloat(tx.amount.toFixed(2));
      if (tx.type === 'income') {
        map[key].income += val;
      } else {
        map[key].expenses += val;
        // Allocate category spending if it is an expense category
        if (EXPENSE_CATEGORIES.includes(tx.category as any)) {
          map[key][tx.category] = (map[key][tx.category] || 0) + val;
        } else {
          map[key]['Other'] = (map[key]['Other'] || 0) + val;
        }
      }
    });

    // Sort chronologically and format
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => {
        const item: any = {
          month: val.label,
          key: val.key,
          Income: parseFloat(val.income.toFixed(2)),
          Expenses: parseFloat(val.expenses.toFixed(2)),
          Savings: parseFloat((val.income - val.expenses).toFixed(2))
        };
        // Copy categories over
        EXPENSE_CATEGORIES.forEach(cat => {
          item[cat] = parseFloat((val[cat] || 0).toFixed(2));
        });
        return item;
      });
  }, [transactions]);

  // Overall category aggregation for pie chart
  const categoryData = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    const incomeMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        expenseMap[tx.category] = (expenseMap[tx.category] || 0) + tx.amount;
      } else {
        incomeMap[tx.category] = (incomeMap[tx.category] || 0) + tx.amount;
      }
    });

    const expensesList = Object.entries(expenseMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || '#6b7280'
    })).sort((a, b) => b.value - a.value);

    const incomesList = Object.entries(incomeMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || '#10b981'
    })).sort((a, b) => b.value - a.value);

    return { expensesList, incomesList };
  }, [transactions]);

  // General Metrics across all time
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let expensesCount = 0;
    let incomeCount = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        incomeCount++;
      } else {
        totalExpenses += tx.amount;
        expensesCount++;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      expensesCount,
      incomeCount,
      totalCount: transactions.length
    };
  }, [transactions]);

  // Selected Month Breakdown Explorer
  const monthLabels = useMemo(() => {
    return monthlyData.map(m => ({ key: m.key, label: m.month }));
  }, [monthlyData]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('All');

  const filteredMonthBreakdown = useMemo(() => {
    if (selectedMonthKey === 'All') {
      // Sum everything
      const catMap: Record<string, number> = {};
      let totalExp = 0;
      transactions.forEach(tx => {
        if (tx.type === 'expense') {
          catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
          totalExp += tx.amount;
        }
      });

      return Object.entries(catMap).map(([category, amt]) => ({
        category,
        amount: amt,
        percentage: totalExp > 0 ? (amt / totalExp) * 100 : 0,
        color: CATEGORY_COLORS[category as ExpenseCategory] || '#a855f7'
      })).sort((a,b) => b.amount - a.amount);
    } else {
      // Sum for specific month key
      const catMap: Record<string, number> = {};
      let totalExp = 0;
      transactions.forEach(tx => {
        if (tx.type === 'expense' && tx.date && tx.date.startsWith(selectedMonthKey)) {
          catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
          totalExp += tx.amount;
        }
      });

      return Object.entries(catMap).map(([category, amt]) => ({
        category,
        amount: amt,
        percentage: totalExp > 0 ? (amt / totalExp) * 100 : 0,
        color: CATEGORY_COLORS[category as ExpenseCategory] || '#a855f7'
      })).sort((a,b) => b.amount - a.amount);
    }
  }, [transactions, selectedMonthKey]);

  // Tooltips React component
  const cashflowTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-lg border border-slate-800 text-xs font-mono leading-relaxed">
          <p className="font-semibold font-sans mb-1.5 text-slate-300 text-sm border-b border-slate-800 pb-1">{label}</p>
          <p className="text-emerald-400 font-bold flex justify-between gap-4">
            <span>Income:</span> 
            <span>{formatRupees(payload[0]?.value || 0)}</span>
          </p>
          {payload[1] && (
            <p className="text-red-400 font-bold flex justify-between gap-4">
              <span>Expenses:</span> 
              <span>{formatRupees(payload[1]?.value || 0)}</span>
            </p>
          )}
          <p className="text-blue-400 font-bold border-t border-slate-800 mt-1 pt-1 flex justify-between gap-4">
            <span>Savings:</span> 
            <span>{formatRupees((payload[0]?.value || 0) - (payload[1]?.value || 0))}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const spendingTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-md border border-slate-800 text-xs leading-normal">
          <p className="font-semibold font-sans mb-2 text-slate-300 border-b border-slate-800 pb-1">{label} Category Costs</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {payload.filter((p: any) => p.value > 0).map((p: any) => (
              <p key={p.name} className="font-mono flex justify-between gap-5 text-[11px]" style={{ color: p.color }}>
                <span>{p.name}:</span>
                <span className="font-bold">{formatRupees(p.value)}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* 4 Multi-metric Cards with local Indian Rupee Representation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Income */}
        <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-400 text-xxs font-semibold uppercase tracking-wider">Total Income</p>
            <p className="text-lg font-bold text-slate-850 font-mono tracking-tight text-emerald-600 truncate">
              {formatRupees(metrics.totalIncome)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium select-none truncate">
              {metrics.incomeCount} credits
            </p>
          </div>
        </div>

        {/* Card 2: Expenses */}
        <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <TrendingDown size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-400 text-xxs font-semibold uppercase tracking-wider">Total Spending</p>
            <p className="text-lg font-bold text-slate-850 font-mono tracking-tight text-red-500 truncate">
              {formatRupees(metrics.totalExpenses)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium select-none truncate">
              {metrics.expensesCount} debits
            </p>
          </div>
        </div>

        {/* Card 3: Net Savings */}
        <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Landmark size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-400 text-xxs font-semibold uppercase tracking-wider">Net Savings</p>
            <p className={`text-lg font-bold font-mono tracking-tight truncate ${metrics.netSavings >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              {formatRupees(metrics.netSavings)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium select-none truncate">
              Income minus Outflow
            </p>
          </div>
        </div>

        {/* Card 4: Savings Rate */}
        <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl animate-pulse">
            <Activity size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-400 text-xxs font-semibold uppercase tracking-wider">Savings Rate</p>
            <p className="text-lg font-bold text-slate-850 font-mono tracking-tight text-violet-700 truncate">
              {metrics.savingsRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400 font-medium select-none truncate">
              Ratio of income saved
            </p>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 py-12 px-6 text-center text-slate-400">
          <p className="text-sm font-medium">Awaiting financial logs. Please input details in the log tool on the left.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Main Chart Section: Monthly Income vs Expenses side-by-side grouped */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Box 1: Grouped Cash Flow (Income vs Expenses) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                    <Activity size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 font-display">Monthly Cashflow (Income vs Expenses)</h3>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold uppercase">
                  Cashflow
                </span>
              </div>

              <div className="h-64 w-full">
                {monthlyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                    Awaiting month-by-month cashflow logs
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip content={cashflowTooltip} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 10, marginTop: 10 }} />
                      <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={14} />
                      <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Box 2: Spent Stacked Categories monthly breakdown (Explicit user request) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-50 text-amber-600 rounded-md">
                    <Layers size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 font-display">Monthly Spend Breakdown by Category</h3>
                </div>
                <span className="text-[10px] font-mono bg-yellow-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold uppercase">
                  Stacked Breakdown
                </span>
              </div>

              <div className="h-64 w-full">
                {monthlyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                    Awaiting category tracking data over time
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip content={spendingTooltip} />
                      <Bar dataKey="Food & Dining" stackId="spendingStack" fill={CATEGORY_COLORS['Food & Dining']} />
                      <Bar dataKey="Transport" stackId="spendingStack" fill={CATEGORY_COLORS['Transport']} />
                      <Bar dataKey="Housing" stackId="spendingStack" fill={CATEGORY_COLORS['Housing']} />
                      <Bar dataKey="Utilities" stackId="spendingStack" fill={CATEGORY_COLORS['Utilities']} />
                      <Bar dataKey="Groceries" stackId="spendingStack" fill={CATEGORY_COLORS['Groceries']} />
                      <Bar dataKey="Entertainment" stackId="spendingStack" fill={CATEGORY_COLORS['Entertainment']} />
                      <Bar dataKey="Shopping" stackId="spendingStack" fill={CATEGORY_COLORS['Shopping']} />
                      <Bar dataKey="Healthcare" stackId="spendingStack" fill={CATEGORY_COLORS['Healthcare']} />
                      <Bar dataKey="Travel" stackId="spendingStack" fill={CATEGORY_COLORS['Travel']} />
                      <Bar dataKey="Education" stackId="spendingStack" fill={CATEGORY_COLORS['Education']} />
                      <Bar dataKey="Other" stackId="spendingStack" fill={CATEGORY_COLORS['Other']} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Detailed monthly spending breakdown list explorer with percentage bars */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Descriptive left column */}
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center gap-1.5 text-slate-800">
                <Filter size={16} className="text-violet-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">Month Explorer Filters</h4>
              </div>
              <h3 className="text-base font-semibold text-slate-800">Rupee Spending Analysis</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Choose a specific calendar period from the selector to drill down into corresponding itemised category spending ratios and values.
              </p>

              {/* Monthly Dropdown selector */}
              <div className="relative pt-1.5">
                <select
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none cursor-pointer focus:outline-hidden focus:border-blue-500"
                >
                  <option value="All">All Time Combined</option>
                  {monthLabels.map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                <span className="absolute right-3.5 top-[21px] text-[10px] text-slate-400 pointer-events-none">▼</span>
              </div>
            </div>

            {/* List chart detail list right column */}
            <div className="md:col-span-8">
              {filteredMonthBreakdown.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 rounded-xl">
                  No expenditure records recorded for this selected month frame.
                </div>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none border-b border-slate-100 pb-1.5">
                    <span>Expense Category</span>
                    <span>Amount (Rupees) • Ratio</span>
                  </div>

                  {filteredMonthBreakdown.map((row, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs text-slate-700">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                          {row.category}
                        </span>
                        <div className="font-semibold text-slate-800 font-mono">
                          <span>{formatRupees(row.amount)}</span>
                          <span className="text-slate-400 font-normal ml-2">({row.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      
                      {/* Visual contribution bar progress */}
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300" 
                          style={{ width: `${row.percentage}%`, backgroundColor: row.color }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
