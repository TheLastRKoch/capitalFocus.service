/**
 * Transactions Import Module
 * Handles CSV file parsing and preview.
 */

import { ApiService, Formatter, NotificationService, BaseManager } from '../app.js';

class TransactionImportManager extends BaseManager {
    #state = {
        parsedData: { headers: [], rows: [] },
        selectedFile: null
    };

    #elements = {
        importBtn: document.getElementById("importBtn"),
        clearBtn: document.getElementById("clearBtn"),
        tableHead: document.getElementById("tableHead"),
        tableBody: document.getElementById("tableBody"),
        previewContainer: document.getElementById("previewContainer"),
        emptyState: document.getElementById("emptyState"),
        fileInfo: document.getElementById("fileInfo"),
        fileInfoText: document.getElementById("fileInfoText"),
        rowCountValue: document.getElementById("rowCountValue"),
        fileStatusValue: document.getElementById("fileStatusValue"),
        importForm: document.getElementById("importForm"),
        csvInput: document.getElementById("csvInput"),
        dropZone: document.getElementById("dropZone"),
        selectedFileName: document.getElementById("selectedFileName"),
        modalError: document.getElementById("modalError"),
        importModalEl: document.getElementById("importModal")
    };

    constructor() {
        super();
        this.#setupEventListeners();
        this.#renderTable();
    }

    #setupEventListeners() {
        this.#elements.dropZone?.addEventListener("click", () => this.#elements.csvInput.click());

        this.#elements.csvInput?.addEventListener("change", () => {
            if (this.#elements.csvInput.files?.[0]) {
                this.#setSelectedFile(this.#elements.csvInput.files[0]);
            }
        });

        // Drag and drop
        ["dragenter", "dragover"].forEach(evt => {
            this.#elements.dropZone?.addEventListener(evt, (e) => {
                e.preventDefault();
                this.#elements.dropZone.classList.add("dragover");
            });
        });

        ["dragleave", "drop"].forEach(evt => {
            this.#elements.dropZone?.addEventListener(evt, (e) => {
                e.preventDefault();
                this.#elements.dropZone.classList.remove("dragover");
            });
        });

        this.#elements.dropZone?.addEventListener("drop", (e) => {
            const files = e.dataTransfer.files;
            if (files?.[0]) {
                this.#setSelectedFile(files[0]);
            }
        });

        this.#elements.importForm?.addEventListener("submit", (e) => this.#handleFormSubmit(e));

        this.#elements.importModalEl?.addEventListener("hidden.bs.modal", () => {
            this.#elements.importForm.reset();
            this.#setSelectedFile(null);
            this.#hideModalError();
        });

        this.#elements.importBtn?.addEventListener("click", () => this.#handleImport());

        this.#elements.clearBtn?.addEventListener("click", () => this.#clearData());
    }

    async #handleImport() {
        if (this.#state.parsedData.rows.length === 0) return;

        this.#elements.importBtn.disabled = true;
        NotificationService.show(`Importing ${this.#state.parsedData.rows.length} rows...`, 'info');

        const transactions = this.#state.parsedData.rows.map(row => {
            const obj = {};
            this.#state.parsedData.headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        try {
            const result = await ApiService.fetchJson('/api/transactions/', {
                method: 'POST',
                body: JSON.stringify(transactions)
            });

            NotificationService.show(`Successfully imported ${result.created} transactions!`, 'success');
            this.#clearData();
        } catch (error) {
            console.error('Import error:', error);
            NotificationService.show(`Error: ${error.message}`, 'danger');
            this.#elements.importBtn.disabled = false;
        }
    }

    #handleFormSubmit(e) {
        e.preventDefault();

        if (!this.#state.selectedFile) {
            this.#showModalError("Please select a CSV file first.");
            return;
        }

        const name = this.#state.selectedFile.name.toLowerCase();
        if (!name.endsWith(".csv") && this.#state.selectedFile.type !== "text/csv") {
            this.#showModalError("Please select a valid .csv file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                this.#state.parsedData = this.#parseCSV(event.target.result);
                if (this.#state.parsedData.headers.length === 0) {
                    this.#showModalError("The file appears to be empty.");
                    return;
                }
                this.#renderTable();
                this.#showFileInfo(this.#state.selectedFile.name, this.#state.parsedData.rows.length);

                this.getModal(this.#elements.importModalEl)?.hide();
            } catch (err) {
                this.#showModalError(`Could not parse the file: ${err.message}`);
            }
        };
        reader.onerror = () => this.#showModalError("Failed to read the file.");
        reader.readAsText(this.#state.selectedFile);
    }

    #parseCSV(text) {
        const rows = [];
        let field = "";
        let row = [];
        let inQuotes = false;

        const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        for (let i = 0; i < normalized.length; i++) {
            const char = normalized[i];

            if (inQuotes) {
                if (char === '"') {
                    if (normalized[i + 1] === '"') {
                        field += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ",") {
                    row.push(field);
                    field = "";
                } else if (char === "\n") {
                    row.push(field);
                    rows.push(row);
                    row = [];
                    field = "";
                } else {
                    field += char;
                }
            }
        }

        if (field !== "" || row.length > 0) {
            row.push(field);
            rows.push(row);
        }

        const filteredRows = rows.filter(r => !(r.length === 1 && r[0].trim() === ""));

        if (filteredRows.length === 0) return { headers: [], rows: [] };

        return {
            headers: filteredRows[0],
            rows: filteredRows.slice(1)
        };
    }

    #renderTable() {
        if (!this.#elements.tableHead || !this.#elements.tableBody) return;

        this.#elements.tableHead.innerHTML = "";
        this.#elements.tableBody.innerHTML = "";

        if (this.#state.parsedData.headers.length === 0) {
            this.#elements.previewContainer?.classList.add("d-none");
            this.#elements.emptyState?.classList.remove("d-none");
            if (this.#elements.importBtn) this.#elements.importBtn.disabled = true;
            if (this.#elements.clearBtn) this.#elements.clearBtn.disabled = true;
            return;
        }

        // Header
        const trHead = document.createElement("tr");
        trHead.innerHTML = `<th>#</th>` + this.#state.parsedData.headers.map(h => `<th>${Formatter.escapeHtml(h)}</th>`).join('');
        this.#elements.tableHead.appendChild(trHead);

        // Body
        this.#state.parsedData.rows.forEach((r, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td class="text-muted">${idx + 1}</td>` + 
                this.#state.parsedData.headers.map((_, cIdx) => `<td>${Formatter.escapeHtml(r[cIdx] ?? '')}</td>`).join('');
            this.#elements.tableBody.appendChild(tr);
        });

        this.#elements.previewContainer?.classList.remove("d-none");
        this.#elements.emptyState?.classList.add("d-none");
        if (this.#elements.importBtn) this.#elements.importBtn.disabled = false;
        if (this.#elements.clearBtn) this.#elements.clearBtn.disabled = false;

        if (this.#elements.rowCountValue) this.#elements.rowCountValue.textContent = this.#state.parsedData.rows.length;
    }

    #showFileInfo(name, rowCount) {
        if (this.#elements.fileInfoText) {
            this.#elements.fileInfoText.textContent = `${name} — ${rowCount} row${rowCount === 1 ? "" : "s"} loaded`;
        }
        this.#elements.fileInfo?.classList.remove("d-none");
        this.#elements.fileInfo?.classList.add("d-flex");
        if (this.#elements.fileStatusValue) this.#elements.fileStatusValue.textContent = name;
    }

    #setSelectedFile(file) {
        this.#state.selectedFile = file;
        if (this.#elements.selectedFileName) {
            this.#elements.selectedFileName.textContent = file ? `Selected: ${file.name}` : "";
        }
        if (file) this.#hideModalError();
    }

    #showModalError(msg) {
        if (this.#elements.modalError) {
            this.#elements.modalError.textContent = msg;
            this.#elements.modalError.classList.remove("d-none");
        }
    }

    #hideModalError() {
        this.#elements.modalError?.classList.add("d-none");
    }

    #clearData() {
        this.#state.parsedData = { headers: [], rows: [] };
        this.#state.selectedFile = null;
        this.#renderTable();
        this.#elements.fileInfo?.classList.add("d-none");
        if (this.#elements.rowCountValue) this.#elements.rowCountValue.textContent = "0";
        if (this.#elements.fileStatusValue) this.#elements.fileStatusValue.textContent = "No file loaded";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TransactionImportManager();
});
