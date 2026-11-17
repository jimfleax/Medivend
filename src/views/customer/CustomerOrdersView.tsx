import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  PackageCheck,
  Store,
  KeyRound,
  QrCode,
  Copy,
  Clock,
  MapPin,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMedivendStore } from '@/store';
import { formatRupees } from '@/data/formatters';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const CustomerOrdersView: React.FC = () => {
  const navigate = useNavigate();
  const { machineOrders, shopOrders, medicines, shops, vendingMachines } = useMedivendStore();
  const [activeTab, setActiveTab] = useState<string>('kiosk');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const completedKioskOrders = machineOrders;
  const activePickupOrders = shopOrders;

  return (
    <div className="h-full flex flex-col bg-slate-50/50 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-border shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              My Orders & Pickup Receipts
            </h1>
            <p className="text-xs text-muted-foreground">
              Track kiosk dispense PINs, automated vending receipts, and counter pickup tickets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/customer')}
            className="text-xs font-semibold h-9 gap-1.5"
          >
            Vending Catalog
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/customer/shops')}
            className="text-xs font-semibold h-9 bg-primary text-white hover:bg-primary/90 gap-1.5"
          >
            <Store className="h-3.5 w-3.5" />
            Partner Pharmacies
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border border-border p-1 h-11 rounded-xl grid grid-cols-2 max-w-md shadow-2xs">
          <TabsTrigger
            value="kiosk"
            className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all"
          >
            Campus Kiosk Receipts ({completedKioskOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="pharmacy"
            className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all"
          >
            Pharmacy Pickup Tickets ({activePickupOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: CAMPUS KIOSK RECEIPTS                              */}
        {/* ========================================================= */}
        <TabsContent value="kiosk" className="space-y-4">
          {completedKioskOrders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border-2 border-dashed border-border bg-white text-muted-foreground space-y-3">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <h3 className="font-bold text-foreground text-sm">No Kiosk Orders Found</h3>
              <p className="text-xs max-w-sm mx-auto">
                Orders placed at any of the 3 IIM Sambalpur Health Centre dispensers will generate credentials and appear here.
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/customer')}
                className="text-xs font-semibold bg-primary text-white hover:bg-primary/90"
              >
                Browse Vending Catalog
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedKioskOrders.map((order) => {
                const assignedMachine =
                  vendingMachines.find((vm) => vm.id === order.machineId) || vendingMachines[0];
                const pin = order.dispensePin || '7492';
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <Card
                    key={order.id}
                    className="border-border bg-white rounded-2xl shadow-2xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                  >
                    <CardHeader className="p-4 pb-3 border-b border-border/80 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {order.id}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                order.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold'
                              }
                            >
                              {order.status === 'completed' ? 'DISPENSED' : 'PROCESSING'}
                            </Badge>
                          </div>
                          <p className="text-xs font-bold text-foreground mt-1">
                            {order.machineName || assignedMachine?.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-primary" />
                            {assignedMachine?.location || 'IIM Sambalpur Health Centre'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold text-primary">
                            {formatRupees(order.totalAmount)}
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            {order.paymentMethod}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                      {/* Kiosk Authentication Credentials (PIN & QR) */}
                      <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 grid grid-cols-2 gap-2 items-center">
                        <div className="bg-white p-2.5 rounded-lg border border-primary/15 text-center shadow-2xs">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                            <KeyRound className="h-3 w-3 text-primary" /> Dispense PIN
                          </span>
                          <span className="text-xl font-mono font-extrabold text-primary tracking-widest block pt-0.5">
                            {pin}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(pin, 'Dispense PIN')}
                            className="text-[9px] text-muted-foreground hover:text-primary flex items-center justify-center gap-0.5 mx-auto mt-0.5"
                          >
                            <Copy className="h-2.5 w-2.5" /> Copy
                          </button>
                        </div>

                        <div className="bg-white p-2 rounded-lg border border-primary/15 flex flex-col items-center justify-center text-center shadow-2xs">
                          <div className="h-10 w-10 bg-slate-900 rounded p-1 flex items-center justify-center text-white">
                            <QrCode className="h-8 w-8 text-white stroke-[1.75]" />
                          </div>
                          <span className="text-[8px] text-muted-foreground font-mono mt-0.5">
                            Kiosk Barcode
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 border-t border-border/60 pt-2.5">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <PackageCheck className="h-3.5 w-3.5 text-primary" />
                          Items ({totalItems}):
                        </span>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div
                              key={item.medicineId}
                              className="flex items-center justify-between text-xs py-0.5"
                            >
                              <span className="text-foreground font-medium truncate max-w-[200px]">
                                {item.name}
                              </span>
                              <span className="font-mono text-muted-foreground text-[11px]">
                                ×{item.quantity} ({formatRupees(item.price * item.quantity)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Info & Actions */}
                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/customer/dispense/${order.id}`)}
                          className="h-7 px-2 text-xs font-semibold text-primary hover:bg-primary/10 gap-1"
                        >
                          Dispense Screen
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: PHARMACY PICKUP TICKETS                            */}
        {/* ========================================================= */}
        <TabsContent value="pharmacy" className="space-y-4">
          {activePickupOrders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border-2 border-dashed border-border bg-white text-muted-foreground space-y-3">
              <Store className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <h3 className="font-bold text-foreground text-sm">No Pharmacy Pickup Tickets</h3>
              <p className="text-xs max-w-sm mx-auto">
                Prescriptions verified by pharmacists or items reserved at local Burla pharmacies will appear here with pickup status.
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/customer/shops')}
                className="text-xs font-semibold bg-primary text-white hover:bg-primary/90"
              >
                Inquire at Partner Pharmacies
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePickupOrders.map((order) => {
                const shop = shops.find((s) => s.id === order.shopId);
                const med = medicines.find((m) => m.id === order.medicineId);

                return (
                  <Card
                    key={order.id}
                    className="border-border bg-white rounded-2xl shadow-2xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                  >
                    <CardHeader className="p-4 pb-3 border-b border-border/80 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {order.id}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                order.status === 'Ready for pickup'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold'
                                  : order.status === 'Requested'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold'
                                  : 'bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold'
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-bold text-foreground mt-1">
                            {shop?.name || `Shop #${order.shopId}`}
                          </h3>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-primary" />
                            {shop?.area} · {shop?.distanceKm} km away
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold text-primary">
                            {med ? formatRupees(med.price * order.qty) : 'N/A'}
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            Counter Pickup
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                      <div className="p-3 bg-secondary/40 border border-border rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Reserved Medication
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {med ? med.name : `Medicine #${order.medicineId}`}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            Quantity: {order.qty} unit · {med?.category}
                          </span>
                        </div>

                        {order.prescriptionId && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold">
                            Rx Verified
                          </Badge>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Requested {new Date(order.createdAt).toLocaleDateString()}
                        </span>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/customer/shops?shop=${order.shopId}&chat=open`)
                          }
                          className="h-7 px-2 text-xs font-semibold text-primary hover:bg-primary/10 gap-1"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Pharmacy Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
