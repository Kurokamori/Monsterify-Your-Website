import { useNavigate } from 'react-router-dom';
import { AutoStateContainer } from '@components/common/StateContainer';
import { TabContainer, type Tab } from '@components/common/TabContainer';
import { ItemDetailModal } from '@components/items/ItemDetailModal';
import MassEditModal from '@components/trainers/MassEditModal';
import { useTrainerDetail } from '@components/trainers/detail/useTrainerDetail';
import { TrainerDetailHeader } from '@components/trainers/detail/TrainerDetailHeader';
import { ProfileTab } from '@components/trainers/detail/tabs/ProfileTab';
import { PCBoxTab } from '@components/trainers/detail/tabs/PCBoxTab';
import { AllBoxesTab } from '@components/trainers/detail/tabs/AllBoxesTab';
import { InventoryTab } from '@components/trainers/detail/tabs/InventoryTab';
import { StatsTab } from '@components/trainers/detail/tabs/StatsTab';
import { AchievementsTab } from '@components/trainers/detail/tabs/AchievementsTab';
import { RelationsTab } from '@components/trainers/detail/tabs/RelationsTab';
import { AdditionalRefsTab } from '@components/trainers/detail/tabs/AdditionalRefsTab';
import { MegaInfoTab } from '@components/trainers/detail/tabs/MegaInfoTab';
import { EditBoxesTab } from '@components/trainers/detail/tabs/EditBoxesTab';

