import { useNavigate } from 'react-router-dom';
import { AutoStateContainer } from '@components/common/StateContainer';
import { TabContainer, type Tab } from '@components/common/TabContainer';
import { useMonsterDetail } from '@components/monsters/detail/useMonsterDetail';
import { MonsterDetailHeader } from '@components/monsters/detail/MonsterDetailHeader';
import { ProfileTab } from '@components/monsters/detail/tabs/ProfileTab';
import { StatsTab } from '@components/monsters/detail/tabs/StatsTab';
import { MovesTab } from '@components/monsters/detail/tabs/MovesTab';
import { EvolutionTab } from '@components/monsters/detail/tabs/EvolutionTab';
import { BiographyTab } from '@components/monsters/detail/tabs/BiographyTab';
import { GalleryTab } from '@components/monsters/detail/tabs/GalleryTab';
import { LineageTab } from '@components/monsters/detail/tabs/LineageTab';
import { MegaEvolutionTab } from '@components/monsters/detail/tabs/MegaEvolutionTab';

const MonsterDetailPage = () => {
  const navigate = useNavigate();
  const detail = useMonsterDetail();

  const {
    monster,
    trainer,
    moves,
    evolutionChain,
    galleryImages,
    lineage,
    loading,
    error,
    isOwner,
    prevMonster,
    nextMonster,
    megaImages,
    relationEntities,
    activeTab,
    setActiveTab,
    monsterId,
    showEditLineage,
    setShowEditLineage,
    newRelationshipType,
    setNewRelationshipType,
    monsterSearch,
    setMonsterSearch,
    relationshipNotes,
    setRelationshipNotes,
    searchResults,
    selectedMonster,
    selectMonster,
    removeLineageRelationship,
    addLineageRelationship,
    showEvolutionEditor,
    setShowEvolutionEditor,
    evolutionSaving,
    handleSaveEvolution,
    showImageModal,
    modalImageSrc,
    modalImageAlt,
    handleImageClick,
    closeImageModal,
    fetchMonsterData,
  } = detail;

  // Build tabs
  const tabs: Tab[] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: 'fas fa-id-card',
      content: monster ? <ProfileTab monster={monster} /> : null,
    },
    {
      key: 'stats',
      label: 'Stats',
      icon: 'fas fa-chart-bar',
      content: monster ? <StatsTab monster={monster} /> : null,
    },
    {
      key: 'moves',
      label: 'Moves',
      icon: 'fas fa-fist-raised',
      content: <MovesTab moves={moves} />,
    },
    {
      key: 'evolution',
      label: 'Evolution',
      icon: 'fas fa-dna',
      content: (
        <EvolutionTab
          monsterId={monsterId}
          evolutionChain={evolutionChain}
          isOwner={isOwner}
          showEvolutionEditor={showEvolutionEditor}
          setShowEvolutionEditor={setShowEvolutionEditor}
          evolutionSaving={evolutionSaving}
          handleSaveEvolution={handleSaveEvolution}
        />
      ),
    },
    {
      key: 'bio',
      label: 'Biography',
      icon: 'fas fa-book',
      content: monster ? (
        <BiographyTab monster={monster} relationEntities={relationEntities} />
      ) : null,
    },
    {
      key: 'gallery',
      label: 'Gallery',
      icon: 'fas fa-images',
      content: monster ? (
        <GalleryTab
          monster={monster}
          galleryImages={galleryImages}
          handleImageClick={handleImageClick}
        />
      ) : null,
    },
    {
      key: 'lineage',
      label: 'Lineage',
      icon: 'fas fa-sitemap',
      content: monster ? (
        <LineageTab
          monster={monster}
          lineage={lineage}
          isOwner={isOwner}
          showEditLineage={showEditLineage}
          setShowEditLineage={setShowEditLineage}
          newRelationshipType={newRelationshipType}
          setNewRelationshipType={setNewRelationshipType}
          monsterSearch={monsterSearch}
          setMonsterSearch={setMonsterSearch}
          relationshipNotes={relationshipNotes}
          setRelationshipNotes={setRelationshipNotes}
          searchResults={searchResults}
          selectedMonster={selectedMonster}
          selectMonster={selectMonster}
          removeLineageRelationship={removeLineageRelationship}
          addLineageRelationship={addLineageRelationship}
        />
      ) : null,
    },
  ];

  // Conditional Mega Evolution tab
  if (monster?.has_mega_stone && (monster.level as number) >= 100) {
    tabs.push({
      key: 'mega',
      label: 'Mega Evolution',
      icon: 'fas fa-bolt',
      content: <MegaEvolutionTab monster={monster} megaImages={megaImages} />,
    });
  }

  return (
    <AutoStateContainer
      loading={loading}
      error={error}
      isEmpty={!monster}
      onRetry={fetchMonsterData}
      loadingMessage="Loading monster data..."
      emptyMessage="Monster not found. The monster you're looking for might not exist or has been removed."
      emptyIcon="fas fa-dragon"
      emptyContent={
        <div className="state-container__empty">
          <i className="fas fa-dragon state-container__empty-icon"></i>
          <p className="state-container__empty-message">Monster not found.</p>
          <button onClick={() => navigate(-1)} className="button secondary">
            Go Back
          </button>
        </div>
      }
    >
      <div className="edit-monster-container">
        {monster && (
          <MonsterDetailHeader
            monster={monster}
            trainer={trainer}
            isOwner={isOwner}
            prevMonster={prevMonster}
            nextMonster={nextMonster}
          />
        )}

        <TabContainer
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          align="center"
          variant="underline"
          lazy
        />

        {/* Image Modal */}
        {showImageModal && (
          <div className="image-modal-overlay" onClick={closeImageModal}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="button danger icon sm no-flex" onClick={closeImageModal}>
                <i className="fas fa-times"></i>
              </button>
              <img
                src={modalImageSrc}
                alt={modalImageAlt}
                className="image-modal-img"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/default_mon.png';
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AutoStateContainer>
  );
};

export default MonsterDetailPage;
