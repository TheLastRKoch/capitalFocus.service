import { Formatter, NotificationService, BaseManager } from './app.js';

class GlobalManager extends BaseManager {
    #dateInputId = 'entryDate';

    constructor() {
        super();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.#initAccordionChevrons();
        this.#setDefaultDate();
        this.#initEntryModals();
        this.#initCategoryModals();
        this.#initSummaryModals();
    }

    #initAccordionChevrons() {
        document.addEventListener('show.bs.collapse', (e) => {
            const toggle = document.querySelector(`[data-bs-target="#${e.target.id}"]`);
            if (toggle) toggle.classList.remove('collapsed');
        });

        document.addEventListener('hide.bs.collapse', (e) => {
            const toggle = document.querySelector(`[data-bs-target="#${e.target.id}"]`);
            if (toggle) toggle.classList.add('collapsed');
        });
    }

    #setDefaultDate() {
        const dateInput = document.getElementById(this.#dateInputId);
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    #initEntryModals() {
        const saveBtn = document.getElementById('saveEntryBtn');
        const form = document.getElementById('addEntryForm');
        
        if (saveBtn && form) {
            saveBtn.addEventListener('click', () => {
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                
                const data = {
                    category: document.getElementById('categorySelect').value,
                    date: document.getElementById('entryDate').value,
                    amount: document.getElementById('entryAmount').value,
                    description: document.getElementById('entryDescription').value
                };
                
                this.#addEntryToCategory(data);
                
                form.reset();
                this.#setDefaultDate();
                
                this.getModal(document.getElementById('addEntryModal'))?.hide();
                NotificationService.show('Entry added successfully!', 'success');
            });
        }
    }

    #initCategoryModals() {
        const saveNewBtn = document.getElementById('saveNewCategoryBtn');
        const newForm = document.getElementById('addCategoryForm');
        if (saveNewBtn && newForm) {
            saveNewBtn.addEventListener('click', () => {
                if (!newForm.checkValidity()) {
                    newForm.reportValidity();
                    return;
                }
                const name = document.getElementById('newCategoryName').value;
                NotificationService.show(`Category "${name}" created!`, 'success');
                
                newForm.reset();
                this.getModal(document.getElementById('addCategoryModal'))?.hide();
            });
        }
    }

    #initSummaryModals() {
        const saveSummaryBtn = document.getElementById('saveSummaryBtn');
        const summaryForm = document.getElementById('editSummaryForm');
        if (saveSummaryBtn && summaryForm) {
            saveSummaryBtn.addEventListener('click', () => {
                if (!summaryForm.checkValidity()) {
                    summaryForm.reportValidity();
                    return;
                }
                const salary = document.getElementById('summarySalary').value;
                const salaryValue = document.querySelector('.salary-value');
                if (salaryValue) {
                    salaryValue.textContent = Formatter.formatCurrency(salary);
                }
                
                NotificationService.show('Summary updated!', 'success');
                
                summaryForm.reset();
                this.getModal(document.getElementById('editSummary'))?.hide();
            });
        }
    }

    #addEntryToCategory({ category, date, amount, description }) {
        const categoryCard = document.querySelector(`[data-category="${category}"]`);
        if (!categoryCard) return;
        
        const tbody = categoryCard.querySelector('.entries-body');
        tbody.querySelector('.empty-row')?.remove();
        
        const newRow = document.createElement('tr');
        newRow.className = 'fade-in';
        newRow.innerHTML = `
            <td class="text-muted border-end">${Formatter.formatDate(date)}</td>
            <td class="text-muted border-end">${Formatter.formatCurrency(amount)}</td>
            <td class="text-muted">${Formatter.escapeHtml(description)}</td>
        `;
        
        tbody.appendChild(newRow);
        this.#updateCategoryTotal(categoryCard);
        
        const collapse = categoryCard.querySelector('.collapse');
        if (collapse && !collapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapse);
            bsCollapse.show();
        }
    }

    #updateCategoryTotal(categoryCard) {
        const amountCells = categoryCard.querySelectorAll('.entries-body td:nth-child(2)');
        const total = Array.from(amountCells).reduce((acc, cell) => {
            return acc + Formatter.parseCurrency(cell.textContent);
        }, 0);
        
        const totalSpan = categoryCard.querySelector('.category-total');
        if (totalSpan) {
            totalSpan.textContent = total.toLocaleString('de-DE');
        }
    }
}

// Initialize Global Manager
new GlobalManager();
