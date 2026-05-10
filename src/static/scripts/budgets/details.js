/**
 * Budget Details Module
 * Handles dynamic fetching and rendering of budget categories and entries.
 */

class BudgetDetailsManager {
    bootstrap(){
        this.budgetId = this.getBudgetIdFromUrl();
        this.budgetTitle = document.getElementById('budgetTitle');
        this.projectionValue = document.getElementById('projectionValue');
        this.remainingValue = document.getElementById('remainingValue');
        this.availableValue = document.getElementById('availableValue');
        this.sectionsAccordion = document.getElementById('categoriesAccordion');
        this.sectionsLoader = document.getElementById('categoriesLoader');
        
        this.init();
    }
    
    constructor() {
        this.bootstrap()
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
                this.sectionsLoader.innerHTML = '<p class="text-muted">Please create a budget first.</p>';
            }
        } catch (error) {
            console.error('Error fetching active budget:', error);
        }
    }

    async fetchBudgetDetails() {
        try {
            const [budgetRes] = await Promise.all([
                fetch(`/api/budgets/${this.budgetId}`)
            ]);

            if (!budgetRes.ok ) throw new Error('Failed to fetch budget details');

            this.budget = await budgetRes.json();

            this.renderBudgets(this.budget);
            this.renderSections(this.budget.fields.sections);
            const sectionProjection = calculateSectionProjection()
            this.remainingValue.textContent = this.budget.fields.projection - sectionProjection

        } catch (error) {
            console.error('Error fetching budget details:', error);
            this.renderError('Failed to load budget details.');
        }
    }

    renderBudgets(budget) {
        this.budgetTitle.textContent = budget.fields.name || 'Budget Details';
        this.projectionValue.textContent = budget.fields.projection || '0';
        this.remainingValue.textContent = '0';
    }

    renderSections(sections) {
        this.sectionsLoader.classList.add('d-none');
        
        if (sections.length === 0) {
            this.sectionsAccordion.innerHTML = '<div class="text-center py-4 text-muted">No sections found for this budget.</div>';
            return;
        }

        this.sectionsAccordion.innerHTML = sections.map((sec, index) => this.createSectionAccordionItem(sec, index)).join('');
    }

    createSectionAccordionItem(section, index) {
        const remaining = calculateRemaining(section)
        const collapseId = `categoryCollapse${index}`;
        
        const acordionItems = `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <button class="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-3 accordion-toggle collapsed"
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                            <i class="bi bi-chevron-down accordion-chevron"></i>
                            <span class="fw-medium">${section.fields.label}</span>
                            <span class="text-muted ms-3 projection">${section.fields.projection || 0}</span>
                            <span class="text-muted ms-3 remaining">${remaining || 0}</span>
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
                                    ${section.fields.transactions.length > 0 
                                        ? section.fields.transactions.map(transaction => `
                                            <tr>
                                                <td class="text-muted border-end py-3">${transaction.fields.date}</td>
                                                <td class="text-dark fw-bold border-end py-3">${transaction.fields.amount}</td>
                                                <td class="text-muted py-3">${transaction.fields.commerce}</td>
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
        return acordionItems
    }
}

function calculateRemaining(section) {
    let totalSection = 0.0;

    const transactions = section.fields.transactions || [];
    for (const transaction of transactions) {
        totalSection += parseFloat(transaction.fields.amount || 0);
    }

    return parseFloat(section?.fields?.projection || 0) - totalSection;
}

function calculateSectionProjection(){
    let sectionsProjection = 0 

    const spans = document.querySelectorAll('span.projection');
    for (const span of spans){
        sectionsProjection = sectionsProjection + parseFloat(span.innerText)
    }
    return sectionsProjection
}

const budgetDetailsManaget = new BudgetDetailsManager();

document.addEventListener('DOMContentLoaded', () => {
    budgetDetailsManaget.bootstrap()

    // Select the button by its ID
    const refreshButton = document.getElementById('refreshSections');

    // Check if the button exists to avoid errors
    if (refreshButton) {
        refreshButton.addEventListener('click', function(event) {
            console.log('Refresh Sections button clicked!');
            budgetDetailsManaget.bootstrap()
        });
    }
});

