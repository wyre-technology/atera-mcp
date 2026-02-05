/**
 * Tests for the tickets domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ticketTools, handleTicketTool } from "../../domains/tickets.js";

// Mock the client utility
const mockClient = {
  tickets: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    tickets: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  }),
}));

describe("tickets domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("ticketTools", () => {
    it("should export four ticket tools", () => {
      expect(ticketTools).toHaveLength(4);
    });

    it("should have atera_tickets_list tool with filter options", () => {
      const listTool = ticketTools.find((t) => t.name === "atera_tickets_list");
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("itemsInPage");
      expect(listTool?.inputSchema.properties).toHaveProperty("ticketStatus");
      expect(listTool?.inputSchema.properties).toHaveProperty("customerId");
      expect(listTool?.inputSchema.properties).toHaveProperty("technicianId");
      expect(listTool?.inputSchema.properties).toHaveProperty("dateFrom");
      expect(listTool?.inputSchema.properties).toHaveProperty("dateTo");
    });

    it("should have atera_tickets_get tool with required ticketId", () => {
      const getTool = ticketTools.find((t) => t.name === "atera_tickets_get");
      expect(getTool).toBeDefined();
      expect(getTool?.inputSchema.properties).toHaveProperty("ticketId");
      expect(getTool?.inputSchema.required).toContain("ticketId");
    });

    it("should have atera_tickets_create tool with required TicketTitle", () => {
      const createTool = ticketTools.find(
        (t) => t.name === "atera_tickets_create"
      );
      expect(createTool).toBeDefined();
      expect(createTool?.inputSchema.properties).toHaveProperty("TicketTitle");
      expect(createTool?.inputSchema.required).toContain("TicketTitle");
    });

    it("should have atera_tickets_update tool with required ticketId", () => {
      const updateTool = ticketTools.find(
        (t) => t.name === "atera_tickets_update"
      );
      expect(updateTool).toBeDefined();
      expect(updateTool?.inputSchema.properties).toHaveProperty("ticketId");
      expect(updateTool?.inputSchema.required).toContain("ticketId");
    });
  });

  describe("handleTicketTool", () => {
    describe("atera_tickets_list", () => {
      it("should call client.tickets.list with all filter params", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.tickets.list.mockResolvedValue(mockResponse);

        const result = await handleTicketTool("atera_tickets_list", {
          page: 1,
          itemsInPage: 25,
          ticketStatus: "Open",
          customerId: 123,
          technicianId: 456,
          dateFrom: "2024-01-01",
          dateTo: "2024-12-31",
        });

        expect(mockClient.tickets.list).toHaveBeenCalledWith({
          page: 1,
          itemsInPage: 25,
          ticketStatus: "Open",
          customerId: 123,
          technicianId: 456,
          dateFrom: "2024-01-01",
          dateTo: "2024-12-31",
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call client.tickets.list with minimal params", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.tickets.list.mockResolvedValue(mockResponse);

        await handleTicketTool("atera_tickets_list", {});

        expect(mockClient.tickets.list).toHaveBeenCalledWith({
          page: undefined,
          itemsInPage: undefined,
          ticketStatus: undefined,
          customerId: undefined,
          technicianId: undefined,
          dateFrom: undefined,
          dateTo: undefined,
        });
      });
    });

    describe("atera_tickets_get", () => {
      it("should call client.tickets.get with ticketId", async () => {
        const mockTicket = {
          TicketID: 789,
          TicketTitle: "Server Down",
          TicketStatus: "Open",
        };
        mockClient.tickets.get.mockResolvedValue(mockTicket);

        const result = await handleTicketTool("atera_tickets_get", {
          ticketId: 789,
        });

        expect(mockClient.tickets.get).toHaveBeenCalledWith(789);
        expect(result.content[0].text).toContain("Server Down");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("atera_tickets_create", () => {
      it("should call client.tickets.create with full ticket data", async () => {
        const mockTicket = { TicketID: 999, TicketTitle: "New Issue" };
        mockClient.tickets.create.mockResolvedValue(mockTicket);

        const ticketData = {
          TicketTitle: "New Issue",
          CustomerID: 123,
          TicketPriority: "High",
          TicketStatus: "Open",
          Description: "Something is broken",
        };

        const result = await handleTicketTool(
          "atera_tickets_create",
          ticketData
        );

        expect(mockClient.tickets.create).toHaveBeenCalledWith(ticketData);
        expect(result.content[0].text).toContain("New Issue");
        expect(result.isError).toBeUndefined();
      });

      it("should call client.tickets.create with minimal data", async () => {
        const mockTicket = { TicketID: 1000, TicketTitle: "Minimal Ticket" };
        mockClient.tickets.create.mockResolvedValue(mockTicket);

        const result = await handleTicketTool("atera_tickets_create", {
          TicketTitle: "Minimal Ticket",
        });

        expect(mockClient.tickets.create).toHaveBeenCalledWith({
          TicketTitle: "Minimal Ticket",
        });
        expect(result.isError).toBeUndefined();
      });
    });

    describe("atera_tickets_update", () => {
      it("should call client.tickets.update with ticketId and update data", async () => {
        const mockTicket = {
          TicketID: 789,
          TicketTitle: "Updated Title",
          TicketStatus: "Resolved",
        };
        mockClient.tickets.update.mockResolvedValue(mockTicket);

        const result = await handleTicketTool("atera_tickets_update", {
          ticketId: 789,
          TicketTitle: "Updated Title",
          TicketStatus: "Resolved",
        });

        expect(mockClient.tickets.update).toHaveBeenCalledWith(789, {
          TicketTitle: "Updated Title",
          TicketStatus: "Resolved",
        });
        expect(result.content[0].text).toContain("Resolved");
        expect(result.isError).toBeUndefined();
      });

      it("should call client.tickets.update with only ticketId", async () => {
        const mockTicket = { TicketID: 789 };
        mockClient.tickets.update.mockResolvedValue(mockTicket);

        await handleTicketTool("atera_tickets_update", {
          ticketId: 789,
        });

        expect(mockClient.tickets.update).toHaveBeenCalledWith(789, {});
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown ticket tool", async () => {
        const result = await handleTicketTool("atera_tickets_unknown", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown ticket tool");
      });
    });
  });
});
