import { AppState, Medicine, VendingMachine, Shop, ShopConversation } from './types';

export const SEED_MEDICINES: Medicine[] = [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    price: 30,
    category: 'Pain and fever',
    otc: true,
    machineStock: 12,
  },
  {
    id: 2,
    name: 'ORS Sachet',
    price: 20,
    category: 'Hydration',
    otc: true,
    machineStock: 0,
  },
  {
    id: 3,
    name: 'Cetirizine 10mg',
    price: 25,
    category: 'Allergy',
    otc: true,
    machineStock: 0,
  },
  {
    id: 4,
    name: 'Antacid Chewable Tablets',
    price: 35,
    category: 'Digestion',
    otc: true,
    machineStock: 8,
  },
  {
    id: 5,
    name: 'Cough Lozenges',
    price: 40,
    category: 'Cold and cough',
    otc: true,
    machineStock: 15,
  },
  {
    id: 6,
    name: 'Ibuprofen 400mg',
    price: 45,
    category: 'Pain and fever',
    otc: true,
    machineStock: 6,
  },
  {
    id: 7,
    name: 'Adhesive Bandages (10 pack)',
    price: 50,
    category: 'First aid',
    otc: true,
    machineStock: 20,
  },
  {
    id: 8,
    name: 'Amoxicillin 500mg',
    price: 90,
    category: 'Antibiotic',
    otc: false,
    machineStock: 5, // Not dispensable by machine
  },
];

export const SEED_VENDING_MACHINE: VendingMachine = {
  id: 'VM-01',
  name: 'MediVend Station 01',
  location: 'Central Metro Station, Gate 2',
  status: 'Online',
  lastSynced: 'Just now',
};

export const SEED_SHOPS: Shop[] = [
  {
    id: 'S1',
    name: 'GreenCross Pharmacy',
    area: 'Lake View',
    distanceKm: 0.8,
    hours: '8:00 AM - 10:00 PM',
    isOpen: true,
    stocks: [1, 2, 3, 4, 6],
    phone: '+91 98765 43210',
  },
  {
    id: 'S2',
    name: 'CityCare Chemist',
    area: 'Market Road',
    distanceKm: 1.5,
    hours: '9:00 AM - 9:00 PM',
    isOpen: false,
    stocks: [2, 3, 5, 7],
    phone: '+91 98765 43211',
  },
  {
    id: 'S3',
    name: 'Wellness Corner',
    area: 'Park Street',
    distanceKm: 2.3,
    hours: '7:00 AM - 11:00 PM',
    isOpen: true,
    stocks: [1, 2, 4, 5, 7], // does NOT stock Cetirizine (id 3)
    phone: '+91 98765 43212',
  },
];

export const SEED_SHOP_CONVERSATIONS: ShopConversation[] = [
  {
    id: 'conv-S1',
    shopId: 'S1',
    medicineId: 3,
    messages: [
      {
        id: 'msg-s1-1',
        sender: 'customer',
        text: 'Hi, do you have Cetirizine?',
        timestamp: '10:30 AM',
      },
      {
        id: 'msg-s1-2',
        sender: 'shop',
        text: 'Yes, we have it in stock.',
        timestamp: '10:32 AM',
      },
    ],
  },
];

export const INITIAL_STATE: AppState = {
  medicines: SEED_MEDICINES,
  vendingMachine: SEED_VENDING_MACHINE,
  shops: SEED_SHOPS,
  cart: [],
  machineOrders: [],
  shopConversations: SEED_SHOP_CONVERSATIONS,
  shopOrders: [],
};
