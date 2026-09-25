import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('=== PWA SPRINT 2 VALIDATION ===\n');

let allPassed = true;

function check(title, condition, detail = '') {
  if (condition) {
    console.log(`[PASS] ${title}${detail ? ` (${detail})` : ''}`);
  } else {
    console.error(`[FAIL] ${title}${detail ? ` (${detail})` : ''}`);
    allPassed = false;
  }
}

// 1. Check src/sw.ts
const swTsPath = path.join(projectRoot, 'src', 'sw.ts');
check('src/sw.ts exists', fs.existsSync(swTsPath));

if (fs.existsSync(swTsPath)) {
  const swContent = fs.readFileSync(swTsPath, 'utf8');

  check('sw.ts references webworker lib', swContent.includes('/// <reference lib="webworker" />'));
  check('sw.ts imports Serwist', swContent.includes('Serwist') && swContent.includes('serwist'));
  check('sw.ts has precacheEntries', swContent.includes('precacheEntries: self.__SW_MANIFEST'));
  check('sw.ts includes offline catalog GET cache', swContent.includes('/api/products/offline-catalog'));
  check('sw.ts guards against caching mutation requests', swContent.includes('request.method !== "GET"') && swContent.includes('NetworkOnly'));
  check('sw.ts caches navigation / app shell', swContent.includes('request.mode === "navigate"'));
  check('sw.ts implements setCatchHandler for offline fallback', swContent.includes('serwist.setCatchHandler'));
  check('sw.ts listens for SKIP_WAITING message', swContent.includes('SKIP_WAITING') && swContent.includes('skipWaiting()'));
  check('sw.ts supports push notifications', swContent.includes('addEventListener("push"'));
}

// 2. Check offline fallback page
const offlinePagePath = path.join(projectRoot, 'src', 'app', 'offline', 'page.tsx');
check('src/app/offline/page.tsx exists', fs.existsSync(offlinePagePath));

if (fs.existsSync(offlinePagePath)) {
  const offlineContent = fs.readFileSync(offlinePagePath, 'utf8');
  check('Offline page has retry reload button', offlineContent.includes('reload()') || offlineContent.includes('Coba Lagi'));
  check('Offline page links to cashier (/dashboard/sales)', offlineContent.includes('/dashboard/sales'));
}

// 3. Check ServiceWorkerRegister component with update prompt
const swRegisterPath = path.join(projectRoot, 'src', 'components', 'providers', 'ServiceWorkerRegister.tsx');
check('ServiceWorkerRegister.tsx exists', fs.existsSync(swRegisterPath));

if (fs.existsSync(swRegisterPath)) {
  const registerContent = fs.readFileSync(swRegisterPath, 'utf8');
  check('Registers /sw.js', registerContent.includes('/sw.js'));
  check('Detects waiting service worker update', registerContent.includes('waiting') || registerContent.includes('updatefound'));
  check('Listens for controllerchange to reload', registerContent.includes('controllerchange'));
  check('Provides SKIP_WAITING trigger for user', registerContent.includes('SKIP_WAITING'));
  check('Renders update prompt UI', registerContent.includes('Pembaruan Tersedia') || registerContent.includes('Perbarui'));
}

// 4. Check Root Layout includes ServiceWorkerRegister
const layoutPath = path.join(projectRoot, 'src', 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  check('layout.tsx mounts ServiceWorkerRegister', layoutContent.includes('<ServiceWorkerRegister'));
}

console.log('\n================================');
if (allPassed) {
  console.log('ALL SPRINT 2 DELIVERABLES & CHECKS PASSED!');
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
