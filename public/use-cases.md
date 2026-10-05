# Use cases

## Apps on Robinhood Chain

Take USDG from Robinhood users and receive it in your own wallet. Robinhood Chain is the first chain recv.fund supports. Your checkout page builds one plain token transfer from the customer's wallet to the customer's deposit address; the customer signs it in their wallet. Your server credits the payment once the transfer is confirmed and sweeps the balance to your settlement wallet.

What you use: the hosted checkout page or the [Payments API](https://docs.recv.fund/api-integration/payments-api/index.md), webhooks, and the dashboard.

## Businesses whose customers pay from an exchange

Digital goods, hosting, SaaS, marketplaces, gaming. Your customers withdraw from an exchange account rather than connect a wallet. They need an address to send to, not a button to click.

recv.fund gives every customer a permanent deposit address per chain. The customer sends any amount, from any exchange or wallet. Your server watches the address, credits the payment, and sweeps the balance to your settlement wallet on the triggers you set.

What you use: [Assign deposit address](https://docs.recv.fund/api-integration/payments-api/assign-deposit-address.md), [Customer deposit wallets](https://docs.recv.fund/features/customer-deposit-wallets.md), [Sweeps](https://docs.recv.fund/features/sweeps.md).

## Stores

Stores that already accept crypto through a hosted gateway and want the funds to arrive in their own wallet instead. Create payment links from the dashboard, or create payments from your store's backend with one API call and redirect the customer to the checkout URL. Confirm the order from the `FILLED` webhook.

What you use: [Payment links](https://docs.recv.fund/features/payment-links.md), [Create payment](https://docs.recv.fund/api-integration/payments-api/create-payment.md), [Webhook](https://docs.recv.fund/api-integration/payments-api/webhook.md).

## Agencies and marketplaces (later)

Agencies that deploy under their own brand for the merchants they serve, and marketplaces that pay out to many recipients. Operator mode, which lets one install manage several merchants with a markup, is planned and not part of this release. See [Operator mode](https://docs.recv.fund/features/operator-mode.md). Today one install serves one business with any number of [projects](https://docs.recv.fund/features/multi-brand-projects.md).
