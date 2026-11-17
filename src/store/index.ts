import { useSyncExternalStore } from 'react';
import {
  AppState,
  CartItem,
  MachineOrder,
  MachineOrderItem,
  Medicine,
  PersistedDynamicState,
  PrescriptionAttachment,
  Shop,
  ShopConversation,
  ShopConversationMessage,
  ShopOrder,
  ShopOrderStatus,
  VendingMachine,
} from '../data/types';
import {
  DEFAULT_DYNAMIC_STATE,
  INITIAL_STATE,
  SEED_MEDICINES,
  SEED_SHOPS,
  SEED_VENDING_MACHINE,
  SEED_VENDING_MACHINES,
} from '../data/seed';

const DYNAMIC_STORAGE_KEY = 'medivend-dynamic-state';
const LEGACY_STORAGE_KEY = 'medivend-state';

/**
 * Pure composer: reconstructs the complete AppState by overlaying
 * minimal dynamic user overrides (stock deltas, shop toggles, orders, chats, cart)
 * onto immutable static master catalog data (medicines, vending machine, shop profiles).
 */
export function composeAppState(dynamicState: PersistedDynamicState): AppState {
  const stockOverrides = dynamicState.machineStockOverrides || {};
  const statusOverrides = dynamicState.machineStatusOverrides || {};
  const shopOverrides = dynamicState.shopOverrides || {};
  const activeMachineId = dynamicState.activeVendingMachineId || 'VM-01';

  // Get active machine stock overrides (handling both nested and legacy flat formats)
  const rawOverrides = (stockOverrides as any)[activeMachineId] || (stockOverrides as any);
  const activeMachineStock: Record<number, number> =
    typeof rawOverrides === 'object' && !('VM-01' in rawOverrides) ? rawOverrides : {};

  // Medicines: Base catalog is immutable. machineStock applies active machine's dynamic overrides & baseline variance.
  const medicines: Medicine[] = SEED_MEDICINES.map((seedMed) => {
    const overrideStock = activeMachineStock[seedMed.id];
    let baseStock = seedMed.machineStock;

    // Realistic campus health centre variance across units if not overridden
    if (seedMed.otc && baseStock > 0) {
      if (activeMachineId === 'VM-02') {
        // VM-02 (OPD Waiting Area): higher cold & first aid stock, low Ibuprofen stock
        if (seedMed.category === 'First aid' || seedMed.category === 'Cold and cough') {
          baseStock = Math.min(25, baseStock + 3);
        } else if (seedMed.id === 2) {
          baseStock = 4; // realistic low stock
        }
      } else if (activeMachineId === 'VM-03') {
        // VM-03 (Emergency Bay): higher hydration & pain stock, Bandages out of stock (demo utility)
        if (seedMed.category === 'Hydration and digestion' || seedMed.category === 'Pain and fever') {
          baseStock = Math.min(30, baseStock + 5);
        } else if (seedMed.id === 5) {
          baseStock = 0; // out-of-stock for live demo to check another machine
        }
      }
    }

    return {
      ...seedMed,
      machineStock: typeof overrideStock === 'number' ? Math.max(0, overrideStock) : baseStock,
    };
  });

  // Machines with live status overrides
  const vendingMachines: VendingMachine[] = SEED_VENDING_MACHINES.map((vm) => ({
    ...vm,
    status: statusOverrides[vm.id] || vm.status,
  }));

  const activeMachine =
    vendingMachines.find((vm) => vm.id === activeMachineId) || vendingMachines[0] || SEED_VENDING_MACHINE;

  // Shops: Base profiles (name, area, distance, hours, phone) are immutable.
  // isOpen and stocks apply dynamic operational toggles.
  const shops: Shop[] = SEED_SHOPS.map((seedShop) => {
    const override = shopOverrides[seedShop.id];
    return {
      ...seedShop,
      isOpen: override?.isOpen !== undefined ? override.isOpen : seedShop.isOpen,
      stocks: Array.isArray(override?.stocks) ? override.stocks : seedShop.stocks,
    };
  });

  return {
    medicines,
    vendingMachine: activeMachine,
    vendingMachines,
    activeVendingMachineId: activeMachineId,
    shops,
    cart: Array.isArray(dynamicState.cart) ? dynamicState.cart : [],
    machineOrders: Array.isArray(dynamicState.machineOrders) ? dynamicState.machineOrders : [],
    shopConversations: Array.isArray(dynamicState.shopConversations)
      ? dynamicState.shopConversations
      : [],
    shopOrders: Array.isArray(dynamicState.shopOrders) ? dynamicState.shopOrders : [],
  };
}

