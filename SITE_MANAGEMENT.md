# ArchAngel Cinema site management guide

This document is the operating handbook for editing, testing, publishing, and rolling back the ArchAngel Cinema website.

## Production reference

- Website: `https://archangelcinema.com`
- GitHub: `https://github.com/Baseer-C/ArchAngel-Cinema`
- Production branch: `main`
- S3 bucket: `archangelcinema-production-027420445177`
- CloudFront distribution ID: `E1JBOHXK4MZD7`
- CloudFront test domain: `d3nx87zi37vy5h.cloudfront.net`
- Local project: `/Volumes/1 TB/Business/Website/archangel-site`

The production chain is:

```text
GitHub source history -> S3 files -> CloudFront cache -> Route 53 domain
```

GitHub is the source of truth. S3 is the deployed copy. A GitHub push does not update S3 unless deployment automation is added later.

## File map

```text
index.html                    Homepage
dealerships/index.html        Dealership landing page
contractors/index.html        Contractor landing page
styles.css                    Shared site styles
details.css                   Niche-page styles
cinematic-scroll.css          Homepage scroll-film styles
motion.css                    Motion and responsive animation rules
main.js                       Navigation, scroll video, forms, and analytics events
assets/                       Images, logos, posters, and videos
tools/preview-server.mjs      Zero-dependency local server with video byte-range support
FORM_SETUP.md                 Formspree connection instructions
ANALYTICS_SETUP.md            GA4, Search Console, and Clarity instructions
SITE_MANAGEMENT.md            This handbook
```

## Standard editing workflow

1. Open `/Volumes/1 TB/Business/Website/archangel-site` in the code editor.
2. Make the smallest necessary change.
3. Preview the site locally.
4. Test the homepage and both niche pages.
5. Commit and push the change to GitHub.
6. Upload the changed production files to the S3 bucket root.
7. Invalidate the affected CloudFront paths.
8. Verify the production domain in a private browser window and on a phone.

### Local preview

From Terminal:

```bash
cd "/Volumes/1 TB/Business/Website/archangel-site"
node tools/preview-server.mjs 4173
```

Open:

```text
http://localhost:4173/
http://localhost:4173/dealerships/
http://localhost:4173/contractors/
```

Stop the preview with `Control-C` in Terminal.

Do not use `python3 -m http.server` to judge the scroll film. That server does not return HTTP byte ranges, so the browser cannot seek through the video reliably. S3 and CloudFront do support byte ranges.

## GitHub workflow

Before committing, review the changed files:

```bash
git status
git diff
```

Commit and publish:

```bash
git add .
git commit -m "Describe the site change"
git push
```

Never commit passwords, AWS access keys, Formspree credentials, private client files, raw lead data, or local authentication files.

## Manual S3 publishing

Open AWS Console -> S3 -> `archangelcinema-production-027420445177` -> Objects.

The following files and folders must be directly at the bucket root:

```text
index.html
styles.css
main.js
assets/
dealerships/
contractors/
```

Do not upload the enclosing `archangel-site` folder. A path such as `archangel-site/index.html` is one level too deep and will cause CloudFront errors.

To publish through the console:

1. Open the local `archangel-site` folder.
2. Select the changed files or folders inside it.
3. In the S3 bucket root, choose Upload.
4. Upload the selected content and allow replacement of matching objects.
5. Confirm the object path after upload.
6. Refresh CloudFront using the invalidation procedure below.

Do not disable S3 Block Public Access. CloudFront reads the private bucket through its Origin Access Control policy.

## AWS CLI publishing

After AWS CLI is installed and authenticated, run this from the project root:

```bash
aws s3 sync . s3://archangelcinema-production-027420445177 \
  --delete \
  --exclude ".git/*" \
  --exclude ".gitignore" \
  --exclude "*.md"
```

`--delete` makes the production bucket mirror the local production files. Use it only with this dedicated website bucket and only after checking the current directory.

Then clear CloudFront's cache:

