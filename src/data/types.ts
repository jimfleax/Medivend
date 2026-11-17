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
  machineId: string; // e.g. "VM-01"
  machineName: string; // e.g. "MediVend Dispenser Unit 01 (SN: MV-IIM-001)"
  dispensePin: string; // e.g. "4821"
  qrCodeData: string; // e.g. "MEDIVEND:VM-01:MV-4821:4821"
  items: MachineOrderItem[];
  totalAmount: number;
  paymentMethod: 'UPI' | 'Card';
  createdAt: string;
  status: 'dispensing' | 'completed' | 'cancelled';
}

export interface PrescriptionAttachment {
  id: string;
  fileName: string;
  fileSize: number; // in bytes
  dataUrl: string; // base64 encoded image data url
  uploadedAt: string;
}

export interface ShopConversationMessage {
  id: string;
  sender: 'customer' | 'shop' | 'system';
  text: string;
  timestamp: string;
  prescription?: PrescriptionAttachment;
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
  prescriptionId?: string;
}

export interface ShopOverride {
  isOpen?: boolean;
  stocks?: number[];
}

export interface PersistedDynamicState {
  activeVendingMachineId?: string;
  machineStockOverrides: Record<string, Record<number, number>>;
  machineStatusOverrides?: Record<string, 'Online' | 'Offline'>;
  shopOverrides: Record<string, ShopOverride>;
  cart: CartItem[];
  machineOrders: MachineOrder[];
  shopConversations: ShopConversation[];
  shopOrders: ShopOrder[];
}

export interface AppState {
  medicines: Medicine[];
  vendingMachine: VendingMachine;
  vendingMachines: VendingMachine[];
  activeVendingMachineId: string;
  shops: Shop[];
  cart: CartItem[];
  machineOrders: MachineOrder[];
  shopConversations: ShopConversation[];
  shopOrders: ShopOrder[];
}
