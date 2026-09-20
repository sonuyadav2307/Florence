-- Florence P0 schema, grants, RLS, and RPCs.
create extension if not exists "pgcrypto";

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  currency_code text not null check (char_length(currency_code) = 3),
  time_zone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  primary key (workspace_id, user_id)
);

create unique index if not exists workspace_members_user_id_uidx
  on public.workspace_members (user_id);

create table if not exists public.flower_variants (
  id text primary key,
  species_key text not null,
  common_name text not null,
  variant_name text not null,
  approximate_hex text not null,
  roles text[] not null,
  style_tags text[] not null,
  texture text,
  catalog_data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  catalog_version integer not null default 1
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 100),
  status text not null check (status in ('draft', 'ready', 'archived')),
  payload jsonb not null,
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_workspace_updated_idx
  on public.projects (workspace_id, updated_at desc);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.flower_variants enable row level security;
alter table public.projects enable row level security;

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.workspace_members where user_id = auth.uid() limit 1;
$$;

revoke all on function public.current_workspace_id() from public;
grant execute on function public.current_workspace_id() to authenticated;

create policy workspaces_select_own on public.workspaces
  for select to authenticated
  using (id = public.current_workspace_id());

create policy members_select_self on public.workspace_members
  for select to authenticated
  using (user_id = auth.uid());

create policy catalog_select_active on public.flower_variants
  for select to authenticated
  using (active = true);

create policy projects_select_workspace on public.projects
  for select to authenticated
  using (workspace_id = public.current_workspace_id());

revoke insert, update, delete on public.projects from anon, authenticated;
revoke insert, update, delete on public.workspaces from anon, authenticated;
revoke insert, update, delete on public.workspace_members from anon, authenticated;
revoke insert, update, delete on public.flower_variants from anon, authenticated;
grant select on public.workspaces, public.workspace_members, public.flower_variants, public.projects to authenticated;

create or replace function public.save_project(
  p_id uuid,
  p_expected_version integer,
  p_name text,
  p_status text,
  p_payload jsonb
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  membership record;
  current public.projects;
begin
  select * into membership
  from public.workspace_members
  where user_id = auth.uid();
  if membership is null or membership.role not in ('admin', 'editor') then
    raise exception 'forbidden';
  end if;

  select * into current from public.projects where id = p_id;
  if current is null or current.workspace_id <> membership.workspace_id then
    raise exception 'not_found';
  end if;
  if current.version <> p_expected_version then
    raise exception 'conflict';
  end if;
  if p_payload is not null and (
    jsonb_typeof(p_payload) <> 'object'
    or p_payload ? 'schemaVersion' = false
    or jsonb_array_length(p_payload -> 'palette' -> 'swatches') <> 5
  ) then
    raise exception 'invalid_input';
  end if;

  update public.projects
  set
    name = coalesce(p_name, name),
    status = coalesce(p_status, status),
    payload = coalesce(p_payload, payload),
    version = version + 1,
    updated_at = now()
  where id = p_id and version = p_expected_version
  returning * into current;
  if current is null then
    raise exception 'conflict';
  end if;
  return current;
end;
$$;

create or replace function public.create_project(p_name text, p_brief jsonb)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  membership record;
  created public.projects;
begin
  select * into membership from public.workspace_members where user_id = auth.uid();
  if membership is null or membership.role not in ('admin', 'editor') then
    raise exception 'forbidden';
  end if;
  insert into public.projects (workspace_id, created_by, name, status, payload)
  values (
    membership.workspace_id,
    auth.uid(),
    p_name,
    'draft',
    jsonb_build_object('schemaVersion', 1, 'brief', coalesce(p_brief, '{}'::jsonb))
  )
  returning * into created;
  return created;
end;
$$;

create or replace function public.duplicate_project(p_id uuid, p_expected_version integer)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  membership record;
  current public.projects;
  created public.projects;
begin
  select * into membership from public.workspace_members where user_id = auth.uid();
  if membership is null or membership.role not in ('admin', 'editor') then
    raise exception 'forbidden';
  end if;
  select * into current from public.projects where id = p_id;
  if current is null or current.workspace_id <> membership.workspace_id then
    raise exception 'not_found';
  end if;
  if current.version <> p_expected_version then
    raise exception 'conflict';
  end if;
  insert into public.projects (workspace_id, created_by, name, status, payload)
  values (
    current.workspace_id,
    auth.uid(),
    left(current.name, 95) || ' Copy',
    'draft',
    current.payload
  )
  returning * into created;
  return created;
end;
$$;

revoke all on function public.save_project(uuid, integer, text, text, jsonb) from public;
revoke all on function public.create_project(text, jsonb) from public;
revoke all on function public.duplicate_project(uuid, integer) from public;
grant execute on function public.save_project(uuid, integer, text, text, jsonb) to authenticated;
grant execute on function public.create_project(text, jsonb) to authenticated;
grant execute on function public.duplicate_project(uuid, integer) to authenticated;
