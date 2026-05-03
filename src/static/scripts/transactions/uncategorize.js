/**
 * Transactions Uncategorized Module
 * Handles dynamic fetching and rendering of uncategorized transactions.
 * Follows SOLID, DRY and ES6+ standards.
 */

class TransactionManager {
    constructor() {
        this.transactionList = document.getElementById('transactionList');
        this.transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
        this.transactionForm = document.getElementById('transactionForm');
        this.toggleDetailsBtn = document.getElementById('toggleDetails');
        this.saveButton = document.getElementById('saveButton');
        this.additionalDetails = document.getElementById('additionalDetails');
        
        this.transactions = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.fetchUncategorizedTransactions();
    }

    setupEventListeners() {
        this.toggleDetailsBtn.addEventListener('click', () => this.toggleAdditionalDetails());
        this.saveButton.addEventListener('click', () => this.handleSave());
    }

    toggleAdditionalDetails() {
        const isHidden = this.additionalDetails.classList.contains('d-none');
        if (isHidden) {
            this.additionalDetails.classList.remove('d-none');
            this.toggleDetailsBtn.textContent = 'Hide Additional Details';
        } else {
            this.additionalDetails.classList.add('d-none');
            this.toggleDetailsBtn.textContent = 'Show More Details';
        }
    }

    async fetchUncategorizedTransactions() {
        try {
            const response = await fetch('/api/transactions/uncategorize');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            this.transactions = data.records || [];
            this.renderTransactions();
        } catch (error) {
            console.error('Error fetching transactions:', error);
            this.renderError('Failed to load transactions. Please try again later.');
        }
    }

    renderTransactions() {
        if (this.transactions.length === 0) {
            this.transactionList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No pending transactions found.</p>
                </div>
            `;
            return;
        }

        this.transactionList.innerHTML = this.transactions.map(transaction => this.createTransactionCard(transaction)).join('');
        
        // Add event listeners to the dynamically created buttons
        this.transactionList.querySelectorAll('.categorize-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const transactionId = e.target.getAttribute('data-id');
                const transaction = this.transactions.find(t => t.id === transactionId);
                this.selectTransaction(transaction);
            });
        });
    }

    createTransactionCard(transaction) {
        const { fields, id } = transaction;
        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm transaction-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold mb-0">${fields.commerce || 'Unknown'}</h6>
                            <span class="badge bg-warning-subtle text-warning border-0">Pending</span>
                        </div>
                        <div class="text-muted small mb-3">
                            <div><i class="bi bi-calendar3 me-2"></i>${fields.date || 'N/A'}</div>
                            <div class="fw-bold text-dark mt-1 fs-5">$${fields.amount || '0.00'}</div>
                        </div>
                        <button class="btn btn-primary btn-sm w-100 rounded-pill categorize-btn" data-id="${id}">Categorize</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderError(message) {
        this.transactionList.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-danger">${message}</p>
                <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    selectTransaction(transaction) {
        if (!transaction) return;
        
        const { fields } = transaction;
        document.getElementById("modalCommerce").value = fields.commerce || '';
        document.getElementById("modalDate").value = fields.date || '';
        document.getElementById("modalAmount").value = fields.amount || '';
        document.getElementById("modalLocation").value = fields.location || '';
        document.getElementById("modalCard").value = fields.card || '';

        // Reset additional details
        this.additionalDetails.classList.add('d-none');
        this.toggleDetailsBtn.textContent = 'Show More Details';

        this.transactionModal.show();
        this.currentTransactionId = transaction.id;
    }

    async handleSave() {
        if (!this.transactionForm.checkValidity()) {
            this.transactionForm.reportValidity();
            return;
        }

        const formData = new FormData(this.transactionForm);
        const data = {
            id: this.currentTransactionId,
            budget: document.getElementById('budgetSelect').value,
            category: document.getElementById('categorySelect').value
        };

        // Add other form fields if needed
        this.transactionForm.querySelectorAll('input.form-control').forEach(el => {
            if (el.id.startsWith('modal')) {
                const key = el.id.replace('modal', '').toLowerCase();
                data[key] = el.value;
            }
        });

        try {
            console.log('Saving categorization...', data);
            const response = await fetch(`/api/transactions/${this.currentTransactionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to save transaction');

            this.transactionModal.hide();
            // Refresh the list after successful save
            this.fetchUncategorizedTransactions();
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save changes. Please try again.');
        }
    }
}

// Initialize the manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.transactionManager = new TransactionManager();
});
