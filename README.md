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

- WebSocket endpoint: `ws://localhost:8000/ws/chat/`
- REST API endpoint to check server status: `http://localhost:8000/chat/status/`

## Development

To make changes to the backend, edit the Django files in the `/api` directory. For frontend changes, modify the React files in the `/src` directory.
