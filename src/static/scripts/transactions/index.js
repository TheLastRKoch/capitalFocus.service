(function () {
  "use strict";

  // ----- Sample transaction data (matches the example CSV) -----
  var COLUMNS = [
    "date",
    "commerce",
    "amount",
    "location",
    "card",
    "authorization",
    "reference",
    "transactionType",
    "subcategory",
    "status",
  ];

  var NUMERIC_COLUMNS = { amount: true };

  var transactions = [
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
    },
  ];

  // ----- State -----
  var searchTerm = "";
  var columnFilters = {}; // { columnName: filterText }
  var sortColumn = null;
  var sortDir = 1; // 1 asc, -1 desc

  // ----- Elements -----
  var tableHead = document.getElementById("tableHead");
  var filterRow = document.getElementById("filterRow");
  var tableBody = document.getElementById("tableBody");
  var tableContainer = document.getElementById("tableContainer");
  var emptyState = document.getElementById("emptyState");
  var resultInfo = document.getElementById("resultInfo");
  var searchInput = document.getElementById("searchInput");
  var downloadBtn = document.getElementById("downloadBtn");
  var toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
  var resetBtn = document.getElementById("resetBtn");

  // ----- Helpers -----
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getProcessedRows() {
    var term = searchTerm.trim().toLowerCase();

    var filtered = transactions.filter(function (row) {
      // Global search across all columns
      if (term) {
        var match = COLUMNS.some(function (col) {
          return String(row[col]).toLowerCase().indexOf(term) !== -1;
        });
        if (!match) return false;
      }

      // Per-column filters
      for (var col in columnFilters) {
        var f = columnFilters[col];
        if (f && f.trim() !== "") {
          if (
            String(row[col]).toLowerCase().indexOf(f.trim().toLowerCase()) === -1
          ) {
            return false;
          }
        }
      }
      return true;
    });

    if (sortColumn) {
      filtered = filtered.slice().sort(function (a, b) {
        var va = a[sortColumn];
        var vb = b[sortColumn];

        if (NUMERIC_COLUMNS[sortColumn]) {
          va = parseFloat(va) || 0;
          vb = parseFloat(vb) || 0;
          return (va - vb) * sortDir;
        }

        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
        if (va < vb) return -1 * sortDir;
        if (va > vb) return 1 * sortDir;
        return 0;
      });
    }

    return filtered;
  }

  function renderHead() {
    tableHead.innerHTML = "";
    filterRow.innerHTML = "";

    COLUMNS.forEach(function (col) {
      var th = document.createElement("th");
      th.scope = "col";
      th.className = "sortable";
      if (sortColumn === col) th.classList.add("active");

      var indicator = "↕";
      if (sortColumn === col) indicator = sortDir === 1 ? "↑" : "↓";

      th.innerHTML =
        escapeHtml(col) +
        '<span class="sort-indicator">' +
        indicator +
        "</span>";

      th.addEventListener("click", function () {
        if (sortColumn === col) {
          sortDir = -sortDir;
        } else {
          sortColumn = col;
          sortDir = 1;
        }
        render();
      });

      tableHead.appendChild(th);

      // Filter cell
      var td = document.createElement("td");
      var input = document.createElement("input");
      input.type = "text";
      input.className = "form-control form-control-sm";
      input.placeholder = "Filter...";
      input.value = columnFilters[col] || "";
      input.setAttribute("aria-label", "Filter by " + col);
      input.addEventListener("input", function () {
        columnFilters[col] = input.value;
        renderBody();
      });
      td.appendChild(input);
      filterRow.appendChild(td);
    });
  }

  function renderBody() {
    var rows = getProcessedRows();
    tableBody.innerHTML = "";

    if (rows.length === 0) {
      tableContainer.classList.add("d-none");
      emptyState.classList.remove("d-none");
    } else {
      tableContainer.classList.remove("d-none");
      emptyState.classList.add("d-none");

      rows.forEach(function (row) {
        var tr = document.createElement("tr");
        COLUMNS.forEach(function (col) {
          var td = document.createElement("td");
          td.innerHTML = escapeHtml(row[col] != null ? row[col] : "");
          tr.appendChild(td);
        });
        tableBody.appendChild(tr);
      });
    }

    resultInfo.textContent =
      "Showing " +
      rows.length +
      " of " +
      transactions.length +
      " transaction" +
      (transactions.length === 1 ? "" : "s");

    downloadBtn.disabled = rows.length === 0;
  }

  function render() {
    renderHead();
    renderBody();
  }

  // ----- CSV export (of the currently filtered/sorted view) -----
  function csvEscape(value) {
    var s = String(value == null ? "" : value);
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function downloadCSV() {
    var rows = getProcessedRows();
    var lines = [];
    lines.push(COLUMNS.map(csvEscape).join(","));
    rows.forEach(function (row) {
      lines.push(
        COLUMNS.map(function (col) {
          return csvEscape(row[col]);
        }).join(",")
      );
    });

    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ----- Events -----
  searchInput.addEventListener("input", function () {
    searchTerm = searchInput.value;
    renderBody();
  });

  downloadBtn.addEventListener("click", downloadCSV);

  toggleFiltersBtn.addEventListener("click", function () {
    filterRow.classList.toggle("d-none");
  });

  resetBtn.addEventListener("click", function () {
    searchTerm = "";
    columnFilters = {};
    sortColumn = null;
    sortDir = 1;
    searchInput.value = "";
    render();
  });

  // Initial render
  render();
})();
