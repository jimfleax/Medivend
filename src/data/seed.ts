import { AppState, Medicine, VendingMachine, Shop, ShopConversation } from './types';

export const SEED_MEDICINES: Medicine[] = [
  // 1. PAIN, FEVER & INFLAMMATION
  {
    id: 1,
    name: 'Paracetamol 500mg',
    price: 30,
    category: 'Pain and fever',
    otc: true,
    machineStock: 12,
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
    id: 9,
    name: 'Paracetamol 650mg (Dolo 650)',
    price: 35,
    category: 'Pain and fever',
    otc: true,
    machineStock: 15,
  },
  {
    id: 10,
    name: 'Aspirin 350mg (Disprin)',
    price: 25,
    category: 'Pain and fever',
    otc: true,
    machineStock: 10,
  },
  {
    id: 11,
    name: 'Mefenamic Acid & Dicyclomine (Meftal-Spas)',
    price: 50,
    category: 'Pain and fever',
    otc: true,
    machineStock: 8,
  },
  {
    id: 12,
    name: 'Pain Relief Gel (Diclofenac 30g)',
    price: 95,
    category: 'Pain and fever',
    otc: true,
    machineStock: 9,
  },
  {
    id: 13,
    name: 'Headache & Cold Balm 10g',
    price: 40,
    category: 'Pain and fever',
    otc: true,
    machineStock: 14,
  },

  // 2. COLD, COUGH, FLU & THROAT
  {
    id: 5,
    name: 'Cough Lozenges',
    price: 40,
    category: 'Cold and cough',
    otc: true,
    machineStock: 15,
  },
  {
    id: 14,
    name: 'Vaporub Decongestant Balm 15g',
    price: 45,
    category: 'Cold and cough',
    otc: true,
    machineStock: 12,
  },
  {
    id: 15,
    name: 'Nasal Decongestant Spray 10ml',
    price: 85,
    category: 'Cold and cough',
    otc: true,
    machineStock: 8,
  },
  {
    id: 16,
    name: 'Cold & Sinus Multi-Action Tablets',
    price: 55,
    category: 'Cold and cough',
    otc: true,
    machineStock: 11,
  },

  // 3. DIGESTIVE & STOMACH CARE
  {
    id: 4,
    name: 'Antacid Chewable Tablets',
    price: 35,
    category: 'Digestion',
    otc: true,
    machineStock: 8,
  },
  {
    id: 17,
    name: 'Effervescent Acidity Relief (Eno 5 Sachets)',
    price: 40,
    category: 'Digestion',
    otc: true,
    machineStock: 18,
  },
  {
    id: 18,
    name: 'Anti-Diarrheal Tablets (Loperamide 2mg)',
    price: 30,
    category: 'Digestion',
    otc: true,
    machineStock: 10,
  },
  {
    id: 19,
    name: 'Motion Sickness Tablets (Dimenhydrinate 50mg)',
    price: 40,
    category: 'Digestion',
    otc: true,
    machineStock: 8,
  },
  {
    id: 20,
    name: 'Pudin Hara Pearls (Mint Digestive 10s)',
    price: 30,
    category: 'Digestion',
    otc: true,
    machineStock: 15,
  },
  {
    id: 21,
    name: 'Gentle Laxative Tablets (Bisacodyl 5mg)',
    price: 25,
    category: 'Digestion',
    otc: true,
    machineStock: 7,
  },

  // 4. HYDRATION, ELECTROLYTES & VITAMINS
  {
    id: 2,
    name: 'ORS Sachet',
    price: 20,
    category: 'Hydration',
    otc: true,
    machineStock: 0,
  },
  {
    id: 22,
    name: 'Electrolyte Energy Drink 200ml',
    price: 35,
    category: 'Hydration',
    otc: true,
    machineStock: 16,
  },
  {
    id: 23,
    name: 'Glucose-D Instant Energy Powder 100g',
    price: 40,
    category: 'Hydration',
    otc: true,
    machineStock: 12,
  },
  {
    id: 24,
    name: 'Vitamin C 500mg + Zinc Chewables',
    price: 45,
    category: 'Hydration',
    otc: true,
    machineStock: 14,
  },

  // 5. FIRST AID, WOUND CARE & BURNS
  {
    id: 7,
    name: 'Adhesive Bandages (10 pack)',
    price: 50,
    category: 'First aid',
    otc: true,
    machineStock: 20,
  },
  {
    id: 25,
    name: 'Antiseptic Liquid 50ml (Dettol)',
    price: 40,
    category: 'First aid',
    otc: true,
    machineStock: 12,
  },
  {
    id: 26,
    name: 'Antiseptic & Burn Ointment 15g (Betadine)',
    price: 65,
    category: 'First aid',
    otc: true,
    machineStock: 9,
  },
  {
    id: 27,
    name: 'Sterile Gauze & Micropore Tape Kit',
    price: 55,
    category: 'First aid',
    otc: true,
    machineStock: 10,
  },
  {
    id: 28,
    name: 'Antibacterial Cleansing Wipes (10 pack)',
    price: 35,
    category: 'First aid',
    otc: true,
    machineStock: 15,
  },

  // 6. ALLERGY, SKIN & EYE CARE
  {
    id: 3,
    name: 'Cetirizine 10mg',
    price: 25,
    category: 'Allergy',
    otc: true,
    machineStock: 0,
  },
  {
    id: 29,
    name: 'Lubricating Eye Drops 10ml',
    price: 110,
    category: 'Allergy',
    otc: true,
    machineStock: 7,
  },
  {
    id: 30,
    name: 'Calamine Soothing Skin Lotion 30ml',
    price: 60,
    category: 'Allergy',
    otc: true,
    machineStock: 8,
  },
  {
    id: 31,
    name: 'Antifungal Cream (Clotrimazole 1% 15g)',
    price: 75,
    category: 'Allergy',
    otc: true,
    machineStock: 6,
  },

  // 7. PERSONAL HYGIENE, REPRODUCTIVE & EMERGENCY
  {
    id: 32,
    name: 'Sanitary Napkins (Ultra-thin 3 pack)',
    price: 45,
    category: 'Personal hygiene',
    otc: true,
    machineStock: 16,
  },
  {
    id: 33,
    name: 'Latex Condoms (Pack of 3)',
    price: 90,
    category: 'Personal hygiene',
    otc: true,
    machineStock: 12,
  },
  {
    id: 34,
    name: 'Emergency Contraceptive Pill (1.5mg)',
    price: 110,
    category: 'Personal hygiene',
    otc: true,
    machineStock: 8,
  },
  {
    id: 35,
    name: 'One-Step Rapid Pregnancy Test Kit',
    price: 60,
    category: 'Personal hygiene',
    otc: true,
    machineStock: 10,
  },
  {
    id: 36,
    name: 'Pocket Hand Sanitizer 50ml',
    price: 30,
    category: 'Personal hygiene',
    otc: true,
    machineStock: 20,
  },
  {
    id: 37,
    name: 'Protective 3-Ply Face Masks (Pack of 3)',
    price: 25,
    category: 'Personal hygiene',
    otc: true,
    machineStock: 25,
  },

  // 8. PRESCRIPTION ONLY (FOR SHOP REFERRAL)
  {
    id: 8,
    name: 'Amoxicillin 500mg',
    price: 90,
    category: 'Antibiotic',
    otc: false,
    machineStock: 0, // Not dispensable by machine - referral to partner shops
  },
  {
    id: 38,
    name: 'Azithromycin 500mg',
    price: 125,
    category: 'Antibiotic',
    otc: false,
    machineStock: 0, // Not dispensable by machine - referral to partner shops
  },
  {
    id: 39,
    name: 'Pantoprazole 40mg (Pan-40)',
    price: 85,
    category: 'Digestion',
    otc: false,
    machineStock: 0, // Not dispensable by machine - referral to partner shops
  },
  {
    id: 40,
    name: 'Amlodipine 5mg',
    price: 40,
    category: 'Cardiovascular',
    otc: false,
    machineStock: 0, // Not dispensable by machine - referral to partner shops
  },
  {
    id: 41,
    name: 'Metformin 500mg',
    price: 35,
    category: 'Diabetes',
    otc: false,
    machineStock: 0, // Not dispensable by machine - referral to partner shops
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
    stocks: [
      1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 14, 15, 17, 18, 19, 22, 24, 25, 26, 29, 31,
      32, 33, 34, 37, 38, 39, 40, 41,
    ],
    phone: '+91 98765 43210',
  },
  {
    id: 'S2',
    name: 'CityCare Chemist',
    area: 'Market Road',
    distanceKm: 1.5,
    hours: '9:00 AM - 9:00 PM',
    isOpen: false,
    stocks: [
      2, 3, 5, 7, 9, 11, 13, 16, 17, 20, 21, 23, 27, 28, 30, 31, 35, 36, 38, 40,
    ],
    phone: '+91 98765 43211',
  },
  {
    id: 'S3',
    name: 'Wellness Corner',
    area: 'Park Street',
    distanceKm: 2.3,
    hours: '7:00 AM - 11:00 PM',
    isOpen: true,
    stocks: [
      1, 2, 4, 5, 7, 10, 12, 13, 14, 15, 18, 19, 20, 22, 23, 24, 25, 26, 28, 29,
      30, 32, 33, 35, 36, 37,
    ], // does NOT stock Cetirizine (id 3) or prescription antibiotics
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
