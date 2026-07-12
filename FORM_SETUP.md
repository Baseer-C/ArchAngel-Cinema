# Form setup

## Recommended launch path: Formspree

Use one Formspree form for all three pages. The hidden `vertical` field already identifies General, Dealerships, or Contractors.

1. Create a form in Formspree and copy its endpoint, such as `https://formspree.io/f/abcxyz12`.
2. Add this once before `main.js` on each page:

   `<script>window.ARCHANGEL_INQUIRY_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";</script>`

3. In Formspree, restrict submissions to `archangelcinema.com` and its subdomains.
4. Send a real test from each page and confirm the email notification and stored submission.
5. Configure spam filtering and an autoresponse only after the basic delivery test passes.

The forms already provide native field validation, an invisible honeypot, duplicate-submit locking, a 12-second timeout, accessible status messaging, and JSON/AJAX submission.

## When to replace Formspree with AWS

Move to API Gateway + Lambda + SES only when the form must trigger custom CRM routing, lead scoring, enrichment, or private first-party storage. For the current volume and static-site architecture, Formspree is the lower-risk launch choice.