```bash
aws cloudfront create-invalidation \
  --distribution-id E1JBOHXK4MZD7 \
  --paths "/*"
```

For a small change, invalidate only the affected paths instead of the entire site.

## CloudFront invalidations

In AWS Console:

1. Open CloudFront -> distribution `E1JBOHXK4MZD7`.
2. Open Invalidations.
3. Choose Create invalidation.
4. Enter one or more paths.

Common paths:

```text
/index.html
/dealerships/*
/contractors/*
/styles.css
/main.js
/assets/changed-file.mp4
```

Use `/*` when a release changes several pages or shared styles. Test the CloudFront domain first, then the live domain.

## Replacing a video

Use a new versioned filename whenever possible. This prevents old browser and CloudFront caches from showing the previous video.

Example:

```text
assets/rdx-showcase-v2.mp4
```

Then update the corresponding `<source>` in the page HTML. The dealership showcase is in `dealerships/index.html`; the homepage scroll-film sources are in `index.html`.

Recommended video workflow:

1. Export a web-optimized H.264 MP4, plus a poster JPG when appropriate.
2. Give the video a new versioned filename.
3. Put the video in `assets/`.
4. Update the HTML source and poster paths.
5. Test playback locally on desktop and mobile dimensions.
6. Commit and push the change to GitHub.
7. Upload the new video, poster, and changed HTML file to S3.
8. Invalidate the changed HTML path. A new video URL normally does not require invalidation because it has never been cached.
9. Verify playback on the CloudFront test domain and production domain.

If an existing video filename is overwritten, invalidate that exact video path as well. Confirm the S3 `Content-Type` is `video/mp4` for MP4-compatible video files.

## Replacing an image or logo

The same versioning rule applies to important images:

```text
dealership-bmw-v3.jpg
contractor-site-v3.jpg
```

Place the new file in `assets/`, update every HTML reference, test locally, upload the image and changed HTML, then invalidate the changed page. Keep image dimensions reasonable and compress large files before publishing.

## Adding a new page or folder

Use the existing niche-page structure:

```text
new-page/index.html
```

Link to it as:

```text
/new-page/
```

Upload the entire `new-page/` folder to the S3 bucket root. The CloudFront viewer-request function must remain associated with the default behavior so directory URLs resolve to `index.html`.

## Form and analytics checks

Forms are designed to use one Formspree endpoint across all three pages. Follow `FORM_SETUP.md` whenever the endpoint or form account changes. Submit one real test from each page after any form-related release.

Analytics setup is documented in `ANALYTICS_SETUP.md`. After analytics changes, verify GA4 Realtime, the `generate_lead` event, Search Console ownership, and Microsoft Clarity.

## Release checklist

Before declaring a release complete, verify:

- `/`, `/dealerships/`, and `/contractors/` load over HTTPS.
- Navigation and calls to action reach the correct sections.
- Videos play without a download or permission error.
- Images and fonts load without visible layout shifts.
- Forms validate, submit, and arrive at the intended inbox.
- Mobile navigation and the sticky call to action work.
- GA4 and Clarity receive production traffic.
- The browser console has no new errors.

## Rollback

If a release breaks production:

1. Identify the last good Git commit with `git log --oneline`.
2. Revert the bad commit with `git revert COMMIT_SHA` rather than rewriting shared history.
3. Push the revert to GitHub.
4. Sync the restored files to S3.
5. Create a CloudFront `/*` invalidation.
6. Re-test production.

If S3 bucket versioning is enabled, an earlier object version can also be restored from the S3 console, but the same correction should still be committed to GitHub so source and production remain aligned.

## Infrastructure guardrails

Routine content updates should not require changes to Route 53, ACM, the S3 bucket policy, CloudFront Origin Access Control, alternate domain names, or the CloudFront Function. Do not change those settings during a normal content release.

Keep S3 private. Never paste AWS credentials into source files or GitHub. Preserve all Route 53 MX, SPF, DKIM, DMARC, and other email records when changing website DNS.
