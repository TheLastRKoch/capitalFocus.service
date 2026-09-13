from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_list_create, name='tags_list_create'),
    path('<int:id>/', views.api_delete, name='tags_delete'),
]
