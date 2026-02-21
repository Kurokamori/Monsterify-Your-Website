import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import monsterService from '@services/monsterService';
import type { Monster } from '@services/monsterService';
import trainerService from '@services/trainerService';
import type { Trainer } from '@components/trainers/types/Trainer';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useDebounce } from '@hooks/useDebounce';

// --- Types ---

export interface MonsterMove {
  move_name?: string;
  move_type?: string;
  pp?: number;
  power?: number | null;
  accuracy?: number | null;
  description?: string;
  [key: string]: unknown;
}

export interface EvolutionEntry {
  id?: number | string;
  order?: number;
  species1?: string;
  species2?: string;
  species3?: string;
  image?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  evolution_method?: string;
  level?: number | string;
  key?: string;
  data?: string;
}

export interface GalleryImage {
  url?: string;
  image_url?: string;
  img_link?: string;
  caption?: string;
  description?: string;
  [key: string]: unknown;
}

export interface LineageMonster extends Monster {
  is_automatic?: boolean;
}

export interface LineageData {
  parents?: LineageMonster[];
  siblings?: LineageMonster[];
  children?: LineageMonster[];
  grandchildren?: LineageMonster[];
}

export interface MegaImages {
  mega_stone_image?: { image_url?: string } | null;
  mega_image?: { image_url?: string } | null;
}

export interface MonsterRelation {
  id?: number;
  name?: string;
  related_type?: 'trainer' | 'monster';
  related_id?: number;
  elaboration?: string;
  [key: string]: unknown;
}

export interface FunFact {
  id?: number | string;
  title?: string;
  content?: string;
}

export interface RelationEntity {
  type: string;
  name: string;
  data: unknown;
  trainerName?: string;
}

// --- Helper ---

function getFriendshipMessage(friendship: number | undefined | null): string {
  if (friendship === undefined || friendship === null) return '';
  const level = Number(friendship);
  if (level === 0) return "Doesn't seem to trust or like their trainer";
  if (level <= 30) return 'Shows some wariness towards their trainer';
  if (level <= 50) return 'Beginning to warm up to their trainer';
  if (level <= 70) return 'Getting along well with their trainer';
  if (level <= 100) return 'Trusts and respects their trainer';
  if (level <= 130) return 'Has formed a strong bond with their trainer';
  if (level <= 150) return 'Deeply loyal and devoted to their trainer';
  if (level <= 180) return 'Considers their trainer a true companion';
  if (level <= 210) return 'Would do anything to protect their trainer';
  if (level <= 240) return 'Shares an unbreakable bond with their trainer';
  if (level >= 255) return 'Adores their trainer and trusts them fully';
  return `Friendship level: ${level}`;
}

export { getFriendshipMessage };

// --- Hook ---

