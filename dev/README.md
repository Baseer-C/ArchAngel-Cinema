# ArchAngel Cinema - static website

This is the dependency-free, responsive production website for ArchAngel Cinema. Production is hosted from a private Amazon S3 bucket through CloudFront, with Route 53 providing DNS.

## Site management

Start with [`SITE_MANAGEMENT.md`](SITE_MANAGEMENT.md). It covers editing, local testing, GitHub, S3 publishing, CloudFront invalidations, video and image replacement, new folders, release checks, and rollback.

## Local preview

Run from the project root:

```bash
node dev/tools/preview-server.mjs 4173
```

Open `http://localhost:4173`.

Use this preview server instead of `python3 -m http.server`. It supports HTTP byte ranges, which the homepage scroll video needs for accurate seeking.

## Before publishing

1. Connect Formspree using the instructions in `FORM_SETUP.md`, then test one submission from each page.
2. Add GA4 and Microsoft Clarity tracking snippets to the `<head>` of all five HTML pages.
3. Publish production files to the S3 bucket root, then refresh the CloudFront distribution.
4. Confirm HTTPS, redirects, forms, analytics, and mobile behavior before removing the Squarespace DNS records.
5. Keep all public claims supportable and replace visual examples with client-approved case studies as proof becomes available.

Everything inside `dev/` is for local development and documentation only. Do not upload this folder to S3.

## Design rationale

- The homepage leads with video marketing and conversion systems, rather than cars or construction.
- Automotive and contractor audiences are separated at the second decision point.
- A compact homepage proof module validates execution without changing the target audience; `/proof/` holds the full case studies.
- A concise founder page at `/about/` adds personal credibility without interrupting either niche journey.
- The site avoids unverified outcome claims. It promises controlled delivery and implementation, then routes prospects toward a decision-maker review.
