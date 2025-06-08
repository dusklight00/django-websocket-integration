import React, { useState } from "react";

/**
 * A component that visualizes the network trace of WebSocket connections
 * to help users understand the connection flow and identify where issues occur.
 */
const WebSocketNetworkTraceVisualizer = ({ traceData, className = "" }) => {
  const [expandedSteps, setExpandedSteps] = useState({});

  if (!traceData || traceData.length === 0) {
    return (
      <div className={`text-gray-500 italic ${className}`}>
        No network trace data available
      </div>
    );
  }

  const toggleStepExpansion = (stepId) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  // Determine the status of each step
  const getStepStatus = (step) => {
    if (step.status === "success") return "success";
    if (step.status === "error") return "error";
    if (step.status === "pending") return "pending";
    if (step.status === "skipped") return "skipped";
    return "unknown";
  };

  // Calculate the overall connection status
  const overallStatus = traceData.some((step) => step.status === "error")
    ? "error"
    : traceData.every((step) => step.status === "success")
    ? "success"
    : "pending";

  return (
    <div className={`bg-white rounded border p-3 ${className}`}>
      <h3 className="font-bold text-sm mb-2">WebSocket Connection Trace</h3>

      {/* Overall status indicator */}
      <div
        className={`text-xs mb-3 p-1 rounded ${
          overallStatus === "success"
            ? "bg-green-100 text-green-800"
            : overallStatus === "error"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        Status:{" "}
        {overallStatus === "success"
          ? "Connection Successful"
          : overallStatus === "error"
          ? "Connection Failed"
          : "Connection In Progress"}
      </div>

      {/* Timeline visualization */}
      <div className="relative">
        {traceData.map((step, index) => {
          const stepStatus = getStepStatus(step);
          const isExpanded = expandedSteps[step.id];

          return (
            <div key={step.id} className="mb-3">
              {/* Connection line */}
              {index < traceData.length - 1 && (
                <div
                  className={`absolute left-[10px] top-[20px] bottom-0 w-[2px] h-[calc(100%-30px)] ${
                    stepStatus === "success"
                      ? "bg-green-400"
                      : stepStatus === "error"
                      ? "bg-red-400"
                      : stepStatus === "skipped"
                      ? "bg-gray-300"
                      : "bg-blue-400"
                  }`}
                ></div>
              )}

              {/* Step indicator */}
              <div className="flex items-start">
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                    stepStatus === "success"
                      ? "bg-green-500"
                      : stepStatus === "error"
                      ? "bg-red-500"
                      : stepStatus === "skipped"
                      ? "bg-gray-400"
                      : "bg-blue-500"
                  }`}
                >
                  {stepStatus === "success" && (
                    <span className="text-white text-xs">✓</span>
                  )}
                  {stepStatus === "error" && (
                    <span className="text-white text-xs">✗</span>
                  )}
                  {stepStatus === "pending" && (
                    <span className="text-white text-xs">•</span>
                  )}
                  {stepStatus === "skipped" && (
                    <span className="text-white text-xs">-</span>
                  )}
                </div>

                <div className="flex-grow">
                  {/* Step header */}
                  <div
                    className={`flex justify-between items-start text-xs font-medium cursor-pointer ${
                      stepStatus === "skipped"
                        ? "text-gray-500"
                        : "text-gray-800"
                    }`}
                    onClick={() => toggleStepExpansion(step.id)}
                  >
                    <div className="flex items-center">
                      <span>{step.name}</span>
                      {step.duration && (
                        <span className="ml-2 text-gray-500">
                          ({step.duration}ms)
                        </span>
                      )}
                    </div>
                    <button className="ml-2 text-gray-500 hover:text-gray-700">
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  </div>

                  {/* Step details (expanded) */}
                  {isExpanded && (
                    <div className="mt-2 ml-2 text-xs">
                      {step.details && (
                        <div className="mb-2">{step.details}</div>
                      )}

                      {step.error && (
                        <div className="text-red-600 bg-red-50 p-1 rounded mt-1">
                          Error: {step.error}
                        </div>
                      )}

                      {step.recommendation && (
                        <div className="text-blue-600 bg-blue-50 p-1 rounded mt-1">
                          Recommendation: {step.recommendation}
                        </div>
                      )}

                      {step.data && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-gray-600">
                            Technical Data
                          </summary>
                          <pre className="mt-1 p-1 bg-gray-100 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {JSON.stringify(step.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WebSocketNetworkTraceVisualizer;
