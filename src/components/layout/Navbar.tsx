import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Pill, MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CartSheet } from '@/components/cart/CartSheet';
import { useMedivendStore } from '@/store';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopConversations } = useMedivendStore();

  const isShopRoute = location.pathname.startsWith('/shop');
  const currentTab = isShopRoute ? 'shop' : 'customer';

  const handleTabChange = (value: string) => {
    if (value === 'shop') {
      navigate('/shop');
    } else {
      navigate('/customer');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Wordmark */}
        <Link
          to="/customer"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90 select-none group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
            <Pill className="h-5 w-5 rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-foreground flex items-center">
              Medi<span className="text-primary">Vend</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/80">
              Smart Dispenser
            </span>
          </div>
        </Link>

        {/* Right side controls: Tabs switcher + Customer actions (Chats & Cart) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Tabs
            value={currentTab}
            onValueChange={handleTabChange}
            className="w-auto"
          >
            <TabsList className="bg-secondary p-1 h-9 rounded-lg">
              <TabsTrigger
                value="customer"
                className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs"
              >
                Customer
              </TabsTrigger>
              <TabsTrigger
                value="shop"
                className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs"
              >
                Shop
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Customer action triggers */}
          {!isShopRoute && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="relative h-10 w-10 border-border bg-white text-foreground hover:bg-secondary transition-all"
                aria-label="View Pharmacy Chats"
              >
                <Link to="/customer/chats">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {shopConversations.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-background">
                      {shopConversations.length}
                    </span>
                  )}
                </Link>
              </Button>

              <CartSheet />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
