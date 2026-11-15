import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Pill,
  Store,
  Clock,
  CheckCircle2,
  Package,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const CustomerChatView: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const medicineIdParam = searchParams.get('medicine');

  const {
    shops,
    medicines,
    shopConversations,
    shopOrders,
    getOrCreateConversation,
    sendMessage,
    createShopOrder,
  } = useMedivendStore();

  const [inputText, setInputText] = useState('');
  const [pendingPrescription, setPendingPrescription] = useState<PrescriptionAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const shop = shops.find((s) => s.id === shopId);
  const targetMedicineId = medicineIdParam ? Number(medicineIdParam) : undefined;

  // Auto-create or retrieve conversation
  useEffect(() => {
    if (shopId) {
      getOrCreateConversation(shopId, targetMedicineId);
    }
  }, [shopId, targetMedicineId, getOrCreateConversation]);

  const conversation = shopConversations.find((c) => c.shopId === shopId);

  // Active medicine for this conversation (either from query param or conversation record)
  const activeMedicineId = targetMedicineId || conversation?.medicineId;
  const activeMedicine = activeMedicineId
    ? medicines.find((m) => m.id === activeMedicineId)
    : null;

  // Find most recent order for this shop & medicine
  const matchingOrder = activeMedicine
    ? shopOrders.find(
        (o) => o.shopId === shopId && o.medicineId === activeMedicine.id
      )
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, matchingOrder]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      toast.success(`Prescription attached (${formatFileSize(file.size)})`, {
        description: 'Press send to deliver it to the pharmacist.',
      });
    } catch (err) {
      console.error('Failed to process prescription image:', err);
      toast.error('Could not process this image. Please select a valid photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = () => {
    if ((!inputText.trim() && !pendingPrescription) || !shopId) return;

    sendMessage(shopId, 'customer', inputText, pendingPrescription || undefined);
    setInputText('');
    setPendingPrescription(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRequestMedicine = () => {
    if (!shopId || !activeMedicine) return;
    createShopOrder(shopId, activeMedicine.id);
  };

  if (!shop) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <Store className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Pharmacy Not Found</h2>
        <Button asChild>
          <Link to="/customer/shops">Back to Shops</Link>
        </Button>
      </div>
    );
  }

  const renderOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'Requested':
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 font-semibold gap-1"
          >
            <Clock className="h-3 w-3" />
            Requested
          </Badge>
        );
      case 'Ready for pickup':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold gap-1"
          >
            <Package className="h-3 w-3" />
            Ready for pickup
          </Badge>
        );
      case 'Picked up':
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200 font-semibold gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Picked up
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-10rem)] min-h-[520px] bg-white border border-border rounded-xl shadow-xs overflow-hidden">
      {/* 1. Header with shop name, Open/Closed badge and a back arrow */}
      <div className="p-4 border-b border-border bg-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-foreground leading-none">
                {shop.name}
              </h2>
              {shop.isOpen ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0 font-semibold"
                >
                  Open
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] px-2 py-0 font-medium"
                >
                  Closed
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {shop.area} · {shop.hours}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Link to="/customer/chats">All Chats</Link>
        </Button>
      </div>

      {/* 2. Medicine Card (when opened from shop list with a medicine) */}
      {activeMedicine && (
        <div className="p-3.5 bg-secondary/60 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-accent text-primary flex items-center justify-center shrink-0">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <span>Inquiring about: {activeMedicine.name}</span>
              </div>
              <p className="text-xs text-primary font-bold">
                {formatRupees(activeMedicine.price)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {matchingOrder ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {matchingOrder.id}:
                </span>
                {renderOrderStatusBadge(matchingOrder.status)}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleRequestMedicine}
                className="text-xs font-semibold h-8 gap-1.5 shadow-xs"
              >
                <Package className="h-3.5 w-3.5" />
                Request this medicine
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. Scrollable Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
        {(!conversation || conversation.messages.length === 0) && (
          <div className="text-center py-12 text-muted-foreground space-y-1">
            <p className="text-xs font-medium">No messages yet with {shop.name}.</p>
            <p className="text-[11px]">
              Ask about stock availability, counter hold, or specific pickup instructions.
            </p>
          </div>
        )}

        {conversation?.messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="bg-secondary/90 border border-border text-foreground px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{msg.text}</span>
                  <span className="text-[9px] text-muted-foreground font-normal">
                    · {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          const isCustomer = msg.sender === 'customer';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isCustomer ? 'items-end' : 'items-start'
              }`}
            >
              <span className="text-[10px] text-muted-foreground font-medium mb-1 px-1">
                {isCustomer ? 'You' : shop.name}
              </span>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                  isCustomer
                    ? 'bg-primary text-primary-foreground rounded-tr-xs'
                    : 'bg-white border border-border text-foreground rounded-tl-xs'
                }`}
              >
                {msg.text && <p>{msg.text}</p>}
                {msg.prescription && (
                  <PrescriptionAttachmentView
                    prescription={msg.prescription}
                    isSender={isCustomer}
                  />
                )}
                <div
                  className={`text-[9px] mt-1 text-right ${
                    isCustomer ? 'text-primary-foreground/75' : 'text-muted-foreground'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Pending Prescription Attachment Bar */}
      {pendingPrescription && (
        <div className="px-3.5 py-2.5 bg-accent/60 border-t border-border flex items-center justify-between gap-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg overflow-hidden bg-background border border-border/80 shrink-0">
              <img
                src={pendingPrescription.dataUrl}
                alt="Prescription preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">
                  Rx Attached
                </span>
                <span className="text-xs font-semibold text-foreground truncate max-w-[180px] sm:max-w-xs">
                  {pendingPrescription.fileName}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {formatFileSize(pendingPrescription.fileSize)} · Ready to send to pharmacy
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPendingPrescription(null)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            title="Remove prescription"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 5. Chat Input & Send Button */}
      <div className="p-3 border-t border-border bg-white flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
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
          title="Add prescription photo (Max 5MB)"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Paperclip className="h-4 w-4 text-primary" />
          )}
          <span className="hidden sm:inline">Add Prescription</span>
          <span className="sm:hidden">Rx</span>
        </Button>

        <Input
          type="text"
          placeholder={
            pendingPrescription
              ? 'Add an optional note with your prescription...'
              : `Message ${shop.name}...`
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-10 text-xs bg-white border-border focus-visible:ring-primary"
        />

        <Button
          onClick={handleSend}
          disabled={(!inputText.trim() && !pendingPrescription) || isUploading}
          size="icon"
          className="h-10 w-10 shrink-0 font-semibold"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
