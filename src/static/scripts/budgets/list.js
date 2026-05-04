/**
 * Budgets List Module
 * Handles dynamic fetching and rendering of budgets.
 */

class BudgetManager {
    constructor() {
        this.activeBudgetsList = document.getElementById('activeBudgetsList');
        this.inactiveBudgetsList = document.getElementById('inactiveBudgetsList');
        this.activeCount = document.getElementById('activeCount');
        this.inactiveCount = document.getElementById('inactiveCount');
        
        this.activeBudgets = [];
        this.inactiveBudgets = [];
        this.init();
    }

    init() {
        this.fetchBudgets();
    }

    async fetchBudgets() {
        try {
            const [activeRes, inactiveRes] = await Promise.all([
                fetch('/api/budgets/active'),
                fetch('/api/budgets/inactive')
            ]);

            if (!activeRes.ok || !inactiveRes.ok) throw new Error('Failed to fetch budgets');

            this.activeBudgets = await activeRes.json();
            this.inactiveBudgets = await inactiveRes.json();

            this.renderBudgets();
            this.updateSummary();
        } catch (error) {
            console.error('Error fetching budgets:', error);
            this.renderError('Failed to load budgets.');
        }
    }

    updateSummary() {
        this.activeCount.textContent = this.activeBudgets.length;
        this.inactiveCount.textContent = this.inactiveBudgets.length;
    }

    renderBudgets() {
        this.activeBudgetsList.innerHTML = this.activeBudgets.length > 0 
            ? this.activeBudgets.map(b => this.createBudgetCard(b, true)).join('')
            : '<div class="col-12 text-center py-4 text-muted">No active budgets.</div>';

        this.inactiveBudgetsList.innerHTML = this.inactiveBudgets.length > 0 
            ? this.inactiveBudgets.map(b => this.createBudgetCard(b, false)).join('')
            : '<div class="col-12 text-center py-4 text-muted">No inactive budgets.</div>';
    }

    createBudgetCard(budget, isActive) {
        const { fields, id } = budget;
        const statusBadge = isActive 
            ? '<span class="badge bg-success-subtle text-success border-0">Active</span>'
            : '<span class="badge bg-secondary-subtle text-secondary border-0">Inactive</span>';
        
        const opacityClass = isActive ? '' : 'opacity-75';

        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm budget-card ${opacityClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold mb-0">${fields.name || 'Unnamed Budget'}</h6>
                            ${statusBadge}
                        </div>
                        <div class="text-muted small mb-3">
                            <div><i class="bi bi-calendar3 me-2"></i>Projection: ${fields.projection || '0'}</div>
                            ${fields.is_current ? '<div class="mt-1 text-primary fw-bold"><i class="bi bi-info-circle me-2"></i>Current Budget</div>' : ''}
                        </div>
                        <div class="d-flex gap-2">
                            <a href="/budgets/${id}" class="btn btn-primary btn-sm w-100 rounded-pill shadow-sm">View Details</a>
                            <button class="btn btn-outline-secondary btn-sm rounded-pill border-0 edit-budget-btn" data-id="${id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderError(message) {
        const errorHtml = `<div class="col-12 text-center py-5 text-danger">${message}</div>`;
        this.activeBudgetsList.innerHTML = errorHtml;
        this.inactiveBudgetsList.innerHTML = errorHtml;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BudgetManager();
});
