import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ShopManager from './ShopManager';
import ShopForm from './ShopForm';
import ShopItems from './ShopItems';

const ShopManagerRoutes = () => {
  return (
    <Routes>
      <Route index element={<ShopManager />} />
      <Route path="new" element={<ShopForm />} />
      <Route path=":shopId" element={<ShopForm />} />
      <Route path=":shopId/items" element={<ShopItems />} />
    </Routes>
  );
};

export default ShopManagerRoutes;
