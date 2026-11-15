// scripts/verify-inventory.cjs
const fs = require('fs');
const path = require('path');

console.log('=== MEDIVEND INVENTORY VERIFICATION ===');

const seedPath = path.resolve(__dirname, '../src/data/seed.ts');
const fileContent = fs.readFileSync(seedPath, 'utf8');

const match = fileContent.match(/export const SEED_MEDICINES: Medicine\[\] = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('FAIL: Could not locate SEED_MEDICINES in src/data/seed.ts');
  process.exit(1);
}

const medicines = eval(match[1]);
console.log(`Found ${medicines.length} medicines in inventory.`);

const idSet = new Set();
const nameSet = new Set();
const normalizedNameSet = new Set();
const categories = new Set();
let errors = 0;

function logError(msg) {
  console.error('ERROR:', msg);
  errors++;
}

medicines.forEach((med, idx) => {
  if (typeof med.id !== 'number' || med.id <= 0 || !Number.isInteger(med.id)) {
    logError(`Invalid ID at index ${idx}: ${med.id}`);
  }
  if (idSet.has(med.id)) {
    logError(`Duplicate ID: ${med.id} (${med.name})`);
  }
  idSet.add(med.id);

  if (typeof med.name !== 'string' || !med.name.trim()) {
    logError(`Medicine ID ${med.id} has empty name`);
  }

  const lowerName = med.name.toLowerCase().trim();
  if (nameSet.has(lowerName)) {
    logError(`Duplicate name (case-insensitive): "${med.name}"`);
  }
  nameSet.add(lowerName);

  const normalized = lowerName.replace(/[^a-z0-9]/g, '');
  if (normalizedNameSet.has(normalized)) {
    logError(`Normalized duplicate name: "${med.name}"`);
  }
  normalizedNameSet.add(normalized);

  if (typeof med.price !== 'number' || med.price <= 0) {
    logError(`Invalid price for "${med.name}": ${med.price}`);
  }

  if (typeof med.category !== 'string' || !med.category.trim()) {
    logError(`Invalid category for "${med.name}"`);
  }
  categories.add(med.category);

  if (typeof med.otc !== 'boolean') {
    logError(`Invalid otc flag for "${med.name}": ${med.otc}`);
  }

  if (typeof med.machineStock !== 'number' || med.machineStock < 0 || !Number.isInteger(med.machineStock)) {
    logError(`Invalid machineStock for "${med.name}": ${med.machineStock}`);
  }

  if (!med.otc && med.machineStock !== 0) {
    logError(`Prescription medicine "${med.name}" has non-zero machineStock (${med.machineStock})`);
  }
});

// Verify shop stocks
const shopMatch = fileContent.match(/export const SEED_SHOPS: Shop\[\] = (\[[\s\S]*?\]);/);
if (!shopMatch) {
  logError('Could not find SEED_SHOPS in seed.ts');
} else {
  const shops = eval(shopMatch[1]);
  shops.forEach((shop) => {
    if (!Array.isArray(shop.stocks)) {
      logError(`Shop ${shop.id} has invalid stocks array`);
    } else {
      shop.stocks.forEach((stockId) => {
        if (!idSet.has(stockId)) {
          logError(`Shop ${shop.id} stocks unknown medicine ID: ${stockId}`);
        }
      });
    }
  });

  const s3 = shops.find((s) => s.id === 'S3');
  if (s3 && s3.stocks.includes(3)) {
    logError('Shop S3 (Wellness Corner) incorrectly stocks Cetirizine (ID 3)');
  }
}

console.log(`Verified ${categories.size} categories with 0 duplicates:`);
Array.from(categories).sort().forEach((cat) => {
  const count = medicines.filter((m) => m.category === cat).length;
  console.log(`  • ${cat}: ${count} medicines`);
});

if (errors > 0) {
  console.error(`\nFAILED: Found ${errors} inventory validation errors!`);
  process.exit(1);
}

console.log(`\nSUCCESS: All ${medicines.length} medicines verified with zero duplicates!`);
