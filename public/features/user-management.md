# User management

Access to the dashboard is by email and password. Every account has one role and, for project roles, a list of assigned projects. The root account created at setup is the only owner.

## Roles

| Role | Dashboard label | What it can do |
| --- | --- | --- |
| `owner` | (not assignable) | Everything. Only the owner changes the site URL and the install-wide minimum payout. Cannot be removed or deactivated. |
| `admin` | Admin | Everything across all projects: projects and withdrawal policy, nodes, installation settings, hot wallets, team, activity log, payout approval. Cannot change or remove themselves, and cannot create another owner. |
| `project-lead` | Project lead | In assigned projects: branding, currencies, API keys, webhook endpoints, hot wallet assignment, merchant registration, customers, payment links, missed-payment reports, sweeps, payout requests and the address book. Can list the project team and invite project managers and project operators into those projects. |
| `project-manager` | Project manager | Read-only in assigned projects, plus CSV export. |
| `project-ops` | Project operator | Reads payments, customers and sweeps of assigned projects. No access to payouts or the address book. |

Anything not allowed for a role returns `403`, whether or not the control is visible. Owner-only settings are shown read-only to other roles. The navigation hides Payouts and Address book for project operators, and shows Hot wallets, Developers and Team only to owners, admins and project leads. Nodes and Activity are owner and admin only.

## Inviting a member

Owners and admins invite from **Team** with **Invite a team member**: Full name, Email address, Role, **Temporary password** and the **Projects** to assign. Project leads can invite only project managers and project operators, and only into their own projects.

The account exists immediately. No email is sent; share the temporary password with the person separately. Until they change it, the account can do nothing except read its own profile and change its password: the dashboard sends them to the change-password page and does not open the shell. Changing the password checks the current password and the confirmation, then signs out every session, so they sign in again with the new password. Passwords must be at least `auth.password.minLength` characters (default 10).

## Changing, deactivating and removing

Owners and admins can change a member's role and project assignments, deactivate or reactivate them, and remove them. Every one of these changes signs the member out on every device. A deactivated account is refused at sign-in and on every request. **Remove** asks for confirmation, deletes the account and its project access, keeps configuration values the person created, and clears their name from those records. The owner cannot be removed.

## Sessions

Sign-in issues an access token (`auth.accessToken.expiresIn`, default 15 minutes) and a refresh token (`auth.refreshToken.expiresIn`, default 30 days). Refresh replaces the old token; reusing a consumed refresh token revokes the whole session family. Sign-out revokes the family. A password change, a role or project change, and deactivation revoke all of the account's sessions. Every request loads the account from the database, so a revocation takes effect on the next request.

Sign-in is rate limited by `rateLimit.login.perHour` (default 20) per IP address and per email address. If the rate limiter is unavailable, sign-in returns `503` rather than skipping the limit.

## Profile

**My account** lets each member edit their full name and username, open the password change page and sign out.

## Activity log

**Activity** (owners and admins) lists what the API recorded: every write request and every denied request, including requests blocked by a role or project check. Successful reads are not recorded. Filter by **Category** and **Outcome** (Success, Denied, Error). Each row shows the time, event, user and details: the path without its query string, HTTP status, duration, the project when known and the request payload with credentials, secrets and URLs redacted. The API records rows after sending the response and finishes pending rows on shutdown. This is an activity log for operating the install, not a transactional compliance ledger.
