import express, { Router } from 'express';

// Auth & User Routes
import authRoutes from './api/auth.routes';
import userRoutes from './api/user.routes';

// Schedule & Art Todo Routes
import scheduleRoutes from './misc/schedule.routes';
import artTodoRoutes from './misc/art-todo.routes';

// Shop Routes
import shopRoutes from './town/shop.routes';

// Town Routes Imports
import adoptionRoutes from './town/adoption.routes';
import tradeRoutes from './town/trade.routes';
import bazarRoutes from './town/bazar.routes';
import megaMartRoutes from './town/mega-mart.routes';
import locationActivityRoutes from './town/location-activity.routes';
import gameCornerRoutes from './town/game-corner.routes';

// Adventure Routes Imports
import adventureRoutes from './adventure/adventure.routes';
import adventureDiscordRoutes from './adventure/adventure-discord.routes';
import areaRoutes from './adventure/area.routes';

// Item Routes Imports
import itemsRoutes from './api/items.routes';

// Monster Routes Imports
import monsterRoutes from './monsters/monster.routes';
import monsterRollerRoutes from './monsters/monster-roller.routes';
import starterRollerRoutes from './monsters/starter-roller.routes';
import evolutionRoutes from './api/evolution.routes';

// Boss, Content, Events, Mission Routes
import bossRoutes from './adventure/boss.routes';
import contentRoutes from './misc/content.routes';
import guidesRoutes from './misc/guides.routes';
import eventsRoutes from './adventure/events.routes';
import eventAdminRoutes from './adventure/event-admin.routes';
import missionRoutes from './adventure/mission.routes';

// Ability Routes
import abilityRoutes from './api/ability.routes';

// Nursery Routes
import nurseryRoutes from './town/nursery.routes';

// Breeding Routes
import breedingRoutes from './town/breeding.routes';

// Prompt Routes
import promptRoutes from './api/prompt.routes';

// Antique Routes
import antiqueRoutes from './town/antique.routes';

// Garden Routes
import gardenRoutes from './town/garden.routes';

// Reroller Routes
import rerollerRoutes from './misc/reroller.routes';

// Faction Routes
import factionRoutes from './adventure/faction.routes';

// Statistics Routes
import statisticsRoutes from './misc/statistics.routes';

// Submission Routes
import submissionRoutes from './misc/submission.routes';

// Bookmark Routes
import bookmarkRoutes from './misc/bookmark.routes';

// Chat Routes
import chatRoutes from './chat/chat.routes';
import chatAdminRoutes from './chat/chat-admin.routes';

// Upload Routes
import uploadRoutes from './api/upload.routes';

// Trainer Routes Imports
import trainerRoutes from './api/trainer.routes';

// Species Routes Imports
import speciesRoutes from './species/species.routes';
import pokemonRoutes from './species/pokemon-species.routes';
import digimonRoutes from './species/digimon-species.routes';
import nexomonRoutes from './species/nexomon-species.routes';
import yokaiRoutes from './species/yokai-species.routes';
import monsterhunterRoutes from './species/monsterhunter-species.routes';
import finalfantasyRoutes from './species/finalfantasy-species.routes';
import fakemonRoutes from './species/fakemon-species.routes';
import palsRoutes from './species/pals-species.routes';


// Create router
const router: Router = express.Router();

// Auth & User Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Schedule & Art Todo Routes
router.use('/schedule', scheduleRoutes);
router.use('/art-todo', artTodoRoutes);

// API Routes
router.use('/items', itemsRoutes);
router.use('/adoption', adoptionRoutes);

// Adventure Routes
router.use('/adventures', adventureRoutes);
router.use('/adventures/discord', adventureDiscordRoutes);
router.use('/areas', areaRoutes);

// Shop Routes
router.use('/shops', shopRoutes);

// Market Routes

// Misc Routes

// Monster Routes
router.use('/monsters', monsterRoutes);
router.use('/monster-roller', monsterRollerRoutes);
router.use('/starter-roller', starterRollerRoutes);
router.use('/evolution', evolutionRoutes);

// Species Routes
router.use('/species', speciesRoutes);
router.use('/pokemon-monsters', pokemonRoutes);
router.use('/digimon-monsters', digimonRoutes);
router.use('/nexomon-monsters', nexomonRoutes);
router.use('/yokai-monsters', yokaiRoutes);
router.use('/monsterhunter-monsters', monsterhunterRoutes);
router.use('/finalfantasy-monsters', finalfantasyRoutes);
router.use('/fakedex', fakemonRoutes);
router.use('/pals-monsters', palsRoutes);

// Boss, Content, Events, Mission Routes
router.use('/bosses', bossRoutes);
router.use('/content', contentRoutes);
router.use('/guides', guidesRoutes);
router.use('/events', eventsRoutes);
router.use('/admin/events', eventAdminRoutes);
router.use('/missions', missionRoutes);

// Ability Routes
router.use('/abilities', abilityRoutes);

// Town Routes
router.use('/town/trade', tradeRoutes);
router.use('/town/bazar', bazarRoutes);
router.use('/town/mega-mart', megaMartRoutes);
router.use('/town/game-corner', gameCornerRoutes);
router.use('/town/activities', locationActivityRoutes);

// Nursery Routes
router.use('/nursery', nurseryRoutes);

// Breeding Routes
router.use('/town/farm/breed', breedingRoutes);

// Prompt Routes
router.use('/prompts', promptRoutes);

// Antique Routes
router.use('/antiques', antiqueRoutes);

// Garden Routes
router.use('/garden', gardenRoutes);

// Reroller Routes
router.use('/reroller', rerollerRoutes);

// Faction Routes
router.use('/factions', factionRoutes);

// Statistics Routes
router.use('/statistics', statisticsRoutes);

// Submission Routes
router.use('/submissions', submissionRoutes);

// Bookmark Routes
router.use('/bookmarks', bookmarkRoutes);

// Chat Routes
router.use('/chats', chatRoutes);
router.use('/admin/chats', chatAdminRoutes);

// Upload Routes
router.use('/upload', uploadRoutes);

// Trainer Routes
router.use('/trainers', trainerRoutes);

export default router;