// In-memory state cache
let currentDynamicState: PersistedDynamicState = loadInitialDynamicState();
let currentState: AppState = composeAppState(currentDynamicState);
const listeners = new Set<() => void>();

function normalizeMachineStockOverrides(raw: any): Record<string, Record<number, number>> {
  if (!raw || typeof raw !== 'object') return {};
  const firstKey = Object.keys(raw)[0];
  if (!firstKey) return {};
  // If it's already structured by machineId e.g. { 'VM-01': { ... } }
  if (typeof raw[firstKey] === 'object' && !Array.isArray(raw[firstKey])) {
    return raw as Record<string, Record<number, number>>;
  }
  // Otherwise it's legacy flat { 1: 10 }, migrate under 'VM-01'
  return { 'VM-01': raw as Record<number, number> };
}

function loadInitialDynamicState(): PersistedDynamicState {
  if (typeof window === 'undefined') return DEFAULT_DYNAMIC_STATE;
  try {
    // 1. Try reading the new minimal dynamic state
    const rawDynamic = localStorage.getItem(DYNAMIC_STORAGE_KEY);
    if (rawDynamic) {
      const parsed = JSON.parse(rawDynamic);
      if (parsed && typeof parsed === 'object') {
        return {
          activeVendingMachineId: parsed.activeVendingMachineId || 'VM-01',
          machineStockOverrides: normalizeMachineStockOverrides(parsed.machineStockOverrides),
          machineStatusOverrides: parsed.machineStatusOverrides || {},
          shopOverrides: parsed.shopOverrides || {},
          cart: Array.isArray(parsed.cart) ? parsed.cart : [],
          machineOrders: Array.isArray(parsed.machineOrders) ? parsed.machineOrders : [],
          shopConversations: Array.isArray(parsed.shopConversations)
            ? parsed.shopConversations
            : DEFAULT_DYNAMIC_STATE.shopConversations,
          shopOrders: Array.isArray(parsed.shopOrders) ? parsed.shopOrders : [],
        };
      }
    }

    // 2. Fallback / Migration: If legacy monolithic medivend-state exists
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      const legacy = JSON.parse(rawLegacy);
      if (legacy && typeof legacy === 'object') {
        const migratedStockOverrides: Record<number, number> = {};
        if (Array.isArray(legacy.medicines)) {
          const seedMap = new Map(SEED_MEDICINES.map((m) => [m.id, m]));
          for (const m of legacy.medicines) {
            const seed = seedMap.get(m.id);
            if (seed && typeof m.machineStock === 'number' && m.machineStock !== seed.machineStock) {
              migratedStockOverrides[m.id] = m.machineStock;
            }
          }
        }

        const migratedShopOverrides: Record<string, { isOpen?: boolean; stocks?: number[] }> = {};
        if (Array.isArray(legacy.shops)) {
          const seedShopMap = new Map(SEED_SHOPS.map((s) => [s.id, s]));
          for (const s of legacy.shops) {
            const seed = seedShopMap.get(s.id);
            if (seed) {
              const hasDiffOpen = typeof s.isOpen === 'boolean' && s.isOpen !== seed.isOpen;
              const hasDiffStocks = Array.isArray(s.stocks);
              if (hasDiffOpen || hasDiffStocks) {
                migratedShopOverrides[s.id] = {
                  isOpen: s.isOpen,
                  stocks: s.stocks,
                };
              }
            }
          }
        }

        const migratedState: PersistedDynamicState = {
          activeVendingMachineId: legacy.activeVendingMachineId || 'VM-01',
          machineStockOverrides: { 'VM-01': migratedStockOverrides },
          machineStatusOverrides: {},
          shopOverrides: migratedShopOverrides,
          cart: Array.isArray(legacy.cart) ? legacy.cart : [],
          machineOrders: Array.isArray(legacy.machineOrders) ? legacy.machineOrders : [],
          shopConversations: Array.isArray(legacy.shopConversations)
            ? legacy.shopConversations
            : DEFAULT_DYNAMIC_STATE.shopConversations,
          shopOrders: Array.isArray(legacy.shopOrders) ? legacy.shopOrders : [],
        };

        saveDynamicToStorage(migratedState);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return migratedState;
      }
    }
  } catch (err) {
    console.error('Failed to load dynamic state from localStorage:', err);
  }

  saveDynamicToStorage(DEFAULT_DYNAMIC_STATE);
  return DEFAULT_DYNAMIC_STATE;
}

