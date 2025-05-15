"""
Setup script to install dependencies and configure the application
"""
import os
import subprocess
import sys
from pathlib import Path

# Get the base directory
BASE_DIR = Path(__file__).resolve().parent

def install_dependencies():
    """Install dependencies from requirements.txt"""
    requirements_file = os.path.join(BASE_DIR, "requirements.txt")
    print(f"Installing dependencies from {requirements_file}...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_file])
    print("Dependencies installed successfully!")

def check_ssl_certificates():
    """Check if SSL certificates exist and generate them if not"""
    ssl_dir = os.path.join(BASE_DIR, "ssl")
    ssl_cert = os.path.join(ssl_dir, "cert.pem")
    ssl_key = os.path.join(ssl_dir, "key.pem")
    
    if not os.path.exists(ssl_dir):
        print(f"Creating SSL directory at {ssl_dir}...")
        os.makedirs(ssl_dir, exist_ok=True)
    
    if not os.path.exists(ssl_cert) or not os.path.exists(ssl_key):
        print("SSL certificates not found. Generating self-signed certificates...")
        try:
            # Check if OpenSSL is available
            subprocess.run(["openssl", "version"], check=True)
            
            # Generate self-signed certificate
            cmd = [
                "openssl", "req", "-x509", "-nodes",
                "-days", "365", "-newkey", "rsa:2048",
                "-keyout", ssl_key,
                "-out", ssl_cert,
                "-subj", "/CN=localhost"
            ]
            subprocess.run(cmd, check=True)
            print(f"SSL certificates generated successfully!")
            
        except (subprocess.SubprocessError, FileNotFoundError):
            print("Error: OpenSSL is not available. Please install OpenSSL and try again.")
            print("Alternatively, manually generate SSL certificates and place them in the ssl directory.")
            sys.exit(1)
    else:
        print(f"SSL certificates already exist at {ssl_dir}")

def run_migrations():
    """Run Django migrations"""
    print("Running Django migrations...")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
    subprocess.check_call([sys.executable, "manage.py", "migrate"], cwd=BASE_DIR)
    print("Migrations completed successfully!")

def test_ssl_connection():
    """Test the SSL connection to help troubleshoot certificate issues"""
    ssl_cert = os.path.join(BASE_DIR, "ssl", "cert.pem")
    ssl_key = os.path.join(BASE_DIR, "ssl", "key.pem")
    
    if not os.path.exists(ssl_cert) or not os.path.exists(ssl_key):
        print("SSL certificates not found. Run setup.py first to generate them.")
        return
    
    print("\nTesting SSL configuration...")
    try:
        import ssl
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(ssl_cert, ssl_key)
        print("✅ SSL certificate loaded successfully!")
        print("If your browser still can't connect:")
        print("  1. Open https://localhost:8001 in your browser")
        print("  2. Accept the security warning about the self-signed certificate")
        print("  3. Then try connecting with your application again")
    except Exception as e:
        print(f"❌ Error loading SSL certificate: {e}")
        print("Please check your certificate files and try again.")

if __name__ == "__main__":
    print("Setting up Django WebSocket Integration project...")
    install_dependencies()
    check_ssl_certificates()
    run_migrations()
    test_ssl_connection()
    print("\nSetup completed successfully!")
    print("\nTo start the server with SSL support, run:")
    print(f"  python {os.path.join(BASE_DIR, 'run.py')}")
    print("  or")
    print(f"  python {os.path.join(BASE_DIR, 'manage.py')} runserver_ssl")
    print("\nIMPORTANT: For the frontend to connect via WSS:")
    print("1. Visit https://localhost:8001 in your browser")
    print("2. Accept the security warning about the self-signed certificate")
    print("3. Then run your frontend application to connect via WSS")
