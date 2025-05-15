"""
Run script to start Django server with SSL support for secure WebSockets (WSS)
"""
import os
import sys
import ssl
from pathlib import Path
import django
from django.core.management import call_command

# Get the base directory
BASE_DIR = Path(__file__).resolve().parent

# Add the current directory to path so Django can find the settings module
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

def run_server_with_ssl():
    """Run Django server with SSL support for secure WebSockets"""
    ssl_cert = os.path.join(BASE_DIR, 'ssl', 'cert.pem')
    ssl_key = os.path.join(BASE_DIR, 'ssl', 'key.pem')
    
    # Check if SSL certificates exist
    if not os.path.exists(ssl_cert) or not os.path.exists(ssl_key):
        print("SSL certificates not found. Please generate them first.")
        sys.exit(1)
    
    print(f"Starting Django server with SSL on port 8001...")
    print(f"Using certificates:")
    print(f"  - Certificate: {ssl_cert}")
    print(f"  - Private key: {ssl_key}")
      # Run the Daphne server with SSL, binding to all interfaces
    from daphne.cli import CommandLineInterface
    sys.argv = [
        'daphne',
        'api.asgi:application',
        '-b', '0.0.0.0',  # Bind to all available interfaces
        '-e', 'ssl:8001:privateKey={0}:certKey={1}'.format(ssl_key, ssl_cert),
        '--access-log', '-'
    ]
    CommandLineInterface().run()

if __name__ == '__main__':
    run_server_with_ssl()
