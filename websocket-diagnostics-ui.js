// WebSocketNetworkTraceVisualizer.js - Copy this to your project

class WebSocketNetworkTraceVisualizer {
  constructor(traceData) {
    this.traceData = traceData;
    this.expandedSteps = {};
  }

  // Render the network trace visualization as HTML
  render() {
    if (!this.traceData || this.traceData.length === 0) {
      return '<div class="text-gray-500 italic">No network trace data available</div>';
    }

    // Calculate the overall connection status
    const overallStatus = this.traceData.some((step) => step.status === "error")
      ? "error"
      : this.traceData.every((step) => step.status === "success")
      ? "success"
      : "pending";

    let html = `
            <div class="bg-white rounded border p-3">
                <h3 class="font-bold text-sm mb-2">WebSocket Connection Trace</h3>
                
                <!-- Overall status indicator -->
                <div class="${
                  overallStatus === "success"
                    ? "bg-green-100 text-green-800"
                    : overallStatus === "error"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                } text-xs mb-3 p-1 rounded">
                    Status: ${
                      overallStatus === "success"
                        ? "Connection Successful"
                        : overallStatus === "error"
                        ? "Connection Failed"
                        : "Connection In Progress"
                    }
                </div>
                
                <!-- Timeline visualization -->
                <div class="relative">`;

    // Generate each step in the trace
    this.traceData.forEach((step, index) => {
      const stepStatus = this.getStepStatus(step);
      const isExpanded = this.expandedSteps[step.id] || false;

      html += `
                <div class="mb-3" id="trace-step-${step.id}">
                    <!-- Connection line -->
                    ${
                      index < this.traceData.length - 1
                        ? `
                    <div class="${
                      stepStatus === "success"
                        ? "bg-green-400"
                        : stepStatus === "error"
                        ? "bg-red-400"
                        : stepStatus === "skipped"
                        ? "bg-gray-300"
                        : "bg-blue-400"
                    } absolute left-[10px] top-[20px] bottom-0 w-[2px] h-[calc(100%-30px)]"></div>
                    `
                        : ""
                    }
                    
                    <!-- Step indicator -->
                    <div class="flex items-start">
                        <div class="${
                          stepStatus === "success"
                            ? "bg-green-500"
                            : stepStatus === "error"
                            ? "bg-red-500"
                            : stepStatus === "skipped"
                            ? "bg-gray-400"
                            : "bg-blue-500"
                        } flex-shrink-0 w-5 h-5 rounded-full mr-3 flex items-center justify-center">
                            ${
                              stepStatus === "success"
                                ? '<span class="text-white text-xs">✓</span>'
                                : ""
                            }
                            ${
                              stepStatus === "error"
                                ? '<span class="text-white text-xs">✗</span>'
                                : ""
                            }
                            ${
                              stepStatus === "pending"
                                ? '<span class="text-white text-xs">•</span>'
                                : ""
                            }
                            ${
                              stepStatus === "skipped"
                                ? '<span class="text-white text-xs">-</span>'
                                : ""
                            }
                        </div>
                        
                        <div class="flex-grow">
                            <!-- Step header -->
                            <div class="${
                              stepStatus === "skipped"
                                ? "text-gray-500"
                                : "text-gray-800"
                            } flex justify-between items-start text-xs font-medium cursor-pointer"
                               onclick="toggleTraceStep('${step.id}')">
                                <div class="flex items-center">
                                    <span>${step.name}</span>
                                    ${
                                      step.duration
                                        ? `<span class="ml-2 text-gray-500">(${step.duration}ms)</span>`
                                        : ""
                                    }
                                </div>
                                <button class="ml-2 text-gray-500 hover:text-gray-700">
                                    ${isExpanded ? "▼" : "▶"}
                                </button>
                            </div>
                            
                            <!-- Step details (expanded) -->
                            <div id="trace-step-details-${
                              step.id
                            }" class="mt-2 ml-2 text-xs ${
        isExpanded ? "" : "hidden"
      }">
                                ${
                                  step.details
                                    ? `<div class="mb-2">${step.details}</div>`
                                    : ""
                                }
                                
                                ${
                                  step.error
                                    ? `
                                <div class="text-red-600 bg-red-50 p-1 rounded mt-1">
                                    Error: ${step.error}
                                </div>
                                `
                                    : ""
                                }
                                
                                ${
                                  step.recommendation
                                    ? `
                                <div class="text-blue-600 bg-blue-50 p-1 rounded mt-1">
                                    Recommendation: ${step.recommendation}
                                </div>
                                `
                                    : ""
                                }
                                
                                ${
                                  step.data
                                    ? `
                                <details class="mt-1">
                                    <summary class="cursor-pointer text-gray-600">Technical Data</summary>
                                    <pre class="mt-1 p-1 bg-gray-100 rounded overflow-x-auto max-h-32 overflow-y-auto">
${JSON.stringify(step.data, null, 2)}
                                    </pre>
                                </details>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>`;
    });

    html += `
                </div>
            </div>`;

    return html;
  }

  // Determine the status of each step
  getStepStatus(step) {
    if (step.status === "success") return "success";
    if (step.status === "error") return "error";
    if (step.status === "pending") return "pending";
    if (step.status === "skipped") return "skipped";
    return "unknown";
  }

  // Toggle a step's expansion state
  toggleStep(stepId) {
    this.expandedSteps[stepId] = !this.expandedSteps[stepId];
  }
}

// WebSocketSecurityAnalyzer.js - Copy this to your project

class WebSocketSecurityAnalyzer {
  constructor(diagnosticResults) {
    this.diagnosticResults = diagnosticResults;
    this.showAdvanced = false;
  }

  // Render the security analysis as HTML
  render() {
    if (!this.diagnosticResults) {
      return "";
    }

    // Extract relevant security data from diagnostic results
    const {
      browser = {},
      connection = {},
      tests = {},
    } = this.diagnosticResults || {};

    // Build a list of security issues
    const securityIssues = this.analyzeSecurityIssues(
      browser,
      connection,
      tests
    );

    let html = `
        <div class="bg-white rounded border p-3">
            <h3 class="font-bold text-sm mb-2">WebSocket Security Analysis</h3>`;

    // Render each security issue
    securityIssues.forEach((issue, index) => {
      html += `
            <div class="${
              issue.severity === "high"
                ? "bg-red-50 border-l-4 border-red-500"
                : issue.severity === "medium"
                ? "bg-yellow-50 border-l-4 border-yellow-500"
                : issue.severity === "low"
                ? "bg-blue-50 border-l-4 border-blue-500"
                : "bg-green-50 border-l-4 border-green-500"
            } mb-3 p-2 rounded text-xs">
                <div class="font-semibold mb-1">${issue.title}</div>
                <div class="mb-1">${issue.description}</div>
                <div class="font-medium">Recommendation: ${
                  issue.recommendation
                }</div>
                
                ${
                  this.showAdvanced
                    ? `
                <div class="mt-2 text-gray-600 bg-gray-50 p-1 rounded">
                    <strong>Details:</strong> ${issue.details}
                </div>
                `
                    : ""
                }
            </div>`;
    });

    html += `
            <button 
                onclick="toggleSecurityDetails()"
                class="text-xs px-2 py-1 text-blue-600 hover:text-blue-800">
                ${
                  this.showAdvanced
                    ? "Hide Technical Details"
                    : "Show Technical Details"
                }
            </button>
        </div>`;

    return html;
  }

  // Analyze diagnostic results for security issues
  analyzeSecurityIssues(browser, connection, tests) {
    const securityIssues = [];

    // Check for mixed content issues (HTTPS page with WS instead of WSS)
    if (
      connection.protocol === "https:" &&
      connection.wsUrl &&
      connection.wsUrl.startsWith("ws://")
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
        tests.serverDiagnostics.data?.server_diagnostics?.websocket_config ||
        {};

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

    return securityIssues;
  }

  // Toggle advanced details
  toggleAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }
}
