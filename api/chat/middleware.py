from channels.middleware import BaseMiddleware
from asgiref.sync import sync_to_async
from .models import ConnectionAttempt
import traceback
import json
import time
from django.utils import timezone

class WebSocketConnectionLoggingMiddleware:
    """
    ASGI middleware to log WebSocket connection attempts.
    This logs connections even if they fail before reaching the consumer.
    """
    
    def __init__(self, inner):
        self.inner = inner
        self.connection_start_times = {}
    
    async def __call__(self, scope, receive, send):
        """
        Process an ASGI connection
        
        Args:
            scope: The connection scope
            receive: The receive channel
            send: The send channel
        """
        if scope['type'] == 'websocket':
            # Extract client info from the scope
            client_ip = None
            if 'client' in scope:
                client_ip = scope['client'][0]
            
            # Extract path
            connection_path = scope.get('path', '')
            
            # Extract headers and convert to a JSON-friendly format
            headers_dict = {}
            for key, value in scope.get('headers', []):
                try:
                    key_str = key.decode('utf-8', 'ignore')
                    value_str = value.decode('utf-8', 'ignore')
                    headers_dict[key_str] = value_str
                except Exception:
                    # Skip problematic headers
                    pass
            
            # Extract user agent from headers if available
            user_agent = headers_dict.get('user-agent', '')
            
            # Create unique connection identifier
            connection_id = f"{client_ip}:{id(scope)}"
            
            # Record start time
            self.connection_start_times[connection_id] = time.time()
            
            # Create a wrapper for the send function to track disconnection
            original_send = send
            
            async def send_wrapper(message):
                if message['type'] == 'websocket.close':
                    # Calculate connection duration
                    start_time = self.connection_start_times.get(connection_id)
                    duration_ms = None
                    if start_time:
                        duration_ms = int((time.time() - start_time) * 1000)
                        # Clean up the start time
                        if connection_id in self.connection_start_times:
                            del self.connection_start_times[connection_id]
                    
                    # Log disconnection with close code
                    close_code = message.get('code')
                    await self.log_connection_stage(
                        client_ip, 
                        user_agent, 
                        'disconnected', 
                        connection_path,
                        headers_dict,
                        close_code=close_code,
                        connection_duration_ms=duration_ms
                    )
                
                # Call the original send function
                return await original_send(message)
            
            # Create a wrapper for the receive function to track message events
            original_receive = receive
            
            async def receive_wrapper():
                message = await original_receive()
                
                if message['type'] == 'websocket.receive':
                    # Log message received event
                    await self.log_connection_stage(
                        client_ip,
                        user_agent,
                        'message_received',
                        connection_path,
                        headers_dict,
                        successful=True
                    )
                
                return message
            
            try:
                # Log pre-handshake connection attempt
                await self.log_connection_stage(
                    client_ip, 
                    user_agent, 
                    'pre_handshake',
                    connection_path,
                    headers_dict
                )
                
                # Intercept the accept message
                original_inner = self.inner
                
                async def inner_wrapper(inner_scope, inner_receive, inner_send):
                    async def inner_send_wrapper(message):
                        if message['type'] == 'websocket.accept':
                            # Log successful handshake
                            await self.log_connection_stage(
                                client_ip,
                                user_agent,
                                'connected',
                                connection_path,
                                headers_dict,
                                successful=True
                            )
                        
                        return await inner_send(message)
                    
                    return await original_inner(inner_scope, inner_receive, inner_send_wrapper)
                
                # Continue processing the connection with our wrappers
                return await inner_wrapper(scope, receive_wrapper, send_wrapper)
                
            except Exception as e:
                # If an error occurs, log the failed connection
                error_message = f"{str(e)}\n{traceback.format_exc()}"
                
                # Calculate connection duration
                start_time = self.connection_start_times.get(connection_id)
                duration_ms = None
                if start_time:
                    duration_ms = int((time.time() - start_time) * 1000)
                    # Clean up the start time
                    if connection_id in self.connection_start_times:
                        del self.connection_start_times[connection_id]
                
                await self.log_connection_stage(
                    client_ip, 
                    user_agent, 
                    'handshake', 
                    connection_path,
                    headers_dict,
                    successful=False,
                    error_message=error_message,
                    connection_duration_ms=duration_ms
                )
                # Re-raise the exception
                raise
        else:
            # Not a WebSocket connection, pass through
            return await self.inner(scope, receive, send)
    
    @sync_to_async
    def log_connection_stage(self, client_ip, user_agent, connection_stage, connection_path, headers, 
                           successful=False, error_message=None, close_code=None, connection_duration_ms=None):
        """Log a connection attempt or stage to the database"""
        ConnectionAttempt.objects.create(
            client_ip=client_ip,
            user_agent=user_agent,
            successful=successful,
            error_message=error_message,
            connection_path=connection_path,
            headers=headers,
            close_code=close_code,
            connection_duration_ms=connection_duration_ms,
            connection_stage=connection_stage
        )
