# Analytics setup

## Recommended stack

1. **Google Analytics 4** for acquisition, traffic sources, landing pages, and lead conversions.
2. **Google Search Console** for queries, rankings, impressions, and organic clicks.
3. **Microsoft Clarity** for heatmaps and privacy-masked session recordings.

## Events already prepared

The site sends these events automatically whenever `window.gtag` is available:

- `free_review_click`
- `generate_lead` after a confirmed successful form response
- `video_start`
- `video_complete`

Form submissions also preserve UTM campaign parameters in the Formspree payload without sending names, emails, phone numbers, or message contents to GA4.

## Installation

1. Create one GA4 property and web data stream for `archangelcinema.com`.
2. Paste the Google tag immediately after `<head>` in all three HTML pages.
3. Mark `generate_lead` as a key event in GA4.
4. Verify the site in Search Console and link it to the GA4 property.
5. Create one Microsoft Clarity project and paste its tracking snippet into the same three page heads.
6. Add appropriate analytics and session-recording disclosure to the privacy policy and configure consent controls where legally required.
7. Test through GA4 Realtime, DebugView, and Clarity live recordings after the production domain is connected.
