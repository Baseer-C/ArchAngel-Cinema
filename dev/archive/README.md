# Archived public positioning

The construction, dealership, free-video, audit, managed-marketing, and lead-generation versions of the site were retired during the premium event-videography pivot on 2026-07-19.

The complete prior implementation remains recoverable from git commit `29b9c77` (`Refine contractor conversion funnel`). The public `/contractors/` and `/dealerships/` paths now contain redirect fallbacks to `/`; production should also configure HTTP 301/308 redirects at CloudFront or the hosting layer.

Unused contractor, dealership, RDX campaign media, and superseded founder portraits were moved into `dev/archive/assets/` so they remain recoverable without being included in the public S3 upload.

Do not upload the `dev/` directory to production.
