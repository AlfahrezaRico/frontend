# Perbaikan Masalah Perhitungan Payroll

## Masalah yang Ditemukan

1. **404 Error pada endpoint `/api/payrolls/calculate`**
   - Backend tidak dapat ditemukan
   - Endpoint tidak tersedia

2. **Environment Variable `VITE_API_URL` tidak ter-set**
   - API_URL menjadi string kosong
   - Request tidak dapat dikirim ke backend

3. **Inkonsistensi data antara form state dan request body**
   - `basic_salary` di form state vs request body berbeda
   - Data yang dikirim tidak konsisten

## Solusi yang Diterapkan

### 1. Environment Variables
- Dibuat file `.env` dan `.env.local` dengan:
  ```
  VITE_API_URL=https://backend-production-261d.up.railway.app
  ```

### 2. Validasi API_URL
- Ditambahkan validasi `API_URL` tidak boleh kosong
- Error handling yang lebih informatif
- Toast notification untuk user

### 3. Fallback Calculation
- Jika backend tidak tersedia, gunakan perhitungan fallback
- Komponen BPJS dan PPH21 dihitung berdasarkan persentase gaji pokok
- User tetap bisa melihat perhitungan meski backend down

### 4. Perbaikan Error Handling
- Error message yang lebih spesifik
- Handling untuk berbagai jenis error (404, network, dll)
- Fallback calculation otomatis

### 5. Konsistensi Data
- Perbaikan logika pengiriman data ke backend
- Delay yang cukup untuk memastikan state ter-update
- Validasi data sebelum dikirim

## Cara Kerja Perbaikan

1. **Saat aplikasi dimuat:**
   - Validasi `API_URL` tersedia
   - Jika kosong, tampilkan error dan hentikan proses

2. **Saat karyawan dipilih:**
   - Load data salary
   - Trigger perhitungan backend
   - Jika backend error, gunakan fallback calculation

3. **Fallback Calculation:**
   - BPJS Kesehatan: 1% (karyawan), 4% (perusahaan)
   - BPJS JHT: 2% (karyawan), 3.7% (perusahaan)
   - BPJS JP: 1% (karyawan), 2% (perusahaan)
   - BPJS JKK: 0.24% (perusahaan)
   - BPJS JKM: 0.3% (perusahaan)
   - PPH21: 5% (estimasi)

## Testing

1. Restart development server:
   ```bash
   npm run dev
   ```

2. Buka aplikasi dan pilih karyawan
3. Periksa console untuk memastikan:
   - API_URL ter-load dengan benar
   - Request dikirim ke endpoint yang benar
   - Fallback calculation berfungsi jika backend error

## File yang Dimodifikasi

- `src/components/hrd-content/PayrollContent.tsx`
- `.env` (baru)
- `.env.local` (baru)

## Catatan

- Pastikan backend server berjalan dan endpoint `/api/payrolls/calculate` tersedia
- Jika backend tetap tidak tersedia, aplikasi akan menggunakan fallback calculation
- User akan mendapat notifikasi yang jelas tentang status backend