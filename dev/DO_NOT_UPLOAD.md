# Development files — do not upload

Everything in this `dev/` folder is local-only. It contains documentation, setup notes, a local form contract test, and preview tooling; none of it belongs in the production S3 bucket.

When publishing manually, upload the website files and public page folders from the project root, but leave `dev/` unselected. Hidden Git metadata (`.git/` and `.gitignore`) must also remain local.
