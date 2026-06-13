import json
from django.views.decorators.csrf import csrf_exempt
from core.repositories.sections import SectionsRepository
from django.http import JsonResponse, HttpResponse

sections_repo = SectionsRepository()


@csrf_exempt
def api_update_section(request, section_id):
    """API endpoint for updating a section."""
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            section = sections_repo.get_by_id(section_id)
            if not section:
                return HttpResponse(status=404)

            # Update the section with provided data
            updated = sections_repo.update(section_id, data)
            return JsonResponse(updated)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return HttpResponse(status=405)
