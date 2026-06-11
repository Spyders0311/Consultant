# Zoho Lead Workflow Proposal

This proposal is based on the current Zoho CRM Leads metadata inspected on 2026-06-09. No Zoho configuration changes have been applied yet.

## Current Zoho Lead Setup

Active CRM users:

- Kyle Ragsdale (`kyle@belfieldinc.com`)

Current `Lead Status` values:

- Attempted to Contact
- Contact in Future
- Contacted
- Junk Lead
- Lost Lead
- Not Contacted
- Pre-Qualified
- Not Qualified

Current `Lead Source` values include:

- Advertisement
- Cold Call
- Employee Referral
- External Referral
- Online Store
- X (Twitter)
- Facebook
- Partner
- Public Relations
- Sales Email Alias
- Seminar Partner
- Internal Seminar
- Trade Show
- Web Download
- Web Research
- Chat

Existing relevant custom field:

- `Lead_Status_Modified_Time`

Missing fields needed for the candidate-sourcing workflow:

- AI fit tier
- AI score
- AI rationale
- Recommended outreach angle
- Source URL
- Manual LinkedIn note
- Last AI review date

## Recommended Lead Status Values

Add these values to the existing `Lead Status` picklist:

- AI Sourced - Review
- Approved for Outreach
- Email Sent
- LinkedIn Touch Needed
- Replied
- Call Booked
- Not a Fit
- Do Not Contact

Keep Zoho's default values for compatibility, but use the new values for this candidate-sourcing lane.

## Recommended Lead Source Value

Add:

- Codex Candidate Sourcing

Until this value exists, the API script should either use `Web Research` or avoid writing `Lead_Source` to prevent picklist validation issues.

## Recommended Custom Fields

Add these fields to the Leads module:

| Field Label | Type | Purpose |
|---|---|---|
| AI Fit Tier | Picklist: A, B, C, D, Needs Review | Human-friendly quality bucket |
| AI Score | Number | 0-100 scoring for sorting |
| AI Rationale | Multi-line text | Why Codex thinks this person is or is not a fit |
| Recommended Outreach Angle | Multi-line text | Best message angle for the team |
| Source URL | URL | Public/source page used for the lead |
| Manual LinkedIn Note | Multi-line text | Short note for a human to send manually |
| Last AI Review Date | Date | When Codex last evaluated the lead |

## Recommended Task Flow

When Codex finds a high-fit candidate:

1. Create or update a Lead.
2. Set `Lead Status` to `AI Sourced - Review`.
3. Set `Lead Source` to `Codex Candidate Sourcing`.
4. Add AI fit fields.
5. Add a scoring note.
6. Create task: `Review candidate outreach: First Last`.
7. If the lead is A-tier, create task: `Send manual LinkedIn credibility note`.

## Recommended Workflow Rules

Start with simple Workflow Rules, not Blueprint.

Suggested rules:

- If `Lead Source = Codex Candidate Sourcing` and `AI Fit Tier = A`, assign to Kyle and create a high-priority review task.
- If `Lead Status = Approved for Outreach`, create/send the first approved outreach email only after the email template is finalized.
- If `Lead Status = LinkedIn Touch Needed`, create a manual LinkedIn task.
- If `Email Opt Out = true` or `Lead Status = Do Not Contact`, stop all follow-up tasks.

## Cadence Recommendation

Use Zoho Cadences after the first email/message sequence is approved. Suggested first cadence:

- Day 0: First email
- Day 1: Manual LinkedIn credibility note task
- Day 3: Soft follow-up email
- Day 7: Final helpful close-the-loop email
- Exit cadence if replied, booked, not a fit, or do-not-contact

## Why Not Blueprint Yet

Blueprint is useful when the team must follow strict stage gates. This workflow needs fast sourcing and light human review first. Start with statuses, fields, tasks, and cadences; add Blueprint later if handoff discipline becomes a problem.
