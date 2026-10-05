# Script usage

The install script handles installs, updates, restarts, status checks and resets. The newest release is always served at the URL below; a specific release is at `https://github.com/recv-fund/recvfund-scripts/releases/download/vX.Y.Z/install.sh`, next to a `SHA256SUMS` file:

```bash
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- [operation] [options]
```

Flags go after `-s --`. The script finds the newest released version by reading the image tags on `ghcr.io`; if it can't reach the registry, it stops and asks for `--image-tag`. With no operation flag the script shows an operations menu. `--help` prints the same reference as this page; `--version` prints the script version.

## Common commands

```bash
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --testnet     # first install, test networks
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --mainnet     # production install
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --update      # move to this release's images, migrate, restart
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --restart     # restart without touching data
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --status      # container status and health
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --reset       # remove everything (confirm twice)
```

`https://github.com/recv-fund/recvfund-scripts/releases/latest/download/update.sh` is a shortcut for `install.sh --update` and accepts the same options.

## Operations

| Flag | What it does |
| --- | --- |
| `--mainnet` | Fresh install against Solana mainnet and Robinhood Chain mainnet. Sets `NETWORK_TYPE=mainnet`. |
| `--testnet` | Fresh install against Solana devnet and Robinhood Chain testnet. Sets `NETWORK_TYPE=testnet`. Every payment is a test payment. |
| `--update` | Set `IMAGE_TAG` to the newest released version (or to `--image-tag`), pull those images (or rebuild from `--source`), run migrations against the new image, then replace the containers. Data and the rest of `.env` are untouched. The script prints the version it moves from and to, or says the installation is already on the newest release. It refuses to move a newer installed version back to an older one unless `--image-tag` is given. |
| `--restart` | Restart every container without pulling or changing data. Use it when the dashboard reports that blocks are no longer being processed. |
| `--status` | Print `docker compose ps` for the project and the response of `/api/v1/health`. |
| `--reset` | Stop and remove the containers, the images, every volume (including the bundled database) and the install directory. You must type the install directory path twice to confirm. Cannot be undone. Back up `.env` and the database first. |

There's no stop operation. To stop the containers and keep the data, see [Stopping and starting](https://docs.recv.fund/deployment-guide/advanced-setup.md#stopping-and-starting).

Without an operation flag, the script shows the menu. If an installation already exists in the directory, a fresh install asks whether to update it, remove it and install again, or cancel.

## Options

| Flag | What it does | Default |
| --- | --- | --- |
| `--yes`, `-y` | Accept the default answer for every prompt. Combine with the options below for an unattended install. | prompt |
| `--domain <host>` | Hostname that points at this server. Caddy obtains a Let's Encrypt certificate for it. Sets `SITE_DOMAIN` and `SITE_URL=https://<host>`. Requires ports 80 and 443 and cannot be combined with `--http-port`. | prompt; default is plain HTTP |
| `--email <address>` | Email address for the Let's Encrypt account. Sets `ACME_EMAIL`. Only used with a domain. | `admin@<domain>` |
| `--external-db` | Use an existing Postgres 16 server instead of the bundled container. Prompts for the connection unless the `--pg-*` options are given. The stack then starts without the `db` profile. | bundled Postgres |
| `--pg-host <host>` | External Postgres host, as reachable from inside the `api` container. Implies `--external-db`. | prompt |
| `--pg-port <port>` | External Postgres port. | `5432` |
| `--pg-db <name>` | External Postgres database name. | `recv` |
| `--pg-user <user>` | External Postgres user. | `recv` |
| `--pg-password <pw>` | External Postgres password. Visible in the process list while the script runs; prefer the prompt. | prompt, hidden |
| `--pg-ssl` | Connect to the external Postgres with SSL. | prompt, default no |
| `--http-port <n>` | Serve plain HTTP on that host port instead of 80 and 443, for a server where your own proxy terminates TLS. Sets `SITE_DOMAIN=:80` and maps the port. The site URL defaults to `http://<server-ip>:<n>`; set the public address under Settings → Site URL afterwards. | 80 and 443, or the HTTP port prompt |
| `--http-bind <ip>` | Publish the HTTP port on this IPv4 address only, for example `127.0.0.1` when your proxy runs on the same server. Without it, the port is open on every address of the server, and Docker's port publishing is not blocked by `ufw`. Plain HTTP only. | every address |
| `--site-url <url>` | The public address of the installation in plain-HTTP mode, for example `https://pay.example.com` when your proxy serves HTTPS. Skips the site URL prompt. | prompt; suggests `http://<public ip>[:port]` |
| `--image-tag <tag>` | Image version to run instead of the newest release, for example `0.1.2`. Written to `.env` as `IMAGE_TAG`. | the newest released version |
| `--dir <path>` | Install directory. Must be an absolute path. | `/opt/recvfund` |
| `--source <path>` | Build the API and web images from a source checkout at `<path>` instead of pulling them. Writes `docker-compose.build.yml`, which later updates reuse. Only for people with source access. | pull images |

Options can also be written as `--flag=value`.

Environment variables: `RECV_DRY_RUN=1` prints the Docker commands instead of running them; `NO_COLOR=1` disables coloured output.

## Examples

Unattended testnet install on an IP address, plain HTTP on port 80:

```bash
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --testnet --yes
```

Mainnet with a domain, Let's Encrypt and a managed database:

```bash
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --mainnet \
  --domain pay.example.com --email ops@example.com \
  --pg-host db.example.com --pg-db recv --pg-user recv --pg-ssl
```

The database password is asked for at the prompt. Add `--yes` and `--pg-password` only where a password in the process list is acceptable.

Behind your own proxy on the same server, port 8080 reachable from that proxy only:

```bash
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --mainnet --yes \
  --http-port 8080 --http-bind 127.0.0.1 --site-url https://pay.example.com
```

Pin a version and update to it later:

```bash
curl -fsSL https://github.com/recv-fund/recvfund-scripts/releases/latest/download/install.sh | sudo bash -s -- --update --image-tag 1.0.2
```

## What the script writes

```
/opt/recvfund/.env                       mode 600; AES_ENCRYPTION_KEY is the value to back up
/opt/recvfund/docker-compose.yml
/opt/recvfund/Caddyfile
/opt/recvfund/install.log                every run appends to it
/opt/recvfund/docker-compose.build.yml   only with --source
```

See [Advanced setup](https://docs.recv.fund/deployment-guide/advanced-setup.md) for the contents of each file.
