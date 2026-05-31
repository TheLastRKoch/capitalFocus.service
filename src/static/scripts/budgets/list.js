/**
 * Budgets List Module
 * Handles dynamic fetching and rendering of budgets.
 */

import { ApiService, Formatter, NotificationService } from '../app.js';

class BudgetManager {
    #elements = {
        activeList: document.getElementById('activeBudgetsList'),
        inactiveList: document.getElementById('inactiveBudgetsList'),
        activeCount: document.getElementById('activeCount'),
        inactiveCount: document.getElementById('inactiveCount'),
        searchInput: document.getElementById('searchInput'),
        addForm: document.getElementById('addBudgetForm'),
        addModal: document.getElementById('addBudgetModal')
    };

    #state = {
        activeBudgets: [],
        inactiveBudgets: []
    };

    constructor() {
        this.init();
    }

    async init() {
        try {
            await this.#fetchBudgets();
            this.#render();
            this.#updateSummary();
            this.#setupEventListeners();
        } catch (error) {
            this.#renderError('Failed to load budgets.');
        }
    }

    async #fetchBudgets() {
        const [active, inactive] = await Promise.all([
            ApiService.fetchJson('/api/budgets/active'),
            ApiService.fetchJson('/api/budgets/inactive')
        ]);

        this.#state.activeBudgets = active || [];
        this.#state.inactiveBudgets = inactive || [];
    }

    #setupEventListeners() {
        if (this.#elements.searchInput) {
            this.#elements.searchInput.addEventListener('input', (e) => {
                this.#render(e.target.value.toLowerCase());
            });
        }

        if (this.#elements.addForm) {
            this.#elements.addForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.#handleCreateBudget();
            });
        }
    }

    async #handleCreateBudget() {
        const nameInput = document.getElementById('budgetName');
        const projectionInput = document.getElementById('initialSalary');

        if (!nameInput || !projectionInput) return;

        const payload = {
            Label: nameInput.value,
            projection: parseFloat(projectionInput.value)
        };

        try {
            await ApiService.fetchJson('/api/budgets/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            NotificationService.show('Budget created successfully!', 'success');
            
            // Reset form and close modal
            this.#elements.addForm.reset();
            const modalInstance = bootstrap.Modal.getInstance(this.#elements.addModal);
            if (modalInstance) modalInstance.hide();

            // Refresh data
            await this.init();
        } catch (error) {
            NotificationService.show('Failed to create budget.', 'danger');
        }
    }

    #updateSummary() {
        if (this.#elements.activeCount) this.#elements.activeCount.textContent = this.#state.activeBudgets.length;
        if (this.#elements.inactiveCount) this.#elements.inactiveCount.textContent = this.#state.inactiveBudgets.length;
    }

    #render(filter = '') {
        const filterFn = b => {
            const name = (b.fields.name || '').toLowerCase();
            return name.includes(filter);
        };

        const activeToRender = this.#state.activeBudgets.filter(filterFn);
        const inactiveToRender = this.#state.inactiveBudgets.filter(filterFn);

        if (this.#elements.activeList) {
            this.#elements.activeList.innerHTML = activeToRender.length > 0 
                ? activeToRender.map(b => this.#createBudgetCard(b, true)).join('')
                : `<div class="col-12 text-center py-4 text-muted">${filter ? 'No budgets match your search.' : 'No active budgets.'}</div>`;
        }

        if (this.#elements.inactiveList) {
            this.#elements.inactiveList.innerHTML = inactiveToRender.length > 0 
                ? inactiveToRender.map(b => this.#createBudgetCard(b, false)).join('')
                : `<div class="col-12 text-center py-4 text-muted">${filter ? 'No budgets match your search.' : 'No inactive budgets.'}</div>`;
        }
    }

    #createBudgetCard(budget, isActive) {
        const { fields, id } = budget;
        const statusBadge = isActive 
            ? '<span class="badge bg-success-subtle text-success border-0">Active</span>'
            : '<span class="badge bg-secondary-subtle text-secondary border-0">Inactive</span>';
        
        const opacityClass = isActive ? '' : 'opacity-75';

        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm budget-card ${opacityClass} fade-in">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold mb-0">${fields.name || 'Unnamed Budget'}</h6>
                            ${statusBadge}
                        </div>
                        <div class="text-muted small mb-3">
                            <div class="mb-1">
                                <i class="bi bi-cash-stack me-2"></i>Projection: ${Formatter.formatCurrency(fields.projection)}
                            </div>
                            ${fields.is_current ? `
                                <div class="mt-1 text-primary fw-bold">
                                    <i class="bi bi-check-circle-fill me-2"></i>Current Budget
                                </div>
                            ` : ''}
                        </div>
                        <div class="d-flex gap-2">
                            <a href="/budgets/${id}" class="btn btn-primary btn-sm w-100 rounded-pill shadow-sm">
                                View Details
                            </a>
                            <button class="btn btn-outline-secondary btn-sm rounded-pill border-0 edit-budget-btn" data-id="${id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    #renderError(message) {
        const errorHtml = `<div class="col-12 text-center py-5 text-danger">${message}</div>`;
        if (this.#elements.activeList) this.#elements.activeList.innerHTML = errorHtml;
        if (this.#elements.inactiveList) this.#elements.inactiveList.innerHTML = errorHtml;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BudgetManager();
});
