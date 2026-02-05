/**
 * Lazy-loaded Atera client utility
 *
 * Implements lazy loading pattern to defer client instantiation
 * until first use, reducing startup time and memory footprint.
 */

import type { AteraClient } from "@asachs01/node-atera";

let _client: AteraClient | null = null;

/**
 * Get or create the Atera client instance.
 * Uses lazy loading to defer instantiation until first use.
 *
 * @throws Error if ATERA_API_KEY environment variable is not set
 * @returns Promise resolving to the AteraClient instance
 */
export async function getClient(): Promise<AteraClient> {
  if (!_client) {
    const apiKey = process.env.ATERA_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ATERA_API_KEY environment variable is required. " +
          "Set it to your Atera API key from the Admin > API section."
      );
    }

    const { AteraClient } = await import("@asachs01/node-atera");
    _client = new AteraClient({ apiKey });
  }
  return _client;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetClient(): void {
  _client = null;
}
