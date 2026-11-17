import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Pill,
  Boxes,
  Store,
  MessageSquare,
  ShoppingBag,
  Building2,
  Users,
  Receipt,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMedivendStore } from '@/store';
import { CartSheet } from '@/components/cart/CartSheet';
import { cn } from '@/lib/utils';

export const SidebarNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopConversations, cart, machineOrders, shopOrders } = useMedivendStore();

  const isShopRoute = location.pathname.startsWith('/shop');
  const currentMode = isShopRoute ? 'shop' : 'consumer';

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalOrdersCount = machineOrders.length + shopOrders.length;

  const handleModeChange = (mode: 'consumer' | 'shop') => {
    if (mode === 'shop') {
      navigate('/shop');
    } else {
      navigate('/customer');
    }
  };

  const consumerNavItems = [
    {
      label: 'Vending Machines',
      path: '/customer',
      icon: Boxes,
      exact: true,
    },
    {
      label: 'Partner Shops',
      path: '/customer/shops',
      icon: Store,
      exact: false,
    },
    {
      label: 'Orders & Receipts',
      path: '/customer/orders',
      icon: Receipt,
      exact: true,
      count: totalOrdersCount > 0 ? totalOrdersCount : undefined,
    },
    {
      label: 'Chats',
      path: '/customer/shops?chat=open',
      icon: MessageSquare,
      count: shopConversations.length > 0 ? shopConversations.length : undefined,
    },
  ];

  const shopNavItems = [
    {
      label: 'Store Management',
      path: '/shop',
      icon: Building2,
      exact: true,
    },
    {
      label: 'Patient Chats',
      path: '/shop',
      icon: MessageSquare,
      count: shopConversations.length > 0 ? shopConversations.length : undefined,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border h-screen sticky top-0 flex flex-col justify-between select-none z-30 shrink-0">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-border/70">
          <Link
            to="/customer"
            className="flex items-center gap-3 transition-opacity hover:opacity-90 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-xs transition-transform group-hover:scale-105">
              <Pill className="h-5 w-5 rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-foreground flex items-center">
                Medi<span className="text-primary">Vend</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="p-3 space-y-1">
          {!isShopRoute ? (
            <>
              {consumerNavItems.map((item) => {
                const isChatsItem = item.path.includes('chat=open');
                const isCurrentChats = location.search.includes('chat=open');
                const isActive = isChatsItem
                  ? isCurrentChats
                  : item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path) && !isCurrentChats;

                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-primary/70')} />
                      <span>{item.label}</span>
                    </div>

                    {item.count !== undefined && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.2 rounded-full',
                          isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Cart Drawer Trigger Button in Sidebar */}
              <div className="pt-2 px-1">
                <div className="flex items-center justify-between p-2 rounded-xl border border-border/80 bg-secondary/30">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <span>Cart ({cartItemCount})</span>
                  </div>
                  <CartSheet />
                </div>
              </div>
            </>
          ) : (
            <>
              {shopNavItems.map((item, idx) => {
                const isActive = idx === 0;
                const Icon = item.icon;

                return (
                  <Link
                    key={idx}
                    to={item.path}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-primary/70')} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Footer Area: Clean Consumer / Shops Tab Strip */}
      <div className="p-3 border-t border-border/70">
        <div className="grid grid-cols-2 p-1 bg-secondary rounded-xl border border-border/60 relative">
          <button
            type="button"
            onClick={() => handleModeChange('consumer')}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold transition-colors rounded-lg',
              currentMode === 'consumer'
                ? 'text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Consumer</span>
            {currentMode === 'consumer' && (
              <motion.div
                layoutId="active-mode-tab"
                className="absolute inset-0 bg-white rounded-lg -z-10 shadow-xs"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('shop')}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold transition-colors rounded-lg',
              currentMode === 'shop'
                ? 'text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Store className="h-3.5 w-3.5" />
            <span>Shops</span>
            {currentMode === 'shop' && (
              <motion.div
                layoutId="active-mode-tab"
                className="absolute inset-0 bg-white rounded-lg -z-10 shadow-xs"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
