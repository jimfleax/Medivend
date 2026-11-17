import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  ShieldCheck,
  Loader2,
  Lock,
} from 'lucide-react';
import { useMedivendStore } from '@/store';
import { formatRupees } from '@/data/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export const CheckoutView: React.FC = () => {
  const navigate = useNavigate();
  const { cart, medicines, createMachineOrder, vendingMachine } = useMedivendStore();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card'>('UPI');
  const [upiId, setUpiId] = useState('user@upi');
  const [cardNumber, setCardNumber] = useState('4532 8920 1204 8821');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('742');
  const [isProcessing, setIsProcessing] = useState(false);

  // Compute cart items with medicine metadata
  const detailedItems = cart
    .map((item) => {
      const med = medicines.find((m) => m.id === item.medicineId);
      if (!med) return null;
      return {
        ...item,
        name: med.name,
        price: med.price,
        lineTotal: med.price * item.quantity,
      };
    })
    .filter(Boolean) as Array<{
      medicineId: number;
      quantity: number;
      name: string;
      price: number;
      lineTotal: number;
    }>;

  const grandTotal = detailedItems.reduce((acc, item) => acc + item.lineTotal, 0);

  const handlePay = () => {
    if (detailedItems.length === 0 || isProcessing) return;

    setIsProcessing(true);

    // 1.5s simulated loading state
    setTimeout(() => {
      const order = createMachineOrder(paymentMethod);
      if (order) {
        navigate(`/customer/dispense/${order.id}`);
      } else {
        setIsProcessing(false);
      }
    }, 1500);
  };

  if (detailedItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No items in checkout</h2>
        <p className="text-sm text-muted-foreground">
          Please add available medicines from the machine catalog before proceeding to checkout.
        </p>
        <Button asChild className="gap-2">
          <Link to="/customer">
            <ArrowLeft className="h-4 w-4" />
            Back to vending catalog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Link to="/customer">
            <ArrowLeft className="h-4 w-4" />
            Back to vending catalog
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Column: Payment Form (3 cols) */}
        <div className="md:col-span-3 space-y-4">
          <Card className="border-border bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Payment Method
                </CardTitle>
                <span className="text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                  {vendingMachine.name}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <Tabs
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as 'UPI' | 'Card')}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full bg-secondary p-1 h-10 rounded-lg">
                  <TabsTrigger
                    value="UPI"
                    className="text-xs font-semibold gap-2 data-[state=active]:bg-white data-[state=active]:text-primary"
                  >
                    <QrCode className="h-4 w-4" />
                    UPI
                  </TabsTrigger>
                  <TabsTrigger
                    value="Card"
                    className="text-xs font-semibold gap-2 data-[state=active]:bg-white data-[state=active]:text-primary"
                  >
                    <CreditCard className="h-4 w-4" />
                    Card
                  </TabsTrigger>
                </TabsList>

                {/* UPI Tab Content */}
                <TabsContent value="UPI" className="space-y-3 pt-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Virtual Payment Address (UPI ID)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. mobile@upi or username@bank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="bg-white border-border text-sm h-10"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Any test UPI ID is accepted in this simulation.
                    </p>
                  </div>
                </TabsContent>

                {/* Card Tab Content */}
                <TabsContent value="Card" className="space-y-3 pt-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Card Number
                    </label>
                    <Input
                      type="text"
                      placeholder="16-digit card number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="bg-white border-border text-sm h-10 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Expiry Date
                      </label>
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="bg-white border-border text-sm h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        CVV
                      </label>
                      <Input
                        type="password"
                        maxLength={4}
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="bg-white border-border text-sm h-10"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Pay Button */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full h-11 text-sm font-bold shadow-sm transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Authorizing {formatRupees(grandTotal)}...
                    </>
                  ) : (
                    `Pay ${formatRupees(grandTotal)}`
                  )}
                </Button>

                {/* Demo Payment Disclaimer Note */}
                <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Demo payment, no real charge</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border-border bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-foreground">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {detailedItems.map((item) => (
                  <div
                    key={item.medicineId}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.quantity} × {formatRupees(item.price)}
                      </p>
                    </div>
                    <span className="font-bold text-foreground">
                      {formatRupees(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupees(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dispensing Tray</span>
                  <span className="text-emerald-600 font-medium">Included</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm font-bold text-foreground pt-1">
                <span>Total Due</span>
                <span className="text-primary text-base">
                  {formatRupees(grandTotal)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
