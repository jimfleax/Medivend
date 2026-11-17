import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { CustomerVendingView } from './views/customer/CustomerVendingView';
import { CustomerShopsView } from './views/customer/CustomerShopsView';
import { CheckoutView } from './views/customer/CheckoutView';
import { DispenseView } from './views/customer/DispenseView';
import { CustomerOrdersView } from './views/customer/CustomerOrdersView';
import { ShopDashboardView } from './views/shop/ShopDashboardView';

const LegacyShopChatRedirect: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  return <Navigate to={`/customer/shops?shop=${shopId || 'S1'}&chat=open`} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Default redirect to /customer */}
          <Route index element={<Navigate to="/customer" replace />} />

          {/* Customer Routes */}
          <Route path="customer">
            {/* Dashboard shows the Vending Machine view by default */}
            <Route index element={<CustomerVendingView />} />
            <Route path="vending" element={<Navigate to="/customer" replace />} />
            <Route path="shops" element={<CustomerShopsView />} />
            <Route path="orders" element={<CustomerOrdersView />} />
            <Route path="checkout" element={<CheckoutView />} />
            <Route path="dispense/:orderId" element={<DispenseView />} />
            <Route path="chats" element={<Navigate to="/customer/shops?chat=open" replace />} />
            <Route path="chat/:shopId" element={<LegacyShopChatRedirect />} />
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
