# Payment links

A payment is a request for a USD amount from one customer of one project. It has a reference UUID and a checkout URL. The customer opens the URL and pays with a wallet or by sending to a deposit address. Your server watches the chain, credits the payment and sends a webhook when its state changes.

## Creating a payment

**From the dashboard.** Open **Payments** and use **Create payment link**. Pick a customer with **Find customer** (search by email or customer ID); a full email address that matches no customer offers **Create customer**, which creates and selects it, enter **Amount (USD)** and optionally an **Invoice ID**. The link is shown after saving. Owners, admins and project leads can create links. Creation needs an active project, an active customer in that project, and a configured site URL (Installation → Site URL).

**From the API.** `POST /api/v1/payment` with the project's `API-Key` header creates the customer if needed and returns `reference_id` and the checkout `url`. See [Create payment](https://docs.recv.fund/api-integration/payments-api/create-payment.md).

Both paths share the same validation. A payment carries:

| Field | Rule |
| --- | --- |
| Amount | USD, positive, at most 18 integer and 6 fractional digits. Stored and returned as a decimal string. |
| Customer | A customer of the same project. Customer IDs are unique within a project. |
| Project | The project the link or key belongs to. |
| Invoice ID | Optional label, echoed in webhooks as `invoice_id`. Not unique and not an idempotency key. |
| Reference | A version 4 UUID that identifies the payment everywhere. |
| Expiry | Default `payment.expiryHours` (24 hours, configurable from 1 to 8760). The API accepts an explicit future timestamp with a timezone instead. |
| Currency and network | Optional API restriction to one currency code and one chain (`SOLANA` or `ROBINHOOD`). |
| Source | `dashboard-link` or `api`. |

The checkout URL is `{site URL}/payments?reference_id={uuid}`. Testnet installs add `&test=true`.

## States

The dashboard shows the database names. The API and webhooks use the same states in upper case.

| Dashboard | API | Meaning |
| --- | --- | --- |
| `open` | `OPEN` | Created, no confirmed funds yet. |
| `partially-filled` | `PARTIALLY_FILLED` | Confirmed funds below the requested amount. |
| `filled` | `FILLED` | Confirmed funds within `payment.fillToleranceUsd` (default 0.01 USD) of the requested amount. |
| `over-filled` | `OVER_FILLED` | Confirmed funds above the requested amount plus the tolerance. |
| `cancelled` | `CANCELLED` | Cancelled from the dashboard, or expired. |

Transitions:

- `open` becomes `filled`, `partially-filled` or `over-filled` when the confirmed USD total is compared with the requested amount.
- `partially-filled` becomes `filled` or `over-filled` when a later deposit is confirmed. A partially filled payment does not expire and keeps accepting deposits after its original expiry.
- `open` becomes `cancelled` when you cancel it or when it passes its expiry. A scheduler runs every minute and cancels up to 500 expired open payments per pass.
- Funds confirmed after cancellation still move the payment to `filled`, `partially-filled` or `over-filled`. The cancellation time is kept as history. Received funds are always recorded.

Only an `open` payment can be cancelled. If two people cancel at the same time, one succeeds and the other gets a conflict.

## Confirmations and valuation

A transfer is recorded as `detected` when it is found, and contributes no USD until it reaches the chain's confirmation threshold. The confirmation worker rechecks detected transfers every `watcher.confirmationsIntervalSeconds` (default 15 seconds) while `watcher.enabled` is true. Each new confirmation count sends a `payment.confirming` webhook. On Solana a finalized transaction counts as the configured threshold. On Robinhood Chain the receipt must belong to the canonical block when it is read.

The USD value of a transfer is the gross on-chain amount at the price fetched on first detection, rounded down to six places. That price is kept across rechecks. Stablecoins are priced at exactly 1.00 by policy. SOL and ETH use a fresh CoinGecko quote; if no fresh price is available the transfer waits and is not credited with a guessed value.

