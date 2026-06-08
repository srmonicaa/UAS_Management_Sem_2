# Simulasi Ujian Interaktif

Web statis untuk latihan ujian dari PDF yang sudah diproses menjadi bank soal.

## Fitur

- Responsif untuk mobile dan desktop.
- Pilih mata kuliah atau gabungkan semua bank soal.
- Pilih jumlah soal.
- Acak urutan soal.
- Koreksi langsung setelah opsi diklik.
- Tombol **Lihat highlight kuning** untuk menampilkan jawaban saat bingung.
- Mode gelap/terang.
- Siap diunggah ke GitHub Pages tanpa instalasi tambahan.

## Cara pakai lokal

Buka file `index.html` langsung di browser, atau jalankan server lokal:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Cara upload ke GitHub Pages

1. Buat repository baru di GitHub.
2. Upload semua file dalam folder ini: `index.html`, `style.css`, `app.js`, `questions.js`, dan `README.md`.
3. Masuk ke **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/root`.
6. Simpan, lalu tunggu GitHub membuat link Pages.

## Ringkasan bank soal

- Perekonomian Indonesia — Perekonomian Indonesia: 120 soal
- Pengantar Ekonomi Mikro — Pengantar Ekonomi Mikro: 120 soal
- Pengantar Akuntansi — Pengantar Akuntansi: 135 soal
- MKDI4202 — Belajar di Era Digital: 100 soal
- ECON4103 — Matematika Ekonomi: 90 soal
- MKWN4110 — Pancasila: 135 soal

Total: 700 soal.

Catatan: Kunci jawaban mengikuti highlight kuning atau teks “Jawaban” yang terdapat pada PDF sumber.
