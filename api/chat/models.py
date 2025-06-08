from django.db import models
from django.utils import timezone

# Create your models here.

class ConnectionAttempt(models.Model):
    """
    Model to track WebSocket connection attempts for diagnostic purposes
    """
    client_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    successful = models.BooleanField(default=False)
    error_message = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    # Additional diagnostic fields
    connection_path = models.CharField(max_length=255, null=True, blank=True)
    headers = models.JSONField(null=True, blank=True)
    close_code = models.IntegerField(null=True, blank=True)
    connection_duration_ms = models.IntegerField(null=True, blank=True)
    connection_stage = models.CharField(max_length=50, null=True, blank=True, 
                                        choices=(
                                            ('pre_handshake', 'Before Handshake'),
                                            ('handshake', 'During Handshake'),
                                            ('connected', 'Connected'),
                                            ('message_received', 'Message Received'),
                                            ('message_sent', 'Message Sent'),
                                            ('disconnected', 'Disconnected')
                                        ))
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        status = "Successful" if self.successful else "Failed"
        stage = f" ({self.connection_stage})" if self.connection_stage else ""
        return f"{status}{stage} connection from {self.client_ip} at {self.timestamp}"
    
    @classmethod
    def get_connection_statistics(cls):
        """
        Get statistics about WebSocket connections
        """
        from django.db.models import Count, Avg, F, FloatField
        from django.db.models.functions import TruncHour
        
        # Get total counts
        total_attempts = cls.objects.count()
        successful_attempts = cls.objects.filter(successful=True).count()
        failed_attempts = total_attempts - successful_attempts
        
        # Get success rate
        success_rate = (successful_attempts / total_attempts * 100) if total_attempts > 0 else 0
        
        # Get most common error messages
        common_errors = cls.objects.filter(
            successful=False, 
            error_message__isnull=False
        ).exclude(
            error_message=""
        ).values('error_message').annotate(
            count=Count('error_message')
        ).order_by('-count')[:5]
        
        # Get hourly connection attempts for the last 24 hours
        hourly_data = cls.objects.filter(
            timestamp__gte=timezone.now() - timezone.timedelta(hours=24)
        ).annotate(
            hour=TruncHour('timestamp')
        ).values('hour').annotate(
            attempts=Count('id'),
            successful=Count('id', filter=models.Q(successful=True)),
            failed=Count('id', filter=models.Q(successful=False)),
        ).order_by('hour')
        
        # Calculate average connection duration
        avg_duration = cls.objects.filter(
            connection_duration_ms__isnull=False
        ).aggregate(
            avg_duration=Avg('connection_duration_ms')
        )['avg_duration'] or 0
        
        return {
            'total_attempts': total_attempts,
            'successful_attempts': successful_attempts,
            'failed_attempts': failed_attempts,
            'success_rate': round(success_rate, 2),
            'common_errors': list(common_errors),
            'hourly_data': list(hourly_data),
            'avg_duration': round(avg_duration, 2)
        }


class ChatMessage(models.Model):
    """
    Model to store chat messages
    """
    username = models.CharField(max_length=255)
    message = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.username}: {self.message[:50]}{'...' if len(self.message) > 50 else ''}"
