-- Isi toko (teks, produk, alamat gambar) disimpan sebagai satu baris JSON.
create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS aktif tanpa policy: pengunjung tidak bisa membaca/menulis tabel langsung.
-- Semua akses lewat server (service role) setelah password admin diperiksa.
alter table public.site_content enable row level security;

-- Tempat gambar yang diunggah dari mode edit (publik agar bisa tampil di halaman).
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;
