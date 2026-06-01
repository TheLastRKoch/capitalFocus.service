import json
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from core.repositories.budgets import BudgetsRepository
from core.repositories.sections import SectionsRepository
from core.repositories.transactions import TransactionsRepository
from core.services.budgets import BudgetService

# Dependency Setup
budgets_repo = BudgetsRepository()
sections_repo = SectionsRepository()
transactions_repo = TransactionsRepository()
budget_service = BudgetService()

def _serialize_budget(budget):
    return {
        "id": budget.id,
        "fields": {
            "name": budget.name,
            "projection": float(budget.projection),
            "status": budget.status
        }
    }

# --- Template Views ---

def index(request):
    """Render the budgets list page."""
    return render(request, 'budgets/list.html', {'active_page': 'budgets'})

def details(request, id):
    """Render the details page for a specific budget."""
    return render(request, 'budgets/details.html', {'active_page': 'budgets', 'budget_id': id})

# --- API Views ---

@csrf_exempt
def api_index(request):
    if request.method == 'GET':
        budgets = budgets_repo.all()
        return JsonResponse([_serialize_budget(b) for b in budgets], safe=False)
    elif request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse(budget_service.create_budget(data), status=201)
    return HttpResponse(status=405)

def api_active(request):
    if request.method == 'GET':
        budgets = budgets_repo.get_by_status('Active')
        return JsonResponse([_serialize_budget(b) for b in budgets], safe=False)
    return HttpResponse(status=405)

def api_inactive(request):
    if request.method == 'GET':
        budgets = budgets_repo.get_by_status('Inactive')
        return JsonResponse([_serialize_budget(b) for b in budgets], safe=False)
    return HttpResponse(status=405)

def api_get_by_id(request, id):
    if request.method == 'GET':
        try:
            return JsonResponse(budget_service.get_budget_details(id))
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=404)
    return HttpResponse(status=405)

@csrf_exempt
def api_create_section(request, id):
    if request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse(budget_service.create_section(id, data), status=201)
    return HttpResponse(status=405)
