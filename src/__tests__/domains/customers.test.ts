/**
 * Tests for the customers domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { customerTools, handleCustomerTool } from "../../domains/customers.js";

// Mock the client utility
const mockClient = {
  customers: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    customers: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
    },
  }),
}));

describe("customers domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Update mock implementation for each test
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("customerTools", () => {
    it("should export three customer tools", () => {
      expect(customerTools).toHaveLength(3);
    });

    it("should have atera_customers_list tool", () => {
      const listTool = customerTools.find(
        (t) => t.name === "atera_customers_list"
      );
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("itemsInPage");
      expect(listTool?.inputSchema.required).toBeUndefined();
    });

    it("should have atera_customers_get tool with required customerId", () => {
      const getTool = customerTools.find(
        (t) => t.name === "atera_customers_get"
      );
      expect(getTool).toBeDefined();
      expect(getTool?.inputSchema.properties).toHaveProperty("customerId");
      expect(getTool?.inputSchema.required).toContain("customerId");
    });

    it("should have atera_customers_create tool with required CustomerName", () => {
      const createTool = customerTools.find(
        (t) => t.name === "atera_customers_create"
      );
      expect(createTool).toBeDefined();
      expect(createTool?.inputSchema.properties).toHaveProperty("CustomerName");
      expect(createTool?.inputSchema.required).toContain("CustomerName");
    });
  });

  describe("handleCustomerTool", () => {
    describe("atera_customers_list", () => {
      it("should call client.customers.list with pagination params", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.customers.list.mockResolvedValue(mockResponse);

        const result = await handleCustomerTool("atera_customers_list", {
          page: 2,
          itemsInPage: 25,
        });

        expect(mockClient.customers.list).toHaveBeenCalledWith({
          page: 2,
          itemsInPage: 25,
        });
        expect(result.content[0].text).toContain("items");
        expect(result.isError).toBeUndefined();
      });

      it("should call client.customers.list with default params", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.customers.list.mockResolvedValue(mockResponse);

        await handleCustomerTool("atera_customers_list", {});

        expect(mockClient.customers.list).toHaveBeenCalledWith({
          page: undefined,
          itemsInPage: undefined,
        });
      });
    });

    describe("atera_customers_get", () => {
      it("should call client.customers.get with customerId", async () => {
        const mockCustomer = { CustomerID: 123, CustomerName: "Test Co" };
        mockClient.customers.get.mockResolvedValue(mockCustomer);

        const result = await handleCustomerTool("atera_customers_get", {
          customerId: 123,
        });

        expect(mockClient.customers.get).toHaveBeenCalledWith(123);
        expect(result.content[0].text).toContain("Test Co");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("atera_customers_create", () => {
      it("should call client.customers.create with customer data", async () => {
        const mockCustomer = { CustomerID: 456, CustomerName: "New Customer" };
        mockClient.customers.create.mockResolvedValue(mockCustomer);

        const result = await handleCustomerTool("atera_customers_create", {
          CustomerName: "New Customer",
          City: "New York",
          Phone: "555-1234",
        });

        expect(mockClient.customers.create).toHaveBeenCalledWith({
          CustomerName: "New Customer",
          City: "New York",
          Phone: "555-1234",
        });
        expect(result.content[0].text).toContain("New Customer");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown customer tool", async () => {
        const result = await handleCustomerTool("atera_customers_unknown", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown customer tool");
      });
    });
  });
});
