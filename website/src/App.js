import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';

// Layout Components
import MainLayout from './components/layouts/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DiscordAuthSuccess from './pages/auth/DiscordAuthSuccess';
import TrainersPage from './pages/trainers/TrainersPage';
import TrainerDetailPage from './pages/trainers/TrainerDetailPage';
import EditTrainerPage from './pages/trainers/EditTrainerPage';
import MonsterDetailPage from './pages/monsters/MonsterDetailPage';
import EditMonsterPage from './pages/monsters/EditMonsterPage';
import FakemonDexPage from './pages/fakemon/FakemonDexPage';
import FakemonDetailPage from './pages/fakemon/FakemonDetailPage';
import StatisticsPage from './pages/statistics/StatisticsPage';
import GuidesPage from './pages/guides/GuidesPage';
import InteractiveMap from './pages/guides/InteractiveMap';
import TypeCalculatorPage from './pages/guides/TypeCalculatorPage';
import EvolutionExplorerPage from './pages/guides/EvolutionExplorerPage';
import LandmassPage from './pages/guides/LandmassPage';
import RegionPage from './pages/guides/RegionPage';
import AreaPage from './pages/guides/AreaPage';
import ProfilePage from './pages/profile/ProfilePage';
import MyTrainersPage from './pages/profile/MyTrainersPage';
import AddTrainerPage from './pages/profile/AddTrainerPage';
import SubmissionsPage from './pages/profile/SubmissionsPage';
import SubmissionPage from './pages/submissions/SubmissionPage';
import SubmissionDetailPage from './pages/submissions/SubmissionDetailPage';
import ArtSubmissionPage from './pages/submissions/ArtSubmissionPage';
import WritingSubmissionPage from './pages/submissions/WritingSubmissionPage';
import MonsterReferenceSubmissionPage from './pages/submissions/MonsterReferenceSubmissionPage';
import TrainerReferenceSubmissionPage from './pages/submissions/TrainerReferenceSubmissionPage';
import MegaImageReferenceSubmissionPage from './pages/submissions/MegaImageReferenceSubmissionPage';
import TrainerMegaReferenceSubmissionPage from './pages/submissions/TrainerMegaReferenceSubmissionPage';
import PromptSubmissionPage from './pages/submissions/PromptSubmissionPage';
import TownPage from './pages/town/TownPage';
import ShopRoutes from './pages/town/shop';
import AdoptionCenterPage from './pages/town/AdoptionCenterPage';
import ApothecaryPage from './pages/town/ApothecaryPage';
import BakeryPage from './pages/town/BakeryPage';
import PersonalArtTodoPage from './pages/profile/PersonalArtTodoPage';
import ReferenceTodoPage from './pages/reference/ReferenceTodoPage';
import ReferenceHelperPage from './pages/reference/ReferenceHelperPage';
import AdventuresPage from './pages/adventures/AdventuresPage';
import AdventureRewardsPage from './pages/adventures/AdventureRewardsPage';
import TasksPage from './pages/tasks/TasksPage';
import SchedulePage from './pages/schedule/SchedulePage';
import StarterSelectionPage from './pages/StarterSelectionPage';
import HatchSessionPage from './pages/nursery/HatchSessionPage';
import BossViewPage from './pages/boss/BossViewPage';
import RerollClaimPage from './pages/claim/RerollClaimPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!currentUser?.is_admin) {
    return <NotFoundPage />;
  }

  return children;
};

