#!/usr/bin/env node
/**
 * Atera MCP Server
 *
 * This MCP server provides tools for interacting with the Atera RMM API.
 * It implements a decision tree architecture where tools are dynamically
 * loaded based on the selected domain.
 *
 * Supports both stdio and HTTP (StreamableHTTP) transports.
 * Authentication: Set ATERA_API_KEY environment variable (env mode)
 *                 or pass x-atera-api-key header (gateway mode)
 * Rate Limit: 700 requests/minute (handled by node-atera client)
 */

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Domain imports
import { customerTools, handleCustomerTool } from "./domains/customers.js";
import { agentTools, handleAgentTool } from "./domains/agents.js";
import { ticketTools, handleTicketTool } from "./domains/tickets.js";
import { alertTools, handleAlertTool } from "./domains/alerts.js";
import { contactTools, handleContactTool } from "./domains/contacts.js";
import { resetClient } from "./utils/client.js";

/**
 * Transport and auth configuration types
 */
type TransportType = "stdio" | "http";
type AuthMode = "env" | "gateway";

/**
 * Available domains for navigation
 */
type Domain = "customers" | "agents" | "tickets" | "alerts" | "contacts";

/**
 * Domain metadata for navigation
 */
const domainDescriptions: Record<Domain, string> = {
  customers:
    "Customer/company management - list, get, and create customer records",
  agents:
    "Agent/device management - list and get managed devices with RMM agent installed",
  tickets:
    "Ticket management - list, get, create, and update service tickets",
  alerts:
    "Alert monitoring - list and get alerts from monitored devices and agents",
  contacts: "Contact management - list and get customer contact information",
};

/**
 * Server state management
 */
interface ServerState {
  currentDomain: Domain | null;
}

const state: ServerState = {
  currentDomain: null,
};

/**
 * Get tools for a specific domain
 */
function getDomainTools(domain: Domain): Tool[] {
  switch (domain) {
    case "customers":
      return customerTools;
    case "agents":
      return agentTools;
    case "tickets":
      return ticketTools;
    case "alerts":
      return alertTools;
    case "contacts":
      return contactTools;
  }
}

/**
 * Navigation tool - entry point for decision tree
 */
const navigateTool: Tool = {
  name: "atera_navigate",
  description:
    "Navigate to a specific domain in Atera. Call this first to select which area you want to work with. After navigation, domain-specific tools will be available.",
  inputSchema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        enum: ["customers", "agents", "tickets", "alerts", "contacts"],
        description: `The domain to navigate to:
- customers: ${domainDescriptions.customers}
- agents: ${domainDescriptions.agents}
- tickets: ${domainDescriptions.tickets}
- alerts: ${domainDescriptions.alerts}
- contacts: ${domainDescriptions.contacts}`,
      },
    },
    required: ["domain"],
  },
};

/**
 * Back navigation tool - return to domain selection
 */
const backTool: Tool = {
  name: "atera_back",
  description:
    "Return to domain selection. Use this to switch to a different area of Atera.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * Create the MCP server
 */
const server = new Server(
  {
    name: "atera-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handle ListTools requests - returns tools based on current state
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [];

  if (state.currentDomain === null) {
    // At root - show navigation tool only
    tools.push(navigateTool);
  } else {
    // In a domain - show domain tools plus back navigation
    tools.push(backTool);
    tools.push(...getDomainTools(state.currentDomain));
  }

  return { tools };
});

/**
 * Handle CallTool requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Handle navigation
    if (name === "atera_navigate") {
      const { domain } = args as { domain: Domain };
      state.currentDomain = domain;

      const domainTools = getDomainTools(domain);
      const toolNames = domainTools.map((t) => t.name).join(", ");

      return {
        content: [
          {
            type: "text",
            text: `Navigated to ${domain} domain. Available tools: ${toolNames}`,
          },
        ],
      };
    }

    // Handle back navigation
    if (name === "atera_back") {
      state.currentDomain = null;
      return {
        content: [
          {
            type: "text",
            text: "Returned to domain selection. Use atera_navigate to select a domain: customers, agents, tickets, alerts, contacts",
          },
        ],
      };
    }

    // Route to appropriate domain handler
    const toolArgs = (args ?? {}) as Record<string, unknown>;

    if (name.startsWith("atera_customers_")) {
      return await handleCustomerTool(name, toolArgs);
    }
    if (name.startsWith("atera_agents_")) {
      return await handleAgentTool(name, toolArgs);
    }
    if (name.startsWith("atera_tickets_")) {
      return await handleTicketTool(name, toolArgs);
    }
    if (name.startsWith("atera_alerts_")) {
      return await handleAlertTool(name, toolArgs);
    }
    if (name.startsWith("atera_contacts_")) {
      return await handleContactTool(name, toolArgs);
    }

    // Unknown tool
    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${name}. Use atera_navigate to select a domain first.`,
        },
      ],
      isError: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

/**
 * Start the server with stdio transport (default)
 */
async function startStdioTransport(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Atera MCP server running on stdio");
}

/**
 * Start the server with HTTP Streamable transport
 * In gateway mode, credentials are extracted from request headers on each request
 */
async function startHttpTransport(): Promise<void> {
  const port = parseInt(process.env.MCP_HTTP_PORT || "8080", 10);
  const host = process.env.MCP_HTTP_HOST || "0.0.0.0";
  const authMode = (process.env.AUTH_MODE as AuthMode) || "env";
  const isGatewayMode = authMode === "gateway";

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  });

  const httpServer = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(
        req.url || "/",
        `http://${req.headers.host || "localhost"}`
      );

      // Health endpoint - no auth required
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
        // In gateway mode, extract credentials from headers
        if (isGatewayMode) {
          const apiKey = req.headers["x-atera-api-key"] as string | undefined;

          if (!apiKey) {
            console.error(
              "Gateway mode: Missing x-atera-api-key header"
            );
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Missing credentials",
                message:
                  "Gateway mode requires X-Atera-API-Key header",
                required: ["X-Atera-API-Key"],
              })
            );
            return;
          }

          // Reset client so next getClient() picks up the new key
          resetClient();
          process.env.ATERA_API_KEY = apiKey;
        }

        transport.handleRequest(req, res);
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
    }
  );

  await server.connect(transport);

  await new Promise<void>((resolve) => {
    httpServer.listen(port, host, () => {
      console.error(`Atera MCP server listening on http://${host}:${port}/mcp`);
      console.error(
        `Health check available at http://${host}:${port}/health`
      );
      console.error(
        `Authentication mode: ${isGatewayMode ? "gateway (header-based)" : "env (environment variables)"}`
      );
      resolve();
    });
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.error("Shutting down Atera MCP server...");
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    });
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

/**
 * Main entry point - selects transport based on MCP_TRANSPORT env var
 */
async function main() {
  const transportType =
    (process.env.MCP_TRANSPORT as TransportType) || "stdio";

  if (transportType === "http") {
    await startHttpTransport();
  } else {
    await startStdioTransport();
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

main().catch(console.error);
