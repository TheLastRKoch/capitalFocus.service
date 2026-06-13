from django.urls import path
from . import views

urlpatterns = [
    # API URLs
    path('api/sections/<str:section_id>/',
         views.api_update_section,
         name='api_update_section'),
]
