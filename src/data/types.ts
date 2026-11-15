export interface Medicine {
  id: number;
  name: string;
  price: number;
  category: string;
  otc: boolean;
  machineStock: number;
}

export interface VendingMachine {
  id: string;
  name: string;
  location: string;
  status: 'Online' | 'Offline';
  lastSynced: string;
}

export interface Shop {
  id: string;
  name: string;
  area: string;
  distanceKm: number;
  hours: string;
  isOpen: boolean;
  stocks: number[]; // medicine IDs
  phone?: string;
}

export interface CartItem {
  medicineId: number;
  quantity: number;
}

export interface MachineOrderItem {
  medicineId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface MachineOrder {
  id: string; // e.g. "MV-4821"
  items: MachineOrderItem[];
  totalAmount: number;
  paymentMethod: 'UPI' | 'Card';
  createdAt: string;
  status: 'dispensing' | 'completed' | 'cancelled';
}

export interface ShopConversationMessage {
  id: string;
  sender: 'customer' | 'shop' | 'system';
  text: string;
  timestamp: string;
}

export interface ShopConversation {
  id: string;
  shopId: string;
  medicineId?: number;
  messages: ShopConversationMessage[];
}

export type ShopOrderStatus = 'Requested' | 'Ready for pickup' | 'Picked up';

export interface ShopOrder {
  id: string;
  shopId: string;
  medicineId: number;
  qty: number;
  status: ShopOrderStatus;
  createdAt: string;
}

export interface AppState {
  medicines: Medicine[];
  vendingMachine: VendingMachine;
  shops: Shop[];
  cart: CartItem[];
  machineOrders: MachineOrder[];
  shopConversations: ShopConversation[];
  shopOrders: ShopOrder[];
}
