# ProofTag - Aplikasi Pemindai & Verifikasi QR/Barcode

Aplikasi full-stack untuk memindai kode QR dan barcode guna memverifikasi produk terhadap database.

## Fitur

- **Pemindai Kamera**: Pindai kode QR dan barcode menggunakan kamera perangkat Anda
- **Entri Manual**: Masukkan barcode secara manual jika pemindaian kamera tidak tersedia
- **Verifikasi Produk**: Verifikasi real-time terhadap database MySQL
- **Riwayat Pemindaian**: Lacak semua pemindaian dengan waktu dan hasil
- **Panel Admin**: Kelola produk (Buat, Baca, Perbarui, Hapus)
- **Desain Responsif**: Bekerja di desktop dan perangkat mobile

## Teknologi yang Digunakan

### Backend
- Node.js + Express
- Prisma ORM
- MySQL Database
- CORS diaktifkan untuk komunikasi frontend

### Frontend
- React + Vite
- React Router untuk navigasi
- Axios untuk panggilan API
- Backend image processing dengan zbar-tools untuk pemindaian QR/barcode

## Struktur Proyek

```
prooftTag/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Skema database
│   │   ├── seed.js                # Data awal
│   │   └── migrations/            # Migrasi database
│   ├── src/
│   │   ├── controllers/           # Pengendali request
│   │   ├── routes/                # Route API
│   │   ├── services/              # Logika bisnis & pemrosesan barcode
│   │   ├── middleware/            # Middleware Express
│   │   ├── utils/                 # Utilitas (Prisma client)
│   │   └── server.js              # Server Express
│   ├── .env                       # Variabel environment
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Scanner/           # Komponen pemindai
    │   │   └── Layout/            # Komponen layout
    │   ├── pages/                 # Halaman utama
    │   ├── services/              # Service API
    │   └── App.jsx                # Komponen aplikasi utama
    ├── vite.config.js             # Konfigurasi Vite
    └── package.json
```

## Instruksi Instalasi

### Prasyarat

- Node.js (v16 atau lebih tinggi)
- MySQL database
- npm atau yarn
- zbar-tools untuk pemindaian barcode (Ubuntu/Debian: `sudo apt-get install zbar-tools`)

### Instalasi Backend

1. Navigasi ke direktori backend:
   ```bash
   cd backend
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Konfigurasi variabel environment:
   - Edit file `.env` dengan kredensial database Anda
   - Default: `DATABASE_URL="mysql://<username>:<password>@<host>:<port>/<database>"`

4. Jalankan migrasi database:
   ```bash
   npm run prisma:migrate
   ```

5. Isi database dengan data awal:
   ```bash
   npm run prisma:seed
   ```

6. Jalankan server backend:
   ```bash
   npm run dev
   ```
   
   Backend akan berjalan di: http://localhost:5000

### Instalasi Frontend

1. Navigasi ke direktori frontend:
   ```bash
   cd frontend
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Jalankan development server:
   ```bash
   npm run dev
   ```
   
   Frontend akan berjalan di: http://localhost:5174

## Cara Penggunaan

### Halaman Pemindai

1. Navigasi ke http://localhost:5174
2. Pilih antara "Camera Scan" atau "Manual Entry"
3. **Mode Kamera**: 
   - Klik "Start Scanner" dan arahkan ke kode QR atau barcode
   - Sistem akan otomatis menangkap gambar setiap 2 detik
   - Gambar dikirim ke backend untuk diproses menggunakan zbar-tools
   - Maksimal 10 percobaan deteksi sebelum otomatis berhenti
   - Counter real-time menampilkan jumlah percobaan (1/10, 2/10, dst.)
4. **Mode Manual**: Masukkan nomor barcode dan klik "Verify Barcode"
5. Lihat hasil verifikasi secara langsung dengan notifikasi toast

### Halaman Riwayat

