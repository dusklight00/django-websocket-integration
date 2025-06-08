import json
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime
from channels.db import database_sync_to_async
from .models import ConnectionAttempt, ChatMessage
import traceback

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "chat_room"
        self.room_group_name = f"chat_{self.room_name}"
        
        try:
            # Log connection attempt
            headers = dict(self.scope.get('headers', []))
            user_agent = headers.get(b'user-agent', b'').decode('utf-8', 'ignore')
            client_ip = self.get_client_ip()
            
            # Store connection attempt asynchronously
            await self.log_connection_attempt(client_ip, user_agent, True)

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
        except Exception as e:
            # Log failed connection attempt with error
            error_message = f"{str(e)}\n{traceback.format_exc()}"
            client_ip = self.get_client_ip()
            await self.log_connection_attempt(client_ip, "", False, error_message)
            # Re-raise to properly close connection with an error
            raise

    def get_client_ip(self):
        """Extract client IP from scope"""
        client = self.scope.get('client', None)
        if client:
            return client[0]
        
        # Fallback to headers if client not in scope
        headers = dict(self.scope.get('headers', []))
        x_forwarded_for = headers.get(b'x-forwarded-for', b'').decode('utf-8', 'ignore')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return None

    @database_sync_to_async
    def log_connection_attempt(self, client_ip, user_agent, successful, error_message=None):
        """Log a connection attempt to the database"""
        ConnectionAttempt.objects.create(
            client_ip=client_ip,
            user_agent=user_agent,
            successful=successful,
            error_message=error_message
        )

    @database_sync_to_async
    def save_chat_message(self, username, message):
        """Save a chat message to the database"""
        ChatMessage.objects.create(
            username=username,
            message=message
        )

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        username = text_data_json.get("username", "Anonymous")
        timestamp = datetime.now().strftime("%H:%M:%S")

        # Save message to database
        await self.save_chat_message(username, message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "username": username,
                "timestamp": timestamp
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        username = event["username"]
        timestamp = event["timestamp"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "message": message,
            "username": username,
            "timestamp": timestamp
        }))