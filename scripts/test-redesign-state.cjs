/**
 * Verification test for Redesign Data Model & Multi-Vending Machine State
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Verify that seed data contains multiple vending stations
const seedFilePath = path.join(__dirname, '../src/data/seed.ts');
const seedContent = fs.readFileSync(seedFilePath, 'utf8');

assert(seedContent.includes('SEED_VENDING_MACHINES'), 'SEED_VENDING_MACHINES must be exported in seed.ts');

// Verify JSON files exist and are valid JSON
const vmPath = path.join(__dirname, '../src/data/vending-machines.json');
const vms = JSON.parse(fs.readFileSync(vmPath, 'utf8'));
assert(Array.isArray(vms) && vms.length === 3, 'vending-machines.json must contain exactly 3 stations');
assert(vms.some((vm) => vm.id === 'VM-01'), 'Station VM-01 must exist');
assert(vms.some((vm) => vm.id === 'VM-02'), 'Station VM-02 must exist');
assert(vms.some((vm) => vm.id === 'VM-03'), 'Station VM-03 must exist');
vms.forEach((vm) => {
  assert(vm.location === 'IIM Sambalpur Health Centre', `Station ${vm.id} must be at IIM Sambalpur Health Centre`);
  assert(vm.name.includes('SN:'), `Station ${vm.id} must have a serial number`);
});

const medPath = path.join(__dirname, '../src/data/medicines.json');
const meds = JSON.parse(fs.readFileSync(medPath, 'utf8'));
assert(Array.isArray(meds) && meds.length === 20, 'medicines.json must contain exactly 20 items');

const shopPath = path.join(__dirname, '../src/data/shops.json');
const shops = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
assert(Array.isArray(shops) && shops.length === 3, 'shops.json must contain exactly 3 shops');
assert(shops.some((s) => s.name.includes('Samaleswari')), 'Samaleswari Medical Store must exist');
assert(shops.some((s) => s.name.includes('Choudhury')), 'Choudhury Medical Store must exist');
assert(shops.some((s) => s.name.includes('Jagannath')), 'Jagannath Medical Store must exist');

// Verify types
const typesFilePath = path.join(__dirname, '../src/data/types.ts');
const typesContent = fs.readFileSync(typesFilePath, 'utf8');
assert(typesContent.includes('activeVendingMachineId'), 'activeVendingMachineId must be in types.ts');
assert(typesContent.includes('vendingMachines: VendingMachine[]'), 'vendingMachines array must be in AppState');
assert(typesContent.includes('machineId: string;'), 'machineId must be in MachineOrder');
assert(typesContent.includes('dispensePin: string;'), 'dispensePin must be in MachineOrder');
assert(typesContent.includes('qrCodeData: string;'), 'qrCodeData must be in MachineOrder');
assert(typesContent.includes('prescriptionId?: string;'), 'prescriptionId must be in ShopOrder');
assert(typesContent.includes('machineStockOverrides: Record<string, Record<number, number>>;'), 'nested machineStockOverrides must be in PersistedDynamicState');
assert(typesContent.includes("machineStatusOverrides?: Record<string, 'Online' | 'Offline'>;"), 'machineStatusOverrides must be in PersistedDynamicState');

console.log('✔ All Redesign Seed, JSON files & Types tests passed successfully!');
