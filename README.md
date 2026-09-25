# bff

Backend-for-frontend for [Ledger & Rail](https://github.com/yosefbennywidyo/ledger-rail),
written in Node.js + TypeScript (Fastify). The client-facing entry point:
validates the request, assigns an `idempotency_key` if the client did not send
one, and forwards the payment to `payment-gateway`.

Design notes: [`BEST_PRACTICES.md`](BEST_PRACTICES.md).

## Run

Needs a running `payment-gateway`.

```bash
npm install
npm run dev      # tsx watch — reloads on change
# or: npm run build && npm start
```

| Env var | Default |
|---|---|
| `PORT` | `8082` |
| `PAYMENT_GATEWAY_URL` | `http://localhost:8081` |

## API

| Method | Path | Notes |
|---|---|---|
| `GET` | `/healthz` | `200` when up |
| `POST` | `/api/payments` | Status mirrors payment-gateway's (`201` / `422` / `502`); `400` invalid body |

```bash
curl -i -X POST localhost:8082/api/payments -H 'content-type: application/json' -d '{
  "payer_account": "alice",
  "payee_account": "bob",
  "amount_cents": 2500
}'
```

Response: `{"idempotency_key": "...", "payment_gateway_status": 201, "result": ...}`.
Send your own `idempotency_key` to make client retries safe.

## Test

```bash
npm test
```

Unit tests need no running services. End-to-end tests live in the
superproject's [`e2e/`](https://github.com/yosefbennywidyo/ledger-rail/tree/main/e2e).

## Docker

```bash
docker build -t bff .
```

The superproject's `docker-compose.yml` builds and wires this image
(`docker compose up -d bff`).
