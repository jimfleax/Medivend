import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { CustomerHome } from './views/customer/CustomerHome';
import { CheckoutView } from './views/customer/CheckoutView';
import { DispenseView } from './views/customer/DispenseView';
import { CustomerShopsView } from './views/customer/CustomerShopsView';
import { CustomerChatsListView } from './views/customer/CustomerChatsListView';
import { CustomerChatView } from './views/customer/CustomerChatView';
import { ShopDashboardView } from './views/shop/ShopDashboardView';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Default redirect to /customer */}
          <Route index element={<Navigate to="/customer" replace />} />

          {/* Customer Routes */}
          <Route path="customer">
            <Route index element={<CustomerHome />} />
            <Route path="checkout" element={<CheckoutView />} />
            <Route path="dispense/:orderId" element={<DispenseView />} />
            <Route path="shops" element={<CustomerShopsView />} />
            <Route path="chats" element={<CustomerChatsListView />} />
            <Route path="chat/:shopId" element={<CustomerChatView />} />
          </Route>

          {/* Shop Routes */}
          <Route path="shop" element={<ShopDashboardView />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/customer" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
