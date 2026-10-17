import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { LedgerServiceClient } from "../services/ledger-service-client.js";

const createCustomerSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1 },
    idempotency_key: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
} as const;

const createAccountSchema = {
  type: "object",
  required: ["customer_id"],
  properties: {
    customer_id: { type: "string", minLength: 1 },
    idempotency_key: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
} as const;

const closeAccountSchema = {
  type: "object",
  properties: {
    idempotency_key: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
} as const;

const listTransactionsQuerySchema = {
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1 },
    limit: { type: "integer", minimum: 1 },
  },
  additionalProperties: false,
} as const;

export function registerAccountsRoute(
  app: FastifyInstance,
  ledgerClient: LedgerServiceClient,
): void {
  app.post<{ Body: { name: string; idempotency_key?: string } }>(
    "/api/customers",
    { schema: { body: createCustomerSchema } },
    async (request, reply) => {
      const idempotencyKey = request.body.idempotency_key ?? randomUUID();
      const result = await ledgerClient.createCustomer(request.body.name, idempotencyKey);
      reply.code(result.status);
      return result.body;
    },
  );

  app.post<{ Body: { customer_id: string; idempotency_key?: string } }>(
    "/api/accounts",
    { schema: { body: createAccountSchema } },
    async (request, reply) => {
      const idempotencyKey = request.body.idempotency_key ?? randomUUID();
      const result = await ledgerClient.createAccount(request.body.customer_id, idempotencyKey);
      reply.code(result.status);
      return result.body;
    },
  );

  app.get<{ Params: { id: string } }>("/api/accounts/:id", async (request, reply) => {
    const result = await ledgerClient.getAccount(request.params.id);
    reply.code(result.status);
    return result.body;
  });

  app.get<{ Params: { id: string }; Querystring: { page?: number; limit?: number } }>(
    "/api/accounts/:id/transactions",
    { schema: { querystring: listTransactionsQuerySchema } },
    async (request, reply) => {
      const page = request.query.page ?? 1;
      const limit = request.query.limit ?? 20;
      const result = await ledgerClient.listAccountTransactions(request.params.id, page, limit);
      reply.code(result.status);
      return result.body;
    },
  );

  app.post<{ Params: { id: string }; Body: { idempotency_key?: string } }>(
    "/api/accounts/:id/close",
    { schema: { body: closeAccountSchema } },
    async (request, reply) => {
      const idempotencyKey = request.body.idempotency_key ?? randomUUID();
      const result = await ledgerClient.closeAccount(request.params.id, idempotencyKey);
      reply.code(result.status);
      return result.body;
    },
  );
}
