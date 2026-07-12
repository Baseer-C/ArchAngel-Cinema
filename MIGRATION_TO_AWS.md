# Squarespace to AWS Amplify migration

## Recommended architecture

- Domain registration and DNS: Amazon Route 53
- Hosting, CDN, and TLS: AWS Amplify Hosting
- Source and automatic deployments: private GitHub repository
- Forms: Formspree initially
- Analytics: GA4 + Search Console + Microsoft Clarity

## Safe cutover order

1. Finish Formspree and analytics configuration locally.
2. Put only the contents of `archangel-site/` in a private GitHub repository.
3. In AWS Amplify, choose **Create new app → GitHub**, select the repository and production branch, and deploy the static files.
4. Test the temporary `amplifyapp.com` URL completely: `/`, `/dealerships/`, `/contractors/`, both videos, every form, mobile, and HTTPS.
5. In Route 53, record the current DNS configuration and preserve all MX and TXT records used for email and verification.
6. If practical, lower the existing Squarespace web-record TTL to 300 seconds at least several hours before cutover.
7. In Amplify **Domain management**, add `archangelcinema.com` and `www.archangelcinema.com`. Use Amplify's managed certificate and configure one hostname to redirect to the other.
8. Replace only the Squarespace web records with the Amplify records. Do not delete MX, email-verification, DKIM, SPF, or DMARC records.
9. Verify the production domain from multiple networks and confirm HTTPS, redirects, forms, analytics Realtime, Clarity, and Search Console ownership.
10. After the AWS site has worked for at least 48–72 hours, disconnect the third-party domain in Squarespace and then cancel the Squarespace website subscription. The domain remains registered in Route 53.

## Rollback

Keep a copy of the old Squarespace DNS values. During the first 72 hours, restoring those web records provides the fastest rollback if a critical production problem appears.

## Ongoing publishing

Update the GitHub production branch. Amplify builds and publishes the new version automatically. Test major changes on a separate branch or Amplify preview URL before merging.
