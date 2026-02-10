/**
 * HTTP Transport Tests
 *
 * Tests for the HTTP server endpoints: /health, /mcp, 404 routes,
 * and gateway authentication mode.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import type { Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * Create a minimal HTTP server that mirrors the routing logic from index.ts.
 * This avoids importing the full MCP server (which starts transport connections)
 * and instead tests the HTTP routing, health, auth, and 404 behavior directly.
 */
function createTestServer(authMode: "env" | "gateway" = "env"): HttpServer {
  const isGatewayMode = authMode === "gateway";

  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`
    );

    // Health endpoint
    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          transport: "http",
          authMode: isGatewayMode ? "gateway" : "env",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // MCP endpoint
    if (url.pathname === "/mcp") {
      if (isGatewayMode) {
        const apiKey = req.headers["x-atera-api-key"] as string | undefined;

        if (!apiKey) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Missing credentials",
              message: "Gateway mode requires X-Atera-API-Key header",
              required: ["X-Atera-API-Key"],
            })
          );
          return;
        }
      }

      // In a real server this would delegate to StreamableHTTPServerTransport.
      // For testing, just acknowledge the request reached the MCP handler.
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, endpoint: "mcp" }));
      return;
    }

    // 404 for everything else
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not found",
        endpoints: ["/mcp", "/health"],
      })
    );
  });
}

/**
 * Helper to make HTTP requests to the test server
 */
async function request(
  baseUrl: string,
  path: string,
  options: { method?: string; headers?: Record<string, string> } = {}
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: options.headers,
  });
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

// ---------------------------------------------------------------------------
// Tests with AUTH_MODE=env (default)
// ---------------------------------------------------------------------------
describe("HTTP transport (env mode)", () => {
  let server: HttpServer;
  let baseUrl: string;

  beforeAll(async () => {
    server = createTestServer("env");
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("GET /health returns 200 with status ok", async () => {
    const { status, body } = await request(baseUrl, "/health");
    expect(status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.transport).toBe("http");
    expect(body.authMode).toBe("env");
    expect(body.timestamp).toBeDefined();
  });

  it("POST /mcp reaches the MCP handler without auth in env mode", async () => {
    const { status, body } = await request(baseUrl, "/mcp", {
      method: "POST",
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.endpoint).toBe("mcp");
  });

  it("GET /unknown returns 404", async () => {
    const { status, body } = await request(baseUrl, "/unknown");
    expect(status).toBe(404);
    expect(body.error).toBe("Not found");
    expect(body.endpoints).toEqual(["/mcp", "/health"]);
  });

  it("GET / returns 404", async () => {
    const { status, body } = await request(baseUrl, "/");
    expect(status).toBe(404);
    expect(body.error).toBe("Not found");
  });

  it("GET /health/extra returns 404", async () => {
    const { status } = await request(baseUrl, "/health/extra");
    expect(status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Tests with AUTH_MODE=gateway
// ---------------------------------------------------------------------------
describe("HTTP transport (gateway mode)", () => {
  let server: HttpServer;
  let baseUrl: string;

  beforeAll(async () => {
    server = createTestServer("gateway");
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("GET /health returns 200 with gateway authMode", async () => {
    const { status, body } = await request(baseUrl, "/health");
    expect(status).toBe(200);
    expect(body.authMode).toBe("gateway");
  });

  it("POST /mcp without X-Atera-API-Key returns 401", async () => {
    const { status, body } = await request(baseUrl, "/mcp", {
      method: "POST",
    });
    expect(status).toBe(401);
    expect(body.error).toBe("Missing credentials");
    expect(body.required).toEqual(["X-Atera-API-Key"]);
  });

  it("POST /mcp with X-Atera-API-Key reaches MCP handler", async () => {
    const { status, body } = await request(baseUrl, "/mcp", {
      method: "POST",
      headers: { "X-Atera-API-Key": "test-api-key-12345" },
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.endpoint).toBe("mcp");
  });

  it("GET /mcp without header returns 401 in gateway mode", async () => {
    const { status, body } = await request(baseUrl, "/mcp");
    expect(status).toBe(401);
    expect(body.error).toBe("Missing credentials");
  });

  it("GET /random returns 404 even in gateway mode", async () => {
    const { status } = await request(baseUrl, "/random");
    expect(status).toBe(404);
  });
});
