# Networks and tokens

recv.fund supports two chains. Each exists as a mainnet and a testnet row in the install's chain catalog. `NETWORK_TYPE`, chosen at install time, selects which rows the install uses; the other rows are present but unused.

## Networks

| Chain | Code | Network type | Network | RPC endpoint seeded | Explorer |
| --- | --- | --- | --- | --- | --- |
| Solana | `SOLANA` | `mainnet` | mainnet-beta | `https://api.mainnet-beta.solana.com` | `https://solscan.io` |
| Solana | `SOLANA` | `testnet` | devnet | `https://api.devnet.solana.com` | `https://solscan.io` with `cluster=devnet` |
| Robinhood Chain | `ROBINHOOD` | `mainnet` | chain id 4663 | `https://rpc.mainnet.chain.robinhood.com` | `https://robinhoodchain.blockscout.com` |
| Robinhood Chain | `ROBINHOOD` | `testnet` | chain id 46630 | `https://rpc.testnet.chain.robinhood.com` | `https://explorer.testnet.chain.robinhood.com` |

The chain code is what the API uses in `network` and `blockchainCode` fields. Robinhood Chain is an Arbitrum Orbit L2 (EVM-equivalent); Solana is its own family. The Robinhood Chain URLs and chain ids were checked against Robinhood's wallet network configuration page on 2026-09-26.

## RPC nodes

The seeded endpoints are public and free. They are active and not marked preferred. You can add up to ten nodes per chain under Settings, Nodes, mark one as preferred, and remove or disable the seeded ones. Every read validates the node's chain id (EVM) or genesis hash (Solana) before use, so a node on the wrong network cannot supply balances. Reads fall back to the next node on failure; signing and broadcasting use one node and never fall back. See [Node configuration](https://docs.recv.fund/onboarding-guide/node-configuration.md).

Nodes must retain the history the watchers need to catch up after downtime. On Robinhood Chain, ETH sent directly to a deposit address, by hand or from a connected wallet at checkout, is credited through any node. ETH that a smart contract (for example some exchange wallets) forwards to a deposit address inside another transaction is credited only through a node that supports `debug_traceTransaction` and `debug_traceBlockByHash` with the call tracer; the public Robinhood Chain endpoint and some providers' free plans do not. ERC-20 payments need neither.

## Tokens

