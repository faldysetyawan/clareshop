# Sakura Pop — Panduan (versi gabungan)

Hasil penggabungan `sakura-pop-v3` + `sakura-pop-backend` dalam satu proyek,
plus perbaikan error dan fitur **metode pembayaran (bank, e-wallet, QRIS)**.

## Cara menjalankan

```sh
bun install     # atau: npm install
bun run dev     # atau: npm run dev
```

Buka `http://localhost:5173` (atau port yang ditampilkan).

> Catatan: situs tetap bisa dibuka **tanpa** konfigurasi Supabase (mode lokal,
> memakai konten bawaan + cache browser). Dulu ada bug yang bikin halaman
> error 500 saat env kosong — sudah diperbaiki.

## Mode edit konten

1. Buka situs dengan akhiran `?edit`, mis. `http://localhost:5173/?edit`
2. Klik **Mode edit** (panel bawah) — teks & gambar bisa diketik/diganti langsung.
3. Kelola **produk** (tambah/hapus/gambar) dan **metode pembayaran**.
4. Masukkan **password admin** lalu **Simpan**.

Tanpa backend, perubahan hanya tersimpan di browser itu (draf lokal).
Dengan backend (di bawah), perubahan tampil untuk **semua pengunjung**.

## Backend Supabase (agar edit berlaku di semua perangkat)

Gratis, tanpa kartu kredit.

1. Buat proyek di [supabase.com](https://supabase.com) → **New project**
   (region Singapore), tunggu ±2 menit.
2. **SQL Editor → New query** → salin isi
   `supabase/migrations/20261006000000_site_content.sql` → **Run**.
3. **Project Settings → API**, catat:
   - `SUPABASE_URL` → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` → Secret key (`service_role`)
4. Pasang environment variable (jangan di-commit!):

   | Nama | Nilai |
   |---|---|
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret key |
   | `ADMIN_PASSWORD` | password admin pilihanmu |

5. Deploy ulang / restart server. Coba simpan dari mode `?edit` —
   status harusnya *"Tersimpan. Perubahan sudah tampil untuk semua pengunjung."*

Gambar yang diunggah (produk, logo, QR QRIS) otomatis disimpan ke
Supabase Storage bucket `site-images` (dibuat oleh migrasi di atas).

## Metode pembayaran

Checkout memakai sistem **pembayaran manual** (tanpa payment gateway):
pembeli memilih metode → melihat nomor tujuan / kode QR → transfer →
konfirmasi via WhatsApp. Admin memverifikasi pembayaran manual.

**Mengatur (mode `?edit` → bagian "Metode pembayaran"):**

- Tiga jenis: **Transfer Bank**, **E-Wallet**, **QRIS**.
- Isi nama bank/e-wallet, nomor rekening/nomor HP, nama pemilik, catatan.
- Untuk QRIS: klik gambar untuk mengunggah **kode QR** tokomu.
- Centang **Aktif** hanya untuk metode yang siap dipakai; yang nonaktif
  disembunyikan dari pembeli.
- Bawaan: BCA, BRI, Mandiri, DANA, GoPay, OVO, QRIS (ganti nomornya
  dengan nomor aslimu sebelum dipakai!).

**Alur checkout pembeli:**

1. Isi ID game / akun tujuan → pilih metode pembayaran → *Lanjut ke pembayaran*.
2. Muncul nomor tujuan (tombol **Salin**) atau kode QR + total yang harus dibayar.
3. Setelah transfer, klik **Saya sudah bayar** → pesanan (lengkap dengan
   metode pembayaran) terkirim ke WhatsApp admin.

## Perbaikan error di versi ini

- `routeTree.gen.ts` basi: route `PUT /api/content` tidak terdaftar sehingga
  tombol **Simpan** selalu gagal (404). Sekarang ter-generate ulang otomatis.
- TypeScript error di `src/lib/content.server.ts` (`uploadImage`).
- **Halaman error 500 saat Supabase belum dikonfigurasi**: middleware
  `attachSupabaseAuth` ikut dieksekusi saat SSR dan melempar error bila env
  kosong — mode lokal jadi tidak pernah jalan. Sekarang ditoleransi.
- Penggabungan dari versi backend: konten terakhir dari server di-cache di
  `localStorage`, jadi toko tetap tampil dengan isi terbaru walau server
  sedang tidak terjangkau.

## Struktur penting

- `src/routes/index.tsx` — halaman katalog + mode edit
- `src/components/checkout-dialog.tsx` — checkout 2 langkah + pembayaran
- `src/components/payment-editor.tsx` — editor metode pembayaran
- `src/lib/site-content.ts` — model konten, default, validasi, cache lokal
- `src/lib/content.server.ts` + `src/routes/api/content.ts` — API simpan (butuh `ADMIN_PASSWORD`)

## Deploy ke Netlify

File `netlify.toml` di proyek ini sudah mengatur build & publish otomatis
(build command `npm run build`, publish `dist`, preset Nitro Netlify).

1. Push kode ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "Sakura Pop"
   git remote add origin https://github.com/faldysetyawan/clareshop.git
   git branch -M main
   git push -u origin main
   ```
   > File `.env` otomatis tidak ikut ke-push (sudah ada di `.gitignore`).
   > Saat diminta password, tempel **Personal Access Token** GitHub (bukan password akun).
2. Di netlify.com → **Add new site → Import an existing project** → pilih repo.
   Build settings terisi otomatis dari `netlify.toml`.
3. **Site settings → Environment variables**, tambahkan:

   | Nama | Nilai |
   |---|---|
   | `SUPABASE_URL` | Project URL Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret key (`service_role`) |
   | `ADMIN_PASSWORD` | password admin untuk mode `?edit` |

4. **Deploy site**. Selesai → buka URL Netlify → coba `?edit` → masukkan
   password admin → simpan. Status harusnya *"Tersimpan. Perubahan sudah tampil
   untuk semua pengunjung."*
