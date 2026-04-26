// Capital Focus - Main Logic
document.addEventListener('DOMContentLoaded', function() {
    initAccordionChevrons();
    initEntryModals();
    initCategoryModals();
    initSummaryModals();
    setDefaultDate();
});

// Handle accordion chevron rotation (Heuristic 1: Visibility of system status)
function initAccordionChevrons() {
    const accordionToggles = document.querySelectorAll('.accordion-toggle');
    
    accordionToggles.forEach(function(toggle) {
        const targetId = toggle.getAttribute('data-bs-target');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.addEventListener('show.bs.collapse', function() {
                toggle.classList.remove('collapsed');
            });
            
            targetElement.addEventListener('hide.bs.collapse', function() {
                toggle.classList.add('collapsed');
            });
        }
    });
}

// Set default date to today (Heuristic 7: Flexibility and efficiency of use)
function setDefaultDate() {
    const dateInput = document.getElementById('entryDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

// Initialize entry modals (Heuristic 3: User control and freedom)
function initEntryModals() {
    const saveBtn = document.getElementById('saveEntryBtn');
    const form = document.getElementById('addEntryForm');
    
    if (saveBtn && form) {
        saveBtn.addEventListener('click', function() {
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const category = document.getElementById('categorySelect').value;
            const date = document.getElementById('entryDate').value;
            const amount = document.getElementById('entryAmount').value;
            const description = document.getElementById('entryDescription').value;
            
            addEntryToCategory(category, date, amount, description);
            
            form.reset();
            setDefaultDate();
            
            const modalElement = document.getElementById('addEntryModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
            
            showToast('Entry added successfully!');
        });
    }
}

// Initialize category modals
function initCategoryModals() {
    // New Category
    const saveNewBtn = document.getElementById('saveNewCategoryBtn');
    const newForm = document.getElementById('addCategoryForm');
    if (saveNewBtn && newForm) {
        saveNewBtn.addEventListener('click', function() {
            if (!newForm.checkValidity()) {
                newForm.reportValidity();
                return;
            }
            const name = document.getElementById('newCategoryName').value;
            const budget = document.getElementById('newCategoryBudget').value;
            
            console.log('Adding category:', name, budget);
            showToast('Category "' + name + '" created!');
            
            newForm.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
            if (modal) modal.hide();
        });
    }

    // Edit Category
    const saveEditBtn = document.getElementById('saveEditCategoryBtn');
    const editForm = document.getElementById('editCategoryForm');
    if (saveEditBtn && editForm) {
        saveEditBtn.addEventListener('click', function() {
            if (!editForm.checkValidity()) {
                editForm.reportValidity();
                return;
            }
            const name = document.getElementById('editCategoryName').value;
            showToast('Category updated!');
            
            editForm.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'));
            if (modal) modal.hide();
        });
    }
}

// Initialize summary modals
function initSummaryModals() {
    const saveSummaryBtn = document.getElementById('saveSummaryBtn');
    const summaryForm = document.getElementById('editSummaryForm');
    if (saveSummaryBtn && summaryForm) {
        saveSummaryBtn.addEventListener('click', function() {
            if (!summaryForm.checkValidity()) {
                summaryForm.reportValidity();
                return;
            }
            const salary = document.getElementById('summarySalary').value;
            const available = document.getElementById('summaryAvailable').value;
            
            // Update UI
            const salaryValue = document.querySelector('.salary-value');
            if (salaryValue) {
                salaryValue.textContent = formatNumber(salary);
            }
            
            showToast('Summary updated!');
            
            summaryForm.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editSummary'));
            if (modal) modal.hide();
        });
    }
}

// Add entry to specific category (Heuristic 1: Visibility of system status)
function addEntryToCategory(category, date, amount, description) {
    const categoryCard = document.querySelector('[data-category="' + category + '"]');
    
    if (!categoryCard) {
        console.error('Category not found:', category);
        return;
    }
    
    const tbody = categoryCard.querySelector('.entries-body');
    const emptyRow = tbody.querySelector('.empty-row');
    
    if (emptyRow) {
        emptyRow.remove();
    }
    
    const formattedDate = formatDate(new Date(date));
    const formattedAmount = formatNumber(amount);
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = 
        '<td class="text-muted border-end">' + formattedDate + '</td>' +
        '<td class="text-muted border-end">' + formattedAmount + '</td>' +
        '<td class="text-muted">' + escapeHtml(description) + '</td>';
    
    newRow.style.opacity = '0';
    newRow.style.transform = 'translateY(-10px)';
    tbody.appendChild(newRow);
    
    requestAnimationFrame(function() {
        newRow.style.transition = 'opacity 0.3s, transform 0.3s';
        newRow.style.opacity = '1';
        newRow.style.transform = 'translateY(0)';
    });
    
    updateCategoryTotal(categoryCard);
    
    const collapseId = categoryCard.querySelector('.collapse').id;
    const collapseElement = document.getElementById(collapseId);
    if (collapseElement && !collapseElement.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(collapseElement, { show: true });
    }
}

// Utils
function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return String(date.getDate()).padStart(2, '0') + '-' + months[date.getMonth()] + '-' + String(date.getFullYear()).slice(-2);
}

function formatNumber(num) {
    const number = parseFloat(num);
    if (isNaN(number)) return num;
    return number.toLocaleString('de-DE');
}

function parseFormattedNumber(str) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateCategoryTotal(categoryCard) {
    const amountCells = categoryCard.querySelectorAll('.entries-body td:nth-child(2)');
    let total = 0;
    
    amountCells.forEach(function(cell) {
        const value = parseFormattedNumber(cell.textContent);
        if (!isNaN(value)) {
            total += value;
        }
    });
    
    const totalSpan = categoryCard.querySelector('.category-total');
    if (totalSpan) {
        totalSpan.textContent = total.toLocaleString('de-DE');
    }
}

// Heuristic 1: Visibility of system status - Toast Notifications
function showToast(message) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-dark border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}
