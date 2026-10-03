# PlaneoFUT managed access

## Operating model

PlaneoFUT uses managed email-and-password accounts. Public sign-up is disabled in Supabase: coaches request access or password recovery by email, and the administrator verifies each request before creating an account or assigning a temporary password.

Each account receives its own `auth.users` identity and `coach` role. Teams, players, exercises, sessions, microcycles and templates remain protected by owner- or membership-scoped RLS policies. A publishable Supabase key is bundled with the portable; a service-role key must never be placed in `portable-config.json`.

## Support email

Set the administrator's personal Gmail in the web environment and in every distributed `portable-config.json`:

For the current administrator, use `ivanaza8@gmail.com`:

```env
VITE_SUPPORT_EMAIL="ivanaza8@gmail.com"
```

```json
{
  "supportEmail": "ivanaza8@gmail.com"
}
```

The app opens a pre-filled email for account requests and password recovery. The requester must never send a password by email. Before acting, verify the requester through a known club channel. Share the resulting temporary password only through a trusted channel and ask the coach to change it after entering.

No SMTP, Resend account or DNS domain is used in this mode.

## Administrator commands

Run these commands only from the administrator PC. The service-role key is process-local and must never be copied to the portable.

```powershell
$env:SUPABASE_URL = "https://blikbsxtvryiqazufbtw.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"
$env:PLANEOFUT_TEMP_PASSWORD = "temporary-password-with-at-least-12-characters"

# After approving a new coach
npm run auth:manage-user -- create --email "coach@example.com" --name "Coach name"

# After validating a password-recovery request
npm run auth:manage-user -- reset --email "coach@example.com"

Remove-Item Env:PLANEOFUT_TEMP_PASSWORD, Env:SUPABASE_SERVICE_ROLE_KEY
```

The script creates users with their email already confirmed. For a reset, it updates only the selected user password; review the user's active sessions in Supabase before providing the temporary password.

## Hosted Supabase configuration

For project `blikbsxtvryiqazufbtw`:

1. Keep the Email provider enabled.
2. Disable **Allow new users to sign up**.
3. Keep anonymous sign-ins disabled.
4. Set a strong password policy and enable leaked-password protection if available.

## Future self-service mode

If you later open registration beyond known colleagues, configure a verified-domain custom SMTP service, enable Confirm Email, set `emailConfirmationRequired` to `true` in each portable configuration, and add approved redirect URLs in Supabase.
