from django.urls import path
from . import views

urlpatterns = [
    # Template URLs
    path('', views.index, name='index'),
    path('<str:id>/', views.details, name='details'),

    # API URLs
    path('api/', views.api_index, name='api_index'),
    path('api/active/', views.api_active, name='api_active'),
    path('api/inactive/', views.api_inactive, name='api_inactive'),
    path('api/<str:id>/', views.api_get_by_id, name='api_get_by_id'),
    path('api/<str:id>/complete',
         views.api_get_by_id_complete,
         name='api_get_by_id_complete'),
    path('api/<str:id>/sections/',
         views.api_create_section,
         name='api_create_section')
]
