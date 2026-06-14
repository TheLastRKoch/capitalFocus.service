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
transaction_service = TransactionService(transactions_repo)

# --- Template Views ---


def index(request):
    """Render all transactions"""
    return render(request, 'transactions/index.html',
                  {'active_page': 'transactions'})


def uncategorize(request):
    """Render the uncategorized transactions page."""
    return render(request, 'transactions/uncategorize.html',
                  {'active_page': 'transactions'})


def import_transactions(request):
    """Render the import transactions page."""
    return render(request, 'transactions/import.html',
                  {'active_page': 'transactions'})


# --- API Views ---


@csrf_exempt
def api_list(request):
    """API endpoint for listing or batch creating transactions."""
    if request.method == 'GET':
        try:
            limit = int(request.GET.get('limit', 50))
            page = int(request.GET.get('page', 1))
        except ValueError:
            limit = 50
            page = 1

        offset = (page - 1) * limit
        return JsonResponse(transactions_repo.list_paginated(limit, offset))

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            created_count = transaction_service.create_batch(data)
            return JsonResponse({'status': 'success', 'created': created_count}, status=201)
        except ValueError as e:
            return JsonResponse({'error': str(e)}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'An unexpected error occurred'}, status=500)

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
                # Remove timezone offset if present
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
    """API endpoint for listing uncategorized transactions."""
    if request.method == 'GET':
        return JsonResponse(transactions_repo.list_uncategorized(), safe=False)
    return HttpResponse(status=405)


@csrf_exempt
def api_details(request, id):
    """API endpoint for updating a transaction's details."""
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            result = transaction_service.update_transaction(id, data)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return HttpResponse(status=405)

