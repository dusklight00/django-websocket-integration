import { useState } from "react";
import ChatComponent from "./components/ChatComponent";

function App() {
  return (
    <div className="container mx-auto p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold">Django WebSocket Chat</h1>
        <p className="text-gray-600">
          Real-time chat using Django Channels and React
        </p>
      </header>

      <main>
        <ChatComponent />
      </main>

      <footer className="text-center mt-8 text-sm text-gray-500">
        <p>
          Django WebSocket Integration Demo &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default App;
