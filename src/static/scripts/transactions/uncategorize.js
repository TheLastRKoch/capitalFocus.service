/**
 * Transactions Uncategorized Module
 * Handles dynamic fetching and rendering of uncategorized transactions.
 */

import { ApiService, Formatter, NotificationService, BaseManager } from '../app.js';

class TransactionManager extends BaseManager {
    #elements = {
        list: document.getElementById('transactionList'),
        modal: document.getElementById('transactionModal'),
        form: document.getElementById('transactionForm'),
        count: document.getElementById('pendingCount'),
        panel: document.getElementById('pendingPanel'),
        toggleDetailsBtn: document.getElementById('toggleDetails'),
        prevButton: document.getElementById('prevButton'),
        nextButton: document.getElementById('nextButton'),
        saveButton: document.getElementById('saveButton'),
        detailsArea: document.getElementById('additionalDetails'),
        budgetSelect: document.getElementById('budgetSelect'),
        categorySelect: document.getElementById('categorySelect')
    };

    #bsModal = null;
    #transactions = [];
    #currentIndex = -1;
    #currentId = null;

    constructor() {
        super();
        this.#bsModal = this.getModal(this.#elements.modal);
        this.#setupEventListeners();
        this.init();
        this.#loadOptions();
    }

    #setupEventListeners() {
        this.#elements.toggleDetailsBtn?.addEventListener('click', () => this.#toggleDetails());
        this.#elements.saveButton?.addEventListener('click', () => this.#handleSave());

        this.#elements.panel?.addEventListener('click', () => this.#openFirst());
        this.#elements.panel?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.#openFirst();
            }
        });

        this.#elements.prevButton?.addEventListener('click', () => this.#selectAt(this.#currentIndex - 1));
        this.#elements.nextButton?.addEventListener('click', () => this.#selectAt(this.#currentIndex + 1));

        // Event delegation for categorize buttons
        this.#elements.list?.addEventListener('click', (e) => {
            const btn = e.target.closest('.categorize-btn');
            if (btn) {
                const id = btn.getAttribute('data-id');
                const index = this.#transactions.findIndex(t => String(t.id) === id);
                if (index !== -1) this.#selectAt(index);
            }
        });
    }

    async init() {
        try {
            const data = await ApiService.fetchJson('/api/transactions/uncategorize/');
            this.#transactions = data || [];
            this.#currentIndex = -1;
            this.#currentId = null;
            this.#updateCount();
            this.#render();
        } catch (error) {
            this.#transactions = [];
            this.#currentIndex = -1;
            this.#updateCount();
            this.renderError(this.#elements.list, 'Failed to load transactions.');
        }
    }

    async #loadOptions() {
        try {
            const budgets = await ApiService.fetchJson('/api/budgets/active/');
            this.#populateSelect(this.#elements.budgetSelect, budgets || [], b => b.label);
        } catch (error) {
            NotificationService.show('Failed to load budgets', 'danger');
        }

        try {
            const categories = await ApiService.fetchJson('/api/subcategory/');
            this.#populateSelect(
                this.#elements.categorySelect,
                categories || [],
                c => (c.parent_label ? `(${c.parent_label}) ${c.label}` : c.label)
            );
        } catch (error) {
            NotificationService.show('Failed to load categories', 'danger');
        }
    }

    #populateSelect(select, items, labelFn) {
        if (!select) return;
        while (select.options.length > 1) select.remove(1);
        for (const item of items) {
            select.add(new Option(labelFn(item), item.id));
        }
    }

    #updateCount() {
        if (this.#elements.count) this.#elements.count.textContent = this.#transactions.length;
    }

    #openFirst() {
        if (this.#transactions.length === 0) return;
        this.#selectAt(0);
    }

    #selectAt(index) {
        if (index < 0 || index >= this.#transactions.length) return;
        this.#currentIndex = index;
        this.#selectTransaction(this.#transactions[index]);
    }

    #updateNavigation() {
        const { prevButton, nextButton } = this.#elements;
        if (prevButton) prevButton.disabled = this.#currentIndex <= 0;
        if (nextButton) nextButton.disabled = this.#currentIndex >= this.#transactions.length - 1;
    }

    #toggleDetails() {
        const isHidden = this.#elements.detailsArea.classList.contains('d-none');
        this.#elements.detailsArea.classList.toggle('d-none');
        this.#elements.toggleDetailsBtn.textContent = isHidden ? 'Hide Additional Details' : 'Show More Details';
    }

    #render() {
        if (this.#transactions.length === 0) {
            this.renderEmpty(this.#elements.list, 'No pending transactions found.');
            return;
        }

        this.#elements.list.innerHTML = this.#transactions.map(t => this.#createCardHtml(t)).join('');
    }

    #createCardHtml(transaction) {
        const { commerce, date, amount, id } = transaction;
        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm transaction-card fade-in">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold mb-0">${Formatter.escapeHtml(commerce || 'Unknown')}</h6>
                            <span class="badge bg-warning-subtle text-warning border-0 small">Pending</span>
                        </div>
                        <div class="text-muted small mb-3">
                            <div><i class="bi bi-calendar3 me-2"></i>${Formatter.formatDate(date)}</div>
                            <div class="fw-bold text-dark mt-1 fs-5">${Formatter.formatCurrency(amount)}</div>
                        </div>
                        <button class="btn btn-primary btn-sm w-100 rounded-pill categorize-btn shadow-sm" data-id="${id}">
                            Categorize
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    #selectTransaction(transaction) {
        if (!transaction) return;

        this.#currentId = transaction.id;

        // Fill form
        const mapping = {
            'modalCommerce': transaction.commerce,
            'modalDate': transaction.date,
            'modalAmount': transaction.amount,
            'modalLocation': transaction.location,
            'modalCard': transaction.card
        };

        for (const [id, rawValue] of Object.entries(mapping)) {
            const el = document.getElementById(id);
            if (!el) continue;
            const value = rawValue ?? '';
            if ('value' in el) {
                el.value = value;
            } else {
                el.textContent = value;
            }
        }

        // Reset per-transaction selections and details view
        this.#elements.budgetSelect.value = '';
        this.#elements.categorySelect.value = '';
        this.#elements.detailsArea.classList.add('d-none');
        this.#elements.toggleDetailsBtn.textContent = 'Show More Details';

        this.#updateNavigation();

        this.#bsModal?.show();
    }

    async #handleSave() {
        if (!this.#elements.form.checkValidity()) {
            this.#elements.form.reportValidity();
            return;
        }

        const data = {
            id: this.#currentId,
            budget: this.#elements.budgetSelect.value,
            category: this.#elements.categorySelect.value
        };

        try {
            await ApiService.fetchJson(`/api/transactions/${this.#currentId}/`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            this.#bsModal?.hide();
            NotificationService.show('Transaction categorized successfully!', 'success');
            await this.init();
        } catch (error) {
            NotificationService.show('Failed to save transaction', 'danger');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TransactionManager();
});
