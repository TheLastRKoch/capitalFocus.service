from django.urls import path
from . import views

urlpatterns = [
    # Template URLs
    path('', views.index, name='index'),
    path('uncategorize/', views.uncategorize, name='uncategorize'),
    path('import/', views.import_transactions, name='import'),

    # API URLs
    path('api/uncategorize/', views.api_uncategorize, name='api_uncategorize'),
    path('api/transactions/', views.api_list, name='transactions_list'),
]
