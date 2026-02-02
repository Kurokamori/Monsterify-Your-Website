import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminDashboard from './AdminDashboard';
import TrainerManagement from './TrainerManagement';
import MonsterManagement from './MonsterManagement';
import UserManagement from './UserManagement';
import SubmissionManagement from './SubmissionManagement';
import LevelManagement from './LevelManagement';
import ItemManagement from './ItemManagement';
import AdminFeatures from './AdminFeatures';
import ContentManagementPage from './ContentManagementPage';
import FakemonListPage from './FakemonListPage';
import FakemonFormPage from './FakemonFormPage';
import MassFakemonAddPage from './MassFakemonAddPage';
import MonsterListPage from './MonsterListPage';
import MonsterFormPage from './MonsterFormPage';
import ShopManagerRoutes from './ShopManager';
import ItemRoller from './ItemRoller';
import MonsterRoller from './MonsterRoller/MonsterRoller';
import RerollerPage from './Reroller/RerollerPage';
import RerollerSessionsPage from './Reroller/RerollerSessionsPage';
import UserListPage from './UserListPage';
import UserFormPage from './UserFormPage';

// Monster Type Management Pages
import PokemonMonsterListPage from './PokemonMonsterListPage';
import PokemonMonsterFormPage from './PokemonMonsterFormPage';
import DigimonMonsterListPage from './DigimonMonsterListPage';
import DigimonMonsterFormPage from './DigimonMonsterFormPage';
import YokaiMonsterListPage from './YokaiMonsterListPage';
import YokaiMonsterFormPage from './YokaiMonsterFormPage';
import NexomonMonsterListPage from './NexomonMonsterListPage';
import NexomonMonsterFormPage from './NexomonMonsterFormPage';
import PalsMonsterListPage from './PalsMonsterListPage';
import PalsMonsterFormPage from './PalsMonsterFormPage';
import FinalFantasyMonsterListPage from './FinalFantasyMonsterListPage';
import FinalFantasyMonsterFormPage from './FinalFantasyMonsterFormPage';
import MonsterHunterMonsterListPage from './MonsterHunterMonsterListPage';
import MonsterHunterMonsterFormPage from './MonsterHunterMonsterFormPage';
import ItemListPage from './ItemListPage';
import ItemFormPage from './ItemFormPage';
import ItemBulkFormPage from './ItemBulkFormPage';
import FactionPeopleAdmin from '../../components/admin/FactionPeopleAdmin';
import WorldMapAdmin from './WorldMapAdmin';
import BossAdmin from './BossAdmin';
import PromptManagement from '../../components/admin/PromptManagement';
import BulkMonsterAddPage from './BulkMonsterAddPage';

const AdminDashboardPage = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />

        {/* Trainer Management Routes */}
        <Route path="trainers/*" element={<TrainerManagement />} />

        {/* Monster Management Routes */}
        <Route path="monsters" element={<MonsterListPage />} />
        <Route path="monsters/add" element={<MonsterFormPage />} />
        <Route path="monsters/edit/:id" element={<MonsterFormPage />} />

        {/* User Management Routes */}
        <Route path="users" element={<UserListPage />} />
        <Route path="users/add" element={<UserFormPage />} />
        <Route path="users/edit/:id" element={<UserFormPage />} />

        {/* Submission Management Routes */}
        <Route path="submissions/*" element={<SubmissionManagement />} />

        {/* Prompt Management Routes */}
        <Route path="prompts" element={<PromptManagement />} />

        {/* Fakemon Management Routes */}
        <Route path="fakemon" element={<FakemonListPage />} />
        <Route path="fakemon/add" element={<FakemonFormPage />} />
        <Route path="fakemon/mass-add" element={<MassFakemonAddPage />} />
        <Route path="fakemon/edit/:number" element={<FakemonFormPage />} />

        {/* Content Management Routes */}
        <Route path="content/*" element={<ContentManagementPage />} />

        {/* Other Admin Routes */}
        <Route path="level-management" element={<LevelManagement />} />
        <Route path="item-management" element={<ItemManagement />} />
        <Route path="faction-people" element={<FactionPeopleAdmin />} />
        <Route path="world-map" element={<WorldMapAdmin />} />
        <Route path="bulk-monster-add" element={<BulkMonsterAddPage />} />
        <Route path="features" element={<AdminFeatures />} />

        {/* Boss Management Routes */}
        <Route path="bosses" element={<BossAdmin />} />
        <Route path="bosses/add" element={<BossAdmin />} />
        <Route path="bosses/edit/:id" element={<BossAdmin />} />

        {/* Monster Type Management Routes */}
        <Route path="pokemon-monsters" element={<PokemonMonsterListPage />} />
        <Route path="pokemon-monsters/add" element={<PokemonMonsterFormPage />} />
        <Route path="pokemon-monsters/edit/:id" element={<PokemonMonsterFormPage />} />

        <Route path="digimon-monsters" element={<DigimonMonsterListPage />} />
        <Route path="digimon-monsters/add" element={<DigimonMonsterFormPage />} />
        <Route path="digimon-monsters/edit/:id" element={<DigimonMonsterFormPage />} />

        <Route path="yokai-monsters" element={<YokaiMonsterListPage />} />
        <Route path="yokai-monsters/add" element={<YokaiMonsterFormPage />} />
        <Route path="yokai-monsters/edit/:id" element={<YokaiMonsterFormPage />} />

        <Route path="nexomon-monsters" element={<NexomonMonsterListPage />} />
        <Route path="nexomon-monsters/add" element={<NexomonMonsterFormPage />} />
        <Route path="nexomon-monsters/edit/:nr" element={<NexomonMonsterFormPage />} />

        <Route path="pals-monsters" element={<PalsMonsterListPage />} />
        <Route path="pals-monsters/add" element={<PalsMonsterFormPage />} />
        <Route path="pals-monsters/edit/:id" element={<PalsMonsterFormPage />} />

        <Route path="finalfantasy-monsters" element={<FinalFantasyMonsterListPage />} />
        <Route path="finalfantasy-monsters/add" element={<FinalFantasyMonsterFormPage />} />
        <Route path="finalfantasy-monsters/edit/:id" element={<FinalFantasyMonsterFormPage />} />

        <Route path="monsterhunter-monsters" element={<MonsterHunterMonsterListPage />} />
        <Route path="monsterhunter-monsters/add" element={<MonsterHunterMonsterFormPage />} />
        <Route path="monsterhunter-monsters/edit/:id" element={<MonsterHunterMonsterFormPage />} />

        {/* Shop Management Routes */}
        <Route path="items" element={<ItemListPage />} />
        <Route path="items/add" element={<ItemFormPage />} />
        <Route path="items/edit/:id" element={<ItemFormPage />} />
        <Route path="items/bulk" element={<ItemBulkFormPage />} />

        {/* Shop Management Routes */}
        <Route path="shop-manager/*" element={<ShopManagerRoutes />} />

        {/* Item Roller Routes */}
        <Route path="item-roller" element={<ItemRoller />} />

        {/* Monster Roller Routes */}
        <Route path="monster-roller" element={<MonsterRoller />} />

        {/* Reroller Routes */}
        <Route path="reroller" element={<RerollerPage />} />
        <Route path="reroller/sessions" element={<RerollerSessionsPage />} />
        <Route path="reroller/sessions/:id" element={<RerollerPage />} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
