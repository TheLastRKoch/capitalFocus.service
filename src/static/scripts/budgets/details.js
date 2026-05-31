/**
 * Budget Details Module
 * Handles dynamic fetching and rendering of budget categories and entries.
 */

import { ApiService, Formatter, NotificationService } from '../app.js';

class BudgetDetailsManager {
    #budgetId = null;
    #budget = null;
    #elements = {
        title: document.getElementById('budgetTitle'),
        projection: document.getElementById('projectionValue'),
        remaining: document.getElementById('remainingValue'),
        available: document.getElementById('availableValue'),
        accordion: document.getElementById('categoriesAccordion'),
        loader: document.getElementById('categoriesLoader'),
        refreshBtn: document.getElementById('refreshSections'),
        addForm: document.getElementById('addCategoryForm'),
        addModal: document.getElementById('addCategoryModal')
    };

    constructor() {
        this.#budgetId = this.#getBudgetIdFromUrl();
        this.#setupEventListeners();
        this.init();
    }

    #setupEventListeners() {
        this.#elements.refreshBtn?.addEventListener('click', () => this.init());

        if (this.#elements.addForm) {
            this.#elements.addForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.#handleCreateSection();
            });
        }
    }

    async #handleCreateSection() {
        const labelInput = document.getElementById('newCategoryName');
        const projectionInput = document.getElementById('newCategoryBudget');

        if (!labelInput || !projectionInput || !this.#budgetId) return;

        const payload = {
            label: labelInput.value,
            projection: parseFloat(projectionInput.value)
        };

        try {
            await ApiService.fetchJson(`/api/budgets/${this.#budgetId}/sections`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            NotificationService.show('Section created successfully!', 'success');

            // Reset form and close modal
            this.#elements.addForm.reset();
            const modalInstance = bootstrap.Modal.getInstance(this.#elements.addModal);
            if (modalInstance) modalInstance.hide();

            // Refresh data
            await this.init();
        } catch (error) {
            NotificationService.show('Failed to create section.', 'danger');
        }
    }

    #getBudgetIdFromUrl() {
        const path = window.location.pathname;
        const parts = path.split('/');
        // Expected format /budgets/ID
        return parts.at(-1) !== 'budgets' ? parts.at(-1) : null;
    }

    async init() {
        this.#showLoader();
        try {
            if (!this.#budgetId) {
                await this.#fetchActiveBudget();
            }
            
            if (this.#budgetId) {
                await this.#fetchBudgetDetails();
            } else {
                this.#renderEmptyState('Please create a budget first.');
            }
        } catch (error) {
            this.#renderError('Failed to load budget details.');
        } finally {
            this.#hideLoader();
        }
    }

    async #fetchActiveBudget() {
        const budgets = await ApiService.fetchJson('/api/budgets/active');
        if (budgets?.length > 0) {
            this.#budgetId = budgets[0].id;
        }
    }

    async #fetchBudgetDetails() {
        this.#budget = await ApiService.fetchJson(`/api/budgets/${this.#budgetId}`);
        this.#render();
    }

    #showLoader() {
        this.#elements.loader?.classList.remove('d-none');
        if (this.#elements.accordion) this.#elements.accordion.innerHTML = '';
    }

    #hideLoader() {
        this.#elements.loader?.classList.add('d-none');
    }

    #render() {
        const { fields } = this.#budget;
        if (this.#elements.title) this.#elements.title.textContent = fields.name || 'Budget Details';
        if (this.#elements.projection) this.#elements.projection.textContent = Formatter.formatCurrency(fields.projection || 0);
        
        const sections = fields.sections || [];
        if (sections.length === 0) {
            this.#renderEmptyState('No sections found for this budget.');
            return;
        }

        const sectionsHtml = sections.map((sec, index) => this.#createSectionHtml(sec, index)).join('');
        if (this.#elements.accordion) this.#elements.accordion.innerHTML = sectionsHtml;
        
        this.#updateOverview();
    }

    #updateOverview() {
        const totalSectionProjection = (this.#budget.fields.sections || []).reduce((acc, sec) => acc + (sec.fields.projection || 0), 0);
        if (this.#elements.remaining) {
            const available = (this.#budget.fields.projection || 0) - totalSectionProjection;
            this.#elements.remaining.textContent = Formatter.formatCurrency(available);
        }
    }

    #createSectionHtml(section, index) {
        const { fields } = section;
        const transactions = fields.transactions || [];
        const totalSpent = transactions.reduce((acc, t) => acc + (t.fields.amount || 0), 0);
        const remaining = (fields.projection || 0) - totalSpent;
        const collapseId = `categoryCollapse${index}`;
        
        return `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <button class="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-3 accordion-toggle collapsed"
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                            <i class="bi bi-chevron-down accordion-chevron"></i>
                            <span class="fw-medium">${fields.label}</span>
                            <span class="text-muted ms-3 small">Proj: ${Formatter.formatCurrency(fields.projection)}</span>
                            <span class="ms-3 small fw-bold ${remaining < 0 ? 'text-danger' : 'text-success'}">
                                Rem: ${Formatter.formatCurrency(remaining)}
                            </span>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm rounded-pill px-3 border-0">
                            <i class="bi bi-pencil me-1"></i> Edit
                        </button>
                    </div>
                </div>
                <div id="${collapseId}" class="collapse">
                    <div class="card-body pt-0">
                        <div class="table-responsive">
                            <table class="table table-borderless mb-0">
                                <thead>
                                    <tr class="border-bottom">
                                        <th class="fw-semibold text-muted small">DATE</th>
                                        <th class="fw-semibold text-muted small">AMOUNT</th>
                                        <th class="fw-semibold text-muted small">DESCRIPTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${transactions.length > 0 
                                        ? transactions.map(t => `
                                            <tr class="align-middle">
                                                <td class="text-muted border-end py-3">${Formatter.formatDate(t.fields.date)}</td>
                                                <td class="text-dark fw-bold border-end py-3">${Formatter.formatCurrency(t.fields.amount)}</td>
                                                <td class="text-muted py-3">${Formatter.escapeHtml(t.fields.commerce)}</td>
                                            </tr>
                                        `).join('')
                                        : '<tr><td colspan="3" class="text-center py-3 text-muted">No entries</td></tr>'
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    #renderEmptyState(message) {
        if (this.#elements.accordion) {
            this.#elements.accordion.innerHTML = `<div class="text-center py-4 text-muted">${message}</div>`;
        }
    }

    #renderError(message) {
        if (this.#elements.accordion) {
            this.#elements.accordion.innerHTML = `<div class="text-center py-4 text-danger">${message}</div>`;
        }
    }
}

// Initialize manager on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new BudgetDetailsManager();
});
