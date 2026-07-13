# Form setup

## Recommended launch path: Formspree

Use one Formspree form for all three pages. The hidden `vertical` field already identifies General, Dealerships, or Contractors. This is a dependency-free Vanilla JavaScript site, so the forms use Formspree's AJAX contract directly: multipart `FormData`, `POST`, and `Accept: application/json`. The `@formspree/ajax` CDN helper is optional and is not required for this tailored handler.

1. Create a form in Formspree and copy its endpoint, such as `https://formspree.io/f/abcxyz12`.
2. Use that endpoint as the `action` on each `#inquiry-form`.
3. In Formspree, set **Restrict to Domain** to exactly `archangelcinema.com` (no protocol, path, or `www`). The bare domain permits both `archangelcinema.com` and `www.archangelcinema.com`; restricting to `www.archangelcinema.com` sends submissions from the bare domain to Spam.
4. Send a real test from each published page and confirm the email notification and stored submission.
5. Configure spam filtering and an autoresponse only after the basic delivery test passes.

The forms already provide native field validation, duplicate-submit locking, a 12-second timeout, accessible status messaging, and FormData/AJAX submission. Spam protection is handled in Formspree so browser autofill cannot silently trip a client-side honeypot and discard a legitimate lead.

GA4 receives `lead_form_attempt` when a valid form begins sending, `lead_form_error` if Formspree rejects or the request fails, and `generate_lead` only after Formspree returns a successful response. Do not mark the diagnostic events as conversions.

## Local testing

Do not test submissions by double-clicking an HTML file. A `file:///...` page does not send the normal referrer Formspree needs and cannot submit successfully.

Run the included preview server from the site root instead:

`node dev/tools/preview-server.mjs 4173 .`

Use `http://localhost:4173/dev/form-test.html` for the successful local contract, append `?scenario=reject` for a rejected-request check, and append `?scenario=timeout` for the 12-second timeout check. The harness prints the multipart payload so the normalized website, offer identifier, source page, and UTMs can be verified without sending a real lead.

The published HTTPS website remains the authoritative delivery test, especially when Formspree domain restrictions are enabled. After publishing, send one clearly labeled test and confirm it appears in Formspree before checking `generate_lead` in GA4 Realtime or DebugView.

## When to replace Formspree with AWS

Move to API Gateway + Lambda + SES only when the form must trigger custom CRM routing, lead scoring, enrichment, or private first-party storage. For the current volume and static-site architecture, Formspree is the lower-risk launch choice.
