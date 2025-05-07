import { useState, useEffect, useRef } from "react";
import axios from "axios";

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState(
    "User" + Math.floor(Math.random() * 1000)
  );
  const [connected, setConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check server status first
    checkServerStatus();

    // Connect to WebSocket when component mounts
    connectWebSocket();

    // Cleanup function to close WebSocket when component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Scroll to bottom of messages when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkServerStatus = async () => {
    try {
      const response = await axios.get(
        `http://${window.location.hostname}:8000/chat/status/`
      );
      if (response.data && response.data.status === "online") {
        setServerStatus("online");
      } else {
        setServerStatus("offline");
      }
    } catch (error) {
      console.error("Error checking server status:", error);
      setServerStatus("offline");
    }
  };

  const connectWebSocket = () => {
    // Replace with your Django WebSocket URL
    const wsUrl = `ws://${window.location.hostname}:8001/ws/chat/`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prevMessages) => [...prevMessages, data]);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      // Try to reconnect after a delay
      setTimeout(() => {
        connectWebSocket();
      }, 40000);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      socket.close();
    };

    socketRef.current = socket;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !socketRef.current) return;

    const messageObject = {
      message: message,
      username: username,
    };

    socketRef.current.send(JSON.stringify(messageObject));
    setMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-md mx-auto border rounded-lg shadow-md">
      <div className="p-4 bg-gray-100 border-b">
        <h2 className="text-xl font-semibold">Chat Room</h2>
        <div className="flex justify-between">
          <div
            className={`text-sm ${
              connected ? "text-green-500" : "text-red-500"
            }`}
          >
            WebSocket: {connected ? "Connected" : "Disconnected"}
          </div>
          <div
            className={`text-sm ${
              serverStatus === "online"
                ? "text-green-500"
                : serverStatus === "checking"
                ? "text-yellow-500"
                : "text-red-500"
            }`}
          >
            Server: {serverStatus === "checking" ? "Checking..." : serverStatus}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8">No messages yet</div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded-lg ${
                msg.username === username
                  ? "bg-blue-100 ml-8 text-right"
                  : "bg-gray-100 mr-8"
              }`}
            >
              <div className="font-semibold text-sm">{msg.username}</div>
              <div>{msg.message}</div>
              <div className="text-xs text-gray-500">{msg.timestamp}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="mb-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Your name"
          />
        </div>
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-2 border rounded-l"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!connected}
            className={`px-4 py-2 font-bold text-white rounded-r ${
              connected ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
