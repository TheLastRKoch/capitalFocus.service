/**
 * Budget Details Module
 * Handles dynamic fetching and rendering of budget categories and entries.
 */

class BudgetDetailsManager {
    constructor() {
        this.budgetId = this.getBudgetIdFromUrl();
        this.budgetTitle = document.getElementById('budgetTitle');
        this.projectionValue = document.getElementById('projectionValue');
        this.availableValue = document.getElementById('availableValue');
        this.categoriesAccordion = document.getElementById('categoriesAccordion');
        this.categoriesLoader = document.getElementById('categoriesLoader');
        
        this.init();
    }

    init() {
        if (this.budgetId) {
            this.fetchBudgetDetails();
        } else {
            this.budgetTitle.textContent = "Current Budget";
            // Logic for "Current Budget" could fetch the active one
            this.fetchActiveBudget();
        }
    }

    getBudgetIdFromUrl() {
        const path = window.location.pathname;
        const parts = path.split('/');
        return parts[parts.length - 1] !== 'budgets' ? parts[parts.length - 1] : null;
    }

    async fetchActiveBudget() {
        try {
            const response = await fetch('/api/budgets/active');
            const budgets = await response.json();
            if (budgets && budgets.length > 0) {
                this.budgetId = budgets[0].id;
                this.fetchBudgetDetails();
            } else {
                this.budgetTitle.textContent = "No Active Budget";
                this.categoriesLoader.innerHTML = '<p class="text-muted">Please create a budget first.</p>';
            }
        } catch (error) {
            console.error('Error fetching active budget:', error);
        }
    }

    async fetchBudgetDetails() {
        try {
            const [budgetRes, sectionsRes] = await Promise.all([
                fetch(`/api/budgets/${this.budgetId}`),
                fetch(`/api/budgets/${this.budgetId}/sections`)
            ]);

            if (!budgetRes.ok || !sectionsRes.ok) throw new Error('Failed to fetch budget details');

            this.budget = await budgetRes.json();
            this.sections = await sectionsRes.json();

            this.renderDetails(this.budget, this.sections);
        } catch (error) {
            console.error('Error fetching budget details:', error);
            this.renderError('Failed to load budget details.');
        }
    }

    renderDetails(budget, sections) {
        let fields = budget[0].fields;
        this.budgetTitle.textContent = fields.name || 'Budget Details';
        this.projectionValue.textContent = fields.projection || '0';
        this.availableValue.textContent = fields.available || '0';
        
        this.renderSections(sections);
    }

    renderSections(sections) {
        this.categoriesLoader.classList.add('d-none');
        
        if (sections.length === 0) {
            this.categoriesAccordion.innerHTML = '<div class="text-center py-4 text-muted">No sections found for this budget.</div>';
            return;
        }

        this.categoriesAccordion.innerHTML = sections.map((sec, index) => this.createSectionAccordionItem(sec, index)).join('');
    }

    createSectionAccordionItem(section, index) {
        let fields = section.fields;
        let entries = []
        const collapseId = `categoryCollapse${index}`;
        
        return `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <button class="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-3 accordion-toggle collapsed"
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                            <i class="bi bi-chevron-down accordion-chevron"></i>
                            <span class="fw-medium">${fields.label}</span>
                            <span class="text-muted ms-3">${fields.projection || 0}</span>
                            <span class="text-muted ms-3">${fields.projection || 0}</span>
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
                                    ${entries.length > 0 
                                        ? entries.map(e => `
                                            <tr>
                                                <td class="text-muted border-end py-3">${e.date}</td>
                                                <td class="text-dark fw-bold border-end py-3">${e.amount}</td>
                                                <td class="text-muted py-3">${e.description}</td>
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

document.addEventListener('DOMContentLoaded', () => {
    new BudgetDetailsManager();
});
