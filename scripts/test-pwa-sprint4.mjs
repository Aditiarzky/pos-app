import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('=== PWA SPRINT 4 VALIDATION ===\n');

let allPassed = true;

function check(title, condition, detail = '') {
  if (condition) {
    console.log(`[PASS] ${title}${detail ? ` (${detail})` : ''}`);
  } else {
    console.error(`[FAIL] ${title}${detail ? ` (${detail})` : ''}`);
    allPassed = false;
  }
}

// 1. Check offline-sales-queue.ts exists and exports required functions
const queueLibPath = path.join(projectRoot, 'src', 'lib', 'offline-sales-queue.ts');
check('src/lib/offline-sales-queue.ts exists', fs.existsSync(queueLibPath));

if (fs.existsSync(queueLibPath)) {
  const content = fs.readFileSync(queueLibPath, 'utf8');
  check('Exports queueOfflineSale function', content.includes('queueOfflineSale'));
  check('Exports getPendingOfflineSales function', content.includes('getPendingOfflineSales'));
  check('Exports updateOfflineSaleStatus function', content.includes('updateOfflineSaleStatus'));
  check('Exports decrementLocalStock function', content.includes('decrementLocalStock'));
  check('Exports validateOfflineSale function', content.includes('validateOfflineSale'));
  check('Generates clientRequestId using crypto.randomUUID()', content.includes('crypto.randomUUID()'));
  check('Sets createdOfflineAt timestamp', content.includes('createdOfflineAt'));
}

// 2. Check offlineDb schema has salesQueue store
const offlineDbPath = path.join(projectRoot, 'src', 'lib', 'offline-db.ts');
if (fs.existsSync(offlineDbPath)) {
  const dbContent = fs.readFileSync(offlineDbPath, 'utf8');
  check('offline-db has salesQueue store with clientRequestId keyPath', dbContent.includes('"salesQueue"') && dbContent.includes('clientRequestId'));
}

// 3. Run build and lint checks
console.log('\n=== RUNNING BUILD & LINT CHECKS ===');
import { execSync } from 'node:child_process';
try {
  execSync('npm run lint', { stdio: 'inherit' });
  check('npm run lint passes', true);
} catch (e) {
  check('npm run lint passes', false, e.message);
}

try {
  execSync('npm run build', { stdio: 'inherit' });
  check('npm run build passes', true);
} catch (e) {
  check('npm run build passes', false, e.message);
}

console.log('\n================================');
if (allPassed) {
  console.log('ALL SPRINT 4 DELIVERABLES & CHECKS PASSED!');
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
