/**
 * Budgets List Module
 * Handles dynamic fetching and rendering of budgets.
 */

import { ApiService, Formatter } from '../app.js';

class BudgetManager {
    #elements = {
        activeList: document.getElementById('activeBudgetsList'),
        inactiveList: document.getElementById('inactiveBudgetsList'),
        activeCount: document.getElementById('activeCount'),
        inactiveCount: document.getElementById('inactiveCount')
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

    #updateSummary() {
        if (this.#elements.activeCount) this.#elements.activeCount.textContent = this.#state.activeBudgets.length;
        if (this.#elements.inactiveCount) this.#elements.inactiveCount.textContent = this.#state.inactiveBudgets.length;
    }

    #render() {
        if (this.#elements.activeList) {
            this.#elements.activeList.innerHTML = this.#state.activeBudgets.length > 0 
                ? this.#state.activeBudgets.map(b => this.#createBudgetCard(b, true)).join('')
                : '<div class="col-12 text-center py-4 text-muted">No active budgets.</div>';
        }

        if (this.#elements.inactiveList) {
            this.#elements.inactiveList.innerHTML = this.#state.inactiveBudgets.length > 0 
                ? this.#state.inactiveBudgets.map(b => this.#createBudgetCard(b, false)).join('')
                : '<div class="col-12 text-center py-4 text-muted">No inactive budgets.</div>';
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
