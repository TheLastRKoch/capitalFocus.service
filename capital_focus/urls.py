"""
URL configuration for capital_focus project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from budgets import views as budget_views
from transactions import views as transaction_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', lambda r: redirect('budgets:index')),

    # Template URLs
    path('budgets/', include(('budgets.urls', 'budgets'),
                             namespace='budgets')),
    path(
        'transactions/',
        include(('transactions.urls', 'transactions'),
                namespace='transactions')),

    # API URLs (to match old Flask structure)
    path(
        'api/budgets/',
        include([
            path('', budget_views.api_index, name='api_index'),
            path('active/', budget_views.api_active, name='api_active'),
            path('inactive/', budget_views.api_inactive, name='api_inactive'),
            path('<str:id>/', budget_views.api_get_by_id,
                 name='api_get_by_id'),
            path('<str:id>/sections/',
                 budget_views.api_create_section,
                 name='api_create_section'),
        ])),
    path(
        'api/transactions/',
        include([
            path('', transaction_views.api_index, name='api_index'),
            path('uncategorize/',
                 transaction_views.api_uncategorize,
                 name='api_uncategorize'),
            path('<str:id>/',
                 transaction_views.api_details,
                 name='api_details'),
        ])),
]
