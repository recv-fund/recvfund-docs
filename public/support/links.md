# Links

## recv.fund

| What | URL |
| --- | --- |
| Public site | `https://recv.fund` |
| Documentation | `https://docs.recv.fund` |
| Demo dashboard and checkout | `https://demo.recv.fund` |
| Installer script | `https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh` |

The installer is run as `curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash`. Flags and menu options are listed in [Script usage](https://docs.recv.fund/deployment-guide/script-usage.md).

## Chain explorers

| Chain | Network | Explorer |
| --- | --- | --- |
| Solana | mainnet-beta | `https://solscan.io` |
| Solana | devnet | `https://solscan.io` with `cluster=devnet` |
| Robinhood Chain | mainnet (chain id 4663) | `https://robinhoodchain.blockscout.com` |
| Robinhood Chain | testnet (chain id 46630) | `https://explorer.testnet.chain.robinhood.com` |

## Public RPC endpoints

These are the endpoints an install starts with. Replace or supplement them under Settings, Nodes.

| Chain | Network | RPC |
| --- | --- | --- |
| Solana | mainnet-beta | `https://api.mainnet-beta.solana.com` |
| Solana | devnet | `https://api.devnet.solana.com` |
| Robinhood Chain | mainnet | `https://rpc.mainnet.chain.robinhood.com` |
| Robinhood Chain | testnet | `https://rpc.testnet.chain.robinhood.com` |

## Chain and token references

| Reference | URL |
| --- | --- |
| Robinhood Chain wallet network configuration (chain ids, RPC and explorer URLs) | `https://docs.robinhood.com/chain/add-network-to-wallet/` |
| USDC contract and mint addresses (Circle) | `https://developers.circle.com/stablecoins/usdc-contract-addresses` |
| USDG on Robinhood Chain mainnet (Paxos) | `https://docs.paxos.com/guides/stablecoin/usdg/mainnet` |
| USDG on Robinhood Chain testnet (Paxos) | `https://docs.paxos.com/guides/stablecoin/usdg/testnet` |

The addresses these pages publish are the ones seeded in the install; see [Networks and tokens](https://docs.recv.fund/support/networks.md).

## Contact

Email is the only channel: `hello@recv.fund`. Replies come from the same address.

- Setup help: read the [Deployment guide](https://docs.recv.fund/deployment-guide/introduction.md) and the [Onboarding guide](https://docs.recv.fund/onboarding-guide/introduction.md) first. If you are stuck, include your server's OS version, the installer flags you used and the installer output.
- Security: report a vulnerability in the program or the server to the same address with "Security" in the subject line.
- Agencies and marketplaces: deploying under your own brand is planned, not available. Tell us what you serve and on which chain.
