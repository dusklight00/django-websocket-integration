import React, { useState } from "react";

/**
 * A component that analyzes WebSocket security configurations and provides
 * guidance on fixing security-related issues.
 */
const WebSocketSecurityAnalyzer = ({ diagnosticResults, className = "" }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!diagnosticResults) {
    return null;
  }

  // Extract relevant security data from diagnostic results
  const {
    browser = {},
    connection = {},
    tests = {},
    diagnosis = {},
  } = diagnosticResults || {};

  // Build a list of security issues
  const securityIssues = [];

  // Check for mixed content issues (HTTPS page with WS instead of WSS)
  if (
    connection.protocol === "https:" &&
    connection.expectedWsUrl.startsWith("ws://")
  ) {
    securityIssues.push({
      severity: "high",
      title: "Mixed Content Security Issue",
      description:
        "Your page is loaded over HTTPS, but the WebSocket connection uses the insecure ws:// protocol.",
      recommendation:
        "Use wss:// (WebSocket Secure) protocol instead of ws:// when your site is served over HTTPS.",
      details:
        "Modern browsers block mixed content by default. When a page is loaded over HTTPS, all WebSocket connections must also use encryption (wss://).",
    });
  }

  // Check for secure context issues
  if (browser.isSecureContext === false) {
    securityIssues.push({
      severity: "medium",
      title: "Not Running in Secure Context",
      description: "Your application is not running in a secure context.",
      recommendation:
        "Deploy your application with HTTPS to enable a secure context.",
      details:
        "Some Web APIs are only available in secure contexts. A secure context is provided when the site is served over HTTPS or from localhost.",
    });
  }

  // Check for CORS issues
  if (tests.corsTest && !tests.corsTest.success) {
    securityIssues.push({
      severity: "high",
      title: "CORS Configuration Issue",
      description:
        "Cross-Origin Resource Sharing (CORS) is not properly configured.",
      recommendation:
        "Update your server's CORS configuration to allow WebSocket connections from this origin.",
      details:
        "The browser's same-origin policy prevents WebSocket connections to different origins unless CORS headers are properly set.",
    });
  }

  // Check for Content-Security-Policy restrictions
  if (tests.wsConstructorTest && !tests.wsConstructorTest.success) {
    securityIssues.push({
      severity: "medium",
      title: "Possible Content-Security-Policy Restriction",
      description:
        "Content Security Policy may be blocking WebSocket connections.",
      recommendation:
        "Check if a CSP header is restricting WebSocket connections and update it to include your WebSocket server.",
      details:
        "A restrictive Content-Security-Policy can block WebSocket connections. Ensure your CSP includes connect-src directives for your WebSocket URLs.",
    });
  }

  // Check if server diagnostic data reveals security issues
  if (tests.serverDiagnostics?.success) {
    const serverConfig =
      tests.serverDiagnostics.data?.server_diagnostics?.websocket_config || {};

    // Check if CORS origins are configured
    if (
      !serverConfig.CORS_ALLOWED_ORIGINS ||
      serverConfig.CORS_ALLOWED_ORIGINS.length === 0
    ) {
      securityIssues.push({
        severity: "medium",
        title: "Missing CORS Configuration",
        description: "No CORS allowed origins are configured on the server.",
        recommendation:
          "Configure CORS_ALLOWED_ORIGINS in your Django settings.",
        details:
          "Without proper CORS configuration, browsers will block cross-origin WebSocket connections.",
      });
    }

    // Check if allowed hosts are too permissive
    if (
      serverConfig.ALLOWED_HOSTS &&
      serverConfig.ALLOWED_HOSTS.includes("*")
    ) {
      securityIssues.push({
        severity: "low",
        title: "Overly Permissive Allowed Hosts",
        description:
          'Your Django ALLOWED_HOSTS setting includes "*", which is not recommended for production.',
        recommendation:
          "Configure specific hostnames in ALLOWED_HOSTS for production environments.",
        details:
          'Using "*" in ALLOWED_HOSTS can make your application vulnerable to HTTP Host header attacks.',
      });
    }
  }

  // If no security issues were found, add a positive message
  if (securityIssues.length === 0) {
    securityIssues.push({
      severity: "none",
      title: "No Security Issues Detected",
      description: "No obvious WebSocket security issues were detected.",
      recommendation:
        "Continue monitoring your application for security issues.",
      details:
        "While no issues were detected, it's always a good practice to regularly review security settings.",
    });
  }

  // Render the component
  return (
    <div className={`bg-white rounded border p-3 ${className}`}>
      <h3 className="font-bold text-sm mb-2">WebSocket Security Analysis</h3>

      {securityIssues.map((issue, index) => (
        <div
          key={index}
          className={`mb-3 p-2 rounded text-xs ${
            issue.severity === "high"
              ? "bg-red-50 border-l-4 border-red-500"
              : issue.severity === "medium"
              ? "bg-yellow-50 border-l-4 border-yellow-500"
              : issue.severity === "low"
              ? "bg-blue-50 border-l-4 border-blue-500"
              : "bg-green-50 border-l-4 border-green-500"
          }`}
        >
          <div className="font-semibold mb-1">{issue.title}</div>
          <div className="mb-1">{issue.description}</div>
          <div className="font-medium">
            Recommendation: {issue.recommendation}
          </div>

          {showAdvanced && (
            <div className="mt-2 text-gray-600 bg-gray-50 p-1 rounded">
              <strong>Details:</strong> {issue.details}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800"
      >
        {showAdvanced ? "Hide Technical Details" : "Show Technical Details"}
      </button>
    </div>
  );
};

export default WebSocketSecurityAnalyzer;
