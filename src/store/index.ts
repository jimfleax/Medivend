import { useSyncExternalStore } from 'react';
import {
  AppState,
  CartItem,
  MachineOrder,
  MachineOrderItem,
  ShopConversation,
  ShopOrder,
  ShopOrderStatus,
} from '../data/types';
import { INITIAL_STATE } from '../data/seed';

const STORAGE_KEY = 'medivend-state';

// In-memory state cache
let currentState: AppState = loadInitialState();
const listeners = new Set<() => void>();

function loadInitialState(): AppState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveToStorage(INITIAL_STATE);
      return INITIAL_STATE;
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.medicines) && parsed.vendingMachine) {
      return {
        ...INITIAL_STATE,
        ...parsed,
      };
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }
  saveToStorage(INITIAL_STATE);
  return INITIAL_STATE;
}

function saveToStorage(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

function setState(updater: (prev: AppState) => AppState) {
  currentState = updater(currentState);
  saveToStorage(currentState);
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

// 4. LIVE SYNC: Listen to the window "storage" event across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        currentState = JSON.parse(event.newValue);
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
    let result: { success: boolean; message?: string } = { success: false, message: '' };

    setState((prev) => {
      const medicine = prev.medicines.find((m) => m.id === medicineId);
      if (!medicine) {
        result = { success: false, message: 'Medicine not found' };
        return prev;
      }
      if (!medicine.otc) {
        result = { success: false, message: 'Prescription required' };
        return prev;
      }
      if (medicine.machineStock <= 0) {
        result = { success: false, message: 'Out of stock in machine' };
        return prev;
      }

      const existingIndex = prev.cart.findIndex((item) => item.medicineId === medicineId);
      const currentQty = existingIndex >= 0 ? prev.cart[existingIndex].quantity : 0;
      const newQty = Math.min(medicine.machineStock, currentQty + quantity);

      if (newQty <= currentQty) {
        result = { success: false, message: `Maximum available machine stock (${medicine.machineStock}) reached` };
        return prev;
      }

      let newCart: CartItem[];
      if (existingIndex >= 0) {
        newCart = prev.cart.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: newQty } : item
        );
      } else {
        newCart = [...prev.cart, { medicineId, quantity: newQty }];
      }

      result = { success: true };
      return {
        ...prev,
        cart: newCart,
      };
    });

    return result;
  },

  updateCartQuantity(medicineId: number, quantity: number) {
    setState((prev) => {
      const medicine = prev.medicines.find((m) => m.id === medicineId);
      if (!medicine) return prev;

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
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.medicineId !== medicineId),
    }));
  },

  clearCart() {
    setState((prev) => ({
      ...prev,
      cart: [],
    }));
  },

  createMachineOrder(paymentMethod: 'UPI' | 'Card'): MachineOrder | null {
    let order: MachineOrder | null = null;

    setState((prev) => {
      if (prev.cart.length === 0) return prev;

      const orderItems: MachineOrderItem[] = [];
      let totalAmount = 0;

      for (const cartItem of prev.cart) {
        const medicine = prev.medicines.find((m) => m.id === cartItem.medicineId);
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

      order = {
        id: generateOrderCode(),
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
    setState((prev) => {
      const targetOrder = prev.machineOrders.find((o) => o.id === orderId);
      if (!targetOrder) return prev;

      const updatedMedicines = prev.medicines.map((med) => {
        const orderedItem = targetOrder.items.find((item) => item.medicineId === med.id);
        if (orderedItem) {
          return {
            ...med,
            machineStock: Math.max(0, med.machineStock - orderedItem.quantity),
          };
        }
        return med;
      });

      const updatedOrders = prev.machineOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'completed' as const } : o
      );

      return {
        ...prev,
        medicines: updatedMedicines,
        machineOrders: updatedOrders,
        cart: [],
      };
    });
  },

  // Conversation & Messaging actions
  getOrCreateConversation(shopId: string, medicineId?: number): ShopConversation {
    let conv = currentState.shopConversations.find((c) => c.shopId === shopId);
    if (!conv) {
      const newConv: ShopConversation = {
        id: `conv-${shopId}`,
        shopId,
        medicineId,
        messages: [],
      };
      setState((prev) => ({
        ...prev,
        shopConversations: [newConv, ...prev.shopConversations],
      }));
      return newConv;
    }

    if (medicineId && conv.medicineId !== medicineId) {
      setState((prev) => ({
        ...prev,
        shopConversations: prev.shopConversations.map((c) =>
          c.id === conv!.id ? { ...c, medicineId } : c
        ),
      }));
      return { ...conv, medicineId };
    }

    return conv;
  },

  sendMessage(shopId: string, sender: 'customer' | 'shop' | 'system', text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setState((prev) => {
      let conversations = [...prev.shopConversations];
      let convIndex = conversations.findIndex((c) => c.shopId === shopId);

      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender,
        text: trimmed,
        timestamp: formatCurrentTime(),
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

    setState((prev) => {
      const medicine = prev.medicines.find((m) => m.id === medicineId);
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
    setState((prev) => {
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
    setState((prev) => ({
      ...prev,
      shops: prev.shops.map((s) => (s.id === shopId ? { ...s, isOpen } : s)),
    }));
  },

  toggleShopMedicineStock(shopId: string, medicineId: number, inStock: boolean) {
    setState((prev) => ({
      ...prev,
      shops: prev.shops.map((s) => {
        if (s.id !== shopId) return s;
        const currentStocks = s.stocks || [];
        const nextStocks = inStock
          ? currentStocks.includes(medicineId)
            ? currentStocks
            : [...currentStocks, medicineId]
          : currentStocks.filter((id) => id !== medicineId);

        return {
          ...s,
          stocks: nextStocks,
        };
      }),
    }));
  },

  resetDemoData() {
    setState(() => INITIAL_STATE);
  },
};

export function useMedivendStore() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, () => INITIAL_STATE);

  return {
    state,
    medicines: state.medicines,
    vendingMachine: state.vendingMachine,
    shops: state.shops,
    cart: state.cart,
    machineOrders: state.machineOrders,
    shopConversations: state.shopConversations,
    shopOrders: state.shopOrders,

    // Actions
    addToCart: store.addToCart,
    updateCartQuantity: store.updateCartQuantity,
    removeFromCart: store.removeFromCart,
    clearCart: store.clearCart,
    createMachineOrder: store.createMachineOrder,
    completeDispense: store.completeDispense,
    getOrCreateConversation: store.getOrCreateConversation,
    sendMessage: store.sendMessage,
    createShopOrder: store.createShopOrder,
    updateShopOrderStatus: store.updateShopOrderStatus,
    toggleShopOpen: store.toggleShopOpen,
    toggleShopMedicineStock: store.toggleShopMedicineStock,
    resetDemoData: store.resetDemoData,
  };
}
