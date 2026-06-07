import json
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from core.repositories.budgets import BudgetsRepository
from core.repositories.sections import SectionsRepository
from core.repositories.transactions import TransactionsRepository
from core.repositories.catogories import CategoriesRepository, SubcategoriesRepository
from core.services.budgets import BudgetService
from django.forms.models import model_to_dict

# Dependency Setup
budgets_repo = BudgetsRepository()
sections_repo = SectionsRepository()
transactions_repo = TransactionsRepository()
categories_repo = CategoriesRepository()
subcategories_repo = SubcategoriesRepository()

budget_service = BudgetService(budgets_repo, sections_repo, transactions_repo,
                               categories_repo, subcategories_repo)

# --- Template Views ---


def index(request):
    """Render the budgets list page."""
    return render(request, 'budgets/list.html', {'active_page': 'budgets'})


def details(request, id):
    """Render the details page for a specific budget."""
    return render(request, 'budgets/details.html', {
        'active_page': 'budgets',
        'budget_id': id
    })


# --- API Views ---


@csrf_exempt
def api_index(request):
    if request.method == 'GET':
        return JsonResponse(budgets_repo.all(), safe=False)
    elif request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse(budget_service.create_budget(data), status=201)
    return HttpResponse(status=405)


def api_active(request):
    if request.method == 'GET':
        return JsonResponse(budgets_repo.get_by_status('Active'), safe=False)
    return HttpResponse(status=405)


def api_inactive(request):
    if request.method == 'GET':
        return JsonResponse(budgets_repo.get_by_status('Inactive'), safe=False)
    return HttpResponse(status=405)


def api_get_by_id(request, id):
    if request.method == 'GET':
        return JsonResponse(budget_service.get_by_id(id))
    return HttpResponse(status=405)


def api_get_by_id_complete(request, id):
    if request.method == 'GET':
        budget = budgets_repo.get_by_id(id)
        if not budget:
            return HttpResponse(status=404)
        sections = budget_service.get_section_transactions(id)
        budget['sections'] = sections
        return JsonResponse(budget, safe=False)
    return HttpResponse(status=405)


@csrf_exempt
def api_create_section(request, id):
    if request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse(budget_service.create_section(id, data),
                            status=201)
    return HttpResponse(status=405)
