/**
 * Contacts domain tools for Atera MCP Server
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";

/**
 * Contact domain tool definitions
 */
export const contactTools: Tool[] = [
  {
    name: "atera_contacts_list",
    description:
      "List contacts across all customers in Atera. Contacts are people associated with customer companies who may submit tickets or receive communications.",
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
      },
    },
  },
  {
    name: "atera_contacts_get",
    description:
      "Get detailed information about a specific contact by their ID. Returns full contact profile including customer association and contact details.",
    inputSchema: {
      type: "object",
      properties: {
        contactId: {
          type: "number",
          description: "The unique contact ID",
        },
      },
      required: ["contactId"],
    },
  },
  {
    name: "atera_contacts_by_customer",
    description:
      "List contacts for a specific customer. Useful for finding who to contact at a particular company.",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "number",
          description: "The customer ID to get contacts for",
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
      required: ["customerId"],
    },
  },
];

/**
 * Handle contact domain tool calls
 */
export async function handleContactTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "atera_contacts_list": {
      const params = args as { page?: number; itemsInPage?: number };
      const response = await client.contacts.list({
        page: params.page,
        itemsInPage: params.itemsInPage,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "atera_contacts_get": {
      const { contactId } = args as { contactId: number };
      const contact = await client.contacts.get(contactId);
      return {
        content: [{ type: "text", text: JSON.stringify(contact, null, 2) }],
      };
    }

    case "atera_contacts_by_customer": {
      const params = args as {
        customerId: number;
        page?: number;
        itemsInPage?: number;
      };
      const response = await client.contacts.listByCustomer(params.customerId, {
        page: params.page,
        itemsInPage: params.itemsInPage,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown contact tool: ${name}` }],
        isError: true,
      };
  }
}
