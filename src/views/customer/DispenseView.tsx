import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  PackageCheck,
  ArrowRight,
  Pill,
  ShieldAlert,
  KeyRound,
  QrCode,
  Copy,
  Receipt,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMedivendStore } from '@/store';
import { formatRupees } from '@/data/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const DispenseView: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { machineOrders, completeDispense, vendingMachine, vendingMachines } = useMedivendStore();

  const targetOrder = machineOrders.find((o) => o.id === orderId);
  const assignedMachine =
    vendingMachines.find((vm) => vm.id === targetOrder?.machineId) || vendingMachine;

  // If order was already completed before mounting
  const isAlreadyCompleted = targetOrder?.status === 'completed';

  const [progress, setProgress] = useState(isAlreadyCompleted ? 100 : 0);
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted);
  const completedRef = useRef(isAlreadyCompleted);

  useEffect(() => {
    if (!targetOrder || isAlreadyCompleted || completedRef.current) return;

    // 4000ms animation: 40ms intervals, increment 1% each tick
    const totalDuration = 4000;
    const intervalTime = 40;
    const increment = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          if (!completedRef.current) {
            completedRef.current = true;
            completeDispense(targetOrder.id);
            setIsCompleted(true);
          }
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [targetOrder, isAlreadyCompleted, completeDispense]);

  const handleCopyPin = () => {
    if (targetOrder?.dispensePin) {
      navigator.clipboard.writeText(targetOrder.dispensePin);
      toast.success('Dispense PIN copied to clipboard');
    }
  };

  if (!targetOrder) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto text-primary">
          <ShieldAlert className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Order Not Found</h2>
        <p className="text-sm text-muted-foreground">
          No dispensing record was found matching this reference code.
        </p>
        <Button asChild className="mt-4">
          <Link to="/customer">Return to Station Catalog</Link>
        </Button>
      </div>
    );
  }

  const dispensePin = targetOrder.dispensePin || '7492';

  return (
    <div className="max-w-lg mx-auto py-4 sm:py-8 space-y-6">
      <Card className="border-border bg-white shadow-sm overflow-hidden rounded-2xl">
        {/* Animated accent banner */}
        <div className="h-1.5 w-full bg-primary/20 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {!isCompleted ? (
            /* Dispensing in progress */
            <div className="py-8 text-center space-y-6">
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-secondary border-t-primary animate-spin" />
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-primary shadow-xs">
                  <Pill className="h-6 w-6 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  Dispensing your medicine...
                </h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Mechanical tray active at <strong className="text-foreground">{assignedMachine.name}</strong>. Please wait while unit channels release your package.
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span>{assignedMachine.location}</span>
                </div>
              </div>

              <div className="space-y-2 max-w-xs mx-auto">
                <Progress value={progress} className="h-2.5 bg-secondary" />
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Releasing item channels</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          ) : (
            /* Dispensing Complete - Success State */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
              <div className="text-center space-y-3">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <CheckCircle2 className="h-9 w-9 stroke-[2.25]" />
                </div>

                <div className="space-y-1">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-0.5 font-bold">
                    DISPENSE COMPLETE
                  </Badge>
                  <h2 className="text-2xl font-extrabold text-foreground tracking-tight pt-1">
                    Collect your medicine from the tray
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    The retrieval hatch at the bottom of the machine is now unlocked.
                  </p>
                </div>
              </div>

              {/* Kiosk Dispense Credentials Card (PIN & QR) */}
              <div className="p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 space-y-4">
                <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                      Dispensing Kiosk
                    </span>
                    <p className="text-xs font-bold text-foreground">
                      {assignedMachine.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5 text-primary" />
                      {assignedMachine.location}
                    </p>
                  </div>

                  <Badge variant="outline" className="bg-white border-primary/30 text-primary text-[10px] font-mono font-bold">
                    {targetOrder.id}
                  </Badge>
                </div>

                {/* PIN and Simulated QR Code */}
                <div className="grid grid-cols-2 gap-3 items-center">
                  {/* Dispense PIN */}
                  <div className="bg-white p-3 rounded-xl border border-primary/20 text-center space-y-1 shadow-2xs">
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center justify-center gap-1">
                      <KeyRound className="h-3 w-3 text-primary" /> Kiosk PIN
                    </span>
                    <div className="text-2xl sm:text-3xl font-mono font-extrabold text-primary tracking-widest">
                      {dispensePin}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPin}
                      className="text-[10px] text-muted-foreground hover:text-primary font-medium flex items-center justify-center gap-1 mx-auto"
                    >
                      <Copy className="h-2.5 w-2.5" /> Copy PIN
                    </button>
                  </div>

                  {/* Simulated QR Token */}
                  <div className="bg-white p-2.5 rounded-xl border border-primary/20 flex flex-col items-center justify-center text-center space-y-1 shadow-2xs">
                    <div className="h-16 w-16 bg-slate-900 rounded-lg p-1.5 flex items-center justify-center text-white">
                      <QrCode className="h-12 w-12 text-white stroke-[1.75]" />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      Scan at Kiosk Reader
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-center text-muted-foreground pt-1">
                  Paid via {targetOrder.paymentMethod} · <strong>{formatRupees(targetOrder.totalAmount)}</strong>
                </div>
              </div>

              {/* Dispensed Items List */}
              <div className="space-y-2.5 rounded-xl border border-border p-4 bg-background">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground pb-1 border-b border-border">
                  <span className="flex items-center gap-1.5">
                    <PackageCheck className="h-4 w-4 text-primary" />
                    Dispensed Items ({targetOrder.items.reduce((a, b) => a + b.quantity, 0)})
                  </span>
                  <span>Quantity</span>
                </div>

                <div className="space-y-2">
                  {targetOrder.items.map((item) => (
                    <div
                      key={item.medicineId}
                      className="flex items-center justify-between text-xs py-0.5"
                    >
                      <div className="flex-1 pr-2 truncate">
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="text-muted-foreground ml-2 text-[11px]">
                          ({formatRupees(item.price)} each)
                        </span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs px-2 py-0">
                        ×{item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => navigate('/customer/orders')}
                  variant="outline"
                  className="w-full h-10 font-semibold text-xs border-primary/30 text-primary hover:bg-primary/5 gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  View in My Orders & Receipts
                </Button>

                <Button
                  onClick={() => navigate('/customer')}
                  className="w-full h-11 font-bold text-sm shadow-sm gap-2 bg-primary text-white hover:bg-primary/90"
                >
                  Back to vending catalog
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
