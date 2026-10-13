# Budget alerts and weekly recap emails

## Deploy

From the repository root, link the intended Supabase project, then apply the schema migration and deploy both Edge Functions:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy check-budget-alerts
supabase functions deploy weekly-tips
```

Set the Edge Function secrets in the Supabase project. Use a verified sender address/domain in Resend:

```sh
supabase secrets set RESEND_API_KEY=YOUR_RESEND_API_KEY RESEND_FROM_EMAIL="ExpenseAi <notifications@your-domain.com>" GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

To show the app logo in email headers, upload `assets/images/expenseai-logo.png` to a public Supabase Storage bucket (or another public HTTPS host) and set `EMAIL_LOGO_URL` to its public URL. Without this optional secret, emails use an ExpenseAi text wordmark.

## Enable the schedules

The functions require Supabase JWT verification. The SQL schedule calls use the project service-role key from Vault, so the key is never embedded in this repository. In the Supabase SQL editor, store these two Vault secrets using the actual project URL and service-role key:

```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'supabase_url');
select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
```

Then run [`cron.sql`](./cron.sql) in the SQL editor. It schedules budget checks daily at 09:00 UTC and weekly recaps on Monday at 09:00 UTC. The weekly function also enforces a seven-day per-user cooldown, so retrying a scheduled invocation does not normally send a second email.

Run the migration before deploying the functions. It adds the alert threshold and weekly send timestamp columns expected by the function queries.
