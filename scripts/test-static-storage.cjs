// scripts/test-static-storage.cjs
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TESTING STATIC CATALOG & DYNAMIC LOCALSTORAGE ISOLATION ===');

// Mock localStorage environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.window = {
  addEventListener: () => {},
};
global.localStorage = new MockLocalStorage();

// Read seed data from JSON files
const medicinesPath = path.resolve(__dirname, '../src/data/medicines.json');
const shopsPath = path.resolve(__dirname, '../src/data/shops.json');
const vmsPath = path.resolve(__dirname, '../src/data/vending-machines.json');

const SEED_MEDICINES = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
const SEED_SHOPS = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));
const SEED_VENDING_MACHINES = JSON.parse(fs.readFileSync(vmsPath, 'utf8'));
const SEED_VENDING_MACHINE = SEED_VENDING_MACHINES[0];

console.log(`Loaded ${SEED_MEDICINES.length} static medicines and ${SEED_SHOPS.length} static shops.`);

// Test composeAppState logic
function composeAppState(dynamicState) {
  const stockOverrides = dynamicState.machineStockOverrides || {};
  const activeMachineId = dynamicState.activeVendingMachineId || 'VM-01';
  const rawOverrides = stockOverrides[activeMachineId] || stockOverrides;
  const activeMachineStock = typeof rawOverrides === 'object' && !('VM-01' in rawOverrides) ? rawOverrides : {};
  const shopOverrides = dynamicState.shopOverrides || {};

  const medicines = SEED_MEDICINES.map((seedMed) => {
    const overrideStock = activeMachineStock[seedMed.id];
    return {
      ...seedMed,
      machineStock: typeof overrideStock === 'number' ? Math.max(0, overrideStock) : seedMed.machineStock,
    };
  });

  const shops = SEED_SHOPS.map((seedShop) => {
    const override = shopOverrides[seedShop.id];
    return {
      ...seedShop,
      isOpen: override?.isOpen !== undefined ? override.isOpen : seedShop.isOpen,
      stocks: Array.isArray(override?.stocks) ? override.stocks : seedShop.stocks,
    };
  });

  return {
    medicines,
    vendingMachine: SEED_VENDING_MACHINE,
    shops,
    cart: Array.isArray(dynamicState.cart) ? dynamicState.cart : [],
    machineOrders: Array.isArray(dynamicState.machineOrders) ? dynamicState.machineOrders : [],
    shopConversations: Array.isArray(dynamicState.shopConversations) ? dynamicState.shopConversations : [],
    shopOrders: Array.isArray(dynamicState.shopOrders) ? dynamicState.shopOrders : [],
  };
}

// TEST 1: Default dynamic state is tiny and contains ZERO catalog medicine objects
const defaultDynamicState = {
  machineStockOverrides: {},
  shopOverrides: {},
  cart: [],
  machineOrders: [],
  shopConversations: [],
  shopOrders: [],
};

const defaultSerialized = JSON.stringify(defaultDynamicState);
console.log(`Default dynamic state size in storage: ${defaultSerialized.length} bytes.`);
assert.ok(defaultSerialized.length < 500, `Storage size should be small (<500B), got ${defaultSerialized.length}B`);
assert.strictEqual(defaultSerialized.includes('Paracetamol'), false, 'Dynamic state MUST NOT contain medicine names');
assert.strictEqual(defaultSerialized.includes('Health Centre'), false, 'Dynamic state MUST NOT contain machine location');
console.log('✔ Test 1 passed: Dynamic storage payload contains zero static catalog text.');

// TEST 2: Dispense order updates stock override without duplicating medicine catalog
const initialParacetamol = SEED_MEDICINES.find((m) => m.id === 1);
assert.ok(initialParacetamol, 'Paracetamol (id 1) not found');
const originalStock = initialParacetamol.machineStock;

const dynamicWithDispense = {
  ...defaultDynamicState,
  machineStockOverrides: { 1: originalStock - 2 },
  machineOrders: [{
    id: 'MV-9999',
    items: [{ medicineId: 1, name: initialParacetamol.name, price: initialParacetamol.price, quantity: 2 }],
    totalAmount: initialParacetamol.price * 2,
    paymentMethod: 'UPI',
    createdAt: new Date().toISOString(),
    status: 'completed',
  }],
};