function saveDynamicToStorage(state: PersistedDynamicState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DYNAMIC_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save dynamic state to localStorage:', err);
  }
}

function setDynamicState(updater: (prev: PersistedDynamicState) => PersistedDynamicState) {
  currentDynamicState = updater(currentDynamicState);
  currentState = composeAppState(currentDynamicState);
  saveDynamicToStorage(currentDynamicState);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppState {
  return currentState;
}

// Live cross-tab sync listening to the minimal dynamic state key
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === DYNAMIC_STORAGE_KEY && event.newValue) {
      try {
        currentDynamicState = JSON.parse(event.newValue);
        currentState = composeAppState(currentDynamicState);
        listeners.forEach((listener) => listener());
      } catch (err) {
        console.error('Failed to parse updated storage from other tab:', err);
      }
    }
  });
}

function generateOrderCode(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `MV-${randomDigits}`;
}

function generateShopOrderId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `SO-${randomDigits}`;
}

function formatCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const store = {
  getSnapshot,
  subscribe,

  // Vending Machine Cart actions
  addToCart(medicineId: number, quantity = 1): { success: boolean; message?: string } {
    const medicine = currentState.medicines.find((m) => m.id === medicineId);
    if (!medicine) {
      return { success: false, message: 'Medicine not found' };
    }
    if (!medicine.otc) {
      return { success: false, message: 'Prescription required' };
    }
    if (medicine.machineStock <= 0) {
      return { success: false, message: 'Out of stock in machine' };
    }

    const existingIndex = currentDynamicState.cart.findIndex((item) => item.medicineId === medicineId);
    const currentQty = existingIndex >= 0 ? currentDynamicState.cart[existingIndex].quantity : 0;
    const newQty = Math.min(medicine.machineStock, currentQty + quantity);

    if (newQty <= currentQty) {
      return {
        success: false,
        message: `Maximum available machine stock (${medicine.machineStock}) reached`,
      };
    }

    setDynamicState((prev) => {
      let newCart: CartItem[];
      const idx = prev.cart.findIndex((item) => item.medicineId === medicineId);
      if (idx >= 0) {
        newCart = prev.cart.map((item, i) =>
          i === idx ? { ...item, quantity: newQty } : item
        );
      } else {
        newCart = [...prev.cart, { medicineId, quantity: newQty }];
      }

      return {
        ...prev,
        cart: newCart,
      };
    });

    return { success: true };
  },

  updateCartQuantity(medicineId: number, quantity: number) {
    const medicine = currentState.medicines.find((m) => m.id === medicineId);
    if (!medicine) return;

    setDynamicState((prev) => {
      if (quantity <= 0) {
        return {
          ...prev,
          cart: prev.cart.filter((item) => item.medicineId !== medicineId),
        };
      }

      const cappedQuantity = Math.min(medicine.machineStock, quantity);
      return {
        ...prev,
        cart: prev.cart.map((item) =>
          item.medicineId === medicineId ? { ...item, quantity: cappedQuantity } : item
        ),
      };
    });
  },

  removeFromCart(medicineId: number) {
    setDynamicState((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.medicineId !== medicineId),
    }));
  },

  clearCart() {
    setDynamicState((prev) => ({
      ...prev,
      cart: [],
    }));
  },

  createMachineOrder(paymentMethod: 'UPI' | 'Card'): MachineOrder | null {
    if (currentDynamicState.cart.length === 0) return null;

    let order: MachineOrder | null = null;

    setDynamicState((prev) => {
      if (prev.cart.length === 0) return prev;

      const targetMachineId = prev.activeVendingMachineId || 'VM-01';
      const targetMachine =
        SEED_VENDING_MACHINES.find((vm) => vm.id === targetMachineId) || SEED_VENDING_MACHINE;

      const orderItems: MachineOrderItem[] = [];
      let totalAmount = 0;

      for (const cartItem of prev.cart) {
        const medicine = currentState.medicines.find((m) => m.id === cartItem.medicineId);
        if (medicine) {
          orderItems.push({
            medicineId: medicine.id,
            name: medicine.name,
            price: medicine.price,
            quantity: cartItem.quantity,
          });
          totalAmount += medicine.price * cartItem.quantity;
        }
      }

      const orderCode = generateOrderCode();
      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      order = {
        id: orderCode,
        machineId: targetMachine.id,
        machineName: targetMachine.name,
        dispensePin: pin,
        qrCodeData: `MEDIVEND:${targetMachine.id}:${orderCode}:${pin}`,
        items: orderItems,
        totalAmount,
        paymentMethod,
        createdAt: new Date().toISOString(),
        status: 'dispensing',
      };

      return {
        ...prev,
        machineOrders: [order, ...prev.machineOrders],
      };
    });

    return order;
  },

  completeDispense(orderId: string) {
    setDynamicState((prev) => {
      const targetOrder = prev.machineOrders.find((o) => o.id === orderId);
      if (!targetOrder) return prev;

      const targetMachineId = targetOrder.machineId || prev.activeVendingMachineId || 'VM-01';

      // Update machineStockOverrides strictly for the dispensing machine
      const existingMachineOverrides = { ...(prev.machineStockOverrides[targetMachineId] || {}) };

      for (const orderedItem of targetOrder.items) {
        const currentStock =
          existingMachineOverrides[orderedItem.medicineId] ??
          currentState.medicines.find((m) => m.id === orderedItem.medicineId)?.machineStock ??
          0;
        existingMachineOverrides[orderedItem.medicineId] = Math.max(0, currentStock - orderedItem.quantity);
      }

      const updatedStockOverrides = {
        ...prev.machineStockOverrides,
        [targetMachineId]: existingMachineOverrides,
      };

      const updatedOrders = prev.machineOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'completed' as const } : o
      );

      return {
        ...prev,
        machineStockOverrides: updatedStockOverrides,
        machineOrders: updatedOrders,
        cart: [],
      };
    });
  },

  toggleMachineStatus(machineId: string, status: 'Online' | 'Offline') {
    setDynamicState((prev) => ({
      ...prev,
      machineStatusOverrides: {
        ...(prev.machineStatusOverrides || {}),
        [machineId]: status,
      },
    }));
  },

  restockMachine(machineId: string) {
    setDynamicState((prev) => {
      const updatedOverrides = { ...prev.machineStockOverrides };
      delete updatedOverrides[machineId];
      return {
        ...prev,
        machineStockOverrides: updatedOverrides,
        machineStatusOverrides: {
          ...(prev.machineStatusOverrides || {}),
          [machineId]: 'Online',
        },
      };
    });
  },

  // Conversation & Messaging actions
  getOrCreateConversation(shopId: string, medicineId?: number): ShopConversation {
    let conv = currentDynamicState.shopConversations.find((c) => c.shopId === shopId);
    if (!conv) {
      const newConv: ShopConversation = {
        id: `conv-${shopId}`,
        shopId,
        medicineId,
        messages: [],
      };
      setDynamicState((prev) => ({
        ...prev,
        shopConversations: [newConv, ...prev.shopConversations],
      }));
      return newConv;
    }

    if (medicineId && conv.medicineId !== medicineId) {
      setDynamicState((prev) => ({
        ...prev,
        shopConversations: prev.shopConversations.map((c) =>
          c.id === conv!.id ? { ...c, medicineId } : c
        ),
      }));
      return { ...conv, medicineId };
    }

    return conv;
  },

  sendMessage(
    shopId: string,
    sender: 'customer' | 'shop' | 'system',
    text: string,
    prescription?: PrescriptionAttachment
  ) {
    const trimmed = text.trim();
    if (!trimmed && !prescription) return;

    setDynamicState((prev) => {
      let conversations = [...prev.shopConversations];
      const convIndex = conversations.findIndex((c) => c.shopId === shopId);

      const newMessage: ShopConversationMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender,
        text: trimmed || (prescription ? 'Prescription attached' : ''),
        timestamp: formatCurrentTime(),
        prescription,
      };

      if (convIndex === -1) {
        const newConv: ShopConversation = {
          id: `conv-${shopId}`,
          shopId,
          messages: [newMessage],
        };
        conversations = [newConv, ...conversations];
      } else {
        const target = conversations[convIndex];
        conversations[convIndex] = {
          ...target,
          messages: [...target.messages, newMessage],
        };
      }

      return {
        ...prev,
        shopConversations: conversations,
      };
    });
  },

  // Shop Order actions
  createShopOrder(shopId: string, medicineId: number): ShopOrder | null {
    let createdOrder: ShopOrder | null = null;

    setDynamicState((prev) => {
      const medicine = currentState.medicines.find((m) => m.id === medicineId);
      const newOrderId = generateShopOrderId();

      createdOrder = {
        id: newOrderId,
        shopId,
        medicineId,
        qty: 1,
        status: 'Requested',
        createdAt: new Date().toISOString(),
      };

      const medName = medicine ? medicine.name : `Medicine #${medicineId}`;
      const medPrice = medicine ? `Rs ${medicine.price}` : '';

      // Create automated status message in matching chat
      const statusMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'system' as const,
        text: `Order ${newOrderId} placed: 1x ${medName} (${medPrice}) - Status: Requested`,
        timestamp: formatCurrentTime(),
      };

      let conversations = [...prev.shopConversations];
      const convIndex = conversations.findIndex((c) => c.shopId === shopId);

      if (convIndex === -1) {
        conversations = [
          {
            id: `conv-${shopId}`,
            shopId,
            medicineId,
            messages: [statusMessage],
          },
          ...conversations,
        ];
      } else {
        const target = conversations[convIndex];
        conversations[convIndex] = {
          ...target,
          medicineId: target.medicineId || medicineId,
          messages: [...target.messages, statusMessage],
        };
      }

      return {
        ...prev,
        shopOrders: [createdOrder!, ...prev.shopOrders],
        shopConversations: conversations,
      };
    });

    return createdOrder;
  },

  updateShopOrderStatus(orderId: string, status: ShopOrderStatus) {
    setDynamicState((prev) => {
      const order = prev.shopOrders.find((o) => o.id === orderId);
      if (!order) return prev;

      const updatedOrders = prev.shopOrders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      );

      const statusMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'system' as const,
        text: `Order ${orderId} update: Status changed to ${status}`,
        timestamp: formatCurrentTime(),
      };

      let conversations = [...prev.shopConversations];
      const convIndex = conversations.findIndex((c) => c.shopId === order.shopId);

      if (convIndex >= 0) {
        const target = conversations[convIndex];
        conversations[convIndex] = {
          ...target,
          messages: [...target.messages, statusMessage],
        };
      }

      return {
        ...prev,
        shopOrders: updatedOrders,
        shopConversations: conversations,
      };
    });
  },

  // Shop settings & inventory live toggles
  toggleShopOpen(shopId: string, isOpen: boolean) {
    setDynamicState((prev) => {
      const prevShopOverride = prev.shopOverrides[shopId] || {};
      return {
        ...prev,
        shopOverrides: {
          ...prev.shopOverrides,
          [shopId]: {
            ...prevShopOverride,
            isOpen,
          },
        },
      };
    });
  },

  toggleShopMedicineStock(shopId: string, medicineId: number, inStock: boolean) {
    setDynamicState((prev) => {
      const currentShop = currentState.shops.find((s) => s.id === shopId);
      const currentStocks = currentShop ? currentShop.stocks : (SEED_SHOPS.find((s) => s.id === shopId)?.stocks || []);
      const nextStocks = inStock
        ? currentStocks.includes(medicineId)
          ? currentStocks
          : [...currentStocks, medicineId]
        : currentStocks.filter((id) => id !== medicineId);

      const prevShopOverride = prev.shopOverrides[shopId] || {};
      return {
        ...prev,
        shopOverrides: {
          ...prev.shopOverrides,
          [shopId]: {
            ...prevShopOverride,
            stocks: nextStocks,
          },
        },
      };
    });
  },

  verifyPrescriptionAndCreateOrder(
    shopId: string,
    medicineId: number,
    qty: number = 1,
    prescriptionId?: string
  ): ShopOrder {
    const newOrderId = generateShopOrderId();
    const newOrder: ShopOrder = {
      id: newOrderId,
      shopId,
      medicineId,
      qty,
      status: 'Ready for pickup',
      createdAt: new Date().toISOString(),
      prescriptionId,
    };

    setDynamicState((prev) => {
      const medicine = currentState.medicines.find((m) => m.id === medicineId);
      const medName = medicine ? medicine.name : `Medicine #${medicineId}`;

      const pharmacistMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'shop' as const,
        text: `Prescription verified & approved by licensed pharmacist. Pickup ticket ${newOrderId} generated for ${qty}x ${medName}. Ready for counter collection!`,
        timestamp: formatCurrentTime(),
      };

      let conversations = [...prev.shopConversations];
      const convIndex = conversations.findIndex((c) => c.shopId === shopId);

      if (convIndex === -1) {
        conversations = [
          {
            id: `conv-${shopId}`,
            shopId,
            medicineId,
            messages: [pharmacistMsg],
          },
          ...conversations,
        ];
      } else {
        const target = conversations[convIndex];
        conversations[convIndex] = {
          ...target,
          medicineId: target.medicineId || medicineId,
          messages: [...target.messages, pharmacistMsg],
        };
      }

      return {
        ...prev,
        shopOrders: [newOrder, ...prev.shopOrders],
        shopConversations: conversations,
      };
    });

    return newOrder;
  },

  setActiveVendingMachine(machineId: string) {
    setDynamicState((prev) => ({
      ...prev,
      activeVendingMachineId: machineId,
    }));
  },

  resetDemoData() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(DYNAMIC_STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (err) {
        console.error('Failed to clear demo state from localStorage:', err);
      }
    }
    setDynamicState(() => DEFAULT_DYNAMIC_STATE);
  },
};

