import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Store, ArrowLeft } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMedivendStore } from '@/store';

export const CustomerShopsPlaceholder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const medicineIdParam = searchParams.get('medicine');
  const { medicines } = useMedivendStore();

  const queriedMedicine = medicineIdParam
    ? medicines.find((m) => m.id === Number(medicineIdParam))
    : null;

  return (
    <div className="max-w-xl mx-auto py-8 space-y-4">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
      >
        <Link to="/customer">
          <ArrowLeft className="h-4 w-4" />
          Back to machine catalog
        </Link>
      </Button>

      <Card className="border-border bg-white shadow-xs text-center p-8 space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-secondary flex items-center justify-center text-primary">
          <Store className="h-8 w-8" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-foreground">
            Nearby shops (built in the next step)
          </CardTitle>
          {queriedMedicine && (
            <p className="text-xs text-muted-foreground">
              Checking inventory for <strong className="text-foreground">{queriedMedicine.name}</strong> at local pharmacies.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
