# Form setup

## Recommended launch path: Formspree

Use one Formspree form for all three pages. The hidden `vertical` field already identifies General, Dealerships, or Contractors.

1. Create a form in Formspree and copy its endpoint, such as `https://formspree.io/f/abcxyz12`.
2. Use that endpoint as the `action` on each `#inquiry-form`.
3. In Formspree, set **Restrict to Domain** to exactly `archangelcinema.com` (no protocol, path, or `www`). The bare domain permits both `archangelcinema.com` and `www.archangelcinema.com`; restricting to `www.archangelcinema.com` sends submissions from the bare domain to Spam.
4. Send a real test from each published page and confirm the email notification and stored submission.
5. Configure spam filtering and an autoresponse only after the basic delivery test passes.

The forms already provide native field validation, duplicate-submit locking, a 12-second timeout, accessible status messaging, and FormData/AJAX submission. Spam protection is handled in Formspree so browser autofill cannot silently trip a client-side honeypot and discard a legitimate lead.

## Local testing

Do not test submissions by double-clicking an HTML file. A `file:///...` page does not send the normal referrer Formspree needs and cannot submit successfully.

Run the site through a local server instead:

`python3 -m http.server 4173`

Then test at `http://localhost:4173/`. The published HTTPS website remains the authoritative delivery test, especially when Formspree domain restrictions are enabled.

## When to replace Formspree with AWS

Move to API Gateway + Lambda + SES only when the form must trigger custom CRM routing, lead scoring, enrichment, or private first-party storage. For the current volume and static-site architecture, Formspree is the lower-risk launch choice.
