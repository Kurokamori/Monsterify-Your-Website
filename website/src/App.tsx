import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layouts/MainLayout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/utility/NotFoundPage'
import UnderConstructionPage from './pages/utility/UnderConstructionPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DiscordAuthSuccess from './pages/auth/DiscordAuthSuccess'
import FakemonDexPage from './pages/fakemon/FakemonDexPage'
import FakemonDetailPage from './pages/fakemon/FakemonDetailPage'
import RerollClaimPage from './pages/utility/RerollClaimPage'
import ProfilePage from './pages/profile/ProfilePage'
import PersonalArtTodoPage from './pages/profile/PersonalArtTodoPage'
import AddTrainerPage from './pages/profile/AddTrainerPage'
import EditTrainerPage from './pages/trainers/EditTrainerPage'
import MyTrainersPage from './pages/trainers/MyTrainersPage'
import TrainersPage from './pages/trainers/TrainersPage'
import TrainerDetailPage from './pages/trainers/TrainerDetailPage'
import BossViewPage from './pages/adventures/boss/BossViewPage'
import DefeatedBossDetailPage from './pages/adventures/boss/DefeatedBossDetailPage'
import AdventuresPage from './pages/adventures/AdventuresPage'
import AdventurePage from './pages/adventures/AdventurePage'
import AdventureRewardsPage from './pages/adventures/AdventureRewardsPage'
import EventsPage from './pages/adventures/EventsPage'
import FactionDetailPage from './pages/adventures/FactionDetailPage'
import MissionStartPage from './pages/adventures/missions/MissionStartPage'
import ReferenceTodoPage from './pages/profile/reference/ReferenceTodoPage'
import ReferenceHelperPage from './pages/profile/reference/ReferenceHelperPage'
import SchedulePage from './pages/profile/schedule/SchedulePage'
import GameTasksPage from './pages/profile/schedule/GameTasksPage'
import GuidesIndexPage from './pages/guides-and-tools/guides/GuidesIndexPage'
import GuideCategoryPage from './pages/guides-and-tools/guides/GuideCategoryPage'
import GuideDetailPage from './pages/guides-and-tools/guides/GuideDetailPage'
import FactionsPage from './pages/guides-and-tools/guides/FactionsPage'
import LorePage from './pages/guides-and-tools/guides/LorePage'
import NPCsPage from './pages/guides-and-tools/guides/NPCsPage'
import TypeCalculatorPage from './pages/guides-and-tools/tools/TypeCalculatorPage'
import AbilityDatabasePage from './pages/guides-and-tools/tools/AbilityDatabasePage'
import SpeciesDatabasePage from './pages/guides-and-tools/tools/SpeciesDatabasePage'
import EvolutionExplorerPage from './pages/guides-and-tools/tools/EvolutionExplorerPage'
import MonsterDetailPage from './pages/monsters/MonsterDetailPage'
import EditMonsterPage from './pages/monsters/EditMonsterPage'
import StarterSelectionPage from './pages/monsters/StarterSelectionPage'
import SubmissionPage from './pages/submissions/SubmissionPage'
import ArtSubmissionPage from './pages/submissions/ArtSubmissionPage'
import WritingSubmissionPage from './pages/submissions/WritingSubmissionPage'
import ExternalArtSubmissionPage from './pages/submissions/ExternalArtSubmissionPage'
import ExternalWritingSubmissionPage from './pages/submissions/ExternalWritingSubmissionPage'
import MonsterReferenceSubmissionPage from './pages/submissions/MonsterReferenceSubmissionPage'
import TrainerReferenceSubmissionPage from './pages/submissions/TrainerReferenceSubmissionPage'
import MegaImageReferenceSubmissionPage from './pages/submissions/MegaImageReferenceSubmissionPage'
import TrainerMegaReferenceSubmissionPage from './pages/submissions/TrainerMegaReferenceSubmissionPage'
import PromptSubmissionPage from './pages/submissions/PromptSubmissionPage'
import SubmissionDetailPage from './pages/submissions/SubmissionDetailPage'
import MarketPage from './pages/town/market/MarketPage'
import ShopPage from './pages/town/market/ShopPage'
import ApothecaryPage from './pages/town/item-use/ApothecaryPage'
import BakeryPage from './pages/town/item-use/BakeryPage'
import WitchsHutPage from './pages/town/item-use/WitchsHutPage'
import MegaMartPage from './pages/town/item-use/MegaMartPage'
import AntiqueStorePage from './pages/town/item-use/AntiqueStorePage'
import StatisticsPage from './pages/statistics/StatisticsPage'
import ToysPage from './pages/toys/ToysPage'
import WhoShouldIDrawPage from './pages/toys/WhoShouldIDrawPage'
import CharacterCardCreatorPage from './pages/toys/character-card-creator/CharacterCardCreatorPage'
import ActivitySessionPage from './pages/town/activities/ActivitySessionPage'
import ActivityRewardsPage from './pages/town/activities/ActivityRewardsPage'
import GardenPage from './pages/town/activities/GardenPage'
import GardenHarvestPage from './pages/town/activities/GardenHarvestPage'
import PiratesDockPage from './pages/town/activities/PiratesDockPage'
import FarmPage from './pages/town/activities/FarmPage'
import GameCornerPage from './pages/town/activities/GameCornerPage'
import NurseryPage from './pages/town/activities/nursery/NurseryPage'
import NurserySessionPage from './pages/town/activities/nursery/NurserySessionPage'
import AdoptionPage from './pages/town/AdoptionPage'
import BazarPage from './pages/town/BazarPage'
import TownPage from './pages/town/TownPage'
import TradeCenterPage from './pages/town/TradeCenterPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import { SpeciesAdminPage, SpeciesFormPage, MassAddPage } from './pages/admin/species-management'
import { SubmissionManagerPage } from './pages/admin/submission-management'
import { UserManagerPage } from './pages/admin/user-management'
import { ItemManagerPage, ItemFormPage, ItemImageManagerPage, ItemRollerPage } from './pages/admin/item-management'
import InteractiveMapManagerPage from './pages/admin/interactive-map-manager'
import RerollerPage from './pages/admin/reroller'
import { RerollerSessionsPage } from './pages/admin/reroller'
import { AntiqueAppraisalEditorPage } from './pages/admin/antique-appraisal-editor'
import { AntiqueAuctionEditorPage } from './pages/admin/monster-trainer-management/antique-auction-editor'
import { ContentManagerPage } from './pages/admin/content-manager'
import { PromptManagerPage } from './pages/admin/prompt-management'
import { TownActivitiesEditorPage } from './pages/admin/town-activities-editor'
import { ShopManagerPage } from './pages/admin/shop-manager'
import { BossManagerPage } from './pages/admin/boss-manager'
import { DiscordAdventureManagerPage } from './pages/admin/adventure-management/discord-adventure-manager'
import { TrainerManagerPage } from './pages/admin/trainer-manager'
import { MonsterManagerPage } from './pages/admin/monster-manager'
import { LevelManagerPage } from './pages/admin/level-manager'
import { MonsterRollerPage } from './pages/admin/monster-roller'
import { StarterTestPage } from './pages/admin/starter-test'
import { MissionContentManagerPage } from './pages/admin/mission-content-manager'
import { PlayerMissionManagerPage } from './pages/admin/player-mission-manager'
import { AdventureLocationManagerPage } from './pages/admin/adventure-location-manager'
import { EventManagerPage } from './pages/admin/event-manager'
import { GardenManagerPage } from './pages/admin/garden-manager'
import { TrainerInventoryEditorPage } from './pages/admin/trainer-inventory-editor'
import InteractiveMapPage from './pages/guides-and-tools/guides/InteractiveMapPage'
import LandmassGuidePage from './pages/guides-and-tools/guides/LandmassGuidePage'
import RegionGuidePage from './pages/guides-and-tools/guides/RegionGuidePage'
import AreaGuidePage from './pages/guides-and-tools/guides/AreaGuidePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />

        {/* Auth Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="discord-auth-success" element={<DiscordAuthSuccess />} />

        {/* Fakedex Routes */}
        <Route path="fakedex" element={<FakemonDexPage />} />
        <Route path="fakedex/:id" element={<FakemonDetailPage />} />

        {/* Utility Routes */}
        <Route path="claim/:token" element={<RerollClaimPage />} />

        {/* Profile Routes */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/art-todo" element={<PersonalArtTodoPage />} />
        <Route path="profile/add-trainer" element={<AddTrainerPage />} />
        <Route path="profile/trainers" element={<MyTrainersPage />} />
        <Route path="profile/reference" element={<ReferenceTodoPage />} />
        <Route path="profile/reference/helper" element={<ReferenceHelperPage />} />
        <Route path="profile/trainers/:id/starter-selection" element={<StarterSelectionPage />} />
        <Route path="profile/schedule" element={<SchedulePage />} />
        <Route path="profile/tasks" element={<GameTasksPage />} />

        {/* Adventure Routes */}
        <Route path="adventures" element={<AdventuresPage />} />
        <Route path="adventures/rewards" element={<AdventureRewardsPage />} />
        <Route path="adventures/events" element={<EventsPage />} />
        <Route path="adventures/events/:eventId" element={<EventsPage />} />
        <Route path="adventures/missions/:missionId/start" element={<MissionStartPage />} />
        <Route path="adventures/faction-quests/:factionId" element={<FactionDetailPage />} />
        <Route path="adventures/:adventureId" element={<AdventurePage />} />

        {/* Boss Routes */}
        <Route path="boss" element={<BossViewPage />} />
        <Route path="boss/defeated/:bossId" element={<DefeatedBossDetailPage />} />

        {/* Guide Routes */}
        <Route path="guides" element={<GuidesIndexPage />} />
        <Route path="guides/detail/:guideId" element={<GuideDetailPage />} />
        <Route path="guides/type-calculator" element={<TypeCalculatorPage />} />
        <Route path="guides/ability-database" element={<AbilityDatabasePage />} />
        <Route path="guides/species-database" element={<SpeciesDatabasePage />} />
        <Route path="guides/evolution-explorer" element={<EvolutionExplorerPage />} />
        <Route path="guides/interactive-map" element={<InteractiveMapPage />} />
        <Route path="guides/interactive-map/landmass/:landmassId" element={<LandmassGuidePage />} />
        <Route path="guides/interactive-map/landmass/:landmassId/region/:regionId" element={<RegionGuidePage />} />
        <Route path="guides/interactive-map/landmass/:landmassId/region/:regionId/area/:areaId" element={<AreaGuidePage />} />
        <Route path="guides/:category/*" element={<GuideCategoryPage />} />
        <Route path="factions" element={<FactionsPage />} />
        <Route path="lore" element={<LorePage />} />
        <Route path="npcs" element={<NPCsPage />} />

        {/* Monster Routes */}
        <Route path="monsters/:id" element={<MonsterDetailPage />} />
        <Route path="monsters/:id/edit" element={<EditMonsterPage />} />

        {/* Trainer Routes */}
        <Route path="trainers" element={<TrainersPage />} />
        <Route path="trainers/:id" element={<TrainerDetailPage />} />
        <Route path="trainers/:id/edit" element={<EditTrainerPage />} />
        <Route path="trainers/:id/starters" element={<StarterSelectionPage />} />

        {/* Submission Routes */}
        <Route path="gallery" element={<SubmissionPage />} />
        <Route path="library" element={<SubmissionPage />} />
        <Route path="gallery/:id" element={<SubmissionDetailPage type="art" />} />
        <Route path="library/:id" element={<SubmissionDetailPage type="writing" />} />
        <Route path="submissions" element={<SubmissionPage />} />
        <Route path="submissions/art" element={<ArtSubmissionPage />} />
        <Route path="submissions/writing" element={<WritingSubmissionPage />} />
        <Route path="submissions/external/art" element={<ExternalArtSubmissionPage />} />
        <Route path="submissions/external/writing" element={<ExternalWritingSubmissionPage />} />
        <Route path="submissions/monster-reference" element={<MonsterReferenceSubmissionPage />} />
        <Route path="submissions/trainer-reference" element={<TrainerReferenceSubmissionPage />} />
        <Route path="submissions/mega-image-reference" element={<MegaImageReferenceSubmissionPage />} />
        <Route path="submissions/trainer-mega-reference" element={<TrainerMegaReferenceSubmissionPage />} />
        <Route path="submissions/prompt/:category" element={<PromptSubmissionPage />} />
        <Route path="submissions/:id" element={<SubmissionDetailPage />} />

        {/* Admin Routes */}
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="admin/species/fakemon/mass-add" element={<MassAddPage />} />
        <Route path="admin/species/:franchise" element={<SpeciesAdminPage />} />
        <Route path="admin/species/:franchise/add" element={<SpeciesFormPage />} />
        <Route path="admin/species/:franchise/edit/:id" element={<SpeciesFormPage />} />
        <Route path="admin/submission-manager" element={<SubmissionManagerPage />} />
        <Route path="admin/user-manager" element={<UserManagerPage />} />
        <Route path="admin/item-manager" element={<ItemManagerPage />} />
        <Route path="admin/item-manager/add" element={<ItemFormPage />} />
        <Route path="admin/item-manager/edit/:id" element={<ItemFormPage />} />
        <Route path="admin/item-image-manager" element={<ItemImageManagerPage />} />
        <Route path="admin/item-roller" element={<ItemRollerPage />} />
        <Route path="admin/interactive-map-manager" element={<InteractiveMapManagerPage />} />
        <Route path="admin/reroller" element={<RerollerPage />} />
        <Route path="admin/reroller/sessions" element={<RerollerSessionsPage />} />
        <Route path="admin/antique-appraisal-editor" element={<AntiqueAppraisalEditorPage />} />
        <Route path="admin/antique-auction-editor" element={<AntiqueAuctionEditorPage />} />
        <Route path="admin/content-manager" element={<ContentManagerPage />} />
        <Route path="admin/prompt-manager" element={<PromptManagerPage />} />
        <Route path="admin/town-activities-editor" element={<TownActivitiesEditorPage />} />
        <Route path="admin/shop-manager" element={<ShopManagerPage />} />
        <Route path="admin/boss-manager" element={<BossManagerPage />} />
        <Route path="admin/discord-adventure-manager" element={<DiscordAdventureManagerPage />} />
        <Route path="admin/trainer-manager" element={<TrainerManagerPage />} />
        <Route path="admin/trainer-monster-manager" element={<MonsterManagerPage />} />
        <Route path="admin/level-manager" element={<LevelManagerPage />} />
        <Route path="admin/monster-roller" element={<MonsterRollerPage />} />
        <Route path="admin/starter-test" element={<StarterTestPage />} />
        <Route path="admin/mission-content-manager" element={<MissionContentManagerPage />} />
        <Route path="admin/player-mission-manager" element={<PlayerMissionManagerPage />} />
        <Route path="admin/adventure-location-manager" element={<AdventureLocationManagerPage />} />
        <Route path="admin/event-manager" element={<EventManagerPage />} />
        <Route path="admin/garden-manager" element={<GardenManagerPage />} />
        <Route path="admin/trainer-inventory-editor" element={<TrainerInventoryEditorPage />} />

        {/* Statistics Routes */}
        <Route path="statistics" element={<StatisticsPage />} />

        {/* Toys Routes */}
        <Route path="toys" element={<ToysPage />} />
        <Route path="toys/who-should-i-draw" element={<WhoShouldIDrawPage />} />
        <Route path="toys/character-card-creator" element={<CharacterCardCreatorPage />} />

        {/* Town Hub */}
        <Route path="town" element={<TownPage />} />

        {/* Town / Market Routes */}
        <Route path="town/market" element={<MarketPage />} />
        <Route path="town/market/:shopId" element={<ShopPage />} />
        <Route path="town/apothecary" element={<ApothecaryPage />} />
        <Route path="town/bakery" element={<BakeryPage />} />
        <Route path="town/visit/witchs-hut" element={<WitchsHutPage />} />
        <Route path="town/mega-mart" element={<MegaMartPage />} />
        <Route path="town/visit/antique-store" element={<AntiqueStorePage />} />

        {/* Town / Other Routes */}
        <Route path="town/adoption" element={<AdoptionPage />} />
        <Route path="town/bazar" element={<BazarPage />} />
        <Route path="town/trade" element={<TradeCenterPage />} />

        {/* Town / Activity Routes */}
        <Route path="town/activities/garden" element={<GardenPage />} />
        <Route path="town/activities/garden/harvest" element={<GardenHarvestPage />} />
        <Route path="town/activities/pirates-dock" element={<PiratesDockPage />} />
        <Route path="town/activities/farm" element={<FarmPage />} />
        <Route path="town/activities/game-corner" element={<GameCornerPage />} />
        <Route path="town/activities/nursery" element={<NurseryPage />} />
        <Route path="town/activities/nursery/session/:sessionId" element={<NurserySessionPage />} />
        <Route path="town/activities/session/:sessionId" element={<ActivitySessionPage />} />
        <Route path="town/activities/rewards/:sessionId" element={<ActivityRewardsPage />} />

        <Route path="under-construction" element={<UnderConstructionPage />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
