import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Check,
  X,
  MessageSquare,
  Search,
  Send,
  Paperclip,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Phone,
  Package,
  Pill,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useMedivendStore } from '@/store';
import { Shop, PrescriptionAttachment } from '@/data/types';
import { formatRupees } from '@/data/formatters';
import {
  validatePrescriptionFile,
  compressAndReadPrescription,
  formatFileSize,
} from '@/lib/prescription';
import { PrescriptionAttachmentView } from '@/components/chat/PrescriptionAttachmentView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PharmacyShopGraphic } from '@/components/motion/PharmacyShopGraphic';
import { PrescriptionModal } from '@/components/prescription/PrescriptionModal';
import { cn } from '@/lib/utils';

const INSTANT_SUGGESTIONS = [
  'Is this in stock?',
  'Can I reserve for pickup?',
  'I have a prescription.',
  'What are your hours today?',
];

export const CustomerShopsView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const medicineIdParam = searchParams.get('medicine');
  const shopIdParam = searchParams.get('shop');
  const chatOpenParam = searchParams.get('chat');
  const uploadRxParam = searchParams.get('uploadRx');

  const {
    shops,
    medicines,
    shopConversations,
    shopOrders,
    getOrCreateConversation,
    sendMessage,
    createShopOrder,
  } = useMedivendStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string>(
    shopIdParam || shops[0]?.id || 'S1'
  );
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(
    chatOpenParam === 'open' || true
  );
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [pendingRx, setPendingRx] = useState<PrescriptionAttachment | null>(null);
  const [isUploadingRx, setIsUploadingRx] = useState(false);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shopIdParam) {
      setSelectedShopId(shopIdParam);
    }
    if (chatOpenParam === 'open' || uploadRxParam === 'true') {
      setIsChatExpanded(true);
    }
    if (uploadRxParam === 'true') {
      setPrescriptionModalOpen(true);
    }
  }, [shopIdParam, chatOpenParam, uploadRxParam]);

  const targetMedicine = medicineIdParam
    ? medicines.find((m) => m.id === Number(medicineIdParam))
    : null;

  const currentShop: Shop =
    shops.find((s) => s.id === selectedShopId) || shops[0];

  useEffect(() => {
    if (selectedShopId) {
      getOrCreateConversation(selectedShopId, targetMedicine?.id);
    }
  }, [selectedShopId, targetMedicine?.id, getOrCreateConversation]);

  const conversation = shopConversations.find((c) => c.shopId === selectedShopId);

  const activeMedicineId = targetMedicine?.id || conversation?.medicineId;
  const activeMedicine = activeMedicineId
    ? medicines.find((m) => m.id === activeMedicineId)
    : null;

  const matchingOrder = activeMedicine
    ? shopOrders.find(
        (o) => o.shopId === selectedShopId && o.medicineId === activeMedicine.id
      )
    : null;

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversation?.messages, isChatExpanded, isChatMaximized, pendingRx]);

  const sortedShops = useMemo(() => {
    const list = shops.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        q === '' ||
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (targetMedicine) {
        const aAvail = a.stocks.includes(targetMedicine.id);
        const bAvail = b.stocks.includes(targetMedicine.id);

        const getTier = (isOpen: boolean, isAvail: boolean) => {
          if (isOpen && isAvail) return 3;
          if (!isOpen && isAvail) return 2;
          if (isOpen && !isAvail) return 1;
          return 0;
        };

        const tierA = getTier(a.isOpen, aAvail);
        const tierB = getTier(b.isOpen, bAvail);

        if (tierA !== tierB) return tierB - tierA;
      } else {
        if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
      }
      return a.distanceKm - b.distanceKm;
    });
  }, [shops, searchQuery, targetMedicine]);

  // Other shops excluding the active one
  const otherShops = useMemo(() => {
    return sortedShops.filter((s) => s.id !== selectedShopId);
  }, [sortedShops, selectedShopId]);

  const shopStockedMedicines = useMemo(() => {
    return medicines.filter((m) => currentShop.stocks.includes(m.id));
  }, [medicines, currentShop]);

  const handleSendChat = (textToSend?: string) => {
    const message = textToSend !== undefined ? textToSend : chatInput;
    if (!message.trim() && !pendingRx) return;

    sendMessage(selectedShopId, 'customer', message.trim(), pendingRx || undefined);
    setChatInput('');
    setPendingRx(null);
  };

  const handleRxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validatePrescriptionFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setIsUploadingRx(true);
    try {
      const rx = await compressAndReadPrescription(file);
      setPendingRx(rx);
      toast.success(`Prescription attached (${formatFileSize(file.size)})`);
    } catch (err) {
      console.error(err);
      toast.error('Could not process photo');
    } finally {
      setIsUploadingRx(false);
    }
  };

  const handleOrderMedicine = () => {
    if (!activeMedicine || !selectedShopId) return;
    createShopOrder(selectedShopId, activeMedicine.id);
    toast.success(`Order requested at ${currentShop.name}`);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden bg-white">
      {/* ========================================================= */}
      {/* PANEL 1 (LEFT): Search & Active Inquiry                   */}
      {/* ========================================================= */}
      <div className="w-full lg:w-64 p-5 flex flex-col justify-between bg-slate-50/60 shrink-0 overflow-y-auto">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter pharmacies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white border-border text-xs rounded-xl focus:border-primary focus-visible:ring-0 outline-none shadow-2xs"
            />
          </div>

          {targetMedicine && (
            <div className="p-3 rounded-xl bg-accent/60 border border-primary/20 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-primary">
                <span>Looking for:</span>
                <span>{formatRupees(targetMedicine.price)}</span>
              </div>
              <p className="text-xs font-semibold text-foreground">{targetMedicine.name}</p>
              <button
                type="button"
                onClick={() => navigate('/customer/shops')}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Clear filter
              </button>
            </div>
          )}

          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-foreground px-1">Quick Links</span>
            {shops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => {
                  setSelectedShopId(shop.id);
                  setIsChatExpanded(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-foreground/80 hover:bg-white hover:text-foreground transition-all flex items-center justify-between"
              >
                <span className="truncate">{shop.name} Chat</span>
                <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL 2 (MIDDLE): Search Header, Shop Details & Chat Dock */}
      {/* ========================================================= */}
      <div className="flex-1 min-w-0 p-5 flex flex-col h-full overflow-hidden bg-slate-50/20 space-y-4">
        {/* Header Search Bar with "Upload Prescription" Button */}
        <div className="relative w-full shrink-0">
          <div className="relative flex items-center bg-white rounded-2xl border-2 border-border shadow-xs focus-within:border-primary transition-colors p-1.5 sm:p-2">
            <div className="pl-3 text-muted-foreground">
              <Search className="h-5 w-5 text-primary" />
            </div>

            <Input
              type="text"
              placeholder="Search pharmacy inventory..."
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

        {/* Shop Details Header Card */}
        <div className="p-4 rounded-2xl bg-white border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                {currentShop.name}
              </h1>
              {currentShop.isOpen ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                  Open
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium">
                  Closed
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary/70" />
                {currentShop.area} · {currentShop.distanceKm} km away
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {currentShop.hours}
              </span>
              {currentShop.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {currentShop.phone}
                </span>
              )}
            </div>
          </div>

          {targetMedicine && (
            <div className="flex items-center gap-2">
              {matchingOrder ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
                  Status: {matchingOrder.status}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={handleOrderMedicine}
                  className="text-xs font-semibold bg-primary text-white hover:bg-primary/90 gap-1.5 shadow-xs"
                >
                  <Package className="h-3.5 w-3.5" />
                  Hold {targetMedicine.name}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Stock List + Chat Dock */}
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-4">
          {/* Stocked Items */}
          {!isChatMaximized && (
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="text-xs font-bold text-muted-foreground mb-2">
                Stocked Medicines ({shopStockedMedicines.length})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shopStockedMedicines.slice(0, 10).map((med) => (
                  <div
                    key={med.id}
                    onClick={() => {
                      navigate(`/customer/shops?shop=${selectedShopId}&medicine=${med.id}`);
                      toast.info(`Selected ${med.name} for inquiry`);
                    }}
                    className="p-3 rounded-xl border border-border bg-white hover:border-primary/40 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-md bg-secondary text-primary flex items-center justify-center shrink-0">
                        <Pill className="h-3 w-3" />
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate">{med.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-primary">{formatRupees(med.price)}</span>
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary font-medium">
                        Inquire →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Dock */}
          <div
            className={cn(
              'rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col transition-all',
              isChatMaximized ? 'flex-1 min-h-0' : 'shrink-0'
            )}
          >
            <div
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              className="p-3 px-4 bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer flex items-center justify-between border-b border-border select-none"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Chat with {currentShop.name}
                </span>
                {conversation && conversation.messages.length > 0 && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                    {conversation.messages.length} msgs
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                {isChatExpanded && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsChatMaximized(!isChatMaximized);
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    title={isChatMaximized ? 'Restore chat size' : 'Expand chat to full height'}
                  >
                    {isChatMaximized ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground"
                >
                  {isChatExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Instant Suggestions */}
            <div className="p-2 px-3 bg-white border-b border-border/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {INSTANT_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChat(suggestion)}
                  className="px-2.5 py-1 rounded-full bg-secondary hover:bg-primary hover:text-white text-[11px] font-medium text-foreground transition-all shrink-0"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Chat Body */}
            {isChatExpanded && (
              <div
                className={cn(
                  'flex flex-col bg-slate-50/40',
                  isChatMaximized ? 'flex-1 min-h-0' : 'h-80 sm:h-[340px]'
                )}
              >
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {(!conversation || conversation.messages.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-xs space-y-1">
                      <p className="font-semibold text-foreground">No messages yet</p>
                      <p className="text-[11px]">Send an inquiry or upload a prescription above.</p>
                    </div>
                  )}

                  {conversation?.messages.map((msg) => {
                    const isCustomer = msg.sender === 'customer';
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex flex-col', isCustomer ? 'items-end' : 'items-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-2xs leading-relaxed',
                            msg.prescription ? 'min-w-[240px] sm:min-w-[280px]' : '',
                            isCustomer
                              ? 'bg-primary text-white rounded-tr-xs'
                              : 'bg-white border border-border text-foreground rounded-tl-xs'
                          )}
                        >
                          {msg.text && <p className="break-words">{msg.text}</p>}
                          {msg.prescription && (
                            <PrescriptionAttachmentView
                              prescription={msg.prescription}
                              isSender={isCustomer}
                            />
                          )}
                          <div
                            className={cn(
                              'text-[9px] mt-1 text-right',
                              isCustomer ? 'text-white/70' : 'text-muted-foreground'
                            )}
                          >
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {pendingRx && (
                  <div className="p-2 px-3 bg-primary/5 border-t border-border/80 flex items-center justify-between gap-3 text-xs animate-in fade-in-50 duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-lg overflow-hidden border border-border bg-white shrink-0 shadow-2xs">
                        <img
                          src={pendingRx.dataUrl}
                          alt="Prescription preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                            Rx Ready
                          </span>
                          <span className="font-semibold text-foreground truncate max-w-[180px]">
                            {pendingRx.fileName}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatFileSize(pendingRx.fileSize)} · Click send or add a note
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingRx(null)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-white transition-colors"
                      title="Remove prescription"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="p-2.5 bg-white border-t border-border flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleRxUpload}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingRx}
                    className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                  >
                    {isUploadingRx ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>

                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    className="h-8 text-xs bg-slate-50/70 border-border"
                  />

                  <Button
                    type="button"
                    size="sm"
                    disabled={!chatInput.trim() && !pendingRx}
                    onClick={() => handleSendChat()}
                    className="h-8 px-3 text-xs font-semibold bg-primary text-white hover:bg-primary/90 shrink-0"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL 3 (RIGHT): Selected Shop Hero & Other Nearby Shops  */}
      {/* ========================================================= */}
      <div className="w-full lg:w-80 p-5 flex flex-col justify-between bg-white shrink-0 overflow-y-auto space-y-6">
        <div className="space-y-5">
          {/* Top Hero: Current Selected Pharmacy */}
          <div className="p-5 rounded-3xl border-2 border-primary/30 bg-primary/5 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
            <div className="w-full flex justify-center py-2">
              <PharmacyShopGraphic className="w-24 h-24 text-primary" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold',
                    currentShop.isOpen
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  )}
                >
                  {currentShop.isOpen ? 'Open Now' : 'Closed'}
                </Badge>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Selected Pharmacy
                </span>
              </div>
              <h2 className="text-base font-extrabold text-foreground">
                {currentShop.name}
              </h2>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{currentShop.area} · {currentShop.distanceKm} km</span>
              </div>
            </div>
          </div>

          {/* Below: Other Nearby Shops to Choose From */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              Other Nearby Shops ({otherShops.length})
            </div>

            <div className="space-y-2.5">
              <AnimatePresence>
                {otherShops.map((shop) => {
                  const hasTargetMed = targetMedicine
                    ? shop.stocks.includes(targetMedicine.id)
                    : undefined;

                  return (
                    <motion.div
                      key={shop.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        setSelectedShopId(shop.id);
                        toast.info(`Switched to ${shop.name}`);
                      }}
                      className="p-3.5 rounded-2xl border border-border bg-white hover:border-primary/50 hover:bg-slate-50/70 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                          {shop.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                          Switch →
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                        <span>{shop.area} · {shop.distanceKm} km</span>
                      </div>

                      {targetMedicine && (
                        <div className="mt-2">
                          {hasTargetMed ? (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Check className="h-3 w-3" /> Has item
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <X className="h-3 w-3" /> Out of stock
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        open={prescriptionModalOpen}
        onOpenChange={setPrescriptionModalOpen}
        initialShopId={selectedShopId}
        initialMedicineId={targetMedicine?.id}
      />
    </div>
  );
};
