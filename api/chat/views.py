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

def websocket_test(request):
    """
    Render a simple page to test the WebSocket connection
    """
    return render(request, 'websocket_test.html')

def ssl_test(request):
    """
    Render a simple page to test SSL connection
    """
    return render(request, 'ssl_test.html')
