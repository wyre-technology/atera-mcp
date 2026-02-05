/**
 * Alerts domain tools for Atera MCP Server
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Alert severity type
 */
type AlertSeverity = "Information" | "Warning" | "Critical";

/**
 * Alert domain tool definitions
 */
export const alertTools: Tool[] = [
  {
    name: "atera_alerts_list",
    description:
      "List alerts from monitored devices in Atera. Alerts indicate issues detected by monitoring thresholds on agents and devices.",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number (1-indexed, default: 1)",
        },
        itemsInPage: {
          type: "number",
          description: "Number of items per page (default: 50, max: 50)",
        },
        alertSeverity: {
          type: "string",
          enum: ["Information", "Warning", "Critical"],
          description: "Filter by alert severity level",
        },
        customerId: {
          type: "number",
          description: "Filter alerts by customer ID",
        },
        archived: {
          type: "boolean",
          description: "Filter by archived status (true/false)",
        },
      },
    },
  },
  {
    name: "atera_alerts_get",
    description:
      "Get detailed information about a specific alert by its ID. Returns full alert details including source, severity, and related device/agent info.",
    inputSchema: {
      type: "object",
      properties: {
        alertId: {
          type: "number",
          description: "The unique alert ID",
        },
      },
      required: ["alertId"],
    },
  },
  {
    name: "atera_alerts_by_agent",
    description:
      "List alerts for a specific agent (device). Useful for troubleshooting issues on a particular machine.",
    inputSchema: {
      type: "object",
      properties: {
        agentId: {
          type: "number",
          description: "The agent ID to get alerts for",
        },
        page: {
          type: "number",
          description: "Page number (1-indexed, default: 1)",
        },
        itemsInPage: {
          type: "number",
          description: "Number of items per page (default: 50, max: 50)",
        },
      },
      required: ["agentId"],
    },
  },
  {
    name: "atera_alerts_by_device",
    description:
      "List alerts for a specific device (SNMP, HTTP, or TCP monitor). Useful for checking network device health.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: {
          type: "number",
          description: "The device ID to get alerts for",
        },
        page: {
          type: "number",
          description: "Page number (1-indexed, default: 1)",
        },
        itemsInPage: {
          type: "number",
          description: "Number of items per page (default: 50, max: 50)",
        },
      },
      required: ["deviceId"],
    },
  },
];

/**
 * Handle alert domain tool calls
 */
export async function handleAlertTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "atera_alerts_list": {
      const params = args as {
        page?: number;
        itemsInPage?: number;
        alertSeverity?: AlertSeverity;
        customerId?: number;
        archived?: boolean;
      };
      const response = await client.alerts.list({
        page: params.page,
        itemsInPage: params.itemsInPage,
        alertSeverity: params.alertSeverity,
        customerId: params.customerId,
        archived: params.archived,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "atera_alerts_get": {
      const { alertId } = args as { alertId: number };
      const alert = await client.alerts.get(alertId);
      return {
        content: [{ type: "text", text: JSON.stringify(alert, null, 2) }],
      };
    }

    case "atera_alerts_by_agent": {
      const params = args as {
        agentId: number;
        page?: number;
        itemsInPage?: number;
      };
      const response = await client.alerts.listByAgent(params.agentId, {
        page: params.page,
        itemsInPage: params.itemsInPage,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "atera_alerts_by_device": {
      const params = args as {
        deviceId: number;
        page?: number;
        itemsInPage?: number;
      };
      const response = await client.alerts.listByDevice(params.deviceId, {
        page: params.page,
        itemsInPage: params.itemsInPage,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown alert tool: ${name}` }],
        isError: true,
      };
  }
}
