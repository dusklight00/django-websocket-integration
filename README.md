# Django WebSocket Chat Application

A real-time chat application built with Django Channels for WebSockets backend and React for the frontend, with secure WebSocket (WSS) support.

## Features

- Real-time messaging using secure WebSockets (WSS)
- User identification
- Message timestamps
- Automatic reconnection if connection drops
- Server status monitoring

## Setup

### Backend (Django)

1. Navigate to the API directory:

   ```
   cd api
   ```

2. Run the setup script to install dependencies, generate SSL certificates, and run migrations:

   ```
   python setup.py
   ```

3. Start the Django server with SSL support for secure WebSockets (either method works):
   ```
   # Using the run.py script
   python run.py
   
   # OR using the Django management command
   python manage.py runserver_ssl
   ```

   This will start the server on port 8001 with SSL enabled.

### Frontend (React)

1. From the project root, install the required npm packages:

   ```
   npm install
   ```

2. Start the React development server:
   ```
   npm run dev
   ```

## Usage

1. Open your browser to the React development server URL (typically http://localhost:5173/)
2. Enter your username (default is randomly generated)
3. Type a message and click "Send"
4. Messages will appear in the chat window in real-time for all connected users

## Project Structure

- `/api` - Django backend with WebSocket implementation
  - `/chat` - Chat application with WebSocket consumer
- `/src` - React frontend
  - `/components` - React components including the ChatComponent

## WebSocket Details

- Secure WebSocket endpoint: `wss://localhost:8001/ws/chat/`
- REST API endpoint to check server status: `https://localhost:8001/chat/status/`

### SSL Certificate

The application uses a self-signed certificate for development. When connecting to the WebSocket endpoint, you may need to:

1. Open https://localhost:8001 in your browser first
2. Accept the self-signed certificate security warning
3. Then your frontend application will be able to connect via WSS

## Development

To make changes to the backend, edit the Django files in the `/api` directory. For frontend changes, modify the React files in the `/src` directory.

## Troubleshooting

If you encounter issues with the WebSocket connection:

1. **SSL Certificate Issues**: 
   - Visit https://localhost:8001 directly in your browser
   - Accept the security warning about the self-signed certificate
   - Then try connecting with your application again

2. **Connection Testing**:
   - Visit https://localhost:8001/chat/ssl-test/ to verify SSL is working
   - Visit https://localhost:8001/chat/test/ to test WebSocket connection
   - Run `python diagnose.py` in the api directory to diagnose issues
   - Run `python test_websocket.py` to test WebSocket from the command line

3. **Common Problems**:
   - **Mixed Content**: If your frontend is served over HTTP but tries to connect to WSS, browsers will block it
   - **Path Mismatch**: Ensure you're connecting to `/ws/chat/` path, not `/wss/chat/`
   - **Port in Use**: Make sure port 8001 isn't already in use by another application
   - **Firewall/Antivirus**: Check if your firewall or antivirus is blocking the connection