const TrainerDetailPage = () => {
  const navigate = useNavigate();
  const detail = useTrainerDetail();

  const {
    trainer, monsters, galleryImages, loading, error, isOwner, filteredMonsters,
    activeTab, setActiveTab,
    currentPCBox, setCurrentPCBox, searchTerm, setSearchTerm, viewMode, setViewMode,
    getMaxBoxNumber, getBoxMonsters, getBoxMonstersForDisplay, getFilteredBoxMonsters,
    featuredMonsters, setFeaturedMonsters,
    featuredMonstersCollapsed, setFeaturedMonstersCollapsed,
    isSaving, statusMessage, statusType, setStatusMessage, setStatusType,
    handleDragStart, handleDragOver, handleDragEnter, handleDragLeave, handleDrop, handleDragEnd,
    handleFeaturedDrop, handleFeaturedDragOver, handleFeaturedDragLeave,
    handleSaveBoxes, handleSaveFeaturedMonsters, handleAddBox,
    inventoryData, isItemDetailModalOpen, setIsItemDetailModalOpen, selectedItemForDetail,
    handleItemDetailClick, getItemImageUrl,
    achievements, achievementStats, achievementsLoading, achievementFilter, setAchievementFilter,
    handleClaimAchievement, handleClaimAllAchievements, isClaimingAll,
    showRewardPopup, setShowRewardPopup, rewardPopupData,
    showMassEditModal, setShowMassEditModal, handleOpenMassEdit, handleMassEditComplete,
    relatedTrainers, relatedMonsters,
    showImageModal, modalImageSrc, modalImageAlt, handleImageClick, closeImageModal,
    fetchTrainerData, id,
  } = detail;

  // Build tabs array
  const tabs: Tab[] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: 'fas fa-user',
      content: trainer ? (
        <ProfileTab
          trainer={trainer}
          featuredMonsters={featuredMonsters}
          featuredMonstersCollapsed={featuredMonstersCollapsed}
          setFeaturedMonstersCollapsed={setFeaturedMonstersCollapsed}
          monstersCount={monsters.length}
          setActiveTab={setActiveTab}
          handleImageClick={handleImageClick}
        />
      ) : null,
    },
    {
      key: 'pc',
      label: 'PC Box',
      icon: 'fas fa-box',
      content: (
        <PCBoxTab
          monsters={monsters}
          filteredMonsters={filteredMonsters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentPCBox={currentPCBox}
          setCurrentPCBox={setCurrentPCBox}
          getMaxBoxNumber={getMaxBoxNumber}
          getBoxMonstersForDisplay={getBoxMonstersForDisplay}
          getFilteredBoxMonsters={getFilteredBoxMonsters}
        />
      ),
    },
    {
      key: 'boxes',
      label: 'All Boxes',
      icon: 'fas fa-boxes',
      content: (
        <AllBoxesTab
          monsters={monsters}
          filteredMonsters={filteredMonsters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isOwner={isOwner}
          getMaxBoxNumber={getMaxBoxNumber}
          getBoxMonstersForDisplay={getBoxMonstersForDisplay}
          getFilteredBoxMonsters={getFilteredBoxMonsters}
          setCurrentPCBox={setCurrentPCBox}
          setActiveTab={setActiveTab}
          handleOpenMassEdit={handleOpenMassEdit}
        />
      ),
    },
    {
      key: 'inventory',
      label: 'Inventory',
      icon: 'fas fa-backpack',
      content: (
        <InventoryTab
          inventoryData={inventoryData}
          getItemImageUrl={getItemImageUrl}
          handleItemDetailClick={handleItemDetailClick}
        />
      ),
    },
    {
      key: 'stats',
      label: 'Stats',
      icon: 'fas fa-chart-bar',
      content: trainer ? <StatsTab trainer={trainer} monsters={monsters} /> : null,
    },
    {
      key: 'achievements',
      label: 'Achievements',
      icon: 'fas fa-trophy',
      content: (
        <AchievementsTab
          achievements={achievements}
          achievementStats={achievementStats}
          achievementsLoading={achievementsLoading}
          achievementFilter={achievementFilter}
          setAchievementFilter={setAchievementFilter}
          isOwner={isOwner}
          isClaimingAll={isClaimingAll}
          handleClaimAchievement={handleClaimAchievement}
          handleClaimAllAchievements={handleClaimAllAchievements}
        />
      ),
    },
    {
      key: 'relations',
      label: 'Relations',
      icon: 'fas fa-users',
      content: trainer ? (
        <RelationsTab
          trainer={trainer}
          relatedTrainers={relatedTrainers}
          relatedMonsters={relatedMonsters}
        />
      ) : null,
    },
    {
      key: 'refs',
      label: 'Additional Refs',
      icon: 'fas fa-images',
      content: trainer ? (
        <AdditionalRefsTab trainer={trainer} galleryImages={galleryImages} handleImageClick={handleImageClick} />
      ) : null,
    },
    {
      key: 'mega',
      label: 'Mega Info',
      icon: 'fas fa-dna',
      content: trainer ? <MegaInfoTab trainer={trainer} /> : null,
    },
  ];

  // Owner-only tabs
  if (isOwner) {
    tabs.push({
      key: 'edit-boxes',
      label: 'Edit Boxes',
      icon: 'fas fa-edit',
      content: (
        <EditBoxesTab
          featuredMonsters={featuredMonsters}
          setFeaturedMonsters={setFeaturedMonsters}
          isSaving={isSaving}
          statusMessage={statusMessage}
          statusType={statusType}
          getMaxBoxNumber={getMaxBoxNumber}
          getBoxMonsters={getBoxMonsters}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragEnter={handleDragEnter}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          handleFeaturedDrop={handleFeaturedDrop}
          handleFeaturedDragOver={handleFeaturedDragOver}
          handleFeaturedDragLeave={handleFeaturedDragLeave}
          handleSaveBoxes={handleSaveBoxes}
          handleSaveFeaturedMonsters={handleSaveFeaturedMonsters}
          handleAddBox={handleAddBox}
          setActiveTab={setActiveTab}
          setStatusMessage={setStatusMessage}
          setStatusType={setStatusType}
        />
      ),
    });
  }

  return (
    <AutoStateContainer
      loading={loading}
      error={error}
      isEmpty={!trainer}
      onRetry={fetchTrainerData}
      loadingMessage="Loading trainer data..."
      emptyMessage="Trainer not found. The trainer you're looking for might not exist or has been removed."
      emptyIcon="fas fa-user-slash"
      emptyContent={
        <div className="state-container__empty">
          <i className="fas fa-user-slash state-container__empty-icon"></i>
          <p className="state-container__empty-message">Trainer not found.</p>
          <button onClick={() => navigate('/trainers')} className="button secondary">
            Back to Trainers
          </button>
        </div>
      }
    >
      <div className="edit-monster-container">
        {trainer && <TrainerDetailHeader trainer={trainer} isOwner={isOwner} />}

        <TabContainer
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
          lazy
        />

        {/* Item Detail Modal */}
        <ItemDetailModal
          isOpen={isItemDetailModalOpen}
          onClose={() => setIsItemDetailModalOpen(false)}
          item={selectedItemForDetail}
        />

        {/* Achievement Reward Popup */}
        {showRewardPopup && rewardPopupData && (
          <div className="achievement-reward-popup-overlay" onClick={() => setShowRewardPopup(false)}>
            <div className="achievement-reward-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <h2>{rewardPopupData.isBulk ? 'Achievements Claimed!' : 'Achievement Unlocked!'}</h2>
                <button className="button danger icon sm no-flex" onClick={() => setShowRewardPopup(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="popup-content">
                {rewardPopupData.isBulk ? (
                  <div>
                    <div className="bulk-stats">
                      <div className="bulk-stat-item">
                        <i className="fas fa-trophy"></i>
                        <span>{rewardPopupData.claimedCount} Achievements Claimed</span>
                      </div>
                    </div>
                    {rewardPopupData.claimedAchievements && rewardPopupData.claimedAchievements.length > 0 && (
                      <div className="claimed-achievements-list">
                        <h4>Claimed Achievements:</h4>
                        <div className="claimed-achievements-scroll">
                          {rewardPopupData.claimedAchievements.map((a, i) => (
                            <div key={i} className="claimed-achievement-item">
                              <span className="achievement-name-small">{a.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {rewardPopupData.totalRewards && (
                      <div className="rewards-section">
                        <h4>Total Rewards Earned:</h4>
                        <div className="rewards-list">
                          {rewardPopupData.totalRewards.currency && (
                            <div className="reward-item-popup">
                              <i className="fas fa-coins reward-icon"></i>
                              <span className="reward-text">{rewardPopupData.totalRewards.currency} Coins</span>
                            </div>
                          )}
                          {rewardPopupData.totalRewards.items?.map((item, i) => (
                            <div key={i} className="reward-item-popup">
                              <i className="fas fa-gift reward-icon"></i>
                              <span className="reward-text">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="trainer-detail__map-header">
                    {rewardPopupData.achievement && (
                      <>
                        <h3 className="achievement-name-popup">{rewardPopupData.achievement.name}</h3>
                        <p className="achievement-description-popup">{rewardPopupData.achievement.description}</p>
                      </>
                    )}
                    {rewardPopupData.rewards && (
                      <div className="rewards-section">
                        <h4>Rewards Earned:</h4>
                        <div className="rewards-list">
                          {rewardPopupData.rewards.currency && (
                            <div className="reward-item-popup">
                              <i className="fas fa-coins reward-icon"></i>
                              <span className="reward-text">{rewardPopupData.rewards.currency} Coins</span>
                            </div>
                          )}
                          {rewardPopupData.rewards.item && (
                            <div className="reward-item-popup">
                              <i className="fas fa-gift reward-icon"></i>
                              <span className="reward-text">{rewardPopupData.rewards.item}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="popup-footer">
                <button className="button primary" onClick={() => setShowRewardPopup(false)}>
                  Awesome!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mass Edit Modal */}
        <MassEditModal
          isOpen={showMassEditModal}
          onClose={() => setShowMassEditModal(false)}
          monsters={monsters}
          trainerId={id || ''}
          onComplete={handleMassEditComplete}
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
                  target.src = '/images/default_trainer.png';
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AutoStateContainer>
  );
};

export default TrainerDetailPage;
