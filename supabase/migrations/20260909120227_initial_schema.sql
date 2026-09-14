create extension if not exists "pgcrypto";

create type public.app_role as enum ('super_admin', 'librarian', 'assistant', 'viewer');
create type public.book_status as enum ('active', 'archived', 'lost', 'damaged');
create type public.copy_status as enum ('available', 'issued', 'reserved', 'lost', 'damaged', 'maintenance', 'archived');
create type public.copy_condition as enum ('new', 'good', 'fair', 'poor', 'damaged');
create type public.member_type as enum ('student', 'faculty', 'staff', 'guest');
create type public.member_status as enum ('active', 'suspended', 'expired', 'inactive');
create type public.loan_status as enum ('active', 'returned', 'lost');
create type public.reservation_status as enum ('queued', 'ready', 'fulfilled', 'cancelled', 'expired');
create type public.fine_status as enum ('unpaid', 'partially_paid', 'paid', 'waived');

create table public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	full_name text not null,
	email text,
	role public.app_role not null default 'viewer',
	avatar_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.categories (
	id uuid primary key default gen_random_uuid(),
	parent_id uuid references public.categories(id) on delete set null,
	name text not null,
	code text not null unique,
	description text,
	is_active boolean not null default true,
	created_at timestamptz not null default now()
);

create table public.authors (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	biography text,
	nationality text,
	notes text,
	created_at timestamptz not null default now()
);

create table public.publishers (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	address text,
	email text,
	phone text,
	website text,
	notes text,
	created_at timestamptz not null default now()
);

