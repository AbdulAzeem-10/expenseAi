-- Run after storing `supabase_url` and `service_role_key` in Supabase Vault.
-- Re-running this file replaces these two named jobs.
select cron.unschedule(jobid)
from cron.job
where jobname in ('expenseai-budget-alerts-daily', 'expenseai-weekly-tips');

select cron.schedule(
  'expenseai-budget-alerts-daily',
  '0 9 * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/check-budget-alerts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

select cron.schedule(
  'expenseai-weekly-tips',
  '0 9 * * 1',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/weekly-tips',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
