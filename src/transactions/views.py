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
        try:
            limit = int(request.GET.get('limit', 50))
            page = int(request.GET.get('page', 1))
        except ValueError:
            limit = 50
            page = 1

        offset = (page - 1) * limit
        return JsonResponse(transactions_repo.list_paginated(limit, offset))

    if request.method == 'POST':
        date_format = '%Y-%m-%d %H:%M'
        try:
            data = json.loads(request.body)
            if not isinstance(data, list):
                return JsonResponse({'error': 'Expected a list of transactions'}, status=400)

            # Get valid field names for the model
            valid_fields = {f.name for f in transactions_repo.model._meta.get_fields() if not f.auto_created}
            # Also include the _id versions of foreign keys
            valid_fields.update({
                f.name + '_id'
                for f in transactions_repo.model._meta.get_fields()
                if f.is_relation and not f.auto_created
            })

            # Cache for label to ID resolution to avoid excessive DB queries
            budget_cache = {}
            subcategory_cache = {}

            created_items = []
            existing_items = []
            error_items = []
            seen_in_batch = set()

            for item_idx, raw_item in enumerate(data):
                if not isinstance(raw_item, dict):
                    error_items.append({
                        'index': item_idx,
                        'item': raw_item,
                        'error': 'Item must be a dictionary'
                    })
                    continue

                item = dict(raw_item)
                try:
                    parsed_date = None
                    if 'date' in item:
                        val = item.pop('date')
                        if val:
                            if isinstance(val, datetime):
                                parsed_date = val
                            else:
                                parsed_date = datetime.strptime(str(val).strip(), date_format)
                            item['date'] = parsed_date

                    commerce = item.get('commerce')
                    amount = item.get('amount')

                    # Check for duplicates if identifying fields are present
                    if parsed_date is not None and commerce is not None and amount is not None:
                        batch_key = (parsed_date.isoformat(), str(commerce).strip(), str(amount).strip())
                        if batch_key in seen_in_batch or transactions_repo.exists_by_date_commerce_amount(
                                parsed_date, commerce, amount):
                            existing_items.append({
                                'index': item_idx,
                                'date': parsed_date.strftime(date_format) if parsed_date else None,
                                'commerce': commerce,
                                'amount': str(amount),
                            })
                            seen_in_batch.add(batch_key)
                            continue
                        seen_in_batch.add(batch_key)

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
                        created_record = transactions_repo.create(filtered_item)
                        created_items.append(created_record)
                    else:
                        error_items.append({
                            'index': item_idx,
                            'item': raw_item,
                            'error': 'No valid fields provided'
                        })
                except Exception as item_err:
                    error_items.append({
                        'index': item_idx,
                        'item': raw_item,
                        'error': str(item_err)
                    })

            return JsonResponse({
                'status': 'success',
                'created': len(created_items),
                'summary': {
                    'total': len(data),
                    'created_count': len(created_items),
                    'existing_count': len(existing_items),
                    'error_count': len(error_items),
                    'created': created_items,
                    'existing': existing_items,
                    'errors': error_items
                }
            }, status=201)
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
        'date', 'commerce', 'amount', 'location', 'card', 'authorization', 'reference', 'transactionType',
        'subcategory', 'status', 'budget'
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


def api_list_missing_sections(request, id):
    if request.method == 'GET':
        return JsonResponse(transactions_repo.list_missing_sections(id), safe=False)
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


def api_duplicates(request):
    """Return groups of duplicate transactions (same amount, commerce, and calendar date)."""
    if request.method == 'GET':
        groups = transactions_repo.list_duplicates()
        # Serialize Decimal and datetime values to JSON-safe strings
        serialized = []
        for group in groups:
            serialized_group = []
            for t in group:
                serialized_group.append({
                    'id': t['id'],
                    'amount': str(t['amount']),
                    'commerce': t['commerce'],
                    'date': t['date'].isoformat() if hasattr(t['date'], 'isoformat') else str(t['date']),
                })
            serialized.append(serialized_group)
        return JsonResponse({'groups': serialized})
    return HttpResponse(status=405)


def duplicates(request):
    """Render the duplicate transactions detection page."""
    return render(request, 'transactions/duplicates.html', {'active_page': 'transactions'})

