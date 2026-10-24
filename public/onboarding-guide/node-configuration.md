# Node configuration

Open Nodes in the sidebar (`/settings/nodes`). Only owners and admins see it. The page is titled "Node configuration" and starts with a Network selector listing the chains of your installation's network type, for example Solana devnet and Robinhood Chain testnet on a testnet install. Everything below the selector applies to the selected network.

## Connection status

Three values, read from the database and the chain:

| Value | Meaning |
| --- | --- |
| Chain reference | The network's external identifier: `mainnet-beta` or `devnet` on Solana, chain ID `4663` or `46630` on Robinhood Chain. |
| Program | The verified program ID or factory address; "Connecting automatically" while the installation connects to it; "Not deployed on this network" where recv.fund has no deployment. |
| Fee for new registrations (basis points, taken at sweep) | The fee rate that a registration made now would receive, read from the program's config account on Solana or from the factory on Robinhood Chain. "Unavailable" until the program is configured. |

The fee is taken only when a deposit is swept, never when a customer pays. The rate is set on chain by recv.fund, not in your installation, and it cannot exceed 200 basis points (2%). When you register, the rate and the fee collector in force are copied into your registration and do not change afterwards. A later change by recv.fund applies only to registrations made after it, so the value shown here can differ from the rate of an existing registration. The registration panel shows the rate before you sign.

## recv.fund deployment

You don't enter anything here. Each release of recv.fund knows the recv.fund deployment for every network it supports: the program ID on Solana, and the address of the `RecvFundFactory` contract on Robinhood Chain, through which each merchant creates its own merchant contract. When the server starts, it connects to that deployment for each network that has none yet, and it tries again every five minutes until it succeeds.

Before saving an address, the server reads the code at that address and compares it with the build it ships with (a pinned hash of the runtime bytecode on Robinhood Chain, of the program bytes on Solana), then reads the fee terms for new registrations and the fee cap. Only a matching build is accepted. On Solana mainnet the server also refuses a program that still has an upgrade authority; the devnet program keeps one and should be treated as provisional. A failed check changes nothing. Success writes the chain row and its configuration key in one transaction, after which the fee value above fills in and registration becomes possible for that network.

The **recv.fund deployment** section shows one of three states:

- **Verified:** the address is set and its code matched. A custom address is labeled "custom deployment".
- **Connecting automatically:** the address isn't set yet. If the last attempt failed, the reason is shown, usually an RPC node that isn't answering. Fix the RPC node above, then select **Connect now** to try at once.
- **Not deployed:** recv.fund has no deployment on this network yet (Solana mainnet today), so the installation can't take payments on it.

The address can't be replaced once any merchant registration has started on that network, because existing deposit addresses are derived from it. The server never replaces an address that is already set, so a later recv.fund release can't move your registrations. The current addresses are listed under [Networks and tokens](https://docs.recv.fund/support/networks.md#program-addresses).

### Using a different deployment

Under **Use a different deployment (advanced)**, an owner or admin can enter another address and select **Validate and save**. This is only for an installation that runs against its own deployment of the recv.fund contracts; the code at the address must still match the release. Do it before the first registration on that network.

{/* prettier-ignore */}
> [!NOTE]
>
> Automatic configuration is in version 0.1.5 and later. On older versions,
> enter the address from [Networks and tokens](https://docs.recv.fund/support/networks.md#program-addresses)
> in **Program or registry address** and select **Validate and save**.

## RPC nodes

Every installation ships with one public RPC node per network, active and not preferred:

| Network | Seeded node |
| --- | --- |
| Solana mainnet | `https://api.mainnet-beta.solana.com` |
| Solana devnet | `https://api.devnet.solana.com` |
| Robinhood Chain mainnet | `https://rpc.mainnet.chain.robinhood.com` |
| Robinhood Chain testnet | `https://rpc.testnet.chain.robinhood.com` |

The table shows, per node: Endpoint (origin and node number; the full URL is hidden because it may contain provider credentials), Status (Active or Inactive), Priority (Preferred, or its position), and Last check (height and latency, or the last error). Actions per row:

- **Disable** / **Enable**: an inactive node is never used for reads or broadcasts. It can still be probed with "Test connections".
- **Prefer**: makes this node the first one tried. One node per network is preferred.
- **Delete**: removes the node after a confirmation prompt.

How the pool is used: reads try the preferred active node first, then the other active nodes in position order, and move to the next node on failure. Before every read the server checks that the node is on the expected network (the EVM chain ID, or Solana's genesis hash), so a node pointing at the wrong network cannot supply balances. Signing and broadcasting do not fail over: a sweep or payout is sent to one node exactly once. Requests time out after 10 seconds, reject redirects and cap responses at 8 MiB. At most ten nodes per network.

**Test connections** probes every node of the selected network from the server, including inactive ones, and shows the current height and latency, or the error, in the Last check column.

### Add RPC node

"Add RPC node" takes an RPC URL (HTTP or HTTPS, private endpoints included; a URL with a provider key in it is allowed and is visible only to owners and admins) and one checkbox, "Public endpoint without an account", which marks the node as free. The flag is informational: it labels the row Public or Private and does not change how the pool picks nodes. Press "Add node". New nodes are active and not preferred; use "Prefer" to put a private node first.

For a mainnet install, add a private endpoint from an RPC provider and prefer it. Two capabilities matter beyond throughput:

- Native ETH deposits on Robinhood Chain are proven with `debug_traceTransaction` and `debug_traceBlockByHash` using the `callTracer`. A node without these methods cannot credit ETH sent to a deposit address, including ETH paid from a connected wallet on the checkout page; token payments are unaffected.
- Deposit discovery walks transaction history. The node must retain enough history for the addresses being scanned. Failover to another node does not replace missing history.

## Processing cursors

Each watcher stores where it is: the kind of cursor, its value, whether it is running, and the last error. New installations show "No processor has recorded a cursor yet." until the first watcher pass. Watchers start on their own; there is nothing to enable here. The polling intervals are configuration values: deposits every 15 seconds, confirmations every 15 seconds.

If a cursor shows a persistent error, check the node table first; most errors are RPC errors and clear on the next pass once a working node is active. If a cursor stays stuck after the RPC is healthy, restart the services with the installer's `--restart` operation (see [Script usage](https://docs.recv.fund/deployment-guide/script-usage.md)). Watchers resume from their stored cursors, and replay after a restart is safe. The dashboard has no restart button in this release.

## Currencies

The bottom of the page lists every currency of the selected network with its own form: Token address (absent for the native currency), Decimals and an Active checkbox. Owners and admins can correct a token definition or disable a currency.

The seeded catalog:

| Chain | Currency | Notes |
| --- | --- | --- |
| Solana | SOL, USDC, USDT | USDT on mainnet only. |
| Robinhood Chain | ETH, USDG | Mainnet and testnet USDG addresses are seeded. |

Editing a token address or decimals triggers a live check: ERC-20 decimals on Robinhood Chain; mint ownership by the standard Token Program, layout, initialization and decimals on Solana. Token-2022 and mints with extensions are not supported. Token definitions are locked once a merchant registration has started on the network, and again once a payout references the currency; the Active flag can still change. Disabling a currency removes it from the checkout options of every project. Enabling one re-validates its definition.

Which currencies a given project offers at checkout is a separate, per-project choice under Projects → Enabled currencies; see [Multi-brand projects](https://docs.recv.fund/features/multi-brand-projects.md).

## Next

[Hot wallet](https://docs.recv.fund/onboarding-guide/hot-wallet.md): create the wallet that will be written on-chain as your sweeper.
