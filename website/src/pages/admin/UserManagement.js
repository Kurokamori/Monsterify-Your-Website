import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserListPage from './UserListPage';
import UserFormPage from './UserFormPage';

const UserManagement = () => {
  return (
    <div className="user-management">
      <Routes>
        <Route index element={<UserListPage />} />
        <Route path="add" element={<UserFormPage />} />
        <Route path="edit/:id" element={<UserFormPage />} />
        <Route path="*" element={<Navigate to="/admin/users" replace />} />
      </Routes>
    </div>
  );
};

export default UserManagement;
