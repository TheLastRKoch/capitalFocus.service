/**
 * Transactions Index Module
 * Handles transaction listing, sorting, and filtering.
 */

import { Formatter, BaseManager } from '../app.js';

class TransactionListManager extends BaseManager {
    #COLUMNS = [
        "date", "commerce", "amount", "location", "card", 
        "authorization", "reference", "transactionType", 
        "subcategory", "status"
    ];

    #NUMERIC_COLUMNS = { amount: true };

    #state = {
        transactions: [
            {
                date: "2026-06-08 07:45:00",
                commerce: "Coffee House",
                amount: "12.50",
                location: "San Jose",
                card: "4242",
                authorization: "AUTH123",
                reference: "REF987",
                transactionType: "Purchase",
                subcategory: "Eating out",
                status: "Categorized",
            },
            {
                date: "2026-06-08 12:10:00",
                commerce: "Green Market",
                amount: "54.20",
                location: "San Jose",
                card: "4242",
                authorization: "AUTH124",
                reference: "REF988",
                transactionType: "Purchase",
                subcategory: "Groceries",
                status: "Categorized",
            },
            {
                date: "2026-06-09 09:30:00",
                commerce: "City Transit",
                amount: "3.75",
                location: "San Francisco",
                card: "1185",
                authorization: "AUTH125",
                reference: "REF989",
                transactionType: "Purchase",
                subcategory: "Transport",
                status: "Uncategorized",
            },
            {
                date: "2026-06-09 18:05:00",
                commerce: "Stream Plus",
                amount: "15.99",
                location: "Online",
                card: "1185",
                authorization: "AUTH126",
                reference: "REF990",
                transactionType: "Subscription",
                subcategory: "Entertainment",
                status: "Categorized",
            },
            {
                date: "2026-06-10 14:22:00",
                commerce: "Fuel Stop",
                amount: "48.00",
                location: "Oakland",
                card: "4242",
                authorization: "AUTH127",
                reference: "REF991",
                transactionType: "Purchase",
                subcategory: "Fuel",
                status: "Uncategorized",
            },
            {
                date: "2026-06-11 20:48:00",
                commerce: "Pizza Corner",
                amount: "27.30",
                location: "San Jose",
                card: "9921",
                authorization: "AUTH128",
                reference: "REF992",
                transactionType: "Purchase",
                subcategory: "Eating out",
                status: "Categorized",
            },
            {
                date: "2026-06-12 10:15:00",
                commerce: "Salary Inc",
                amount: "2500.00",
                location: "Online",
                card: "—",
                authorization: "AUTH129",
                reference: "REF993",
                transactionType: "Deposit",
                subcategory: "Income",
                status: "Categorized",
            }
        ],
        searchTerm: "",
        columnFilters: {},
        sortColumn: null,
        sortDir: 1
    };

    #elements = {
        tableHead: document.getElementById("tableHead"),
        filterRow: document.getElementById("filterRow"),
        tableBody: document.getElementById("tableBody"),
        tableContainer: document.getElementById("tableContainer"),
        emptyState: document.getElementById("emptyState"),
        resultInfo: document.getElementById("resultInfo"),
        searchInput: document.getElementById("searchInput"),
        downloadBtn: document.getElementById("downloadBtn"),
        toggleFiltersBtn: document.getElementById("toggleFiltersBtn"),
        resetBtn: document.getElementById("resetBtn")
    };

    constructor() {
        super();
        this.#setupEventListeners();
        this.#render();
    }

    #setupEventListeners() {
        this.#elements.searchInput?.addEventListener("input", (e) => {
            this.#state.searchTerm = e.target.value;
            this.#renderBody();
        });

        this.#elements.downloadBtn?.addEventListener("click", () => this.#downloadCSV());

        this.#elements.toggleFiltersBtn?.addEventListener("click", () => {
            this.#elements.filterRow?.classList.toggle("d-none");
        });

        this.#elements.resetBtn?.addEventListener("click", () => this.#reset());
    }

    #reset() {
        this.#state.searchTerm = "";
        this.#state.columnFilters = {};
        this.#state.sortColumn = null;
        this.#state.sortDir = 1;
        if (this.#elements.searchInput) this.#elements.searchInput.value = "";
        this.#render();
    }

    #getProcessedRows() {
        const term = this.#state.searchTerm.trim().toLowerCase();

        let filtered = this.#state.transactions.filter(row => {
            // Global search
            if (term) {
                const match = this.#COLUMNS.some(col => 
                    String(row[col] ?? '').toLowerCase().includes(term)
                );
                if (!match) return false;
            }

            // Column filters
            for (const [col, fValue] of Object.entries(this.#state.columnFilters)) {
                if (fValue?.trim()) {
                    if (!String(row[col] ?? '').toLowerCase().includes(fValue.trim().toLowerCase())) {
                        return false;
                    }
                }
            }
            return true;
        });

        if (this.#state.sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                let va = a[this.#state.sortColumn];
                let vb = b[this.#state.sortColumn];

                if (this.#NUMERIC_COLUMNS[this.#state.sortColumn]) {
                    va = parseFloat(va) || 0;
                    vb = parseFloat(vb) || 0;
                    return (va - vb) * this.#state.sortDir;
                }

                va = String(va ?? '').toLowerCase();
                vb = String(vb ?? '').toLowerCase();
                return va.localeCompare(vb) * this.#state.sortDir;
            });
        }

        return filtered;
    }

    #renderHead() {
        if (!this.#elements.tableHead || !this.#elements.filterRow) return;

        this.#elements.tableHead.innerHTML = "";
        this.#elements.filterRow.innerHTML = "";

        this.#COLUMNS.forEach(col => {
            const th = document.createElement("th");
            th.scope = "col";
            th.className = `sortable ${this.#state.sortColumn === col ? 'active' : ''}`;
            
            const indicator = this.#state.sortColumn === col 
                ? (this.#state.sortDir === 1 ? "↑" : "↓") 
                : "↕";

            th.innerHTML = `${Formatter.escapeHtml(col)} <span class="sort-indicator">${indicator}</span>`;
            th.addEventListener("click", () => {
                if (this.#state.sortColumn === col) {
                    this.#state.sortDir *= -1;
                } else {
                    this.#state.sortColumn = col;
                    this.#state.sortDir = 1;
                }
                this.#render();
            });
            this.#elements.tableHead.appendChild(th);

            // Filter cell
            const td = document.createElement("td");
            const input = document.createElement("input");
            input.type = "text";
            input.className = "form-control form-control-sm";
            input.placeholder = "Filter...";
            input.value = this.#state.columnFilters[col] || "";
            input.setAttribute("aria-label", `Filter by ${col}`);
            input.addEventListener("input", (e) => {
                this.#state.columnFilters[col] = e.target.value;
                this.#renderBody();
            });
            td.appendChild(input);
            this.#elements.filterRow.appendChild(td);
        });
    }

    #renderBody() {
        if (!this.#elements.tableBody) return;

        const rows = this.#getProcessedRows();
        this.#elements.tableBody.innerHTML = "";

        if (rows.length === 0) {
            this.#elements.tableContainer?.classList.add("d-none");
            this.#elements.emptyState?.classList.remove("d-none");
        } else {
            this.#elements.tableContainer?.classList.remove("d-none");
            this.#elements.emptyState?.classList.add("d-none");

            rows.forEach(row => {
                const tr = document.createElement("tr");
                tr.innerHTML = this.#COLUMNS.map(col => `<td>${Formatter.escapeHtml(row[col] ?? '')}</td>`).join('');
                this.#elements.tableBody.appendChild(tr);
            });
        }

        if (this.#elements.resultInfo) {
            this.#elements.resultInfo.textContent = `Showing ${rows.length} of ${this.#state.transactions.length} transaction${this.#state.transactions.length === 1 ? "" : "s"}`;
        }

        if (this.#elements.downloadBtn) this.#elements.downloadBtn.disabled = rows.length === 0;
    }

    #render() {
        this.#renderHead();
        this.#renderBody();
    }

    #downloadCSV() {
        const rows = this.#getProcessedRows();
        const csvEscape = (val) => {
            const s = String(val ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };

        const lines = [this.#COLUMNS.map(csvEscape).join(",")];
        rows.forEach(row => {
            lines.push(this.#COLUMNS.map(col => csvEscape(row[col])).join(","));
        });

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transactions.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TransactionListManager();
});
