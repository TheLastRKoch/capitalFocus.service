/**
 * Budget Details Module
 * Handles dynamic fetching and rendering of budget categories and entries.
 */

import { ApiService, Formatter, NotificationService, BaseManager } from '../app.js';

class BudgetDetailsManager extends BaseManager {
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
        addModal: document.getElementById('addCategoryModal'),
        sectionSelect: document.getElementById('newSectionCategory'),
        projectionInput: document.getElementById('newCategoryBudget'),
        saveBtn: document.getElementById('saveNewCategoryBtn')
    };

    constructor() {
        super();
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
        const select = this.#elements.sectionSelect;
        const projectionInput = this.#elements.projectionInput;

        if (!select || !projectionInput || !this.#budgetId) return;

        const selectedOption = select.selectedOptions[0];
        const categoryId = Number.parseInt(select.value, 10);
        const projection = Number.parseFloat(projectionInput.value);

        if (!selectedOption || !Number.isFinite(categoryId) || !Number.isFinite(projection)) {
            return;
        }

        const payload = {
            label: selectedOption.textContent.trim(),
            category_id: categoryId,
            projection
        };

        try {
            await ApiService.fetchJson(`/api/budgets/${this.#budgetId}/sections/`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            NotificationService.show('Section created successfully!', 'success');

            // Reset form and close modal
            this.#elements.addForm.reset();
            this.getModal(this.#elements.addModal)?.hide();

            // Refresh data
            await this.init();
        } catch (error) {
            NotificationService.show('Failed to create section.', 'danger');
        }
    }

    #getBudgetIdFromUrl() {
        const path = window.location.pathname;
        const parts = path.split('/').filter(Boolean);
        // Expected format /budgets/ID
        return parts.length > 0 && parts.at(-1) !== 'budgets' ? parts.at(-1) : null;
    }

    async init() {
        this.showLoader(this.#elements.loader);
        if (this.#elements.accordion) this.#elements.accordion.innerHTML = '';

        try {
            if (!this.#budgetId) {
                await this.#fetchActiveBudget();
            }

            if (this.#budgetId) {
                await Promise.all([
                    this.#fetchBudgetDetails(),
                    this.#fetchMissingSections()
                ]);
            } else {
                this.renderEmpty(this.#elements.accordion, 'Please create a budget first.');
            }
        } catch (error) {
            this.renderError(this.#elements.accordion, 'Failed to load budget details.');
        } finally {
            this.hideLoader(this.#elements.loader);
        }
    }

    async #fetchMissingSections() {
        if (!this.#budgetId) return;

        let missingSections = [];
        try {
            missingSections = await ApiService.fetchJson(`/api/budgets/${this.#budgetId}/missing_sections/`);
        } catch (error) {
            console.error('Failed to fetch missing sections:', error);
        }

        this.#renderSectionOptions(missingSections);
        this.#renderMissingSectionsMenu(missingSections);
    }

    #renderSectionOptions(sections) {
        const select = this.#elements.sectionSelect;
        if (!select) return;

        select.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.defaultSelected = true;
        placeholder.textContent = sections.length > 0 ? 'Choose a missing section...' : 'No missing sections';
        select.appendChild(placeholder);

        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.label;
            select.appendChild(option);
        });

        if (this.#elements.saveBtn) {
            this.#elements.saveBtn.disabled = sections.length === 0;
        }
    }

    #renderMissingSectionsMenu(sections) {
        const dropdownMenu = document.getElementById('missing-sections-menu');
        if (!dropdownMenu) return;

        dropdownMenu.innerHTML = '';

        if (sections.length === 0) {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.className = 'dropdown-item-text text-muted';
            span.textContent = 'No missing sections';
            li.appendChild(span);
            dropdownMenu.appendChild(li);
            return;
        }

        sections.forEach(section => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = `#section-${section.id}`;
            a.textContent = section.label;
            a.dataset.id = section.id;

            li.appendChild(a);
            dropdownMenu.appendChild(li);
        });
    }

    async #fetchActiveBudget() {
        const budgets = await ApiService.fetchJson('/api/budgets/active/');
        if (budgets?.length > 0) {
            this.#budgetId = budgets[0].id;
        }
    }

    async #fetchBudgetDetails() {
        this.#budget = await ApiService.fetchJson(`/api/budgets/${this.#budgetId}/complete`);
        this.#render();
    }

    #render() {
        const budget = this.#budget;
        if (this.#elements.title) this.#elements.title.textContent = budget.label || 'Budget Details';
        if (this.#elements.projection) this.#elements.projection.textContent = Formatter.formatCurrency(budget.projection || 0);

        const sections = budget.sections || [];
        if (sections.length === 0) {
            this.renderEmpty(this.#elements.accordion, 'No sections found for this budget.');
            return;
        }

        const sectionsHtml = sections.map((sec, index) => this.#createSectionHtml(sec, index)).join('');
        if (this.#elements.accordion) this.#elements.accordion.innerHTML = sectionsHtml;

        // Setup event listeners for balance buttons
        this.#setupBalanceButtons();
        this.#updateOverview();
    }

    #setupBalanceButtons() {
        const balanceButtons = this.#elements.accordion?.querySelectorAll('[data-balance-btn]');
        balanceButtons?.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const sectionId = btn.dataset.sectionId;
                const budgetId = btn.dataset.budgetId;
                const currentProjection = parseFloat(btn.dataset.projection);
                const remaining = parseFloat(btn.dataset.remaining);

                await this.#handleBalanceSection(budgetId, sectionId, currentProjection, remaining);
            });
        });
    }

    async #handleBalanceSection(budgetId, sectionId, currentProjection, remaining) {
        // If remaining is negative, multiply by -1 to get positive value
        const newProjection = remaining < 0 ? currentProjection + (remaining * -1) : remaining;

        try {
            await ApiService.fetchJson(`/api/sections/${sectionId}`, {
                method: 'PUT',
                body: JSON.stringify({ projection: newProjection })
            });

            NotificationService.show('Section balanced successfully!', 'success');
            await this.init();
        } catch (error) {
            NotificationService.show('Failed to balance section.', 'danger');
        }
    }

    #updateOverview() {
        let totalSectionProjection = 0
        this.#budget.sections.forEach(function (section) {
            totalSectionProjection += parseFloat(section.projection)
        })


        if (this.#elements.remaining) {
            const available = (this.#budget.projection || 0) - totalSectionProjection;
            this.#elements.remaining.textContent = Formatter.formatCurrency(available);
        }
    }

    #createSectionHtml(section, index) {
        const transactions = section.transactions || [];
        const remaining = section.remaining !== undefined ? section.remaining : 0;
        const collapseId = `categoryCollapse${index}`;
        const sectionId = section.id;

        return `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <button class="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-3 accordion-toggle collapsed"
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                            <i class="bi bi-chevron-down accordion-chevron"></i>
                            <span class="fw-medium">${Formatter.escapeHtml(section.label)}</span>
                            <span class="text-muted ms-3 small">Proj: ${Formatter.formatCurrency(section.projection)}</span>
                            <span class="ms-3 small fw-bold ${remaining < 0 ? 'text-danger' : 'text-success'}">
                                Rem: ${Formatter.formatCurrency(remaining)}
                            </span>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm rounded-pill px-4 border-0" 
                            data-balance-btn
                            data-section-id="${sectionId}"
                            data-budget-id="${this.#budgetId}"
                            data-remaining="${remaining}"
                            data-projection="${section.projection || 0}">
                            <i class="bi bi-brilliance"></i>  Balance
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
                                                <td class="text-muted border-end py-3">${Formatter.formatDate(t.date)}</td>
                                                <td class="text-dark fw-bold border-end py-3">${Formatter.formatCurrency(t.amount)}</td>
                                                <td class="text-muted py-3">${Formatter.escapeHtml(t.commerce)}</td>
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
}

// Initialize manager on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new BudgetDetailsManager();
});
