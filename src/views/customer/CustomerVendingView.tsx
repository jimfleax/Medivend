import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Store,
  ShoppingBag,
  AlertCircle,
  MapPin,
  Check,
  UploadCloud,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useMedivendStore } from '@/store';
import { Medicine } from '@/data/types';
import { formatRupees } from '@/data/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VendingMachineGraphic } from '@/components/motion/VendingMachineGraphic';
import { PrescriptionModal } from '@/components/prescription/PrescriptionModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export const CustomerVendingView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const {
    medicines,
    vendingMachine,
    vendingMachines,
    activeVendingMachineId,
    setActiveVendingMachine,
    toggleMachineStatus,
    restockMachine,
    cart,
    addToCart,
  } = useMedivendStore();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [alertMedicine, setAlertMedicine] = useState<Medicine | null>(null);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(medicines.map((m) => m.category)));
    return ['All', ...cats];
  }, [medicines]);

  // Filter medicines by search query, category, and stock
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        med.name.toLowerCase().includes(q) ||
        med.category.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All' || med.category === selectedCategory;

      const matchesStock = !inStockOnly || med.machineStock > 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [medicines, searchQuery, selectedCategory, inStockOnly]);

  // Other stations excluding the active one
  const otherMachines = useMemo(() => {
    return vendingMachines.filter((vm) => vm.id !== activeVendingMachineId);
  }, [vendingMachines, activeVendingMachineId]);

  const handleCardClick = (med: Medicine) => {
    if (med.machineStock === 0) {
      setAlertMedicine(med);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent, med: Medicine) => {
    e.stopPropagation();
    const result = addToCart(med.id);
    if (result.success) {
      toast.success(`Added ${med.name} to cart`);
    } else {
      toast.error(result.message || 'Cannot add to cart');
    }
  };

  const handleConfirmShopCheck = () => {
    if (alertMedicine) {
      const id = alertMedicine.id;
      const isRx = !alertMedicine.otc;
      setAlertMedicine(null);
      navigate(`/customer/shops?shop=S1&medicine=${id}${isRx ? '&uploadRx=true' : ''}`);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden bg-white">
      {/* ========================================================= */}
      {/* PANEL 1 (LEFT): Category Navigation & Stock Filter        */}
      {/* ========================================================= */}
      <div className="w-full lg:w-64 p-5 flex flex-col justify-between bg-slate-50/60 shrink-0 overflow-y-auto">
        <div className="space-y-4">
          {/* In Stock Only Toggle */}
          <div className="p-3 bg-white rounded-xl border border-border/80 flex items-center justify-between shadow-2xs">
            <span className="text-xs font-semibold text-foreground">In Stock Only</span>
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={cn(
                'w-10 h-5 rounded-full transition-colors relative p-0.5',
                inStockOnly ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                  inStockOnly ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-1">
            <div className="text-xs font-bold text-foreground px-1 pb-1">
              Categories
            </div>
            <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
                      isActive
                        ? 'bg-primary text-white shadow-xs font-semibold'
                        : 'text-foreground/80 hover:bg-white hover:text-foreground'
                    )}
                  >
                    <span className="truncate">{category}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL 2 (MIDDLE): Search Header + Medicine Inventory Grid */}
      {/* ========================================================= */}
      <div className="flex-1 min-w-0 p-5 flex flex-col h-full overflow-y-auto bg-slate-50/20 space-y-5">
        {/* Header Search Bar with "Upload Prescription" Button */}
        <div className="relative w-full">
          <div className="relative flex items-center bg-white rounded-2xl border-2 border-border shadow-xs focus-within:border-primary transition-colors p-1.5 sm:p-2">
            <div className="pl-3 text-muted-foreground">
              <Search className="h-5 w-5 text-primary" />
            </div>

            <Input
              type="text"
              placeholder="Search medicines in active station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-transparent focus-visible:border-transparent text-sm sm:text-base h-11 bg-transparent placeholder:text-muted-foreground/60"
            />

            {/* "Upload Prescription" Button */}
            <Button
              type="button"
              onClick={() => setPrescriptionModalOpen(true)}
              className="shrink-0 h-10 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-primary text-white hover:bg-primary/90 gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Prescription</span>
            </Button>
          </div>
        </div>

        {/* Machine Status Warning Banner */}
        {vendingMachine.status === 'Offline' && (
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>{vendingMachine.name}</strong> is currently in maintenance / restocking mode. Dispensing is paused at this kiosk.
              </span>
            </div>
            {otherMachines.length > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  const onlineMachine = otherMachines.find((m) => m.status === 'Online') || otherMachines[0];
                  setActiveVendingMachine(onlineMachine.id);
                  toast.info(`Switched to ${onlineMachine.name}`);
                }}
                className="h-7 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-xs"
              >
                Switch to {otherMachines[0].name.split(' (')[0]} →
              </Button>
            )}
          </div>
        )}

        {/* Medicine Inventory Grid */}
        <div className="flex-1">
          {filteredMedicines.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border-2 border-dashed border-border bg-white text-muted-foreground space-y-3">
              <AlertCircle className="h-9 w-9 mx-auto text-muted-foreground/40" />
              <p className="font-semibold text-foreground text-sm">No medicines found</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setInStockOnly(false);
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMedicines.map((med) => {
                const isOutOfStock = med.machineStock === 0;
                const isPrescriptionOnly = !med.otc;
                const cartItem = cart.find((c) => c.medicineId === med.id);
                const currentInCart = cartItem ? cartItem.quantity : 0;
                const isMaxInCart = currentInCart >= med.machineStock && med.machineStock > 0;

                return (
                  <motion.div
                    key={med.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card
                      onClick={() => handleCardClick(med)}
                      className={cn(
                        'h-full flex flex-col justify-between transition-all duration-200 border-border bg-white rounded-2xl shadow-2xs',
                        isOutOfStock
                          ? 'cursor-pointer hover:border-primary/50 bg-rose-50/15'
                          : 'hover:shadow-md hover:border-primary/40'
                      )}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {med.category}
                          </span>

                          {isOutOfStock ? (
                            <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                              Out of stock
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-medium">
                              Stock: {med.machineStock}
                            </span>
                          )}
                        </div>

                        <CardTitle className="text-sm font-bold text-foreground mt-1 line-clamp-1">
                          {med.name}
                        </CardTitle>

                        <div className="text-base font-extrabold text-primary mt-0.5">
                          {formatRupees(med.price)}
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-2 mt-auto">
                        {isPrescriptionOnly ? (
                          <Button
                            variant="outline"
                            className="w-full text-xs font-semibold border-amber-200 text-amber-800 bg-amber-50/60 hover:bg-amber-100/70 gap-1.5 h-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAlertMedicine(med);
                            }}
                          >
                            <FileText className="h-3.5 w-3.5 text-amber-600" />
                            Prescription required
                          </Button>
                        ) : isOutOfStock ? (
                          <Button
                            variant="outline"
                            className="w-full text-xs font-semibold border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 gap-1.5 h-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAlertMedicine(med);
                            }}
                          >
                            <Store className="h-3.5 w-3.5" />
                            Find at shop
                          </Button>
                        ) : (
                          <Button
                            className="w-full text-xs font-semibold gap-1.5 shadow-xs h-9 bg-primary text-white hover:bg-primary/90"
                            disabled={isMaxInCart}
                            onClick={(e) => handleAddToCartClick(e, med)}
                          >
                            {isMaxInCart ? (
                              <>
                                <ShoppingBag className="h-3.5 w-3.5" />
                                Max in cart ({currentInCart})
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Add to cart
                                {currentInCart > 0 && ` (${currentInCart})`}
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL 3 (RIGHT): Selected Station Hero & Other Stations   */}
      {/* ========================================================= */}
      <div className="w-full lg:w-80 p-5 flex flex-col justify-between bg-white shrink-0 overflow-y-auto space-y-6">
        <div className="space-y-5">
          {/* Top Hero: Current Selected Vending Machine */}
          <div className="p-5 rounded-3xl border-2 border-primary/30 bg-primary/5 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
            <div className="w-full flex justify-center py-2">
              <VendingMachineGraphic className="w-24 h-24 text-primary" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = vendingMachine.status === 'Online' ? 'Offline' : 'Online';
                    toggleMachineStatus(vendingMachine.id, nextStatus);
                    toast.info(`${vendingMachine.name} status switched to ${nextStatus}`);
                  }}
                  className="cursor-pointer group flex items-center"
                  title="Click to toggle Online/Maintenance status for demo"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-semibold transition-colors shadow-2xs',
                      vendingMachine.status === 'Online'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-100'
                    )}
                  >
                    {vendingMachine.status === 'Online' ? '● Online' : '▲ Maintenance'}
                  </Badge>
                </button>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Selected Station
                </span>
              </div>
              <h2 className="text-base font-extrabold text-foreground">
                {vendingMachine.name}
              </h2>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="line-clamp-2">{vendingMachine.location}</span>
              </div>

              {/* Demo Refill Action */}
              <div className="pt-2 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    restockMachine(vendingMachine.id);
                    toast.success(`Restocked all medicines at ${vendingMachine.name}`);
                  }}
                  className="h-7 px-2.5 text-[11px] font-semibold border-primary/25 text-primary hover:bg-primary/10 gap-1 rounded-lg shadow-2xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restock Unit
                </Button>
              </div>
            </div>
          </div>

          {/* Below: Other Vending Machines to Choose From */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              Other Stations ({otherMachines.length})
            </div>

            <div className="space-y-2.5">
              <AnimatePresence>
                {otherMachines.map((machine) => (
                  <motion.div
                    key={machine.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => {
                      setActiveVendingMachine(machine.id);
                      toast.info(`Switched to ${machine.name}`);
                    }}
                    className="p-3.5 rounded-2xl border border-border bg-white hover:border-primary/50 hover:bg-slate-50/70 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                        {machine.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        Switch →
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                      <span className="line-clamp-1">{machine.location}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Out of Stock Alert Dialog */}
      <AlertDialog
        open={Boolean(alertMedicine)}
        onOpenChange={(open) => {
          if (!open) setAlertMedicine(null);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {!alertMedicine?.otc ? 'Prescription Required' : 'Not available in this machine'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {alertMedicine ? (
                <>
                  <strong className="text-foreground">{alertMedicine.name}</strong>{' '}
                  {!alertMedicine.otc
                    ? 'requires a valid prescription and cannot be dispensed directly from the campus vending machine. Check partner pharmacies near IIM Sambalpur to consult or order with prescription?'
                    : 'is currently out of stock at this station. Check nearby partner shops that stock it?'}
                </>
              ) : (
                'Check nearby partner shops?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertMedicine(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmShopCheck}
              className="bg-primary text-white hover:bg-primary/90 font-semibold"
            >
              Check shops
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Prescription Modal */}
      <PrescriptionModal
        open={prescriptionModalOpen}
        onOpenChange={setPrescriptionModalOpen}
      />
    </div>
  );
};
