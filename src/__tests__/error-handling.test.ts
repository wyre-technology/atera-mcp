/**
 * Tests for error handling across all domain handlers
 *
 * These tests verify that errors from the Atera client are properly
 * propagated and that unknown tool names return appropriate error responses.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("error handling", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("unknown tool errors", () => {
    it("should return error for unknown customer tool", async () => {
      const mockClient = {
        customers: { list: vi.fn(), get: vi.fn(), create: vi.fn() },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleCustomerTool } = await import("../domains/customers.js");
      const result = await handleCustomerTool("atera_customers_invalid", {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown customer tool");
    });

    it("should return error for unknown agent tool", async () => {
      const mockClient = {
        agents: { list: vi.fn(), get: vi.fn(), getByMachineName: vi.fn() },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleAgentTool } = await import("../domains/agents.js");
      const result = await handleAgentTool("atera_agents_invalid", {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown agent tool");
    });

    it("should return error for unknown ticket tool", async () => {
      const mockClient = {
        tickets: {
          list: vi.fn(),
          get: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleTicketTool } = await import("../domains/tickets.js");
      const result = await handleTicketTool("atera_tickets_invalid", {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown ticket tool");
    });

    it("should return error for unknown alert tool", async () => {
      const mockClient = {
        alerts: {
          list: vi.fn(),
          get: vi.fn(),
          listByAgent: vi.fn(),
          listByDevice: vi.fn(),
        },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleAlertTool } = await import("../domains/alerts.js");
      const result = await handleAlertTool("atera_alerts_invalid", {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown alert tool");
    });

    it("should return error for unknown contact tool", async () => {
      const mockClient = {
        contacts: { list: vi.fn(), get: vi.fn(), listByCustomer: vi.fn() },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleContactTool } = await import("../domains/contacts.js");
      const result = await handleContactTool("atera_contacts_invalid", {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown contact tool");
    });
  });

  describe("API error propagation", () => {
    it("should throw when customer list fails", async () => {
      const mockClient = {
        customers: {
          list: vi.fn().mockRejectedValue(new Error("API rate limit exceeded")),
          get: vi.fn(),
          create: vi.fn(),
        },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleCustomerTool } = await import("../domains/customers.js");

      await expect(
        handleCustomerTool("atera_customers_list", {})
      ).rejects.toThrow("API rate limit exceeded");
    });

    it("should throw when customer get fails", async () => {
      const mockClient = {
        customers: {
          list: vi.fn(),
          get: vi.fn().mockRejectedValue(new Error("Customer not found")),
          create: vi.fn(),
        },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleCustomerTool } = await import("../domains/customers.js");

      await expect(
        handleCustomerTool("atera_customers_get", { customerId: 999 })
      ).rejects.toThrow("Customer not found");
    });

    it("should throw when agent list fails", async () => {
      const mockClient = {
        agents: {
          list: vi.fn().mockRejectedValue(new Error("Network error")),
          get: vi.fn(),
          getByMachineName: vi.fn(),
        },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleAgentTool } = await import("../domains/agents.js");

      await expect(handleAgentTool("atera_agents_list", {})).rejects.toThrow(
        "Network error"
      );
    });

    it("should throw when ticket create fails", async () => {
      const mockClient = {
        tickets: {
          list: vi.fn(),
          get: vi.fn(),
          create: vi.fn().mockRejectedValue(new Error("Invalid ticket data")),
          update: vi.fn(),
        },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleTicketTool } = await import("../domains/tickets.js");

      await expect(
        handleTicketTool("atera_tickets_create", { TicketTitle: "" })
      ).rejects.toThrow("Invalid ticket data");
    });

    it("should throw when alert listByAgent fails", async () => {
      const mockClient = {
        alerts: {
          list: vi.fn(),
          get: vi.fn(),
          listByAgent: vi.fn().mockRejectedValue(new Error("Agent not found")),
          listByDevice: vi.fn(),
        },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleAlertTool } = await import("../domains/alerts.js");

      await expect(
        handleAlertTool("atera_alerts_by_agent", { agentId: 999 })
      ).rejects.toThrow("Agent not found");
    });

    it("should throw when contact listByCustomer fails", async () => {
      const mockClient = {
        contacts: {
          list: vi.fn(),
          get: vi.fn(),
          listByCustomer: vi
            .fn()
            .mockRejectedValue(new Error("Customer not found")),
        },
      };
      vi.doMock("../utils/client.js", () => ({
        getClient: vi.fn().mockResolvedValue(mockClient),
      }));

      const { handleContactTool } = await import("../domains/contacts.js");

      await expect(
        handleContactTool("atera_contacts_by_customer", { customerId: 999 })
      ).rejects.toThrow("Customer not found");
    });
  });

  describe("client initialization errors", () => {
    it("should throw when getClient fails", async () => {
      vi.doMock("../utils/client.js", () => ({
        getClient: vi
          .fn()
          .mockRejectedValue(
            new Error("ATERA_API_KEY environment variable is required")
          ),
      }));

      const { handleCustomerTool } = await import("../domains/customers.js");

      await expect(
        handleCustomerTool("atera_customers_list", {})
      ).rejects.toThrow("ATERA_API_KEY environment variable is required");
    });
  });
});
