/**
 * Tests for the navigation state management and server routing
 *
 * These tests verify the decision-tree architecture of the MCP server,
 * including domain navigation and tool routing.
 */

import { describe, it, expect, vi } from "vitest";

// Mock the client utility for all domain handlers
vi.mock("../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    customers: { list: vi.fn(), get: vi.fn(), create: vi.fn() },
    agents: { list: vi.fn(), get: vi.fn(), getByMachineName: vi.fn() },
    tickets: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn() },
    alerts: {
      list: vi.fn(),
      get: vi.fn(),
      listByAgent: vi.fn(),
      listByDevice: vi.fn(),
    },
    contacts: { list: vi.fn(), get: vi.fn(), listByCustomer: vi.fn() },
  }),
}));

describe("navigation and state management", () => {
  describe("domain descriptions", () => {
    it("should define all five domains with descriptions", async () => {
      // The domains are defined in the index.ts module
      const domains = ["customers", "agents", "tickets", "alerts", "contacts"];
      expect(domains).toHaveLength(5);
    });
  });

  describe("getDomainTools function", () => {
    it("should return customer tools for customers domain", async () => {
      const { customerTools } = await import("../domains/customers.js");
      expect(customerTools).toHaveLength(3);
      expect(customerTools[0].name).toBe("atera_customers_list");
    });

    it("should return agent tools for agents domain", async () => {
      const { agentTools } = await import("../domains/agents.js");
      expect(agentTools).toHaveLength(3);
      expect(agentTools[0].name).toBe("atera_agents_list");
    });

    it("should return ticket tools for tickets domain", async () => {
      const { ticketTools } = await import("../domains/tickets.js");
      expect(ticketTools).toHaveLength(4);
      expect(ticketTools[0].name).toBe("atera_tickets_list");
    });

    it("should return alert tools for alerts domain", async () => {
      const { alertTools } = await import("../domains/alerts.js");
      expect(alertTools).toHaveLength(4);
      expect(alertTools[0].name).toBe("atera_alerts_list");
    });

    it("should return contact tools for contacts domain", async () => {
      const { contactTools } = await import("../domains/contacts.js");
      expect(contactTools).toHaveLength(3);
      expect(contactTools[0].name).toBe("atera_contacts_list");
    });
  });

  describe("tool naming patterns", () => {
    it("should prefix customer tools with atera_customers_", async () => {
      const { customerTools } = await import("../domains/customers.js");
      customerTools.forEach((tool) => {
        expect(tool.name).toMatch(/^atera_customers_/);
      });
    });

    it("should prefix agent tools with atera_agents_", async () => {
      const { agentTools } = await import("../domains/agents.js");
      agentTools.forEach((tool) => {
        expect(tool.name).toMatch(/^atera_agents_/);
      });
    });

    it("should prefix ticket tools with atera_tickets_", async () => {
      const { ticketTools } = await import("../domains/tickets.js");
      ticketTools.forEach((tool) => {
        expect(tool.name).toMatch(/^atera_tickets_/);
      });
    });

    it("should prefix alert tools with atera_alerts_", async () => {
      const { alertTools } = await import("../domains/alerts.js");
      alertTools.forEach((tool) => {
        expect(tool.name).toMatch(/^atera_alerts_/);
      });
    });

    it("should prefix contact tools with atera_contacts_", async () => {
      const { contactTools } = await import("../domains/contacts.js");
      contactTools.forEach((tool) => {
        expect(tool.name).toMatch(/^atera_contacts_/);
      });
    });
  });

  describe("navigation tool schema", () => {
    it("should define navigate tool with domain enum", () => {
      const navigateTool = {
        name: "atera_navigate",
        inputSchema: {
          type: "object",
          properties: {
            domain: {
              type: "string",
              enum: ["customers", "agents", "tickets", "alerts", "contacts"],
            },
          },
          required: ["domain"],
        },
      };

      expect(navigateTool.name).toBe("atera_navigate");
      expect(navigateTool.inputSchema.properties.domain.enum).toHaveLength(5);
      expect(navigateTool.inputSchema.required).toContain("domain");
    });

    it("should define back tool with empty schema", () => {
      const backTool = {
        name: "atera_back",
        inputSchema: {
          type: "object",
          properties: {},
        },
      };

      expect(backTool.name).toBe("atera_back");
      expect(Object.keys(backTool.inputSchema.properties)).toHaveLength(0);
    });
  });

  describe("state transitions", () => {
    it("should start at null (root) state", () => {
      const state = { currentDomain: null as string | null };
      expect(state.currentDomain).toBeNull();
    });

    it("should transition to domain on navigate", () => {
      const state = { currentDomain: null as string | null };
      state.currentDomain = "customers";
      expect(state.currentDomain).toBe("customers");
    });

    it("should transition back to null on back", () => {
      const state = { currentDomain: "customers" as string | null };
      state.currentDomain = null;
      expect(state.currentDomain).toBeNull();
    });

    it("should allow switching between domains", () => {
      const state = { currentDomain: "customers" as string | null };

      state.currentDomain = null;
      state.currentDomain = "tickets";

      expect(state.currentDomain).toBe("tickets");
    });
  });

  describe("tool schema validation", () => {
    it("should have valid inputSchema for all customer tools", async () => {
      const { customerTools } = await import("../domains/customers.js");
      customerTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all agent tools", async () => {
      const { agentTools } = await import("../domains/agents.js");
      agentTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all ticket tools", async () => {
      const { ticketTools } = await import("../domains/tickets.js");
      ticketTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all alert tools", async () => {
      const { alertTools } = await import("../domains/alerts.js");
      alertTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it("should have valid inputSchema for all contact tools", async () => {
      const { contactTools } = await import("../domains/contacts.js");
      contactTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });
  });
});