1. Navigasi ke http://localhost:5174/history
2. Lihat semua pemindaian sebelumnya dengan:
   - Tanggal dan waktu
   - Nomor barcode
   - Status verifikasi (Ditemukan/Tidak Ditemukan)
   - Detail produk (jika ditemukan)

### Halaman Admin

1. Navigasi ke http://localhost:5174/admin
2. **Tambah Produk**: Klik tombol "+ Add Product"
   - Masukkan Barcode (wajib)
   - Masukkan Nama Produk (wajib)
   - Masukkan Satuan (opsional, contoh: ITEM, PACK, KG)
   - Masukkan Rating (opsional, 1-5 bintang)
3. **Edit Produk**: Klik tombol "Edit" pada baris produk
4. **Hapus Produk**: Klik tombol "Delete" (dengan konfirmasi)

## Endpoint API

### Produk

- `GET /api/products/verify/:barcode` - Verifikasi produk berdasarkan barcode
- `GET /api/products` - Dapatkan semua produk
- `POST /api/products` - Buat produk baru
- `PUT /api/products/:id` - Perbarui produk
- `DELETE /api/products/:id` - Hapus produk
- `GET /api/products/search?q=query` - Cari produk

### Barcode Scanning

- `POST /api/barcode/scan-image` - Upload gambar untuk pemindaian barcode
  - Menerima: multipart/form-data dengan field 'image'
  - Memproses: Menggunakan zbarimg untuk mendeteksi barcode
  - Mengembalikan: Hasil barcode atau error jika tidak ditemukan

### Pemindaian

- `GET /api/scans/history?limit=50` - Dapatkan riwayat pemindaian
- `GET /api/scans/stats` - Dapatkan statistik pemindaian
- `POST /api/scans` - Catat pemindaian secara manual

### Health Check

- `GET /api/health` - Pemeriksaan kesehatan server

## Data Contoh

Data awal mencakup:

1. **Barcode**: 6281006703841
   - **Produk**: LIPTON GREEN TEA 1X150G 100S CLASSIC GREEN TEA
   - **Satuan**: ITEM
   - **Rating**: 1 bintang

2. **Barcode**: 8996001326220
   - **Produk**: KISS Mint Cherry
   - **Satuan**: ITEM
   - **Rating**: 5 bintang

## Skema Database

### Tabel Product

| Field       | Tipe    | Deskripsi                      |
|-------------|---------|--------------------------------|
| id          | Int     | Primary key (auto-increment)   |
| barcode     | String  | Identifier barcode unik        |
| productName | String  | Nama produk                    |
| measure     | String  | Satuan ukuran (opsional)       |
| rating      | Int     | Rating 1-5 (opsional)          |
| createdAt   | DateTime| Timestamp pembuatan            |
| updatedAt   | DateTime| Timestamp pembaruan terakhir   |

### Tabel ScanHistory

| Field      | Tipe     | Deskripsi                      |
|------------|----------|--------------------------------|
| id         | Int      | Primary key (auto-increment)   |
| barcode    | String   | Barcode yang dipindai          |
| found      | Boolean  | Apakah produk ditemukan        |
| productId  | Int      | Foreign key ke Product (nullable)|
| scannedAt  | DateTime | Timestamp pemindaian           |

## Izin Kamera

### Untuk Deployment HTTPS

- Akses kamera memerlukan HTTPS di lingkungan produksi
- Development menggunakan localhost (diizinkan melalui HTTP)
- Untuk testing mobile, gunakan ngrok atau layanan tunneling serupa

### Kompatibilitas Browser

- Chrome/Edge: Dukungan penuh
- Firefox: Dukungan penuh
- Safari (iOS): Memerlukan iOS 11+ dan HTTPS
- Izin kamera harus diberikan oleh pengguna

## Pemecahan Masalah

### Masalah Backend

1. **Error koneksi database**:
   - Verifikasi MySQL sedang berjalan
   - Periksa DATABASE_URL di `.env`
   - Pastikan database `proofTag` sudah ada

2. **Port sudah digunakan**:
   - Ubah PORT di `.env`
   - Matikan proses yang menggunakan port 5000: `lsof -ti:5000 | xargs kill`

