import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  ArrowLeft,
  Store,
  ChevronRight,
  Clock,
  Package,
} from 'lucide-react';
import { useMedivendStore } from '@/store';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const CustomerChatsListView: React.FC = () => {
  const navigate = useNavigate();
  const { shopConversations, shops, shopOrders } = useMedivendStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top back button */}
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
          className="text-xs border-border bg-white hover:bg-secondary text-primary"
        >
          <Link to="/customer/shops">
            <Store className="h-3.5 w-3.5 mr-1.5" />
            Find Shops
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-1.5 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Pharmacy Conversations
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Real-time inquiries, stock confirmations, and counter pickup orders
        </p>
      </div>

      {/* Conversations List */}
      {shopConversations.length === 0 ? (
        <Card className="border-border bg-white text-center py-12 p-6 space-y-3">
          <div className="h-12 w-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-primary">
            <MessageSquare className="h-6 w-6" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">
            No Active Conversations
          </CardTitle>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You haven't initiated any inquiries yet. Search for out-of-stock items or browse local pharmacies to start a chat.
          </p>
          <Button asChild size="sm" className="mt-2 text-xs">
            <Link to="/customer/shops">Browse Nearby Shops</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {shopConversations.map((conv) => {
            const shop = shops.find((s) => s.id === conv.shopId);
            if (!shop) return null;

            const lastMessage =
              conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1]
                : null;

            // Find if there is an active order for this shop
            const activeOrder = shopOrders.find((o) => o.shopId === shop.id);

            return (
              <Card
                key={conv.id}
                onClick={() => navigate(`/customer/chat/${shop.id}`)}
                className="border-border bg-white shadow-xs hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
              >
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-accent text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Store className="h-5 w-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">
                          {shop.name}
                        </span>
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
                        {activeOrder && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-primary/20 font-semibold flex items-center gap-1"
                          >
                            <Package className="h-3 w-3" />
                            {activeOrder.status}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        {lastMessage ? (
                          <span>
                            {lastMessage.sender === 'customer' ? 'You: ' : ''}
                            {lastMessage.text}
                          </span>
                        ) : (
                          <span className="italic">No messages yet</span>
                        )}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{shop.area}</span>
                        {lastMessage && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lastMessage.timestamp}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
