/* ==========================================================================
   PERSONAL FINANCE TRACKER CONTROLLER (RUPEES ₹ EDITION)
   An offline-first, highly responsive script with full localStorage support.
   Handles data entry, multi-level filtration, and reactive Chart.js updates!
   ========================================================================== */

// Category Classifications and visual Hex representation
const CATEGORY_CHART_COLORS = {
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

    'Salary': '#22c55e',        // Green-500
    'Freelance': '#84cc16',     // Lime-500
    'Investments': '#0284c7',   // Sky-600
    'Gifts': '#f472b6',         // Pink-400
    'Refunds': '#2563eb',       // Blue-600
    'Other Income': '#4b5563'   // Gray-600
};

const EXPENSE_CATEGORIES = [
    'Food & Dining', 'Transport', 'Housing', 'Utilities', 'Groceries',
    'Entertainment', 'Shopping', 'Healthcare', 'Travel', 'Education', 'Other'
];

const INCOME_CATEGORIES = [
    'Salary', 'Freelance', 'Investments', 'Gifts', 'Refunds', 'Other Income'
];

// Seed Demonstration Data
const DEMO_RECORDS = [
    { id: 'web-1', title: 'Salary Check of May', amount: 85000.00, date: '2026-05-01', type: 'income', category: 'Salary', notes: 'Payroll credited' },
    { id: 'web-2', title: 'Freelance Design', amount: 18500.00, date: '2026-05-15', type: 'income', category: 'Freelance', notes: 'Contract logo design' },
    { id: 'web-3', title: 'Apartment Housing Rent', amount: 22000.00, date: '2026-05-05', type: 'expense', category: 'Housing', notes: 'Automated bank withdrawal' },
    { id: 'web-4', title: 'Groceries Pantry Stockup', amount: 5640.00, date: '2026-05-18', type: 'expense', category: 'Groceries', notes: 'Local supermarket shop' },
    { id: 'web-5', title: 'Highspeed Broadband Fiber', amount: 1499.00, date: '2026-05-20', type: 'expense', category: 'Utilities', notes: 'Broadband bills' },
    { id: 'web-6', title: 'Salary Check of June', amount: 85000.00, date: '2026-06-01', type: 'income', category: 'Salary', notes: 'Payroll credited' },
    { id: 'web-7', title: 'Consulting Session', amount: 12000.00, date: '2026-06-05', type: 'income', category: 'Freelance', notes: 'Expert panel presentation' },
    { id: 'web-8', title: 'Apartment Housing Rent', amount: 22000.00, date: '2026-06-05', type: 'expense', category: 'Housing', notes: 'Automated bank withdrawal' },
    { id: 'web-9', title: 'Fuel Refill Station', amount: 3500.00, date: '2026-06-08', type: 'expense', category: 'Transport', notes: 'Clean diesel' },
    { id: 'web-10', title: 'Late Diner Dinner Party', amount: 4200.00, date: '2026-06-10', type: 'expense', category: 'Entertainment', notes: 'Shared payment with colleagues' }
];

// App State Core
let transactions = [];
let trendChartInstance = null;
let categoryChartInstance = null;
let activeFormType = 'expense'; // 'expense' or 'income'

// Localized currency helper
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
}

// System Onboarding Startup
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadTransactions();
    setupEventListeners();
    populateFormCategories();
    populateFilterCategories();
    updateUI();
}

// 1. Transaction Operations
function loadTransactions() {
    try {
        const saved = localStorage.getItem('expenses_data_web');
        if (saved) {
            transactions = JSON.parse(saved);
        } else {
            transactions = [...DEMO_RECORDS];
            saveState();
        }
    } catch (e) {
        transactions = [...DEMO_RECORDS];
    }
}

function saveState() {
    localStorage.setItem('expenses_data_web', JSON.stringify(transactions));
}

// 2. GUI Events
function setupEventListeners() {
    // Type Picker tabs toggling
    const expenseTab = document.getElementById('type-expense-tab');
    const incomeTab = document.getElementById('type-income-tab');
    
    expenseTab.addEventListener('click', () => toggleFormType('expense'));
    incomeTab.addEventListener('click', () => toggleFormType('income'));

    // Submission Form handler
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', handleFormSubmit);

    // Filters and search input changes
    document.getElementById('filter-type').addEventListener('change', updateUI);
    document.getElementById('filter-category').addEventListener('change', updateUI);
    document.getElementById('search-input').addEventListener('input', updateUI);

    // Reset and Wiping Toolbars
    document.getElementById('reset-mock-btn').addEventListener('click', handleResetDemo);
    document.getElementById('clear-all-btn').addEventListener('click', handleClearAll);

    // Set Default Input Date to Today
    document.getElementById('input-date').value = new Date().toISOString().split('T')[0];
}

