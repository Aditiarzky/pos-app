
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  // Jalankan browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Atur resolusi viewport sesuai permintaan (2000px)
  await page.setViewport({
    width: 2000,
    height: 2150,
    deviceScaleFactor: 1, // Ubah ke 2 atau 3 jika butuh resolusi cetak yang lebih tajam (4000px/6000px)
  });

  // Buka file HTML lokal
  const filePath = `file://${path.join(__dirname, 'poster.html')}`;
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Simpan elemen body/poster ke gambar
  await page.screenshot({
    path: 'poster-skripsi.png',
    fullPage: true
  });

  console.log('Poster berhasil disimpan sebagai poster-skripsi.png');
  await browser.close();
})();
