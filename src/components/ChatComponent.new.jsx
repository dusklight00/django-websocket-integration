import { useState, useEffect, useRef } from "react";

const ChatComponent = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState(
    "User" + Math.floor(Math.random() * 1000)
  );
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Simple initialization
    console.log("Chat component mounted");

    return () => {
      console.log("Chat component unmounted");
    };
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border rounded-lg shadow-md">
      <div className="p-4 bg-gray-100 border-b">
        <h2 className="text-xl font-semibold">Chat Room</h2>
        <div className="text-sm text-gray-500">
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="mb-2">
              <span className="font-bold">{msg.username}:</span> {msg.message}
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-l"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-r">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
