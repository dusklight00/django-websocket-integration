"""
Management command to run the server with SSL support
"""
import os
import sys
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Run the Django server with SSL support for secure WebSockets (WSS)'

    def handle(self, *args, **options):
        ssl_cert = os.path.join(settings.BASE_DIR, 'ssl', 'cert.pem')
        ssl_key = os.path.join(settings.BASE_DIR, 'ssl', 'key.pem')
        
        # Check if SSL certificates exist
        if not os.path.exists(ssl_cert) or not os.path.exists(ssl_key):
            self.stderr.write(self.style.ERROR('SSL certificates not found. Please generate them first.'))
            sys.exit(1)
        
        self.stdout.write(self.style.SUCCESS(f"Starting Django server with SSL on port 8001..."))
        self.stdout.write(f"Using certificates:")
        self.stdout.write(f"  - Certificate: {ssl_cert}")
        self.stdout.write(f"  - Private key: {ssl_key}")
          # Run the Daphne server with SSL, binding to all interfaces
        from daphne.cli import CommandLineInterface
        sys.argv = [
            'daphne',
            'api.asgi:application',
            '-b', '0.0.0.0',  # Bind to all available interfaces
            '-e', f'ssl:8001:privateKey={ssl_key}:certKey={ssl_cert}',
            '--access-log', '-'
        ]
        CommandLineInterface().run()
