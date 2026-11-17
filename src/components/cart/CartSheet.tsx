import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useMedivendStore } from '@/store';
import { formatRupees } from '@/data/formatters';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface CartSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CartSheet: React.FC<CartSheetProps> = () => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const {
    cart,
    medicines,
    vendingMachine,
    updateCartQuantity,
    removeFromCart,
  } = useMedivendStore();

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Compute items with medicine metadata
  const cartDetailedItems = cart
    .map((item) => {
      const med = medicines.find((m) => m.id === item.medicineId);
      if (!med) return null;
      return {
        ...item,
        medicine: med,
        lineTotal: med.price * item.quantity,
      };
    })
    .filter(Boolean) as Array<{
      medicineId: number;
      quantity: number;
      medicine: (typeof medicines)[0];
      lineTotal: number;
    }>;

  const grandTotal = cartDetailedItems.reduce((acc, item) => acc + item.lineTotal, 0);

  const handleProceedToCheckout = () => {
    setOpen(false);
    navigate('/customer/checkout');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-10 w-10 border-border bg-white text-foreground hover:bg-secondary transition-all"
          aria-label="Open Cart"
        >
          <ShoppingBag className="h-5 w-5 text-primary" />
          {totalItemsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-background">
              {totalItemsCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col sm:max-w-md w-full">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Machine Cart
            </SheetTitle>
            <Badge variant="secondary" className="font-medium text-xs">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Items to be dispensed directly from {vendingMachine.name} ({vendingMachine.location})
          </SheetDescription>
        </SheetHeader>

        {cartDetailedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="text-base font-medium text-foreground">Your cart is empty</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
              Select available over-the-counter medicines to dispense them immediately.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {cartDetailedItems.map(({ medicineId, quantity, medicine, lineTotal }) => (
              <div
                key={medicineId}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/60 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">
                      {medicine.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatRupees(medicine.price)} each
                    </span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-xs font-semibold text-primary">
                      {formatRupees(lineTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-border rounded-md bg-background">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none rounded-l-md hover:bg-secondary"
                      onClick={() => updateCartQuantity(medicineId, quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-7 text-center text-xs font-semibold select-none">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none rounded-r-md hover:bg-secondary"
                      disabled={quantity >= medicine.machineStock}
                      onClick={() => updateCartQuantity(medicineId, quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeFromCart(medicineId)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cartDetailedItems.length > 0 && (
          <SheetFooter className="pt-4 border-t border-border flex flex-col gap-3">
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span>{formatRupees(grandTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Dispensing fee</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between text-base font-bold text-foreground">
                <span>Total Amount</span>
                <span className="text-primary text-lg">{formatRupees(grandTotal)}</span>
              </div>
            </div>

            <Button
              className="w-full gap-2 font-semibold shadow-md mt-2"
              size="lg"
              onClick={handleProceedToCheckout}
            >
              Pay now ({formatRupees(grandTotal)})
              <ArrowRight className="h-4 w-4" />
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
