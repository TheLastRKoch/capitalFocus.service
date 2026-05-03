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
            // This endpoint should return budget + categories + entries
            // For now, let's assume /api/budgets/<id> returns this info
            const response = await fetch(`/api/budgets/${this.budgetId}`);
            if (!response.ok) throw new Error('Failed to fetch budget details');
            
            const budget = await response.json();
            this.renderDetails(budget);
        } catch (error) {
            console.error('Error fetching budget details:', error);
            this.categoriesLoader.innerHTML = '<p class="text-danger">Failed to load budget details.</p>';
        }
    }

    renderDetails(budget) {
        const { fields } = budget;
        this.budgetTitle.textContent = fields.name || 'Budget Details';
        this.projectionValue.textContent = fields.projection || '0';
        this.availableValue.textContent = fields.available || '0';
        
        // Mocking categories for now as the repository/API isn't fully ready
        const categories = fields.categories || [];
        this.renderCategories(categories);
    }

    renderCategories(categories) {
        this.categoriesLoader.classList.add('d-none');
        
        if (categories.length === 0) {
            this.categoriesAccordion.innerHTML = '<div class="text-center py-4 text-muted">No categories found for this budget.</div>';
            return;
        }

        this.categoriesAccordion.innerHTML = categories.map((cat, index) => this.createCategoryAccordionItem(cat, index)).join('');
    }

    createCategoryAccordionItem(category, index) {
        const { name, total, entries = [] } = category;
        const collapseId = `categoryCollapse${index}`;
        
        return `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <button class="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-3 accordion-toggle collapsed"
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                            <i class="bi bi-chevron-down accordion-chevron"></i>
                            <span class="fw-medium">${name}</span>
                            <span class="text-muted ms-3">${total || 0}</span>
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