Every transfer that credits a payment is a transfer to the customer's deposit address, recorded with kind `deposit`, whether the customer paid from a connected wallet on the checkout page or sent the funds from any other wallet or exchange. The full amount arrives at the deposit address; the recv.fund fee is taken later, at [sweep](https://docs.recv.fund/features/sweeps.md). See [Customer deposit wallets](https://docs.recv.fund/features/customer-deposit-wallets.md) for how a deposit is matched to a payment.

## The checkout page

The public page `/payments?reference_id=...` uses its own layout and no dashboard session. It loads the payment, the project name, logo and brand colour, and the currencies enabled for the project whose chain has an active merchant registration. It polls the payment status every five seconds. Testnet payments carry a **Testnet** label.

1. Under **Pay with** the customer chooses a currency and network. Options show why they are unavailable when they are.
2. Selecting a currency assigns the customer's permanent deposit address on that chain and creates a quote: the exact token amount for the remaining USD, computed by dividing in base units and rounding up once. A quote lasts `payment.quoteTtlSeconds` (default 300 seconds, 30 to 3600) and is cut short by the payment's expiry or the price's freshness deadline. Stablecoin quotes use the fixed price.
3. The page shows the converted amount, the **Deposit address** and a QR code containing the address. The customer can send from any wallet or exchange. The QR encodes the destination; the customer must use the shown currency and network.
4. With an injected browser wallet (EVM or Solana), **Wallet steps** builds one transaction for the connected wallet: a plain transfer of the quoted amount to the customer's deposit address. On Robinhood Chain it is an ERC-20 `transfer` or an ETH transfer, with no approval step. On Solana it is a SOL transfer, or for an SPL token an instruction that creates the deposit token account if it is missing (paid by the customer) followed by the token transfer. Every currency can be paid this way, SOL included. No recv.fund contract or program instruction runs. WalletConnect is not available in this release; only injected wallets are supported.
5. After the wallet sends the transaction, the browser submits its hash to the server, which reads the transaction from the chain and verifies that it contains a transfer of the selected currency to the customer's deposit address before recording anything. The page shows "Transaction submitted. Payment status updates after network verification." No browser claim marks a payment paid. If the browser closes before submitting the hash, the deposit watcher finds the transfer like any other deposit.

The currency cannot be changed once any transfer has been recorded. A closed, expired or unavailable payment cannot be quoted or prepared for wallet payment. The checkout progress stages are `waiting`, `sent`, `confirming`, `complete` and `cancelled`. A project's custom CSS is stored but not applied to the checkout page in this release. The endpoints behind the page are documented under [Checkout endpoints](https://docs.recv.fund/api-integration/checkout-endpoints.md).

## Partial and over payment

The credited total is the sum of all confirmed transfers, in every currency the customer used. A total below the requested amount leaves the payment `partially-filled`; a later deposit can complete it. A total above the requested amount plus the tolerance makes it `over-filled`. The excess is recorded on the payment and in the customer's history. There is no refund function in this release; if you want to return the excess, create a [payout](https://docs.recv.fund/features/payouts.md).

## History and details

**Payment history** on the Payments page lists the current project's payments, or all accessible projects. Filters: text search over invoice ID, reference and customer, status, webhook status, chain and currency, source, and inclusive created-date bounds, with sorting and pagination. The summary line counts open (including partially filled), closed (filled and over-filled) and cancelled payments.

**Payment details** shows the state, expiry, checkout link, the latest 100 transactions with their hashes, and the latest 100 webhook deliveries with attempts and results. **Cancel payment** is available while the payment is `open`.

## CSV export

**Export CSV** downloads the rows matching the current filters. Exports are capped at 10,000 rows; narrow the filters if the cap is reached. Values that a spreadsheet would read as a formula are neutralised. All roles that can read payments, including project managers, can export.

## Related

- [Payment status](https://docs.recv.fund/api-integration/payments-api/payment-status.md) for reading a payment from the API.
- [Webhooks](https://docs.recv.fund/features/webhooks.md) for the events sent on each transition.
- [Take a test payment](https://docs.recv.fund/onboarding-guide/test-payment.md).
