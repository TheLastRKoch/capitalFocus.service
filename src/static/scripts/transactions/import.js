(function () {
  "use strict";

  // State
  var parsedData = { headers: [], rows: [] };
  var selectedFile = null;

  // Elements
  var importBtn = document.getElementById("importBtn");
  var clearBtn = document.getElementById("clearBtn");
  var tableHead = document.getElementById("tableHead");
  var tableBody = document.getElementById("tableBody");
  var previewContainer = document.getElementById("previewContainer");
  var emptyState = document.getElementById("emptyState");
  var fileInfo = document.getElementById("fileInfo");
  var fileInfoText = document.getElementById("fileInfoText");
  var rowCountValue = document.getElementById("rowCountValue");
  var fileStatusValue = document.getElementById("fileStatusValue");

  var importForm = document.getElementById("importForm");
  var csvInput = document.getElementById("csvInput");
  var dropZone = document.getElementById("dropZone");
  var selectedFileName = document.getElementById("selectedFileName");
  var modalError = document.getElementById("modalError");
  var importModalEl = document.getElementById("importModal");

  /**
   * Parse CSV text into headers + rows.
   * Handles quoted fields, escaped quotes ("") and commas/newlines inside quotes.
   */
  function parseCSV(text) {
    var rows = [];
    var field = "";
    var row = [];
    var inQuotes = false;

    // Normalize line endings
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    for (var i = 0; i < text.length; i++) {
      var char = text[i];

      if (inQuotes) {
        if (char === '"') {
          if (text[i + 1] === '"') {
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

    // Push last field/row if present
    if (field !== "" || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    // Drop fully empty trailing rows
    rows = rows.filter(function (r) {
      return !(r.length === 1 && r[0].trim() === "");
    });

    if (rows.length === 0) {
      return { headers: [], rows: [] };
    }

    return {
      headers: rows[0],
      rows: rows.slice(1),
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderTable() {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    if (parsedData.headers.length === 0) {
      previewContainer.classList.add("d-none");
      emptyState.classList.remove("d-none");
      importBtn.disabled = true;
      clearBtn.disabled = true;
      return;
    }

    // Header
    var thNum = document.createElement("th");
    thNum.scope = "col";
    thNum.textContent = "#";
    tableHead.appendChild(thNum);

    parsedData.headers.forEach(function (h) {
      var th = document.createElement("th");
      th.scope = "col";
      th.textContent = h;
      tableHead.appendChild(th);
    });

    // Body
    parsedData.rows.forEach(function (r, idx) {
      var tr = document.createElement("tr");
      var tdNum = document.createElement("td");
      tdNum.className = "text-muted";
      tdNum.textContent = idx + 1;
      tr.appendChild(tdNum);

      for (var c = 0; c < parsedData.headers.length; c++) {
        var td = document.createElement("td");
        td.innerHTML = escapeHtml(r[c] != null ? r[c] : "");
        tr.appendChild(td);
      }
      tableBody.appendChild(tr);
    });

    previewContainer.classList.remove("d-none");
    emptyState.classList.add("d-none");
    importBtn.disabled = false;
    clearBtn.disabled = false;

    // Update summary
    if (rowCountValue) rowCountValue.textContent = parsedData.rows.length;
  }

  function showFileInfo(name, rowCount) {
    fileInfoText.textContent =
      name + " — " + rowCount + " row" + (rowCount === 1 ? "" : "s") + " loaded";
    fileInfo.classList.remove("d-none");
    fileInfo.classList.add("d-flex");
    if (fileStatusValue) fileStatusValue.textContent = name;
  }

  function hideFileInfo() {
    fileInfo.classList.add("d-none");
    fileInfo.classList.remove("d-flex");
    if (rowCountValue) rowCountValue.textContent = "0";
    if (fileStatusValue) fileStatusValue.textContent = "No file loaded";
  }

  function setSelectedFile(file) {
    selectedFile = file;
    if (file) {
      selectedFileName.textContent = "Selected: " + file.name;
      modalError.classList.add("d-none");
    } else {
      selectedFileName.textContent = "";
    }
  }

  function showModalError(msg) {
    modalError.textContent = msg;
    modalError.classList.remove("d-none");
  }

  // ----- Events -----

  // Open file browser on drop zone click
  dropZone.addEventListener("click", function () {
    csvInput.click();
  });

  csvInput.addEventListener("change", function () {
    if (csvInput.files && csvInput.files[0]) {
      setSelectedFile(csvInput.files[0]);
    }
  });

  // Drag and drop
  ["dragenter", "dragover"].forEach(function (evt) {
    dropZone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach(function (evt) {
    dropZone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });
  dropZone.addEventListener("drop", function (e) {
    var files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  });

  // Submit (parse + preview)
  importForm.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!selectedFile) {
      showModalError("Please select a CSV file first.");
      return;
    }

    var name = selectedFile.name.toLowerCase();
    if (!name.endsWith(".csv") && selectedFile.type !== "text/csv") {
      showModalError("Please select a valid .csv file.");
      return;
    }

    var reader = new FileReader();
    reader.onload = function (event) {
      try {
        parsedData = parseCSV(event.target.result);
        if (parsedData.headers.length === 0) {
          showModalError("The file appears to be empty.");
          return;
        }
        renderTable();
        showFileInfo(selectedFile.name, parsedData.rows.length);

        // Close modal
        var modal = bootstrap.Modal.getInstance(importModalEl);
        if (modal) modal.hide();
      } catch (err) {
        showModalError("Could not parse the file: " + err.message);
      }
    };
    reader.onerror = function () {
      showModalError("Failed to read the file.");
    };
    reader.readAsText(selectedFile);
  });

  // Reset modal state when hidden
  importModalEl.addEventListener("hidden.bs.modal", function () {
    importForm.reset();
    setSelectedFile(null);
    modalError.classList.add("d-none");
  });

  // Import button (placeholder action for the previewed data)
  importBtn.addEventListener("click", function () {
    alert(
      "Importing " +
        parsedData.rows.length +
        " row" +
        (parsedData.rows.length === 1 ? "" : "s") +
        "..."
    );
  });

  // Clear button
  clearBtn.addEventListener("click", function () {
    parsedData = { headers: [], rows: [] };
    selectedFile = null;
    renderTable();
    hideFileInfo();
  });

  // Initial render
  renderTable();
})();
