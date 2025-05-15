"""
Testing script for secure WebSocket (WSS) connection.
This will attempt to connect to the WebSocket server and send/receive messages.
"""
import asyncio
import websockets
import json
import ssl
import pathlib
import os
from datetime import datetime

# Get the base directory and cert file paths
BASE_DIR = pathlib.Path(__file__).resolve().parent
SSL_CERT = os.path.join(BASE_DIR, "ssl", "cert.pem")

async def test_connection():
    """Test WebSocket connection"""
    uri = "wss://localhost:8001/ws/chat/"
    
    # Create SSL context that trusts our self-signed certificate
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_verify_locations(SSL_CERT)
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE  # Don't verify the certificate (since it's self-signed)
    
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri, ssl=ssl_context) as websocket:
            print(f"Connected successfully to {uri}")
            
            # Send a test message
            message = {
                "username": "Diagnostic Tool",
                "message": "Test message from diagnostic tool"
            }
            
            print(f"Sending message: {message}")
            await websocket.send(json.dumps(message))
            print("Message sent successfully!")
            
            # Wait for a response
            print("Waiting for response...")
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5)
                try:
                    data = json.loads(response)
                    print(f"Received response: {data}")
                except json.JSONDecodeError:
                    print(f"Received raw response: {response}")
            except asyncio.TimeoutError:
                print("No response received within timeout period")
                
            print("Test completed successfully!")
            
    except Exception as e:
        print(f"Connection failed: {e}")
        print("\nPossible solutions:")
        print("1. Make sure the Django server is running with SSL support")
        print("   - Run 'python run.py' in one terminal")
        print("2. Make sure you've visited https://localhost:8001 in your browser")
        print("   - Open it now and accept the certificate")
        print("3. Check if there's a firewall blocking the connection")
        print("4. Verify the WebSocket path in chat/routing.py is correct")
        print("5. Run the diagnostic script: python diagnose.py")

if __name__ == "__main__":
    print("=== WebSocket Connection Test ===")
    asyncio.run(test_connection())
    print("\nIf you're having issues, you can run the diagnostic tool:")
    print("python diagnose.py")