// Handles switching input mode types cleanly
function toggleFormType(type) {
    activeFormType = type;
    const expenseTab = document.getElementById('type-expense-tab');
    const incomeTab = document.getElementById('type-income-tab');
    const formTitle = document.getElementById('form-title');

    if (type === 'expense') {
        expenseTab.classList.add('active');
        incomeTab.classList.remove('active');
        formTitle.innerText = "New Expense Entry";
    } else {
        incomeTab.classList.add('active');
        expenseTab.classList.remove('active');
        formTitle.innerText = "New Income Entry";
    }

    populateFormCategories();
}

function populateFormCategories() {
    const select = document.getElementById('input-category');
    select.innerHTML = '';
    const categories = (activeFormType === 'expense') ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        select.appendChild(opt);
    });
}

function populateFilterCategories() {
    const select = document.getElementById('filter-category');
    select.innerHTML = '<option value="all">All Categories</option>';
    
    // Combine all unique classifications
    const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        select.appendChild(opt);
    });
}

// 3. Adding Entry
function handleFormSubmit(e) {
    e.preventDefault();

    const titleInput = document.getElementById('input-title');
    const amountInput = document.getElementById('input-amount');
    const dateInput = document.getElementById('input-date');
    const categorySelect = document.getElementById('input-category');
    const notesInput = document.getElementById('input-notes');

    const amountValue = parseFloat(amountInput.value);
    if (!titleInput.value.trim() || isNaN(amountValue) || amountValue <= 0) {
        return;
    }

    const newTx = {
        id: 'web-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        title: titleInput.value.trim(),
        amount: amountValue,
        date: dateInput.value || new Date().toISOString().split('T')[0],
        type: activeFormType,
        category: categorySelect.value,
        notes: notesInput.value.trim() || undefined
    };

    transactions.unshift(newTx);
    saveState();
    updateUI();

    // Reset elements cleanly
    titleInput.value = '';
    amountInput.value = '';
    notesInput.value = '';
    dateInput.value = new Date().toISOString().split('T')[0];

    // Quick success animation
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '✔ Record Saved!';
    btn.style.backgroundColor = '#10b981';
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
    }, 1500);
}

// 4. Deleting Entry
function deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this recorded log?")) {
        transactions = transactions.filter(t => t.id !== id);
        saveState();
        updateUI();
    }
}

// 5. Toolbar Actions
function handleResetDemo() {
    if (confirm("Reset financial logs to default demo values? Your current edits will be replaced.")) {
        transactions = [...DEMO_RECORDS];
        saveState();
        updateUI();
    }
}

function handleClearAll() {
    if (confirm("Are you absolutely sure you want to clear your entire transaction history?")) {
        transactions = [];
        saveState();
        updateUI();
    }
}

// 6. Responsive UI Render Engine
function updateUI() {
    // 1. Calculate General Metrics
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpenses += t.amount;
        }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome * 100) : 0.0;

    // Display numbers
    document.getElementById('val-total-income').innerText = formatCurrency(totalIncome);
    document.getElementById('val-total-expenses').innerText = formatCurrency(totalExpenses);
    
    const savingsEl = document.getElementById('val-net-savings');
    savingsEl.innerText = formatCurrency(netSavings);
    if (netSavings >= 0) {
        savingsEl.className = 'kpi-val text-blue font-mono';
    } else {
        savingsEl.className = 'kpi-val text-red font-mono';
    }

    document.getElementById('val-savings-rate').innerText = `${savingsRate.toFixed(1)}%`;

    // 2. Filter Table Matches
    const typeFilter = document.getElementById('filter-type').value;
    const categoryFilter = document.getElementById('filter-category').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();

    const filtered = transactions.filter(t => {
        const matchesType = (typeFilter === 'all') || (t.type === typeFilter);
        const matchesCategory = (categoryFilter === 'all') || (t.category === categoryFilter);
        
        let matchesSearch = true;
        if (searchQuery) {
            const term = searchQuery;
            matchesSearch = t.title.toLowerCase().includes(term) || 
                            t.category.toLowerCase().includes(term) ||
                            (t.notes && t.notes.toLowerCase().includes(term));
        }

        return matchesType && matchesCategory && matchesSearch;
    });

    // Populate log results array rows inside HTML table
    const tbody = document.getElementById('logs-table-body');
    const emptyState = document.getElementById('logs-empty-state');
    const logsTable = document.getElementById('logs-table');

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        logsTable.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        logsTable.classList.remove('hidden');

        filtered.forEach(t => {
            const row = document.createElement('tr');
            
            // Format category color badges
            const catColor = CATEGORY_CHART_COLORS[t.category] || '#64748b';
            const isIncome = t.type === 'income';

            row.innerHTML = `
                <td class="font-mono text-muted">${t.date}</td>
                <td>
                    <div style="font-weight:600; color:var(--text-primary);">${t.title}</div>
                    ${t.notes ? `<div class="muted" style="font-size:10px; margin-top:2px;">— ${t.notes}</div>` : ''}
                </td>
                <td>
                    <span class="tag-badge" style="background-color:${catColor}15; color:${catColor};">
                        ${t.category}
                    </span>
                </td>
                <td>
                    <span class="tag-badge ${isIncome ? 'text-green' : 'text-red'}" style="background-color:${isIncome ? '#ecfdf5' : '#fef2f2'}; font-weight:700;">
                        ${t.type.toUpperCase()}
                    </span>
                </td>
                <td class="font-mono" style="text-align: right; font-weight:700; color:${isIncome ? 'var(--color-green)' : 'var(--text-primary)'};">
                    ${isIncome ? '+' : '-'} ₹${t.amount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
                </td>
                <td style="text-align: center;">
                    <button class="action-delete-btn" data-id="${t.id}" title="Delete transaction">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </td>
            `;

            // Attach individual delete event
            row.querySelector('.action-delete-btn').addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deleteTransaction(id);
            });

            tbody.appendChild(row);
        });
    }

    // 3. Render Chart.js visual canvas
    renderCharts(transactions);
}

