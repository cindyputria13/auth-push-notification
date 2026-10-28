# Praktikum Autentikasi JWT dan Push Notification

Pemrograman Mobile (SIF125113), Express + MySQL + React Native (Expo).

Monorepo:

- `backend/` : API Express + MySQL (register, login JWT, profil, push token, kirim notifikasi uji)
- `mobile/`  : source aplikasi Expo (login, SecureStore, protected route, push notification)

## 1. Menjalankan backend

```bash
cd backend
npm install
cp .env.example .env     # lalu isi nilainya (DB_*, JWT_SECRET)
```

Buat database: jalankan `schema.sql` lewat phpMyAdmin / MySQL Workbench / terminal:

```bash
mysql -u root -p < schema.sql
```

Jalankan server:

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`. Untuk pengujian, import
`backend/postman_collection.json` ke Postman (variabel `base_url` dan `token`
sudah disiapkan; token tersimpan otomatis setelah login).

## 2. Menyiapkan aplikasi Expo

Folder `mobile/` hanya berisi source yang ditulis sendiri. Kerangka project dibuat dengan `create-expo-app`:

```bash
# dari root repo, pindahkan source ke folder sementara
mv mobile mobile-src
npx create-expo-app@latest mobile
cd mobile
rm -rf app components hooks constants scripts app-example   # hapus starter bawaan
cp -r ../mobile-src/app ../mobile-src/context ../mobile-src/services ../mobile-src/utils .
cp ../mobile-src/.env.example .env
rm -rf ../mobile-src
npx expo install expo-secure-store expo-notifications expo-constants expo-dev-client
```

Edit `.env`: ganti IP dengan IPv4 laptop (`ipconfig` di Windows). HP dan laptop harus satu jaringan.

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

Edit `app.json`: tambahkan plugin dan package Android.

```json
{
  "expo": {
    "plugins": ["expo-router", "expo-notifications"],
    "android": {
      "package": "id.ac.uinsa.mobileauthnotif",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

(jangan hapus isi `app.json` lainnya; cukup tambahkan/sesuaikan field di atas.)

## 3. Login, profil, logout (tanpa push)

```bash
npx expo start
```

Fitur login, register, protected route, SecureStore, dan profil dapat diuji
dengan Expo Go. Tombol notifikasi hanya berfungsi pada development build.

## 4. Push notification (development build)

1. Buat Firebase project, tambahkan Android app dengan package `id.ac.uinsa.mobileauthnotif`.
2. Unduh `google-services.json` ke root `mobile/`.
3. Buat service account key FCM v1, lalu pasang lewat `eas credentials` (Android).
   **Jangan** commit file service-account ke Git.
4. Jalankan:

```bash
npm install -g eas-cli
eas login
eas init
eas build:configure
eas build --profile development --platform android
```

5. Instal hasil build di HP, jalankan `npx expo start`, buka lewat development build.
6. Login, tekan **Aktifkan Notifikasi**, lalu **Kirim Notifikasi Uji**.

## 5. Daftar endpoint

| Metode | Endpoint | Auth | Body | Respons sukses |
| --- | --- | --- | --- | --- |
| GET | `/` | Tidak | - | 200 `{ pesan }` |
| POST | `/auth/register` | Tidak | `nama, email, password` | 201 `{ id, nama, email }` |
| POST | `/auth/login` | Tidak | `email, password` | 200 `{ token, user }` |
| GET | `/auth/me` | Bearer JWT | - | 200 `{ id, nama, email, dibuat_pada }` |
| POST | `/notifications/token` | Bearer JWT | `expoPushToken` | 201 `{ pesan }` |
| POST | `/notifications/test` | Bearer JWT | - | 200 `{ pesan, hasil }` |

Kode galat: 400 (input tidak valid), 401 (login salah / token tidak ada / rusak / kedaluwarsa), 404 (push token belum terdaftar), 409 (email sudah terdaftar).

## 6. Keamanan

- Password di-hash dengan bcrypt (cost 12), tidak disimpan plaintext.
- JWT HS256 dengan `exp`, `iss`, `aud`, diverifikasi di middleware `wajibLogin`.
- Query memakai prepared statement (`?`).
- Token disimpan di `expo-secure-store`.
- `.env` dan service-account key tidak masuk repository.
