# Build a payment integration

Your application server stores a project API key. Browser code receives only the returned checkout URL and your own order identifier. Never embed `API-Key`, a webhook secret, JWT, admin key or private key in public JavaScript.

## 1. Create an invoice on your backend

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$RECV_ORIGIN/api/v1/payment" \
  -H "API-Key: $RECV_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "customerEmail":"buyer@example.com",
    "customerID":"customer-123",
    "amountInUSD":"10.000000",
    "invoiceID":"order-123"
  }'
```

A successful response is HTTP 201 with `{host, reference_id, url}`. Store `reference_id` against your order **before** returning the URL to the browser. Amounts are exact decimal strings, with at most six fractional USD digits. Optional `currency` and `network` restrict the invoice to an enabled combination discovered from your installation.

`invoiceID` is a label, not a deduplication guarantee. Serialize creation per order in your application and record a durable attempt. A timeout after POST might mean the invoice was created: mark the attempt uncertain, reconcile the merchant history, and do not issue a blind second POST.

## 2. Send the customer to the returned URL

Use `url` exactly as returned from your trusted instance. Hosted checkout handles selection, exact quotes, wallet transfer preparation and confirmation. A success redirect is a user-navigation signal; it cannot authorize fulfillment.

If you build checkout yourself, use [checkout endpoints](https://docs.recv.fund/api-integration/checkout-endpoints.md) and bind signing to the current `quoteId`. Quotes can expire or be invalidated by a partial payment. Re-read before signing. Do not derive a token amount from a stale page or use floating-point arithmetic.

## 3. Verify server-side status

```bash
curl --fail-with-body --silent --show-error \
  -H "API-Key: $RECV_API_KEY" \
  "$RECV_ORIGIN/api/v1/payment/reference/$REFERENCE_ID"
```

| `paymentState` | Merchant action |
| --- | --- |
| `OPEN` | Await payment or network confirmations. No fulfillment. |
| `PARTIALLY_FILLED` | Display the confirmed shortfall; do not fulfill a full order. |
| `FILLED` | Eligible for your order's fulfillment policy after identity/amount checks. |
| `OVER_FILLED` | Eligible for fulfillment; route surplus handling through your own reviewed policy. |
| `CANCELLED` | Do not request another transfer to this invoice. |

Validate reference, expected customer, invoice/order mapping, currency/network restrictions and expected amount. The server's fill tolerance can classify a small shortfall as filled. If your business needs exact payment with no tolerance, additionally compare `filledAmountInUSD` to the amount due using a decimal library. Never trust a client-supplied amount or state. Checkout state strings use kebab-case; the merchant API uses uppercase.

## 4. Accept signed webhooks

Configure endpoints in Developers. Webhook secrets are separate from API keys and are shown once. The signature is HMAC-SHA256 over the **raw request bytes**, with the displayed secret string as the key.

Download the [Node signature-verification helper](https://docs.recv.fund/examples/verify-webhook.mjs). It uses Node's built-in crypto module and rejects malformed signatures before constant-time comparison:

```js
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyRecvWebhook(rawBody, signature, secret) {
  if (!Buffer.isBuffer(rawBody) || !secret ||
      typeof signature !== 'string' ||
      !/^sha256=[0-9a-f]{64}$/.test(signature)) return false;
  const supplied = Buffer.from(signature.slice(7), 'hex');
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  return timingSafeEqual(supplied, expected);
}
```

Use a raw-body handler before JSON middleware. Reject a bad `X-Recv-Signature` with HTTP 400. Limit the body size, validate the payload after verification, and use `X-Recv-Delivery` as the delivery deduplication key. This header is not part of the signed body, so also guard fulfillment by the immutable payment reference and your order state.

In one database transaction: insert the delivery if new, insert a durable processing job/outbox event, commit. Then return HTTP 2xx promptly. A worker fetches authoritative payment status and changes an unfulfilled order to fulfilled once, atomically. Use a unique order/payment constraint and an outbox for external fulfillment side effects. A memory-only Set is not sufficient.

Events may arrive multiple times or out of order. An older `OPEN` event must never downgrade an order already fulfilled. The webhook signature has no signed delivery timestamp; durable deduplication and current-state reconciliation are required against replay. Do not reject a legitimately delayed retry using the event creation timestamp alone.

## 5. Keep payouts separately authorized

A project key can request payouts; it is **not read-only** or scoped to payment creation. Do not give it to untrusted agents or expose a general proxy endpoint to the browser. For an explicitly authorized payout, generate and durably store one `Idempotency-Key`, use token-unit decimal strings, and reuse the same key and exact terms across transport retries. A changed request under the same key returns 409. Pending approval/OTP states must be completed by an authorized human through the dashboard.

## Errors and retries

| Result | Response |
| --- | --- |
| 400 | Correct validation or contract mismatch; do not retry unchanged |
| 401/403 | Check credential type, active project/key and permission; do not escalate to admin credentials |
| 404 | Check instance version, path and project ownership |
| 409 | Refresh authoritative state; inspect quote, duplicate or idempotency conflict |
| 429 | Bounded exponential backoff with jitter for safe reads; avoid hammering |
| 5xx / timeout | Safe reads can retry; classify writes by idempotency and reconcile uncertain attempts |

See the [API integration reference](https://docs.recv.fund/api-integration/introduction.md) for exact request/response fields. OpenAPI on the running instance is authoritative for route availability; older generic schemas should be read together with these field tables.
