import type { GatewayResult } from "./payment-gateway-client.js";

export interface LedgerServiceClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

/**
 * Calls ledger-service directly for account/customer management — bypassing
 * payment-gateway, which stays scoped to the payments domain (fraud-check).
 */
export class LedgerServiceClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: LedgerServiceClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async createCustomer(name: string, idempotencyKey: string): Promise<GatewayResult> {
    return this.request("POST", "/customers", { name, idempotency_key: idempotencyKey });
  }

  async createAccount(customerId: string, idempotencyKey: string): Promise<GatewayResult> {
    return this.request("POST", "/accounts", {
      customer_id: customerId,
      idempotency_key: idempotencyKey,
    });
  }

  async getAccount(accountId: string): Promise<GatewayResult> {
    return this.request("GET", `/accounts/${accountId}`);
  }

  async listAccountTransactions(
    accountId: string,
    page: number,
    limit: number,
  ): Promise<GatewayResult> {
    return this.request("GET", `/accounts/${accountId}/transactions?page=${page}&limit=${limit}`);
  }

  async closeAccount(accountId: string, idempotencyKey: string): Promise<GatewayResult> {
    return this.request("POST", `/accounts/${accountId}/close`, {
      idempotency_key: idempotencyKey,
    });
  }

  /**
   * Shared request path: a network failure (fetchImpl throws) becomes a 502
   * rather than throwing, so callers always get a status/body pair to relay.
   */
  private async request(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<GatewayResult> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        ...(body !== undefined
          ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
    } catch (err) {
      return {
        status: 502,
        body: {
          error: "ledger_service_unreachable",
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }

    const responseBody = await response.json().catch(() => null);
    return { status: response.status, body: responseBody };
  }
}
