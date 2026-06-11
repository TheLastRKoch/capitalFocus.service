/**
 * Capital Focus - Core Application Utilities
 * Provides shared services for formatting, API communication, and UI components.
 * Follows SOLID and DRY principles using ES2025 features.
 */

/**
 * Shared Formatting Utilities
 */
export class Formatter {
    static #dateFormatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
    });

    static #currencyFormatter = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    /**
     * Formats a date string or object to DD-MMM-YY
     */
    static formatDate(date) {
        if (!date) return 'N/A';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 'N/A';
        
        // Custom format to match "01-Jan-26"
        const parts = this.#dateFormatter.formatToParts(d);
        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const year = parts.find(p => p.type === 'year').value;
        
        return `${day}-${month}-${year}`;
    }

    /**
     * Formats a number to German currency style (1.234,56)
     */
    static formatCurrency(amount) {
        const num = parseFloat(amount);
        return isNaN(num) ? '0' : this.#currencyFormatter.format(num);
    }

    /**
     * Parses a German formatted number string back to a float
     */
    static parseCurrency(str) {
        if (typeof str !== 'string') return parseFloat(str) || 0;
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }

    /**
     * Escapes HTML to prevent XSS
     */
    static escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Shared API Service
 */
export class ApiService {
    static async fetchJson(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(error.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Api Service Error [${url}]:`, error);
            throw error;
        }
    }
}

/**
 * Shared UI Components
 */
export class NotificationService {
    static #toastContainer = null;

    static #ensureContainer() {
        if (this.#toastContainer) return;
        
        this.#toastContainer = document.querySelector('.toast-container');
        if (!this.#toastContainer) {
            this.#toastContainer = document.createElement('div');
            this.#toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(this.#toastContainer);
        }
    }

    static show(message, type = 'dark') {
        this.#ensureContainer();
        
        const toastId = `toast-${crypto.randomUUID()}`;
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        this.#toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    }
}

/**
 * Base Component for UI Managers
 * Provides common functionality for loading states, error handling, and DOM management.
 */
export class BaseManager {
    constructor() {
        if (this.constructor === BaseManager) {
            throw new Error('BaseManager is an abstract class.');
        }
    }

    showLoader(element) {
        element?.classList.remove('d-none');
    }

    hideLoader(element) {
        element?.classList.add('d-none');
    }

    renderError(container, message) {
        if (!container) return;
        container.innerHTML = `
            <div class="text-center py-5">
                <p class="text-danger">${Formatter.escapeHtml(message)}</p>
                <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    renderEmpty(container, message) {
        if (!container) return;
        container.innerHTML = `<div class="text-center py-4 text-muted">${Formatter.escapeHtml(message)}</div>`;
    }

    getModal(element) {
        if (!element) return null;
        return bootstrap.Modal.getOrCreateInstance(element);
    }
}
