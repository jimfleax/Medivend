import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Radio,
  Search,
  Plus,
  Store,
  AlertCircle,
  Clock,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMedivendStore } from '@/store';
import { Medicine } from '@/data/types';
import { formatRupees } from '@/data/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { medicines, vendingMachine, cart, addToCart } = useMedivendStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [alertMedicine, setAlertMedicine] = useState<Medicine | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(medicines.map((m) => m.category)));
    return ['All', ...cats];
  }, [medicines]);

  // Filter medicines by search query and category
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        med.name.toLowerCase().includes(q) ||
        med.category.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All' || med.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchQuery, selectedCategory]);

  const handleCardClick = (med: Medicine) => {
    // Tapping an out-of-stock card opens the AlertDialog
    if (med.machineStock === 0) {
      setAlertMedicine(med);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, med: Medicine) => {
    e.stopPropagation();
    const result = addToCart(med.id);
    if (result.success) {
      toast.success(`Added ${med.name} to cart`, {
        description: 'Open cart in top bar to dispense.',
      });
    } else {
      toast.error(result.message || 'Cannot add to cart');
    }
  };

  const handleConfirmShopCheck = () => {
    if (alertMedicine) {
      const id = alertMedicine.id;
      setAlertMedicine(null);
      navigate(`/customer/shops?medicine=${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Machine Card at Top */}
      <Card className="border-border bg-white shadow-xs overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-accent" />
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {vendingMachine.id}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {vendingMachine.name}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-2 py-0.5 text-xs flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {vendingMachine.status}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
                <span>{vendingMachine.location}</span>
              </div>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60 text-xs text-muted-foreground gap-1">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Last synced: {vendingMachine.lastSynced}</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary font-medium">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                <span>Stock updates live from the machine</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Search Input & Category Filter Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search medicines by name or category (e.g., Paracetamol, Allergy)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white border-border focus-visible:ring-primary shadow-xs rounded-xl"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground border border-border/50'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Medicine Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing {filteredMedicines.length}{' '}
            {filteredMedicines.length === 1 ? 'medicine' : 'medicines'}
          </span>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-primary hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-border bg-white text-muted-foreground space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">No medicines match your search</p>
            <p className="text-xs">Try adjusting your search terms or select another category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedicines.map((med) => {
              const isOutOfStock = med.machineStock === 0;
              const isPrescriptionOnly = !med.otc;
              const cartItem = cart.find((c) => c.medicineId === med.id);
              const currentInCart = cartItem ? cartItem.quantity : 0;
              const isMaxInCart = currentInCart >= med.machineStock && med.machineStock > 0;

              return (
                <Card
                  key={med.id}
                  onClick={() => handleCardClick(med)}
                  className={`flex flex-col justify-between transition-all duration-200 border-border bg-white ${
                    isOutOfStock
                      ? 'cursor-pointer hover:border-primary/50 hover:shadow-sm bg-rose-50/20'
                      : 'hover:shadow-md hover:border-primary/40'
                  }`}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                        {med.category}
                      </span>

                      {/* Stock Badge */}
                      {isOutOfStock ? (
                        <Badge
                          variant="destructive"
                          className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold text-xs"
                        >
                          Not in machine
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-accent text-accent-foreground border-primary/20 font-medium text-xs"
                        >
                          In machine: {med.machineStock}
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="text-base font-bold text-foreground mt-2 line-clamp-1">
                      {med.name}
                    </CardTitle>

                    <div className="text-lg font-bold text-primary mt-1">
                      {formatRupees(med.price)}
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 mt-auto">
                    {/* Prescription Item Handling */}
                    {isPrescriptionOnly ? (
                      <div className="space-y-1.5">
                        <Button
                          disabled
                          variant="outline"
                          className="w-full text-xs font-semibold bg-muted/60 text-muted-foreground cursor-not-allowed border-border"
                        >
                          Prescription required
                        </Button>
                        <p className="text-[11px] text-center text-muted-foreground leading-tight">
                          Cannot be dispensed by the machine
                        </p>
                      </div>
                    ) : isOutOfStock ? (
                      /* Out of stock OTC Item */
                      <Button
                        variant="outline"
                        className="w-full text-xs font-medium border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 hover:text-rose-800 gap-1.5 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAlertMedicine(med);
                        }}
                      >
                        <Store className="h-3.5 w-3.5" />
                        Find at a shop
                      </Button>
                    ) : (
                      /* In stock OTC Item */
                      <Button
                        className="w-full text-xs font-semibold gap-1.5 shadow-xs transition-all"
                        disabled={isMaxInCart}
                        onClick={(e) => handleAddToCart(e, med)}
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
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Out of Stock AlertDialog */}
      <AlertDialog
        open={Boolean(alertMedicine)}
        onOpenChange={(open) => {
          if (!open) setAlertMedicine(null);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary mb-2">
              <Store className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              Not available in this machine
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {alertMedicine ? (
                <>
                  <strong className="text-foreground">{alertMedicine.name}</strong> is currently out of stock at this station.
                  <br />
                  Want to check nearby shops that have it?
                </>
              ) : (
                'Want to check nearby shops that have it?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertMedicine(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmShopCheck}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5"
            >
              Check nearby shops
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
