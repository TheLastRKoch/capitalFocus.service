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


def api_list(request):
    if request.method == 'GET':
        return JsonResponse(transactions_repo.all(), safe=False)
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
