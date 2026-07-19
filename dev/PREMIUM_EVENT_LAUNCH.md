# ArchAngel Cinema — Premium Event Launch

## Public funnel

- One sales landing page: `/`
- Supporting trust pages: `/proof/` and `/about/`
- Form confirmation: `/thank-you/` (`noindex`)
- Retired niche paths: `/contractors/` and `/dealerships/` redirect to `/`
- Positioning: founder-led cinematic event videography with professional audio
- Published service area: the Washington, D.C., Maryland, and Northern Virginia region
- Starting coverage: $995

## Inputs still required before external launch

1. Verified public business phone number for tap-to-call/text.
2. Dedicated 15-minute Event Availability Call URL.
3. Confirmation that published package ranges, delivery promises, revision limits, 50% retainer, and balance terms match the current service agreement.
4. Confirmation that David and Celeste portfolio media and feedback can remain public.
5. CloudFront/S3 access to create true HTTP 301/308 redirects for the retired niche paths.
6. Formspree dashboard access for the branded autoresponse.

No placeholder phone number, fake calendar URL, or unverified customer result should be published.

## First acquisition test

- Campaign: Search | Private Events | DMV
- Destination: `https://archangelcinema.com/`
- Budget: $20/day for 15 days
- Search only; Display expansion and Search Partners off initially
- Target people in or regularly in the Washington, D.C., Maryland, and Northern Virginia region
- Maximize Clicks with an initial $10 CPC ceiling
- Track `generate_lead` and meaningful answered calls as the only primary online conversions
- Review search terms daily during week one

Decision rule: after 30 relevant clicks, zero qualified inquiries means pause and improve proof, offer, or landing-page clarity before spending more.

## Measurement model

Diagnostic browser events:

- `event_cta_click`
- `event_form_start`
- `phone_click` (activate after the verified phone is supplied)
- `book_appointment` (activate after the calendar URL is supplied)

Primary conversion:

- `generate_lead` — only after Formspree confirms success

Offline pipeline:

`New → Contacted → Qualified → Call booked → Call held → Proposal sent → Deposit paid → Lost`

Persist first- and last-touch UTMs, Google click IDs, landing page, and referrer in the Formspree payload. Never send names, emails, phone numbers, dates, venue details, or form messages to GA4.

## Production release

- Do not upload `dev/`.
- Upload the generated montage and poster in `assets/`.
- Invalidate CloudFront after uploading changed HTML, CSS, JavaScript, metadata, `robots.txt`, and `sitemap.xml`.
- Run one genuine HTTPS Formspree submission after deployment.
- Verify `generate_lead` fires once in GA4 DebugView/Realtime and the submission reaches the correct Formspree inbox.
