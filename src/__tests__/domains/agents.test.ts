/**
 * Tests for the agents domain tool handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { agentTools, handleAgentTool } from "../../domains/agents.js";

// Mock the client utility
const mockClient = {
  agents: {
    list: vi.fn(),
    get: vi.fn(),
    getByMachineName: vi.fn(),
  },
};

vi.mock("../../utils/client.js", () => ({
  getClient: vi.fn().mockResolvedValue({
    agents: {
      list: vi.fn(),
      get: vi.fn(),
      getByMachineName: vi.fn(),
    },
  }),
}));

describe("agents domain", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getClient } = await import("../../utils/client.js");
    vi.mocked(getClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof getClient>>
    );
  });

  describe("agentTools", () => {
    it("should export three agent tools", () => {
      expect(agentTools).toHaveLength(3);
    });

    it("should have atera_agents_list tool", () => {
      const listTool = agentTools.find((t) => t.name === "atera_agents_list");
      expect(listTool).toBeDefined();
      expect(listTool?.inputSchema.properties).toHaveProperty("page");
      expect(listTool?.inputSchema.properties).toHaveProperty("itemsInPage");
      expect(listTool?.inputSchema.properties).toHaveProperty("customerId");
    });

    it("should have atera_agents_get tool with required agentId", () => {
      const getTool = agentTools.find((t) => t.name === "atera_agents_get");
      expect(getTool).toBeDefined();
      expect(getTool?.inputSchema.properties).toHaveProperty("agentId");
      expect(getTool?.inputSchema.required).toContain("agentId");
    });

    it("should have atera_agents_get_by_machine tool with required machineName", () => {
      const getMachineTool = agentTools.find(
        (t) => t.name === "atera_agents_get_by_machine"
      );
      expect(getMachineTool).toBeDefined();
      expect(getMachineTool?.inputSchema.properties).toHaveProperty(
        "machineName"
      );
      expect(getMachineTool?.inputSchema.required).toContain("machineName");
    });
  });

  describe("handleAgentTool", () => {
    describe("atera_agents_list", () => {
      it("should call client.agents.list with pagination params", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.agents.list.mockResolvedValue(mockResponse);

        const result = await handleAgentTool("atera_agents_list", {
          page: 1,
          itemsInPage: 50,
        });

        expect(mockClient.agents.list).toHaveBeenCalledWith({
          page: 1,
          itemsInPage: 50,
          customerId: undefined,
        });
        expect(result.isError).toBeUndefined();
      });

      it("should filter by customerId when provided", async () => {
        const mockResponse = { items: [], totalPages: 1, page: 1 };
        mockClient.agents.list.mockResolvedValue(mockResponse);

        await handleAgentTool("atera_agents_list", {
          customerId: 123,
        });

        expect(mockClient.agents.list).toHaveBeenCalledWith({
          page: undefined,
          itemsInPage: undefined,
          customerId: 123,
        });
      });
    });

    describe("atera_agents_get", () => {
      it("should call client.agents.get with agentId", async () => {
        const mockAgent = {
          AgentID: 456,
          MachineName: "WORKSTATION-01",
          Online: true,
        };
        mockClient.agents.get.mockResolvedValue(mockAgent);

        const result = await handleAgentTool("atera_agents_get", {
          agentId: 456,
        });

        expect(mockClient.agents.get).toHaveBeenCalledWith(456);
        expect(result.content[0].text).toContain("WORKSTATION-01");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("atera_agents_get_by_machine", () => {
      it("should call client.agents.getByMachineName with machineName", async () => {
        const mockAgent = {
          AgentID: 789,
          MachineName: "SERVER-01",
          Online: true,
        };
        mockClient.agents.getByMachineName.mockResolvedValue(mockAgent);

        const result = await handleAgentTool("atera_agents_get_by_machine", {
          machineName: "SERVER-01",
        });

        expect(mockClient.agents.getByMachineName).toHaveBeenCalledWith(
          "SERVER-01"
        );
        expect(result.content[0].text).toContain("SERVER-01");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown agent tool", async () => {
        const result = await handleAgentTool("atera_agents_unknown", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown agent tool");
      });
    });
  });
});
