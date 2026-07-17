/**
 * MCP Apps (SEP-1865) contract tests — mirrors the checks an MCP Apps host
 * performs to render the ticket card:
 *   1. renderable tools advertise the UI resource via _meta
 *   2. the ui:// resource lists and reads back as profile=mcp-app HTML
 *   3. buildTicketCard normalizes an Atera ticket into the card payload
 *      the iframe renders from, with a safe internal-only comment default
 */

import { describe, it, expect, vi } from "vitest";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { customerTools } from "../domains/customers.js";
import { agentTools } from "../domains/agents.js";
import { ticketTools } from "../domains/tickets.js";
import { alertTools } from "../domains/alerts.js";
import { contactTools } from "../domains/contacts.js";
import { listResources, readResource } from "../resources.js";
import {
  buildTicketCard,
  applyBrandInjection,
  TICKET_CARD_RESOURCE_URI,
  MCP_APP_RESOURCE_MIME,
} from "../card.builder.js";
import { TICKET_CARD_HTML } from "../generated/ticket-card-html.js";

const RENDERABLE_TOOLS = ["atera_tickets_get", "atera_tickets_add_comment"];

function getAllTools(): Tool[] {
  return [
    ...customerTools,
    ...agentTools,
    ...ticketTools,
    ...alertTools,
    ...contactTools,
  ];
}

