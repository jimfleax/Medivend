import React from 'react';
import { Store } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';

export const ShopPlaceholder: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto py-12 space-y-4">
      <Card className="border-border bg-white shadow-xs text-center p-8 space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-secondary flex items-center justify-center text-primary">
          <Store className="h-8 w-8" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-foreground">
            Shop dashboard (built in the next step)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Pharmacy inventory management, pending counter pickups, and live chat will be enabled here.
          </p>
        </div>
      </Card>
    </div>
  );
};