function App() {
  return (
    <ModalProvider>
      <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />

        {/* Auth Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="auth/discord/success" element={<DiscordAuthSuccess />} />

        {/* Public Routes */}
        <Route path="trainers" element={<TrainersPage />} />
        <Route path="trainers/:id" element={<TrainerDetailPage />} />
        <Route path="trainers/:id/edit" element={
          <ProtectedRoute>
            <EditTrainerPage />
          </ProtectedRoute>
        } />
        <Route path="monsters/:id" element={<MonsterDetailPage />} />
        <Route path="monsters/:id/edit" element={
          <ProtectedRoute>
            <EditMonsterPage />
          </ProtectedRoute>
        } />
        <Route path="fakedex" element={<FakemonDexPage />} />
        <Route path="fakedex/:id" element={<FakemonDetailPage />} />
        <Route path="statistics/*" element={<StatisticsPage />} />
        <Route path="gallery" element={<SubmissionPage />} />
        <Route path="library" element={<SubmissionPage />} />
        <Route path="gallery/:id" element={<SubmissionDetailPage type="art" />} />
        <Route path="library/:id" element={<SubmissionDetailPage type="writing" />} />

        {/* Claim Routes */}
        <Route path="claim/:token" element={<RerollClaimPage />} />

        {/* Interactive Map Routes - Must come before the catch-all guides route */}
        <Route path="guides/interactive-map" element={<InteractiveMap />} />
        <Route path="guides/interactive-map/landmass/:landmassId" element={<LandmassPage />} />
        <Route path="guides/interactive-map/landmass/:landmassId/region/:regionId" element={<RegionPage />} />
        <Route path="guides/interactive-map/landmass/:landmassId/region/:regionId/area/:areaId" element={<AreaPage />} />
        
        {/* Type Calculator Route - Must come before the catch-all guides route */}
        <Route path="guides/type-calculator" element={<TypeCalculatorPage />} />
        <Route path="guides/evolution-explorer" element={<EvolutionExplorerPage />} />
        
        {/* Guide Routes - Catch-all for other guide categories */}
        <Route path="guides/*" element={<GuidesPage />} />

        {/* Protected Routes */}
        <Route path="profile/*" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="my_trainers" element={
          <ProtectedRoute>
            <MyTrainersPage />
          </ProtectedRoute>
        } />
        <Route path="add_trainer" element={
          <ProtectedRoute>
            <AddTrainerPage />
          </ProtectedRoute>
        } />
        <Route path="trainers/:trainerId/starters" element={
          <ProtectedRoute>
            <StarterSelectionPage />
          </ProtectedRoute>
        } />
        <Route path="profile/trainers/:trainerId/starter-selection" element={
          <ProtectedRoute>
            <StarterSelectionPage />
          </ProtectedRoute>
        } />
        <Route path="nursery/session/:sessionId" element={
          <ProtectedRoute>
            <HatchSessionPage />
          </ProtectedRoute>
        } />
        <Route path="my-submissions" element={
          <ProtectedRoute>
            <SubmissionsPage />
          </ProtectedRoute>
        } />
        <Route path="submissions" element={<SubmissionPage />} />
        <Route path="submissions/art" element={<ArtSubmissionPage />} />
        <Route path="submissions/writing" element={<WritingSubmissionPage />} />
        <Route path="submissions/monster-reference" element={<MonsterReferenceSubmissionPage />} />
        <Route path="submissions/trainer-reference" element={<TrainerReferenceSubmissionPage />} />
        <Route path="submissions/mega-image-reference" element={<MegaImageReferenceSubmissionPage />} />
        <Route path="submissions/trainer-mega-reference" element={<TrainerMegaReferenceSubmissionPage />} />
        <Route path="submissions/prompt/:category" element={<PromptSubmissionPage />} />
        <Route path="submissions/:id" element={<SubmissionDetailPage />} />
        <Route path="art_todo" element={
          <ProtectedRoute>
            <PersonalArtTodoPage />
          </ProtectedRoute>
        } />
        <Route path="reference_todo" element={
          <ProtectedRoute>
            <ReferenceTodoPage />
          </ProtectedRoute>
        } />
        <Route path="reference_helper" element={
          <ProtectedRoute>
            <ReferenceHelperPage />
          </ProtectedRoute>
        } />

        {/* Town Routes */}
        <Route path="town" element={<TownPage />} />
        <Route path="town/activities/*" element={<TownPage />} />
        <Route path="town/visit/*" element={<TownPage />} />
        <Route path="town/trade" element={<TownPage currentLocation="trade" />} />
        <Route path="town/adoption" element={
          <ProtectedRoute>
            <AdoptionCenterPage />
          </ProtectedRoute>
        } />
        <Route path="town/apothecary" element={
          <ProtectedRoute>
            <ApothecaryPage />
          </ProtectedRoute>
        } />
        <Route path="town/bakery" element={
          <ProtectedRoute>
            <BakeryPage />
          </ProtectedRoute>
        } />
        <Route path="town/nursery" element={<TownPage currentLocation="nursery" />} />
        <Route path="town/mega-mart" element={<TownPage currentLocation="mega-mart" />} />
        <Route path="town/bazar" element={<TownPage currentLocation="bazar" />} />
        <Route path="town/shop/*" element={
          <ProtectedRoute>
            <ShopRoutes />
          </ProtectedRoute>
        } />
        <Route path="town/:locationId" element={<TownPage />} />

        {/* Adventures Routes */}
        <Route path="adventures/*" element={<AdventuresPage />} />
        <Route path="adventure-rewards" element={
          <ProtectedRoute>
            <AdventureRewardsPage />
          </ProtectedRoute>
        } />

        {/* Boss Routes */}
        <Route path="boss" element={<BossViewPage />} />

        {/* Tasks Routes */}
        <Route path="tasks/*" element={<TasksPage />} />

        {/* Schedule Routes */}
        <Route path="schedule" element={
          <ProtectedRoute>
            <SchedulePage />
          </ProtectedRoute>
        } />
        <Route path="manage_schedule" element={
          <ProtectedRoute>
            <SchedulePage />
          </ProtectedRoute>
        } />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <AdminRoute>
          <AdminDashboardPage />
        </AdminRoute>
      } />
      </Routes>
    </ModalProvider>
  );
}

export default App;