// 7. Visual Representation rendering
function renderCharts(data) {
    const trendCtx = document.getElementById('monthly-trend-chart');
    const categoryCtx = document.getElementById('category-distribution-chart');

    if (!trendCtx || !categoryCtx) return;

    // Aggregate monthly data
    const monthsMap = {};
    data.forEach(t => {
        const m = t.date.substring(0, 7); // e.g. "2026-05"
        if (!monthsMap[m]) {
            monthsMap[m] = { month: m, income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            monthsMap[m].income += t.amount;
        } else {
            monthsMap[m].expense += t.amount;
        }
    });

    const monthsSortedKeys = Object.keys(monthsMap).sort();
    const monthsLabels = monthsSortedKeys.map(k => {
        const [y, m] = k.split('-');
        const date = new Date(y, parseInt(m) - 1, 1);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });

    const monthlyIncomeData = monthsSortedKeys.map(k => monthsMap[k].income);
    const monthlyExpenseData = monthsSortedKeys.map(k => monthsMap[k].expense);

    // Aggregate expense categories
    const expenseCategoriesMap = {};
    let totalExpenseCount = 0;
    data.forEach(t => {
        if (t.type === 'expense') {
            expenseCategoriesMap[t.category] = (expenseCategoriesMap[t.category] || 0) + t.amount;
            totalExpenseCount += t.amount;
        }
    });

    const categoriesLabels = Object.keys(expenseCategoriesMap);
    const categoriesValueData = Object.values(expenseCategoriesMap);
    const categoryColorsList = categoriesLabels.map(cat => CATEGORY_CHART_COLORS[cat] || '#cbd5e1');

    // Destroy prior instances to avoid visual flickering on hover transitions
    if (trendChartInstance) trendChartInstance.destroy();
    if (categoryChartInstance) categoryChartInstance.destroy();

    // Redraw 1: Monthly Trend Bar Chart
    trendChartInstance = new Chart(trendCtx, {
        type: 'bar',
        data: {
            labels: monthsLabels.length > 0 ? monthsLabels : ['No Data'],
            datasets: [
                {
                    label: 'Incomes (Inflows)',
                    data: monthlyIncomeData.length > 0 ? monthlyIncomeData : [0],
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Expenses (Outflows)',
                    data: monthlyExpenseData.length > 0 ? monthlyExpenseData : [0],
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10, family: 'Inter' } } },
                title: { display: true, text: 'Monthly Trends (₹ Rupees)', font: { size: 11, weight: 'bold', family: 'Inter' } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 9, family: 'JetBrains Mono' } } },
                y: { ticks: { font: { size: 9, family: 'JetBrains Mono' } } }
            }
        }
    });

    // Redraw 2: Expense Proportions Pie
    categoryChartInstance = new Chart(categoryCtx, {
        type: 'pie',
        data: {
            labels: categoriesLabels.length > 0 ? categoriesLabels : ['No Expenses Logged'],
            datasets: [{
                data: categoriesValueData.length > 0 ? categoriesValueData : [1],
                backgroundColor: categoriesLabels.length > 0 ? categoryColorsList : ['#e2e8f0']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9, family: 'Inter' } } },
                title: { display: true, text: 'Category Distributions', font: { size: 11, weight: 'bold', family: 'Inter' } }
            }
        }
    });
}
