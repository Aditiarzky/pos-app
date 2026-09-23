import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('=== PWA SPRINT 1 VALIDATION ===\n');

let allPassed = true;

function check(title, condition, detail = '') {
  if (condition) {
    console.log(`[PASS] ${title}${detail ? ` (${detail})` : ''}`);
  } else {
    console.error(`[FAIL] ${title}${detail ? ` (${detail})` : ''}`);
    allPassed = false;
  }
}

// 1. Check manifest.webmanifest exists and is valid JSON
const manifestPath = path.join(projectRoot, 'public', 'manifest.webmanifest');
check('Manifest file exists', fs.existsSync(manifestPath), manifestPath);

let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  check('Manifest is valid JSON', true);
} catch (e) {
  check('Manifest is valid JSON', false, e.message);
}

if (manifest) {
  check('Manifest has id', manifest.id === '/');
  check('Manifest has name', manifest.name === 'POS App');
  check('Manifest has short_name', manifest.short_name === 'POS');
  check('Manifest start_url is /dashboard/sales?source=pwa', manifest.start_url === '/dashboard/sales?source=pwa');
  check('Manifest display is standalone', manifest.display === 'standalone');
  check('Manifest theme_color is #0f766e', manifest.theme_color === '#0f766e');
  check('Manifest background_color is #ffffff', manifest.background_color === '#ffffff');
  check('Manifest scope is /', manifest.scope === '/');
  check('Manifest has icons array', Array.isArray(manifest.icons) && manifest.icons.length >= 2);

  const has192 = manifest.icons.some(i => i.src.includes('192') && i.sizes === '192x192');
  const has512 = manifest.icons.some(i => i.src.includes('512') && i.sizes === '512x512');
  const hasMaskable = manifest.icons.some(i => i.purpose?.includes('maskable'));

  check('Manifest has 192x192 icon', has192);
  check('Manifest has 512x512 icon', has512);
  check('Manifest has maskable icon entry', hasMaskable);
}

// 2. Check icon files
const icon192Path = path.join(projectRoot, 'public', 'icons', 'icon-192.png');
const icon512Path = path.join(projectRoot, 'public', 'icons', 'icon-512.png');
const appleIconPath = path.join(projectRoot, 'public', 'icons', 'apple-touch-icon.png');
const badge72Path = path.join(projectRoot, 'public', 'icons', 'badge-72.png');

check('icon-192.png exists', fs.existsSync(icon192Path), `${fs.existsSync(icon192Path) ? fs.statSync(icon192Path).size + ' bytes' : 'not found'}`);
check('icon-512.png exists', fs.existsSync(icon512Path), `${fs.existsSync(icon512Path) ? fs.statSync(icon512Path).size + ' bytes' : 'not found'}`);
check('apple-touch-icon.png exists', fs.existsSync(appleIconPath));
check('badge-72.png exists', fs.existsSync(badge72Path));

// Read PNG dimensions from headers
function getPngDimensions(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const dim192 = getPngDimensions(icon192Path);
check('icon-192.png has exact 192x192 dimensions', dim192 && dim192.width === 192 && dim192.height === 192, `${dim192?.width}x${dim192?.height}`);

const dim512 = getPngDimensions(icon512Path);
check('icon-512.png has exact 512x512 dimensions', dim512 && dim512.width === 512 && dim512.height === 512, `${dim512?.width}x${dim512?.height}`);

const dimApple = getPngDimensions(appleIconPath);
check('apple-touch-icon.png has exact 180x180 dimensions', dimApple && dimApple.width === 180 && dimApple.height === 180, `${dimApple?.width}x${dimApple?.height}`);

// 3. Check layout.tsx metadata
const layoutPath = path.join(projectRoot, 'src', 'app', 'layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

check('layout.tsx links manifest.webmanifest', layoutContent.includes('manifest.webmanifest'));
check('layout.tsx has theme_color #0f766e', layoutContent.includes('#0f766e'));
check('layout.tsx has apple-mobile-web-app-capable', layoutContent.includes('apple-mobile-web-app-capable') || layoutContent.includes('appleWebApp'));
check('layout.tsx includes ServiceWorkerRegister', layoutContent.includes('ServiceWorkerRegister'));

// 4. Check sw.js
const swPath = path.join(projectRoot, 'public', 'sw.js');
check('public/sw.js exists for browser registration', fs.existsSync(swPath));

console.log('\n================================');
if (allPassed) {
  console.log('ALL SPRINT 1 CHECKS PASSED!');
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
