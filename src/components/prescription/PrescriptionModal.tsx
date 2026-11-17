import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  X,
  Store,
  CheckCircle2,
  Loader2,
  Send,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMedivendStore } from '@/store';
import { PrescriptionAttachment } from '@/data/types';
import {
  validatePrescriptionFile,
  compressAndReadPrescription,
  formatFileSize,
} from '@/lib/prescription';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface PrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialShopId?: string;
  initialMedicineId?: number;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  open,
  onOpenChange,
  initialShopId,
  initialMedicineId,
}) => {
  const navigate = useNavigate();
  const { shops, medicines, sendMessage, getOrCreateConversation } = useMedivendStore();

  const [prescription, setPrescription] = useState<PrescriptionAttachment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>(initialShopId || shops[0]?.id || 'S1');
  const [note, setNote] = useState<string>('Hello, please check if you can fulfill this prescription.');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialShopId) {
      setSelectedShopId(initialShopId);
    }
    if (initialMedicineId) {
      const med = medicines.find((m) => m.id === initialMedicineId);
      if (med) {
        setNote(`Hello, please check if you can fulfill ${med.name} with this prescription.`);
      }
    }
  }, [initialShopId, initialMedicineId, medicines, open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validatePrescriptionFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid prescription file');
      return;
    }

    setIsProcessing(true);
    try {
      const rx = await compressAndReadPrescription(file);
      setPrescription(rx);
      toast.success(`Prescription uploaded (${formatFileSize(file.size)})`);
    } catch (err) {
      console.error('Failed to process prescription image:', err);
      toast.error('Could not process this prescription image. Please try another photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendToPharmacy = () => {
    if (!prescription) {
      toast.error('Please upload your prescription photo first');
      return;
    }

    if (!selectedShopId) {
      toast.error('Please select a pharmacy');
      return;
    }

    const shop = shops.find((s) => s.id === selectedShopId);
    getOrCreateConversation(selectedShopId);
    sendMessage(selectedShopId, 'customer', note.trim(), prescription);

    toast.success(`Prescription sent to ${shop?.name || 'pharmacy'}`, {
      description: 'Opening chat conversation now.',
    });

    onOpenChange(false);
    setPrescription(null);
    navigate(`/customer/chat/${selectedShopId}`);
  };

  const handleBrowsePharmacies = () => {
    onOpenChange(false);
    navigate('/customer/shops');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl bg-white border-border shadow-xl">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/80">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Prescription Consultation
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Upload your doctor's prescription for verification and fulfillment by licensed pharmacies.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Upload Area */}
          {!prescription ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-secondary/40 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-secondary text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  {isProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    Click to upload prescription photo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PNG, JPG, or WEBP (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-xl p-4 bg-secondary/30 relative">
              <button
                type="button"
                onClick={() => setPrescription(null)}
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/90 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-xs hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-white border border-border shrink-0">
                  <img
                    src={prescription.dataUrl}
                    alt="Prescription preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
                    </Badge>
                    <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                      {prescription.fileName}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Size: {formatFileSize(prescription.fileSize)} · Preserved for high legibility
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pharmacy Target Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-primary" />
              Select Partner Pharmacy to Consult
            </label>
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
              <SelectTrigger className="w-full bg-white border-border h-10 text-xs">
                <SelectValue placeholder="Select pharmacy" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id} className="text-xs">
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{shop.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {shop.area} · {shop.distanceKm} km · {shop.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Consultation Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Add inquiry note (optional)
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g., Please check if in stock and approximate pickup time..."
              className="text-xs h-10 bg-white border-border"
            />
          </div>
        </div>

        <DialogFooter className="p-4 bg-secondary/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBrowsePharmacies}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 w-full sm:w-auto"
          >
            Or browse all pharmacies <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!prescription || isProcessing}
              onClick={handleSendToPharmacy}
              className="text-xs font-semibold gap-1.5 bg-primary text-white shadow-xs hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5" /> Send to Pharmacist
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
