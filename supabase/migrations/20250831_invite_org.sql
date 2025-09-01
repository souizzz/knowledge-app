-- 拡張（UUID生成）
create extension if not exists "pgcrypto";

-- 組織
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- プロフィール（任意）
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  created_at timestamptz not null default now()
);

-- 組織メンバー
create table if not exists public.org_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- 招待
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

-- RLS 有効化
alter table public.organizations enable row level security;
alter table public.org_members  enable row level security;
alter table public.invites      enable row level security;

-- org: メンバーのみ閲覧
create policy org_read on public.organizations
for select using (
  exists (
    select 1 from public.org_members m
    where m.org_id = organizations.id and m.user_id = auth.uid()
  )
);

-- org: 自分をownerとして作成するinsertのみ許可
create policy org_insert_self_owner on public.organizations
for insert with check (owner_id = auth.uid());

-- org_members: 本人行のみ参照
create policy org_members_self_read on public.org_members
for select using (user_id = auth.uid());

-- org_members: 自分のレコードinsert（owner/member問わず）を許可
create policy org_members_self_insert on public.org_members
for insert with check (user_id = auth.uid());

-- invites: ownerのみ insert/read
create policy invites_owner_insert on public.invites
for insert with check (
  exists (
    select 1 from public.org_members m
    where m.org_id = invites.org_id
      and m.user_id = auth.uid()
      and m.role   = 'owner'
  )
);
create policy invites_owner_read on public.invites
for select using (
  exists (
    select 1 from public.org_members m
    where m.org_id = invites.org_id
      and m.user_id = auth.uid()
      and m.role   = 'owner'
  )
);

-- 招待受諾関数：JWTのemail一致を検証し、メンバー化
create or replace function public.accept_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_inv public.invites%rowtype;
  v_user uuid := auth.uid();
  v_email_in_jwt text := lower(coalesce((auth.jwt() ->> 'email'),''));
begin
  select * into v_inv
  from public.invites
  where id = p_invite_id
    and used_at is null
    and expires_at > now();

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  if v_email_in_jwt <> lower(v_inv.email) then
    raise exception 'Email does not match invite';
  end if;

  insert into public.org_members(org_id, user_id, role)
  values (v_inv.org_id, v_user, 'member')
  on conflict (org_id, user_id) do nothing;

  update public.invites set used_at = now() where id = v_inv.id;

  return v_inv.org_id;
end $$;

grant execute on function public.accept_invite(uuid) to authenticated;
