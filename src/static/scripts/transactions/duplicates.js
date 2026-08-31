/**
 * duplicates.js
 * Fetches duplicate transaction groups from the API and renders them as
 * Bootstrap 5 cards. Within each group the card with the lowest id is
 * labelled "Original"; all others are labelled "Duplicate".
 */

const API_URL = '/api/transactions/duplicates/';

/**
 * Format an ISO date string to a human-readable local date/time.
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Build a single Bootstrap 5 card for one transaction.
 * @param {Object} transaction - {id, amount, commerce, date}
 * @param {boolean} isOriginal - true = Original badge, false = Duplicate badge
 * @returns {HTMLElement}
 */
function buildCard(transaction, isOriginal) {
    const card = document.createElement('div');
    card.className = 'card border-0 shadow-sm rounded-4 mb-2';

    const badgeClass = isOriginal ? 'bg-primary' : 'bg-danger';
    const badgeLabel = isOriginal ? 'Original' : 'Duplicate';

    card.innerHTML = `
        <div class="card-body p-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
                <span class="badge ${badgeClass} rounded-pill px-3 py-2">${badgeLabel}</span>
                <span class="text-muted small">#${transaction.id}</span>
            </div>
            <div class="row g-3">
                <div class="col-12 col-md-4">
                    <div class="text-muted small mb-1">Commerce</div>
                    <div class="fw-semibold">${transaction.commerce}</div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="text-muted small mb-1">Amount</div>
                    <div class="fw-semibold text-danger">$${parseFloat(transaction.amount).toFixed(2)}</div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="text-muted small mb-1">Date</div>
                    <div class="fw-semibold">${formatDate(transaction.date)}</div>
                </div>
            </div>
        </div>
    `;
    return card;
}

/**
 * Render all duplicate groups into the container.
 * @param {Array<Array<Object>>} groups
 * @param {HTMLElement} container
 */
function renderGroups(groups, container) {
    container.innerHTML = '';

    if (!groups || groups.length === 0) {
        // Empty state
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <div class="bg-white shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                         style="width: 80px; height: 80px;">
                        <i class="bi bi-check2-circle fs-2 text-success opacity-75"></i>
                    </div>
                </div>
                <h5 class="fw-bold">No duplicate transactions found</h5>
                <p class="text-muted">All transactions have unique combinations of amount, commerce, and date.</p>
            </div>
        `;
        return;
    }

    groups.forEach((group, index) => {
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'duplicate-group mb-4';

        // Group label
        const groupLabel = document.createElement('div');
        groupLabel.className = 'd-flex align-items-center mb-2';
        groupLabel.innerHTML = `
            <span class="text-muted small fw-semibold me-2">Group ${index + 1}</span>
            <span class="badge bg-secondary rounded-pill">${group.length} transactions</span>
        `;
        groupWrapper.appendChild(groupLabel);

        // Cards: first item (lowest id, already sorted by API) = original
        group.forEach((transaction, cardIndex) => {
            const isOriginal = cardIndex === 0;
            groupWrapper.appendChild(buildCard(transaction, isOriginal));
        });

        container.appendChild(groupWrapper);
    });
}

/**
 * Show an error alert inside the container.
 * @param {HTMLElement} container
 * @param {string} message
 */
function renderError(container, message) {
    container.innerHTML = `
        <div class="alert alert-danger d-flex align-items-center rounded-4 shadow-sm" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-3 fs-5"></i>
            <div>${message}</div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('duplicates-container');
    const countBadge = document.getElementById('duplicateCount');

    if (!container) return;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Server returned ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const groups = data.groups || [];

        // Update count badge
        if (countBadge) {
            if (groups.length === 0) {
                countBadge.textContent = 'No duplicates';
                countBadge.className = 'badge bg-success rounded-pill px-3 py-2 fs-6';
            } else {
                countBadge.textContent = `${groups.length} group${groups.length !== 1 ? 's' : ''} found`;
                countBadge.className = 'badge bg-danger rounded-pill px-3 py-2 fs-6';
            }
        }

        renderGroups(groups, container);
    } catch (err) {
        console.error('Failed to load duplicate transactions:', err);
        if (countBadge) {
            countBadge.textContent = 'Error';
            countBadge.className = 'badge bg-secondary rounded-pill px-3 py-2 fs-6';
        }
        renderError(container, `Failed to load duplicate transactions: ${err.message}`);
    }
});
