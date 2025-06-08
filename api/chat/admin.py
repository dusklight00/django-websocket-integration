from django.contrib import admin
from .models import ConnectionAttempt, ChatMessage

# Register your models here.
@admin.register(ConnectionAttempt)
class ConnectionAttemptAdmin(admin.ModelAdmin):
    list_display = ('client_ip', 'successful', 'timestamp', 'user_agent', 'error_message')
    list_filter = ('successful', 'timestamp')
    search_fields = ('client_ip', 'user_agent', 'error_message')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    
    def has_add_permission(self, request):
        # Don't allow adding connection attempts manually
        return False
    
    def has_change_permission(self, request, obj=None):
        # Don't allow changing connection attempts
        return False

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('username', 'short_message', 'timestamp')
    list_filter = ('timestamp', 'username')
    search_fields = ('username', 'message')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    
    def short_message(self, obj):
        return obj.message[:50] + ('...' if len(obj.message) > 50 else '')
    short_message.short_description = 'Message'
