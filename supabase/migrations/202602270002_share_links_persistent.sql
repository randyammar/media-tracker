alter table public.share_links
add column if not exists token text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'share_links_token_key'
  ) then
    alter table public.share_links
    add constraint share_links_token_key unique (token);
  end if;
end $$;

with duplicate_active_links as (
  select
    id,
    row_number() over (
      partition by owner_id, scope_type, coalesce(media_item_id, '00000000-0000-0000-0000-000000000000'::uuid)
      order by created_at desc, id desc
    ) as row_num
  from public.share_links
  where is_revoked = false
)
update public.share_links as links
set is_revoked = true
from duplicate_active_links as d
where links.id = d.id
  and d.row_num > 1;

create unique index if not exists share_links_active_scope_idx
on public.share_links (owner_id, scope_type, coalesce(media_item_id, '00000000-0000-0000-0000-000000000000'::uuid))
where is_revoked = false;
