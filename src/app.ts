import Fastify, { type FastifyInstance } from "fastify";
import { registerPaymentsRoute } from "./routes/payments.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerAccountsRoute } from "./routes/accounts.js";
import { PaymentGatewayClient } from "./services/payment-gateway-client.js";
import { LedgerServiceClient } from "./services/ledger-service-client.js";

export interface BuildAppOptions {
  paymentGatewayUrl: string;
  ledgerServiceUrl: string;
  fetchImpl?: typeof fetch;
}

export function buildApp(options: BuildAppOptions): FastifyInstance {
  const app = Fastify({ logger: true });

  const gatewayClient = new PaymentGatewayClient({
    baseUrl: options.paymentGatewayUrl,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
  });
  const ledgerClient = new LedgerServiceClient({
    baseUrl: options.ledgerServiceUrl,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
  });

  registerPaymentsRoute(app, gatewayClient);
  registerHealthRoute(app, gatewayClient);
  registerAccountsRoute(app, ledgerClient);

  return app;
}
