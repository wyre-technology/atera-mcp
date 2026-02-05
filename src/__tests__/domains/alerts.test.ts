/**
 * Tests for the alerts domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { alertTools, handleAlertTool } from "../../domains/alerts.js";

// Mock the client utility
const mockClient = {
  alerts: {
    list: vi.fn(),
    get: vi.fn(),
    listByAgent: vi.fn(),
    listByDevice: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    alerts: {
      list: vi.fn(),
      get: vi.fn(),
      listByAgent: vi.fn(),
      listByDevice: vi.fn(),
    },
  }),
}));

describe("alerts domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("alertTools", () => {
    it("should export four alert tools", () => {
      expect(alertTools).toHaveLength(4);
    });

    it("should have atera_alerts_list tool with filter options", () => {
      const listTool = alertTools.find((t) => t.name === "atera_alerts_list");
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("itemsInPage");
      expect(listTool?.inputSchema.properties).toHaveProperty("alertSeverity");
      expect(listTool?.inputSchema.properties).toHaveProperty("customerId");
      expect(listTool?.inputSchema.properties).toHaveProperty("archived");
    });

    it("should have atera_alerts_get tool with required alertId", () => {
      const getTool = alertTools.find((t) => t.name === "atera_alerts_get");
      expect(getTool).toBeDefined();
      expect(getTool?.inputSchema.properties).toHaveProperty("alertId");
      expect(getTool?.inputSchema.required).toContain("alertId");
    });

    it("should have atera_alerts_by_agent tool with required agentId", () => {
      const agentTool = alertTools.find(
        (t) => t.name === "atera_alerts_by_agent"
      );
      expect(agentTool).toBeDefined();
      expect(agentTool?.inputSchema.properties).toHaveProperty("agentId");
      expect(agentTool?.inputSchema.required).toContain("agentId");
    });

    it("should have atera_alerts_by_device tool with required deviceId", () => {
      const deviceTool = alertTools.find(
        (t) => t.name === "atera_alerts_by_device"
      );
      expect(deviceTool).toBeDefined();
      expect(deviceTool?.inputSchema.properties).toHaveProperty("deviceId");
      expect(deviceTool?.inputSchema.required).toContain("deviceId");
    });

    it("should have alertSeverity enum with correct values", () => {
      const listTool = alertTools.find((t) => t.name === "atera_alerts_list");
      const severityProp = listTool?.inputSchema.properties?.alertSeverity as {
        enum?: string[];
      };
      expect(severityProp?.enum).toEqual([
        "Information",
        "Warning",
        "Critical",
      ]);
    });
  });

  describe("handleAlertTool", () => {
    describe("atera_alerts_list", () => {
      it("should call client.alerts.list with all filter params", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.alerts.list.mockResolvedValue(mockResponse);

        const result = await handleAlertTool("atera_alerts_list", {
          page: 1,
          itemsInPage: 25,
          alertSeverity: "Critical",
          customerId: 123,
          archived: false,
        });

        expect(mockClient.alerts.list).toHaveBeenCalledWith({
          page: 1,
          itemsInPage: 25,
          alertSeverity: "Critical",
          customerId: 123,
          archived: false,
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call client.alerts.list with minimal params", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.alerts.list.mockResolvedValue(mockResponse);

        await handleAlertTool("atera_alerts_list", {});

        expect(mockClient.alerts.list).toHaveBeenCalledWith({
          page: undefined,
          itemsInPage: undefined,
          alertSeverity: undefined,
          customerId: undefined,
          archived: undefined,
        });
      });
    });

    describe("atera_alerts_get", () => {
      it("should call client.alerts.get with alertId", async () => {
        const mockAlert = {
          AlertID: 456,
          Title: "High CPU Usage",
          Severity: "Warning",
        };
        mockClient.alerts.get.mockResolvedValue(mockAlert);

        const result = await handleAlertTool("atera_alerts_get", {
          alertId: 456,
        });

        expect(mockClient.alerts.get).toHaveBeenCalledWith(456);
        expect(result.content[0].text).toContain("High CPU Usage");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("atera_alerts_by_agent", () => {
      it("should call client.alerts.listByAgent with agentId and pagination", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.alerts.listByAgent.mockResolvedValue(mockResponse);

        const result = await handleAlertTool("atera_alerts_by_agent", {
          agentId: 789,
          page: 2,
          itemsInPage: 10,
        });

        expect(mockClient.alerts.listByAgent).toHaveBeenCalledWith(789, {
          page: 2,
          itemsInPage: 10,
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call client.alerts.listByAgent with only agentId", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.alerts.listByAgent.mockResolvedValue(mockResponse);

        await handleAlertTool("atera_alerts_by_agent", {
          agentId: 789,
        });

        expect(mockClient.alerts.listByAgent).toHaveBeenCalledWith(789, {
          page: undefined,
          itemsInPage: undefined,
        });
      });
    });

    describe("atera_alerts_by_device", () => {
      it("should call client.alerts.listByDevice with deviceId and pagination", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.alerts.listByDevice.mockResolvedValue(mockResponse);

        const result = await handleAlertTool("atera_alerts_by_device", {
          deviceId: 999,
          page: 1,
          itemsInPage: 50,
        });

        expect(mockClient.alerts.listByDevice).toHaveBeenCalledWith(999, {
          page: 1,
          itemsInPage: 50,
        });
        expect(result.isError).toBeUndefined();
      });

      it("should call client.alerts.listByDevice with only deviceId", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.alerts.listByDevice.mockResolvedValue(mockResponse);

        await handleAlertTool("atera_alerts_by_device", {
          deviceId: 999,
        });

        expect(mockClient.alerts.listByDevice).toHaveBeenCalledWith(999, {
          page: undefined,
          itemsInPage: undefined,
        });
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown alert tool", async () => {
        const result = await handleAlertTool("atera_alerts_unknown", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown alert tool");
      });
    });
  });
});
