// Adoption Controller
export {
  getCurrentMonthAdopts,
  getAllAdopts,
  getAdoptsByYearAndMonth,
  getMonthsWithData,
  checkDaycareDaypass,
  getBerriesForAdoption,
  getPastriesForAdoption,
  claimAdopt,
  generateMonthlyAdopts,
  generateTestData,
  addDaycareDaypass,
} from './town/adoption.controller';

// Adventure Controller
export {
  getAllAdventures,
  getAdventureById,
  getTrainerAdventures,
  getAvailableRegions,
  createAdventure,
  updateAdventure,
  deleteAdventure,
  completeAdventure,
  claimRewards,
} from './adventure/adventure.controller';

// Items Controller
export {
  getAllItems,
  getAllCategories,
  getAllTypes,
  getAllRarities,
  getItemById,
  createItem,
  createBulkItems,
  uploadImage,
  updateItem,
  deleteItem,
  useBerry,
  usePastry,
  applyPastry,
  rollItems,
  rollItemsForTrainer,
  addItemToTrainer,
  addItemToBulkTrainers,
  addItemToAllTrainers,
  addSpecialBerriesToTrainer,
  batchUpdateItemImages,
} from './api/items.controller';

// User Controller (Admin)
export {
  getAdminUsers,
  getAllUsers,
  getUserById,
  createUser,
  updateUser as updateUserAdmin,
  deleteUser,
  getUserRelatedSubmissions,
} from './api/user.controller';

// Auth Controller
export {
  registerUser,
  loginUser,
  refreshToken,
  getUserProfile,
  updateUserProfile,
  getMonsterRollerSettings,
  updateMonsterRollerSettings,
  updateUserTheme,
  updateContentSettings,
  updateNotificationSettings,
  testDiscordConfig,
  discordCallback,
  discordLinkStart,
  discordLinkCallback,
} from './api/auth.controller';

// Art Todo Controller
export {
  getPersonalItems,
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  getItems as getArtTodoItems,
  createItem as createArtTodoItem,
  updateItem as updateArtTodoItem,
  moveItem,
  deleteItem as deleteArtTodoItem,
  getItemReferences,
  getItemReferenceMatrix,
  addItemReference,
  removeItemReference,
  getUserTrainers,
  getUserMonsters,
} from './misc/art-todo.controller';

// Shop Controller
export {
  getShops,
  getActiveShops,
  getVisibleShops,
  getShopById,
  createShop,
  updateShop as updateShopHandler,
  deleteShop as deleteShopHandler,
  getShopItems,
  addShopItem,
  updateShopItem,
  removeShopItem,
  stockShop,
  purchaseItem,
} from './town/shop.controller';

// Mega Mart Controller
export {
  getMonsterAbilities,
  useAbilityCapsule,
  useScrollOfSecrets,
  getAllAbilities,
} from './town/mega-mart.controller';

// Schedule Controller (combined tasks, habits, routines, dashboard, scheduled tasks)
export {
  // Tasks
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  // Habits
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  trackHabit,
  deleteHabit,
  // Routines
  getRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  addRoutineItem,
  updateRoutineItem,
  deleteRoutineItem,
  completeRoutineItem,
  getTodaysRoutines,
  // Dashboard
  getDashboard,
  // Scheduled Tasks (Admin)
  runMonthlyTasks,
  addMonthlyItems,
  manualMonthlyDistribution,
  getCronJobStatus,
  getMonthlyItemsConfig,
  updateMonthlyItemsConfig,
  getDistributionRuns,
} from './misc/schedule.controller';

// Monster Controller
export {
  getAllMonsters,
  searchMonsters,
  getMonsterById,
  getMonstersByUserId,
  createMonster as createMonsterHandler,
  updateMonster as updateMonsterHandler,
  deleteMonster as deleteMonsterHandler,
  addMonsterImage,
  getMonsterImages,
  uploadMonsterImage,
  getMegaImages,
  addMegaStoneImage,
  addMegaImage,
  setMonsterEvolutionData,
  getMonsterEvolutionData,
  getMonsterEvolutionChain,
  getMonsterMoves,
  getMonsterGallery,
  getMonsterReferences,
  addMonsterLevels,
  initializeMonsterController,
  getMonsterLineage,
  addMonsterLineage,
  removeMonsterLineage,
  getMonsterTypes,
  getMonsterAttributes,
  getMonsterSpecies,
  adminBulkAddMonsters,
} from './monsters/monster.controller';

// Monster Roller Controller
export {
  rollMonster,
  rollMany,
  rollForTrainer,
  getOptions as getRollerOptions,
} from './monsters/monster-roller.controller';

// Starter Roller Controller
export {
  rollStarterSets,
  selectStarters,
} from './monsters/starter-roller.controller';

// Evolution Controller
export {
  evolveMonster,
  getEvolutionOptions,
  getEvolutionOptionsBySpecies,
  getReverseEvolutionOptions,
} from './api/evolution.controller';

