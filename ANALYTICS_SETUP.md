# Tracking setup for ArchAngel Cinema

## Recommended stack

1. **Google Tag Manager (GTM)** as the single installation point for analytics and future ad-platform tags.
2. **Google Analytics 4 (GA4)** for acquisition, landing-page behavior, and lead attribution.
3. **Google Search Console** for organic queries, impressions, clicks, and landing pages.
4. **Microsoft Clarity** for privacy-masked heatmaps and session recordings.

Use GTM rather than pasting separate vendor scripts throughout the site. It makes later Google Ads, Meta, LinkedIn, or call-tracking additions easier to audit and remove.

## Events already emitted by the site

The site sends these events through `gtag` when the Google tag is installed directly, or through `dataLayer` when GTM is installed:

| Event | When it fires | Parameters | Use |
| --- | --- | --- | --- |
| `generate_lead` | Formspree confirms a successful inquiry | `page_path`, `vertical` | Primary key event |
| `free_asset_click` | A visitor clicks a free-asset CTA | `page_path`, `link_text` | High-intent micro-conversion |
| `proof_page_click` | A visitor opens the proof page | `page_path`, `link_text` | Proof interest |
| `about_page_click` | A visitor opens the Baseer page | `page_path`, `link_text` | Founder-trust interest |
| `managed_card_open` | A visitor explores a managed-service card | `service` | Offer interest |
| `video_start` | A non-scroll video begins | `page_path`, `video_name` | Creative engagement |
| `video_complete` | A non-scroll video finishes | `page_path`, `video_name` | Deep engagement |
| `social_proof_click` | A visitor verifies David's social profile | `page_path`, `platform` | Social-proof verification |

Form submissions preserve `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` in the Formspree payload. Names, emails, company names, URLs, and message contents are not sent to GA4 by the site event code.

## 1. Create GA4

1. In Google Analytics, create one property for ArchAngel Cinema.
2. Create a Web data stream for `https://archangelcinema.com`.
3. Copy the stream's Google tag ID, which begins with `G-`.
4. Leave Enhanced Measurement enabled for page views, outbound clicks, scrolls, and downloads.

Official guide: https://support.google.com/tagmanager/answer/9442095

## 2. Install GTM on every page

1. Create one Web container at https://tagmanager.google.com.
2. Copy the exact two snippets GTM generates for the container.
3. Add the first snippet immediately after `<head>` and the second immediately after `<body>` in:
   - `index.html`
   - `proof/index.html`
   - `dealerships/index.html`
   - `contractors/index.html`
   - `about/index.html`
4. Do not publish the container yet.

## 3. Configure GA4 inside GTM

1. Create a **Google tag** using the `G-` ID and fire it on **Initialization — All Pages**.
2. Enable the built-in `Event` variable.
3. Create Data Layer Variables for:
   - `page_path`
   - `link_text`
   - `vertical`
   - `video_name`
   - `platform`
   - `service`
4. Create one **Custom Event** trigger with this regular expression:

   ```text
   ^(generate_lead|free_asset_click|proof_page_click|about_page_click|managed_card_open|video_start|video_complete|social_proof_click)$
   ```

5. Create one **Google Analytics: GA4 Event** tag:
   - Event name: `{{Event}}`
   - Add the six event parameters above using their matching Data Layer Variables.
   - Trigger: the Custom Event trigger from the previous step.
6. Use GTM Preview and confirm page views plus each relevant custom event before publishing.

Google's current GTM verification workflow uses Tag Assistant Preview: https://support.google.com/tagmanager/answer/9442095

## 4. Mark the real conversion

In GA4, go to **Admin → Data display → Events** and mark only `generate_lead` as a key event. Keep CTA clicks, proof views, videos, and card opens as diagnostic events so the headline conversion rate remains honest.

Official key-event guide: https://support.google.com/analytics/answer/13128484

## 5. Register useful custom dimensions

In **Admin → Data display → Custom definitions**, create event-scoped custom dimensions for:

- `vertical`
- `video_name`
- `platform`
- `service`

`page_path` and link-related data often already have standard GA4 dimensions, so avoid creating redundant definitions unless a report genuinely needs them. Google recommends avoiding unnecessary or high-cardinality custom dimensions.

Official custom-dimension guide: https://support.google.com/analytics/answer/14240153

## 6. Use a consistent UTM convention

Use lowercase values and never change naming halfway through a campaign.

```text
utm_source=google|meta|instagram|linkedin|email|partner
utm_medium=cpc|paid_social|organic_social|email|referral
utm_campaign=2026_q3_free_video_dmv
utm_content=contractor_project_proof_a
utm_term=optional_keyword
```

Every ad or outreach link should receive a UTM-tagged destination. Formspree will retain these values with the lead, allowing the inquiry to be compared with GA4 attribution.

## 7. Connect Search Console

1. Verify the domain property for `archangelcinema.com` in Search Console using the DNS method.
2. Link that property to the GA4 Web data stream.
3. Publish the Search Console reports inside the GA4 Reports library if desired.

Official linking guide: https://support.google.com/analytics/answer/10737381

## 8. Add Clarity carefully

1. Create one Clarity project for the production domain.
2. Install its tag through GTM on All Pages.
3. Keep sensitive-content masking enabled.
4. Confirm the `clarity.ms/collect` request and a live recording before relying on the data.
5. Add analytics/session-recording disclosure and an appropriate consent mechanism for the locations and advertising platforms being used.

Official Clarity installation and verification guide: https://learn.microsoft.com/clarity/setup-and-installation/clarity-setup

## 9. Final validation checklist

- GTM Preview shows the Google tag on all five pages.
- GA4 Realtime receives page views from all five routes.
- `generate_lead` fires only after Formspree returns success—not merely when Submit is clicked.
- CTA, proof, managed-card, About, and video events contain the expected parameters.
- No personal form values appear in GA4, GTM Preview, or Clarity.
- A test UTM submission arrives in Formspree with all five UTM fields.
- Your own office/home traffic is excluded or clearly labeled before judging campaign performance.
- GTM is published as a named version so the setup can be rolled back.

## First reporting view to build

Create a GA4 funnel exploration:

1. `session_start`
2. `free_asset_click` or `proof_page_click`
3. `generate_lead`

Break the funnel down by landing page, source/medium, campaign, device category, and `vertical`. For a low-volume local business, evaluate lead quality in Formspree or the CRM alongside the GA4 count; do not optimize based on clicks alone.