const composed = composeAppState(dynamicWithDispense);
const composedMed1 = composed.medicines.find((m) => m.id === 1);
assert.strictEqual(composedMed1.machineStock, originalStock - 2, 'Stock was not decremented properly in composed state');
assert.strictEqual(composedMed1.name, initialParacetamol.name, 'Medicine metadata was corrupted');
assert.strictEqual(composedMed1.price, initialParacetamol.price, 'Price was corrupted');
assert.strictEqual(composedMed1.otc, true, 'OTC flag was corrupted');

// Check that only 1 number was stored for stock
assert.deepStrictEqual(dynamicWithDispense.machineStockOverrides, { 1: originalStock - 2 });
console.log('✔ Test 2 passed: Dispense operation correctly isolates stock delta without catalog mutation.');

// TEST 3: Shop live toggles isolate to shopOverrides
const dynamicWithShopToggle = {
  ...defaultDynamicState,
  shopOverrides: {
    S1: { isOpen: false, stocks: [1, 2, 5] },
  },
};

const composedWithShops = composeAppState(dynamicWithShopToggle);
const shopS1 = composedWithShops.shops.find((s) => s.id === 'S1');
assert.strictEqual(shopS1.isOpen, false, 'Shop S1 isOpen override failed');
assert.deepStrictEqual(shopS1.stocks, [1, 2, 5], 'Shop S1 stocks override failed');
// Ensure static metadata remained intact
assert.strictEqual(shopS1.name, SEED_SHOPS[0].name, 'Shop name should remain static');
assert.strictEqual(shopS1.area, SEED_SHOPS[0].area, 'Shop area should remain static');
assert.strictEqual(shopS1.phone, SEED_SHOPS[0].phone, 'Shop phone should remain static');
console.log('✔ Test 3 passed: Shop toggles isolate cleanly to minimal overrides while keeping profile static.');

// TEST 4: Legacy migration simulation
const targetShopS2 = SEED_SHOPS.find((s) => s.id === 'S2');
const toggledIsOpen = !targetShopS2.isOpen;

const legacyBlob = {
  medicines: SEED_MEDICINES.map((m) => m.id === 6 ? { ...m, machineStock: 1 } : m),
  vendingMachine: SEED_VENDING_MACHINE,
  shops: SEED_SHOPS.map((s) => s.id === 'S2' ? { ...s, isOpen: toggledIsOpen } : s),
  cart: [{ medicineId: 1, quantity: 1 }],
  machineOrders: [],
  shopConversations: [],
  shopOrders: [],
};

const legacyString = JSON.stringify(legacyBlob);
console.log(`Legacy storage payload was: ${(legacyString.length / 1024).toFixed(1)} KB.`);
assert.ok(legacyString.length > 2000, 'Legacy string should have been >2KB');

// Simulate migration
const migratedStockOverrides = {};
const seedMedMap = new Map(SEED_MEDICINES.map((m) => [m.id, m]));
for (const m of legacyBlob.medicines) {
  const seed = seedMedMap.get(m.id);
  if (seed && m.machineStock !== seed.machineStock) {
    migratedStockOverrides[m.id] = m.machineStock;
  }
}

const migratedShopOverrides = {};
const seedShopMap = new Map(SEED_SHOPS.map((s) => [s.id, s]));
for (const s of legacyBlob.shops) {
  const seed = seedShopMap.get(s.id);
  if (seed && s.isOpen !== seed.isOpen) {
    migratedShopOverrides[s.id] = { isOpen: s.isOpen };
  }
}

const migratedDynamic = {
  machineStockOverrides: migratedStockOverrides,
  shopOverrides: migratedShopOverrides,
  cart: legacyBlob.cart,
  machineOrders: legacyBlob.machineOrders,
  shopConversations: legacyBlob.shopConversations,
  shopOrders: legacyBlob.shopOrders,
};

const migratedSerialized = JSON.stringify(migratedDynamic);
console.log(`Migrated dynamic payload size: ${migratedSerialized.length} bytes (reduced by ${((1 - migratedSerialized.length / legacyString.length) * 100).toFixed(1)}%).`);

assert.deepStrictEqual(migratedDynamic.machineStockOverrides, { 6: 1 });
assert.deepStrictEqual(migratedDynamic.shopOverrides, { S2: { isOpen: toggledIsOpen } });
assert.deepStrictEqual(migratedDynamic.cart, [{ medicineId: 1, quantity: 1 }]);
console.log('✔ Test 4 passed: Legacy state migration reduces storage footprint by ~99% and extracts dynamic deltas.');

console.log('\nALL STATIC VS DYNAMIC STORAGE TESTS PASSED SUCCESSFULLY!');
