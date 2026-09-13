/**
 * related.js
 * Fetches related transaction groups from the API and renders them as
 * Bootstrap 5 cards. Each group displays its reason (same date/amount or shared tag)
 * and all transactions belonging to that group.
 */

const API_URL = '/api/transactions/related/';

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
 * @param {Object} transaction - {id, amount, commerce, date, tags}
 * @returns {HTMLElement}
 */
function buildCard(transaction) {
    const card = document.createElement('div');
    card.className = 'card border-0 shadow-sm rounded-4 mb-2';

    const tagsBadges = (transaction.tags && transaction.tags.length > 0)
        ? transaction.tags.map(t => `<span class="badge bg-light text-dark border me-1">${t}</span>`).join('')
        : '<span class="text-muted small">No tags</span>';

    card.innerHTML = `
        <div class="card-body p-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
                <span class="text-muted small fw-semibold">#${transaction.id}</span>
                <div>${tagsBadges}</div>
            </div>
            <div class="row g-3">
                <div class="col-12 col-md-4">
                    <div class="text-muted small mb-1">Commerce</div>
                    <div class="fw-semibold">${transaction.commerce}</div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="text-muted small mb-1">Amount</div>
                    <div class="fw-semibold text-danger">${parseFloat(transaction.amount).toFixed(2)}</div>
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
 * Render all related groups into the container.
 * @param {Array<Object>} groups
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
                <h5 class="fw-bold">No related transactions found</h5>
                <p class="text-muted">No transactions share the same date and amount or a common tag.</p>
            </div>
        `;
        return;
    }

    groups.forEach((group, index) => {
        const isSharedTag = group.reason === 'shared_tag';
        const groupWrapper = document.createElement('div');
        groupWrapper.className = `related-group ${isSharedTag ? 'related-group-shared-tag' : 'related-group-date-amount'} mb-4`;

        // Badge & Header
        const badgeColor = isSharedTag ? 'bg-success' : 'bg-primary';
        const badgeText = isSharedTag
            ? `Shared tag: ${group.tag ? group.tag.label : ''}`
            : 'Same date & amount';

        const groupHeader = document.createElement('div');
        groupHeader.className = 'd-flex align-items-center justify-content-between mb-2';
        groupHeader.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <span class="badge ${badgeColor} rounded-pill px-3 py-2 fs-6">${badgeText}</span>
                <span class="text-muted small fw-semibold">Group ${index + 1}</span>
            </div>
            <span class="badge bg-secondary rounded-pill">${group.transactions.length} transactions</span>
        `;
        groupWrapper.appendChild(groupHeader);

        // Transaction cards
        group.transactions.forEach((transaction) => {
            groupWrapper.appendChild(buildCard(transaction));
        });

        container.appendChild(groupWrapper);

        if (index < groups.length - 1) {
            const hr = document.createElement('hr');
            hr.className = 'my-4 text-muted opacity-25';
            container.appendChild(hr);
        }
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
    const container = document.getElementById('related-container');
    const countBadge = document.getElementById('relatedCount');

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
                countBadge.textContent = 'No related groups';
                countBadge.className = 'badge bg-success rounded-pill px-3 py-2 fs-6';
            } else {
                countBadge.textContent = `${groups.length} group${groups.length !== 1 ? 's' : ''} found`;
                countBadge.className = 'badge bg-primary rounded-pill px-3 py-2 fs-6';
            }
        }

        renderGroups(groups, container);
    } catch (err) {
        console.error('Failed to load related transactions:', err);
        if (countBadge) {
            countBadge.textContent = 'Error';
            countBadge.className = 'badge bg-secondary rounded-pill px-3 py-2 fs-6';
        }
        renderError(container, `Failed to load related transactions: ${err.message}`);
    }
});
