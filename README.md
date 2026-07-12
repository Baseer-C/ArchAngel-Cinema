# ArchAngel Cinema - static website

This is the dependency-free, responsive production website for ArchAngel Cinema. Production is hosted from a private Amazon S3 bucket through CloudFront, with Route 53 providing DNS.

## Site management

Start with [`SITE_MANAGEMENT.md`](SITE_MANAGEMENT.md). It covers editing, local testing, GitHub, S3 publishing, CloudFront invalidations, video and image replacement, new folders, release checks, and rollback.

## Local preview

Run from this directory:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Before publishing

1. Connect Formspree using the instructions in `FORM_SETUP.md`, then test one submission from each page.
2. Add GA4 and Microsoft Clarity tracking snippets to the `<head>` of all three HTML pages.
3. Publish production files to the S3 bucket root, then refresh the CloudFront distribution.
4. Confirm HTTPS, redirects, forms, analytics, and mobile behavior before removing the Squarespace DNS records.
5. Keep all public claims supportable and replace visual examples with client-approved case studies as proof becomes available.

## Design rationale

- The homepage leads with video marketing and conversion systems, rather than cars or construction.
- Automotive and contractor audiences are separated at the second decision point.
- The site avoids unverified outcome claims. It promises controlled delivery and implementation, then routes prospects toward a decision-maker review.
