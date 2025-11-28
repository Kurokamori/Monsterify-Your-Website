import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TrainerList from '../../components/admin/trainers/TrainerList';
import TrainerDetails from '../../components/admin/trainers/TrainerDetails';
import TrainerEdit from '../../components/admin/trainers/TrainerEdit';
import TrainerCreate from '../../components/admin/trainers/TrainerCreate';

const TrainerManagement = () => {
  return (
    <div className="trainer-management">
      <Routes>
        <Route index element={<TrainerList />} />
        <Route path="create" element={<TrainerCreate />} />
        <Route path=":id" element={<TrainerDetails />} />
        <Route path=":id/edit" element={<TrainerEdit />} />
        <Route path="*" element={<Navigate to="/admin/trainers" replace />} />
      </Routes>
    </div>
  );
};

export default TrainerManagement;
