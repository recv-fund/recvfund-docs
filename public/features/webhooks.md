# Webhooks

Your server sends a signed HTTP POST to each of a project's active endpoints when a payment or payout changes state. Deliveries are written in the same database transaction as the state change, so no event is lost if the process stops, and they are retried on a schedule until the endpoint answers with a 2xx status.

## Endpoints

Endpoints are managed on the **Developers** page by owners, admins and project leads. **Add webhook** takes an **Endpoint URL** (HTTP or HTTPS; it may be on your internal network) and a description. Every active endpoint receives every event of its project. An endpoint added later does not receive past events.

Each endpoint has its own secret: 32 random bytes, stored encrypted, shown once on creation. Controls per endpoint:

- **Deactivate** / **Activate**: an inactive endpoint's deliveries wait; when it is activated again, overdue deliveries become due.
- **Rotate secret**: a new secret, shown once. Requests claimed after the rotation are signed with the new secret, so update the receiver at once.
- **Delete**: removes the endpoint and its delivery history and recalculates the affected payments' and payouts' webhook status.

## The request

`POST` with `Content-Type: application/json` and these headers:

| Header | Value |
| --- | --- |
| `X-Recv-Signature` | `sha256=` followed by the hex HMAC-SHA256 of the exact request body, keyed with the endpoint's secret string. |
| `X-Payram-Signature` | The same value, for receivers written against PayRam. |
| `X-Recv-Event` | The event name, for example `payment.filled`. |
| `X-Recv-Delivery` | The delivery ID. It does not change across retries of the same delivery. |

Verify the signature over the raw body before parsing the JSON. Deduplicate by delivery ID. Delivery is at least once and may be out of order: a receiver can process a request just before the sender times out and retries it, so treat repeats as no-ops. Amounts are decimal strings.

Redirects are not followed. Only a 2xx response counts as delivered; any other status, a 3xx, or no answer within `webhook.timeoutMs` (default 60000, 100 to 60000) is a failure. Response bodies are discarded and never logged.

## Events

| Event | When |
| --- | --- |
| `payment.confirming` | A transfer's confirmation count increased and the payment is still `OPEN`. The payload carries the current and required counts. |
| `payment.filled`, `payment.partially-filled`, `payment.over-filled` | The payment reached that state. |
| `payment.cancelled` | Cancelled from the dashboard or expired. |
| `payout.pending-approval`, `payout.approved`, `payout.initiated`, `payout.sent`, `payout.processed`, `payout.failed`, `payout.rejected`, `payout.cancelled` | The payout reached that state. |

Payment payloads carry the customer ID, invoice ID, reference, status in upper case, requested and filled amounts, currency, network, the transfers that filled it and confirmation counts. The field list and an example are in [Webhook](https://docs.recv.fund/api-integration/payments-api/webhook.md); payout fields are in [Payouts](https://docs.recv.fund/features/payouts.md#payout-webhooks). One delivery is created per endpoint per payment state, keyed by reference and status; a payout uses its ID and status.

## Retry schedule

Attempts follow `webhook.retryScheduleSeconds`. The default is `[0, 2, 4, 1800, 3600, 7200, 14400, 28800, 86400, 172800]`: an immediate attempt, then 2 s, 4 s, 30 min, 1 h, 2 h, 4 h, 8 h, 24 h and 48 h after each failure, ten attempts in all. When the list is exhausted the delivery is `failed`. The schedule accepts 1 to 20 non-decreasing delays, the first 0, each up to 604800 seconds.

A worker runs every five seconds, claims up to 50 due deliveries and sends at most five at a time. Each claim holds a lease for the timeout plus 30 seconds; if the process dies mid-request, the lease expires and the delivery is retried, and the attempt counts. A late response from a dead process cannot overwrite a newer attempt.

## Delivery log

**Delivery history** on the Developers page lists deliveries with the event, status (`pending`, `delivered`, `failed`), attempt count, last HTTP status or error, and next attempt time. **Queue retry** on a failed delivery resets its attempts and sends it again; it requires an active endpoint and no lease in progress. Payment and payout details show the same deliveries.

Each payment and payout also carries a webhook status: `pending` if any delivery is pending, else `failed` if any failed, else `received`. Payment history can be filtered by it.

## SEND_WEBHOOKS

`SEND_WEBHOOKS=false` in `/opt/recvfund/.env` stops every outgoing webhook request on the install. Deliveries are still recorded and stay queued; setting it back to `true` sends them. Use it on a staging copy of a production database so test runs do not call your production receivers. See [Advanced setup](https://docs.recv.fund/deployment-guide/advanced-setup.md).