3. **zbarimg tidak ditemukan**:
   - Instal zbar-tools: `sudo apt-get install zbar-tools`
   - Verifikasi instalasi: `which zbarimg`

### Masalah Frontend

1. **Kamera tidak berfungsi**:
   - Pastikan menggunakan HTTPS (atau localhost)
   - Periksa izin browser
   - Gunakan entri manual sebagai alternatif
   - Hard refresh browser (Ctrl+Shift+R) untuk memuat kode terbaru

2. **Error API**:
   - Verifikasi backend berjalan di port 5000
   - Periksa browser console untuk error CORS
   - Pastikan proxy dikonfigurasi di `vite.config.js`

3. **Scanner tidak berhenti setelah 10 percobaan**:
   - Lakukan hard refresh (Ctrl+Shift+R atau Cmd+Shift+R)
   - Clear browser cache
   - Restart frontend development server

### Masalah Deteksi Barcode

1. **Barcode tidak terdeteksi**:
   - Pastikan barcode dalam fokus dan pencahayaan baik
   - Jaga jarak 15-25cm dari kamera
   - Tahan kamera stabil saat "Analyzing..." muncul
   - Gunakan Manual Entry untuk hasil pasti
   - Barcode tipe EAN/UPC didukung, QR code juga didukung

## Perintah Development

### Backend

```bash
npm run dev           # Jalankan development server dengan nodemon
npm start             # Jalankan production server
npm run prisma:migrate # Jalankan migrasi database
npm run prisma:seed   # Isi database dengan data awal
npm run prisma:studio # Buka Prisma Studio (GUI database)
```

### Frontend

```bash
npm run dev    # Jalankan Vite dev server
npm run build  # Build untuk produksi
npm run preview # Preview build produksi
```

## Deployment Produksi

### Backend

1. Set `NODE_ENV=production` di environment
2. Gunakan process manager (PM2, systemd)
3. Konfigurasi DATABASE_URL yang tepat untuk produksi
4. Set up reverse proxy (nginx)
5. Aktifkan SSL/TLS
6. Pastikan zbar-tools terinstal di server produksi

### Frontend

1. Build aplikasi: `npm run build`
2. Deploy folder `dist/` ke static hosting
3. Konfigurasi URL API sesuai environment
4. Pastikan HTTPS untuk akses kamera

## Fitur Utama Pemindaian

### Backend Image Processing

- Gambar ditangkap dari kamera frontend setiap 2 detik
- Dikirim ke backend melalui multipart/form-data
- Diproses menggunakan `zbarimg` CLI tool dengan flag `-S*.enable`
- Mendukung semua tipe barcode EAN/UPC dan QR code
- File temporary dibersihkan otomatis setelah pemrosesan

### Auto-Stop Scanner

- Scanner otomatis berhenti setelah 10 percobaan gagal
- Counter real-time menampilkan progress (1/10, 2/10, dst.)
- Peringatan visual dengan warna:
  - Kuning: 0-6 percobaan
  - Merah: 7-10 percobaan
- Tombol berubah menjadi "Start Scanner Again" setelah auto-stop

### Toast Notifications

- Loading state saat memverifikasi
- Sukses dengan detail produk
- Error jika barcode tidak ditemukan
- Auto-close kamera setelah pemindaian berhasil

## Arsitektur Sistem

```
Frontend (React)
    ↓ Capture frame setiap 2 detik
    ↓ Convert to JPEG blob
    ↓ POST multipart/form-data
Backend (Express)
    ↓ Receive via Multer
    ↓ Save to temp file
    ↓ Execute zbarimg CLI
    ↓ Parse hasil
    ↓ Cleanup temp file
    ↓ Query database jika barcode ditemukan
    ↓ Return result
Frontend
    ↓ Display toast notification
    ↓ Auto-stop camera jika sukses
```

## Lisensi

ISC

## Dukungan

Untuk masalah atau pertanyaan, silakan hubungi tim development.
