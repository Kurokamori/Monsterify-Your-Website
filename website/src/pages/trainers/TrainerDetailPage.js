import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { marked } from 'marked';
import trainerService from '../../services/trainerService';
import monsterService from '../../services/monsterService';
import { useAuth } from '../../contexts/AuthContext';
import SearchBar from '../../components/common/SearchBar';
import ItemDetailModal from '../../components/items/ItemDetailModal';
import MassEditModal from '../../components/trainers/MassEditModal';
import itemsApi from '../../services/itemsApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatBirthday, getZodiacEmoji, getChineseZodiacEmoji } from '../../utils/zodiacUtils';


const ThemeSection = ({ theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!theme || theme.trim() === '' || theme === '{"",""}') {
    return null;
  }

  // Check if theme contains a link (format: "Display Text || link")
  const hasLink = theme.includes(' || ');
  const [displayText, youtubeLink] = hasLink ? theme.split(' || ') : [theme, null];
  
  // Extract YouTube video ID from various YouTube URL formats
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = getYouTubeVideoId(youtubeLink);

  return (
    <div className="trainer-detail-item theme-section">
      <span className="detail-label">Theme</span>
      <div className="theme-content">
        <div className="theme-display">
          <span className="detail-value">{displayText}</span>
          {hasLink && videoId && (
            <button 
              className="theme-expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Hide theme player' : 'Show theme player'}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          )}
        </div>
        {isExpanded && hasLink && videoId && (
          <div className="theme-player-container">
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Theme Music"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
};

const VoiceClaimSection = ({ voice_claim }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!voice_claim) {
    return null;
  }

  // Check if voice claim contains a link (format: "Display Text || link")
  const hasLink = voice_claim.includes(' || ');
  const [displayText, youtubeLink] = hasLink ? voice_claim.split(' || ') : [voice_claim, null];
  
  // Extract YouTube video ID from various YouTube URL formats
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = getYouTubeVideoId(youtubeLink);

  return (
    <div className="trainer-detail-item voice-claim-section">
      <span className="detail-label">Voice Claim</span>
      <div className="voice-claim-content">
        <div className="voice-claim-display">
          <span className="detail-value">{displayText}</span>
          {hasLink && videoId && (
            <button 
              className="voice-claim-expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Hide voice claim player' : 'Show voice claim player'}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          )}
        </div>
        {isExpanded && hasLink && videoId && (
          <div className="voice-claim-player-container">
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Voice Claim"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
};

const TrainerDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [trainer, setTrainer] = useState(null);
  const [monsters, setMonsters] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPCBox, setCurrentPCBox] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set document title based on trainer name
  useDocumentTitle(trainer ? trainer.name : 'Trainer');

  // Edit boxes state
  const [boxMonsters, setBoxMonsters] = useState([]);
  const [featuredMonsters, setFeaturedMonsters] = useState([]);
  const [featuredMonstersLoaded, setFeaturedMonstersLoaded] = useState(false);
  const [draggedMonster, setDraggedMonster] = useState(null);
  const [dragSourceBox, setDragSourceBox] = useState(null);
  const [dragSourceSlot, setDragSourceSlot] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [additionalBoxes, setAdditionalBoxes] = useState(0); // Track manually added empty boxes
  const [featuredMonstersCollapsed, setFeaturedMonstersCollapsed] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Item detail modal state
  const [isItemDetailModalOpen, setIsItemDetailModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);

  // Achievement state
  const [achievements, setAchievements] = useState([]);

  // Helper function to convert text to title case
  const toTitleCase = (str) => {
    if (!str) return str;
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to calculate age from birthday or return original age value
  const calculateDisplayAge = (ageValue, birthday) => {
    if (!ageValue) return null;
    const ageStr = String(ageValue).trim();

    // If age is not numeric (like "???"), just return it as-is
    if (!/^\d+$/.test(ageStr)) {
      return ageStr;
    }

    // If we have a birthday, calculate age from it
    if (birthday) {
      const birthDate = new Date(birthday);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        // Adjust if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      }
    }

    // Fallback to the original numeric age value
    return ageStr;
  };

  // Helper function to format monster data with proper title case
  const formatMonsterData = (monster) => {
    if (!monster) return monster;

    const formattedMonster = { ...monster };

    // Format species fields
    if (formattedMonster.species1) {
      formattedMonster.species1 = toTitleCase(formattedMonster.species1);
    }
    if (formattedMonster.species2) {
      formattedMonster.species2 = toTitleCase(formattedMonster.species2);
    }
    if (formattedMonster.species3) {
      formattedMonster.species3 = toTitleCase(formattedMonster.species3);
    }

    // Format type fields
    if (formattedMonster.type1) {
      formattedMonster.type1 = toTitleCase(formattedMonster.type1);
    }
    if (formattedMonster.type2) {
      formattedMonster.type2 = toTitleCase(formattedMonster.type2);
    }
    if (formattedMonster.type3) {
      formattedMonster.type3 = toTitleCase(formattedMonster.type3);
    }
    if (formattedMonster.type4) {
      formattedMonster.type4 = toTitleCase(formattedMonster.type4);
    }
    if (formattedMonster.type5) {
      formattedMonster.type5 = toTitleCase(formattedMonster.type5);
    }

    // Format attribute field
    if (formattedMonster.attribute) {
      formattedMonster.attribute = toTitleCase(formattedMonster.attribute);
    }

    return formattedMonster;
  };
  const [achievementStats, setAchievementStats] = useState(null);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState('all');
  
  // Reward popup state
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardPopupData, setRewardPopupData] = useState(null);
  const [isClaimingAll, setIsClaimingAll] = useState(false);

  // Mass edit state
  const [showMassEditModal, setShowMassEditModal] = useState(false);
  const [trainerInventory, setTrainerInventory] = useState({});

  // View mode state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [relatedTrainers, setRelatedTrainers] = useState({});
  const [relatedMonsters, setRelatedMonsters] = useState({});

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');

  // Item details state for inventory
  const [inventoryItemDetails, setInventoryItemDetails] = useState({});

  // Reset search when changing tabs
  useEffect(() => {
    if (activeTab !== 'pc' && activeTab !== 'boxes') {
      setSearchTerm('');
    }
  }, [activeTab]);

  // Handle tab parameter from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'pc', 'boxes', 'inventory', 'stats', 'achievements', 'relations', 'refs', 'mega', 'edit-boxes'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Reset current PC box when search term changes
  useEffect(() => {
    if (searchTerm) {
      setCurrentPCBox(0);
    }
  }, [searchTerm]);

  useEffect(() => {
    // Reset featured monsters loaded flag when trainer ID changes
    setFeaturedMonstersLoaded(false);
    fetchTrainerData();
  }, [id]);

  // Initialize boxMonsters when monsters change (only if monsters array has content)
  useEffect(() => {
    if (monsters.length > 0) {
      // Keep monsters in their original structure to preserve box_number and trainer_index
      // No need to reorganize - just use the monsters as they are
      setBoxMonsters([...monsters]);
      
      // Reset additional boxes when monsters are reloaded to keep counts consistent
      setAdditionalBoxes(0);
    }
  }, [monsters]);

  // Fetch featured monsters when trainer changes and after monsters are loaded
  useEffect(() => {
    const fetchFeaturedMonsters = async () => {
      if (!id) return;

      try {
        const response = await trainerService.getFeaturedMonsters(id);
        // Convert the API response to a 6-slot array
        const apiMonsters = response.featuredMonsters || [];
        const slotArray = Array.from({ length: 6 }, () => null);

        // Place monsters in their correct slots based on display_order
        apiMonsters.forEach((monster) => {
          if (monster.display_order && monster.display_order >= 1 && monster.display_order <= 6) {
            slotArray[monster.display_order - 1] = monster; // display_order is 1-based, array is 0-based
          }
        });

        setFeaturedMonsters(slotArray);
        setFeaturedMonstersLoaded(true);
      } catch (error) {
        console.error('Error fetching featured monsters:', error);
        setFeaturedMonsters(Array.from({ length: 6 }, () => null));
        setFeaturedMonstersLoaded(true);
      }
    };

    // Only fetch featured monsters after trainer data is loaded and if not already loaded
    if (id && trainer && !featuredMonstersLoaded) {
      fetchFeaturedMonsters();
    }
  }, [id, trainer, featuredMonstersLoaded]);

  // Handle item detail click
  const handleItemDetailClick = async (itemName, category) => {
    try {
      // Search for the item by exact name match first, then try broader search
      let response = await itemsApi.getItems({ search: itemName, limit: 50 });
      let foundItem = null;
      
      if (response.data && response.data.length > 0) {
        // Look for exact name match first
        foundItem = response.data.find(item => 
          item.name.toLowerCase() === itemName.toLowerCase()
        );
        
        // If no exact match, try the first result
        if (!foundItem) {
          foundItem = response.data[0];
        }
      }
      
      if (foundItem) {
        setSelectedItemForDetail(foundItem);
      } else {
        // Fallback if item not found in database
        const itemData = {
          name: itemName,
          category: category || 'items',
          description: `Information about ${itemName}`,
          effect: `Item effect for ${itemName}`,
        };
        setSelectedItemForDetail(itemData);
      }
      
      setIsItemDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching item details:', error);
      
      // Fallback on error
      const itemData = {
        name: itemName,
        category: category || 'items',
        description: `Information about ${itemName}`,
        effect: `Item effect for ${itemName}`,
      };
      setSelectedItemForDetail(itemData);
      setIsItemDetailModalOpen(true);
    }
  };

  // Helper function to get item image URL from database or fallback to old path
  const getItemImageUrl = (itemName, category = 'items') => {
    const itemDetail = inventoryItemDetails[itemName];
    if (itemDetail && itemDetail.image_url) {
      return itemDetail.image_url;
    }
    
    // Fallback to old path structure
    if (category === 'keyitems') {
      return `/images/items/keyitems/${itemName.toLowerCase().replace(/\s+/g, '_')}.png`;
    }
    return `/images/items/${itemName.toLowerCase().replace(/\s+/g, '_')}.png`;
  };

  // Fetch item details for all inventory items
  const fetchInventoryItemDetails = async (inventory) => {
    if (!inventory || !inventory.data || !inventory.data.data) {
      return;
    }

    const itemDetails = {};
    const inventoryData = inventory.data.data;

    // Get all unique item names from all categories
    const allItemNames = new Set();
    Object.values(inventoryData).forEach(category => {
      if (category && typeof category === 'object') {
        Object.keys(category).forEach(itemName => {
          allItemNames.add(itemName);
        });
      }
    });

    // Fetch details for each unique item
    for (const itemName of allItemNames) {
      try {
        const response = await itemsApi.getItems({ search: itemName, limit: 50 });
        if (response.data && response.data.length > 0) {
          // Look for exact name match first
          const foundItem = response.data.find(item => 
            item.name.toLowerCase() === itemName.toLowerCase()
          );
          if (foundItem) {
            itemDetails[itemName] = foundItem;
          }
        }
      } catch (error) {
        console.error(`Error fetching details for item ${itemName}:`, error);
      }
    }

    setInventoryItemDetails(itemDetails);
  };

  const fetchTrainerData = async () => {
    try {
      setLoading(true);

      // Fetch trainer details
      const trainerResponse = await trainerService.getTrainerById(id);
      const trainerData = trainerResponse.trainer || null;

      // Fetch trainer's monsters - get ALL monsters for PC boxes view
      const monstersResponse = await trainerService.getTrainerMonsters(id, { limit: 1000 });
      const rawMonsters = monstersResponse.monsters || [];
      // Apply title case formatting to species, types, and attribute fields
      const formattedMonsters = rawMonsters.map(monster => formatMonsterData(monster));
      setMonsters(formattedMonsters);

      // Fetch trainer's inventory if trainer exists
      if (trainerData) {
        try {
          const inventoryResponse = await trainerService.getTrainerInventory(id);
          // Add inventory data to trainer object
          if (inventoryResponse && inventoryResponse.success) {
            // Format the inventory data correctly
            trainerData.inventory = {
              data: {
                data: inventoryResponse.data
              }
            };
            console.log('Inventory loaded:', trainerData.inventory);
          } else {
            trainerData.inventory = {};
          }
        } catch (inventoryErr) {
          console.error(`Error fetching inventory for trainer ${id}:`, inventoryErr);
          // Don't fail the whole request if inventory fails
          trainerData.inventory = {};
        }

        // Fetch item details for inventory items
        await fetchInventoryItemDetails(trainerData.inventory);

        // Parse additional_refs if they exist in the trainer data
        if (trainerData.additional_refs) {
          try {
            if (typeof trainerData.additional_refs === 'string') {
              trainerData.additional_refs = JSON.parse(trainerData.additional_refs);
            }
            // Ensure it's an array
            if (!Array.isArray(trainerData.additional_refs)) {
              trainerData.additional_refs = [];
            }
            console.log('Additional references loaded:', trainerData.additional_refs);
          } catch (parseErr) {
            console.error('Error parsing additional_refs:', parseErr);
            trainerData.additional_refs = [];
          }
        } else {
          trainerData.additional_refs = [];
        }
      }

      // Set trainer data with inventory
      setTrainer(trainerData);

    } catch (err) {
      console.error(`Error fetching trainer ${id}:`, err);
      setError('Failed to load trainer data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch achievements data
  const fetchAchievements = async () => {
    if (!id) return;
    
    try {
      setAchievementsLoading(true);
      const response = await trainerService.getAchievements(id);
      
      if (response.success) {
        console.log('Achievement API response:', response.data);
        console.log('Number of achievements received:', response.data.achievements?.length || 0);
        console.log('Is owner from API:', response.data.isOwner);
        setAchievements(response.data.achievements || []);
        
        // Also fetch achievement stats
        const statsResponse = await trainerService.getAchievementStats(id);
        if (statsResponse.success) {
          setAchievementStats(statsResponse.data.stats || null);
        }
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
      setAchievementStats(null);
    } finally {
      setAchievementsLoading(false);
    }
  };

  // Claim achievement function
  const handleClaimAchievement = async (achievementId) => {
    try {
      const response = await trainerService.claimAchievement(id, achievementId);
      
      if (response.success) {
        // Show reward popup
        setRewardPopupData({
          achievement: response.data.achievement,
          rewards: response.data.rewards
        });
        setShowRewardPopup(true);
        
        // Update achievements state locally (mark as claimed)
        setAchievements(prevAchievements => 
          prevAchievements.map(achievement => 
            achievement.id === achievementId 
              ? { ...achievement, claimed: true, canClaim: false }
              : achievement
          )
        );
        
        // Update trainer data locally if currency was rewarded
        if (response.data.rewards?.currency) {
          setTrainer(prevTrainer => ({
            ...prevTrainer,
            currency_amount: (prevTrainer.currency_amount || 0) + response.data.rewards.currency,
            total_earned_currency: (prevTrainer.total_earned_currency || 0) + response.data.rewards.currency
          }));
        }
        
        // Update achievement stats
        if (achievementStats) {
          setAchievementStats(prevStats => ({
            ...prevStats,
            claimed: prevStats.claimed + 1,
            unclaimed: prevStats.unclaimed - 1
          }));
        }
      }
    } catch (error) {
      console.error('Error claiming achievement:', error);
      setStatusMessage(error.response?.data?.message || 'Failed to claim achievement');
      setStatusType('error');
    }
  };

  // Claim all achievements function
  const handleClaimAllAchievements = async () => {
    try {
      setIsClaimingAll(true);
      const response = await trainerService.claimAllAchievements(id);
      
      if (response.success) {
        // Show bulk reward popup
        setRewardPopupData({
          isBulk: true,
          claimedCount: response.data.claimedCount,
          claimedAchievements: response.data.claimedAchievements,
          totalRewards: response.data.totalRewards,
          message: response.message
        });
        setShowRewardPopup(true);
        
        // Update all claimed achievements in state
        setAchievements(prevAchievements => 
          prevAchievements.map(achievement => {
            const wasClaimedNow = response.data.claimedAchievements?.some(claimed => claimed.id === achievement.id);
            return wasClaimedNow 
              ? { ...achievement, claimed: true, canClaim: false }
              : achievement;
          })
        );
        
        // Update trainer data locally if currency was rewarded
        if (response.data.totalRewards?.currency > 0) {
          setTrainer(prevTrainer => ({
            ...prevTrainer,
            currency_amount: (prevTrainer.currency_amount || 0) + response.data.totalRewards.currency,
            total_earned_currency: (prevTrainer.total_earned_currency || 0) + response.data.totalRewards.currency
          }));
        }
        
        // Update achievement stats
        if (achievementStats && response.data.claimedCount > 0) {
          setAchievementStats(prevStats => ({
            ...prevStats,
            claimed: prevStats.claimed + response.data.claimedCount,
            unclaimed: prevStats.unclaimed - response.data.claimedCount
          }));
        }
      }
    } catch (error) {
      console.error('Error claiming all achievements:', error);
      setStatusMessage(error.response?.data?.message || 'Failed to claim achievements');
      setStatusType('error');
    } finally {
      setIsClaimingAll(false);
    }
  };

  // Mass edit functions
  const fetchTrainerInventory = async () => {
    try {
      const response = await fetch(`/api/trainers/${id}/inventory`);
      const data = await response.json();
      if (response.ok && data.success) {
        setTrainerInventory({
          berries: data.data.berries || {},
          pastries: data.data.pastries || {}
        });
      }
    } catch (error) {
      console.error('Error fetching trainer inventory:', error);
    }
  };

  const handleOpenMassEdit = async () => {
    await fetchTrainerInventory();
    setShowMassEditModal(true);
  };

  const handleMassEditComplete = (results) => {
    // Refresh monsters data after mass edit operations
    fetchTrainerData();
    setShowMassEditModal(false);
    
    // Show success message
    const successCount = results.filter(r => r.status === 'success').length;
    setStatusMessage(`Mass edit completed! ${successCount} operations processed successfully.`);
    setStatusType('success');
    
    // Clear status after 5 seconds
    setTimeout(() => {
      setStatusMessage('');
    }, 5000);
  };

  // Fetch achievements when trainer changes or achievements tab is opened
  useEffect(() => {
    if (trainer && activeTab === 'achievements') {
      fetchAchievements();
    }
  }, [trainer, activeTab]);

  // Fetch related trainers and monsters when relations tab is opened
  useEffect(() => {
    if (trainer && activeTab === 'relations' && trainer.relations) {
      fetchRelatedEntities();
    }
  }, [trainer, activeTab]);

  const fetchRelatedEntities = async () => {
    try {
      const relations = typeof trainer.relations === 'string'
        ? JSON.parse(trainer.relations)
        : trainer.relations;
      
      if (!Array.isArray(relations)) return;

      const trainerIds = relations.map(rel => rel.trainer_id).filter(Boolean);
      const monsterIds = relations.filter(rel => rel.monster_id).map(rel => rel.monster_id);
      
      const trainersData = {};
      const monstersData = {};

      // Fetch trainers
      for (const trainerId of trainerIds) {
        try {
          const response = await trainerService.getTrainerById(trainerId);
          if (response && response.trainer) {
            trainersData[trainerId] = response.trainer;
          }
        } catch (err) {
          console.error(`Error fetching trainer ${trainerId}:`, err);
        }
      }

      // Fetch monsters
      for (const monsterId of monsterIds) {
        try {
          const response = await monsterService.getMonsterById(monsterId);
          if (response && response.success && response.data) {
            monstersData[monsterId] = response.data;
          }
        } catch (err) {
          console.error(`Error fetching monster ${monsterId}:`, err);
        }
      }

      setRelatedTrainers(trainersData);
      setRelatedMonsters(monstersData);
    } catch (err) {
      console.error('Error parsing relations:', err);
    }
  };

  // Image modal handlers
  const handleImageClick = (imageSrc, imageAlt) => {
    setModalImageSrc(imageSrc);
    setModalImageAlt(imageAlt);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageSrc('');
    setModalImageAlt('');
  };

  // If trainer is null, we'll show a not found message
  // No fallback data needed as we're properly handling API responses

  // Debug ownership check
  console.log('Current User:', currentUser);
  console.log('Trainer:', trainer);
  console.log('Ownership check:', currentUser?.id, trainer?.player_user_id);

  // Check if the current user is the owner of the trainer
  const isOwner = currentUser && trainer && (
    // Check if IDs match (converted to strings for comparison)
    String(currentUser.id) === String(trainer.player_user_id) ||
    // Check if username matches
    currentUser.username === trainer.player_user_id ||
    // Check if email matches
    (currentUser.email && currentUser.email === trainer.player_user_id) ||
    // Check if discord_id matches
    (currentUser.discord_id && currentUser.discord_id === trainer.player_user_id) ||
    // Check if the user is an admin
    currentUser.is_admin === 1 || currentUser.is_admin === true
  );

  console.log('Is owner result:', isOwner);

  // Filter monsters based on search term
  const filteredMonsters = searchTerm
    ? monsters.filter(monster => 
        monster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.species1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.species2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.species3?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.type1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.type2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.type3?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.type4?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.type5?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : monsters;

  // Get monsters for a specific box - respects actual trainer_index positions
  const getBoxMonsters = (boxIndex) => {
    // Create a 30-slot array filled with null
    const boxSlots = new Array(30).fill(null);
    
    // Place monsters in their correct positions based on trainer_index
    boxMonsters.forEach(monster => {
      if (monster && 
          monster.box_number === boxIndex && 
          monster.trainer_index !== null && 
          monster.trainer_index !== undefined && 
          monster.trainer_index >= 0 && 
          monster.trainer_index < 30) {
        boxSlots[monster.trainer_index] = monster;
      }
    });
    
    return boxSlots;
  };

  // Get monsters for PC box display - respects actual trainer_index positions (preserves gaps)
  const getBoxMonstersForDisplay = (boxIndex) => {
    // Create a 30-slot array filled with null
    const boxSlots = new Array(30).fill(null);
    
    // Place monsters in their correct positions based on trainer_index
    filteredMonsters.forEach(monster => {
      if (monster && 
          monster.box_number === boxIndex && 
          monster.trainer_index !== null && 
          monster.trainer_index !== undefined && 
          monster.trainer_index >= 0 && 
          monster.trainer_index < 30) {
        boxSlots[monster.trainer_index] = monster;
      }
    });
    
    return boxSlots;
  };

  // Get filtered monsters for search results - consolidates ALL results across boxes
  const getFilteredBoxMonsters = (boxIndex) => {
    // Create a 30-slot array filled with null
    const boxSlots = new Array(30).fill(null);
    
    // When searching, consolidate all filtered monsters across all boxes
    // Box 0 gets monsters 0-29, Box 1 gets monsters 30-59, etc.
    const startIndex = boxIndex * 30;
    const endIndex = startIndex + 30;
    
    // Get the slice of filtered monsters for this box
    const monstersForThisBox = filteredMonsters.slice(startIndex, endIndex);
    
    // Place them in consecutive slots starting from index 0
    monstersForThisBox.forEach((monster, index) => {
      boxSlots[index] = monster;
    });
    
    return boxSlots;
  };

  // Get the maximum box number to determine how many boxes to display
  const getMaxBoxNumber = () => {
    // When searching, calculate boxes needed based on filtered results
    if (searchTerm) {
      return Math.max(1, Math.ceil(filteredMonsters.length / 30));
    }

    let maxBox = 0;

    // Use boxMonsters instead of filteredMonsters to ensure we get the true max box number
    // regardless of search filters
    if (boxMonsters.length > 0) {
      maxBox = Math.max(...boxMonsters.map(monster =>
        monster && monster.box_number !== null && monster.box_number !== undefined
          ? monster.box_number
          : 0
      ));
    }

    // Account for additional manually added boxes
    const maxBoxWithAdditional = Math.max(maxBox, additionalBoxes);

    return maxBoxWithAdditional + 1; // Convert to count (0-based to 1-based)
  };

  // Drag and drop handlers
  const handleDragStart = (e, monster, boxIndex, slotIndex) => {
    if (!monster) return;

    setDraggedMonster(monster);
    setDragSourceBox(boxIndex);
    setDragSourceSlot(slotIndex);

    // Add dragging class for styling
    e.currentTarget.classList.add('dragging');

    // Set data transfer
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      monsterId: monster.id,
      sourceBox: boxIndex,
      sourceSlot: slotIndex
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e, targetBoxIndex, targetSlotIndex) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove drag-over class
    e.currentTarget.classList.remove('drag-over');

    if (!draggedMonster) return;

    // Check if source is from featured monsters (boxIndex -1)
    if (dragSourceBox === -1) {
      // Moving from featured monsters to regular box
      const updatedBoxMonsters = [...boxMonsters];
      
      // Find if there's already a monster at the target position
      const targetMonster = updatedBoxMonsters.find(monster => 
        monster && monster.box_number === targetBoxIndex && monster.trainer_index === targetSlotIndex
      );

      // Update the dragged monster's position
      const updatedDraggedMonster = {
        ...draggedMonster,
        box_number: targetBoxIndex,
        trainer_index: targetSlotIndex
      };

      // Remove the old monster at target position if it exists
      if (targetMonster) {
        const targetMonsterIndex = updatedBoxMonsters.findIndex(monster => 
          monster && monster.id === targetMonster.id
        );
        if (targetMonsterIndex !== -1) {
          updatedBoxMonsters.splice(targetMonsterIndex, 1);
        }
      }

      // Add the dragged monster to the box monsters array
      updatedBoxMonsters.push(updatedDraggedMonster);

      // Remove from featured monsters (maintain 6-slot array structure)
      const updatedFeaturedMonsters = [...featuredMonsters];
      updatedFeaturedMonsters[dragSourceSlot] = null;
      setFeaturedMonsters(updatedFeaturedMonsters);

      // If there was a monster displaced from target slot, find it a new position
      if (targetMonster) {
        // Update the target monster to have no position (will be placed at end of collection)
        const updatedTargetMonster = {
          ...targetMonster,
          box_number: null,
          trainer_index: null
        };
        updatedBoxMonsters.push(updatedTargetMonster);
      }

      setBoxMonsters(updatedBoxMonsters);
    } else {
      // Regular box-to-box movement
      const updatedBoxMonsters = [...boxMonsters];
      
      // Find the target monster (if any) at the destination
      const targetMonster = updatedBoxMonsters.find(monster => 
        monster && monster.box_number === targetBoxIndex && monster.trainer_index === targetSlotIndex
      );

      // Update the dragged monster's position
      const draggedMonsterIndex = updatedBoxMonsters.findIndex(monster => 
        monster && monster.id === draggedMonster.id
      );
      
      if (draggedMonsterIndex !== -1) {
        updatedBoxMonsters[draggedMonsterIndex] = {
          ...draggedMonster,
          box_number: targetBoxIndex,
          trainer_index: targetSlotIndex
        };
      }

      // If there was a monster at the target position, swap their positions
      if (targetMonster) {
        const targetMonsterIndex = updatedBoxMonsters.findIndex(monster => 
          monster && monster.id === targetMonster.id
        );
        
        if (targetMonsterIndex !== -1) {
          updatedBoxMonsters[targetMonsterIndex] = {
            ...targetMonster,
            box_number: dragSourceBox,
            trainer_index: dragSourceSlot
          };
        }
      }

      // Update state
      setBoxMonsters(updatedBoxMonsters);
    }

    // Reset drag state
    setDraggedMonster(null);
    setDragSourceBox(null);
    setDragSourceSlot(null);

    // Show status message
    setStatusMessage('Monster position updated. Remember to save your changes!');
    setStatusType('info');
  };

  // Render detailed list view for monsters
  const renderDetailedListView = (monstersToShow, title = '') => {
    if (monstersToShow.length === 0) {
      return (
        <div className="no-monsters-message">
          <i className="fas fa-dragon-slash"></i>
          <p>No monsters to display.</p>
        </div>
      );
    }

    return (
      <div className="monsters-detailed-list">
        {title && <h3>{title}</h3>}
        <div className="detailed-list-header">
          <span>Name</span>
          <span>Species 1</span>
          <span>Species 2</span>
          <span>Species 3</span>
          <span>Type 1</span>
          <span>Type 2</span>
          <span>Type 3</span>
          <span>Type 4</span>
          <span>Type 5</span>
        </div>
        <div className="detailed-list-body">
          {monstersToShow.map((monster, index) => (
            <Link to={`/monsters/${monster.id}`} className="detailed-list-row" key={monster.id || index}>
              <span className="monster-name">{monster.name || 'Unknown'}</span>
              <span className="monster-species">{monster.species1 || '-'}</span>
              <span className="monster-species">{monster.species2 || '-'}</span>
              <span className="monster-species">{monster.species3 || '-'}</span>
              <span className={`monster-type type-${(monster.type1 || 'normal').toLowerCase()}`}>
                {monster.type1 || '-'}
              </span>
              <span className={`monster-type ${monster.type2 ? `type-${monster.type2.toLowerCase()}` : ''}`}>
                {monster.type2 || '-'}
              </span>
              <span className={`monster-type ${monster.type3 ? `type-${monster.type3.toLowerCase()}` : ''}`}>
                {monster.type3 || '-'}
              </span>
              <span className={`monster-type ${monster.type4 ? `type-${monster.type4.toLowerCase()}` : ''}`}>
                {monster.type4 || '-'}
              </span>
              <span className={`monster-type ${monster.type5 ? `type-${monster.type5.toLowerCase()}` : ''}`}>
                {monster.type5 || '-'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const handleDragEnd = (e) => {
    // Remove dragging class
    e.currentTarget.classList.remove('dragging');

    // Remove drag-over class from all slots
    document.querySelectorAll('.edit-box-slot').forEach(slot => {
      slot.classList.remove('drag-over');
    });
  };

  // Handle adding a new empty box
  const handleAddBox = () => {
    setAdditionalBoxes(prev => prev + 1);
    setStatusMessage('Empty box added! You can now drag monsters into it. Remember to save your changes!');
    setStatusType('info');
  };

  const handleSaveBoxes = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setStatusMessage('Saving changes...');
    setStatusType('info');

    try {
      // Prepare the data for the API - use the monster's actual box_number and trainer_index
      const monsterPositions = boxMonsters.map((monster) => {
        if (!monster) return null;

        return {
          id: monster.id || monster.mon_id, // Support both id and mon_id formats
          boxNumber: monster.box_number !== undefined ? monster.box_number : 0,
          position: monster.trainer_index !== undefined ? monster.trainer_index : 0
        };
      }).filter(Boolean); // Remove null entries

      console.log('Saving monster positions:', monsterPositions);

      // Call the API to update positions
      const response = await trainerService.updateMonsterBoxPositions(id, monsterPositions);

      if (response.success) {
        setStatusMessage('Box positions saved! Now saving featured monsters...');
        setStatusType('info');

        // Also save featured monsters
        try {
          const featuredMonsterIds = featuredMonsters.filter(fm => fm !== null).map(fm => fm.id || fm.mon_id);
          console.log('Saving featured monster IDs:', featuredMonsterIds);
          
          const featuredResponse = await trainerService.updateFeaturedMonsters(id, featuredMonsterIds);
          
          if (featuredResponse.success) {
            setStatusMessage('All changes saved successfully!');
            setStatusType('success');
          } else {
            setStatusMessage(`Box positions saved, but featured monsters failed: ${featuredResponse.message || 'Unknown error'}`);
            setStatusType('warning');
          }
        } catch (featuredError) {
          console.error('Error saving featured monsters:', featuredError);
          setStatusMessage(`Box positions saved, but featured monsters failed: ${featuredError.message}`);
          setStatusType('warning');
        }

        // Refresh monster data to get the updated order
        const monstersResponse = await trainerService.getTrainerMonsters(id, { limit: 1000 });
        const rawMonsters = monstersResponse.monsters || [];
        // Apply title case formatting to species, types, and attribute fields
        const formattedMonsters = rawMonsters.map(monster => formatMonsterData(monster));
        setMonsters(formattedMonsters);
        
        // Refresh featured monsters
        setFeaturedMonstersLoaded(false);
      } else {
        setStatusMessage(`Error: ${response.message || 'Failed to save box positions'}`);
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error saving box positions:', error);
      setStatusMessage(`Error: ${error.message || 'Failed to save box positions'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Featured monsters drag and drop handlers
  const handleFeaturedDrop = (e, slotIndex) => {
    e.preventDefault();

    if (!draggedMonster) return;

    // Create a copy of the featured monsters array, ensuring it has 6 slots
    const updatedFeaturedMonsters = Array.from({ length: 6 }, (_, i) => featuredMonsters[i] || null);

    // Get the monster at the target position (might be null)
    const targetMonster = updatedFeaturedMonsters[slotIndex];

    // Check if the dragged monster is already in featured monsters
    const draggedMonsterIndex = updatedFeaturedMonsters.findIndex(fm => fm && fm.id === draggedMonster.id);

    if (draggedMonsterIndex !== -1) {
      // Monster is already featured, swap positions
      updatedFeaturedMonsters[draggedMonsterIndex] = targetMonster;
      updatedFeaturedMonsters[slotIndex] = draggedMonster;
    } else {
      // Monster is not featured, add it to the slot
      updatedFeaturedMonsters[slotIndex] = draggedMonster;
    }

    // Keep the array structure intact (don't filter out nulls)
    setFeaturedMonsters(updatedFeaturedMonsters);

    // Show status message
    setStatusMessage('Featured monster updated. Remember to save your changes!');
    setStatusType('info');
  };

  const handleFeaturedDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleFeaturedDragEnter = (e) => {
    e.preventDefault();
  };

  const handleFeaturedDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleSaveFeaturedMonsters = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setStatusMessage('Saving featured monsters...');
    setStatusType('info');

    try {
      // Only send non-null monsters to the API
      const featuredMonsterIds = featuredMonsters.filter(fm => fm !== null).map(fm => fm.id || fm.mon_id);
      console.log('Sending featured monster IDs:', featuredMonsterIds);
      const response = await trainerService.updateFeaturedMonsters(id, featuredMonsterIds);

      if (response.success) {
        setStatusMessage('Featured monsters saved successfully!');
        setStatusType('success');
        // Refetch featured monsters to ensure they persist
        const updatedResponse = await trainerService.getFeaturedMonsters(id);
        // Convert the API response to a 6-slot array
        const apiMonsters = updatedResponse.featuredMonsters || [];
        const slotArray = Array.from({ length: 6 }, () => null);

        // Place monsters in their correct slots based on display_order
        apiMonsters.forEach((monster) => {
          if (monster.display_order && monster.display_order >= 1 && monster.display_order <= 6) {
            slotArray[monster.display_order - 1] = monster; // display_order is 1-based, array is 0-based
          }
        });

        setFeaturedMonsters(slotArray);
      } else {
        setStatusMessage(`Error: ${response.message || 'Failed to save featured monsters'}`);
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error saving featured monsters:', error);
      setStatusMessage(`Error: ${error.message || 'Failed to save featured monsters'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading trainer data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-circle"></i>
        <p>{error}</p>
        <button onClick={fetchTrainerData} className="retry-button">
          Try Again
        </button>
        <button onClick={() => navigate('/trainers')} className="back-button">
          Back to Trainers
        </button>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="error-container">
        <i className="fas fa-user-slash"></i>
        <p>Trainer not found. The trainer you're looking for might not exist or has been removed.</p>
        <button onClick={() => navigate('/trainers')} className="back-button">
          Back to Trainers
        </button>
      </div>
    );
  }

  return (
    <div className="trainer-detail-container">
      <div className="trainer-detail-header">
        <div className="trainer-profile-image-container">
          <img
            src={trainer.main_ref || '/images/default_trainer.png'}
            alt={trainer.name}
            className="trainer-profile-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/default_trainer.png';
            }}
          />
          {trainer.main_ref_artist && (
            <div className="image-credit">Art by: {trainer.main_ref_artist}</div>
          )}
        </div>
        <div className="trainer-profile-info">
          <div className="trainer-profile-info-header">
          <h1 className="trainer-profile-name">
            {trainer.name}
            {trainer.nickname && <span className="trainer-nickname">({trainer.nickname})</span>}
          </h1>

          <div className="trainer-player-info">
            <div>
               <i className="fas fa-user"></i>
            <span>Owned by {trainer.player_display_name || trainer.player_username || 'Unknown Player'}</span>
            </div>


            <div className="trainer-level-faction">
              <span className="trainer-level">Level {trainer.level || 1}</span>
              {trainer.faction && (
                <>
                  <span>-</span>
                  <span className="trainer-faction">{trainer.faction}</span>
                </>
              )}
            </div>
          </div>

          <div className="trainer-profile-stats-currency-monsters">
            <div className="trainer-monster-stats">
              <i className="fas fa-dragon"></i>
              <span>
                {trainer.monster_count || 0} Monsters
                {trainer.monster_ref_count && ` (${trainer.monster_ref_count}/${trainer.monster_count} Refs - ${trainer.monster_ref_percent || 0}%)`}
              </span>
            </div>
            <div className="trainer-currency-stats">
              <i className="fas fa-coins"></i>
              <span>
                Current : {trainer.currency_amount || 0} Total Earned : {trainer.total_earned_currency || 0}
              </span>
            </div>
            
          </div>
          </div>
          {trainer.tldr && (
            <div className="trainer-tldr">
              <p>{trainer.tldr}</p>
            </div>
          )}
          

          <div className="trainer-compact-info">
            {/* Grid layout for species, types, ability, and favorite types */}
            <div className="trainer-attributes-grid">
              {/* Row 1: Species and Types */}
              <div className="attributes-row">
                {/* Species Column */}
                {trainer.species1 && (
                  <div className="attribute-column">
                    <span className="info-label">Species</span>
                    <div className="vertical-grid species-grid">
                      {trainer.species1 && (
                        <span className="species-badge">{trainer.species1}</span>
                      )}
                      {trainer.species2 && (
                        <span className="species-badge">{trainer.species2}</span>
                      )}
                      {trainer.species3 && (
                        <span className="species-badge">{trainer.species3}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Types Column */}
                {trainer.type1 && (
                  <div className="attribute-column">
                    <span className="info-label">Type</span>
                    <div className="vertical-grid types-grid">
                      {trainer.type1 && (
                        <span className={`trainer-type-badge type-${trainer.type1?.toLowerCase() || 'normal'}`}>
                          {trainer.type1}
                        </span>
                      )}
                      {trainer.type2 && (
                        <span className={`trainer-type-badge type-${trainer.type2.toLowerCase()}`}>
                          {trainer.type2}
                        </span>
                      )}
                      {trainer.type3 && (
                        <span className={`trainer-type-badge type-${trainer.type3.toLowerCase()}`}>
                          {trainer.type3}
                        </span>
                      )}
                      {trainer.type4 && (
                        <span className={`trainer-type-badge type-${trainer.type4.toLowerCase()}`}>
                          {trainer.type4}
                        </span>
                      )}
                      {trainer.type5 && (
                        <span className={`trainer-type-badge type-${trainer.type5.toLowerCase()}`}>
                          {trainer.type5}
                        </span>
                      )}
                      {trainer.type6 && (
                        <span className={`trainer-type-badge type-${trainer.type6.toLowerCase()}`}>
                          {trainer.type6}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Ability/Nature/Characteristic and Favorite Types */}
              <div>
                {/* Ability/Nature/Characteristic Column */}
                <div className="attribute-column">
                  {/* Ability */}
                  {trainer.ability && (
                    <div className="attribute-item">
                      <span className="info-label">Ability</span>
                      <div className="vertical-grid ability-grid">
                        <span className="ability-badge">{trainer.ability}</span>
                      </div>
                    </div>
                  )}

                  {/* Nature and Characteristic on one row */}
                  {(trainer.nature || trainer.characteristic) && (
                    <div className="attribute-item">
                      <div className="nature-characteristic-row">
                        {/* Nature */}
                        {trainer.nature && (
                          <div className="nature-characteristic-column">
                            <span className="info-label">Nature</span>
                            <span className="nature-badge">{trainer.nature}</span>
                          </div>
                        )}

                        {/* Characteristic */}
                        {trainer.characteristic && (
                          <div className="nature-characteristic-column">
                            <span className="info-label">Characteristic</span>
                            <span className="characteristic-badge">{trainer.characteristic}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Favorite Types removed from hero section - now in Other Information */}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="trainer-actions">
              <Link to={`/trainers/${trainer.id}/edit`} className="trainer-action-button">
                <i className="fas fa-edit"></i> Edit Trainer
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="trainer-detail-content">
        <div className="trainer-sidebar">
          <div className="sidebar-nav">
            <button
              className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`sidebar-link ${activeTab === 'pc' ? 'active' : ''}`}
              onClick={() => setActiveTab('pc')}
            >
              PC Box
            </button>
            <button
              className={`sidebar-link ${activeTab === 'boxes' ? 'active' : ''}`}
              onClick={() => setActiveTab('boxes')}
            >
              All Boxes
            </button>
            <button
              className={`sidebar-link ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory
            </button>
            <button
              className={`sidebar-link ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Stats
            </button>
            <button
              className={`sidebar-link ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
            <button
              className={`sidebar-link ${activeTab === 'relations' ? 'active' : ''}`}
              onClick={() => setActiveTab('relations')}
            >
              Relations
            </button>
            <button
              className={`sidebar-link ${activeTab === 'refs' ? 'active' : ''}`}
              onClick={() => setActiveTab('refs')}
            >
              Additional Refs
            </button>
            <button
              className={`sidebar-link ${activeTab === 'mega' ? 'active' : ''}`}
              onClick={() => setActiveTab('mega')}
            >
              Mega Info
            </button>

            {/* Owner-only controls */}
            {isOwner && (
              <>
                <div className="sidebar-divider">Owner Controls</div>
                <button
                  className={`sidebar-link ${activeTab === 'edit-boxes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('edit-boxes')}
                >
                  Edit Boxes
                </button>
                <Link
                  to={`/trainers/${trainer.id}/edit`}
                  className={`sidebar-link ${activeTab === 'edit-trainer' ? 'active' : ''}`}
                >
                  Edit Trainer
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="trainer-main-content">
          {activeTab === 'profile' && (
            <div className="trainer-profile-tab">
              {/* Featured Monsters Section - Collapsible */}
              {featuredMonsters.filter(fm => fm !== null).length > 0 && (
                <div className="trainer-monsters-section">
                  <div className="collapsible-header" onClick={() => setFeaturedMonstersCollapsed(!featuredMonstersCollapsed)}>
                    <h2>Featured Monsters</h2>
                    <i className={`fas fa-chevron-${featuredMonstersCollapsed ? 'down' : 'up'}`}></i>
                  </div>
                  {!featuredMonstersCollapsed && (
                  <>
                    <div className="trainer-monsters-grid">
                      {featuredMonsters.filter(monster => monster !== null).map((monster) => (
                        <Link to={`/monsters/${monster.id}`} className="monster-card" key={monster.id}>
                          <div className="monster-image-container">
                            <img
                              src={monster.img_link || monster.image_url || '/images/default_mon.png'}
                              alt={monster.name}
                              className="monster-image"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/default_mon.png';
                              }}
                            />
                          </div>
                          <div className="monster-info-featured">
                            <h2 className="monster-name">{monster.name}</h2>
                            <p className="monster-level">Level: {monster.level}</p>
                          </div>
                          <div className="pc-box-monster-details"> 
                            <span className={`trainer-type-badge type-${monster.type1?.toLowerCase() || 'normal'}`}></span>
                            {monster.type2 && (
                              <span className={`trainer-type-badge type-${monster.type2?.toLowerCase()}`}></span>
                            )}
                            {monster.type3 && (
                              <span className={`trainer-type-badge type-${monster.type3?.toLowerCase()}`}></span>
                            )}
                            {monster.type4 && (
                              <span className={`trainer-type-badge type-${monster.type4?.toLowerCase()}`}></span>
                            )}
                            {monster.type5 && (
                              <span className={`trainer-type-badge type-${monster.type5?.toLowerCase()}`}></span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                    {monsters.length > 0 && (
                      <div className="view-all-container">
                        <button
                          className="view-all-button"
                          onClick={() => setActiveTab('pc')}
                        >
                          View All {monsters.length} Monsters
                        </button>
                      </div>
                    )}
                  </>
                  )}
                </div>
              )}

              {/* Quote Section - Styled uniquely */}
              {trainer.quote && (
                <div className="trainer-quote-section">
                  <div className="quote-content">
                    <p>"{trainer.quote}"</p>
                  </div>
                </div>
              )}

              {/* Personal Information Panel */}
              {(trainer.full_name || trainer.title || trainer.nickname || trainer.age || trainer.gender || trainer.pronouns || trainer.sexuality || trainer.race || trainer.height || trainer.weight || trainer.height_ft || trainer.height_in) && (
                <div className="trainer-panel">
                  <h2>Personal Information</h2>
                  
                  {/* Hero Section */}
                  {(trainer.full_name || trainer.title) && (
                    <div className="personal-hero-section">
                      {trainer.full_name && (
                        <h3 className="full-name">{trainer.full_name}</h3>
                      )}
                      {trainer.title && (
                        <h4 className="title">{trainer.title}</h4>
                      )}
                    </div>
                  )}
                  
                  {/* Sub-hero Section */}
                  {(trainer.nickname || trainer.age) && (
                    <div className="personal-sub-hero">
                      {trainer.nickname && (
                        <span className="nickname">"{trainer.nickname}"</span>
                      )}
                      {trainer.age && (
                        <span className="age">Age: {calculateDisplayAge(trainer.age, trainer.birthday)}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Identity Row */}
                  {(trainer.gender || trainer.pronouns || trainer.sexuality || trainer.race) && (
                    <div className="personal-info-row">
                      {trainer.gender && (
                        <div className="trainer-detail-item">
                          <span className="detail-label">Gender</span>
                          <span className="detail-value">{trainer.gender}</span>
                        </div>
                      )}
                      {trainer.pronouns && (
                        <div className="trainer-detail-item">
                          <span className="detail-label">Pronouns</span>
                          <span className="detail-value">{trainer.pronouns}</span>
                        </div>
                      )}
                      {trainer.sexuality && (
                        <div className="trainer-detail-item">
                          <span className="detail-label">Sexuality</span>
                          <span className="detail-value">{trainer.sexuality}</span>
                        </div>
                      )}
                      {trainer.race && (
                        <div className="trainer-detail-item">
                          <span className="detail-label">Race</span>
                          <span className="detail-value">{trainer.race}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Physical Row */}
                  {(trainer.height || trainer.weight || trainer.height_ft || trainer.height_in) && (
                    <div className="personal-info-row">
                      {(trainer.height || trainer.height_ft || trainer.height_in) && (
                        <div className="trainer-detail-item">
                          <span className="detail-label">Height</span>
                          <span className="detail-value">
                            {trainer.height || (trainer.height_ft ? `${trainer.height_ft}'${trainer.height_in || 0}"` : 'Unknown')}
                          </span>
                        </div>
                      )}
                      {trainer.weight && (
                        <div className="trainer-detail-item">
                          <span className="detail-label">Weight</span>
                          <span className="detail-value">{trainer.weight}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Theme Panel */}
              {(trainer.theme && trainer.theme.trim() !== '' && trainer.theme !== '{"",""}') && ( // Check if theme is not empty or just a pair of empty quotes
                <div className="trainer-panel">
                  <h2>Theme</h2>
                  <div className="trainer-details-grid">
                    <ThemeSection theme={trainer.theme} />
                  </div>
                </div>
              )}

              {/* Voice Claim Panel */}
              {trainer.voice_claim && (
                <div className="trainer-panel">
                  <h2>Voice Claim</h2>
                  <div className="trainer-details-grid">
                    <VoiceClaimSection voice_claim={trainer.voice_claim} />
                  </div>
                </div>
              )}

              {/* Character Information Panel */}
              {(trainer.strengths || trainer.weaknesses || trainer.likes || trainer.dislikes || trainer.flaws || trainer.values || trainer.quirks) && (
                <div className="trainer-panel">
                  <h2>Character Information</h2>
                  <div className="trainer-details-grid-other">
                    {trainer.strengths && (
                      <div className="trainer-detail-item">
                        <span className="detail-label">Character Strengths</span>
                        <span className="detail-value">{trainer.strengths}</span>
                      </div>
                    )}
                    {trainer.weaknesses && (
                      <div className="trainer-detail-item">
                        <span className="detail-label">Character Weaknesses</span>
                        <span className="detail-value">{trainer.weaknesses}</span>
                      </div>
                    )}
                    {trainer.likes && (
                      <div className="trainer-detail-item">
                        <span className="detail-label">Character Likes</span>
                        <span className="detail-value">{trainer.likes}</span>
                      </div>
                    )}
                    {trainer.dislikes && (
                      <div className="trainer-detail-item">
                        <span className="detail-label">Character Dislikes</span>
                        <span className="detail-value">{trainer.dislikes}</span>
                      </div>
                    )}
                    {trainer.flaws && (
                      <div className="trainer-detail-item">
                        <span className="detail-label">Flaws</span>
                        <span className="detail-value">{trainer.flaws}</span>
                      </div>
                    )}
                    {trainer.values && (
                      <div className="trainer-detail-item">
                        <span className="detail-label">Core Values</span>
                        <span className="detail-value">{trainer.values}</span>
                      </div>
                    )}
                    {trainer.quirks && (
                      <div className="trainer-detail-item">
                        <span className="detail-label">Quirks</span>
                        <span className="detail-value">{trainer.quirks}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other Information Panel */}
              {(trainer.job || trainer.occupation || trainer.birthday || trainer.zodiac || trainer.chinese_zodiac || trainer.fav_berry || trainer.birthplace || trainer.residence || trainer.region || trainer.fav_type1) && (
                <div className="trainer-panel">
                  <h2>Other Information</h2>
                  <div className="trainer-other-info-container">
                    {/* Birthday & Zodiac Group */}
                    {(trainer.birthday || trainer.zodiac || trainer.chinese_zodiac) && (
                      <div className="info-group birthday-group">
                        <h3 className="group-title">Birthday & Zodiac</h3>
                        <div className="group-content">
                          {trainer.birthday && (
                            <div className="trainer-detail-item">
                              <span className="detail-label">Birthday</span>
                              <span className="detail-value">{formatBirthday(trainer.birthday)}</span>
                            </div>
                          )}
                          {trainer.zodiac && (
                            <div className="trainer-detail-item">
                              <span className="detail-label">Zodiac Sign</span>
                              <span className="detail-value">
                                {getZodiacEmoji(trainer.zodiac)} {trainer.zodiac}
                              </span>
                            </div>
                          )}
                          {trainer.chinese_zodiac && (
                            <div className="trainer-detail-item">
                              <span className="detail-label">Chinese Zodiac</span>
                              <span className="detail-value">
                                {getChineseZodiacEmoji(trainer.chinese_zodiac)} {trainer.chinese_zodiac}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Location & Work Group */}
                    {(trainer.job || trainer.occupation || trainer.birthplace || trainer.residence || trainer.region) && (
                      <div className="info-group location-group">
                        <h3 className="group-title">Location & Work</h3>
                        <div className="group-content">
                          {(trainer.job || trainer.occupation) && (
                            <div className="trainer-detail-item">
                              <span className="detail-label">Occupation</span>
                              <span className="detail-value">{trainer.job || trainer.occupation}</span>
                            </div>
                          )}
                          {trainer.birthplace && (
                            <div className="trainer-detail-item">
                              <span className="detail-label">Birthplace</span>
                              <span className="detail-value">{trainer.birthplace}</span>
                            </div>
                          )}
                          {trainer.residence && (
                            <div className="trainer-detail-item">
                              <span className="detail-label">Residence</span>
                              <span className="detail-value">{trainer.residence}</span>
                            </div>
                          )}
                          {trainer.region && (
                            <div className="trainer-detail-item">
                              <span className="detail-label">Region</span>
                              <span className="detail-value">{trainer.region}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Favorites Group */}
                    {(trainer.fav_berry || trainer.fav_type1) && (
                      <div className="info-group favorites-group">
                        <h3 className="group-title">Favorites</h3>
                        <div className="group-content">
                          {trainer.fav_berry && (
                            <div className="trainer-detail-item">
                              <span className="detail-label">Favorite Berry</span>
                              <span className="detail-value">{trainer.fav_berry}</span>
                            </div>
                          )}
                          {trainer.fav_type1 && (
                            <div className="trainer-detail-item fav-types-item">
                              <span className="detail-label">Favorite Types</span>
                              <div className="fav-types-grid">
                                {trainer.fav_type1 && (
                                  <span className={`trainer-type-badge type-${trainer.fav_type1?.toLowerCase() || 'normal'}`}>
                                    {trainer.fav_type1}
                                  </span>
                                )}
                                {trainer.fav_type2 && (
                                  <span className={`trainer-type-badge type-${trainer.fav_type2.toLowerCase()}`}>
                                    {trainer.fav_type2}
                                  </span>
                                )}
                                {trainer.fav_type3 && (
                                  <span className={`trainer-type-badge type-${trainer.fav_type3.toLowerCase()}`}>
                                    {trainer.fav_type3}
                                  </span>
                                )}
                                {trainer.fav_type4 && (
                                  <span className={`trainer-type-badge type-${trainer.fav_type4.toLowerCase()}`}>
                                    {trainer.fav_type4}
                                  </span>
                                )}
                                {trainer.fav_type5 && (
                                  <span className={`trainer-type-badge type-${trainer.fav_type5.toLowerCase()}`}>
                                    {trainer.fav_type5}
                                  </span>
                                )}
                                {trainer.fav_type6 && (
                                  <span className={`trainer-type-badge type-${trainer.fav_type6.toLowerCase()}`}>
                                    {trainer.fav_type6}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mega Evolution Information */}
              {((trainer.mega_info && Object.keys(JSON.parse(typeof trainer.mega_info === 'string' ? trainer.mega_info : JSON.stringify(trainer.mega_info))).length > 0) ||
                 trainer.mega_evo || trainer.mega_type1 || trainer.mega_ability) && (
                <div className="trainer-panel">
                  <h2>Mega Evolution</h2>
                  <div className="trainer-mega-info">
                    {(() => {
                      // Parse mega_info if it exists
                      let megaInfo = {};
                      if (trainer.mega_info) {
                        try {
                          megaInfo = typeof trainer.mega_info === 'string'
                            ? JSON.parse(trainer.mega_info)
                            : trainer.mega_info;
                        } catch (e) {
                          console.error('Error parsing mega info:', e);
                        }
                      }

                      // Use either the parsed mega_info or the direct trainer properties
                      const megaRef = megaInfo.mega_ref || trainer.mega_ref || trainer.mega_main_reference;
                      const megaArtist = megaInfo.mega_artist || trainer.mega_artist;
                      const megaSpecies1 = megaInfo.mega_species1 || trainer.mega_species1;
                      const megaSpecies2 = megaInfo.mega_species2 || trainer.mega_species2;
                      const megaSpecies3 = megaInfo.mega_species3 || trainer.mega_species3;
                      const megaType1 = megaInfo.mega_type1 || trainer.mega_type1;
                      const megaType2 = megaInfo.mega_type2 || trainer.mega_type2;
                      const megaType3 = megaInfo.mega_type3 || trainer.mega_type3;
                      const megaType4 = megaInfo.mega_type4 || trainer.mega_type4;
                      const megaType5 = megaInfo.mega_type5 || trainer.mega_type5;
                      const megaType6 = megaInfo.mega_type6 || trainer.mega_type6;
                      const megaAbility = megaInfo.mega_ability || trainer.mega_ability;

                      return (
                        <>
                          {/* Mega Form */}
                          {(megaSpecies1 || trainer.mega_evo) && (
                            <div className="mega-detail-item">
                              <span className="detail-label">Mega Form</span>
                              <span className="detail-value">
                                {[megaSpecies1, megaSpecies2, megaSpecies3].filter(Boolean).join(' / ') || trainer.mega_evo}
                              </span>
                            </div>
                          )}

                          {/* Mega Image */}
                          {megaRef && (
                            <div className="mega-image-container">
                              <img
                                src={megaRef}
                                alt={`${trainer.name} Mega Form`}
                                className="mega-image"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_trainer.png';
                                }}
                              />
                              {megaArtist && (
                                <div className="image-credit">Art by: {megaArtist}</div>
                              )}
                            </div>
                          )}

                          {/* Mega Types */}
                          {megaType1 && (
                            <div className="mega-types">
                              <span className="detail-label">Mega Types</span>
                              <div className="trainer-types">
                                <span className={`trainer-type-badge type-${megaType1?.toLowerCase() || 'normal'}`}>
                                  {megaType1}
                                </span>
                                {megaType2 && (
                                  <span className={`trainer-type-badge type-${megaType2.toLowerCase()}`}>
                                    {megaType2}
                                  </span>
                                )}
                                {megaType3 && (
                                  <span className={`trainer-type-badge type-${megaType3.toLowerCase()}`}>
                                    {megaType3}
                                  </span>
                                )}
                                {megaType4 && (
                                  <span className={`trainer-type-badge type-${megaType4.toLowerCase()}`}>
                                    {megaType4}
                                  </span>
                                )}
                                {megaType5 && (
                                  <span className={`trainer-type-badge type-${megaType5.toLowerCase()}`}>
                                    {megaType5}
                                  </span>
                                )}
                                {megaType6 && (
                                  <span className={`trainer-type-badge type-${megaType6.toLowerCase()}`}>
                                    {megaType6}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Mega Ability */}
                          {megaAbility && (
                            <div className="mega-detail-item">
                              <span className="detail-label">Mega Ability</span>
                              <span className="detail-value">{megaAbility}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Additional References Section */}
              {trainer.additional_refs && trainer.additional_refs.length > 0 && (
                <div className="trainer-panel">
                  <h2>Additional References</h2>
                  <div className="additional-refs-container">
                    {(() => {
                      try {
                        const refs = typeof trainer.additional_refs === 'string'
                          ? JSON.parse(trainer.additional_refs)
                          : trainer.additional_refs;

                        if (Array.isArray(refs) && refs.length > 0) {
                          return (
                            <div className="additional-refs-grid">
                              {refs.map((ref, index) => (
                                <div className="additional-ref-card" key={ref.id || index}>
                                  {ref.image_url && (
                                    <div className="additional-ref-image">
                                      <img
                                        src={ref.image_url}
                                        alt={ref.title || `Reference ${index + 1}`}
                                        onClick={() => handleImageClick(ref.image_url, ref.title || `Reference ${index + 1}`)}
                                        style={{ cursor: 'pointer' }}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = '/images/default_trainer.png';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="additional-ref-info">
                                    {ref.title && <h3>{ref.title}</h3>}
                                    {ref.description && <p>{ref.description}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        } else {
                          return (
                            <div className="no-additional-refs">
                              <p>No additional references available.</p>
                            </div>
                          );
                        }
                      } catch (e) {
                        console.error('Error parsing additional refs:', e);
                        return (
                          <div className="no-additional-refs">
                            <p>Error loading additional references.</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Secrets Section */}
              {trainer.secrets && (() => {
                try {
                  const secrets = typeof trainer.secrets === 'string'
                    ? JSON.parse(trainer.secrets)
                    : trainer.secrets;
                  return Array.isArray(secrets) && secrets.length > 0;
                } catch (e) {
                  return false;
                }
              })() && (
                <div className="trainer-panel">
                  <h2>Secrets</h2>
                  <div className="secrets-container">
                    {(() => {
                      try {
                        const secrets = typeof trainer.secrets === 'string'
                          ? JSON.parse(trainer.secrets)
                          : trainer.secrets;

                        if (Array.isArray(secrets) && secrets.length > 0) {
                          return (
                            <div className="secrets-grid">
                              {secrets.map((secret, index) => (
                                <div className="secret-card" key={secret.id || index}>
                                  <div className="secret-info">
                                    {secret.title && <h3>{secret.title}</h3>}
                                    {secret.description && <p>{secret.description}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                      } catch (e) {
                        console.error('Error parsing secrets:', e);
                        return (
                          <div className="no-secrets">
                            <p>Error loading secrets.</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Biography Section */}
              {(trainer.bio || trainer.long_bio || trainer.biography) && (
                <div className="trainer-panel">
                  <h2>Biography</h2>
                  <div className="trainer-bio">
                    <div 
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ 
                        __html: marked.parse(trainer.bio || trainer.long_bio || trainer.biography) 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="trainer-pc-tab">
              <div className="pc-header">
                <h2>PC Boxes</h2>
                {monsters.length > 0 && (
                  <div className="view-toggle">
                    <button
                      className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                    >
                      <i className="fas fa-th"></i>
                    </button>
                    <button
                      className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                      title="Detailed List View"
                    >
                      <i className="fas fa-list"></i>
                    </button>
                  </div>
                )}
              </div>

              {monsters.length === 0 ? (
                <div className="no-monsters-message">
                  <i className="fas fa-dragon-slash"></i>
                  <p>This trainer doesn't have any monsters yet.</p>
                </div>
              ) : (
                <>
                  {/* Search Bar */}
                  <div className="pc-search-container">
                    <SearchBar
                      placeholder="Search monsters by name, species, or type..."
                      value={searchTerm}
                      onChange={setSearchTerm}
                    />
                    {searchTerm && (
                      <div className="search-results-info">
                        <p>{filteredMonsters.length} monsters found</p>
                        <button 
                          className="clear-search-button"
                          onClick={() => setSearchTerm('')}
                        >
                          <i className="fas fa-times"></i> Clear Search
                        </button>
                      </div>
                    )}
                  </div>

                  {viewMode === 'list' ? (
                    /* List View */
                    renderDetailedListView(filteredMonsters)
                  ) : (
                    /* Grid View */
                    <>
                      {/* PC Box Navigation */}
                      <div className="pc-box-navigation">
                        <div className="pc-box-info">
                          <h3>Box {currentPCBox + 1}</h3>
                          <p>{(searchTerm 
                            ? getFilteredBoxMonsters(currentPCBox) 
                            : getBoxMonstersForDisplay(currentPCBox)
                          ).filter(Boolean).length} / 30 Monsters</p>
                        </div>
                        <div className="pc-box-controls">
                          <button
                            className="pc-box-nav-button"
                            onClick={() => setCurrentPCBox(prev => Math.max(0, prev - 1))}
                            disabled={currentPCBox === 0}
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                          <span className="pc-box-number">Box {currentPCBox + 1} of {getMaxBoxNumber()}</span>
                          <button
                            className="pc-box-nav-button"
                            onClick={() => setCurrentPCBox(prev => Math.min(getMaxBoxNumber() - 1, prev + 1))}
                            disabled={currentPCBox >= getMaxBoxNumber() - 1}
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>
                      </div>

                      {/* PC Box Grid - 6x5 layout */}
                      <div className="pc-box-grid">
                        {Array.from({ length: 30 }).map((_, index) => {
                          // Use different functions based on whether we're searching or not
                          const boxMonsters = searchTerm 
                            ? getFilteredBoxMonsters(currentPCBox)  // Condense gaps for search results
                            : getBoxMonstersForDisplay(currentPCBox); // Respect gaps for normal display
                          const monster = boxMonsters[index];

                          return (
                            <div className="pc-box-slot" key={index}>
                              {monster ? (
                                <Link to={`/monsters/${monster.id}`} className="pc-box-monster">
                                  <div className="pc-box-monster-image-container">
                                    <img
                                      src={monster.img_link || monster.image_url || '/images/default_mon.png'}
                                      alt={monster.name}
                                      className="pc-box-monster-image"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/images/default_mon.png';
                                      }}
                                    />
                                  </div>
                                  <div className="pc-box-monster-info">
                                    <h4 className="pc-box-monster-name">{monster.name}</h4>
                                    <div className="pc-box-monster-details">
                                      <span className="pc-box-monster-level">Lv.{monster.level}</span>
                                      <div className="pc-box-monster-types">
                                        <span className={`type-badge type-${monster.type1?.toLowerCase() || 'normal'}`}></span>
                                        {monster.type2 && <span className={`type-badge type-${monster.type2.toLowerCase()}`}></span>}
                                        {monster.type3 && <span className={`type-badge type-${monster.type3.toLowerCase()}`}></span>}
                                        {monster.type4 && <span className={`type-badge type-${monster.type4.toLowerCase()}`}></span>}
                                        {monster.type5 && <span className={`type-badge type-${monster.type5.toLowerCase()}`}></span>}
                                        
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              ) : (
                                <div className="pc-box-empty-slot"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'boxes' && (
            <div className="trainer-boxes-tab">
              <div className="boxes-header">
                <h2>All Boxes</h2>
                <div className="boxes-header-controls">
                  {monsters.length > 0 && (
                    <div className="view-toggle">
                      <button
                        className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                      >
                        <i className="fas fa-th"></i>
                      </button>
                      <button
                        className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="Detailed List View"
                      >
                        <i className="fas fa-list"></i>
                      </button>
                    </div>
                  )}
                  {isOwner && monsters.length > 0 && (
                    <button 
                      className="mass-edit-button"
                      onClick={handleOpenMassEdit}
                      title="Mass edit your monsters - rename, use berries, and use pastries in bulk"
                    >
                      <i className="fas fa-edit"></i>
                      Mass Edit
                    </button>
                  )}
                </div>
              </div>

              {monsters.length === 0 ? (
                <div className="no-monsters-message">
                  <i className="fas fa-dragon-slash"></i>
                  <p>This trainer doesn't have any monsters yet.</p>
                </div>
              ) : (
                <>
                  {/* Search Bar */}
                  <div className="pc-search-container">
                    <SearchBar
                      placeholder="Search monsters by name, species, or type..."
                      value={searchTerm}
                      onChange={setSearchTerm}
                    />
                    {searchTerm && (
                      <div className="search-results-info">
                        <p>{filteredMonsters.length} monsters found</p>
                        <button 
                          className="clear-search-button"
                          onClick={() => setSearchTerm('')}
                        >
                          <i className="fas fa-times"></i> Clear Search
                        </button>
                      </div>
                    )}
                  </div>

                  {viewMode === 'list' ? (
                    /* List View - Split by boxes */
                    <div className="all-boxes-list">
                      {Array.from({ length: getMaxBoxNumber() }).map((_, boxIndex) => {
                        // For list view, always condense gaps to show compact search results
                        const boxMonsters = getFilteredBoxMonsters(boxIndex).filter(Boolean); // Remove null slots for list view
                        return renderDetailedListView(boxMonsters, `Box ${boxIndex + 1} (${boxMonsters.length}/30)`);
                      })}
                    </div>
                  ) : (
                    /* Grid View */
                    <div className="all-boxes-grid">
                      {Array.from({ length: getMaxBoxNumber() }).map((_, boxIndex) => {
                        // For grid view, respect gaps unless searching
                        const boxMonsters = searchTerm 
                          ? getFilteredBoxMonsters(boxIndex)  // Condense gaps for search results
                          : getBoxMonstersForDisplay(boxIndex); // Respect gaps for normal display

                      return (
                        <div className="box-preview-container" key={boxIndex}>
                          <div className="box-preview-header">
                            <h3>Box {boxIndex + 1}</h3>
                            <span>{boxMonsters.filter(Boolean).length}/30</span>
                          </div>
                          <div className="box-preview">
                            <div
                              className="box-preview-title"
                              onClick={() => {
                                setCurrentPCBox(boxIndex);
                                setActiveTab('pc');
                              }}
                            >
                              View Full Box
                            </div>
                            <div className="box-preview-grid">
                              {/* Always show a 6x5 grid */}
                              {Array.from({ length: 30 }).map((_, slotIndex) => {
                                const monster = boxMonsters[slotIndex];
                                return (
                                  <div className="box-preview-slot" key={slotIndex}>
                                    {monster ? (
                                      <Link
                                        to={`/monsters/${monster.id}`}
                                        className="box-preview-monster"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <img
                                          src={monster.img_link || monster.image_url || '/images/default_mon.png'}
                                          alt={monster.name}
                                          className="box-preview-monster-image"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/images/default_mon.png';
                                          }}
                                        />
                                        <div className="box-preview-monster-name">
                                          {monster.name}
                                        </div>
                                      </Link>
                                    ) : (
                                      <div className="box-preview-empty-slot"></div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="trainer-inventory-tab">
              <h2>Inventory</h2>

              {!trainer.inventory || !trainer.inventory.data || !trainer.inventory.data.data || Object.keys(trainer.inventory.data.data).length === 0 ? (
                <div className="no-inventory-message">
                  <i className="fas fa-box-open"></i>
                  <p>This trainer doesn't have any items yet.</p>
                </div>
              ) : (
                <div className="inventory-sections">
                  {/* Items Section */}
                  {trainer.inventory.data.data.items && Object.keys(trainer.inventory.data.data.items).length > 0 && (
                    <div className="inventory-section">
                      <h3>Items</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.items).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`item-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'items')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'items')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pokéballs Section */}
                  {trainer.inventory.data.data.balls && Object.keys(trainer.inventory.data.data.balls).length > 0 && (
                    <div className="inventory-section">
                      <h3>Pokéballs</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.balls).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`ball-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'balls')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'balls')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Berries Section */}
                  {trainer.inventory.data.data.berries && Object.keys(trainer.inventory.data.data.berries).length > 0 && (
                    <div className="inventory-section">
                      <h3>Berries</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.berries).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`berry-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'berries')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'berries')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evolution Items Section */}
                  {trainer.inventory.data.data.evolution && Object.keys(trainer.inventory.data.data.evolution).length > 0 && (
                    <div className="inventory-section">
                      <h3>Evolution Items</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.evolution).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`evolution-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'evolution')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'evolution')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Held Items Section */}
                  {trainer.inventory.data.data.helditems && Object.keys(trainer.inventory.data.data.helditems).length > 0 && (
                    <div className="inventory-section">
                      <h3>Held Items</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.helditems).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`held-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'helditems')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'helditems')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eggs Section */}
                  {trainer.inventory.data.data.eggs && Object.keys(trainer.inventory.data.data.eggs).length > 0 && (
                    <div className="inventory-section">
                      <h3>Eggs</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.eggs).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`egg-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'eggs')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'eggs')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pastries Section */}
                  {trainer.inventory.data.data.pastries && Object.keys(trainer.inventory.data.data.pastries).length > 0 && (
                    <div className="inventory-section">
                      <h3>Pastries</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.pastries).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`pastry-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'pastries')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'pastries')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Antiques Section */}
                  {trainer.inventory.data.data.antiques && Object.keys(trainer.inventory.data.data.antiques).length > 0 && (
                    <div className="inventory-section">
                      <h3>Antiques</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.antiques).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`antique-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'antiques')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'antiques')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seals Section */}
                  {trainer.inventory.data.data.seals && Object.keys(trainer.inventory.data.data.seals).length > 0 && (
                    <div className="inventory-section">
                      <h3>Seals</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.seals).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`seal-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'seals')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'seals')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Items Section */}
                  {trainer.inventory.data.data.keyitems && Object.keys(trainer.inventory.data.data.keyitems).length > 0 && (
                    <div className="inventory-section">
                      <h3>Key Items</h3>
                      <div className="inventory-items-grid">
                        {Object.entries(trainer.inventory.data.data.keyitems).map(([itemName, quantity], index) => (
                          <div 
                            className="inventory-item clickable-item" 
                            key={`keyitem-${index}`}
                            onClick={() => handleItemDetailClick(itemName, 'keyitems')}
                          >
                            <div className="inventory-item-image">
                              <img
                                src={getItemImageUrl(itemName, 'keyitems')}
                                alt={itemName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_item.png';
                                }}
                              />
                            </div>
                            <div className="inventory-item-details">
                              <span className="inventory-item-name">{itemName}</span>
                              <span className="inventory-item-quantity">x{quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="trainer-stats-tab">
              <h2>Trainer Statistics</h2>

              {/* Monster Stats Section */}
              <div className="stats-section">
                <h3>Monster Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-dragon"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{monsters.length}</div>
                      <div className="stat-label">Total Monsters</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-image"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {trainer.monster_ref_count || 0}/{trainer.monster_count || 0}
                      </div>
                      <div className="stat-label">Monster References</div>
                      <div className="stat-progress">
                        <div
                          className="stat-progress-bar"
                          style={{ width: `${trainer.monster_ref_percent || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-trophy"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {monsters.filter(monster => parseInt(monster.level) === 100).length}
                      </div>
                      <div className="stat-label">Level 100 Monsters</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-coins"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{trainer.currency_amount || 0}</div>
                      <div className="stat-label">Current Currency</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{trainer.total_earned_currency || 0}</div>
                      <div className="stat-label">Total Earned Currency</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Type Distribution */}
              {monsters.length > 0 && (
                <div className="stats-section">
                  <h3>Type Distribution</h3>
                  <div className="type-distribution">
                    {(() => {
                      // Calculate type distribution
                      const typeCount = {};
                      monsters.forEach(monster => {
                        if (monster.type1) {
                          typeCount[monster.type1] = (typeCount[monster.type1] || 0) + 1;
                        }
                        if (monster.type2) {
                          typeCount[monster.type2] = (typeCount[monster.type2] || 0) + 1;
                        }
                        if (monster.type3) {
                          typeCount[monster.type3] = (typeCount[monster.type3] || 0) + 1;
                        }
                      });

                      // Sort types by count
                      const sortedTypes = Object.entries(typeCount)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10); // Show top 10 types

                      return (
                        <div className="type-bars">
                          {sortedTypes.map(([type, count]) => (
                            <div className="type-bar-container" key={type}>
                              <div className="type-bar-label">
                                <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                                <span className="type-count">{count}</span>
                              </div>
                              <div className="type-bar-wrapper">
                                <div
                                  className={`type-bar type-${type.toLowerCase()}`}
                                  style={{ width: `${(count / monsters.length) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Favorite Species */}
              {monsters.length > 0 && (
                <div className="stats-section">
                  <h3>Favorite Species</h3>
                  <div className="favorite-species">
                    {(() => {
                      // Calculate species distribution
                      const speciesCount = {};
                      monsters.forEach(monster => {
                        if (monster.species1) {
                          speciesCount[monster.species1] = (speciesCount[monster.species1] || 0) + 1;
                        }
                        if (monster.species2) {
                          speciesCount[monster.species2] = (speciesCount[monster.species2] || 0) + 1;
                        }
                        if (monster.species3) {
                          speciesCount[monster.species3] = (speciesCount[monster.species3] || 0) + 1;
                        }
                      });

                      // Sort species by count
                      const sortedSpecies = Object.entries(speciesCount)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3); // Show top 3 species

                      return (
                        <div className="favorite-species-grid">
                          {sortedSpecies.map(([species, count]) => {
                            // Find examples of this species
                            const examples = monsters
                              .filter(monster => monster.species1 === species || monster.species2 === species || monster.species3 === species)
                              .slice(0, 3); // Show up to 3 examples

                            return (
                              <div className="favorite-species-card" key={species}>
                                <div className="favorite-species-header">
                                  <h4>{species}</h4>
                                  <span className="species-count">{count} monsters</span>
                                </div>
                                <div className="favorite-species-examples">
                                  {examples.map(monster => (
                                    <Link to={`/monsters/${monster.mon_id}`} className="species-example" key={monster.mon_id}>
                                      <img
                                        src={monster.img_link || '/images/default_mon.png'}
                                        alt={monster.name}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = '/images/default_mon.png';
                                        }}
                                      />
                                      <span>{monster.name}</span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Special Status Monsters */}
              {monsters.length > 0 && (
                <div className="stats-section">
                  <h3>Special Status Monsters</h3>
                  <div className="special-status-grid">
                    {(() => {
                      // Count special status monsters
                      const shinyCount = monsters.filter(m => m.shiny === 1).length;
                      const alphaCount = monsters.filter(m => m.alpha === 1).length;
                      const shadowCount = monsters.filter(m => m.shadow === 1).length;
                      const paradoxCount = monsters.filter(m => m.paradox === 1).length;
                      const pokerusCount = monsters.filter(m => m.pokerus === 1).length;

                      const specialStatuses = [
                        { name: 'Shiny', count: shinyCount, icon: 'fas fa-star' },
                        { name: 'Alpha', count: alphaCount, icon: 'fas fa-crown' },
                        { name: 'Shadow', count: shadowCount, icon: 'fas fa-ghost' },
                        { name: 'Paradox', count: paradoxCount, icon: 'fas fa-infinity' },
                        { name: 'Pokérus', count: pokerusCount, icon: 'fas fa-virus' }
                      ];

                      return specialStatuses.map(status => (
                        <div className="special-status-card" key={status.name}>
                          <div className="special-status-icon">
                            <i className={status.icon}></i>
                          </div>
                          <div className="special-status-content">
                            <div className="special-status-name">{status.name}</div>
                            <div className="special-status-count">{status.count}</div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Attribute Distribution */}
              {monsters.length > 0 && (
                <div className="stats-section">
                  <h3>Attribute Distribution</h3>
                  <div className="attribute-distribution">
                    {(() => {
                      // Calculate attribute distribution
                      const attributeCount = {};
                      monsters.forEach(monster => {
                        if (monster.attribute) {
                          attributeCount[monster.attribute] = (attributeCount[monster.attribute] || 0) + 1;
                        }
                      });

                      // If no attributes found
                      if (Object.keys(attributeCount).length === 0) {
                        return (
                          <div className="no-data-message">
                            <p>No attribute data available for this trainer's monsters.</p>
                          </div>
                        );
                      }

                      // Sort attributes by count
                      const sortedAttributes = Object.entries(attributeCount)
                        .sort((a, b) => b[1] - a[1]);

                      return (
                        <div className="attribute-chart">
                          {sortedAttributes.map(([attribute, count]) => (
                            <div className="attribute-item" key={attribute}>
                              <div className="attribute-name">{attribute}</div>
                              <div className="attribute-bar-wrapper">
                                <div
                                  className="attribute-bar"
                                  style={{ width: `${(count / monsters.length) * 100}%` }}
                                ></div>
                                <span className="attribute-count">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Level Distribution */}
              {monsters.length > 0 && (
                <div className="stats-section">
                  <h3>Level Distribution</h3>
                  <div className="level-distribution">
                    {(() => {
                      // Calculate level ranges
                      const levelRanges = {
                        '1-10': 0,
                        '11-20': 0,
                        '21-30': 0,
                        '31-40': 0,
                        '41-50': 0,
                        '51-60': 0,
                        '61-70': 0,
                        '71-80': 0,
                        '81-90': 0,
                        '91-100': 0,
                        '100+': 0
                      };

                      monsters.forEach(monster => {
                        const level = parseInt(monster.level || 1);
                        if (level <= 10) levelRanges['1-10']++;
                        else if (level <= 20) levelRanges['11-20']++;
                        else if (level <= 30) levelRanges['21-30']++;
                        else if (level <= 40) levelRanges['31-40']++;
                        else if (level <= 50) levelRanges['41-50']++;
                        else if (level <= 60) levelRanges['51-60']++;
                        else if (level <= 70) levelRanges['61-70']++;
                        else if (level <= 80) levelRanges['71-80']++;
                        else if (level <= 90) levelRanges['81-90']++;
                        else if (level <= 100) levelRanges['91-100']++;
                        else levelRanges['100+']++;
                      });

                      return (
                        <div className="level-bars">
                          {Object.entries(levelRanges).map(([range, count]) => (
                            <div className="level-bar-container" key={range}>
                              <div className="level-bar-label">
                                <span className="level-range">{range}</span>
                                <span className="level-count">{count}</span>
                              </div>
                              <div className="level-bar-wrapper">
                                <div
                                  className="level-bar"
                                  style={{ width: `${(count / monsters.length) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {monsters.length === 0 && (
                <div className="no-stats-message">
                  <i className="fas fa-chart-bar"></i>
                  <p>This trainer doesn't have any monsters yet, so statistics cannot be calculated.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="trainer-achievements-tab">
              <div className="achievements-header">
                <h2>Achievements</h2>
                {achievementStats && (
                  <div className="achievement-stats">
                    <div className="stat-item">
                      <span className="stat-number">{achievementStats.unlocked}</span>
                      <span className="stat-label">Unlocked</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{achievementStats.claimed}</span>
                      <span className="stat-label">Claimed</span>
                    </div>
                    {isOwner && achievementStats.unclaimed > 0 && (
                      <div className="stat-item highlight">
                        <span className="stat-number">{achievementStats.unclaimed}</span>
                        <span className="stat-label">Ready to Claim</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Claim All Button */}
                {isOwner && achievementStats && achievementStats.unclaimed > 0 && (
                  <button 
                    className="claim-all-btn"
                    onClick={handleClaimAllAchievements}
                    disabled={isClaimingAll}
                  >
                    {isClaimingAll ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> 
                        Claiming...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trophy"></i> 
                        Claim All ({achievementStats.unclaimed})
                      </>
                    )}
                  </button>
                )}
              </div>

              {achievementsLoading ? (
                <div className="loading-message">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading achievements...</p>
                </div>
              ) : (
                <>
                  <div className="achievement-filters">
                    <button
                      className={`filter-btn ${achievementFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setAchievementFilter('all')}
                    >
                      All ({achievements.length})
                    </button>
                    <button
                      className={`filter-btn ${achievementFilter === 'unlocked' ? 'active' : ''}`}
                      onClick={() => setAchievementFilter('unlocked')}
                    >
                      Unlocked ({achievements.filter(a => a.unlocked).length})
                    </button>
                    <button
                      className={`filter-btn ${achievementFilter === 'type' ? 'active' : ''}`}
                      onClick={() => setAchievementFilter('type')}
                    >
                      Type ({achievements.filter(a => a.category === 'type').length})
                    </button>
                    <button
                      className={`filter-btn ${achievementFilter === 'attribute' ? 'active' : ''}`}
                      onClick={() => setAchievementFilter('attribute')}
                    >
                      Attribute ({achievements.filter(a => a.category === 'attribute').length})
                    </button>
                    <button
                      className={`filter-btn ${achievementFilter === 'level100' ? 'active' : ''}`}
                      onClick={() => setAchievementFilter('level100')}
                    >
                      Level 100 ({achievements.filter(a => a.category === 'level100').length})
                    </button>
                    <button
                      className={`filter-btn ${achievementFilter === 'trainer_level' ? 'active' : ''}`}
                      onClick={() => setAchievementFilter('trainer_level')}
                    >
                      Trainer Level ({achievements.filter(a => a.category === 'trainer_level').length})
                    </button>
                    <button
                      className={`filter-btn ${achievementFilter === 'special' ? 'active' : ''}`}
                      onClick={() => setAchievementFilter('special')}
                    >
                      Special ({achievements.filter(a => a.category === 'special').length})
                    </button>
                    {isOwner && (
                      <button
                        className={`filter-btn ${achievementFilter === 'claimable' ? 'active' : ''}`}
                        onClick={() => setAchievementFilter('claimable')}
                      >
                        Claimable ({achievements.filter(a => a.canClaim).length})
                      </button>
                    )}
                  </div>

                  <div className="achievements-grid">
                    {(() => {
                      const filtered = achievements.filter(achievement => {
                        if (achievementFilter === 'all') return true;
                        if (achievementFilter === 'unlocked') return achievement.unlocked;
                        if (achievementFilter === 'claimable') return achievement.canClaim;
                        return achievement.category === achievementFilter;
                      });
                      console.log(`Showing ${filtered.length} achievements (filter: ${achievementFilter})`);
                      console.log('Sample achievements:', filtered.slice(0, 3).map(a => ({
                        id: a.id,
                        name: a.name,
                        unlocked: a.unlocked,
                        claimed: a.claimed,
                        canClaim: a.canClaim,
                        progress: a.progress,
                        requirement: a.requirement,
                        category: a.category
                      })));
                      
                      // Log specifically about claimable achievements
                      const claimableAchievements = filtered.filter(a => a.canClaim);
                      if (claimableAchievements.length > 0) {
                        console.log(`Found ${claimableAchievements.length} claimable achievements:`, 
                          claimableAchievements.map(a => ({ name: a.name, canClaim: a.canClaim })));
                      } else {
                        console.log('No claimable achievements found. Checking first few achievements...');
                        console.log('Achievement details:', filtered.slice(0, 5).map(a => ({
                          name: a.name,
                          unlocked: a.unlocked,
                          claimed: a.claimed,
                          canClaim: a.canClaim,
                          isOwner: isOwner,
                          progress: a.progress,
                          requirement: a.requirement
                        })));
                      }
                      return filtered;
                    })().map(achievement => (
                        <div 
                          key={achievement.id} 
                          className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} ${achievement.claimed ? 'claimed' : ''}`}
                        >
                          <div className="achievement-icon">
                            {achievement.category === 'type' && <i className="fas fa-fire"></i>}
                            {achievement.category === 'attribute' && <i className="fas fa-shield-alt"></i>}
                            {achievement.category === 'level100' && <i className="fas fa-star"></i>}
                            {achievement.category === 'trainer_level' && <i className="fas fa-trophy"></i>}
                            {achievement.category === 'special' && <i className="fas fa-crown"></i>}
                          </div>
                          
                          <div className="achievement-content">
                            <h3 className="achievement-name">{achievement.name}</h3>
                            <p className="achievement-description">{achievement.description}</p>
                            
                            <div className="achievement-progress">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ 
                                    width: `${Math.min(100, (achievement.progress / achievement.requirement) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="progress-text">
                                {achievement.progress} / {achievement.requirement}
                              </span>
                            </div>

                            {achievement.reward && (
                              <div className="achievement-reward">
                                {achievement.reward.currency && (
                                  <span className="reward-currency">
                                    <i className="fas fa-coins"></i> {achievement.reward.currency}
                                  </span>
                                )}
                                {achievement.reward.item && (
                                  <span className="reward-item">
                                    <i className="fas fa-gift"></i> {achievement.reward.item}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="achievement-status">
                            {console.log(`Achievement ${achievement.name} status:`, {
                              claimed: achievement.claimed,
                              canClaim: achievement.canClaim,
                              unlocked: achievement.unlocked,
                              isOwner: isOwner
                            })}
                            {achievement.claimed && (
                              <span className="status-claimed">
                                <i className="fas fa-check-circle"></i> Claimed
                              </span>
                            )}
                            {achievement.canClaim && (
                              <button 
                                className="claim-btn"
                                onClick={() => {
                                  console.log(`Claiming achievement: ${achievement.id} - ${achievement.name}`);
                                  handleClaimAchievement(achievement.id);
                                }}
                              >
                                <i className="fas fa-hand-point-right"></i> Claim
                              </button>
                            )}
                            {achievement.unlocked && !achievement.claimed && !achievement.canClaim && (
                              <span className="status-unlocked">
                                <i className="fas fa-unlock"></i> Unlocked
                              </span>
                            )}
                            {!achievement.unlocked && (
                              <span className="status-locked">
                                <i className="fas fa-lock"></i> Locked
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {achievements.length === 0 && (
                    <div className="no-achievements-message">
                      <i className="fas fa-trophy"></i>
                      <p>No achievements found.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'relations' && (
            <div className="trainer-relations-tab">
              <h2>Relations</h2>

              {!trainer.relations || (() => {
                try {
                  const relations = typeof trainer.relations === 'string'
                    ? JSON.parse(trainer.relations)
                    : trainer.relations;
                  return !Array.isArray(relations) || relations.length === 0;
                } catch (e) {
                  return true;
                }
              })() ? (
                <div className="no-relations-message">
                  <i className="fas fa-users"></i>
                  <p>This trainer doesn't have any documented relations yet.</p>
                </div>
              ) : (
                <div className="relations-grid">
                  {(() => {
                    try {
                      const relations = typeof trainer.relations === 'string'
                        ? JSON.parse(trainer.relations)
                        : trainer.relations;

                      return relations.map((relation, index) => {
                        const relatedTrainer = relatedTrainers[relation.trainer_id];
                        const relatedMonster = relatedMonsters[relation.monster_id];
                        const isMonsterRelation = relation.type === 'monster' || relation.monster_id;
                        
                        console.log('Relation debug:', {
                          relation,
                          isMonsterRelation,
                          relatedTrainer,
                          relatedMonster,
                          relatedMonsters
                        });
                        
                        return (
                          <div className="relation-card" key={`relation-${index}`}>
                            <div className="relation-card-content">
                              <div className="relation-header">
                                <h3>{relation.name || 'Unknown Relation'}</h3>
                                <span className="relation-type-badge">
                                  {isMonsterRelation ? 'Monster' : 'Trainer'}
                                </span>
                              </div>
                              
                              <div className="relation-details">
                                {/* Entity Image Container */}
                                {!isMonsterRelation && relation.trainer_id && relatedTrainer && (
                                  <div className="relation-entity-image-container">
                                    <Link to={`/trainers/${relation.trainer_id}`} className="entity-link">
                                      <img
                                        className="relation-entity-image"
                                        src={relatedTrainer.icon || relatedTrainer.main_ref || '/images/default_trainer.png'}
                                        alt={relatedTrainer.name}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = '/images/default_trainer.png';
                                        }}
                                      />
                                    </Link>
                                  </div>
                                )}
                                
                                {isMonsterRelation && relation.monster_id && relatedMonster && (
                                  <div className="relation-entity-image-container">
                                    <Link to={`/monsters/${relation.monster_id}`} className="entity-link">
                                      <img
                                        className="relation-entity-image"
                                        src={relatedMonster.img_link || relatedMonster.image_url || '/images/default_mon.png'}
                                        alt={relatedMonster.name}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = '/images/default_mon.png';
                                        }}
                                      />
                                    </Link>
                                  </div>
                                )}

                                <div 
                                  className="relation-entity-info"
                                >
                                {/* Entity Info */}
                                {!isMonsterRelation && relation.trainer_id && relatedTrainer && (
                                  <div className="relation-entity-heading">
                                    <h4 className="relation-entity-name">
                                      <Link to={`/trainers/${relation.trainer_id}`}>{relatedTrainer.name}</Link>
                                    </h4>
                                  </div>
                                )}
                                
                                {isMonsterRelation && relation.monster_id && relatedMonster && (
                                  <div className="relation-entity-heading">
                                    <h4 className="relation-entity-name">
                                      <Link to={`/monsters/${relation.monster_id}`}>{relatedMonster.name}</Link>
                                    </h4>
                                    <div className="relation-entity-species">
                                      {[relatedMonster.species1, relatedMonster.species2, relatedMonster.species3]
                                        .filter(Boolean)
                                        .join(' ')}
                                    </div>
                                    {relatedTrainer && (
                                      <div className="relation-entity-owner">
                                        owned by <Link to={`/trainers/${relation.trainer_id}`}>{relatedTrainer.name}</Link>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {relation.elaboration && (
                                  <div className="relation-elaboration">
                                    <p>{relation.elaboration}</p>
                                  </div>
                                )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    } catch (e) {
                      console.error('Error parsing relations:', e);
                      return (
                        <div className="relations-error">
                          <p>Error loading relations data.</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'refs' && (
            <div className="trainer-refs-tab">
              <h2>Additional References</h2>

              {!trainer.additional_refs || trainer.additional_refs.length === 0 ? (
                <div className="no-refs-message">
                  <i className="fas fa-images"></i>
                  <p>This trainer doesn't have any additional references yet.</p>
                </div>
              ) : (
                <div className="refs-grid">
                  {trainer.additional_refs.map((ref, index) => (
                    <div className="ref-item" key={`ref-${index}`}>
                      <div className="ref-header">
                        <h3>{ref.title || 'Untitled Reference'}</h3>
                      </div>
                      <div className="ref-content">
                        {ref.image_url ? (
                          <div className="ref-image-container">
                            <img
                              src={ref.image_url}
                              alt={ref.title || 'Reference image'}
                              className="ref-image"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/default_trainer.png';
                              }}
                            />
                            {ref.artist && (
                              <div className="ref-image-credit">Art by: {ref.artist}</div>
                            )}
                          </div>
                        ) : ref.text ? (
                          <div className="ref-text">
                            <p>{ref.text}</p>
                          </div>
                        ) : (
                          <div className="ref-empty">
                            <p>No content available</p>
                          </div>
                        )}
                      </div>
                      {ref.description && (
                        <div className="ref-description">
                          <p>{ref.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'mega' && (
            <div className="trainer-mega-tab">
              <h2>Mega Information</h2>

              {(() => {
                let megaInfo = null;
                try {
                  megaInfo = trainer.mega_info ? JSON.parse(trainer.mega_info) : null;
                } catch (e) {
                  console.error('Error parsing mega_info:', e);
                  megaInfo = null;
                }

                if (!megaInfo || Object.keys(megaInfo).length === 0 || 
                    (!megaInfo.mega_ref && !megaInfo.mega_species1 && !megaInfo.mega_type1 && !megaInfo.mega_ability)) {
                  return (
                    <div className="no-mega-info-message">
                      <i className="fas fa-user-shield"></i>
                      <p>This trainer doesn't have mega information yet.</p>
                      {isOwner && (
                        <p>Submit a trainer mega reference to add mega information!</p>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="mega-info-container">
                    {/* Mega Reference Image */}
                    {megaInfo.mega_ref && (
                      <div className="mega-reference-section">
                        <h3>Mega Reference</h3>
                        <div className="mega-image-container">
                          <img
                            src={megaInfo.mega_ref}
                            alt="Trainer Mega Reference"
                            className="mega-reference-image"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/default_trainer.png';
                            }}
                          />
                          {megaInfo.mega_artist && (
                            <div className="mega-image-credit">Art by: {megaInfo.mega_artist}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mega Stats */}
                    <div className="mega-stats-section">
                      <h3>Mega Stats</h3>
                      <div className="mega-stats-grid">
                        {/* Species */}
                        {(megaInfo.mega_species1 || megaInfo.mega_species2 || megaInfo.mega_species3) && (
                          <div className="mega-stat-group">
                            <h4>Species</h4>
                            <div className="mega-species-list">
                              {megaInfo.mega_species1 && <span className="mega-species">{megaInfo.mega_species1}</span>}
                              {megaInfo.mega_species2 && <span className="mega-species">{megaInfo.mega_species2}</span>}
                              {megaInfo.mega_species3 && <span className="mega-species">{megaInfo.mega_species3}</span>}
                            </div>
                          </div>
                        )}

                        {/* Types */}
                        {(megaInfo.mega_type1 || megaInfo.mega_type2 || megaInfo.mega_type3 || 
                          megaInfo.mega_type4 || megaInfo.mega_type5 || megaInfo.mega_type6) && (
                          <div className="mega-stat-group">
                            <h4>Types</h4>
                            <div className="mega-types-list">
                              {megaInfo.mega_type1 && <span className={`mega-type type-${megaInfo.mega_type1.toLowerCase()}`}>{megaInfo.mega_type1}</span>}
                              {megaInfo.mega_type2 && <span className={`mega-type type-${megaInfo.mega_type2.toLowerCase()}`}>{megaInfo.mega_type2}</span>}
                              {megaInfo.mega_type3 && <span className={`mega-type type-${megaInfo.mega_type3.toLowerCase()}`}>{megaInfo.mega_type3}</span>}
                              {megaInfo.mega_type4 && <span className={`mega-type type-${megaInfo.mega_type4.toLowerCase()}`}>{megaInfo.mega_type4}</span>}
                              {megaInfo.mega_type5 && <span className={`mega-type type-${megaInfo.mega_type5.toLowerCase()}`}>{megaInfo.mega_type5}</span>}
                              {megaInfo.mega_type6 && <span className={`mega-type type-${megaInfo.mega_type6.toLowerCase()}`}>{megaInfo.mega_type6}</span>}
                            </div>
                          </div>
                        )}

                        {/* Ability */}
                        {megaInfo.mega_ability && (
                          <div className="mega-stat-group">
                            <h4>Ability</h4>
                            <span className="mega-ability">{megaInfo.mega_ability}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'edit-boxes' && (
            <div className="trainer-edit-boxes-tab">
              <div className="edit-boxes-header">
                <h2>Edit Boxes</h2>
                <div className="edit-boxes-actions">
                  <button
                    className="edit-boxes-button save-button"
                    onClick={handleSaveBoxes}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Save Changes
                      </>
                    )}
                  </button>
                  <button
                    className="edit-boxes-button cancel-button"
                    onClick={() => setActiveTab('boxes')}
                  >
                    <i className="fas fa-times"></i> Cancel
                  </button>
                </div>
              </div>

              {statusMessage && (
                <div className={`status-message ${statusType}`}>
                  {statusMessage}
                </div>
              )}

              {/* Featured Monsters Section */}
              <div className="edit-box-container featured-monsters-box">
                <div className="edit-box-header">
                  <h3>Featured Monsters</h3>
                  <span>{featuredMonsters.length}/6</span>
                  <button
                    className="featured-monsters-save-button"
                    onClick={handleSaveFeaturedMonsters}
                    disabled={isSaving}
                    title="Save featured monsters"
                  >
                    {isSaving ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-star"></i>
                    )}
                  </button>
                </div>
                <div
                  className="edit-box-grid featured-monsters-grid featured-monsters-compact"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gridTemplateRows: '1fr',
                    gap: '8px',
                    maxWidth: '600px',
                    margin: '0 auto'
                  }}
                >
                  {Array.from({ length: 6 }).map((_, slotIndex) => {
                    const featuredMonster = featuredMonsters[slotIndex];

                    return (
                      <div
                        className={`edit-box-slot featured-monster-slot ${featuredMonster ? 'filled' : 'empty'}`}
                        key={slotIndex}
                        data-slot={slotIndex}
                        style={{
                          width: '80px',
                          height: '80px',
                          fontSize: '10px'
                        }}
                        onDragOver={handleFeaturedDragOver}
                        onDragEnter={handleFeaturedDragEnter}
                        onDragLeave={handleFeaturedDragLeave}
                        onDrop={(e) => handleFeaturedDrop(e, slotIndex)}
                      >
                        {featuredMonster ? (
                          <div
                            className="edit-box-monster"
                            style={{ position: 'relative', width: '100%', height: '100%' }}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, featuredMonster, -1, slotIndex)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="edit-box-monster-image" style={{ width: '50px', height: '50px' }}>
                              <img
                                src={featuredMonster.img_link || '/images/default_mon.png'}
                                alt={featuredMonster.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_mon.png';
                                }}
                              />
                            </div>
                            <div className="edit-box-monster-info" style={{ fontSize: '8px', padding: '2px' }}>
                              {featuredMonster.name.length > 8 ? featuredMonster.name.substring(0, 8) + '...' : featuredMonster.name}
                            </div>
                            <button
                              className="remove-featured-button"
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '16px',
                                height: '16px',
                                fontSize: '8px',
                                padding: '0',
                                border: 'none',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 0, 0, 0.7)',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedFeatured = [...featuredMonsters];
                                updatedFeatured[slotIndex] = null;
                                setFeaturedMonsters(updatedFeatured);
                                setStatusMessage('Monster removed from featured. Remember to save your changes!');
                                setStatusType('info');
                              }}
                              title="Remove from featured"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="featured-monster-empty" style={{ fontSize: '8px', padding: '4px' }}>
                            <i className="fas fa-star" style={{ fontSize: '12px', marginBottom: '2px' }}></i>
                            <span style={{ display: 'block', lineHeight: '1' }}>Drop Here</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="featured-monsters-instructions">
                  <p>
                    <i className="fas fa-info-circle"></i> Drag monsters from the boxes below into the featured slots above.
                    Featured monsters appear on your trainer's profile page.
                  </p>
                </div>
              </div>

              <div className="edit-boxes-instructions">
                <p>
                  <i className="fas fa-info-circle"></i> Drag and drop monsters to rearrange them between boxes or add them to featured slots.
                  Changes will not be saved until you click "Save Changes" or "Save Featured".
                </p>
              </div>

              <div className="edit-boxes-controls">
                <button
                  className="add-box-button"
                  onClick={handleAddBox}
                  title="Add a new empty box for better organization"
                >
                  <i className="fas fa-plus"></i> Add Box
                </button>
              </div>

              <div className="edit-boxes-grid">
                {Array.from({ length: Math.max(getMaxBoxNumber(), 1) }).map((_, boxIndex) => {
                  const boxMonsters = getBoxMonsters(boxIndex);

                  return (
                    <div className="edit-box-container" key={boxIndex}>
                      <div className="edit-box-header">
                        <h3>Box {boxIndex + 1}</h3>
                        <span>{boxMonsters.filter(Boolean).length}/30</span>
                      </div>
                      <div
                        className="edit-box-grid"
                        data-box-number={boxIndex}
                      >
                        {Array.from({ length: 30 }).map((_, slotIndex) => {
                          const monster = boxMonsters[slotIndex];

                          return (
                            <div
                              className={`edit-box-slot ${monster ? 'filled' : 'empty'}`}
                              key={slotIndex}
                              data-box={boxIndex}
                              data-slot={slotIndex}
                              data-monster-id={monster?.id}
                              draggable={!!monster}
                              onDragStart={(e) => handleDragStart(e, monster, boxIndex, slotIndex)}
                              onDragOver={handleDragOver}
                              onDragEnter={handleDragEnter}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, boxIndex, slotIndex)}
                              onDragEnd={handleDragEnd}
                            >
                              {monster && (
                                <div className="edit-box-monster">
                                  <div className="edit-box-monster-image">
                                    <img
                                      src={monster.img_link || '/images/default_mon.png'}
                                      alt={monster.name}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/images/default_mon.png';
                                      }}
                                    />
                                  </div>
                                  <div className="edit-box-monster-info">
                                    {monster.name}
                                    {featuredMonsters.some(fm => fm && fm.id === monster.id) && (
                                      <i className="fas fa-star featured-indicator" title="Featured Monster"></i>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edit Trainer tab removed - direct link in sidebar */}
        </div>
      </div>

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
              <h2>{rewardPopupData.isBulk ? '🎉 Achievements Claimed!' : '🎉 Achievement Unlocked!'}</h2>
              <button 
                className="popup-close-btn"
                onClick={() => setShowRewardPopup(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="popup-content">
              {rewardPopupData.isBulk ? (
                // Bulk claim display
                <div className="bulk-claim-info">
                  <div className="bulk-stats">
                    <div className="bulk-stat-item">
                      <i className="fas fa-trophy"></i>
                      <span>{rewardPopupData.claimedCount} Achievements Claimed</span>
                    </div>
                  </div>
                  
                  <div className="claimed-achievements-list">
                    <h4>📋 Claimed Achievements:</h4>
                    <div className="claimed-achievements-scroll">
                      {rewardPopupData.claimedAchievements.map((achievement, index) => (
                        <div key={index} className="claimed-achievement-item">
                          <div className="achievement-icon-small">
                            {achievement.category === 'type' && <i className="fas fa-fire"></i>}
                            {achievement.category === 'attribute' && <i className="fas fa-shield-alt"></i>}
                            {achievement.category === 'level100' && <i className="fas fa-star"></i>}
                            {achievement.category === 'trainer_level' && <i className="fas fa-trophy"></i>}
                            {achievement.category === 'special' && <i className="fas fa-crown"></i>}
                          </div>
                          <span className="achievement-name-small">{achievement.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="rewards-section">
                    <h4>🎁 Total Rewards Earned:</h4>
                    <div className="rewards-list">
                      {rewardPopupData.totalRewards.currency && (
                        <div className="reward-item-popup">
                          <i className="fas fa-coins reward-icon"></i>
                          <span className="reward-text">{rewardPopupData.totalRewards.currency} Coins</span>
                        </div>
                      )}
                      {rewardPopupData.totalRewards.items && rewardPopupData.totalRewards.items.length > 0 && (
                        rewardPopupData.totalRewards.items.map((item, index) => (
                          <div key={index} className="reward-item-popup">
                            <i className="fas fa-gift reward-icon"></i>
                            <span className="reward-text">{item}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Single achievement display
                <div className="achievement-info">
                  <div className="achievement-icon-large">
                    {rewardPopupData.achievement.category === 'type' && <i className="fas fa-fire"></i>}
                    {rewardPopupData.achievement.category === 'attribute' && <i className="fas fa-shield-alt"></i>}
                    {rewardPopupData.achievement.category === 'level100' && <i className="fas fa-star"></i>}
                    {rewardPopupData.achievement.category === 'trainer_level' && <i className="fas fa-trophy"></i>}
                    {rewardPopupData.achievement.category === 'special' && <i className="fas fa-crown"></i>}
                  </div>
                  <h3 className="achievement-name-popup">{rewardPopupData.achievement.name}</h3>
                  <p className="achievement-description-popup">{rewardPopupData.achievement.description}</p>
                  
                  <div className="rewards-section">
                    <h4>🎁 Rewards Earned:</h4>
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
                </div>
              )}
            </div>
            
            <div className="popup-footer">
              <button 
                className="popup-ok-btn"
                onClick={() => setShowRewardPopup(false)}
              >
                Awesome! 🎉
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
        trainerId={id}
        trainerInventory={trainerInventory}
        onComplete={handleMassEditComplete}
      />

      {/* Image Modal */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              <i className="fas fa-times"></i>
            </button>
            <img
              src={modalImageSrc}
              alt={modalImageAlt}
              className="image-modal-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/default_trainer.png';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerDetailPage;
