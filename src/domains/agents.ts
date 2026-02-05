/**
 * Agents domain tools for Atera MCP Server
 *
 * Agents represent devices/endpoints managed by Atera RMM.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Agent domain tool definitions
 */
export const agentTools: Tool[] = [
  {
    name: "atera_agents_list",
    description:
      "List agents (managed devices/endpoints) in Atera. Agents include servers, workstations, and Macs with the Atera agent installed. Returns device info including OS, IP addresses, online status, and hardware details.",
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
        customerId: {
          type: "number",
          description: "Filter agents by customer ID",
        },
      },
    },
  },
  {
    name: "atera_agents_get",
    description:
      "Get detailed information about a specific agent (device) by its ID. Returns full device profile including OS, hardware specs, and current status.",
    inputSchema: {
      type: "object",
      properties: {
        agentId: {
          type: "number",
          description: "The unique agent ID",
        },
      },
      required: ["agentId"],
    },
  },
  {
    name: "atera_agents_get_by_machine",
    description:
      "Get agent information by machine name. Useful when you know the computer name but not the agent ID.",
    inputSchema: {
      type: "object",
      properties: {
        machineName: {
          type: "string",
          description: "The machine/computer name",
        },
      },
      required: ["machineName"],
    },
  },
];

/**
 * Handle agent domain tool calls
 */
export async function handleAgentTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "atera_agents_list": {
      const params = args as {
        page?: number;
        itemsInPage?: number;
        customerId?: number;
      };
      const response = await client.agents.list({
        page: params.page,
        itemsInPage: params.itemsInPage,
        customerId: params.customerId,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "atera_agents_get": {
      const { agentId } = args as { agentId: number };
      const agent = await client.agents.get(agentId);
      return {
        content: [{ type: "text", text: JSON.stringify(agent, null, 2) }],
      };
    }

    case "atera_agents_get_by_machine": {
      const { machineName } = args as { machineName: string };
      const agent = await client.agents.getByMachineName(machineName);
      return {
        content: [{ type: "text", text: JSON.stringify(agent, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown agent tool: ${name}` }],
        isError: true,
      };
  }
}