export function useMedivendStore() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, () => INITIAL_STATE);

  return {
    state,
    medicines: state.medicines,
    vendingMachine: state.vendingMachine,
    vendingMachines: state.vendingMachines,
    activeVendingMachineId: state.activeVendingMachineId,
    shops: state.shops,
    cart: state.cart,
    machineOrders: state.machineOrders,
    shopConversations: state.shopConversations,
    shopOrders: state.shopOrders,

    // Actions
    setActiveVendingMachine: store.setActiveVendingMachine,
    toggleMachineStatus: store.toggleMachineStatus,
    restockMachine: store.restockMachine,
    addToCart: store.addToCart,
    updateCartQuantity: store.updateCartQuantity,
    removeFromCart: store.removeFromCart,
    clearCart: store.clearCart,
    createMachineOrder: store.createMachineOrder,
    completeDispense: store.completeDispense,
    getOrCreateConversation: store.getOrCreateConversation,
    sendMessage: store.sendMessage,
    createShopOrder: store.createShopOrder,
    verifyPrescriptionAndCreateOrder: store.verifyPrescriptionAndCreateOrder,
    updateShopOrderStatus: store.updateShopOrderStatus,
    toggleShopOpen: store.toggleShopOpen,
    toggleShopMedicineStock: store.toggleShopMedicineStock,
    resetDemoData: store.resetDemoData,
  };
}