describe("MCP Apps ticket card", () => {
  describe("tool _meta advertisement", () => {
    it.each(RENDERABLE_TOOLS)("%s links the card via _meta", (name) => {
      const tool = getAllTools().find((t) => t.name === name);
      expect(tool).toBeDefined();
      // Canonical flat key (ext-apps RESOURCE_URI_META_KEY) …
      expect(tool?._meta?.["ui/resourceUri"]).toBe(TICKET_CARD_RESOURCE_URI);
      // … and the nested form registerAppTool also emits.
      expect((tool?._meta?.ui as { resourceUri?: string })?.resourceUri).toBe(
        TICKET_CARD_RESOURCE_URI
      );
    });

    it("no other tools carry UI metadata", () => {
      const others = getAllTools().filter(
        (t) => t._meta && !RENDERABLE_TOOLS.includes(t.name)
      );
      expect(others).toEqual([]);
    });
  });

  describe("ui:// resource", () => {
    it("is listed with the MCP Apps MIME type", () => {
      const card = listResources().find(
        (r) => r.uri === TICKET_CARD_RESOURCE_URI
      );
      expect(card?.mimeType).toBe(MCP_APP_RESOURCE_MIME);
    });

    it("reads back as profile=mcp-app HTML containing the card app", () => {
      const content = readResource(TICKET_CARD_RESOURCE_URI);
      expect(content.mimeType).toBe(MCP_APP_RESOURCE_MIME);
      // No MCP_BRAND_* env set → the embedded HTML is served byte-identical.
      expect(content.text).toBe(TICKET_CARD_HTML);
      expect(content.text).toContain("card__bar");
      expect(content.text).toContain("BRAND_INJECT");
      // The vite build must have inlined the bridge script — a bare <script src>
      // would be unloadable from a resources/read HTML string.
      expect(content.text).not.toContain('src="./ticket-card.ts"');
    });

    it("serves neutral defaults with no vendor identity", () => {
      const { text } = readResource(TICKET_CARD_RESOURCE_URI);
      expect(text).not.toMatch(/WYRE/i);
      expect(text).not.toContain("00c9db"); // WYRE cyan
      expect(text).not.toContain("ede947"); // WYRE yellow
      expect(text).not.toContain("fonts.googleapis.com"); // no external fetches
    });

    it("injects MCP_BRAND_* env vars into the served HTML", () => {
      vi.stubEnv("MCP_BRAND_NAME", "Acme MSP");
      vi.stubEnv("MCP_BRAND_PRIMARY_COLOR", "#ff0000");
      try {
        const { text } = readResource(TICKET_CARD_RESOURCE_URI);
        expect(text).toContain(
          '<script>window.__BRAND__={"name":"Acme MSP","primaryColor":"#ff0000"}</script>'
        );
        expect(text).not.toContain("BRAND_INJECT");
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it("rejects unknown resource URIs", () => {
      expect(() => readResource("ui://atera/nope.html")).toThrow(
        /Unknown resource/
      );
    });
  });

  describe("applyBrandInjection", () => {
    const html = TICKET_CARD_HTML;

    it("replaces the marker with an inline window.__BRAND__ script", () => {
      const out = applyBrandInjection(html, {
        name: "Acme",
        primaryColor: "#123456",
      });
      expect(out).toContain(
        'window.__BRAND__={"name":"Acme","primaryColor":"#123456"}'
      );
      expect(out).not.toContain("BRAND_INJECT");
    });

    it("escapes < so brand values cannot break out of the script tag", () => {
      const out = applyBrandInjection(html, {
        name: "</script><script>alert(1)",
      });
      expect(out).not.toContain("</script><script>alert(1)");
      expect(out).toContain("\\u003c/script>\\u003cscript>alert(1)");
    });

    it("returns the HTML unchanged for an empty brand", () => {
      expect(applyBrandInjection(html, {})).toBe(html);
      expect(applyBrandInjection(html, { name: "" })).toBe(html);
    });
  });

  describe("buildTicketCard", () => {
    const ticket = {
      TicketID: 4821,
      TicketTitle: "VPN outage — main office",
      TicketStatus: "Open",
      TicketPriority: "High",
      CustomerID: 12,
      CustomerName: "Acme Corp",
      TechnicianContactID: 7,
      TechnicianFullName: "Dana Ruiz",
      SLAStatus: "Within SLA",
      CreatedDate: "2026-07-17T09:00:00Z",
      DueDate: "2026-07-18T17:00:00Z",
    };

    const mockListComments = vi.fn(async () => ({
      totalItemCount: 1,
      page: 1,
      itemsInPage: 1,
      totalPages: 1,
      prevLink: null,
      nextLink: null,
      items: [
        {
          CommentID: 1,
          TicketID: 4821,
          Comment: "Assigned to network team",
          Date: "2026-07-17T09:30:00Z",
          IsInternal: true,
          CreatorName: "Dana Ruiz",
          CreatorEmail: "dana@example.com",
        },
      ],
    }));
    const client = { tickets: { listComments: mockListComments } };

    it("normalizes labels, names, and comments into the card payload", async () => {
      const card = await buildTicketCard(ticket, client as never);
      expect(card).toMatchObject({
        id: 4821,
        title: "VPN outage — main office",
        status: "Open",
        priority: "High",
        customer: "Acme Corp",
        technician: "Dana Ruiz",
        sla: "Within SLA",
        created: "2026-07-17T09:00:00Z",
        dueDate: "2026-07-18T17:00:00Z",
        comments: [
          { who: "Dana Ruiz", comment: "Assigned to network team", internal: true },
        ],
      });
    });

    it("defaults the add-comment round-trip to internal-only visibility", async () => {
      const card = await buildTicketCard(ticket, client as never);
      expect(card?.commentDefaults).toEqual({ isInternal: true });
    });

    it("falls back to #id labels when the API omits resolved names", async () => {
      const bare = {
        TicketID: 1,
        TicketTitle: "Printer down",
        CustomerID: 44,
        TechnicianContactID: 9,
      };
      const card = await buildTicketCard(bare, client as never);
      expect(card?.customer).toBe("#44");
      expect(card?.technician).toBe("#9");
      expect(card?.status).toBeUndefined();
    });

    it("truncates long comments so the card payload stays small", async () => {
      mockListComments.mockResolvedValueOnce({
        totalItemCount: 1,
        page: 1,
        itemsInPage: 1,
        totalPages: 1,
        prevLink: null,
        nextLink: null,
        items: [
          {
            CommentID: 2,
            TicketID: 4821,
            Comment: "x".repeat(600),
            Date: "2026-07-17T10:00:00Z",
            IsInternal: false,
            CreatorName: "Bot",
            CreatorEmail: "bot@example.com",
          },
        ],
      });
      const card = await buildTicketCard(ticket, client as never);
      expect(card?.comments).toHaveLength(1);
      expect(card?.comments[0].comment).toHaveLength(500);
      expect(card?.comments[0].internal).toBe(false);
    });

    it("returns null for payloads that are not a ticket", async () => {
      expect(await buildTicketCard({ TicketID: 1 }, client as never)).toBeNull();
      expect(
        await buildTicketCard({ TicketTitle: "no id" }, client as never)
      ).toBeNull();
    });

    it("survives comment-fetch failures (card is best-effort)", async () => {
      const failing = {
        tickets: {
          listComments: vi.fn(async () => {
            throw new Error("Atera 500");
          }),
        },
      };
      const card = await buildTicketCard(ticket, failing as never);
      expect(card).toMatchObject({ id: 4821, comments: [] });
      expect(card?.status).toBe("Open");
    });
  });
});
