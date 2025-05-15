from django.urls import path
from . import views

urlpatterns = [
    path('status/', views.chat_status, name='chat_status'),
    path('test/', views.websocket_test, name='websocket_test'),
    path('ssl-test/', views.ssl_test, name='ssl_test'),
]