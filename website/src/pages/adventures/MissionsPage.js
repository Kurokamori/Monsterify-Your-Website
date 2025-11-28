import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Import mission components
import AvailableMissions from './missions/AvailableMissions';
import ActiveMissions from './missions/ActiveMissions';
import MissionStart from './missions/MissionStart';

const CompletedMissions = () => <div>Completed Missions - Coming Soon</div>;
const MissionDetail = () => <div>Mission Detail - Coming Soon</div>;

const MissionsPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/adventures/missions/available" replace />} />
      <Route path="available" element={<AvailableMissions />} />
      <Route path="active" element={<ActiveMissions />} />
      <Route path="completed" element={<CompletedMissions />} />
      <Route path=":missionId/start" element={<MissionStart />} />
      <Route path=":missionId" element={<MissionDetail />} />
    </Routes>
  );
};

// Navigate component for redirection
const Navigate = ({ to, replace }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  
  return null;
};

export default MissionsPage;
