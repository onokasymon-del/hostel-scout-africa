-- =========================================================
-- Wishlist / favorites
-- =========================================================
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, hostel_id)
);

create index idx_favorites_user on public.favorites(user_id);
create index idx_favorites_hostel on public.favorites(hostel_id);

alter table public.favorites enable row level security;

create policy "Users view own favorites"
  on public.favorites for select to authenticated
  using (auth.uid() = user_id);

create policy "Users add own favorites"
  on public.favorites for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users remove own favorites"
  on public.favorites for delete to authenticated
  using (auth.uid() = user_id);

-- =========================================================
-- Hostel reports
-- =========================================================
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table public.hostel_reports (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reports_hostel on public.hostel_reports(hostel_id);
create index idx_reports_reporter on public.hostel_reports(reporter_id);
create index idx_reports_status on public.hostel_reports(status);

alter table public.hostel_reports enable row level security;

create policy "Reporters view own reports"
  on public.hostel_reports for select to authenticated
  using (auth.uid() = reporter_id);

create policy "Admins view all reports"
  on public.hostel_reports for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Authenticated users create reports"
  on public.hostel_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

create policy "Admins update reports"
  on public.hostel_reports for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create trigger trg_hostel_reports_updated
  before update on public.hostel_reports
  for each row execute function public.set_updated_at();

-- =========================================================
-- Roommate posts
-- =========================================================
create table public.roommate_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  institution_name text not null,
  campus_area text,
  budget_max integer not null,
  gender_preference text not null default 'any',
  move_in_date date,
  about text not null,
  contact text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_roommate_posts_active on public.roommate_posts(is_active, created_at desc);
create index idx_roommate_posts_author on public.roommate_posts(author_id);

alter table public.roommate_posts enable row level security;

create policy "Anyone views active roommate posts"
  on public.roommate_posts for select
  using (is_active = true or auth.uid() = author_id or public.has_role(auth.uid(), 'admin'));

create policy "Authenticated users create roommate posts"
  on public.roommate_posts for insert to authenticated
  with check (auth.uid() = author_id);

create policy "Authors update own roommate posts"
  on public.roommate_posts for update to authenticated
  using (auth.uid() = author_id);

create policy "Authors or admins delete roommate posts"
  on public.roommate_posts for delete to authenticated
  using (auth.uid() = author_id or public.has_role(auth.uid(), 'admin'));

create trigger trg_roommate_posts_updated
  before update on public.roommate_posts
  for each row execute function public.set_updated_at();
