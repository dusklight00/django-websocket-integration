from django.urls import path
from . import views

urlpatterns = [
    path('status/', views.chat_status, name='chat_status'),
]