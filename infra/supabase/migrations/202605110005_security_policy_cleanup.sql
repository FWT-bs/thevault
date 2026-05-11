revoke execute on function public.handle_new_auth_user() from anon, authenticated, public;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
  end if;
end;
$$;

create policy "offers_read_active" on public.offers
  for select using (active = true);

create policy "ledger_accounts_read_catalog" on public.ledger_accounts
  for select using (true);

create policy "ledger_postings_read_own" on public.ledger_postings
  for select using (
    exists (
      select 1
      from public.ledger_entries le
      where le.id = ledger_postings.ledger_entry_id
        and le.user_id = (select auth.uid())
    )
  );