export function useMonsterDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Core data
  const [monster, setMonster] = useState<Monster | null>(null);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [moves, setMoves] = useState<MonsterMove[]>([]);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionEntry[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [lineage, setLineage] = useState<LineageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation
  const [prevMonster, setPrevMonster] = useState<Monster | null>(null);
  const [nextMonster, setNextMonster] = useState<Monster | null>(null);

  // Mega
  const [megaImages, setMegaImages] = useState<MegaImages>({
    mega_stone_image: null,
    mega_image: null,
  });

  // Relations
  const [relationEntities, setRelationEntities] = useState<Record<string, RelationEntity>>({});

  // Lineage editing
  const [showEditLineage, setShowEditLineage] = useState(false);
  const [newRelationshipType, setNewRelationshipType] = useState('parent');
  const [monsterSearch, setMonsterSearch] = useState('');
  const [relationshipNotes, setRelationshipNotes] = useState('');
  const [searchResults, setSearchResults] = useState<Monster[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);

  // Evolution editing
  const [showEvolutionEditor, setShowEvolutionEditor] = useState(false);
  const [evolutionSaving, setEvolutionSaving] = useState(false);

  // Image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');

  // Tab state via URL
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = useCallback(
    (tab: string) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams],
  );

  // Debounced search
  const debouncedSearch = useDebounce(monsterSearch, 300);

  // Document title
  useDocumentTitle(monster ? (monster.name ?? 'Monster') : 'Monster');

  // Parsed monster ID
  const monsterId = useMemo(() => {
    if (!id) return null;
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? null : parsed;
  }, [id]);

  // --- Computed ---

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

  // --- Relation entities fetcher ---

  const fetchRelationEntities = useCallback(async (monsterData: Monster) => {
    if (!monsterData.relations) return;

    try {
      const relations: MonsterRelation[] =
        typeof monsterData.relations === 'string'
          ? JSON.parse(monsterData.relations)
          : (monsterData.relations as MonsterRelation[]);

      if (!Array.isArray(relations)) return;

      const entities: Record<string, RelationEntity> = {};

      for (const relation of relations) {
        if (relation.related_type === 'trainer' && relation.related_id) {
          try {
            const response = await trainerService.getTrainer(String(relation.related_id));
            if (response) {
              entities[`trainer_${relation.related_id}`] = {
                type: 'trainer',
                name: response.name,
                data: response,
              };
            }
          } catch {
            /* skip */
          }
        } else if (relation.related_type === 'monster' && relation.related_id) {
          try {
            const response = await monsterService.getMonsterById(relation.related_id);
            if (response?.success && response.data) {
              const monData = response.data;
              let trainerName = 'Unknown Trainer';
              if (monData.trainer_id) {
                try {
                  const trainerResponse = await trainerService.getTrainer(String(monData.trainer_id));
                  if (trainerResponse) {
                    trainerName = trainerResponse.name;
                  }
                } catch {
                  /* skip */
                }
              }
              entities[`monster_${relation.related_id}`] = {
                type: 'monster',
                name: `${monData.name} (${trainerName})`,
                data: monData,
                trainerName,
              };
            }
          } catch {
            /* skip */
          }
        }
      }

      setRelationEntities(entities);
    } catch {
      /* parse error */
    }
  }, []);

  // --- Data fetching ---

  const fetchMonsterData = useCallback(async () => {
    if (!monsterId) {
      setError('Invalid monster ID. Please make sure you are accessing a valid monster page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch monster details
      const monsterResponse = await monsterService.getMonsterById(monsterId);

      if (!monsterResponse?.success || !monsterResponse.data) {
        setError(monsterResponse?.message || 'Monster not found');
        setLoading(false);
        return;
      }

      const monsterData = monsterResponse.data;
      setMonster(monsterData);

      // Fetch relation entities
      await fetchRelationEntities(monsterData);

      // Fetch trainer
      if (monsterData.trainer_id) {
        try {
          const trainerResponse = await trainerService.getTrainer(String(monsterData.trainer_id));
          setTrainer(trainerResponse ?? null);
        } catch {
          /* skip */
        }
      }

      // Fetch moves
      try {
        const movesResponse = await monsterService.getMonsterMoves(monsterId);
        if (movesResponse?.success && Array.isArray(movesResponse.data)) {
          setMoves(movesResponse.data as MonsterMove[]);
        } else {
          setMoves([]);
        }
      } catch {
        setMoves([]);
      }

      // Fetch evolution data
      try {
        const evolutionResponse = await monsterService.getMonsterEvolutionData(monsterId);
        if (evolutionResponse?.success && evolutionResponse.data) {
          const evoData = evolutionResponse.data as Record<string, unknown>;
          if (evoData.evolution_data) {
            const parsed =
              typeof evoData.evolution_data === 'string'
                ? JSON.parse(evoData.evolution_data)
                : evoData.evolution_data;
            setEvolutionChain(Array.isArray(parsed) ? parsed : []);
          } else if (Array.isArray(evolutionResponse.data)) {
            setEvolutionChain(evolutionResponse.data as EvolutionEntry[]);
          } else {
            setEvolutionChain([]);
          }
        } else {
          setEvolutionChain([]);
        }
      } catch {
        setEvolutionChain([]);
      }

      // Fetch gallery
      try {
        const galleryResponse = await monsterService.getMonsterGallery(monsterId);
        if (galleryResponse?.success && galleryResponse.data) {
          const gData = galleryResponse.data;
          if (Array.isArray(gData)) {
            setGalleryImages(gData as GalleryImage[]);
          } else {
            const obj = gData as Record<string, unknown>;
            if (Array.isArray(obj.images)) {
              setGalleryImages(obj.images as GalleryImage[]);
            } else if (Array.isArray(obj.data)) {
              setGalleryImages(obj.data as GalleryImage[]);
            } else if (Array.isArray(monsterData.images)) {
              setGalleryImages(monsterData.images as GalleryImage[]);
            } else {
              setGalleryImages([]);
            }
          }
        } else {
          setGalleryImages([]);
        }
      } catch {
        setGalleryImages([]);
      }

      // Fetch box navigation
      if (monsterData.trainer_id && monsterData.box_number != null) {
        try {
          const monstersResponse = await trainerService.getTrainerMonsters(
            String(monsterData.trainer_id),
            { limit: 1000 },
          );
          const allMonsters = monstersResponse.monsters || [];
          const boxMonsters = allMonsters.filter(
            (m) => m.box_number === monsterData.box_number,
          );

          if (boxMonsters.length > 0 && boxMonsters[0].trainer_index !== undefined) {
            boxMonsters.sort(
              (a, b) => ((a.trainer_index as number) ?? 0) - ((b.trainer_index as number) ?? 0),
            );
          }

          const currentIndex = boxMonsters.findIndex((m) => m.id === monsterId);
          setPrevMonster(currentIndex > 0 ? (boxMonsters[currentIndex - 1] as Monster) : null);
          setNextMonster(
            currentIndex < boxMonsters.length - 1
              ? (boxMonsters[currentIndex + 1] as Monster)
              : null,
          );
        } catch {
          /* skip */
        }
      }

      // Fetch mega images
      if (monsterData.has_mega_stone || (monsterData.level as number) >= 100) {
        try {
          const megaResponse = await monsterService.getMegaImages(monsterId);
          if (megaResponse.success && megaResponse.data) {
            setMegaImages(megaResponse.data as MegaImages);
          }
        } catch {
          /* skip */
        }
      }

      // Fetch lineage
      try {
        const lineageResponse = await monsterService.getMonsterLineage(monsterId);
        if (lineageResponse?.success && lineageResponse.data) {
          setLineage(lineageResponse.data as unknown as LineageData);
        } else {
          setLineage(null);
        }
      } catch {
        setLineage(null);
      }
    } catch {
      setError('Failed to load monster data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [monsterId, fetchRelationEntities]);

  // --- Lineage handlers ---

  const removeLineageRelationship = useCallback(
    async (relatedMonsterId: number, relationshipType: string) => {
      if (!monsterId) return;
      try {
        const response = await monsterService.removeLineageRelationship(
          monsterId,
          relatedMonsterId,
          relationshipType,
        );
        if (response.success) {
          const lineageResponse = await monsterService.getMonsterLineage(monsterId);
          if (lineageResponse?.success && lineageResponse.data) {
            setLineage(lineageResponse.data as unknown as LineageData);
          }
        }
      } catch {
        /* skip */
      }
    },
    [monsterId],
  );

  const addLineageRelationship = useCallback(async () => {
    if (!selectedMonster || !monsterId) {
      alert('Please select a monster first');
      return;
    }

    try {
      const response = await monsterService.addLineageRelationship(
        monsterId,
        selectedMonster.id,
        newRelationshipType,
        relationshipNotes,
      );

      if (response.success) {
        const lineageResponse = await monsterService.getMonsterLineage(monsterId);
        if (lineageResponse?.success && lineageResponse.data) {
          setLineage(lineageResponse.data as unknown as LineageData);
        }
        setSelectedMonster(null);
        setMonsterSearch('');
        setRelationshipNotes('');
        setSearchResults([]);
        alert('Lineage relationship added successfully!');
      } else {
        alert('Failed to add lineage relationship: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('An error occurred while adding the lineage relationship: ' + message);
    }
  }, [selectedMonster, monsterId, newRelationshipType, relationshipNotes]);

  const selectMonster = useCallback((m: Monster) => {
    setSelectedMonster(m);
    setMonsterSearch(m.name ?? '');
    setSearchResults([]);
  }, []);

  // --- Evolution handler ---

  const handleSaveEvolution = useCallback(
    async (evolutionData: EvolutionEntry[]) => {
      if (!monsterId) return;
      try {
        setEvolutionSaving(true);
        const response = await monsterService.setMonsterEvolutionData(
          monsterId,
          evolutionData as unknown as Record<string, unknown>,
        );
        if (response.success) {
          setEvolutionChain(evolutionData);
          setShowEvolutionEditor(false);
          alert('Evolution data saved successfully!');
        } else {
          throw new Error(response.message || 'Failed to save evolution data');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        alert('Failed to save evolution data: ' + message);
      } finally {
        setEvolutionSaving(false);
      }
    },
    [monsterId],
  );

  // --- Image modal ---

  const handleImageClick = useCallback((src: string, alt: string) => {
    setModalImageSrc(src);
    setModalImageAlt(alt);
    setShowImageModal(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setModalImageSrc('');
    setModalImageAlt('');
  }, []);

  // --- Effects ---

  // Fetch data on mount / id change
  useEffect(() => {
    fetchMonsterData();
  }, [fetchMonsterData]);

  // Search monsters (debounced)
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const doSearch = async () => {
      try {
        const response = await monsterService.searchMonsters(debouncedSearch, 10);
        if (response.success && response.data) {
          setSearchResults(response.data.filter((m) => m.id !== monsterId));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      }
    };

    doSearch();
  }, [debouncedSearch, monsterId]);

  return {
    // Core data
    id,
    monsterId,
    monster,
    trainer,
    moves,
    evolutionChain,
    galleryImages,
    lineage,
    loading,
    error,
    isOwner,

    // Navigation
    prevMonster,
    nextMonster,

    // Mega
    megaImages,

    // Relations
    relationEntities,

    // Tab state
    activeTab,
    setActiveTab,

    // Lineage editing
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

    // Evolution editing
    showEvolutionEditor,
    setShowEvolutionEditor,
    evolutionSaving,
    handleSaveEvolution,

    // Image modal
    showImageModal,
    modalImageSrc,
    modalImageAlt,
    handleImageClick,
    closeImageModal,

    // Refresh
    fetchMonsterData,

    // Helpers
    getFriendshipMessage,
  };
}
