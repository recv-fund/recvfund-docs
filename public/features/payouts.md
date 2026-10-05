# Payouts

A payout sends a token amount from a project's hot wallet to an address. It is a direct transfer signed by the hot wallet; it does not go through the recv.fund program and does not need a merchant registration. Payouts are created in the dashboard or through the [Payouts API](https://docs.recv.fund/api-integration/payouts-api.md), approved by an administrator with an emailed one-time code, and then signed, sent and confirmed by a worker on your server.

## Before the first payout

- Configure SMTP under Installation → **Email delivery** and send a **Test email**. Approval codes are sent by email; without SMTP, approval fails.
- Assign an active hot wallet to the project for the chain's family, holding the token to send and the native currency for fees. See [Hot wallet](https://docs.recv.fund/onboarding-guide/hot-wallet.md).
- Set the project's [withdrawal policy](https://docs.recv.fund/features/multi-brand-projects.md#withdrawal-policy) if the install defaults do not fit.

## Address book

**Address book** stores payout destinations per project: **Recipient name**, **Recipient email**, chain, **Destination address** and optional notes (up to 2000 characters). The address is validated and canonicalised for the chain without an RPC call; the EVM zero address is rejected. A destination can be saved once per project and chain; save a separate recipient for another chain, because the chain of a saved recipient cannot be changed. A project can hold up to 10,000 recipients.

Owners, admins and project leads add, edit and remove recipients in a selected project. Project managers read. Project operators have no access. Removal asks for confirmation. Address-book changes send no email and no transaction. A payout copies the recipient's address and email when it is created, so editing or deleting the recipient later cannot redirect it.

## Creating a payout

**Payouts** → **Request payout**: choose the **Payout chain** and **Payout currency**, then either **Find saved recipient** or **Enter destination** with a recipient email and address, and the **Payout amount (token units)**. Convert from USD yourself if needed; there is no price endpoint in this release. Owners, admins and project leads create requests; project managers read; project operators have no access.

At creation the server:

- Values the amount in USD with a fresh price (stablecoins at 1.00), rounded down to six places. Without a fresh price the request is refused.
- Checks the minimum: the project's **Minimum (USD)**, or `payout.minimumUsd` (default 1).
- Checks the **Hourly** and **Daily limit per recipient (USD)**: all unfinished requests for that recipient email in the project count against the limit, whatever their age, and processed payouts count within the rolling window.
- Reserves the amount against the hot wallet's live balance minus every unfinished payout on that wallet, chain and currency, across projects, so two requests cannot promise the same funds.
- Rejects a payout to the hot wallet itself.
- Refuses a duplicate: the same project, chain, currency, destination and amount within `payout.duplicateWindowSeconds` (default 300) returns a conflict, unless the request carries an `Idempotency-Key`. With a key, a repeat returns the original payout and a changed payload returns a conflict.

Amounts are exact decimal strings and cannot exceed the token's decimals.

## Approval

Every dashboard request needs an administrator's one-time code. A request made by an owner or admin starts as `pending-otp-verification`; one made by a project lead starts as `pending-approval`. In **Payout details** the administrator requests a code. The email states the amount, currency, chain and destination it approves. The administrator enters the **Approval code** and clicks **Approve payout**.

- Codes have `auth.otp.codeLength` digits (default 6), last `auth.otp.ttlSeconds` (default 600) and allow `auth.otp.maxVerifyAttempts` wrong entries (default 5). An administrator can request one code per minute and ten per hour. A new code for the same payout replaces the previous one.
- The code is bound to the administrator, the payout and its asset terms. Approval fetches a fresh price and rechecks the minimum, limits, wallet assignment and balance before consuming the code. A wrong code counts as an attempt; a consumed code cannot be reused.
- Owners and admins can **Reject payout** with an optional reason. The creator or an administrator can **Cancel payout** until the transaction is signed. Rejected and cancelled payouts release their reservations.

API payouts follow the project's automatic approval policy: when it is enabled and the fresh USD value is at or below the maximum, the payout is approved without a code and enters the queue. Otherwise it waits as `pending-approval` for a dashboard administrator. Automatic approval never overrides the minimum, limits or balance checks.

## Execution

A worker runs every `watcher.confirmationsIntervalSeconds` (default 15 seconds) while `watcher.enabled` is true and handles up to 20 payouts per pass. For each approved payout it locks the wallet, rechecks the approved terms and assignment, builds the transfer (native value or ERC-20 `transfer` on Robinhood Chain; a System Program transfer or an SPL `transferChecked` with recipient token account creation on Solana), signs it with the decrypted hot wallet key and stores the signed transaction encrypted, with its hash, before any broadcast. Signing is serialised with [sweeps](https://docs.recv.fund/features/sweeps.md) on the same wallet. On Solana every payout carries a unique memo, so two identical payouts never share a signature.

The payout is marked `initiated` before the send. Broadcast goes to one RPC node with one attempt; an uncertain response is retried only by resending the identical bytes. Once the transaction is included and confirmed, the worker verifies the exact sender, recipient, asset and amount from the receipt and records the actual network fee. The approved amount and destination are never changed by the worker. If the signed transaction cannot be found or proved, the payout keeps its hash and reservation for manual review; it is not rebuilt with a new nonce or blockhash.

An inactive project, chain or wallet pauses new sends; confirmation of an already sent transaction continues. A pre-signing failure such as insufficient funds marks the payout `failed`; an RPC failure leaves it to retry.

## States

| State | Meaning |
| --- | --- |
| `pending-otp-verification` | Created by an owner or admin; waiting for their code. |
| `pending-approval` | Created by a project lead or by the API above the automatic limit; waiting for an administrator. |
| `pending` | Approved; waiting for the worker. |
| `initiated` | Signed and a broadcast attempted. The hash is set; the outcome may still be uncertain. Cannot be cancelled. |
| `sent` | Included and confirmed on chain with matching proof. The network fee is recorded. |
| `processed` | Final pass after confirmation. Reservations are released. |
| `failed` | Pre-signing validation failed, or the transaction failed on chain. `failureReason` says why. |
| `rejected` | Refused by an administrator. |
| `cancelled` | Withdrawn by the creator or an administrator before signing. |

`processed`, `failed`, `rejected` and `cancelled` are terminal.

## Payout history

**Payout history** has two tabs, **Requests** and **Processed and closed**, with search over email, destination and transaction hash, status and date filters, and metrics for in-process, completed and total USD. **Payout details** shows the transaction hash, native network fee, confirmation and processing times and the webhook delivery summary, and polls every ten seconds while work is pending. API payouts appear here as well.

## Payout webhooks

Each transition writes one delivery per active endpoint in the same transaction as the state change. Events: `payout.pending-approval`, `payout.approved`, `payout.initiated`, `payout.sent`, `payout.processed`, `payout.failed`, `payout.rejected`, `payout.cancelled`. The payload carries the payout ID, network, token, amount, USD value, email, address, sender, transaction hash, status in upper case, timestamps and failure reason, plus the native fee once known. Deliveries can arrive more than once or out of order; deduplicate by payout ID, state and delivery ID. Headers, signing and retries are the same as for payments; see [Webhooks](https://docs.recv.fund/features/webhooks.md).

## Not in this release

Operator resolution of a signed transaction whose outcome stays unknown, and reconciliation after a deep chain reorganisation, are not implemented. Such payouts stay visible with their hash for manual review.