// Boss Controller
export {
  getCurrentBoss,
  getBossById,
  getBossLeaderboard,
  getCurrentBossWithLeaderboard,
  getDefeatedBosses,
  getDefeatedBossById,
  addBossDamage,
  getCurrentBossWithRewards,
  getUnclaimedRewards,
  claimBossReward,
  getAllBosses,
  createBoss,
  updateBoss,
  deleteBoss,
} from './adventure/boss.controller';

// Content Controller
export {
  getCategories,
  getContent,
  saveContent,
  deleteContent,
  createDirectory,
} from './misc/content.controller';

// Events Controller
export {
  getEventCategories,
  getEventContent,
  getCurrentEvents,
  getPastEvents,
  getUpcomingEvents,
} from './adventure/events.controller';

// Mission Controller
export {
  getAllMissions,
  getMissionById,
  getAvailableMissions,
  getActiveMissions,
  getEligibleMonsters,
  startMission,
  claimMissionRewards,
  createMission as createMissionHandler,
} from './adventure/mission.controller';

// Nursery Controller
export {
  getTrainerEggs,
  getEggItems,
  startHatch,
  startNurture,
  getHatchSession,
  selectHatchedMonster,
  rerollHatchingResults,
} from './town/nursery.controller';

// Faction Controller
export {
  getAllFactions,
  getFactionById,
  getTrainerStandings,
  getTrainerFactionStanding,
  updateTrainerStanding,
  getFactionStore,
  purchaseFromFactionStore,
  submitTribute,
  getTrainerTributes,
  getPendingTributes,
  reviewTribute,
  getTributeRequirement,
  createFactionSubmission,
  getTrainerFactionSubmissions,
  getAvailableSubmissions,
  getAvailableSubmissionsForTribute,
  getAvailableSubmissionsForMeeting,
  getFactionPrompts,
  createFactionPrompt,
  updateFactionPrompt,
  getFactionPeople,
  getPersonById as getPersonByIdFaction,
  meetPerson,
  getTrainerMetPeople,
  getAllFactionPeopleAdmin,
  createFactionPersonAdmin,
  updateFactionPersonAdmin,
  deleteFactionPersonAdmin,
  getPersonTeamAdmin,
  addMonsterToTeamAdmin,
  updateMonsterAdmin,
  deleteMonsterAdmin,
} from './adventure/faction.controller';

// Statistics Controller
export {
  getOverallStats,
  getMonsterStats,
  getTrainerStats as getTrainerStatsHandler,
  getTrainerComparisonStats,
  getLeaderboardStats,
  getAchievementStats,
  getAdminDashboardStats,
} from './misc/statistics.controller';

// Submission Controller
export {
  getArtGallery,
  getWritingLibrary,
  getSubmissionTags,
  getSubmissionById,
  getMySubmissions,
  getGiftItems as getSubmissionGiftItems,
  getSubmissionRewards,
  getAvailablePrompts,
  calculateArtRewards,
  calculateWritingRewards,
  calculateReferenceRewards,
  calculatePromptRewards,
  submitArt,
  submitWriting,
  submitReference,
  submitPrompt,
  submitPromptCombined,
  allocateGiftLevels,
  allocateGiftCoins,
  allocateCappedLevels,
  allocateGiftItem,
  claimPromptRewards,
  generateGiftItems,
  generateGiftMonsters,
  finalizeGiftRewards,
	  forfeitGiftMonster,
  rerollSubmissionItems,
  rerollSubmissionMonsters,
  claimSubmissionMonster,
  getUserBooks,
  getBookChapters,
  updateChapterOrder,
  createBook,
  updateSubmission,
  deleteSubmission,
  getBookCollaborators,
  addBookCollaborator,
  removeBookCollaborator,
  updateCollaboratorRole,
  getUserCollaborations,
  searchCollaboratorUsers,
} from './misc/submission.controller';

// Game Corner Controller
export {
  generateGameCornerRewards,
  claimGameCornerReward,
} from './town/game-corner.controller';

// Chat Controller
export {
  getChatProfile,
  updateChatProfile,
  getUnreadCounts,
  getUserTotalUnread,
  getMyRooms,
  getRoomDetails,
  createGroupChat,
  markRoomRead,
  getMessages,
  getOlderMessages,
  getDmRequests,
  sendDmRequest,
  respondDmRequest,
  updateRoomIcon,
  uploadChatImage,
} from './chat/chat.controller';

// Chat Admin Controller
export {
  adminGetAllRooms,
  adminCreateRoom,
  adminDeleteRoom,
  adminAddMember,
  adminRemoveMember,
  adminGetRoomMembers,
  adminGetMessages,
  adminSendMessage,
} from './chat/chat-admin.controller';

// Area Controller
export {
  getLandmasses,
  getRegionsForLandmass,
  getAreasForRegion,
  getAreaConfiguration,
  getAreaHierarchy,
} from './adventure/area.controller';
