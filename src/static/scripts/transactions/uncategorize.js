/**
 * Transactions Uncategorized Module
 * Handles dynamic fetching and rendering of uncategorized transactions.
 */

import { ApiService, Formatter, NotificationService } from '../app.js';

class TransactionManager {
    #elements = {
        list: document.getElementById('transactionList'),
        modal: document.getElementById('transactionModal'),
        form: document.getElementById('transactionForm'),
        toggleDetailsBtn: document.getElementById('toggleDetails'),
        saveButton: document.getElementById('saveButton'),
        detailsArea: document.getElementById('additionalDetails')
    };

    #bsModal = null;
    #transactions = [];
    #currentId = null;

    constructor() {
        this.#bsModal = new bootstrap.Modal(this.#elements.modal);
        this.#setupEventListeners();
        this.init();
    }

    #setupEventListeners() {
        this.#elements.toggleDetailsBtn?.addEventListener('click', () => this.#toggleDetails());
        this.#elements.saveButton?.addEventListener('click', () => this.#handleSave());
        
        // Event delegation for categorize buttons
        this.#elements.list?.addEventListener('click', (e) => {
            const btn = e.target.closest('.categorize-btn');
            if (btn) {
                const id = btn.getAttribute('data-id');
                const transaction = this.#transactions.find(t => t.id === id);
                this.#selectTransaction(transaction);
            }
        });
    }

    async init() {
        try {
            const data = await ApiService.fetchJson('/api/transactions/uncategorize/');
            this.#transactions = data || [];
            this.#render();
        } catch (error) {
            this.#renderError('Failed to load transactions.');
        }
    }

    #toggleDetails() {
        const isHidden = this.#elements.detailsArea.classList.contains('d-none');
        this.#elements.detailsArea.classList.toggle('d-none');
        this.#elements.toggleDetailsBtn.textContent = isHidden ? 'Hide Additional Details' : 'Show More Details';
    }

    #render() {
        if (this.#transactions.length === 0) {
            this.#elements.list.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No pending transactions found.</p>
                </div>
            `;
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

        for (const [id, value] of Object.entries(mapping)) {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        }

        // Reset details view
        this.#elements.detailsArea.classList.add('d-none');
        this.#elements.toggleDetailsBtn.textContent = 'Show More Details';

        this.#bsModal.show();
    }

    async #handleSave() {
        if (!this.#elements.form.checkValidity()) {
            this.#elements.form.reportValidity();
            return;
        }

        const data = {
            id: this.#currentId,
            budget: document.getElementById('budgetSelect').value,
            category: document.getElementById('categorySelect').value
        };

        try {
            await ApiService.fetchJson(`/api/transactions/${this.#currentId}/`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            this.#bsModal.hide();
            NotificationService.show('Transaction categorized!', 'success');
            await this.init();
        } catch (error) {
            NotificationService.show('Failed to save transaction', 'danger');
        }
    }

    #renderError(message) {
        this.#elements.list.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-danger">${message}</p>
                <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TransactionManager();
});
