import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from core.repositories.tags import TagsRepository

# Dependency setup
tags_repo = TagsRepository()


@csrf_exempt
def api_list_create(request):
    """List all tags (GET) or create a new tag (POST)."""
    if request.method == 'GET':
        return JsonResponse(tags_repo.list_all(), safe=False)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            label = data.get('label', '')
            tag = tags_repo.create(label)
            return JsonResponse(tag, status=201)
        except (json.JSONDecodeError, KeyError):
            return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
        except ValueError as e:
            return JsonResponse({'error': str(e)}, status=400)

    return HttpResponse(status=405)


@csrf_exempt
def api_delete(request, id):
    """Delete a tag by id (DELETE)."""
    if request.method == 'DELETE':
        found = tags_repo.delete(id)
        if found:
            return HttpResponse(status=204)
        return JsonResponse({'error': 'Tag not found.'}, status=404)

    return HttpResponse(status=405)
