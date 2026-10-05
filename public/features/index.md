# Features

recv.fund runs on your own server. It gives you a dashboard, a hosted checkout page at `/payments`, a JSON API with `API-Key` authentication, and signed webhooks. Every customer payment goes to a permanent deposit address for that customer, derived from your on-chain merchant registration: the customer either signs one transfer from a connected wallet on the checkout page, or sends the funds from any wallet or exchange. Deposit balances are moved to your settlement wallet by sweeps, which is where the recv.fund fee is taken. Payouts are sent from a hot wallet whose key is stored encrypted on your server. Everything below is scoped to a project, so one install can serve several brands.

| Feature | What it covers |
| --- | --- |
| [Payment links](https://docs.recv.fund/features/payment-links.md) | Creating payments from the dashboard or the API, the checkout page the customer sees, payment states, history and CSV export. |
| [Customer deposit wallets](https://docs.recv.fund/features/customer-deposit-wallets.md) | Permanent per-customer deposit addresses derived from your merchant registration, how deposits are credited, unmatched deposits and missed-payment rechecks. |
| [Projects](https://docs.recv.fund/features/multi-brand-projects.md) | Branding, enabled currencies, payout policy, API keys and webhook endpoints per project, and project-scoped roles. |
| [API keys](https://docs.recv.fund/features/api-keys.md) | Creating and revoking project keys, the `API-Key` header, scope and rate limits. |
| [User management](https://docs.recv.fund/features/user-management.md) | Roles, invitations with a temporary password, deactivation, session revocation and the activity log. |
| [Analytics](https://docs.recv.fund/features/analytics.md) | The overview page: confirmed receipts, date presets, first-time and returning payers. |
| [Payouts](https://docs.recv.fund/features/payouts.md) | Address book, payout requests, approval by email code, USD limits, execution from the hot wallet and payout webhooks. |
| [Sweeps](https://docs.recv.fund/features/sweeps.md) | Moving deposit balances to the settlement wallet: activation threshold, triggers, automatic scheduling, manual sweeps and the fee. |
| [Webhooks](https://docs.recv.fund/features/webhooks.md) | Endpoints per project, signature headers, retry schedule, delivery log and the `SEND_WEBHOOKS` switch. |
| [Operator mode](https://docs.recv.fund/features/operator-mode.md) | Planned. What one install can do today. |
