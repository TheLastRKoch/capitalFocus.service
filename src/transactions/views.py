import json
import csv
from datetime import datetime
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from core.repositories.transactions import TransactionsRepository
from core.services.transactions import TransactionService

# Dependency Setup
transactions_repo = TransactionsRepository()
transactions_service = TransactionService(transactions_repo)

# --- Template Views ---


def index(request):
    """Render all transactions"""
    return render(request, 'transactions/index.html', {'active_page': 'transactions'})


def uncategorize(request):
    """Render the uncategorized transactions page."""
    return render(request, 'transactions/uncategorize.html', {'active_page': 'transactions'})


def import_transactions(request):
    return render(request, 'transactions/import.html', {'active_page': 'transactions'})


# --- API Views ---


@csrf_exempt
def api_list(request):
    if request.method == 'GET':
        return JsonResponse(transactions_repo.all(), safe=False)
    elif request.method == 'POST':
        payload = json.loads(request.body)
        transactions_service.add_list(payload)
        return JsonResponse({'message': 'Transactions added succesfully'}, safe=False)
    return HttpResponse(status=405)


def api_export_csv(request):
    """Export all transactions to CSV with all columns."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="transactions_export.csv"'

    writer = csv.writer(response)
    # Header with all columns
    writer.writerow([
        'date', 'commerce', 'amount', 'location', 'card', 'authorization',
        'reference', 'transactionType', 'subcategory', 'status', 'budget'
    ])

    transactions = transactions_repo.all()
    for t in transactions:
        # Format the date to remove timezone information
        date_value = t.get('date')
        if date_value:
            if isinstance(date_value, str):
                # Remove timezone offset if present (e.g., "2026-06-13 13:40:03+00:00" -> "2026-06-13 13:40:03")
                date_value = date_value.split('+')[0].split('Z')[0]
            else:
                # If it's a datetime object, format it
                date_value = date_value.strftime('%Y-%m-%d %H:%M:%S')
        
        writer.writerow([
            date_value,
            t.get('commerce'),
            t.get('amount'),
            t.get('location') or '',
            t.get('card') or '',
            t.get('authorization') or '',
            t.get('reference') or '',
            t.get('transactionType') or '',
            t.get('category_name') or 'Uncategorized',
            t.get('status'),
            t.get('budget_name') or 'N/A'
        ])

    return response


def api_uncategorize(request):
    if request.method == 'GET':
        return JsonResponse(transactions_repo.list_uncategorized(), safe=False)
    return HttpResponse(status=405)


@csrf_exempt
def api_details(request, id):
    if request.method == 'PUT':
        data = json.loads(request.body)
        # Map the incoming data to Teable fields
        # Note: Original Flask app might have had this logic in a service.
        # Here we directly update for simplicity and parity.
        fields = {
            'budgets': [{
                'id': data.get('budget')
            }],
            'sections': [{
                'id': data.get('category')
            }],
            'status': 'Categorized'
        }
        return JsonResponse(transactions_repo.update(id, fields))
    return HttpResponse(status=405)
