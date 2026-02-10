/**
 * Cloudflare Workers entry point for Atera MCP Server
 *
 * This module exports a Cloudflare Workers-compatible fetch handler
 * that proxies MCP requests to the HTTP transport.
 */

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          transport: "http",
          authMode: "gateway",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // MCP endpoint placeholder
    if (url.pathname === "/mcp") {
      // In a full implementation, this would wire up the MCP SDK's
      // StreamableHTTPServerTransport to the Workers request/response.
      // For now, return a 501 indicating the worker stub is deployed
      // but MCP SDK Workers support is pending.
      return new Response(
        JSON.stringify({
          error: "Not implemented",
          message:
            "Cloudflare Workers MCP transport is a deployment stub. " +
            "Use the Docker-based HTTP transport for production.",
        }),
        {
          status: 501,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 404 for everything else
    return new Response(
      JSON.stringify({
        error: "Not found",
        endpoints: ["/mcp", "/health"],
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};
