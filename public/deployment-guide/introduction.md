# Deployment guide

recv.fund runs on a Linux server you control. There are three ways to get it running.

| Method | When to use it | Page |
| --- | --- | --- |
| One-line script | Most installs. The script installs Docker if needed, asks a few questions, writes the compose project and starts it. | [Quick setup](https://docs.recv.fund/deployment-guide/quick-setup.md) |
| Manual docker compose | You want to write the compose file and `.env` yourself, run behind your own proxy, or use an external Postgres. | [Advanced setup](https://docs.recv.fund/deployment-guide/advanced-setup.md) |
| Developer build from source | You have a source checkout and want to build the images locally instead of pulling them. Only available to people with source access. | [Script usage](https://docs.recv.fund/deployment-guide/script-usage.md) (`--source`) |

Whichever method you pick, the result is the same `docker compose` project: Caddy on ports 80 and 443, the API, the web app, Redis, and either a bundled or an external Postgres.

## Requirements

| Requirement | Value |
| --- | --- |
| Operating system | Ubuntu, Debian, Linux Mint, CentOS, RHEL, Rocky Linux, AlmaLinux, Fedora, Arch Linux or Alpine Linux, on amd64 or arm64. macOS with Docker Desktop for local testing over plain HTTP only. |
| CPU | 2 cores |
| Memory | 4 GB |
| Disk | 20 GB recommended. The installer warns below 10 GB and asks before continuing below 5 GB. |
| Ports | 80 and 443 free for Let's Encrypt, or one free port behind your own reverse proxy (see `--http-port`) |
| Time | About ten minutes |

The server needs outbound access to the chain RPC endpoints and, for mainnet prices of SOL and ETH, to CoinGecko.

## Mainnet or testnet

Every install runs against one network type. Choose it at install time; it cannot be switched later without a reset.

- `testnet`: Solana devnet and Robinhood Chain testnet. Every payment is a test payment. Use this for a first install.
- `mainnet`: Solana mainnet and Robinhood Chain mainnet. Real funds.

## What to back up

Three things: the database, the `api-uploads` volume (project logos), and `/opt/recvfund/.env`. The `AES_ENCRYPTION_KEY` in that file decrypts every secret in the database, including hot wallet keys. If it is lost, hot wallets and stored secrets cannot be recovered. Deposit addresses and settlement are not affected, because no deposit keys exist.

## After installing

Open `https://<your-domain>/signup` (or `http://<server-ip>/signup`) and continue with the [Onboarding guide](https://docs.recv.fund/onboarding-guide/introduction.md). If the server is behind a router or in a virtual machine, the printed address may not open; see [Installing behind a router or in a virtual machine](https://docs.recv.fund/deployment-guide/quick-setup.md#installing-behind-a-router-or-in-a-virtual-machine).

To stop the installation without losing data, see [Stopping and starting](https://docs.recv.fund/deployment-guide/advanced-setup.md#stopping-and-starting).
