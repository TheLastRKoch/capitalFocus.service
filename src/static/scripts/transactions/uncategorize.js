const transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));

document.getElementById('toggleDetails').addEventListener('click', function () {
    const details = document.getElementById('additionalDetails');
    if (details.classList.contains('d-none')) {
        details.classList.remove('d-none');
        this.textContent = 'Hide Additional Details';
    } else {
        details.classList.add('d-none');
        this.textContent = 'Show More Details';
    }
});

document.getElementById('saveButton').addEventListener('click', function () {
    const form = document.getElementById('transactionForm');
    if (form.checkValidity()) {
        // Heuristic 1: Visibility of system status
        console.log('Saving categorization...');
        transactionModal.hide();
        // In a real app, a toast would show here (handled by script.js)
    } else {
        form.reportValidity(); // Heuristic 9: Help users recognize, diagnose, and recover from errors
    }
});



function selectTransaction(transaction) {
    console.log(transaction)
    document.getElementById("modalCommerce").value = transaction.fields.commerce
    document.getElementById("modalDate").value = transaction.fields.date
    document.getElementById("modalAmount").value = transaction.fields.amount
    document.getElementById("modalLocation").value = transaction.fields.location
    document.getElementById("modalCard").value = transaction.fields.card

    // Reset additional details (Heuristic 3: User control and freedom)
    document.getElementById('additionalDetails').classList.add('d-none');
    document.getElementById('toggleDetails').textContent = 'Show More Details';

    transactionModal.show();
}

document.getElementById('saveButton').addEventListener('click', function () {
    const form = document.getElementById('transactionForm');
    const data = {};
    transaction_id = 

    form.querySelectorAll('input.form-control, select.form-select').forEach(function (element) {
        let key = element.id.replace(/^modal|Select$/g, '');
        key = key.charAt(0).toLowerCase() + key.slice(1);
        data[key] = element.value;
    });

    fetch('/transaction', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(function (response) {
        if (!response.ok) {
            return response.text().then(function (text) {
                throw new Error(text || 'Failed to save transaction');
            });
        }
        return response.json();
    }).then(function (result) {
        console.log('Transaction saved', result);
    }).catch(function (error) {
        console.error('Save error:', error);
    });
});