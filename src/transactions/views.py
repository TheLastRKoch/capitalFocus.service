import json
import csv
from datetime import datetime
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from core.repositories.transactions import TransactionsRepository
from budgets.models import BudgetsModel
from categories.models import SubcategoriesModel

# Dependency Setup
transactions_repo = TransactionsRepository()

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
    return render(request, 'transactions/import.html',
                  {'active_page': 'transactions'})


# --- API Views ---


@csrf_exempt
def api_list(request):
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
            if not isinstance(data, list):
                return JsonResponse({'error': 'Expected a list of transactions'}, status=400)

            # Get valid field names for the model
            valid_fields = {f.name for f in transactions_repo.model._meta.get_fields() if not f.auto_created}
            # Also include the _id versions of foreign keys
            valid_fields.update({f.name + '_id' for f in transactions_repo.model._meta.get_fields() if f.is_relation and not f.auto_created})

            # Cache for label to ID resolution to avoid excessive DB queries
            budget_cache = {}
            subcategory_cache = {}

            results = []
            for item in data:
                # Map 'budget' to 'budgets_id' if provided
                if 'budget' in item:
                    val = item.pop('budget')
                    if val:
                        if isinstance(val, str) and not str(val).isdigit():
                            if val not in budget_cache:
                                b = BudgetsModel.objects.filter(label__iexact=val).first()
                                budget_cache[val] = b.id if b else None
                            item['budgets_id'] = budget_cache[val]
                        else:
                            item['budgets_id'] = val
                
                # Map 'subcategory' to 'subcategory_id' if provided
                if 'subcategory' in item:
                    val = item.pop('subcategory')
                    if val:
                        if isinstance(val, str) and not str(val).isdigit():
                            if val not in subcategory_cache:
                                s = SubcategoriesModel.objects.filter(label__iexact=val).first()
                                subcategory_cache[val] = s.id if s else None
                            item['subcategory_id'] = subcategory_cache[val]
                        else:
                            item['subcategory_id'] = val

                # Filter item to only include valid fields
                filtered_item = {k: v for k, v in item.items() if k in valid_fields}
                
                if filtered_item:
                    results.append(transactions_repo.create(filtered_item))

            return JsonResponse({'status': 'success', 'created': len(results)}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

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
