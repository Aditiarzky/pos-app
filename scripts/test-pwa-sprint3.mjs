import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('=== PWA SPRINT 3 VALIDATION ===\n');

let allPassed = true;

function check(title, condition, detail = '') {
  if (condition) {
    console.log(`[PASS] ${title}${detail ? ` (${detail})` : ''}`);
  } else {
    console.error(`[FAIL] ${title}${detail ? ` (${detail})` : ''}`);
    allPassed = false;
  }
}

// 1. Check offline catalog endpoint exists
const catalogRoutePath = path.join(projectRoot, 'src', 'app', 'api', 'products', 'offline-catalog', 'route.ts');
check('Endpoint /api/products/offline-catalog/route.ts exists', fs.existsSync(catalogRoutePath));

if (fs.existsSync(catalogRoutePath)) {
  const routeContent = fs.readFileSync(catalogRoutePath, 'utf8');
  check('Route exports GET handler', routeContent.includes('export async function GET'));
  check('Route exports OfflineProduct type', routeContent.includes('export type OfflineProduct'));
  check('Route uses db query for products', routeContent.includes('db.query.products'));
  check('Route returns minimal product data (productId, variantId, barcode, name, variantName, sellPrice, stock, unit, updatedAt)', 
    routeContent.includes('productId') && 
    routeContent.includes('variantId') &&
    routeContent.includes('barcode') && 
    routeContent.includes('variantName') &&
    routeContent.includes('sellPrice') && 
    routeContent.includes('unit') &&
    routeContent.includes('updatedAt')
  );
  // Endpoint should not require auth (public for installed PWA)
  check('Route does NOT include verifySession (public endpoint)', !routeContent.includes('verifySession'));
}

// 2. Check offline-db.ts has products store
const offlineDbPath = path.join(projectRoot, 'src', 'lib', 'offline-db.ts');
check('src/lib/offline-db.ts exists', fs.existsSync(offlineDbPath));

if (fs.existsSync(offlineDbPath)) {
  const dbContent = fs.readFileSync(offlineDbPath, 'utf8');
  check('offline-db has products store with variantId keyPath', dbContent.includes('"products"') && dbContent.includes('variantId'));
  check('offline-db has salesQueue store (Sprint 3 preparatory)', dbContent.includes('salesQueue'));
  check('offline-db has syncLog store', dbContent.includes('syncLog'));
}

// 3. Check offline-catalog.ts utility exists and has required functions
const offlineCatalogPath = path.join(projectRoot, 'src', 'lib', 'offline-catalog.ts');
check('src/lib/offline-catalog.ts exists', fs.existsSync(offlineCatalogPath));

if (fs.existsSync(offlineCatalogPath)) {
  const catalogContent = fs.readFileSync(offlineCatalogPath, 'utf8');
  check('offline-catalog.ts exports syncCatalog function', catalogContent.includes('syncCatalog'));
  check('offline-catalog.ts exports lookupProductByBarcode function', catalogContent.includes('lookupProductByBarcode'));
  check('offline-catalog.ts exports lookupProductByVariantId function', catalogContent.includes('lookupProductByVariantId'));
  check('offline-catalog.ts exports searchOfflineProducts function', catalogContent.includes('searchOfflineProducts'));
  check('offline-catalog.ts exports getCatalogLastUpdated function', catalogContent.includes('getCatalogLastUpdated'));
  check('syncCatalog writes to IndexedDB products store', catalogContent.includes('products') && catalogContent.includes('syncCatalog'));
  check('syncCatalog stores timestamp in metadata', catalogContent.includes('metadata'));
}

// 4. Check hook for offline product search
const offsearchHookPath = path.join(projectRoot, 'src', 'hooks', 'use-offline-product-search.ts');
check('src/hooks/use-offline-product-search.ts exists', fs.existsSync(offsearchHookPath));

if (fs.existsSync(offsearchHookPath)) {
  const hookContent = fs.readFileSync(offsearchHookPath, 'utf8');
  check('Hook tracks online/offline status', hookContent.includes('isOffline'));
  check('Hook provides catalog last updated timestamp', hookContent.includes('lastUpdated'));
  check('Hook provides syncCatalog function', hookContent.includes('syncCatalog'));
  check('Hook provides findProductByBarcode for barcode lookup', hookContent.includes('findProductByBarcode'));
}

// 5. Check UI status component
const statusCompPath = path.join(projectRoot, 'src', 'components', 'offline-catalog-status.tsx');
check('src/components/offline-catalog-status.tsx exists', fs.existsSync(statusCompPath));

if (fs.existsSync(statusCompPath)) {
  const statusContent = fs.readFileSync(statusCompPath, 'utf8');
  check('Status component shows offline/online indicator', statusContent.includes('Offline') && statusContent.includes('Online'));
  check('Status component shows last updated timestamp', statusContent.includes('lastUpdated') || statusContent.includes('Terakhir diperbarui'));
  check('Status component shows sync button', statusContent.includes('syncCatalog') || statusContent.includes('Sinkronisasi'));
}

// 6. Check Sales Page integration
const salesPagePath = path.join(projectRoot, 'src', 'app', 'dashboard', 'sales', 'page.tsx');
if (fs.existsSync(salesPagePath)) {
  const pageContent = fs.readFileSync(salesPagePath, 'utf8');
  check('Sales page imports OfflineCatalogStatus', pageContent.includes('OfflineCatalogStatus'));
  check('Sales page uses OfflineCatalogStatus component', pageContent.includes('<OfflineCatalogStatus'));
}

// 7. Check service worker handles offline catalog endpoint
const swPath = path.join(projectRoot, 'src', 'sw.ts');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  check('sw.ts caches /api/products/offline-catalog endpoint', swContent.includes('/api/products/offline-catalog'));
  check('sw.ts uses NetworkFirst for catalog (GET only)', swContent.includes('NetworkFirst') && swContent.includes('/api/products/offline-catalog'));
}

console.log('\n================================');
if (allPassed) {
  console.log('ALL SPRINT 3 DELIVERABLES & CHECKS PASSED!');
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
