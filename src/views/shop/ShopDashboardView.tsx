import React, { useState, useRef } from 'react';
import {
  Store,
  Clock,
  MessageSquare,
  Package,
  Layers,
  Send,
  CheckCircle2,
  Paperclip,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMedivendStore } from '@/store';
import { formatRupees } from '@/data/formatters';
import { PrescriptionAttachment } from '@/data/types';
import {
  validatePrescriptionFile,
  compressAndReadPrescription,
  formatFileSize,
} from '@/lib/prescription';
import { PrescriptionAttachmentView } from '@/components/chat/PrescriptionAttachmentView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const QUICK_REPLIES = [
  'Yes, it is in stock',
  'Ready in 10 minutes',
  'Sorry, out of stock',
  'We are closing soon',
];

export const ShopDashboardView: React.FC = () => {
  const {
    shops,
    medicines,
    shopConversations,
    shopOrders,
    sendMessage,
    verifyPrescriptionAndCreateOrder,
    updateShopOrderStatus,
    toggleShopOpen,
    toggleShopMedicineStock,
  } = useMedivendStore();

  const [selectedShopId, setSelectedShopId] = useState<string>('S1');
  const [activeTab, setActiveTab] = useState<string>('chats');
  const [inputText, setInputText] = useState<string>('');
  const [pendingPrescription, setPendingPrescription] = useState<PrescriptionAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentShop = shops.find((s) => s.id === selectedShopId) || shops[0];

  // Conversations for this shop
  const shopConvs = shopConversations.filter((c) => c.shopId === currentShop?.id);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // Default to first conversation if none selected
  const activeConv =
    shopConvs.find((c) => c.id === selectedConvId) || shopConvs[0] || null;

  // Active medicine for conversation if any
  const convMedicine = activeConv?.medicineId
    ? medicines.find((m) => m.id === activeConv.medicineId)
    : null;

  // Orders for this shop
  const currentShopOrders = shopOrders.filter((o) => o.shopId === currentShop?.id);

  const handleShopFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validatePrescriptionFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid prescription file');
      return;
    }

    setIsUploading(true);
    try {
      const rx = await compressAndReadPrescription(file);
      setPendingPrescription(rx);
      toast.success(`Prescription document attached (${formatFileSize(file.size)})`, {
        description: 'Send it to the customer via the chat.',
      });
    } catch (err) {
      console.error('Failed to process prescription image:', err);
      toast.error('Could not process this image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if ((!text.trim() && !pendingPrescription) || !currentShop) return;

    sendMessage(currentShop.id, 'shop', text, pendingPrescription || undefined);
    if (textToSend === undefined) {
      setInputText('');
    }
    setPendingPrescription(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePharmacistApprove = (prescription: PrescriptionAttachment) => {
    // Look up target medicine from conversation or default to Azithromycin (ID 9)
    const medId = activeConv?.medicineId || 9;
    const med = medicines.find((m) => m.id === medId);
    const created = verifyPrescriptionAndCreateOrder(currentShop.id, medId, 1, prescription.id);
    toast.success(`Prescription approved! Pickup Ticket ${created.id} created for ${med?.name || 'medication'}.`);
  };

  const handleRequestClearerPhoto = () => {
    handleSend(
      'Pharmacist Note: The uploaded prescription photo is slightly illegible. Please upload a clear photo displaying the doctor signature, clinic header, and Rx dosage.'
    );
  };

  if (!currentShop) return null;

  return (
    <div className="space-y-6">
      {/* 1. Top Bar: Viewing As Shop Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">
              Shop Management Portal
            </h1>
            <p className="text-xs text-muted-foreground">
              Live inventory toggle, counter pickup queues, and customer messaging
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Viewing as shop:
          </span>
          <Select
            value={selectedShopId}
            onValueChange={(val) => {
              setSelectedShopId(val);
              setSelectedConvId(null);
            }}
          >
            <SelectTrigger className="w-[220px] h-9 text-xs font-semibold bg-white border-border">
              <SelectValue placeholder="Select pharmacy" />
            </SelectTrigger>
            <SelectContent>
              {shops.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.id}: {s.name} ({s.area})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Header Area: Shop Name, Hours, and "Shop is open" Switch */}
      <Card className="border-border bg-white shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-primary bg-accent px-2 py-0.5 rounded">
                {currentShop.id}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {currentShop.name}
              </h2>
              {currentShop.isOpen ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold"
                >
                  Online & Open
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium"
                >
                  Offline & Closed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{currentShop.area}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {currentShop.hours}
              </span>
            </div>
          </div>

          {/* Switch "Shop is open" bound to isOpen */}
          <div className="flex items-center gap-3 bg-secondary/60 border border-border p-3 rounded-xl sm:self-center">
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">
                Shop is open
              </span>
              <span className="text-[11px] text-muted-foreground">
                {currentShop.isOpen ? 'Accepting inquiries' : 'Marked closed'}
              </span>
            </div>
            <Switch
              checked={currentShop.isOpen}
              onCheckedChange={(checked) => toggleShopOpen(currentShop.id, checked)}
              aria-label="Toggle shop open status"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Below: shadcn Tabs: "Chats", "Inventory", "Orders" */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary p-1 h-10 rounded-lg grid grid-cols-3 max-w-md">
          <TabsTrigger
            value="chats"
            className="text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-primary"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chats
            {shopConvs.some(
              (c) =>
                c.messages.length > 0 &&
                c.messages[c.messages.length - 1].sender === 'customer'
            ) && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-primary"
          >
            <Layers className="h-3.5 w-3.5" />
            Inventory ({currentShop.stocks?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-primary"
          >
            <Package className="h-3.5 w-3.5" />
            Orders ({currentShopOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CHATS TAB (Two-pane layout on desktop, stacked on mobile) */}
        <TabsContent value="chats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[600px] border border-border rounded-xl bg-white shadow-xs overflow-hidden">
            {/* Left Pane: Conversation List (4 cols) */}
            <div className="md:col-span-4 border-r border-border flex flex-col h-full bg-slate-50/40">
              <div className="p-3.5 border-b border-border bg-white flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Active Conversations
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {shopConvs.length}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {shopConvs.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">
                    No customer conversations for {currentShop.name} yet.
                  </div>
                ) : (
                  shopConvs.map((conv) => {
                    const isSelected = activeConv?.id === conv.id;
                    const lastMsg =
                      conv.messages.length > 0
                        ? conv.messages[conv.messages.length - 1]
                        : null;
                    const isUnread = lastMsg?.sender === 'customer';

                    const med = conv.medicineId
                      ? medicines.find((m) => m.id === conv.medicineId)
                      : null;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all border ${
                          isSelected
                            ? 'bg-white border-primary/40 shadow-xs ring-1 ring-primary/20'
                            : 'bg-white/80 border-border/60 hover:bg-white hover:border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            {/* Unread dot */}
                            {isUnread && (
                              <span
                                className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse"
                                title="New message from customer"
                              />
                            )}
                            <span className="font-bold text-xs text-foreground truncate">
                              Customer Inquiry
                            </span>
                          </div>
                          {lastMsg && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {lastMsg.timestamp}
                            </span>
                          )}
                        </div>

                        {med && (
                          <div className="text-[11px] text-primary font-semibold truncate mb-1">
                            Ref: {med.name}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground truncate line-clamp-1">
                          {lastMsg ? (
                            <span>
                              {lastMsg.sender === 'shop' ? 'You: ' : 'Customer: '}
                              {lastMsg.text}
                            </span>
                          ) : (
                            <span className="italic">No messages</span>
                          )}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Chat Window (8 cols) */}
            <div className="md:col-span-8 flex flex-col h-full bg-white">
              {activeConv ? (
                <>
                  {/* Chat Pane Header */}
                  <div className="p-3.5 border-b border-border bg-white flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        Customer Conversation
                      </h3>
                      {convMedicine && (
                        <p className="text-[11px] text-muted-foreground">
                          Item discussed:{' '}
                          <span className="font-semibold text-foreground">
                            {convMedicine.name}
                          </span>{' '}
                          ({formatRupees(convMedicine.price)})
                        </p>
                      )}
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {activeConv.messages.length} messages
                    </Badge>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                    {activeConv.messages.map((msg) => {
                      if (msg.sender === 'system') {
                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <div className="bg-secondary/90 border border-border text-foreground px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span>{msg.text}</span>
                              <span className="text-[9px] text-muted-foreground">
                                · {msg.timestamp}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      const isShop = msg.sender === 'shop';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isShop ? 'items-end' : 'items-start'
                          }`}
                        >
                          <span className="text-[10px] text-muted-foreground font-medium mb-1 px-1">
                            {isShop ? `${currentShop.name} (You)` : 'Customer'}
                          </span>
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                              msg.prescription ? 'min-w-[240px] sm:min-w-[280px]' : ''
                            } ${
                              isShop
                                ? 'bg-primary text-primary-foreground rounded-tr-xs'
                                : 'bg-white border border-border text-foreground rounded-tl-xs'
                            }`}
                          >
                            {msg.text && <p className="break-words">{msg.text}</p>}
                            {msg.prescription && (
                              <>
                                <PrescriptionAttachmentView
                                  prescription={msg.prescription}
                                  isSender={isShop}
                                />
                                {!isShop && (
                                  <div className="mt-2.5 pt-2 border-t border-border/80 flex flex-wrap items-center gap-1.5">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => handlePharmacistApprove(msg.prescription!)}
                                      className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Approve & Create Pickup Order
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={handleRequestClearerPhoto}
                                      className="h-7 px-2 text-[11px] font-medium border-border text-muted-foreground hover:text-foreground"
                                    >
                                      Request Clearer Photo
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                            <div
                              className={`text-[9px] mt-1 text-right ${
                                isShop
                                  ? 'text-primary-foreground/75'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {msg.timestamp}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick-reply chips */}
                  <div className="p-2.5 px-3 border-t border-border/80 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap mr-1">
                      Quick reply:
                    </span>
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => handleSend(reply)}
                        className="text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-accent text-foreground hover:text-primary transition-colors border border-border/60 whitespace-nowrap font-medium"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>

                  {/* Pending Prescription Attachment Bar (Shop side) */}
                  {pendingPrescription && (
                    <div className="px-3.5 py-2 bg-accent/60 border-t border-border flex items-center justify-between gap-3 animate-in fade-in-50 duration-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-background border border-border/80 shrink-0">
                          <img
                            src={pendingPrescription.dataUrl}
                            alt="Prescription preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">
                              Document Attached
                            </span>
                            <span className="text-xs font-semibold text-foreground truncate max-w-[180px] sm:max-w-xs">
                              {pendingPrescription.fileName}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {formatFileSize(pendingPrescription.fileSize)}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingPrescription(null)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        title="Remove attachment"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Shop Input plus Send */}
                  <div className="p-3 border-t border-border bg-white flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleShopFileSelect}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={`h-10 text-xs font-semibold gap-1.5 shrink-0 transition-all ${
                        pendingPrescription
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-border text-foreground hover:bg-secondary'
                      }`}
                      title="Add prescription or document photo (Max 5MB)"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Paperclip className="h-4 w-4 text-primary" />
                      )}
                      <span className="hidden sm:inline">Add Rx</span>
                    </Button>

                    <Input
                      type="text"
                      placeholder={
                        pendingPrescription
                          ? 'Add a message with this attachment...'
                          : `Reply as ${currentShop.name}...`
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 h-10 text-xs bg-white border-border focus-visible:ring-primary"
                    />

                    <Button
                      onClick={() => handleSend()}
                      disabled={(!inputText.trim() && !pendingPrescription) || isUploading}
                      size="icon"
                      className="h-10 w-10 shrink-0 font-semibold"
                      aria-label="Send reply"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-semibold text-foreground">
                    No conversation selected
                  </p>
                  <p className="text-xs">
                    Choose a conversation from the left to view customer inquiries.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: INVENTORY TAB (Table of ALL medicines with a Switch "In stock at this shop") */}
        <TabsContent value="inventory" className="space-y-4">
          <Card className="border-border bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Shop Medicine Stock Control
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Toggle items stocked at {currentShop.name}. Updates customer search and "Available here" badges instantly.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  {currentShop.stocks.length} of {medicines.length} in stock
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-y border-border bg-secondary/50 text-muted-foreground">
                      <th className="py-3 px-5 font-semibold">Medicine</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Standard Price</th>
                      <th className="py-3 px-4 font-semibold">Classification</th>
                      <th className="py-3 px-5 font-semibold text-right">
                        In stock at this shop
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {medicines.map((med) => {
                      const isStocked = currentShop.stocks.includes(med.id);

                      return (
                        <tr
                          key={med.id}
                          className="hover:bg-secondary/20 transition-colors"
                        >
                          <td className="py-3.5 px-5">
                            <span className="font-bold text-foreground">
                              {med.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {med.category}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-primary">
                            {formatRupees(med.price)}
                          </td>
                          <td className="py-3.5 px-4">
                            {med.otc ? (
                              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Over-the-counter
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Prescription Required
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <span
                                className={`text-[11px] font-semibold ${
                                  isStocked
                                    ? 'text-emerald-700'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {isStocked ? 'In Stock' : 'Not Stocked'}
                              </span>
                              <Switch
                                checked={isStocked}
                                onCheckedChange={(checked) =>
                                  toggleShopMedicineStock(
                                    currentShop.id,
                                    med.id,
                                    checked
                                  )
                                }
                                aria-label={`Toggle stock for ${med.name}`}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ORDERS TAB (List of requested orders with status progression buttons) */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="border-border bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Counter Pickup Queue
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Orders requested by customers through chat for physical counter collection
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  {currentShopOrders.length} total orders
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-0">
              {currentShopOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="font-semibold text-foreground text-sm">
                    No pickup requests for {currentShop.name}
                  </p>
                  <p className="text-xs max-w-sm mx-auto">
                    When customers tap "Request this medicine" in chat, orders will appear here for preparation.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentShopOrders.map((order) => {
                    const med = medicines.find((m) => m.id === order.medicineId);

                    return (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60 hover:bg-secondary/20 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-primary bg-accent px-2 py-0.5 rounded">
                              {order.id}
                            </span>
                            <span className="font-bold text-sm text-foreground">
                              {med ? med.name : `Medicine #${order.medicineId}`}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                order.status === 'Requested'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : order.status === 'Ready for pickup'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {order.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Quantity: {order.qty}</span>
                            <span>·</span>
                            <span>
                              Price: {med ? formatRupees(med.price) : 'N/A'}
                            </span>
                            <span>·</span>
                            <span>
                              Placed:{' '}
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Status Progression Buttons */}
                        <div className="flex items-center gap-2">
                          {order.status === 'Requested' && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateShopOrderStatus(
                                  order.id,
                                  'Ready for pickup'
                                )
                              }
                              className="text-xs font-semibold h-9 gap-1.5 shadow-xs"
                            >
                              <Package className="h-3.5 w-3.5" />
                              Mark ready
                            </Button>
                          )}

                          {order.status === 'Ready for pickup' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateShopOrderStatus(order.id, 'Picked up')
                              }
                              className="text-xs font-semibold h-9 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Mark picked up
                            </Button>
                          )}

                          {order.status === 'Picked up' && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
