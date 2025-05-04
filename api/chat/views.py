from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.

def chat_status(request):
    """
    A simple view to check if the chat server is running
    """
    return JsonResponse({
        "status": "online",
        "message": "Chat server is running"
    })
