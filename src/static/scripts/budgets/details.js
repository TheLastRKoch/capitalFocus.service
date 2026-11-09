/**
 * Budget Details Module
 * Handles dynamic fetching and rendering of budget categories and entries.
 */

import { ApiService, Formatter, NotificationService, BaseManager } from '../app.js';

class BudgetDetailsManager extends BaseManager {
    #budgetId = null;
    #budget = null;
    #isRefreshing = false;
    #editingSectionId = null;
    #missingSections = [];
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
        modalTitle: document.getElementById('addCategoryTitle'),
        sectionSelect: document.getElementById('newSectionCategory'),
        projectionInput: document.getElementById('newCategoryBudget'),
        saveBtn: document.getElementById('saveNewCategoryBtn'),
        projectionToggle: document.getElementById('projectionToggle'),
        projectionDetails: document.getElementById('projectionDetails'),
        spent: document.getElementById('spentValue'),
        encumberedRemaining: document.getElementById('encumberedRemainingValue')
    };

    constructor() {
        super();
        this.#budgetId = this.#getBudgetIdFromUrl();
        this.#setupEventListeners();
        this.init();
    }

    #setupEventListeners() {
        this.#elements.refreshBtn?.addEventListener('click', () => this.refreshData({ isInitial: false }));
        this.#elements.addModal?.addEventListener('hidden.bs.modal', () => this.#resetSectionModal());

        const details = this.#elements.projectionDetails;
        const detailsIcon = this.#elements.projectionToggle?.querySelector('i');
        details?.addEventListener('show.bs.collapse', () => {
            detailsIcon?.classList.replace('bi-chevron-down', 'bi-chevron-up');
        });
        details?.addEventListener('hide.bs.collapse', () => {
            detailsIcon?.classList.replace('bi-chevron-up', 'bi-chevron-down');
        });

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

        const projection = Number.parseFloat(projectionInput.value);
        if (!Number.isFinite(projection)) {
            projectionInput.reportValidity();
            return;
        }

        const isEdit = this.#editingSectionId !== null;
        const selectedOption = select.selectedOptions[0];
        const categoryId = Number.parseInt(select.value, 10);

        if (!isEdit && (!selectedOption || !Number.isFinite(categoryId))) {
            select.reportValidity();
            return;
        }

        try {
            if (isEdit) {
                await ApiService.fetchJson(`/api/sections/${this.#editingSectionId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ projection })
                });
                NotificationService.show('Section updated successfully!', 'success');
            } else {
                const payload = {
                    label: selectedOption.textContent.trim(),
                    category_id: categoryId,
                    projection
                };

                await ApiService.fetchJson(`/api/budgets/${this.#budgetId}/sections/`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                NotificationService.show('Section created successfully!', 'success');
            }

            // Reset form and close modal
            this.#elements.addForm.reset();
            this.getModal(this.#elements.addModal)?.hide();

            // Refresh data smoothly in-place
            await this.refreshData({ isInitial: false });
        } catch (error) {
            NotificationService.show(isEdit ? 'Failed to update section.' : 'Failed to create section.', 'danger');
        }
    }

    #openEditSection(sectionId) {
        const section = this.#budget?.sections?.find(s => String(s.id) === String(sectionId));
        if (!section) return;

        this.#editingSectionId = section.id;

        if (this.#elements.modalTitle) this.#elements.modalTitle.textContent = 'Edit Section';
        if (this.#elements.saveBtn) {
            this.#elements.saveBtn.textContent = 'Save Changes';
            this.#elements.saveBtn.disabled = false;
        }

        const select = this.#elements.sectionSelect;
        if (select) {
            select.innerHTML = '';
            const option = document.createElement('option');
            option.value = section.category_id ?? '';
            option.textContent = section.label;
            option.selected = true;
            select.appendChild(option);
            select.disabled = true;
        }

        if (this.#elements.projectionInput) {
            this.#elements.projectionInput.value = section.projection ?? '';
        }

        this.getModal(this.#elements.addModal)?.show();
    }

    #resetSectionModal() {
        this.#editingSectionId = null;

        if (this.#elements.modalTitle) this.#elements.modalTitle.textContent = 'New Section';
        if (this.#elements.saveBtn) this.#elements.saveBtn.textContent = 'Save';
        if (this.#elements.projectionInput) this.#elements.projectionInput.value = '';

        const select = this.#elements.sectionSelect;
        if (select) select.disabled = false;

        this.#renderSectionOptions(this.#missingSections);
    }

    #getBudgetIdFromUrl() {
        const path = window.location.pathname;
        const parts = path.split('/').filter(Boolean);
        // Expected format /budgets/ID
        return parts.length > 0 && parts.at(-1) !== 'budgets' ? parts.at(-1) : null;
    }

    async init() {
        await this.refreshData({ isInitial: true });
    }

    async refreshData({ isInitial = false } = {}) {
        if (this.#isRefreshing) return;
        this.#isRefreshing = true;

        const refreshIcon = this.#elements.refreshBtn?.querySelector('i');
        if (!isInitial && this.#elements.refreshBtn) {
            this.#elements.refreshBtn.disabled = true;
            refreshIcon?.classList.add('spin-animation');
        }

        if (isInitial) {
            this.showLoader(this.#elements.loader);
            if (this.#elements.accordion) this.#elements.accordion.innerHTML = '';
        }

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
            if (isInitial) {
                this.renderError(this.#elements.accordion, 'Failed to load budget details.');
            } else {
                console.error('Failed to refresh budget details:', error);
                NotificationService.show('Failed to refresh data.', 'danger');
            }
        } finally {
            if (isInitial) {
                this.hideLoader(this.#elements.loader);
            }
            if (!isInitial && this.#elements.refreshBtn) {
                this.#elements.refreshBtn.disabled = false;
                refreshIcon?.classList.remove('spin-animation');
            }
            this.#isRefreshing = false;
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

        this.#missingSections = missingSections;
        this.#renderSectionOptions(missingSections);
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
        if (this.#elements.spent) {
            this.#elements.spent.textContent = Formatter.formatCurrency(budget.budget_spent || 0);
        }
        if (this.#elements.encumberedRemaining) {
            this.#elements.encumberedRemaining.textContent = Formatter.formatCurrency(
                budget.budget_encumbered_remaining || 0
            );
        }

        const sections = budget.sections || [];
        if (sections.length === 0) {
            this.renderEmpty(this.#elements.accordion, 'No sections found for this budget.');
            return;
        }

        // Capture open collapse section IDs before re-rendering
        const openCollapseIds = new Set(
            Array.from(this.#elements.accordion?.querySelectorAll('.collapse.show') || []).map(el => el.id)
        );

        const sectionsHtml = sections.map((sec, index) => this.#createSectionHtml(sec, index, openCollapseIds)).join('');
        if (this.#elements.accordion) this.#elements.accordion.innerHTML = sectionsHtml;

        // Setup event listeners for section actions
        this.#setupBalanceButtons();
        this.#setupEditButtons();
        this.#updateOverview();
    }

    #setupBalanceButtons() {
        const balanceButtons = this.#elements.accordion?.querySelectorAll('[data-balance-btn]');
        balanceButtons?.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (btn.disabled) return;
                btn.disabled = true;
                const icon = btn.querySelector('i');
                icon?.classList.add('spin-animation');

                const sectionId = btn.dataset.sectionId;
                const budgetId = btn.dataset.budgetId;
                const currentProjection = parseFloat(btn.dataset.projection);
                const remaining = parseFloat(btn.dataset.remaining);

                try {
                    await this.#handleBalanceSection(budgetId, sectionId, currentProjection, remaining);
                } finally {
                    btn.disabled = false;
                    icon?.classList.remove('spin-animation');
                }
            });
        });
    }

    #setupEditButtons() {
        const editButtons = this.#elements.accordion?.querySelectorAll('[data-edit-btn]');
        editButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.#openEditSection(btn.dataset.sectionId);
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
            await this.refreshData({ isInitial: false });
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

    #createSectionHtml(section, index, openCollapseIds = new Set()) {
        const transactions = section.transactions || [];
        const remaining = section.remaining !== undefined ? section.remaining : 0;
        const collapseId = `categoryCollapse_${section.id}`;
        const sectionId = section.id;
        const isOpen = openCollapseIds.has(collapseId) || openCollapseIds.has(`categoryCollapse${index}`);

        return `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <button class="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-3 accordion-toggle ${isOpen ? '' : 'collapsed'}"
                        data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${isOpen ? 'true' : 'false'}">
                        <i class="bi bi-chevron-down accordion-chevron"></i>
                        <span class="fw-medium">${Formatter.escapeHtml(section.label)}</span>
                        <span class="text-muted ms-3 small">Proj: ${Formatter.formatCurrency(section.projection)}</span>
                        <span class="ms-3 small fw-bold ${remaining < 0 ? 'text-danger' : 'text-success'}">
                            Rem: ${Formatter.formatCurrency(remaining)}
                        </span>
                    </button>
                </div>
                <div id="${collapseId}" class="collapse ${isOpen ? 'show' : ''}">
                    <div class="card-body pt-0">
                        <div class="d-flex align-items-center justify-content-between gap-3 py-3 border-bottom">
                            <span class="text-muted small">
                                Total expended
                                <span class="fw-bold text-dark ms-2">${Formatter.formatCurrency(section.total_spent || 0)}</span>
                            </span>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-secondary btn-sm rounded-pill px-4 border-0"
                                    data-balance-btn
                                    data-section-id="${sectionId}"
                                    data-budget-id="${this.#budgetId}"
                                    data-remaining="${remaining}"
                                    data-projection="${section.projection || 0}">
                                    <i class="bi bi-brilliance"></i> Balance
                                </button>
                                <button class="btn btn-outline-secondary btn-sm rounded-pill px-4 border-0"
                                    data-edit-btn
                                    data-section-id="${sectionId}">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                            </div>
                        </div>
                        <div class="table-responsive pt-3">
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
