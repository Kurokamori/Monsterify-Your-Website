import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ShopPage from './ShopPage';

const ShopRoutes = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/town" replace />} />
      <Route path=":shopId" element={<ShopPage />} />
    </Routes>
  );
};

export default ShopRoutes;
