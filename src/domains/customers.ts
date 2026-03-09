/**
 * Customers domain tools for Atera MCP Server
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getClient } from "../utils/client.js";
import { elicitText } from "../utils/elicitation.js";

/**
 * Customer domain tool definitions
 */
export const customerTools: Tool[] = [
  {
    name: "atera_customers_list",
    description:
      "List customers (companies) in Atera with pagination. Returns customer details including name, address, contact info, and primary contact.",
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
    name: "atera_customers_get",
    description:
      "Get detailed information about a specific customer by their ID. Returns full customer profile including primary contact.",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "number",
          description: "The unique customer ID",
        },
      },
      required: ["customerId"],
    },
  },
  {
    name: "atera_customers_create",
    description:
      "Create a new customer (company) in Atera. Only CustomerName is required, all other fields are optional.",
    inputSchema: {
      type: "object",
      properties: {
        CustomerName: {
          type: "string",
          description: "The customer/company name (required)",
        },
        BusinessNumber: {
          type: "string",
          description: "Business registration number",
        },
        Domain: {
          type: "string",
          description: "Company domain name",
        },
        Address: {
          type: "string",
          description: "Street address",
        },
        City: {
          type: "string",
          description: "City",
        },
        State: {
          type: "string",
          description: "State or province",
        },
        Country: {
          type: "string",
          description: "Country",
        },
        ZipCode: {
          type: "string",
          description: "ZIP or postal code",
        },
        Phone: {
          type: "string",
          description: "Phone number",
        },
        Fax: {
          type: "string",
          description: "Fax number",
        },
        Notes: {
          type: "string",
          description: "Additional notes",
        },
        Website: {
          type: "string",
          description: "Company website URL",
        },
      },
      required: ["CustomerName"],
    },
  },
];

/**
 * Handle customer domain tool calls
 */
export async function handleCustomerTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const client = await getClient();

  switch (name) {
    case "atera_customers_list": {
      const params = args as { page?: number; itemsInPage?: number };

      // If called with no pagination (first page, default), elicit a search term
      let searchHint: string | null = null;
      if (!params.page || params.page === 1) {
        searchHint = await elicitText(
          "Would you like to search for a specific customer by name?",
          "search",
          "Enter a customer name to search for, or leave blank to list all"
        );
      }

      const response = await client.customers.list({
        page: params.page,
        itemsInPage: params.itemsInPage,
      });

      // If the user provided a search hint, prepend it so the LLM can filter results
      if (searchHint) {
        return {
          content: [
            {
              type: "text",
              text: `User is looking for customer matching: "${searchHint}"\n\n${JSON.stringify(response, null, 2)}`,
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }

    case "atera_customers_get": {
      const { customerId } = args as { customerId: number };
      const customer = await client.customers.get(customerId);
      return {
        content: [{ type: "text", text: JSON.stringify(customer, null, 2) }],
      };
    }

    case "atera_customers_create": {
      const params = args as {
        CustomerName: string;
        BusinessNumber?: string;
        Domain?: string;
        Address?: string;
        City?: string;
        State?: string;
        Country?: string;
        ZipCode?: string;
        Phone?: string;
        Fax?: string;
        Notes?: string;
        Website?: string;
      };
      const customer = await client.customers.create(params);
      return {
        content: [{ type: "text", text: JSON.stringify(customer, null, 2) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown customer tool: ${name}` }],
        isError: true,
      };
  }
}
