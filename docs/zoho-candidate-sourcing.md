# Zoho Candidate Sourcing Setup

This workflow gives Codex long-term, revocable API access to create/update Zoho CRM leads and create outreach tasks. Do not share Zoho passwords. Use OAuth credentials only.

## Recommended Zoho OAuth Client

Create a Zoho API Console client for this local automation:

- Client type: Self Client for first setup, or Server-based Application if you later host a callback URL
- Client name: Codex Candidate Sourcing
- Region: use the same region as your Zoho account, usually `zoho.com` for US accounts
- Authorized redirect URI for local setup: `http://localhost:8787/zoho/oauth/callback`

Requested scopes:

- `ZohoCRM.modules.Leads.ALL`
- `ZohoCRM.modules.Contacts.READ`
- `ZohoCRM.modules.Tasks.CREATE`
- `ZohoCRM.modules.Notes.CREATE`
- `ZohoCRM.settings.fields.READ`
- `ZohoCRM.users.READ`

These scopes let the automation write candidate leads, avoid duplicate contacts by email, create human outreach tasks, add notes, and read field/user metadata. They do not grant full account administration.

## Environment Variables

Add these to `.env.local` or the environment used by the daily automation:

```text
ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.com
ZOHO_API_DOMAIN=https://www.zohoapis.com
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_DEFAULT_COMPANY=Independent Consultant Candidate
ZOHO_LEAD_OWNER_ID=
```

`ZOHO_LEAD_OWNER_ID` is optional. If set, new leads are assigned to that Zoho user.

## One-Time OAuth Flow

After creating the client and filling `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET`, run:

```powershell
node scripts/zoho-oauth.cjs auth-url
```

Open the printed URL while logged into Zoho. Approve the app and copy the `code` value from the redirect URL. Then run:

```powershell
node scripts/zoho-oauth.cjs exchange "PASTE_CODE_HERE"
```

Save the printed `refresh_token` into `ZOHO_REFRESH_TOKEN`.

## Daily Candidate Input

The candidate upsert script accepts JSON like this:

```json
{
  "firstName": "Taylor",
  "lastName": "Morgan",
  "email": "taylor@example.com",
  "company": "Former Employer or Current Company",
  "title": "Operations Manager",
  "source": "WARN notice research",
  "profileUrl": "https://example.com/profile-or-source",
  "score": 88,
  "fitTier": "A - Contact today",
  "rationale": "Recently displaced operations leader with adjacent customer-facing experience.",
  "outreachAngle": "Independent income path with structured support",
  "linkedinNote": "Short manual LinkedIn note for the team to send.",
  "taskOwnerId": "optional Zoho user id"
}
```

Run:

```powershell
node scripts/zoho-candidate-upsert.cjs candidate.json
```

The script creates a Lead when no existing lead or contact has that email, adds a note with the scoring rationale, and creates a manual outreach task for the team.
