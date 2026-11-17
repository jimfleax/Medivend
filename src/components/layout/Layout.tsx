import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';
import { Toaster } from '@/components/ui/sonner';
import { Menu, Pill, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen h-screen flex bg-slate-50/50 text-foreground antialiased selection:bg-accent selection:text-accent-foreground overflow-hidden">
      {/* Desktop Persistent Left Navigation Sidebar */}
      <div className="hidden md:block">
        <SidebarNav />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarNav />
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Mobile top bar for toggling navigation on small screens */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Pill className="h-4 w-4 rotate-45" />
            </div>
            <span className="font-bold text-base tracking-tight">
              Medi<span className="text-primary">Vend</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Content Outlet with smooth scrolling */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <Toaster position="bottom-right" richColors />
    </div>
  );
};
