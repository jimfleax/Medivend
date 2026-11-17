import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UploadCloud,
  ArrowRight,
  Pill,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedivendStore } from '@/store';
import { formatRupees } from '@/data/formatters';
import { Medicine } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SpotlightCard } from '@/components/motion/SpotlightCard';
import { PrescriptionModal } from '@/components/prescription/PrescriptionModal';

export const CustomerDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { medicines } = useMedivendStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filtered medicines for instant search dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return medicines
      .filter((m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
      .slice(0, 6);
  }, [medicines, searchQuery]);

  const handleSearchResultClick = (med: Medicine) => {
    if (med.machineStock > 0) {
      navigate(`/customer/vending?search=${encodeURIComponent(med.name)}`);
    } else {
      navigate(`/customer/shops?medicine=${med.id}`);
    }
  };

  return (
    <div className="h-full max-w-4xl mx-auto px-4 sm:px-8 py-10 flex flex-col justify-center space-y-10">
      {/* 1. Minimalist Search Bar with "Upload Prescription" Button */}
      <div className="relative w-full">
        <div className="relative flex items-center bg-white rounded-2xl border-2 border-border shadow-xs focus-within:border-primary transition-colors p-2">
          <div className="pl-3 text-muted-foreground">
            <Search className="h-5 w-5 text-primary" />
          </div>

          <Input
            type="text"
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                navigate(`/customer/vending?search=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="border-0 shadow-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-transparent focus-visible:border-transparent text-base h-12 bg-transparent placeholder:text-muted-foreground/60"
          />

          {/* "Upload Prescription" Button */}
          <Button
            type="button"
            onClick={() => setPrescriptionModalOpen(true)}
            className="shrink-0 h-11 px-5 rounded-xl font-semibold text-xs sm:text-sm bg-primary text-white hover:bg-primary/90 gap-2 shadow-xs transition-transform active:scale-95"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Prescription</span>
          </Button>
        </div>

        {/* Live Search Autocomplete Dropdown */}
        <AnimatePresence>
          {isSearchFocused && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-border shadow-xl z-50 overflow-hidden divide-y divide-border/60"
            >
              {searchResults.map((med) => (
                <div
                  key={med.id}
                  onMouseDown={() => handleSearchResultClick(med)}
                  className="p-3.5 px-4 flex items-center justify-between hover:bg-secondary/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-accent text-primary flex items-center justify-center shrink-0">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        <span>{med.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {med.category}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatRupees(med.price)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {med.machineStock > 0 ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        In Machine
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                        At Shops
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Two Large Dedicated Minimalist Cards (Vending Machines & Shops) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: Vending Machines */}
        <SpotlightCard
          onClick={() => navigate('/customer/vending')}
          className="cursor-pointer group p-8 rounded-3xl border-2 border-border/80 hover:border-primary transition-all duration-300 flex flex-col items-center text-center justify-between min-h-[360px]"
        >
          {/* Large Descriptive Vending Machine Illustration */}
          <div className="w-full flex justify-center py-4">
            <VendingMachineGraphic />
          </div>

          <div className="space-y-2 mt-2">
            <h2 className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">
              Vending Machines
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Browse automated smart dispensers near you for instant medication pickup.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-0.5 transition-transform">
            <span>Explore Inventory</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </SpotlightCard>

        {/* Card 2: Shops & Pharmacies */}
        <SpotlightCard
          onClick={() => navigate('/customer/shops')}
          className="cursor-pointer group p-8 rounded-3xl border-2 border-border/80 hover:border-primary transition-all duration-300 flex flex-col items-center text-center justify-between min-h-[360px]"
        >
          {/* Large Descriptive Pharmacy Storefront Illustration */}
          <div className="w-full flex justify-center py-4">
            <PharmacyShopGraphic />
          </div>

          <div className="space-y-2 mt-2">
            <h2 className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">
              Shops & Pharmacies
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Find partner chemists nearby, consult pharmacists, and fulfill prescriptions.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-0.5 transition-transform">
            <span>Browse Pharmacies</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </SpotlightCard>
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        open={prescriptionModalOpen}
        onOpenChange={setPrescriptionModalOpen}
      />
    </div>
  );
};

/**
 * Large, descriptive vector graphic representing an automated medicine vending dispenser
 */
const VendingMachineGraphic: React.FC = () => (
  <svg
    viewBox="0 0 160 160"
    className="w-32 h-32 text-primary transition-transform duration-300 group-hover:scale-105"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Machine Cabinet Outer Frame */}
    <rect x="30" y="16" width="100" height="132" rx="14" fill="#F8FAFC" stroke="currentColor" strokeWidth="4" />
    
    {/* Top Header Sign with glowing Cross */}
    <rect x="42" y="24" width="76" height="22" rx="6" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2" />
    {/* Medical Cross in Header */}
    <path d="M80 29V41M74 35H86" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

    {/* Front Glass Display Window */}
    <rect x="42" y="52" width="54" height="52" rx="6" fill="#FFFFFF" stroke="currentColor" strokeWidth="2.5" />
    
    {/* Shelves & Medicine Packs inside Glass */}
    <line x1="44" y1="68" x2="94" y2="68" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.5" />
    <line x1="44" y1="86" x2="94" y2="86" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.5" />

    {/* Medicine Boxes / Bottles on shelves */}
    <rect x="48" y="58" width="10" height="8" rx="2" fill="currentColor" fillOpacity="0.8" />
    <rect x="63" y="57" width="12" height="9" rx="2" fill="currentColor" fillOpacity="0.4" />
    <rect x="80" y="58" width="10" height="8" rx="2" fill="currentColor" fillOpacity="0.7" />

    <rect x="48" y="74" width="12" height="10" rx="2" fill="currentColor" fillOpacity="0.5" />
    <rect x="66" y="75" width="9" height="9" rx="2" fill="currentColor" fillOpacity="0.8" />
    <rect x="81" y="74" width="11" height="10" rx="2" fill="currentColor" fillOpacity="0.4" />

    <rect x="52" y="92" width="10" height="9" rx="2" fill="currentColor" fillOpacity="0.7" />
    <rect x="68" y="91" width="12" height="10" rx="2" fill="currentColor" fillOpacity="0.6" />

    {/* Digital Control Panel & Scanner Column */}
    <rect x="102" y="52" width="16" height="24" rx="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
    {/* Screen status dot */}
    <circle cx="110" cy="60" r="2.5" fill="currentColor" />
    {/* Keypad dots */}
    <circle cx="107" cy="68" r="1" fill="currentColor" />
    <circle cx="113" cy="68" r="1" fill="currentColor" />
    <circle cx="107" cy="72" r="1" fill="currentColor" />
    <circle cx="113" cy="72" r="1" fill="currentColor" />

    {/* Card Tap / Cash Slot */}
    <rect x="103" y="82" width="14" height="4" rx="1.5" fill="currentColor" />

    {/* Dispensing Tray Chamber at Bottom */}
    <rect x="42" y="112" width="76" height="26" rx="6" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2.5" />
    <rect x="54" y="121" width="52" height="9" rx="3" fill="#FFFFFF" stroke="currentColor" strokeWidth="2" />

    {/* Dispenser Door Handle */}
    <line x1="72" y1="117" x2="88" y2="117" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/**
 * Large, descriptive vector graphic representing a pharmacy storefront / chemist shop
 */
const PharmacyShopGraphic: React.FC = () => (
  <svg
    viewBox="0 0 160 160"
    className="w-32 h-32 text-primary transition-transform duration-300 group-hover:scale-105"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Storefront Roof / Awning */}
    <path
      d="M24 44L34 26H126L136 44H24Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Awning Stripes */}
    <path d="M48 26L42 44M70 26L68 44M90 26L92 44M112 26L118 44" stroke="currentColor" strokeWidth="2.5" />

    {/* Awning Scallop Trim */}
    <path
      d="M24 44C27 48 31 48 34 44C37 48 41 48 44 44C47 48 51 48 54 44C57 48 61 48 64 44C67 48 71 48 74 44C77 48 81 48 84 44C87 48 91 48 94 44C97 48 101 48 104 44C107 48 111 48 114 44C117 48 121 48 124 44C127 48 131 48 136 44"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Store Main Building Body */}
    <rect x="30" y="48" width="100" height="96" rx="4" fill="#F8FAFC" stroke="currentColor" strokeWidth="4" />

    {/* Pharmacy Glowing Signboard with Cross */}
    <rect x="52" y="56" width="56" height="18" rx="4" fill="currentColor" stroke="currentColor" strokeWidth="2" />
    {/* White Cross on Sign */}
    <path d="M80 60V70M75 65H85" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

    {/* Left Display Window */}
    <rect x="38" y="82" width="34" height="48" rx="4" fill="#FFFFFF" stroke="currentColor" strokeWidth="2.5" />
    {/* Window Shelf & Medicine Bottles */}
    <line x1="40" y1="102" x2="70" y2="102" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    <rect x="44" y="90" width="7" height="10" rx="1.5" fill="currentColor" fillOpacity="0.7" />
    <rect x="55" y="88" width="11" height="12" rx="2" fill="currentColor" fillOpacity="0.4" />
    <rect x="46" y="108" width="10" height="14" rx="2" fill="currentColor" fillOpacity="0.5" />
    <rect x="60" y="110" width="8" height="12" rx="1.5" fill="currentColor" fillOpacity="0.8" />

    {/* Right Storefront Glass Door */}
    <rect x="80" y="82" width="42" height="62" rx="4" fill="#FFFFFF" stroke="currentColor" strokeWidth="2.5" />
    {/* Glass Door window panel */}
    <rect x="86" y="88" width="30" height="36" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
    {/* Door Handle */}
    <line x1="88" y1="112" x2="88" y2="124" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
