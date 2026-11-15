import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Store,
  ArrowLeft,
  Clock,
  MapPin,
  Check,
  X,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { useMedivendStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const CustomerShopsView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const medicineIdParam = searchParams.get('medicine');

  const { shops, medicines } = useMedivendStore();

  const targetMedicine = medicineIdParam
    ? medicines.find((m) => m.id === Number(medicineIdParam))
    : null;

  // Sorting logic based on spec:
  // open+available first, then closed+available, then the rest
  const sortedShops = [...shops].sort((a, b) => {
    if (targetMedicine) {
      const aAvail = a.stocks.includes(targetMedicine.id);
      const bAvail = b.stocks.includes(targetMedicine.id);

      const getTier = (isOpen: boolean, isAvail: boolean) => {
        if (isOpen && isAvail) return 3; // Open + Available
        if (!isOpen && isAvail) return 2; // Closed + Available
        if (isOpen && !isAvail) return 1; // Open + Not Available
        return 0; // Closed + Not Available
      };

      const tierA = getTier(a.isOpen, aAvail);
      const tierB = getTier(b.isOpen, bAvail);

      if (tierA !== tierB) {
        return tierB - tierA;
      }
    } else {
      if (a.isOpen !== b.isOpen) {
        return a.isOpen ? -1 : 1;
      }
    }

    return a.distanceKm - b.distanceKm;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between">
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

        <Button
          variant="outline"
          size="sm"
          asChild
          className="text-xs gap-1.5 border-border bg-white hover:bg-secondary text-primary"
        >
          <Link to="/customer/chats">
            <MessageSquare className="h-3.5 w-3.5" />
            My Chats
          </Link>
        </Button>
      </div>

      {/* Header section */}
      <div className="space-y-1.5 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {targetMedicine ? targetMedicine.name : 'Nearby Partner Pharmacies'}
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {targetMedicine ? (
            <>
              Checking pharmacy inventory for{' '}
              <strong className="text-foreground">{targetMedicine.name}</strong>{' '}
              (Price: Rs {targetMedicine.price})
            </>
          ) : (
            'Local chemists available for medicine requests and pickup inquiries'
          )}
        </p>
      </div>

      {/* Shops list */}
      <div className="space-y-4">
        {sortedShops.map((shop) => {
          const isAvailable = targetMedicine
            ? shop.stocks.includes(targetMedicine.id)
            : true;

          const isMessageDisabled = Boolean(targetMedicine && !isAvailable);

          const handleMessageClick = () => {
            if (isMessageDisabled) return;
            const query = targetMedicine ? `?medicine=${targetMedicine.id}` : '';
            navigate(`/customer/chat/${shop.id}${query}`);
          };

          return (
            <Card
              key={shop.id}
              className={`border-border bg-white shadow-xs transition-all duration-200 ${
                isMessageDisabled ? 'opacity-85' : 'hover:shadow-sm'
              }`}
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-foreground">
                      {shop.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                      <span>{shop.area}</span>
                      <span>·</span>
                      <span className="font-medium text-foreground">
                        {shop.distanceKm} km away
                      </span>
                    </div>
                  </div>

                  {/* Open / Closed Badge */}
                  {shop.isOpen ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-2.5 py-0.5 text-xs flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Open
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-slate-100 text-slate-600 border-slate-200 font-medium px-2.5 py-0.5 text-xs flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Closed
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3">
                {/* Hours & Availability Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-border/50 pt-2.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Hours: {shop.hours}</span>
                  </div>

                  {/* Medicine availability line */}
                  {targetMedicine && (
                    <div>
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/60">
                          <Check className="h-3.5 w-3.5" />
                          Available here
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-medium bg-rose-50/80 px-2 py-0.5 rounded border border-rose-200/60">
                          <X className="h-3.5 w-3.5" />
                          Not available
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Shop Action */}
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Button
                      onClick={handleMessageClick}
                      disabled={isMessageDisabled}
                      className={`w-full sm:w-auto text-xs font-semibold gap-2 ${
                        isMessageDisabled
                          ? 'cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted'
                          : ''
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message shop
                    </Button>

                    {/* Tooltip text for disabled button */}
                    {isMessageDisabled && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70" />
                        Cannot message: This shop does not stock {targetMedicine?.name}
                      </span>
                    )}
                  </div>

                  {/* Closed shop note */}
                  {!shop.isOpen && !isMessageDisabled && (
                    <p className="text-[11px] text-muted-foreground mt-2 italic flex items-center gap-1">
                      <span>Shop is closed. They will reply when open.</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