create table public.books (
	id uuid primary key default gen_random_uuid(),
	book_id text not null unique,
	title text not null,
	subtitle text,
	isbn text unique,
	publisher_id uuid references public.publishers(id) on delete set null,
	category_id uuid references public.categories(id) on delete set null,
	publication_year integer check (publication_year between 1000 and 3000),
	edition text,
	language text,
	subject text,
	description text,
	cover_url text,
	shelf text,
	rack text,
	row_label text,
	acquisition_source text,
	acquisition_date date,
	price numeric(12,2) check (price >= 0),
	status public.book_status not null default 'active',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.book_authors (
	book_id uuid not null references public.books(id) on delete cascade,
	author_id uuid not null references public.authors(id) on delete cascade,
	primary key (book_id, author_id)
);

create table public.book_copies (
	id uuid primary key default gen_random_uuid(),
	book_id uuid not null references public.books(id) on delete restrict,
	accession_number text not null unique,
	barcode_value text not null unique,
	status public.copy_status not null default 'available',
	condition public.copy_condition not null default 'good',
	location text,
	acquisition_date date,
	price numeric(12,2) check (price >= 0),
	notes text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	check (accession_number = barcode_value)
);

create table public.members (
	id uuid primary key default gen_random_uuid(),
	member_id text not null unique,
	full_name text not null,
	photo_url text,
	email text,
	phone text,
	department text,
	course text,
	year text,
	roll_number text,
	admission_number text,
	member_type public.member_type not null default 'student',
	address text,
	membership_start date not null default current_date,
	membership_expiry date,
	status public.member_status not null default 'active',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.loans (
	id uuid primary key default gen_random_uuid(),
	copy_id uuid not null references public.book_copies(id) on delete restrict,
	member_id uuid not null references public.members(id) on delete restrict,
	issued_by uuid references public.profiles(id) on delete set null,
	returned_by uuid references public.profiles(id) on delete set null,
	issued_at timestamptz not null default now(),
	due_at timestamptz not null,
	returned_at timestamptz,
	status public.loan_status not null default 'active',
	renewal_count integer not null default 0 check (renewal_count >= 0),
	notes text,
	check (returned_at is null or returned_at >= issued_at)
);

create unique index one_active_loan_per_copy on public.loans(copy_id) where status = 'active';

create table public.renewals (
	id uuid primary key default gen_random_uuid(),
	loan_id uuid not null references public.loans(id) on delete restrict,
	renewed_by uuid references public.profiles(id) on delete set null,
	previous_due_at timestamptz not null,
	new_due_at timestamptz not null,
	created_at timestamptz not null default now()
);

create table public.fines (
	id uuid primary key default gen_random_uuid(),
	loan_id uuid not null references public.loans(id) on delete restrict,
	member_id uuid not null references public.members(id) on delete restrict,
	amount numeric(12,2) not null check (amount >= 0),
	paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0 and paid_amount <= amount),
	status public.fine_status not null default 'unpaid',
	reason text,
	created_at timestamptz not null default now()
);

create table public.fine_payments (
	id uuid primary key default gen_random_uuid(),
	fine_id uuid not null references public.fines(id) on delete restrict,
	amount numeric(12,2) not null check (amount > 0),
	payment_method text not null,
	paid_by uuid references public.profiles(id) on delete set null,
	paid_at timestamptz not null default now(),
	notes text
);

create table public.reservations (
	id uuid primary key default gen_random_uuid(),
	book_id uuid not null references public.books(id) on delete restrict,
	member_id uuid not null references public.members(id) on delete restrict,
	status public.reservation_status not null default 'queued',
	reserved_at timestamptz not null default now(),
	expires_at timestamptz,
	fulfilled_at timestamptz
);

create unique index one_open_reservation_per_member_book on public.reservations(book_id, member_id) where status in ('queued', 'ready');

create table public.suppliers (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	contact_name text,
	email text,
	phone text,
	address text,
	created_at timestamptz not null default now()
);

create table public.acquisitions (
	id uuid primary key default gen_random_uuid(),
	supplier_id uuid references public.suppliers(id) on delete set null,
	invoice_number text,
	purchase_date date not null default current_date,
	notes text,
	created_by uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now()
);

create table public.acquisition_items (
	id uuid primary key default gen_random_uuid(),
	acquisition_id uuid not null references public.acquisitions(id) on delete cascade,
	book_id uuid not null references public.books(id) on delete restrict,
	quantity integer not null check (quantity > 0),
	unit_price numeric(12,2) not null check (unit_price >= 0),
	accession_numbers text[] not null default '{}'
);

create table public.inventory_transactions (
	id uuid primary key default gen_random_uuid(),
	copy_id uuid not null references public.book_copies(id) on delete restrict,
	previous_status public.copy_status,
	new_status public.copy_status not null,
	reason text,
	changed_by uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now()
);

create table public.barcode_print_batches (
	id uuid primary key default gen_random_uuid(),
	preset_name text,
	settings jsonb not null default '{}'::jsonb,
	printed_by uuid references public.profiles(id) on delete set null,
	printed_at timestamptz not null default now()
);

create table public.barcode_print_items (
	id uuid primary key default gen_random_uuid(),
	batch_id uuid not null references public.barcode_print_batches(id) on delete cascade,
	copy_id uuid not null references public.book_copies(id) on delete restrict,
	accession_number text not null,
	reprint_count integer not null default 0 check (reprint_count >= 0)
);

create table public.library_settings (
	id boolean primary key default true check (id),
	library_name text not null default 'College Library',
	logo_url text,
	address text,
	phone text,
	email text,
	default_loan_days integer not null default 14 check (default_loan_days > 0),
	max_books_per_member integer not null default 5 check (max_books_per_member > 0),
	fine_per_day numeric(12,2) not null default 2 check (fine_per_day >= 0),
	maximum_fine numeric(12,2) not null default 200 check (maximum_fine >= 0),
	grace_period_days integer not null default 0 check (grace_period_days >= 0),
	maximum_renewals integer not null default 2 check (maximum_renewals >= 0),
	reservation_days integer not null default 3 check (reservation_days > 0),
	currency text not null default 'INR',
	date_format text not null default 'dd/MM/yyyy',
	updated_by uuid references public.profiles(id) on delete set null,
	updated_at timestamptz not null default now()
);

create table public.activity_logs (
	id uuid primary key default gen_random_uuid(),
	actor_id uuid references public.profiles(id) on delete set null,
	action text not null,
	entity text not null,
	entity_id uuid,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now()
);

create index books_title_search on public.books using gin (to_tsvector('english', title || ' ' || coalesce(subtitle, '')));
create index books_category_idx on public.books(category_id);
create index copies_book_idx on public.book_copies(book_id);
create index copies_status_idx on public.book_copies(status);
create index members_name_idx on public.members(full_name);
create index loans_member_idx on public.loans(member_id);
create index loans_due_idx on public.loans(due_at) where status = 'active';
create index activity_logs_created_idx on public.activity_logs(created_at desc);

create or replace function public.has_role(required_role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
	select exists (select 1 from public.profiles where id = auth.uid() and (role = required_role or role = 'super_admin'));
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
	select exists (select 1 from public.profiles where id = auth.uid() and role in ('super_admin', 'librarian', 'assistant'));
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.authors enable row level security;
alter table public.publishers enable row level security;
alter table public.books enable row level security;
alter table public.book_authors enable row level security;
alter table public.book_copies enable row level security;
alter table public.members enable row level security;
alter table public.loans enable row level security;
alter table public.renewals enable row level security;
alter table public.fines enable row level security;
alter table public.fine_payments enable row level security;
alter table public.reservations enable row level security;
alter table public.suppliers enable row level security;
alter table public.acquisitions enable row level security;
alter table public.acquisition_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.barcode_print_batches enable row level security;
alter table public.barcode_print_items enable row level security;
alter table public.library_settings enable row level security;
alter table public.activity_logs enable row level security;

create policy "authenticated users can read catalog" on public.books for select to authenticated using (true);
create policy "authenticated users can read copies" on public.book_copies for select to authenticated using (true);
create policy "staff can read library data" on public.members for select to authenticated using (public.is_staff());
create policy "staff can manage books" on public.books for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage copies" on public.book_copies for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage members" on public.members for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage circulation" on public.loans for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage renewals" on public.renewals for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage fines" on public.fines for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage fine payments" on public.fine_payments for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "authenticated users can read categories" on public.categories for select to authenticated using (true);
create policy "staff can manage categories" on public.categories for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "authenticated users can read authors" on public.authors for select to authenticated using (true);
create policy "staff can manage authors" on public.authors for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "authenticated users can read publishers" on public.publishers for select to authenticated using (true);
create policy "staff can manage publishers" on public.publishers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage reservations" on public.reservations for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage suppliers" on public.suppliers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage acquisitions" on public.acquisitions for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage acquisition items" on public.acquisition_items for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage inventory" on public.inventory_transactions for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage barcode history" on public.barcode_print_batches for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage barcode items" on public.barcode_print_items for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "authenticated users can read settings" on public.library_settings for select to authenticated using (true);
create policy "admins can manage settings" on public.library_settings for all to authenticated using (public.has_role('super_admin')) with check (public.has_role('super_admin'));
create policy "staff can read activity" on public.activity_logs for select to authenticated using (public.is_staff());
create policy "staff can write activity" on public.activity_logs for insert to authenticated with check (public.is_staff());

insert into public.library_settings (id) values (true) on conflict (id) do nothing;
