-- Riwayat order yang masuk lewat checkout (dicatat otomatis saat pembeli menekan "Saya sudah bayar").
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_name text not null,
  variant_label text not null default '',
  detail text not null default '',
  qty integer not null default 1,
  total integer not null default 0,
  payment_label text not null default '',
  payment_type text not null default '',
  target text not null default '',
  buyer_name text not null default '',
  note text not null default '',
  status text not null default 'pending'
);

-- RLS aktif tanpa policy: pengunjung tidak bisa membaca/menulis tabel langsung.
-- Semua akses lewat server (service role): pencatatan order publik, baca/ubah status perlu password admin.
alter table public.orders enable row level security;

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
