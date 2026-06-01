import json
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from core.repositories.transactions import TransactionsRepository
from budgets.models import Budget, Section

# Dependency Setup
transactions_repo = TransactionsRepository()

def _serialize_transaction(t):
    return {
        "id": t.id,
        "fields": {
            "commerce": t.commerce,
            "date": t.date.isoformat(),
            "amount": float(t.amount),
            "location": t.location,
            "card_detail": t.card_detail,
            "status": t.status,
            "budget": {"id": t.budget.id, "name": t.budget.name} if t.budget else None,
            "section": {"id": t.section.id, "label": t.section.label} if t.section else None
        }
    }

# --- Template Views ---

def index(request):
    """Render the main transactions page."""
    return render(request, 'transactions/uncategorize.html', {'active_page': 'transactions'})

def uncategorize(request):
    """Render the uncategorized transactions page."""
    return render(request, 'transactions/uncategorize.html', {'active_page': 'transactions'})

# --- API Views ---

def api_index(request):
    if request.method == 'GET':
        transactions = transactions_repo.all()
        return JsonResponse([_serialize_transaction(t) for t in transactions], safe=False)
    return HttpResponse(status=405)

def api_uncategorize(request):
    if request.method == 'GET':
        transactions = transactions_repo.get_uncategorized()
        return JsonResponse([_serialize_transaction(t) for t in transactions], safe=False)
    return HttpResponse(status=405)

@csrf_exempt
def api_details(request, id):
    if request.method == 'PUT':
        data = json.loads(request.body)
        
        # In Django ORM, we need to get the actual instances for ForeignKeys
        budget_id = data.get('budget')
        section_id = data.get('category')
        
        fields = {
            'status': 'Categorized'
        }
        
        if budget_id:
            fields['budget'] = Budget.objects.get(id=budget_id)
        if section_id:
            fields['section'] = Section.objects.get(id=section_id)
            
        updated_t = transactions_repo.update(id, fields)
        return JsonResponse(_serialize_transaction(updated_t))
    return HttpResponse(status=405)
