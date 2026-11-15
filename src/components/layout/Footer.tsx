import React from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useMedivendStore } from '@/store';
import { Button } from '@/components/ui/button';

export const Footer: React.FC = () => {
  const { resetDemoData } = useMedivendStore();

  const handleReset = () => {
    resetDemoData();
    toast.success('Demo data reset to initial state', {
      description: 'Inventory and orders have been restored to initial demo seeds.',
    });
  };

  return (
    <footer className="w-full border-t border-border bg-background py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex flex-col space-y-1">
          <p className="text-xs font-semibold text-foreground tracking-tight">
            MediVend Prototype · Front-End Offline Demonstration
          </p>
          <p className="text-xs text-muted-foreground">
            All state persisted locally in browser localStorage. No external server dependencies.
          </p>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground gap-1.5 transition-all shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset demo data
          </Button>
        </div>
      </div>
    </footer>
  );
};
