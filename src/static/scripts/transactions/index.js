/**
 * Transactions Module
 * Handles dynamic fetching, filtering, and rendering of all transactions.
 */

import { ApiService, Formatter, BaseManager } from '../app.js';

class TransactionsListManager extends BaseManager {
    #elements = {
        tableBody: document.getElementById('tableBody'),
        tableHead: document.getElementById('tableHead'),
        filterRow: document.getElementById('filterRow'),
        searchInput: document.getElementById('searchInput'),
        resultInfo: document.getElementById('resultInfo'),
        limitSelect: document.getElementById('limitSelect'),
        paginationList: document.getElementById('paginationList'),
        emptyState: document.getElementById('emptyState'),
        tableContainer: document.getElementById('tableContainer'),
        toggleFiltersBtn: document.getElementById('toggleFiltersBtn'),
        resetBtn: document.getElementById('resetBtn'),
        downloadBtn: document.getElementById('downloadBtn')
    };

    #transactions = [];
    #filteredTransactions = [];
    #budgetCache = new Map();
    #subcategoryCache = new Map();
    #currentPage = 1;
    #pageSize = 50;
    #filters = {};
    #sortColumn = 'date';
    #sortDirection = 'desc';

    #columns = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'commerce', label: 'Commerce', sortable: true },
        { key: 'amount', label: 'Amount', sortable: true, type: 'currency' },
        { key: 'location', label: 'Location', sortable: true },
        { key: 'card', label: 'Card', sortable: true },
        { key: 'authorization', label: 'Authorization', sortable: true },
        { key: 'reference', label: 'Reference', sortable: true },
        { key: 'transactionType', label: 'Transaction Type', sortable: true },
        { key: 'category_name', label: 'Subcategory', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'budget_name', label: 'Budget', sortable: true }
    ];

    constructor() {
        super();
        this.#setupEventListeners();
        this.init();
    }

    async init() {
        try {
            this.#renderSkeleton();
            const data = await ApiService.fetchJson('/api/transactions/');
            this.#transactions = data.results || [];
            
            await this.#enrichTransactions();
            
            this.#filteredTransactions = [...this.#transactions];
            this.#renderHeader();
            this.#renderFilters();
            this.#applyFiltersAndSort();
        } catch (error) {
            console.error('Failed to initialize transactions list:', error);
            this.renderError(this.#elements.tableBody, 'Failed to load transactions.');
        }
    }

    async #enrichTransactions() {
        const budgetIds = [...new Set(this.#transactions.map(t => t.budgets_id).filter(id => id && !this.#budgetCache.has(id)))];
        const subcategoryIds = [...new Set(this.#transactions.map(t => t.subcategory_id).filter(id => id && !this.#subcategoryCache.has(id)))];

        await Promise.all([
            ...budgetIds.map(async id => {
                try {
                    const data = await ApiService.fetchJson(`/api/budgets/${id}/`);
                    this.#budgetCache.set(id, data.label || 'N/A');
                } catch (e) {
                    this.#budgetCache.set(id, 'N/A');
                }
            }),
            ...subcategoryIds.map(async id => {
                try {
                    const data = await ApiService.fetchJson(`/api/subcategory/${id}/`);
                    this.#subcategoryCache.set(id, data.label || 'N/A');
                } catch (e) {
                    this.#subcategoryCache.set(id, 'N/A');
                }
            })
        ]);

        this.#transactions.forEach(t => {
            t.budget_name = this.#budgetCache.get(t.budgets_id) || 'N/A';
            t.category_name = this.#subcategoryCache.get(t.subcategory_id) || 'Uncategorized';
        });
    }

    #setupEventListeners() {
        this.#elements.searchInput?.addEventListener('input', (e) => {
            this.#filters.global = e.target.value.toLowerCase();
            this.#currentPage = 1;
            this.#applyFiltersAndSort();
        });

        this.#elements.limitSelect?.addEventListener('change', (e) => {
            this.#pageSize = parseInt(e.target.value);
            this.#currentPage = 1;
            this.#render();
        });

        this.#elements.toggleFiltersBtn?.addEventListener('click', () => {
            this.#elements.filterRow.classList.toggle('d-none');
        });

        this.#elements.resetBtn?.addEventListener('click', () => {
            this.#filters = {};
            this.#elements.searchInput.value = '';
            this.#currentPage = 1;
            this.#applyFiltersAndSort();
            this.#renderFilters(); // Reset filter inputs
        });

        this.#elements.downloadBtn?.addEventListener('click', () => {
            window.location.href = '/api/transactions/export/';
        });

        this.#elements.tableHead?.addEventListener('click', (e) => {
            const th = e.target.closest('.sortable');
            if (th) {
                const column = th.dataset.column;
                if (this.#sortColumn === column) {
                    this.#sortDirection = this.#sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.#sortColumn = column;
                    this.#sortDirection = 'desc';
                }
                this.#applyFiltersAndSort();
            }
        });
    }

    #renderSkeleton() {
        this.#elements.tableBody.innerHTML = Array(10).fill(0).map(() => `
            <tr>
                ${this.#columns.map(() => `
                    <td><div class="skeleton-shimmer" style="height: 20px; border-radius: 4px;"></div></td>
                `).join('')}
            </tr>
        `).join('');
    }

    #renderHeader() {
        this.#elements.tableHead.innerHTML = this.#columns.map(col => `
            <th class="${col.sortable ? 'sortable' : ''} ${this.#sortColumn === col.key ? 'active' : ''}" 
                data-column="${col.key}">
                ${col.label}
                ${col.sortable ? '<i class="bi bi-arrow-down-up sort-indicator"></i>' : ''}
            </th>
        `).join('');
    }

    #renderFilters() {
        this.#elements.filterRow.innerHTML = this.#columns.map(col => `
            <td>
                <input type="text" class="form-control form-control-sm column-filter" 
                    placeholder="Filter ${col.label}..." data-column="${col.key}"
                    value="${this.#filters[col.key] || ''}">
            </td>
        `).join('');

        // Setup filter listeners
        this.#elements.filterRow.querySelectorAll('.column-filter').forEach(input => {
            input.addEventListener('input', (e) => {
                const column = e.target.dataset.column;
                this.#filters[column] = e.target.value.toLowerCase();
                this.#currentPage = 1;
                this.#applyFiltersAndSort();
            });
        });
    }

    #applyFiltersAndSort() {
        this.#filteredTransactions = this.#transactions.filter(t => {
            // Global search
            if (this.#filters.global) {
                const searchStr = `${t.date} ${t.commerce} ${t.amount} ${t.location} ${t.card} ${t.authorization} ${t.reference} ${t.transactionType} ${t.category_name} ${t.budget_name} ${t.status}`.toLowerCase();
                if (!searchStr.includes(this.#filters.global)) return false;
            }

            // Column filters
            for (const [key, value] of Object.entries(this.#filters)) {
                if (key === 'global' || !value) continue;
                const val = (t[key] || '').toString().toLowerCase();
                if (!val.includes(value)) return false;
            }

            return true;
        });

        // Sort
        this.#filteredTransactions.sort((a, b) => {
            let valA = a[this.#sortColumn];
            let valB = b[this.#sortColumn];

            if (this.#sortColumn === 'amount') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            } else if (this.#sortColumn === 'date') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else {
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            }

            if (valA < valB) return this.#sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return this.#sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.#render();
    }

    #render() {
        const start = (this.#currentPage - 1) * this.#pageSize;
        const end = start + this.#pageSize;
        const pageData = this.#filteredTransactions.slice(start, end);

        if (pageData.length === 0 && this.#currentPage === 1) {
            this.#elements.tableContainer.classList.add('d-none');
            this.#elements.emptyState.classList.remove('d-none');
        } else {
            this.#elements.tableContainer.classList.remove('d-none');
            this.#elements.emptyState.classList.add('d-none');
            this.#elements.tableBody.innerHTML = pageData.map(t => this.#createRowHtml(t)).join('');
        }

        this.#elements.resultInfo.textContent = `${this.#filteredTransactions.length} transactions`;
        
        if (this.#elements.downloadBtn) {
            this.#elements.downloadBtn.disabled = this.#filteredTransactions.length === 0;
        }

        this.#renderPagination();
        this.#renderHeader(); // Refresh sort indicators
    }

    #createRowHtml(t) {
        return `
            <tr>
                <td><span class="text-muted">${Formatter.formatDate(t.date)}</span></td>
                <td><span class="fw-bold text-dark">${Formatter.escapeHtml(t.commerce || 'N/A')}</span></td>
                <td><span class="fw-bold ${t.amount < 0 ? 'text-danger' : 'text-success'}">${Formatter.formatCurrency(t.amount)}</span></td>
                <td><span class="text-muted">${Formatter.escapeHtml(t.location || '')}</span></td>
                <td><span class="text-muted">${Formatter.escapeHtml(t.card || '')}</span></td>
                <td><span class="text-muted">${Formatter.escapeHtml(t.authorization || '')}</span></td>
                <td><span class="text-muted">${Formatter.escapeHtml(t.reference || '')}</span></td>
                <td><span class="text-muted">${Formatter.escapeHtml(t.transactionType || '')}</span></td>
                <td><span class="badge bg-light text-dark border">${Formatter.escapeHtml(t.category_name || 'Uncategorized')}</span></td>
                <td>
                    <span class="badge ${t.status === 'Categorized' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} border-0">
                        ${Formatter.escapeHtml(t.status)}
                    </span>
                </td>
                <td><span class="badge bg-primary-subtle text-primary border-0">${Formatter.escapeHtml(t.budget_name || 'N/A')}</span></td>
            </tr>
        `;
    }

    #renderPagination() {
        const totalPages = Math.ceil(this.#filteredTransactions.length / this.#pageSize);
        if (totalPages <= 1) {
            this.#elements.paginationList.innerHTML = '';
            return;
        }

        let html = `
            <li class="page-item ${this.#currentPage === 1 ? 'disabled' : ''} me-2">
                <a class="page-link rounded-circle border-0" href="#" data-page="${this.#currentPage - 1}">&laquo;</a>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.#currentPage - 2 && i <= this.#currentPage + 2)) {
                html += `
                    <li class="page-item ${this.#currentPage === i ? 'active' : ''} mx-1">
                        <a class="page-link rounded-circle border-0" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === this.#currentPage - 3 || i === this.#currentPage + 3) {
                html += `<li class="page-item disabled mx-1"><span class="page-link border-0">...</span></li>`;
            }
        }

        html += `
            <li class="page-item ${this.#currentPage === totalPages ? 'disabled' : ''} ms-4">
                <a class="page-link rounded-circle border-0" href="#" data-page="${this.#currentPage + 1}">&raquo;</a>
            </li>
        `;

        this.#elements.paginationList.innerHTML = html;

        this.#elements.paginationList.querySelectorAll('.page-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.#currentPage = parseInt(e.target.dataset.page);
                this.#render();
                this.#elements.tableContainer.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TransactionsListManager();
});
