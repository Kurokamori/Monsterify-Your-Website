import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MonsterListPage from './MonsterListPage';
import MonsterFormPage from './MonsterFormPage';

const MonsterManagement = () => {
  return (
    <div className="monster-management">
      <Routes>
        <Route index element={<MonsterListPage />} />
        <Route path="add" element={<MonsterFormPage />} />
        <Route path="edit/:id" element={<MonsterFormPage />} />
        <Route path="*" element={<Navigate to="/admin/monsters" replace />} />
      </Routes>
    </div>
  );
};

export default MonsterManagement;
