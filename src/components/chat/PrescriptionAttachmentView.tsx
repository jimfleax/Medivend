import React, { useState } from 'react';
import { FileText, Eye, Download, ZoomIn, CheckCircle } from 'lucide-react';
import { PrescriptionAttachment } from '@/data/types';
import { formatFileSize } from '@/lib/prescription';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PrescriptionAttachmentViewProps {
  prescription: PrescriptionAttachment;
  isSender: boolean;
}

export const PrescriptionAttachmentView: React.FC<PrescriptionAttachmentViewProps> = ({
  prescription,
  isSender,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = prescription.dataUrl;
    link.download = prescription.fileName || 'prescription.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div
        className={`mt-2 rounded-xl border p-2 text-left transition-all overflow-hidden ${
          isSender
            ? 'bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground'
            : 'bg-secondary/40 border-border text-foreground'
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold gap-1 px-2 py-0.5 ${
              isSender
                ? 'bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <FileText className="h-3 w-3" />
            Rx Prescription
          </Badge>
          <span
            className={`text-[10px] ${
              isSender ? 'text-primary-foreground/80' : 'text-muted-foreground'
            }`}
          >
            {formatFileSize(prescription.fileSize)}
          </span>
        </div>

        {/* Thumbnail Preview with Click-to-Zoom */}
        <div
          onClick={() => setIsOpen(true)}
          className="relative group cursor-pointer overflow-hidden rounded-lg bg-black/5 border border-black/10 aspect-video max-h-48 w-full flex items-center justify-center"
        >
          <img
            src={prescription.dataUrl}
            alt={prescription.fileName || 'Prescription Image'}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
            <ZoomIn className="h-4 w-4" />
            <span>Click to expand</span>
          </div>
        </div>

        {/* File name & quick action */}
        <div className="flex items-center justify-between gap-2 mt-2 px-0.5 text-[11px]">
          <span className="truncate max-w-[180px] font-medium" title={prescription.fileName}>
            {prescription.fileName}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`flex items-center gap-1 font-semibold hover:underline shrink-0 ${
              isSender ? 'text-primary-foreground' : 'text-primary'
            }`}
          >
            <Eye className="h-3 w-3" />
            View Full
          </button>
        </div>
      </div>

      {/* Full-Screen / Modal Viewer */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-5 overflow-hidden">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground truncate max-w-md">
                    {prescription.fileName}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {prescription.uploadedAt || 'recently'} · {formatFileSize(prescription.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Large Image display area */}
          <div className="flex-1 overflow-auto bg-slate-950/5 rounded-xl border border-border/80 p-2 flex items-center justify-center my-3 min-h-[300px]">
            <img
              src={prescription.dataUrl}
              alt={prescription.fileName}
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-md shadow-xs select-none"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Verified prescription attachment stored in local storage</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold h-8"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
