import json
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from core.repositories.transactions import TransactionsRepository

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

            results = []
            for item in data:
                # Map 'budget' to 'budgets_id' if provided
                if 'budget' in item:
                    item['budgets_id'] = item.pop('budget')
                # Map 'subcategory' to 'subcategory_id' if provided
                if 'subcategory' in item:
                    item['subcategory_id'] = item.pop('subcategory')

                # Filter item to only include valid fields
                filtered_item = {k: v for k, v in item.items() if k in valid_fields}
                
                if filtered_item:
                    results.append(transactions_repo.create(filtered_item))

            return JsonResponse({'status': 'success', 'created': len(results)}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return HttpResponse(status=405)


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
