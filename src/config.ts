export interface Config {
  port: number;
  paymentGatewayUrl: string;
  ledgerServiceUrl: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 8082),
    paymentGatewayUrl: env.PAYMENT_GATEWAY_URL ?? "http://localhost:8081",
    ledgerServiceUrl: env.LEDGER_SERVICE_URL ?? "http://localhost:8080",
  };
}
