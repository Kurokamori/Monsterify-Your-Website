import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import trainerService, { type TrainerMonster } from '@services/trainerService';
import monsterService from '@services/monsterService';
import itemsService, { type Item } from '@services/itemsService';
import type { ItemDetailData } from '@components/items/ItemDetailModal';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import type { Trainer, TrainerRelation } from '@components/trainers/types/Trainer';

// --- Types ---

export interface FeaturedMonster extends TrainerMonster {
  display_order?: number;
  image_url?: string;
}

export interface Achievement {
  id: number;
  name: string;
  description?: string;
  category?: string;
  progress?: number;
  target?: number;
  unlocked?: boolean;
  claimed?: boolean;
  canClaim?: boolean;
  reward_currency?: number;
  reward_item?: string;
  [key: string]: unknown;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  claimed: number;
  unclaimed: number;
  [key: string]: unknown;
}

export interface RewardPopupData {
  isBulk?: boolean;
  achievement?: Achievement;
  rewards?: { currency?: number; item?: string };
  claimedCount?: number;
  claimedAchievements?: Achievement[];
  totalRewards?: { currency?: number; items?: string[] };
  message?: string;
}

interface InventoryData {
  [category: string]: Record<string, number>;
}

// --- Helper functions ---

export function toTitleCase(str: string | undefined | null): string {
  if (!str) return '';
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatMonsterData(monster: TrainerMonster): TrainerMonster {
  if (!monster) return monster;
  const formatted = { ...monster };

  const speciesFields = ['species1', 'species2', 'species3'] as const;
  const typeFields = ['type1', 'type2', 'type3', 'type4', 'type5'] as const;

  for (const field of speciesFields) {
    if (formatted[field]) formatted[field] = toTitleCase(formatted[field] as string);
  }
  for (const field of typeFields) {
    if (formatted[field]) formatted[field] = toTitleCase(formatted[field] as string);
  }
  if (formatted.attribute) formatted.attribute = toTitleCase(formatted.attribute as string);

  return formatted;
}

export function calculateDisplayAge(ageValue: string | number | undefined, birthday?: string): string | number | null {
  if (!ageValue) return null;
  const ageStr = String(ageValue).trim();

  if (!/^\d+$/.test(ageStr)) return ageStr;

  if (birthday) {
    const parts = birthday.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const today = new Date();
      let age = today.getFullYear() - parts[0];
      const monthDiff = today.getMonth() + 1 - parts[1];
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parts[2])) {
        age--;
      }
      return age;
    }
  }

  return ageStr;
}

// --- Hook ---

