-- 장군봉 배드민턴 77 전용 데이터베이스
-- 109의 waiting_state / RPC / 고객 QR과 완전히 다른 테이블을 사용합니다.
create table if not exists public.waiting_state_77 (
  id text primary key,
  settings jsonb not null default '{"난타":15,"4인 복식":15,"2인 단식":15}'::jsonb,
  max_per_court integer not null default 5,
  re_register_minutes integer not null default 5,
  finished jsonb not null default '{}'::jsonb,
  courts jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.waiting_state_77 enable row level security;

drop policy if exists "queue77_public_read" on public.waiting_state_77;
drop policy if exists "queue77_public_insert" on public.waiting_state_77;
drop policy if exists "queue77_public_update" on public.waiting_state_77;

create policy "queue77_public_read" on public.waiting_state_77 for select using (true);
create policy "queue77_public_insert" on public.waiting_state_77 for insert with check (true);
create policy "queue77_public_update" on public.waiting_state_77 for update using (true) with check (true);

insert into public.waiting_state_77(id,settings,max_per_court,re_register_minutes,finished,courts)
values ('waiting_state_77','{"난타":15,"4인 복식":15,"2인 단식":15}',5,5,'{}','[]')
on conflict (id) do nothing;

alter publication supabase_realtime add table public.waiting_state_77;
