"""
Diagnostic script to check WebSocket configuration and connection.
This script checks for common issues with WebSocket connections.
"""
import os
import sys
import ssl
import socket
import json
import time
from pathlib import Path

# Get the base directory
BASE_DIR = Path(__file__).resolve().parent

def check_certificate_files():
    """Check if SSL certificate files exist and are readable"""
    print("\n--- Checking SSL Certificate Files ---")
    
    ssl_dir = os.path.join(BASE_DIR, "ssl")
    cert_file = os.path.join(ssl_dir, "cert.pem")
    key_file = os.path.join(ssl_dir, "key.pem")
    
    if not os.path.exists(ssl_dir):
        print("❌ SSL directory does not exist!")
        return False
    
    if not os.path.exists(cert_file):
        print(f"❌ Certificate file not found at: {cert_file}")
        return False
    else:
        print(f"✅ Certificate file exists: {cert_file}")
    
    if not os.path.exists(key_file):
        print(f"❌ Key file not found at: {key_file}")
        return False
    else:
        print(f"✅ Key file exists: {key_file}")
    
    # Check file permissions
    try:
        with open(cert_file, 'r') as f:
            pass
        print("✅ Certificate file is readable")
        
        with open(key_file, 'r') as f:
            pass
        print("✅ Key file is readable")
        
        return True
    except Exception as e:
        print(f"❌ Error reading certificate files: {e}")
        return False

def test_ssl_context():
    """Test if the SSL context can be created with the certificate"""
    print("\n--- Testing SSL Context Creation ---")
    
    ssl_dir = os.path.join(BASE_DIR, "ssl")
    cert_file = os.path.join(ssl_dir, "cert.pem")
    key_file = os.path.join(ssl_dir, "key.pem")
    
    try:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cert_file, key_file)
        print("✅ SSL context created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating SSL context: {e}")
        return False

def check_port_availability():
    """Check if port 8001 is available or already in use"""
    print("\n--- Checking Port Availability ---")
    
    try:
        # Try to bind to the port
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('127.0.0.1', 8001))
        
        if result == 0:
            print("❌ Port 8001 is already in use. Another service might be running.")
            print("   This could be your Django server if it's already running.")
            sock.close()
            return False
        else:
            print("✅ Port 8001 is available for use")
            sock.close()
            return True
    except Exception as e:
        print(f"❌ Error checking port: {e}")
        return False

def check_routing_configuration():
    """Check Django Channels routing configuration"""
    print("\n--- Checking WebSocket Routing Configuration ---")
    
    # Check routing.py file
    routing_file = os.path.join(BASE_DIR, "chat", "routing.py")
    
    try:
        with open(routing_file, 'r') as f:
            content = f.read()
            
        if "ws/chat/" in content:
            print("✅ WebSocket routing is configured for ws/chat/")
        else:
            print("❌ WebSocket routing might not be correctly configured")
            print("   Expected 'ws/chat/' pattern in routing.py")
            return False
            
        return True
    except Exception as e:
        print(f"❌ Error reading routing configuration: {e}")
        return False

def display_connection_help():
    """Display helpful information for connecting to WebSockets"""
    print("\n--- WebSocket Connection Information ---")
    print("To connect to the secure WebSocket from your browser:")
    print("1. The correct WebSocket URL is: wss://localhost:8001/ws/chat/")
    print("2. You MUST first visit https://localhost:8001/ in your browser")
    print("   and accept the self-signed certificate warning")
    print("3. For testing, visit: https://localhost:8001/chat/test/")
    print("\nCommon Issues:")
    print("- Certificate not trusted: Visit https://localhost:8001 first")
    print("- Mixed content: Frontend must use HTTPS if connecting to WSS")
    print("- CORS: Make sure CORS is properly configured")
    print("- Network: Check firewalls and antivirus software")

def suggest_next_steps(all_passed):
    """Suggest next steps based on check results"""
    print("\n--- Next Steps ---")
    
    if all_passed:
        print("✅ All checks passed. Try running the server:")
        print(f"   python {os.path.join(BASE_DIR, 'run.py')}")
        print("   Then visit: https://localhost:8001/chat/test/")
    else:
        print("❌ Some checks failed. Fix the issues above before proceeding.")
        print("   You can generate new certificates with:")
        print("   python setup.py")

def main():
    """Run all checks"""
    print("=== WebSocket Configuration Diagnostic Tool ===")
    
    checks = [
        check_certificate_files(),
        test_ssl_context(),
        check_port_availability(),
        check_routing_configuration()
    ]
    
    all_passed = all(checks)
    
    print("\n=== Summary ===")
    if all_passed:
        print("✅ All checks passed!")
    else:
        print("❌ Some checks failed! See details above.")
    
    display_connection_help()
    suggest_next_steps(all_passed)

if __name__ == "__main__":
    main()
