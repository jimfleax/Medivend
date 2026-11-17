import { AppState, Medicine, VendingMachine, Shop, ShopConversation, PersistedDynamicState } from './types';
import medicinesData from './medicines.json';
import vendingMachinesData from './vending-machines.json';
import shopsData from './shops.json';
import conversationsData from './conversations.json';

export const SEED_MEDICINES: Medicine[] = medicinesData as Medicine[];
export const SEED_VENDING_MACHINES: VendingMachine[] = vendingMachinesData as VendingMachine[];
export const SEED_VENDING_MACHINE: VendingMachine = SEED_VENDING_MACHINES[0];
export const SEED_SHOPS: Shop[] = shopsData as Shop[];
export const SEED_SHOP_CONVERSATIONS: ShopConversation[] = conversationsData as ShopConversation[];

export const DEFAULT_DYNAMIC_STATE: PersistedDynamicState = {
  activeVendingMachineId: 'VM-01',
  machineStockOverrides: {},
  shopOverrides: {},
  cart: [],
  machineOrders: [],
  shopConversations: SEED_SHOP_CONVERSATIONS,
  shopOrders: [],
};

export const INITIAL_STATE: AppState = {
  medicines: SEED_MEDICINES,
  vendingMachine: SEED_VENDING_MACHINE,
  vendingMachines: SEED_VENDING_MACHINES,
  activeVendingMachineId: 'VM-01',
  shops: SEED_SHOPS,
  cart: [],
  machineOrders: [],
  shopConversations: SEED_SHOP_CONVERSATIONS,
  shopOrders: [],
};
