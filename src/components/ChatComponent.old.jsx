import { useState, useEffect, useRef } from "react";
import axios from "axios";

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");  const [username, setUsername] = useState(
    "User" + Math.floor(Math.random() * 1000)
  );
  const [connected, setConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");
  const [connectionError, setConnectionError] = useState(null);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const connectionTimeoutRef = useRef(null);

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
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
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
        setConnectionError("API server is online but reporting as not ready");
      }
    } catch (error) {
      console.error("Error checking server status:", error);
      setServerStatus("offline");
      setConnectionError(`API server unreachable: ${error.message}`);
    }
  };

  const diagnoseConnectionIssue = (error) => {
    // Check if this is a browser security error
    if (error instanceof DOMException) {
      if (error.name === "SecurityError") {
        return "Browser blocked the connection due to mixed content or security policy.";
      }
      if (error.name === "NetworkError") {
        return "Network error: Check if CORS is properly configured on the server or if you're using wss:// for HTTPS sites.";
      }
    }

    // Check for common connection error patterns
    const errorString = error.toString().toLowerCase();
    
    if (errorString.includes("blocked by cors policy")) {
      return "Connection blocked by CORS policy. Check server headers.";
    } else if (errorString.includes("connection refused")) {
      return "Server refused the connection. Check if the WebSocket server is running on the correct port.";
    } else if (errorString.includes("timeout")) {
      return "Connection timed out. Server might be slow or unavailable.";
    } else if (errorString.includes("certificate")) {
      return "SSL/TLS certificate issue. Make sure the certificate is valid or use wss:// protocol.";
    } else if (window.isSecureContext && window.location.protocol === "https:" && !window.location.href.startsWith("wss://")) {
      return "Attempting to connect to ws:// from https:// page. Browsers block this - use wss:// instead.";
    }

    // Try to detect if it's a browser issue
    try {
      const isFirewallOrProxy = !navigator.onLine || 
                               /failed to construct/i.test(errorString);
      if (isFirewallOrProxy) {
        return "Connection may be blocked by a firewall, proxy, or browser extension.";
      }
    } catch (e) {
      // Ignore errors in detection logic
    }

    // Default fallback
    return `Unknown connection error: ${error.message || error}`;
  };

  const connectWebSocket = () => {
    // Reset any previous error
    setConnectionError(null);

    // Replace with your Django WebSocket URL
    const wsUrl = `ws://${window.location.hostname}:8001/ws/chat/`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      // Set a connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        // If we're still not connected after 5 seconds, consider it a timeout
        if (socket.readyState !== WebSocket.OPEN) {
          setConnectionError("Connection timed out. Server might be unreachable.");
          socket.close();
        }
      }, 5000);

      socket.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
        setConnectionError(null);
        clearTimeout(connectionTimeoutRef.current);
      };

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMessages((prevMessages) => [...prevMessages, data]);
      };

      socket.onclose = (event) => {
        console.log("WebSocket disconnected", event);
        setConnected(false);
        
        // Check for specific close codes
        if (event.code) {
          let errorMessage;
          switch (event.code) {
            case 1000:
              errorMessage = "Normal closure";
              break;
            case 1001:
              errorMessage = "Server going down or browser navigating away";
              break;
            case 1002:
              errorMessage = "Protocol error";
              break;
            case 1003:
              errorMessage = "Unsupported data";
              break;
            case 1005:
              errorMessage = "No status code present";
              break;
            case 1006:
              errorMessage = "Abnormal closure - server might be down";
              break;
            case 1007:
              errorMessage = "Invalid frame payload data";
              break;
            case 1008:
              errorMessage = "Policy violation";
              break;
            case 1009:
              errorMessage = "Message too big";
              break;
            case 1010:
              errorMessage = "Missing extension";
              break;
            case 1011:
              errorMessage = "Internal server error";
              break;
            case 1012:
              errorMessage = "Service restart";
              break;
            case 1013:
              errorMessage = "Try again later";
              break;
            case 1014:
              errorMessage = "Bad gateway";
              break;
            case 1015:
              errorMessage = "TLS handshake error";
              break;
            default:
              errorMessage = `Unknown close code: ${event.code}`;
          }
          setConnectionError(`Connection closed: ${errorMessage}`);
        }
        
        // Try to reconnect after a delay
        setTimeout(() => {
          connectWebSocket();
        }, 40000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        const diagnosis = diagnoseConnectionIssue(err);
        setConnectionError(diagnosis);
        socket.close();
      };

      socketRef.current = socket;
    } catch (err) {
      // Handle errors that occur during WebSocket construction (rare, but possible)
      console.error("Error creating WebSocket:", err);
      const diagnosis = diagnoseConnectionIssue(err);
      setConnectionError(diagnosis);
    }
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

  // Manual reconnect function
  const handleReconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    connectWebSocket();
  };
  
  // Connection diagnostic tool
  const runConnectionDiagnostics = async () => {
    setRunningDiagnostics(true);
    setDiagnosticResults(null);
    
    const results = {
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        isSecureContext: window.isSecureContext,
        onLine: navigator.onLine,
      },
      connection: {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        expectedWsUrl: `ws://${window.location.hostname}:8001/ws/chat/`,
        httpsToWsBlocking: window.location.protocol === 'https:' && !window.location.href.startsWith('wss://'),
      },
      tests: {
        serverStatusCheck: null,
        serverDiagnostics: null,
        wsConstructorTest: null,
        corsTest: null,
        connectionAttempt: null,
        webSocketHeaders: null
      }
    };
    
    // Test 1: API Server Status
    try {
      const response = await axios.get(
        `http://${window.location.hostname}:8000/chat/status/`,
        { timeout: 5000 }
      );
      results.tests.serverStatusCheck = {
        success: response.status === 200,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      results.tests.serverStatusCheck = {
        success: false,
        error: error.message,
        type: error.name
      };
    }
    
    // Test 1B: Server-side Diagnostics
    try {
      const response = await axios.get(
        `http://${window.location.hostname}:8000/chat/diagnostics/`,
        { timeout: 10000 }
      );
      results.tests.serverDiagnostics = {
        success: response.status === 200,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      results.tests.serverDiagnostics = {
        success: false,
        error: error.message,
        type: error.name
      };
    }
    
    // Test 2: WebSocket Handshake Debug (uses fetch to see the headers)
    try {
      // We're using a technique called HTTP/1.1 Connection Upgrade to debug WebSocket handshakes
      const headers = {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==', // Base64 for testing
        'Sec-WebSocket-Version': '13'
      };
      
      const wsDebugResponse = await fetch(`http://${window.location.hostname}:8001/ws/chat/`, {
        method: 'GET',
        headers: headers,
      }).catch(err => {
        return { 
          type: 'error',
          status: 'network-error', 
          statusText: err.message 
        };
      });
      
      if (wsDebugResponse.type === 'error') {
        results.tests.webSocketHeaders = {
          success: false,
          error: wsDebugResponse.statusText
        };
      } else {
        results.tests.webSocketHeaders = {
          success: wsDebugResponse.status === 101, // 101 Switching Protocols
          status: wsDebugResponse.status,
          statusText: wsDebugResponse.statusText,
          headers: Object.fromEntries([...wsDebugResponse.headers])
        };
      }
    } catch (error) {
      results.tests.webSocketHeaders = {
        success: false,
        error: error.message
      };
    }
      // Test 2: WebSocket Constructor Test
    try {
      const testWs = new WebSocket(`ws://${window.location.hostname}:8001/ws/chat/`);
      results.tests.wsConstructorTest = {
        success: true,
        message: "WebSocket constructor did not throw an error"
      };
      
      // We don't actually want to connect here, just test the constructor
      setTimeout(() => {
        if (testWs && testWs.readyState !== WebSocket.CLOSED) {
          testWs.close();
        }
      }, 100);
    } catch (error) {
      results.tests.wsConstructorTest = {
        success: false,
        error: error.message,
        type: error.name
      };
    }
    
    // Test 3: CORS Test using fetch to see if OPTIONS requests are allowed
    try {
      const response = await fetch(`http://${window.location.hostname}:8001/`, {
        method: 'OPTIONS',
        timeout: 5000
      });
      results.tests.corsTest = {
        success: response.ok,
        status: response.status,
      };
    } catch (error) {
      results.tests.corsTest = {
        success: false,
        error: error.message,
        type: error.name
      };
    }
    
    // Test 4: WebSocket Handshake Debug (uses fetch to see the headers)
    try {
      // We're using a technique called HTTP/1.1 Connection Upgrade to debug WebSocket handshakes
      const headers = {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==', // Base64 for testing
        'Sec-WebSocket-Version': '13'
      };
      
      const wsDebugResponse = await fetch(`http://${window.location.hostname}:8001/ws/chat/`, {
        method: 'GET',
        headers: headers,
      }).catch(err => {
        return { 
          type: 'error',
          status: 'network-error', 
          statusText: err.message 
        };
      });
      
      if (wsDebugResponse.type === 'error') {
        results.tests.webSocketHeaders = {
          success: false,
          error: wsDebugResponse.statusText
        };
      } else {
        results.tests.webSocketHeaders = {
          success: wsDebugResponse.status === 101, // 101 Switching Protocols
          status: wsDebugResponse.status,
          statusText: wsDebugResponse.statusText,
          headers: Object.fromEntries([...wsDebugResponse.headers])
        };
      }
    } catch (error) {
      results.tests.webSocketHeaders = {
        success: false,
        error: error.message
      };
    }
    
    // Test 5: Actual Connection Attempt with Timeout
    try {
      const wsTest = new WebSocket(`ws://${window.location.hostname}:8001/ws/chat/`);
      
      // Promise-based connection test
      const connectionResult = await new Promise((resolve) => {
        // Set timeout for connection
        const timeout = setTimeout(() => {
          resolve({
            success: false,
            error: "Connection attempt timed out after 5 seconds",
            readyState: wsTest.readyState
          });
          wsTest.close();
        }, 5000);
        
        wsTest.onopen = () => {
          clearTimeout(timeout);
          resolve({
            success: true,
            readyState: WebSocket.OPEN,
            message: "Connection successful"
          });
          wsTest.close();
        };
        
        wsTest.onerror = (err) => {
          clearTimeout(timeout);
          resolve({
            success: false,
            error: "Connection error",
            errorEvent: err.type,
            readyState: wsTest.readyState
          });
          wsTest.close();
        };
      });
      
      results.tests.connectionAttempt = connectionResult;
    } catch (error) {
      results.tests.connectionAttempt = {
        success: false,
        error: error.message,
        type: error.name
      };
    }    // Generate a diagnosis based on test results
    const diagnosis = {
      isBrowserBlocking: false,
      isServerError: false,
      specificIssue: null,
      recommendation: null
    };
    
    // Analyze the results
    if (results.connection.httpsToWsBlocking) {
      diagnosis.isBrowserBlocking = true;
      diagnosis.specificIssue = "Mixed content blocking";
      diagnosis.recommendation = "Your page is loaded over HTTPS but trying to connect to WebSocket over insecure ws://. Use wss:// instead or switch to HTTP for testing.";
    } else if (!results.tests.serverStatusCheck.success) {
      diagnosis.isServerError = true;
      diagnosis.specificIssue = "Django API server unreachable";
      diagnosis.recommendation = "Ensure Django development server is running on port 8000 and accessible.";
    } else if (results.tests.serverDiagnostics && results.tests.serverDiagnostics.success) {
      // If we have server diagnostics, check ASGI configuration
      const serverData = results.tests.serverDiagnostics.data.server_diagnostics;
      
      if (serverData.asgi_port_status !== "open") {
        diagnosis.isServerError = true;
        diagnosis.specificIssue = "ASGI server port not open";
        diagnosis.recommendation = `The ASGI server port (${serverData.asgi_port}) is not open. Make sure Daphne/Uvicorn is running on that port.`;
      } else if (!serverData.channel_layer_available) {
        diagnosis.isServerError = true;
        diagnosis.specificIssue = "Channel layer not configured";
        diagnosis.recommendation = "The Django Channels layer is not properly configured. Check your settings.py file.";
      } else if (serverData.channel_layer_test && serverData.channel_layer_test.includes("Error")) {
        diagnosis.isServerError = true;
        diagnosis.specificIssue = "Channel layer not working";
        diagnosis.recommendation = "The Django Channels layer is configured but not working properly. Check Redis/InMemory channel layer configuration.";
      } 
    }
    
    // Check WebSocket handshake specifically
    if (!diagnosis.specificIssue && results.tests.webSocketHeaders) {
      if (!results.tests.webSocketHeaders.success) {
        diagnosis.isServerError = true;
        
        // Check for specific HTTP status codes
        if (results.tests.webSocketHeaders.status === 404) {
          diagnosis.specificIssue = "WebSocket endpoint not found";
          diagnosis.recommendation = "The WebSocket endpoint wasn't found. Check your routing.py configuration and URL path.";
        } else if (results.tests.webSocketHeaders.status === 403) {
          diagnosis.specificIssue = "WebSocket access forbidden";
          diagnosis.recommendation = "Server returned 403 Forbidden. Check CORS settings and authentication requirements.";
        } else if (results.tests.webSocketHeaders.error && results.tests.webSocketHeaders.error.includes("Failed to fetch")) {
          diagnosis.specificIssue = "Network error during WebSocket handshake";
          diagnosis.recommendation = "Browser couldn't establish a connection to the server. Check firewall settings and network connectivity.";
        } else {
          diagnosis.specificIssue = "WebSocket handshake failed";
          diagnosis.recommendation = `The server returned ${results.tests.webSocketHeaders.status} ${results.tests.webSocketHeaders.statusText || ''} instead of 101 Switching Protocols.`;
        }
      }
    }
    
    // If we still don't have a diagnosis, check the actual connection attempt
    if (!diagnosis.specificIssue) {
      if (!results.tests.wsConstructorTest.success) {
        diagnosis.isBrowserBlocking = true;
        diagnosis.specificIssue = "WebSocket constructor blocked";
        diagnosis.recommendation = "Browser security is preventing WebSocket creation. Check Content Security Policy settings.";
      } else if (!results.tests.connectionAttempt.success) {
        if (results.tests.connectionAttempt.readyState === WebSocket.CONNECTING) {
          diagnosis.isServerError = true;
          diagnosis.specificIssue = "Connection timeout";
          diagnosis.recommendation = "WebSocket server is not responding. Ensure Daphne/ASGI server is running on port 8001.";
        } else {
          diagnosis.isServerError = true;
          diagnosis.specificIssue = "Connection error";
          diagnosis.recommendation = "WebSocket connection failed. Check server logs for errors.";
        }
      } else {
        diagnosis.specificIssue = "No issues detected";
        diagnosis.recommendation = "Connection diagnostics passed. If you're still having issues, check server-side logs.";
      }
    }
    
    results.diagnosis = diagnosis;
    setDiagnosticResults(results);
    setRunningDiagnostics(false);
    return results;
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-md mx-auto border rounded-lg shadow-md">      <div className="p-4 bg-gray-100 border-b">
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
        </div>        <div className="mt-2 flex justify-end space-x-2">
          <button
            onClick={() => setDiagnosticResults(null)}
            className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Clear Results
          </button>
          <button
            onClick={runConnectionDiagnostics}
            disabled={runningDiagnostics}
            className={`text-xs px-2 py-1 rounded ${
              runningDiagnostics
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {runningDiagnostics ? "Running Diagnostics..." : "Run Connection Diagnostics"}
          </button>
        </div>
      </div>

      {diagnosticResults && (
        <div className="p-2 border-b bg-gray-50 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Diagnostic Results:</span>
            <button 
              onClick={() => setDiagnosticResults(null)} 
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>          <div className="mt-1 p-2 bg-white rounded border">
            <div className={`font-bold ${diagnosticResults.diagnosis.specificIssue === "No issues detected" ? "text-green-600" : "text-red-600"}`}>
              {diagnosticResults.diagnosis.specificIssue}
            </div>
            <div className="mt-1">{diagnosticResults.diagnosis.recommendation}</div>
            <div className="mt-2">
              <span className="font-semibold">Issue type:</span>{" "}
              {diagnosticResults.diagnosis.isBrowserBlocking
                ? "Browser blocking the connection"
                : diagnosticResults.diagnosis.isServerError
                ? "Server-side error"
                : "No issues detected"}
            </div>
            
            {/* Display recent connection attempts if available */}
            {diagnosticResults.tests.serverDiagnostics?.success && 
             diagnosticResults.tests.serverDiagnostics?.data?.server_diagnostics?.recent_connection_attempts?.length > 0 && (
              <div className="mt-3 border-t pt-2">
                <h4 className="font-semibold text-xs mb-1">Recent Connection Attempts:</h4>
                <div className="overflow-x-auto max-h-32 overflow-y-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-1 border text-left">Time</th>
                        <th className="p-1 border text-left">Status</th>
                        <th className="p-1 border text-left">Client IP</th>
                        <th className="p-1 border text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosticResults.tests.serverDiagnostics.data.server_diagnostics.recent_connection_attempts.map((attempt, index) => (
                        <tr key={index} className={attempt.successful ? "bg-green-50" : "bg-red-50"}>
                          <td className="p-1 border">{new Date(attempt.timestamp).toLocaleTimeString()}</td>
                          <td className="p-1 border">{attempt.successful ? "✓ Success" : "✗ Failed"}</td>
                          <td className="p-1 border">{attempt.client_ip}</td>
                          <td className="p-1 border overflow-hidden text-ellipsis" style={{maxWidth: "150px"}}>
                            {attempt.error_message || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-500">Technical Details</summary>
              <pre className="mt-1 p-2 bg-gray-100 rounded overflow-x-auto text-[10px]">
                {JSON.stringify(diagnosticResults, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      <div className={`p-2 text-center ${connected ? 'bg-green-100' : 'bg-red-100'}`}>
        {connected ? (
          <span className="text-green-700">Connected</span>
        ) : (
          <div>
            <span className="text-red-700">Disconnected</span>
            {connectionError && (
              <div className="text-xs mt-1 text-red-600 bg-red-50 p-1 rounded">
                {connectionError}
              </div>
            )}
            <button 
              onClick={handleReconnect}
              className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Reconnect
            </button>
          </div>
        )}
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
