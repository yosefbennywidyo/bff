import { describe, expect, it, vi } from "vitest";
import { LedgerServiceClient } from "./ledger-service-client.js";

function client(fetchImpl: typeof fetch) {
  return new LedgerServiceClient({
    baseUrl: "http://localhost:8080",
    fetchImpl,
  });
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("LedgerServiceClient.createCustomer", () => {
  it("POSTs to {baseUrl}/customers and relays status/body", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(url).toBe("http://localhost:8080/customers");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(init?.body as string)).toEqual({
        name: "Alice",
        idempotency_key: "key-1",
      });
      return jsonResponse({ id: "cust-1", name: "Alice" }, 201);
    });

    const result = await client(fetchImpl as unknown as typeof fetch).createCustomer("Alice", "key-1");

    expect(result).toEqual({ status: 201, body: { id: "cust-1", name: "Alice" } });
  });

  it("translates a network failure into a 502 instead of throwing", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connection refused");
    });

    const result = await client(fetchImpl as unknown as typeof fetch).createCustomer("Alice", "key-1");

    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({ error: "ledger_service_unreachable" });
  });
});

describe("LedgerServiceClient.createAccount", () => {
  it("POSTs to {baseUrl}/accounts and relays status/body", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(url).toBe("http://localhost:8080/accounts");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(init?.body as string)).toEqual({
        customer_id: "cust-1",
        idempotency_key: "key-2",
      });
      return jsonResponse({ id: "acc-1" }, 201);
    });

    const result = await client(fetchImpl as unknown as typeof fetch).createAccount("cust-1", "key-2");

    expect(result).toEqual({ status: 201, body: { id: "acc-1" } });
  });

  it("translates a network failure into a 502 instead of throwing", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connection refused");
    });

    const result = await client(fetchImpl as unknown as typeof fetch).createAccount("cust-1", "key-2");

    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({ error: "ledger_service_unreachable" });
  });
});

describe("LedgerServiceClient.getAccount", () => {
  it("GETs {baseUrl}/accounts/{id} and relays status/body", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      expect(url).toBe("http://localhost:8080/accounts/acc-1");
      return jsonResponse({ id: "acc-1", balance_cents: 500 }, 200);
    });

    const result = await client(fetchImpl as unknown as typeof fetch).getAccount("acc-1");

    expect(result).toEqual({ status: 200, body: { id: "acc-1", balance_cents: 500 } });
  });

  it("translates a network failure into a 502 instead of throwing", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connection refused");
    });

    const result = await client(fetchImpl as unknown as typeof fetch).getAccount("acc-1");

    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({ error: "ledger_service_unreachable" });
  });
});

describe("LedgerServiceClient.listAccountTransactions", () => {
  it("GETs {baseUrl}/accounts/{id}/transactions?page=N&limit=M", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      expect(url).toBe("http://localhost:8080/accounts/acc-1/transactions?page=2&limit=10");
      return jsonResponse({ entries: [], page: 2, limit: 10, total: 0 }, 200);
    });

    const result = await client(fetchImpl as unknown as typeof fetch).listAccountTransactions(
      "acc-1",
      2,
      10,
    );

    expect(result).toEqual({
      status: 200,
      body: { entries: [], page: 2, limit: 10, total: 0 },
    });
  });

  it("translates a network failure into a 502 instead of throwing", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connection refused");
    });

    const result = await client(fetchImpl as unknown as typeof fetch).listAccountTransactions(
      "acc-1",
      1,
      20,
    );

    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({ error: "ledger_service_unreachable" });
  });
});

describe("LedgerServiceClient.closeAccount", () => {
  it("POSTs to {baseUrl}/accounts/{id}/close with {idempotency_key}", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(url).toBe("http://localhost:8080/accounts/acc-1/close");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(init?.body as string)).toEqual({ idempotency_key: "key-3" });
      return jsonResponse({ id: "acc-1", status: "closed" }, 200);
    });

    const result = await client(fetchImpl as unknown as typeof fetch).closeAccount("acc-1", "key-3");

    expect(result).toEqual({ status: 200, body: { id: "acc-1", status: "closed" } });
  });

  it("translates a network failure into a 502 instead of throwing", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connection refused");
    });

    const result = await client(fetchImpl as unknown as typeof fetch).closeAccount("acc-1", "key-3");

    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({ error: "ledger_service_unreachable" });
  });
});
