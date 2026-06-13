from django.http import JsonResponse, HttpResponse
from core.repositories.categories import SubcategoriesRepository

subcategories_repo = SubcategoriesRepository()

def api_get_subcategory_by_id(request, id):
    """API endpoint for retrieving a subcategory by ID."""
    if request.method == 'GET':
        subcategory = subcategories_repo.get_by_id(id)
        if not subcategory:
            return HttpResponse(status=404)
        return JsonResponse(subcategory, safe=False)
    return HttpResponse(status=405)