| Currency | Chain | Network type | Standard | Token address | Decimals |
| --- | --- | --- | --- | --- | --- |
| USDC | Solana | `mainnet` | SPL | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | 6 |
| USDT | Solana | `mainnet` | SPL | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | 6 |
| SOL | Solana | `mainnet` and `testnet` | native | none | 9 |
| USDC | Solana | `testnet` (devnet) | SPL | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | 6 |
| USDG | Robinhood Chain | `mainnet` | ERC-20 | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` | 6 |
| USDG | Robinhood Chain | `testnet` | ERC-20 | `0x7E955252E15c84f5768B83c41a71F9eba181802F` | 6 |
| ETH | Robinhood Chain | `mainnet` and `testnet` | native | none | 18 |

USDT is not seeded on Solana devnet, so a testnet install offers USDC and SOL on Solana and USDG and ETH on Robinhood Chain.

The USDC addresses match Circle's published list and the USDG addresses match Paxos's documentation; see [Links](https://docs.recv.fund/support/links.md). Token-2022 mints and extension mints are not supported on Solana. Once a merchant registration has started, a currency's token address and decimals cannot be edited; the currency can still be enabled or disabled.

Each project chooses which of these currencies to offer at checkout. A currency appears on the checkout page only if it is enabled for the project and the project has an active merchant registration on its chain.

## Native coins

SOL and ETH have two roles.

- Transaction fees. Every sweep and payout is signed by the project's hot wallet, which pays the network fee in the native coin. Keep the hot wallet funded. On Robinhood Chain the first sweep of a deposit address also deploys its forwarder contract, which costs more gas than later sweeps. On Solana, the first token deposit for a customer also needs rent for the deposit token account, which the sender's wallet normally pays (a wallet payment from the checkout page creates the account itself); the sweep closes that account and returns the rent to the hot wallet.
- Payment currencies. Both can be enabled for a project. Both can be paid from a connected wallet on the checkout page, as a plain transfer to the customer's deposit address, or sent to that address from any wallet or exchange.

Prices for SOL and ETH come from CoinGecko, cached for 60 seconds by default. The stablecoins are priced at exactly 1.00 USD.

## Confirmations

| Chain | Default confirmations | How it is counted |
| --- | --- | --- |
| Solana | 1 | A transaction at `confirmed` commitment counts as 1; `finalized` counts as the configured threshold. |
| Robinhood Chain | 12 | Latest block minus the transaction's block, plus one. |

These are application defaults, not statements about chain finality. A project can override them per chain. A transfer below the threshold is recorded as detected, sends `payment.confirming` webhooks as its count rises, and adds no value to the payment until it reaches the threshold. Sweeps and payouts wait for the same threshold before they are marked confirmed.

## Program addresses

Each release ships these addresses, and the installation connects to the one for its network by itself after checking that the code matches the release (see [Node configuration](https://docs.recv.fund/onboarding-guide/node-configuration.md#recvfund-deployment)). You don't need to enter them. They are the program ID on Solana and the `RecvFundFactory` contract address on Robinhood Chain; each merchant creates its own merchant contract through that factory when it registers.

| Chain | Network | What | Address | Fee for new registrations | Fee collector |
| --- | --- | --- | --- | --- | --- |
| Solana | devnet | `recvfund` program | `FAZUvvc2anrhgkP6sVczAHp2wkFCfhzpFcbiBt1mVM8J` | 100 bps, taken at sweep | `GStZmhS72eX1euYiwQY9MaxahBopDBLGwfTtXPge3DK` |
| Robinhood Chain | testnet (46630) | `RecvFundFactory` contract | `0xDc055613c64a39ea6a9a2ad8c15D587381A12f8c` | 100 bps, taken at sweep | `0x74520411b6349b1A79f504D9b4717238Dbade236` |

Both were deployed on 2026-10-03. The fee rate and fee collector shown are the terms a registration made now receives; a registration keeps the terms it was created with. The Solana devnet program's config account is `5uLBoziU1on7DmPDyYPobgZhkFeWtjy91GW3HGWxFLcT`. The devnet program still has an upgrade authority, so treat it as provisional; the server refuses a mainnet program that has one. The Robinhood Chain contracts have no proxy and cannot be upgraded, and the factory source is verified on the Robinhood Chain testnet explorer.

The mainnet program and factory are not deployed yet.

Superseded, do not use: the Robinhood Chain testnet registry `0xBe4E003224977110100463EcC70D399bA0f1c9F8` and the Solana devnet program `G9u3a8P6T5RFsgQhjVC5Yw7oAUqURst5MQJi1rFVkzAt`, both deployed on 2026-09-30. They took a fee on checkout payments as well as on sweeps and are not accepted by the current server build.

The server checks the code at the address against the build it supports and reads the fee terms for new registrations and the fee cap before accepting it. After any merchant registration has started, the address cannot be replaced, because existing deposit addresses depend on it.

## Test funds

On a testnet install you need devnet SOL and Robinhood Chain testnet ETH in the hot wallet and in the wallet you test payments from.

- Devnet SOL can be requested with the Solana CLI (`solana airdrop`, with the CLI pointed at devnet) or from Solana's official devnet faucet.
- Robinhood Chain testnet ETH comes from Robinhood's official testnet faucet.
- Test USDC on devnet and test USDG on Robinhood Chain testnet are the mints and contracts listed above. How to obtain them is not covered here; check the issuer's documentation.

This documentation does not list faucet URLs. Use the faucet linked from each chain's official documentation.