export function useTrainerDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Core data
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [monsters, setMonsters] = useState<TrainerMonster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state - controlled via URL
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = useCallback((tab: string) => {
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  // PC box state
  const [currentPCBox, setCurrentPCBox] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Edit boxes state
  const [boxMonsters, setBoxMonsters] = useState<TrainerMonster[]>([]);
  const [featuredMonsters, setFeaturedMonsters] = useState<(FeaturedMonster | null)[]>(
    Array.from({ length: 6 }, () => null)
  );
  const [featuredMonstersLoaded, setFeaturedMonstersLoaded] = useState(false);
  const [draggedMonster, setDraggedMonster] = useState<TrainerMonster | null>(null);
  const [dragSourceBox, setDragSourceBox] = useState<number | null>(null);
  const [dragSourceSlot, setDragSourceSlot] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [additionalBoxes, setAdditionalBoxes] = useState(0);
  const [featuredMonstersCollapsed, setFeaturedMonstersCollapsed] = useState(false);

  // Inventory state
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [inventoryItemDetails, setInventoryItemDetails] = useState<Record<string, Item>>({});
  const [isItemDetailModalOpen, setIsItemDetailModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<ItemDetailData | null>(null);

  // Achievement state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementStats, setAchievementStats] = useState<AchievementStats | null>(null);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState('all');

  // Reward popup state
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardPopupData, setRewardPopupData] = useState<RewardPopupData | null>(null);
  const [isClaimingAll, setIsClaimingAll] = useState(false);

  // Mass edit state
  const [showMassEditModal, setShowMassEditModal] = useState(false);
  const [trainerInventory, setTrainerInventory] = useState<Record<string, Record<string, number>>>({});

  // Relations state
  const [relatedTrainers, setRelatedTrainers] = useState<Record<string, Trainer>>({});
  const [relatedMonsters, setRelatedMonsters] = useState<Record<string, unknown>>({});

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');

  // Document title
  useDocumentTitle(trainer ? trainer.name : 'Trainer');

  // --- Computed values ---

  const isOwner = useMemo(() => {
    if (!currentUser || !trainer) return false;
    return (
      String(currentUser.id) === String(trainer.player_user_id) ||
      currentUser.username === trainer.player_user_id ||
      (!!currentUser.email && currentUser.email === trainer.player_user_id) ||
      (!!currentUser.discord_id && currentUser.discord_id === trainer.player_user_id) ||
      currentUser.is_admin === true
    );
  }, [currentUser, trainer]);

  const filteredMonsters = useMemo(() => {
    if (!searchTerm) return monsters;
    const term = searchTerm.toLowerCase();
    return monsters.filter(m =>
      m.name?.toLowerCase().includes(term) ||
      (m.species1 as string | undefined)?.toLowerCase().includes(term) ||
      (m.species2 as string | undefined)?.toLowerCase().includes(term) ||
      (m.species3 as string | undefined)?.toLowerCase().includes(term) ||
      (m.type1 as string | undefined)?.toLowerCase().includes(term) ||
      (m.type2 as string | undefined)?.toLowerCase().includes(term) ||
      (m.type3 as string | undefined)?.toLowerCase().includes(term) ||
      (m.type4 as string | undefined)?.toLowerCase().includes(term) ||
      (m.type5 as string | undefined)?.toLowerCase().includes(term)
    );
  }, [monsters, searchTerm]);

  // --- Box helper functions ---

  const getMaxBoxNumber = useCallback(() => {
    if (searchTerm) {
      return Math.max(1, Math.ceil(filteredMonsters.length / 30));
    }
    let maxBox = 0;
    if (boxMonsters.length > 0) {
      maxBox = Math.max(...boxMonsters.map(m =>
        m && m.box_number != null ? m.box_number : 0
      ));
    }
    return Math.max(maxBox, additionalBoxes) + 1;
  }, [searchTerm, filteredMonsters.length, boxMonsters, additionalBoxes]);

  const getBoxMonsters = useCallback((boxIndex: number): (TrainerMonster | null)[] => {
    const boxSlots: (TrainerMonster | null)[] = new Array(30).fill(null);
    boxMonsters.forEach(monster => {
      if (monster &&
        monster.box_number === boxIndex &&
        monster.trainer_index != null &&
        (monster.trainer_index as number) >= 0 &&
        (monster.trainer_index as number) < 30) {
        boxSlots[monster.trainer_index as number] = monster;
      }
    });
    return boxSlots;
  }, [boxMonsters]);

  const getBoxMonstersForDisplay = useCallback((boxIndex: number): (TrainerMonster | null)[] => {
    const boxSlots: (TrainerMonster | null)[] = new Array(30).fill(null);
    filteredMonsters.forEach(monster => {
      if (monster &&
        monster.box_number === boxIndex &&
        monster.trainer_index != null &&
        (monster.trainer_index as number) >= 0 &&
        (monster.trainer_index as number) < 30) {
        boxSlots[monster.trainer_index as number] = monster;
      }
    });
    return boxSlots;
  }, [filteredMonsters]);

  const getFilteredBoxMonsters = useCallback((boxIndex: number): (TrainerMonster | null)[] => {
    const boxSlots: (TrainerMonster | null)[] = new Array(30).fill(null);
    const startIndex = boxIndex * 30;
    const monstersForBox = filteredMonsters.slice(startIndex, startIndex + 30);
    monstersForBox.forEach((monster, index) => {
      boxSlots[index] = monster;
    });
    return boxSlots;
  }, [filteredMonsters]);

  // --- Data fetching ---

  const fetchTrainerData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const trainerData = await trainerService.getTrainer(id);

      const monstersResponse = await trainerService.getTrainerMonsters(id, { limit: 1000 });
      const rawMonsters = monstersResponse.monsters || [];
      const formattedMonsters = rawMonsters.map(m => formatMonsterData(m));
      setMonsters(formattedMonsters);

      if (trainerData) {
        // Fetch inventory
        try {
          const invResponse = await trainerService.getTrainerInventory(id);
          const invData = invResponse as unknown as { success?: boolean; data?: InventoryData };
          if (invData?.success && invData.data) {
            setInventoryData(invData.data);
            // Fetch item details
            fetchInventoryItemDetails(invData.data);
          }
        } catch (e) {
          console.error('Error fetching inventory:', e);
        }

        // Parse additional_refs
        if (trainerData.additional_refs) {
          if (typeof trainerData.additional_refs === 'string') {
            try {
              trainerData.additional_refs = JSON.parse(trainerData.additional_refs);
            } catch {
              trainerData.additional_refs = [];
            }
          }
          if (!Array.isArray(trainerData.additional_refs)) {
            trainerData.additional_refs = [];
          }
        }

        setTrainer(trainerData);
      } else {
        setTrainer(null);
      }
    } catch (err) {
      console.error(`Error fetching trainer ${id}:`, err);
      setError('Failed to load trainer data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchInventoryItemDetails = async (inventory: InventoryData) => {
    const itemDetails: Record<string, Item> = {};
    const allItemNames = new Set<string>();
    Object.values(inventory).forEach(category => {
      if (category && typeof category === 'object') {
        Object.keys(category).forEach(name => allItemNames.add(name));
      }
    });

    for (const itemName of allItemNames) {
      try {
        const response = await itemsService.getItems({ search: itemName, limit: 50 });
        if (response.data?.length > 0) {
          const found = response.data.find(item =>
            item.name.toLowerCase() === itemName.toLowerCase()
          );
          if (found) itemDetails[itemName] = found;
        }
      } catch {
        // skip individual item fetch errors
      }
    }
    setInventoryItemDetails(itemDetails);
  };

  const fetchAchievements = useCallback(async () => {
    if (!id) return;
    try {
      setAchievementsLoading(true);
      const response = await trainerService.getAchievements(id);
      if (response.success) {
        setAchievements(response.data?.achievements || []);
        const statsResponse = await trainerService.getAchievementStats(id);
        if (statsResponse.success) {
          setAchievementStats(statsResponse.data?.stats || null);
        }
      }
    } catch {
      setAchievements([]);
      setAchievementStats(null);
    } finally {
      setAchievementsLoading(false);
    }
  }, [id]);

  const fetchRelatedEntities = useCallback(async () => {
    if (!trainer?.relations) return;
    try {
      const relations: TrainerRelation[] = typeof trainer.relations === 'string'
        ? JSON.parse(trainer.relations)
        : trainer.relations;
      if (!Array.isArray(relations)) return;

      const trainersData: Record<string, Trainer> = {};
      const monstersData: Record<string, unknown> = {};

      // Relations are stored with trainer_id and monster_id fields (not target_id)
      const trainerRelations = relations.filter(r => r.type === 'trainer');
      const monsterRelations = relations.filter(r => r.type === 'monster');

      for (const rel of trainerRelations) {
        const tid = (rel as unknown as Record<string, unknown>).trainer_id || rel.target_id;
        if (!tid) continue;
        try {
          const t = await trainerService.getTrainer(tid as number);
          if (t) trainersData[String(tid)] = t;
        } catch { /* skip */ }
      }

      for (const rel of monsterRelations) {
        const mid = (rel as unknown as Record<string, unknown>).monster_id || rel.target_id;
        if (!mid) continue;
        try {
          const response = await monsterService.getMonsterById(mid as number);
          if (response?.success && response.data) {
            monstersData[String(mid)] = response.data;
          }
        } catch { /* skip */ }
      }

      setRelatedTrainers(trainersData);
      setRelatedMonsters(monstersData);
    } catch {
      // parse error
    }
  }, [trainer]);

  // --- Achievement handlers ---

  const handleClaimAchievement = useCallback(async (achievementId: number) => {
    if (!id) return;
    try {
      const response = await trainerService.claimAchievement(id, achievementId);
      if (response.success) {
        setRewardPopupData({
          achievement: response.data.achievement,
          rewards: response.data.rewards,
        });
        setShowRewardPopup(true);

        setAchievements(prev => prev.map(a =>
          a.id === achievementId ? { ...a, claimed: true, canClaim: false } : a
        ));

        if (response.data.rewards?.currency) {
          setTrainer(prev => prev ? {
            ...prev,
            currency_amount: (prev.currency_amount || 0) + response.data.rewards.currency,
            total_earned_currency: (prev.total_earned_currency || 0) + response.data.rewards.currency,
          } : prev);
        }

        setAchievementStats(prev => prev ? {
          ...prev,
          claimed: prev.claimed + 1,
          unclaimed: prev.unclaimed - 1,
        } : prev);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setStatusMessage(axiosErr.response?.data?.message || 'Failed to claim achievement');
      setStatusType('error');
    }
  }, [id]);

  const handleClaimAllAchievements = useCallback(async () => {
    if (!id) return;
    try {
      setIsClaimingAll(true);
      const response = await trainerService.claimAllAchievements(id);
      if (response.success) {
        setRewardPopupData({
          isBulk: true,
          claimedCount: response.data.claimedCount,
          claimedAchievements: response.data.claimedAchievements,
          totalRewards: response.data.totalRewards,
          message: response.message,
        });
        setShowRewardPopup(true);

        setAchievements(prev => prev.map(a => {
          const wasClaimed = response.data.claimedAchievements?.some(
            (c: Achievement) => c.id === a.id
          );
          return wasClaimed ? { ...a, claimed: true, canClaim: false } : a;
        }));

        if (response.data.totalRewards?.currency > 0) {
          setTrainer(prev => prev ? {
            ...prev,
            currency_amount: (prev.currency_amount || 0) + response.data.totalRewards.currency,
            total_earned_currency: (prev.total_earned_currency || 0) + response.data.totalRewards.currency,
          } : prev);
        }

        if (achievementStats && response.data.claimedCount > 0) {
          setAchievementStats(prev => prev ? {
            ...prev,
            claimed: prev.claimed + response.data.claimedCount,
            unclaimed: prev.unclaimed - response.data.claimedCount,
          } : prev);
        }
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setStatusMessage(axiosErr.response?.data?.message || 'Failed to claim achievements');
      setStatusType('error');
    } finally {
      setIsClaimingAll(false);
    }
  }, [id, achievementStats]);

  // --- Item detail handler ---

  const handleItemDetailClick = useCallback(async (itemName: string, category: string) => {
    const itemToDetailData = (item: Item): ItemDetailData => ({
      id: String(item.id),
      name: item.name,
      description: item.description,
      effect: item.effect,
      category: item.category,
      rarity: item.rarity,
      image_url: item.image_url,
      image_path: item.image_path,
    });

    try {
      const response = await itemsService.getItems({ search: itemName, limit: 50 });
      let foundItem: Item | null = null;
      if (response.data?.length > 0) {
        foundItem = response.data.find(item =>
          item.name.toLowerCase() === itemName.toLowerCase()
        ) || response.data[0];
      }
      setSelectedItemForDetail(foundItem ? itemToDetailData(foundItem) : {
        name: itemName,
        category: category || 'items',
        description: `Information about ${itemName}`,
        effect: `Item effect for ${itemName}`,
      });
      setIsItemDetailModalOpen(true);
    } catch {
      setSelectedItemForDetail({
        name: itemName,
        category: category || 'items',
        description: `Information about ${itemName}`,
      });
      setIsItemDetailModalOpen(true);
    }
  }, []);

  const getItemImageUrl = useCallback((itemName: string, category: string = 'items'): string => {
    const detail = inventoryItemDetails[itemName];
    if (detail?.image_url) return detail.image_url;
    if (category === 'keyitems') {
      return `/images/items/keyitems/${itemName.toLowerCase().replace(/\s+/g, '_')}.png`;
    }
    return `/images/items/${itemName.toLowerCase().replace(/\s+/g, '_')}.png`;
  }, [inventoryItemDetails]);

  // --- Mass edit ---

  const handleOpenMassEdit = useCallback(async () => {
    if (!id) return;
    try {
      const invResponse = await trainerService.getTrainerInventory(id);
      const invData = invResponse as unknown as { success?: boolean; data?: InventoryData };
      if (invData?.success && invData.data) {
        setTrainerInventory({
          berries: (invData.data.berries as unknown as Record<string, number>) || {},
          pastries: (invData.data.pastries as unknown as Record<string, number>) || {},
        });
      }
    } catch {
      // skip
    }
    setShowMassEditModal(true);
  }, [id]);

  const handleMassEditComplete = useCallback((results: Array<{ status: string }>) => {
    fetchTrainerData();
    setShowMassEditModal(false);
    const successCount = results.filter(r => r.status === 'success').length;
    setStatusMessage(`Mass edit completed! ${successCount} operations processed successfully.`);
    setStatusType('success');
    setTimeout(() => setStatusMessage(''), 5000);
  }, [fetchTrainerData]);

  // --- Drag and drop ---

  const handleDragStart = useCallback((
    e: React.DragEvent,
    monster: TrainerMonster | null,
    boxIndex: number,
    slotIndex: number
  ) => {
    if (!monster) return;
    setDraggedMonster(monster);
    setDragSourceBox(boxIndex);
    setDragSourceSlot(slotIndex);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      monsterId: monster.id,
      sourceBox: boxIndex,
      sourceSlot: slotIndex,
    }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetBoxIndex: number, targetSlotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    if (!draggedMonster) return;

    if (dragSourceBox === -1) {
      // From featured to regular box
      const updated = [...boxMonsters];
      const targetMonster = updated.find(m =>
        m && m.box_number === targetBoxIndex && (m.trainer_index as number) === targetSlotIndex
      );

      const updatedDragged = { ...draggedMonster, box_number: targetBoxIndex, trainer_index: targetSlotIndex };

      if (targetMonster) {
        const idx = updated.findIndex(m => m && m.id === targetMonster.id);
        if (idx !== -1) updated.splice(idx, 1);
      }
      updated.push(updatedDragged);

      const updatedFeatured = [...featuredMonsters];
      if (dragSourceSlot != null) updatedFeatured[dragSourceSlot] = null;
      setFeaturedMonsters(updatedFeatured);

      if (targetMonster) {
        updated.push({ ...targetMonster, box_number: undefined, trainer_index: undefined });
      }
      setBoxMonsters(updated);
    } else {
      // Box-to-box
      const updated = [...boxMonsters];
      const targetMonster = updated.find(m =>
        m && m.box_number === targetBoxIndex && (m.trainer_index as number) === targetSlotIndex
      );

      const draggedIdx = updated.findIndex(m => m && m.id === draggedMonster.id);
      if (draggedIdx !== -1) {
        updated[draggedIdx] = { ...draggedMonster, box_number: targetBoxIndex, trainer_index: targetSlotIndex };
      }

      if (targetMonster) {
        const targetIdx = updated.findIndex(m => m && m.id === targetMonster.id);
        if (targetIdx !== -1) {
          updated[targetIdx] = { ...targetMonster, box_number: dragSourceBox!, trainer_index: dragSourceSlot! };
        }
      }
      setBoxMonsters(updated);
    }

    setDraggedMonster(null);
    setDragSourceBox(null);
    setDragSourceSlot(null);
    setStatusMessage('Monster position updated. Remember to save your changes!');
    setStatusType('info');
  }, [draggedMonster, dragSourceBox, dragSourceSlot, boxMonsters, featuredMonsters]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.edit-box-slot').forEach(slot => {
      slot.classList.remove('drag-over');
    });
  }, []);

  // Featured monster drag handlers
  const handleFeaturedDrop = useCallback((e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (!draggedMonster) return;

    const updated = Array.from({ length: 6 }, (_, i) => featuredMonsters[i] || null);
    const existingIdx = updated.findIndex(fm => fm && fm.id === draggedMonster.id);

    if (existingIdx !== -1) {
      const target = updated[slotIndex];
      updated[existingIdx] = target;
      updated[slotIndex] = draggedMonster as FeaturedMonster;
    } else {
      updated[slotIndex] = draggedMonster as FeaturedMonster;
    }

    setFeaturedMonsters(updated);
    setStatusMessage('Featured monster updated. Remember to save your changes!');
    setStatusType('info');
  }, [draggedMonster, featuredMonsters]);

  const handleFeaturedDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleFeaturedDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  }, []);

  // --- Save handlers ---

  const handleSaveBoxes = useCallback(async () => {
    if (isSaving || !id) return;
    setIsSaving(true);
    setStatusMessage('Saving changes...');
    setStatusType('info');

    try {
      const positions = boxMonsters
        .filter(Boolean)
        .map(m => ({
          id: m.id,
          boxNumber: m.box_number ?? 0,
          position: (m.trainer_index as number) ?? 0,
        }));

      const response = await trainerService.updateMonsterBoxPositions(id, positions);

      if (response.success) {
        setStatusMessage('Box positions saved! Now saving featured monsters...');
        try {
          const featuredIds = featuredMonsters.filter(Boolean).map(fm => fm!.id);
          const featuredResponse = await trainerService.updateFeaturedMonsters(id, featuredIds);
          if (featuredResponse.success) {
            setStatusMessage('All changes saved successfully!');
            setStatusType('success');
          } else {
            setStatusMessage('Box positions saved, but featured monsters failed.');
            setStatusType('warning');
          }
        } catch {
          setStatusMessage('Box positions saved, but featured monsters failed.');
          setStatusType('warning');
        }

        // Refresh
        const monstersResponse = await trainerService.getTrainerMonsters(id, { limit: 1000 });
        setMonsters((monstersResponse.monsters || []).map(m => formatMonsterData(m)));
        setFeaturedMonstersLoaded(false);
      } else {
        setStatusMessage('Failed to save box positions');
        setStatusType('error');
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to save box positions';
      setStatusMessage(`Error: ${msg}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, id, boxMonsters, featuredMonsters]);

  const handleSaveFeaturedMonsters = useCallback(async () => {
    if (isSaving || !id) return;
    setIsSaving(true);
    setStatusMessage('Saving featured monsters...');
    setStatusType('info');

    try {
      const featuredIds = featuredMonsters.filter(Boolean).map(fm => fm!.id);
      const response = await trainerService.updateFeaturedMonsters(id, featuredIds);

      if (response.success) {
        setStatusMessage('Featured monsters saved successfully!');
        setStatusType('success');
        // Refetch
        const updatedResponse = await trainerService.getFeaturedMonsters(id);
        const apiMonsters: FeaturedMonster[] = updatedResponse.featuredMonsters || [];
        const slotArray: (FeaturedMonster | null)[] = Array.from({ length: 6 }, () => null);
        apiMonsters.forEach((monster) => {
          if (monster.display_order && monster.display_order >= 1 && monster.display_order <= 6) {
            slotArray[monster.display_order - 1] = monster;
          }
        });
        setFeaturedMonsters(slotArray);
      } else {
        setStatusMessage('Failed to save featured monsters');
        setStatusType('error');
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to save featured monsters';
      setStatusMessage(`Error: ${msg}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, id, featuredMonsters]);

  const handleAddBox = useCallback(() => {
    setAdditionalBoxes(prev => prev + 1);
    setStatusMessage('Empty box added! Drag monsters into it. Remember to save!');
    setStatusType('info');
  }, []);

  // --- Image modal ---

  const handleImageClick = useCallback((imageSrc: string, imageAlt: string) => {
    setModalImageSrc(imageSrc);
    setModalImageAlt(imageAlt);
    setShowImageModal(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setModalImageSrc('');
    setModalImageAlt('');
  }, []);

  // --- Effects ---

  // Reset search when changing tabs
  useEffect(() => {
    if (activeTab !== 'pc' && activeTab !== 'boxes') {
      setSearchTerm('');
    }
  }, [activeTab]);

  // Reset PC box on search
  useEffect(() => {
    if (searchTerm) setCurrentPCBox(0);
  }, [searchTerm]);

  // Fetch trainer data on mount / id change
  useEffect(() => {
    setFeaturedMonstersLoaded(false);
    fetchTrainerData();
  }, [id, fetchTrainerData]);

  // Initialize box monsters from monsters
  useEffect(() => {
    if (monsters.length > 0) {
      setBoxMonsters([...monsters]);
      setAdditionalBoxes(0);
    }
  }, [monsters]);

  // Fetch featured monsters
  useEffect(() => {
    if (!id || !trainer || featuredMonstersLoaded) return;
    const fetchFeatured = async () => {
      try {
        const response = await trainerService.getFeaturedMonsters(id);
        const apiMonsters: FeaturedMonster[] = response.featuredMonsters || [];
        const slotArray: (FeaturedMonster | null)[] = Array.from({ length: 6 }, () => null);
        apiMonsters.forEach((monster) => {
          if (monster.display_order && monster.display_order >= 1 && monster.display_order <= 6) {
            slotArray[monster.display_order - 1] = monster;
          }
        });
        setFeaturedMonsters(slotArray);
      } catch {
        setFeaturedMonsters(Array.from({ length: 6 }, () => null));
      }
      setFeaturedMonstersLoaded(true);
    };
    fetchFeatured();
  }, [id, trainer, featuredMonstersLoaded]);

  // Fetch achievements when tab is opened
  useEffect(() => {
    if (trainer && activeTab === 'achievements') fetchAchievements();
  }, [trainer, activeTab, fetchAchievements]);

  // Fetch related entities when relations tab is opened
  useEffect(() => {
    if (trainer && activeTab === 'relations' && trainer.relations) fetchRelatedEntities();
  }, [trainer, activeTab, fetchRelatedEntities]);

  return {
    // Core data
    id,
    trainer,
    monsters,
    loading,
    error,
    isOwner,
    filteredMonsters,

    // Tab state
    activeTab,
    setActiveTab,

    // PC box
    currentPCBox,
    setCurrentPCBox,
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    getMaxBoxNumber,
    getBoxMonsters,
    getBoxMonstersForDisplay,
    getFilteredBoxMonsters,

    // Edit boxes
    boxMonsters,
    featuredMonsters,
    setFeaturedMonsters,
    featuredMonstersCollapsed,
    setFeaturedMonstersCollapsed,
    isSaving,
    statusMessage,
    statusType,
    setStatusMessage,
    setStatusType,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleFeaturedDrop,
    handleFeaturedDragOver,
    handleFeaturedDragLeave,
    handleSaveBoxes,
    handleSaveFeaturedMonsters,
    handleAddBox,

    // Inventory
    inventoryData,
    inventoryItemDetails,
    isItemDetailModalOpen,
    setIsItemDetailModalOpen,
    selectedItemForDetail,
    handleItemDetailClick,
    getItemImageUrl,

    // Achievements
    achievements,
    achievementStats,
    achievementsLoading,
    achievementFilter,
    setAchievementFilter,
    handleClaimAchievement,
    handleClaimAllAchievements,
    isClaimingAll,

    // Reward popup
    showRewardPopup,
    setShowRewardPopup,
    rewardPopupData,

    // Mass edit
    showMassEditModal,
    setShowMassEditModal,
    trainerInventory,
    handleOpenMassEdit,
    handleMassEditComplete,

    // Relations
    relatedTrainers,
    relatedMonsters,

    // Image modal
    showImageModal,
    modalImageSrc,
    modalImageAlt,
    handleImageClick,
    closeImageModal,

    // Refresh
    fetchTrainerData,
  };
}
