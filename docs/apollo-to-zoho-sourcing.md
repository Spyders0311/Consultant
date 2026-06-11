# Apollo to Zoho Candidate Sourcing

Apollo should be used as an upstream lead-data source. Zoho remains the system of record.

## Flow

1. Search Apollo for net-new people using narrow filters.
2. Score the returned candidates before spending enrichment credits.
3. Enrich only the strongest candidates when an email address is needed.
4. Push approved candidates into Zoho through `scripts/zoho-candidate-upsert.cjs`.
5. Create Zoho tasks for human outreach and manual LinkedIn notes.

## Required Environment

Add this to `.env.local`:

```text
APOLLO_API_KEY=
```

Keep this local. Do not commit it.

## Why Search Before Enrich

Apollo's People Search endpoint finds net-new people, but it does not return email addresses or phone numbers. Apollo's People Enrichment endpoint can reveal contact details, but those calls can consume credits. The daily workflow should therefore search broadly, score tightly, and enrich sparingly.

## Recommended Apollo Search Segments

Start with small batches, 25-50 people per segment.

### Recently Displaced Adjacent Operators

- Titles: operations manager, general manager, branch manager, regional manager, service manager
- Seniority: manager, director
- Locations: target states or metros
- Company size: 50-1000 employees
- Keywords: open to work, transition, seeking, available, laid off

### Sales and Business Development

- Titles: account executive, sales manager, territory manager, business development manager, franchise development
- Seniority: senior, manager, director
- Locations: target states or metros
- Company size: 10-500 employees

### Industry Adjacent

- Titles: property manager, restoration manager, insurance adjuster, construction project manager, home services manager, security manager
- Seniority: manager, director, owner
- Locations: target states or metros

## Candidate Gate Before Zoho

Only push candidates to Zoho when all are true:

- Has a usable business email or approved enrichment path
- Has a plausible fit rationale
- Is not obviously in a do-not-contact or sensitive context
- Has a specific outreach angle
- Is A or B tier, or marked Needs Review for a strong reason

## Compliance Guardrails

- Do not use Apollo for mass blasting.
- Do not reveal personal emails by default.
- Do not reveal phone numbers unless explicitly approved for a specific campaign.
- Exclude EU/UK regions unless a separate compliance process is approved.
- Respect Apollo and Zoho opt-out states.
- Avoid language that implies employment if the offer is an independent opportunity.
