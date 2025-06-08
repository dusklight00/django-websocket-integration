# Django WebSocket Chat Application

A real-time chat application built with Django Channels for WebSockets backend and React for the frontend.

## Features

- Real-time messaging using WebSockets
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

2. Make sure you have the required dependencies:

   ```
   pip install channels daphne django-cors-headers
   ```

3. Run the migrations:

   ```
   python manage.py migrate
   ```

4. Start the Django development server:
   ```
   python manage.py runserver
   ```

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

- WebSocket endpoint: `ws://localhost:8001/ws/chat/`
- REST API endpoint to check server status: `http://localhost:8000/chat/status/`
- WebSocket diagnostics endpoint: `http://localhost:8000/chat/diagnostics/`

## WebSocket Connection Diagnostics

The application includes a comprehensive diagnostic system to help troubleshoot WebSocket connection issues. This is especially useful when determining if connection problems are caused by browser security restrictions or server-side configuration issues.

### Using the Frontend Diagnostic Tool

1. In the chat interface, look for the "Run Connection Diagnostics" button at the top of the chat window
2. Click the button to start the diagnostics process
3. The tool will run several tests and display results including:
   - Browser environment information
   - API server connectivity
   - WebSocket server connectivity
   - Connection attempt logs
   - Specific error diagnosis

### Standalone Diagnostic Tool

For more detailed diagnostics, especially when the React app might not be functioning, use the standalone HTML diagnostic tool:

1. Open `websocket-diagnostics.html` in your web browser
2. Configure the connection settings (host, ports, paths) as needed
3. Click "Run Diagnostics" to perform a comprehensive connection test
4. Review the results and follow the recommendations

This standalone tool is particularly useful for:

- Testing WebSocket connections from different browsers
- Diagnosing issues when the main app isn't working
- Checking if specific network configurations are blocking WebSockets

### Common WebSocket Issues and Solutions

#### Browser Blocking the Connection

- **Mixed Content Blocking**: If your site is served over HTTPS but you're using ws:// instead of wss://, browsers will block the connection. Use wss:// for secure sites.
- **Content Security Policy (CSP)**: Check if your site has a CSP that restricts WebSocket connections.
- **Firewall or Proxy**: Corporate firewalls and proxies may block WebSocket connections.

#### Server-Side Issues

- **ASGI Server Not Running**: Make sure Daphne or another ASGI server is running on the correct port (default: 8001).
- **Channel Layer Not Configured**: Ensure Redis or the in-memory channel layer is properly configured in settings.py.
- **Routing Configuration**: Verify the WebSocket URL patterns in routing.py are correct.
- **CORS Configuration**: Ensure CORS headers are properly set up if connecting from a different domain.

### Server-Side Diagnostics

The application logs all WebSocket connection attempts to the database, including:

- Client IP address
- User agent
- Connection success/failure
- Error messages

This information can be viewed in:

1. The Django admin interface under "Connection Attempts"
2. The frontend diagnostic tool's "Recent Connection Attempts" section
3. The `/chat/diagnostics/` API endpoint

## Enhanced WebSocket Diagnostics

This application includes advanced diagnostic tools for identifying and resolving WebSocket connection issues:

### Network Trace Visualization

The network trace visualization provides a step-by-step view of the WebSocket connection process, making it easy to pinpoint where failures occur:

- Browser WebSocket Support check
- Django API Server availability
- WebSocket (ASGI) Server status
- CORS configuration verification
- WebSocket constructor test
- WebSocket handshake analysis
- Connection establishment monitoring
- Server-side connection verification

Each step includes detailed timing, status, and error information when applicable.

### WebSocket Security Analysis

The security analyzer identifies potential security issues that might be preventing WebSocket connections:

- Mixed content detection (when using HTTPS with insecure WebSockets)
- Secure context verification
- CORS configuration analysis
- Content-Security-Policy restrictions detection
- Server-side security configuration assessment

Each security issue is categorized by severity and includes specific recommendations for resolution.

### Detailed Connection Statistics

The diagnostic system tracks and displays comprehensive connection statistics:

- Total connection attempts
- Success/failure rates
- Average connection duration
- Most common error messages
- Connection stage tracking (pre-handshake, handshake, connected, disconnected)
- Connection duration metrics

### Server-Side Diagnostics

The server includes enhanced diagnostics middleware that provides:

- Detailed logging of WebSocket connection attempts at all stages
- Connection headers and parameters tracking
- Performance metrics for connections
- Close code tracking for proper error diagnosis
- Path and stage specific monitoring

### Using the Diagnostic Tools

1. Click "Run Connection Diagnostics" in the chat interface
2. Review the summary diagnosis at the top
3. For detailed analysis:

   - Examine the Network Trace visualization to see where the connection fails
   - Check the Security Analysis for potential security blockers
   - Review Connection Statistics to identify patterns in connection failures
   - Look at Recent Connection Attempts to see server-side logs

4. Toggle between Compact and Detailed views depending on how much information you need

For persistent or complex issues, use the standalone diagnostic tool in `websocket-diagnostics.html`.

## Development

To make changes to the backend, edit the Django files in the `/api` directory. For frontend changes, modify the React files in the `/src` directory.
