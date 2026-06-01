from django.urls import path
from . import views

urlpatterns = [
    # Template URLs
    path('', views.index, name='index'),
    path('uncategorize/', views.uncategorize, name='uncategorize'),
    
    # API URLs
    path('api/', views.api_index, name='api_index'),
    path('api/uncategorize/', views.api_uncategorize, name='api_uncategorize'),
]
