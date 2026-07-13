# Tracking setup for ArchAngel Cinema

## Current implementation

The existing Squarespace-era GA4 property and Web data stream are being reused. The Google tag for measurement ID `G-JGWJEMBYHK` is installed directly after `<head>` on all five pages:

- `index.html`
- `proof/index.html`
- `dealerships/index.html`
- `contractors/index.html`
- `about/index.html`

This preserves the property's historical data and does not require a Route 53 or DNS change. Google Tag Manager is not required for the current site; it can be added later if several additional advertising or analytics vendors need to be managed centrally.

## Events emitted by the site

| Event | When it fires | Parameters | Use |
| --- | --- | --- | --- |
| `generate_lead` | Formspree confirms a successful inquiry | `page_path`, `vertical`, `cta_location` | Primary key event and Ads conversion |
| `lead_form_attempt` | A valid form begins sending | `page_path`, `vertical`, `cta_location` | Form-delivery diagnostic |
| `lead_form_error` | A sent form is rejected, times out, or loses the network | `page_path`, `vertical`, `cta_location`, `error_type`, optional `http_status` | Form-delivery diagnostic |
| `free_asset_click` | A visitor clicks a free-asset CTA | `page_path`, `link_text`, `cta_location` | High-intent micro-conversion |
| `proof_page_click` | A visitor opens the proof page | `page_path`, `link_text` | Proof interest |
| `about_page_click` | A visitor opens the Baseer page | `page_path`, `link_text` | Founder-trust interest |
| `managed_card_open` | A visitor explores a managed-service card | `service` | Offer interest |
| `video_start` | A non-scroll video begins | `page_path`, `video_name` | Creative engagement |
| `video_complete` | A non-scroll video finishes | `page_path`, `video_name` | Deep engagement |
| `social_proof_click` | A visitor verifies David's social profile | `page_path`, `platform` | Social-proof verification |

Form submissions preserve `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` in the Formspree payload. Names, emails, company names, URLs, and message contents are not sent to GA4 by the custom event code.

## 1. Publish and verify the Google tag

1. Upload the five HTML pages containing the tag to S3.
2. Invalidate the CloudFront cache for `/*`.
3. Open the production site in a private browser window and visit several pages.
4. In GA4, open **Reports → Realtime** and confirm the current user and page views appear.
5. Use Google Tag Assistant if the Realtime report stays empty.

Google's manual-installation guidance calls for one complete Google tag on every page, immediately after `<head>`: https://support.google.com/analytics/answer/9744165

## 2. Verify the custom events

After the production tag is live, test these actions while watching GA4 Realtime or DebugView:

1. Click a free-video CTA and confirm `free_asset_click`.
2. Open Proof and confirm `proof_page_click`.
3. Open a Managed Monthly card and confirm `managed_card_open`.
4. Open the Baseer page from the founder strip and confirm `about_page_click`.
5. Start and finish a portfolio video and confirm `video_start` and `video_complete`.
6. Submit one genuine test inquiry and confirm `generate_lead` appears only after Formspree reports success.

Do not create separate GA4 events from generic click or submit rules for these actions; the site already emits the correctly named events, and duplicating them would inflate the numbers.

## 3. Mark the real lead conversion

In GA4, go to **Admin → Data display → Events** and mark only `generate_lead` as a key event. Leave CTA clicks, proof views, card opens, and videos as diagnostic events so the reported lead-conversion rate remains honest.

Official key-event guide: https://support.google.com/analytics/answer/13128484

## 4. Link Google Ads account 869-337-2243

1. In GA4, go to **Admin → Product links → Google Ads links**.
2. Click **Link**, choose Google Ads account `869-337-2243`, and complete the link.
3. In Google Ads, verify auto-tagging is enabled.
4. After `generate_lead` has appeared in GA4, go to **Goals → Conversions → Summary**.
5. Click **Create conversion action**, choose the connected GA4 property, and select `generate_lead`.
6. Save it and use it as the campaign's primary lead conversion only after a real test lead has been recorded correctly.

Official linking guide: https://support.google.com/analytics/answer/9379420

Official conversion-import guide: https://support.google.com/google-ads/answer/2375435

The separate `AW-18168112853` destination shown in Google Tags does not need to be pasted into the website just to import the GA4 lead event. Linking GA4 to Google Ads and creating the Ads conversion from `generate_lead` avoids maintaining two independent lead definitions.

## 5. Register useful custom dimensions

In **Admin → Data display → Custom definitions**, create event-scoped custom dimensions for:

- `vertical`
- `cta_location`
- `video_name`
- `platform`
- `service`

Avoid unnecessary or high-cardinality dimensions. Page path and common link information already have standard GA4 reporting dimensions.

Official custom-dimension guide: https://support.google.com/analytics/answer/14240153

## 6. Use one UTM convention

Use lowercase values and do not change naming halfway through a campaign.

```text
utm_source=google|meta|instagram|linkedin|email|partner
utm_medium=cpc|paid_social|organic_social|email|referral
utm_campaign=2026_q3_free_video_dmv
utm_content=contractor_project_proof_a
utm_term=optional_keyword
```

Every paid ad or outreach link should use a tagged destination. Formspree retains the UTM values with the lead, so lead quality can be compared with GA4 attribution.

## 7. Search Console and Clarity

The Route 53 screenshot already shows a Google site-verification TXT value. Confirm the domain property is available in Search Console, then link it to this GA4 property under **Admin → Product links → Search Console links**.

Official Search Console linking guide: https://support.google.com/analytics/answer/10737381

Microsoft Clarity is optional. If enabled, install its project tag on all five pages, retain sensitive-content masking, and add appropriate privacy/consent disclosures for the jurisdictions and advertising tools being used.

Official Clarity installation guide: https://learn.microsoft.com/clarity/setup-and-installation/clarity-setup

## Final validation checklist

- Exactly one Google tag with ID `G-JGWJEMBYHK` appears on every page.
- GA4 Realtime receives all five routes.
- `generate_lead` fires only after a successful Formspree response.
- No personal form values appear in GA4 or Google Ads.
- A test UTM submission reaches Formspree with all five UTM fields.
- GA4 is linked to Google Ads account `869-337-2243`.
- Google Ads receives one conversion action based on `generate_lead`.
- Internal/test traffic is excluded or clearly labeled before evaluating campaign performance.

## First report to build

Create a GA4 funnel exploration:

1. `session_start`
2. `free_asset_click` or `proof_page_click`
3. `generate_lead`

Break it down by landing page, source/medium, campaign, device category, `vertical`, and `cta_location`. For a low-volume local business, always compare the GA4 lead count with actual lead quality in Formspree or the CRM.
