from django.shortcuts import render
from django.http import JsonResponse
import sys
import os
import importlib
import socket
import json
import channels
import daphne
import asgiref
from django.conf import settings
from django.middleware.csrf import get_token
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

# Create your views here.

def chat_status(request):
    """
    A simple view to check if the chat server is running
    """
    return JsonResponse({
        "status": "online",
        "message": "Chat server is running"
    })

def websocket_diagnostics(request):
    """
    A comprehensive diagnostics endpoint that checks the WebSocket server's status and configuration
    """
    # Set CORS headers for the preflight request
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    # Get CSRF token to check if it's required for WebSocket connections
    csrf_token = get_token(request)
    
    # Get the client's IP address
    client_ip = get_client_ip(request)
    
    # Check if channel layer is configured
    channel_layer_config = None
    channel_layer_available = False
    try:
        channel_layer = get_channel_layer()
        channel_layer_available = True
        channel_layer_config = settings.CHANNEL_LAYERS
    except Exception as e:
        channel_layer_available = False
    
    # Test if we can communicate with the channel layer
    channel_layer_test = None
    try:
        if channel_layer_available:
            # Test sending a message to a test group
            async_to_sync(channel_layer.group_add)("test_group", "test_channel")
            async_to_sync(channel_layer.group_send)(
                "test_group", 
                {
                    "type": "test.message",
                    "text": "Hello from diagnositcs"
                }
            )
            channel_layer_test = "Successfully sent test message to channel layer"
    except Exception as e:
        channel_layer_test = f"Error testing channel layer: {str(e)}"
    
    # Check if ASGI server port is open
    asgi_port = getattr(settings, 'ASGI_PORT', 8001)
    asgi_port_status = check_port_is_open('localhost', asgi_port)
    
    # Get recent connection attempts
    from .models import ConnectionAttempt
    recent_attempts = [
        {
            "client_ip": attempt.client_ip,
            "timestamp": attempt.timestamp.isoformat(),
            "user_agent": attempt.user_agent,
            "successful": attempt.successful,
            "error_message": attempt.error_message,
            "connection_stage": attempt.connection_stage,
            "connection_duration_ms": attempt.connection_duration_ms,
            "close_code": attempt.close_code,
            "connection_path": attempt.connection_path
        }
        for attempt in ConnectionAttempt.objects.order_by('-timestamp')[:20]
    ]
    
    # Get connection statistics
    connection_statistics = ConnectionAttempt.get_connection_statistics()
    
    # Collect WebSocket configuration
    websocket_config = {
        "ASGI_APPLICATION": getattr(settings, 'ASGI_APPLICATION', None),
        "CHANNEL_LAYERS": channel_layer_config,
        "CORS_ALLOWED_ORIGINS": getattr(settings, 'CORS_ALLOWED_ORIGINS', None),
        "ALLOWED_HOSTS": getattr(settings, 'ALLOWED_HOSTS', None),
    }
    
    # Get middleware configuration
    middleware_classes = []
    
    try:
        for middleware in settings.MIDDLEWARE:
            middleware_classes.append(middleware)
    except:
        pass
        
    # Check for security settings
    security_settings = {
        "CORS_ALLOW_ALL_ORIGINS": getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', None),
        "CSRF_COOKIE_SECURE": getattr(settings, 'CSRF_COOKIE_SECURE', None),
        "SECURE_SSL_REDIRECT": getattr(settings, 'SECURE_SSL_REDIRECT', None),
        "SESSION_COOKIE_SECURE": getattr(settings, 'SESSION_COOKIE_SECURE', None),
    }
    
    # Check TLS/SSL configuration
    tls_config = {
        "using_https": request.is_secure(),
        "x_forwarded_proto": request.META.get('HTTP_X_FORWARDED_PROTO', None),
        "server_port": request.META.get('SERVER_PORT', None)
    }
    
    # Collect module versions
    versions = {
        "Python": sys.version,
        "Django": get_module_version('django'),
        "Channels": get_module_version('channels'),
        "Daphne": get_module_version('daphne'),
        "ASGI": get_module_version('asgiref'),
    }
    
    # Collect OS info
    os_info = {
        "OS": os.name,
        "Platform": sys.platform,
    }
    
    # Create response with all diagnostics data
    response_data = {
        "status": "online",
        "server_diagnostics": {
            "client_ip": client_ip,
            "csrf_enabled": csrf_token is not None,
            "channel_layer_available": channel_layer_available,
            "channel_layer_test": channel_layer_test,
            "asgi_port_status": asgi_port_status,
            "asgi_port": asgi_port,
            "websocket_config": websocket_config,
            "versions": versions,
            "os_info": os_info,
            "security_settings": security_settings,
            "middleware_classes": middleware_classes,
            "tls_config": tls_config,
            "recent_connection_attempts": recent_attempts,
            "connection_statistics": connection_statistics,
            "server_time": timezone.now().isoformat()
        }
    }
    
    # Send the response with CORS headers
    response = JsonResponse(response_data)
    response["Access-Control-Allow-Origin"] = "*"
    return response
        "Daphne": get_module_version('daphne'),
        "ASGI": get_module_version('asgiref'),
    }
    
    # Collect OS info
    os_info = {
        "OS": os.name,
        "Platform": sys.platform,
    }
    
    # Create response with all diagnostics data
    response_data = {
        "status": "online",
        "server_diagnostics": {
            "client_ip": client_ip,
            "csrf_enabled": csrf_token is not None,
            "channel_layer_available": channel_layer_available,
            "channel_layer_test": channel_layer_test,
            "asgi_port_status": asgi_port_status,
            "asgi_port": asgi_port,
            "websocket_config": websocket_config,
            "versions": versions,
            "os_info": os_info,
            "recent_connection_attempts": recent_attempts
        }
    }
    
    # Send the response with CORS headers
    response = JsonResponse(response_data)
    response["Access-Control-Allow-Origin"] = "*"
    return response

def get_client_ip(request):
    """Get the client's IP address from the request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    else:
        return request.META.get('REMOTE_ADDR')

def get_module_version(module_name):
    """Get the version of a Python module"""
    try:
        module = importlib.import_module(module_name)
        return getattr(module, '__version__', 'unknown')
    except ImportError:
        return 'not installed'

def check_port_is_open(host, port):
    """Check if a port is open on the given host"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1)
        result = s.connect_ex((host, port))
        s.close()
        if result == 0:
            return "open"
        else:
            return f"closed (error code: {result})"
    except Exception as e:
        return f"error checking: {str(e)}"
