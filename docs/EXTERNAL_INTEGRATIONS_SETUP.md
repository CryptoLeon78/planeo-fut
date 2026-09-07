# PlaneoFUT external integrations setup

This runbook configures external providers without exposing secrets in the browser or repository. Use separate credentials for local, staging and production. Do not paste secret values into chat, issues or `.env.example`.

## 0. Deployment prerequisites

1. Choose the canonical public origins:
   - Local: `http://localhost:3000`
   - Staging: `https://staging.planeofut.com`
   - Production: `https://planeofut.com`
2. Configure the corresponding Supabase Auth site URL and redirect allow-list for `/auth`.
3. Store server secrets in the deployment secret manager (Cloudflare Worker secrets or the hosting provider), not in `VITE_*` variables.
4. Keep the values in `.env.example` as names only. Never commit `.env`.

## 1. Google Calendar OAuth

Create a Google Cloud project, enable **Google Calendar API**, configure the OAuth consent screen and create a **Web application** OAuth client. Add these exact redirect URIs:

```text
http://localhost:3000/api/integrations/google-calendar/callback
https://staging.planeofut.com/api/integrations/google-calendar/callback
https://planeofut.com/api/integrations/google-calendar/callback
```

Use incremental, delegated scopes only:

```text
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.readonly
```

Request `access_type=offline`, validate `state` and PKCE, encrypt refresh tokens at rest and revoke them when the user disconnects. Google requires an exact redirect URI match and refresh-token exchange on the server ([official OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server)).

Required server variables: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`.

## 2. Microsoft Outlook / Graph OAuth

Register an application in Microsoft Entra ID. Add a Web redirect URI for each environment and create a client secret or certificate. Use delegated permissions:

```text
openid profile email offline_access User.Read Calendars.ReadWrite
```

Use the tenant value `common` for multi-tenant sign-in unless the club requires a single tenant. Validate `state`, PKCE and issuer; store refresh tokens server-side. Microsoft documents the authorization-code flow and `offline_access` refresh behavior in its Graph guide ([official documentation](https://learn.microsoft.com/en-us/graph/auth-v2-user)).

Required server variables: `MICROSOFT_TENANT_ID`, `MICROSOFT_CALENDAR_CLIENT_ID`, `MICROSOFT_CALENDAR_CLIENT_SECRET`, `MICROSOFT_CALENDAR_REDIRECT_URI`.

## 3. Email, SMS and Web Push

### Email — Resend

1. Verify `planeofut.com` (or a dedicated subdomain such as `updates.planeofut.com`) in Resend.
2. Publish the SPF and DKIM DNS records; add DMARC once delivery is verified.
3. Create a restricted send-only API key.
4. Set `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL` server-side.

Resend requires a Bearer API key and a verified sending domain for arbitrary recipients ([API authentication](https://resend.com/docs/api-reference/introduction), [domain verification](https://resend.com/docs/dashboard/domains/introduction)).

### SMS — Twilio

1. Create a Messaging Service and attach an approved sender/number.
2. For EU traffic, select the correct regional credentials and complete sender registration.
3. Create a restricted API key; do not use the master Auth Token in application code.
4. Set `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_KEY_SECRET` and `TWILIO_MESSAGING_SERVICE_SID` server-side.

Twilio sends messages through its HTTPS Messaging API and supports API-key authentication ([official API overview](https://www.twilio.com/docs/messaging/api)).

### Web Push

1. Generate one VAPID key pair per environment.
2. Expose only `WEB_PUSH_VAPID_PUBLIC_KEY` to the browser; keep the private key server-only.
3. Persist each `PushSubscription` endpoint and keys per user/device with RLS and a unique endpoint constraint.
4. Send pushes from a server worker using a Web Push library and delete subscriptions returning 404/410.

Push requires an active Service Worker, explicit user gesture/permission and VAPID signing ([MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)).

## 4. Wearables

### Recommended first provider: Garmin Connect Developer Program

Apply for Garmin approval before coding production ingestion. Garmin exposes Health/Activity data through an approved program and supports OAuth 2.0 PKCE, push/pull feeds and evaluation data ([Health API](https://developer.garmin.com/gc-developer-program/health-api/), [OAuth PKCE](https://developerportal.garmin.com/sites/default/files/OAuth2PKCE.pdf)).

After approval, register the callback URI, configure `GARMIN_CONSUMER_KEY`, `GARMIN_CONSUMER_SECRET` and `GARMIN_REDIRECT_URI`, then test only with evaluation data. Persist provider user ID, consent timestamp, scopes and last cursor; normalize heart rate, sleep and training load into a provider-neutral table. Do not ingest health data until consent, retention and deletion workflows are approved.

Apple Watch/HealthKit is a native iOS integration rather than a browser OAuth connector; it requires a companion iOS app with HealthKit entitlements and explicit HealthKit permissions ([Apple HealthKit](https://developer.apple.com/documentation/healthkit)).

## 5. LMS

### Recommended first provider: Moodle

1. Enable Moodle Web Services and REST protocol.
2. Create a dedicated service with only the functions required to create/read course content and completion status.
3. Create a dedicated integration user and token; never use an administrator token.
4. Set `MOODLE_BASE_URL`, `MOODLE_TOKEN` and `MOODLE_SERVICE_NAME` server-side.
5. Start with one-way export of a session as HTML/SCORM-compatible content; add progress sync only after identifiers and retry semantics are defined.

Moodle web-service tokens are sensitive credentials and must be revocable ([Moodle Web Services](https://docs.moodle.org/502/en/Web_services)).

## 6. Acceptance gates before production

- OAuth: callback exact-match, CSRF state, PKCE, token refresh, revoke/disconnect and no token in logs.
- Calendar: idempotent external event IDs, timezone preservation, retries and conflict policy.
- Notifications: user opt-in, quiet hours, deduplication key, provider delivery status and unsubscribe path.
- Wearables: explicit consent, least-privilege scopes, deletion propagation and evaluation fixtures.
- LMS: least-privilege service account, idempotent exports, retry/backoff and audit trail.
- Operations: separate secrets per environment, rotation runbook, alerting and a dry-run mode.

The repository currently contains the local service worker and notification preferences, but it does not yet contain the provider OAuth/token persistence endpoints. Those endpoints should be implemented only after the provider choices and callback domains above are confirmed.
