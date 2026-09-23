import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const projectRoot = process.cwd();
const iconsDir = path.join(projectRoot, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Read the SVG content
const svgPath = path.join(projectRoot, 'public', 'gunung-muria-grosir-icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Also check embedded base64 in SVG
const match = svgContent.match(/href="data:image\/png;base64,([^"]+)"/);
let logoDataUrl = '';
if (match) {
  logoDataUrl = `data:image/png;base64,${match[1]}`;
} else {
  const gmPng = fs.readFileSync(path.join(projectRoot, 'public', 'gm-icon.png'));
  logoDataUrl = `data:image/png;base64,${gmPng.toString('base64')}`;
}

const targets = [
  { name: 'icon-512.png', size: 512, paddingRatio: 0.12 },
  { name: 'icon-192.png', size: 192, paddingRatio: 0.12 },
  { name: 'apple-touch-icon.png', size: 180, paddingRatio: 0.08 },
  { name: 'badge-72.png', size: 72, paddingRatio: 0.1 },
];

async function generate() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const target of targets) {
      const page = await browser.newPage();
      await page.setViewport({ width: target.size, height: target.size, deviceScaleFactor: 1 });

      const padding = Math.round(target.size * target.paddingRatio);
      const innerSize = target.size - padding * 2;

      // HTML template with a clean background and centered logo with maskable safe zone padding
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: ${target.size}px;
              height: ${target.size}px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #ffffff;
              overflow: hidden;
            }
            .logo {
              width: ${innerSize}px;
              height: ${innerSize}px;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img class="logo" src="${logoDataUrl}" alt="Logo" />
        </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });
      const outputPath = path.join(iconsDir, target.name);
      await page.screenshot({ path: outputPath, type: 'png' });
      console.log(`Generated: ${target.name} (${target.size}x${target.size})`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
