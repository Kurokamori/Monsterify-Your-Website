# Dusk & Dawn Discord Bot — Migration & Architecture Plan

## Table of Contents

1. [Original Feature Audit](#1-original-feature-audit)
2. [Architecture Problems in the Original](#2-architecture-problems-in-the-original)
3. [New TypeScript Architecture](#3-new-typescript-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Module Breakdown](#5-module-breakdown)
6. [Migration Plan](#6-migration-plan)

---

## 1. Original Feature Audit

### 1.1 Command System (Slash Commands)

| Domain | Command | Description |
|--------|---------|-------------|
| **General** | `/menu` | Main navigation menu |
| **General** | `/help` | Help information |
| **General** | `/link-account` | Link Discord account to website |
| **Trainer** | `/trainer view` | View trainer profile (bio, pronouns, age, location) |
| **Trainer** | `/trainer inventory` | Display trainer items with quantities |
| **Trainer** | `/trainer monsters` | List owned monsters with trait badges |
| **Trainer** | `/trainer stats` | View trainer statistics |
| **Monster** | `/monster view` | Detailed monster sheet (stats, nature, held item, bio) |
| **Monster** | `/monster rename` | Rename a monster |
| **Monster** | `/monster evolve` | Show evolution options (placeholder) |
| **Monster** | `/monster fuse` | Monster fusion (placeholder) |
| **Adventure** | `/encounter` | Generate a random encounter in an adventure thread |
| **Adventure** | `/capture` | Attempt to capture a wild monster (pokeball + pokepuff) |
| **Adventure** | `/result` | Resolve a battle outcome |
| **Adventure** | `/end` | Complete adventure, claim word-count rewards |
| **Battle** | `/battle` | Initiate PvP battle (up to 3 opponents) |
| **Battle** | `/attack` | Execute attack move with target selection |
| **Battle** | `/use-item` | Use an item during battle |
| **Battle** | `/battle-status` | View current battle state |
| **Battle** | `/release` / `/withdraw` | Send out or recall a monster |
| **Battle** | `/set-weather` / `/set-terrain` | Set environmental modifiers |
| **Battle** | `/flee` / `/forfeit` | Escape or surrender |
| **Battle** | `/forcewin` / `/forcelose` | Admin override commands |
| **Battle** | `/win-condition` | Set knockout threshold |
| **Town** | `/town menu` | Town square navigation |
| **Town** | `/town visit <location>` | Visit one of 8 locations |
| **Shop** | `/shop menu` | Shop navigation |
| **Shop** | `/shop view <type>` | Browse one of 7 shop types |

### 1.2 Interactive Components

- **Buttons**: Navigation (back/home/refresh), pagination, location shortcuts, action triggers (40+ handlers)
- **Select Menus**: Trainer select, monster select, item select, shop select, location select, activity select — with pagination support
- **Modals**: Form submissions for trainer/monster editing

### 1.3 Background Systems

- **Word Count Tracking**: Messages in adventure threads are counted; rewards at thresholds (50 words = 1 level, 1 word = 1 coin, 1000 words = 1 item)
- **Thread Lifecycle**: Auto-creation of adventure threads with welcome messages, cleanup on thread deletion
- **HTTP Bridge**: Express server on port 3001 with `/send-message` endpoint for backend→Discord communication
- **Account Linking**: Discord user ↔ website account linking flow

### 1.4 Town Locations & Activities

| Location | Activities |
|----------|-----------|
| Home | Base hub |
| Adoption Center | Monthly monster adoptions, claim limits |
| Garden | Point accumulation, plant activities |
| Farm | Monster breeding pairs, breeding status |
| Game Corner | Mini-games |
| Antique Shop | Appraisal, special items |
| Pirate's Dock | Maritime activities |
| Laboratory | Research activities |

### 1.5 Shop Types

Apothecary (berries), Bakery (pastries), Witch's Hut (evolution items), Mega Mart (pokéballs + special items), Antique Store (event items), Nursery (eggs), Pirate's Dock (maritime items)

### 1.6 Monster Traits & Stats

- **Traits**: Shiny, Alpha, Shadow, Paradox, Pokérus
- **Stats**: HP, ATK, DEF, SP.ATK, SP.DEF, SPE
- **Nature system** with stat modifiers
- **Multi-species support** (species1, species2, species3 for fusions)
- **Friendship tracking**

---

## 2. Architecture Problems in the Original

| Problem | Detail |
|---------|--------|
| **Giant switch statements** | `commandHandler.js` and `buttonHandler.js` are monolithic routers with 40+ cases each |
| **No type safety** | Plain JS with no interfaces — runtime errors from typos, missing fields, wrong types |
| **Mixed concerns** | Handlers contain embed formatting, API calls, and business logic interleaved |
| **Duplicated embed logic** | Similar embed construction patterns repeated across every handler |
| **No command metadata co-location** | Command definitions in `registerCommands.js` are separate from their execution in handlers |
| **Hardcoded strings** | Button custom IDs, embed colors, API paths scattered as string literals |
| **No error boundaries** | A single thrown error in any handler crashes or silently fails |
| **No middleware pattern** | Cooldowns, permissions, logging implemented ad-hoc per command |
| **Flat service layer** | Services are procedural wrappers around axios calls with no domain modeling |
| **No dependency injection** | Services import config directly, making testing impossible |

---

## 3. New TypeScript Architecture

### 3.1 Design Principles

1. **Command-as-module**: Each command is a self-contained module that declares its slash command definition, execution handler, autocomplete, and component handlers together
2. **Interaction pipeline**: All interactions pass through a middleware chain (auth → cooldown → permissions → execute → error handler)
3. **Typed API client**: A single typed HTTP client replaces raw axios calls, with response types matching the backend
4. **Domain services**: Thin service layer that maps API responses to domain objects, separate from Discord formatting
5. **Presentation layer**: Embed/component builders live in their own layer, accepting domain objects and returning Discord API structures
6. **Event-driven**: Use an internal event bus for cross-cutting concerns (logging, analytics, error reporting)

### 3.2 Core Patterns

```
Interaction → Middleware Pipeline → Command Handler → Service → API Client
                                         ↓
                                   Presenter (Embeds/Components)
```

- **Commands** define what they need (slash command data + handler)
- **Services** fetch and transform data (no Discord knowledge)
- **Presenters** format domain data into embeds/components (no API knowledge)
- **API Client** handles HTTP communication (typed request/response)

---

## 4. Directory Structure

```
discord-bot/
├── src/
│   ├── index.ts                    # Entry point — client init, event registration
│   ├── client.ts                   # Extended Discord client with typed properties
│   │
│   ├── commands/                   # Command modules (self-contained)
│   │   ├── index.ts                # Auto-loader: scans and registers all commands
│   │   ├── general/
│   │   │   ├── menu.command.ts
│   │   │   ├── help.command.ts
│   │   │   └── link-account.command.ts
│   │   ├── trainer/
│   │   │   ├── trainer.command.ts          # /trainer (subcommands: view, inventory, monsters, stats)
│   │   │   └── trainer.components.ts       # Button/select handlers for trainer interactions
│   │   ├── monster/
│   │   │   ├── monster.command.ts          # /monster (subcommands: view, rename, evolve, fuse)
│   │   │   └── monster.components.ts
│   │   ├── adventure/
│   │   │   ├── encounter.command.ts
│   │   │   ├── capture.command.ts
│   │   │   ├── result.command.ts
│   │   │   ├── end.command.ts
│   │   │   └── adventure.components.ts
│   │   ├── battle/
│   │   │   ├── battle.command.ts           # /battle (initiate)
│   │   │   ├── attack.command.ts
│   │   │   ├── use-item.command.ts
│   │   │   ├── battle-status.command.ts
│   │   │   ├── release.command.ts
│   │   │   ├── withdraw.command.ts
│   │   │   ├── set-weather.command.ts
│   │   │   ├── set-terrain.command.ts
│   │   │   ├── flee.command.ts
│   │   │   ├── forfeit.command.ts
│   │   │   ├── forcewin.command.ts
│   │   │   ├── forcelose.command.ts
│   │   │   ├── win-condition.command.ts
│   │   │   └── battle.components.ts
│   │   ├── town/
│   │   │   ├── town.command.ts             # /town (subcommands: menu, visit)
│   │   │   └── town.components.ts
│   │   └── shop/
│   │       ├── shop.command.ts             # /shop (subcommands: menu, view)
│   │       └── shop.components.ts
│   │
│   ├── middleware/                  # Interaction pipeline
│   │   ├── index.ts
│   │   ├── auth.middleware.ts      # Verify linked account
│   │   ├── cooldown.middleware.ts  # Rate limiting
│   │   ├── permissions.middleware.ts # Role-based access (admin commands)
│   │   └── error.middleware.ts     # Catch-all error handler
│   │
│   ├── services/                   # Domain services (no Discord imports)
│   │   ├── api-client.ts           # Typed HTTP client (axios wrapper)
│   │   ├── trainer.service.ts
│   │   ├── monster.service.ts
│   │   ├── adventure.service.ts
│   │   ├── battle.service.ts
│   │   ├── town.service.ts
│   │   ├── market.service.ts
│   │   └── account.service.ts
│   │
│   ├── presenters/                 # Discord embed/component factories
│   │   ├── base.presenter.ts       # Shared embed helpers, color constants
│   │   ├── trainer.presenter.ts
│   │   ├── monster.presenter.ts
│   │   ├── adventure.presenter.ts
│   │   ├── battle.presenter.ts
│   │   ├── town.presenter.ts
│   │   ├── shop.presenter.ts
│   │   └── components/
│   │       ├── buttons.ts          # Reusable button factory
│   │       ├── select-menus.ts     # Reusable select menu factory
│   │       └── pagination.ts       # Generic pagination component builder
│   │
│   ├── events/                     # Discord event handlers
│   │   ├── ready.ts
│   │   ├── interaction-create.ts   # Routes to command/component handlers
│   │   ├── message-create.ts       # Word count tracking
│   │   ├── thread-create.ts
│   │   └── thread-delete.ts
│   │
│   ├── bridge/                     # HTTP bridge for backend→Discord
│   │   └── server.ts              # Express server with typed routes
│   │
│   ├── types/                      # Shared TypeScript types
│   │   ├── command.types.ts        # Command module interface
│   │   ├── api.types.ts            # API request/response types
│   │   ├── domain.types.ts         # Trainer, Monster, Item, Adventure, etc.
│   │   └── discord.types.ts        # Extended Discord types
│   │
│   ├── constants/                  # All magic strings/numbers
│   │   ├── button-ids.ts
│   │   ├── colors.ts
│   │   ├── rewards.ts              # Word count thresholds
│   │   └── shops.ts
│   │
│   └── config/
│       └── index.ts                # Typed env config with validation
│
├── .env
├── package.json
└── tsconfig.json
```

---

## 5. Module Breakdown

### 5.1 Command Module Interface

Every command exports a single object conforming to this interface:

```typescript
interface CommandModule {
  data: SlashCommandBuilder;                    // Command definition
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  components?: {
    buttons?: Record<string, ButtonHandler>;
    selectMenus?: Record<string, SelectMenuHandler>;
    modals?: Record<string, ModalHandler>;
  };
}
```

The command loader (`commands/index.ts`) auto-discovers all `*.command.ts` files, registers slash commands with Discord, and builds a lookup map for the interaction router.

### 5.2 Middleware Pipeline

```typescript
type MiddlewareFn = (
  interaction: Interaction,
  context: InteractionContext,
  next: () => Promise<void>
) => Promise<void>;
```

Pipeline order: `auth → cooldown → permissions → execute → errorHandler`

Each middleware can short-circuit (e.g., cooldown replies with "slow down" and doesn't call `next()`).

### 5.3 Typed API Client

```typescript
class ApiClient {
  // Trainer endpoints
  getTrainersByUserId(userId: string): Promise<Trainer[]>;
  getTrainerById(id: string): Promise<Trainer>;
  getTrainerInventory(id: string): Promise<InventoryItem[]>;
  getTrainerMonsters(id: string): Promise<MonsterSummary[]>;

  // Monster endpoints
  getMonsterById(id: string): Promise<Monster>;
  renameMonster(id: string, name: string): Promise<Monster>;

  // Adventure endpoints
  createAdventure(data: CreateAdventureRequest): Promise<Adventure>;
  generateEncounter(adventureId: string): Promise<Encounter>;
  attemptCapture(data: CaptureRequest): Promise<CaptureResult>;
  endAdventure(adventureId: string): Promise<AdventureRewards>;

  // Battle endpoints
  createBattle(data: CreateBattleRequest): Promise<Battle>;
  executeAttack(data: AttackRequest): Promise<BattleUpdate>;

  // Town endpoints
  getAdoptionMonsters(month: string): Promise<AdoptionMonster[]>;
  claimAdoption(trainerId: string, monsterId: string): Promise<Monster>;
  getBreedingPairs(trainerId: string): Promise<BreedingPair[]>;

  // Shop endpoints
  getShopItems(shopType: ShopType): Promise<ShopItem[]>;
  purchaseItem(data: PurchaseRequest): Promise<PurchaseResult>;

  // Account
  linkAccount(discordId: string, token: string): Promise<LinkResult>;
}
```

### 5.4 Presenter Pattern

Presenters accept domain objects and return Discord message payloads:

```typescript
// Example: monster.presenter.ts
function monsterViewEmbed(monster: Monster): EmbedBuilder { ... }
function monsterListEmbed(monsters: MonsterSummary[], page: number): EmbedBuilder { ... }
function monsterSelectMenu(monsters: MonsterSummary[], page: number): StringSelectMenuBuilder { ... }
```

This separates Discord formatting from data fetching entirely.

---

## 6. Migration Plan

### Phase 1: Foundation

- [ ] Initialize TypeScript project (`package.json`, `tsconfig.json`, dependencies)
- [ ] Set up `src/config/index.ts` with typed environment variables
- [ ] Create `src/types/` with all domain types (`Trainer`, `Monster`, `Item`, `Adventure`, `Battle`, etc.)
- [ ] Build `src/services/api-client.ts` — typed axios wrapper
- [ ] Build `src/client.ts` — extended Discord client
- [ ] Build `src/index.ts` — entry point with client initialization
- [ ] Build `src/commands/index.ts` — auto-loader and registration system
- [ ] Build `src/middleware/` — full pipeline (auth, cooldown, permissions, error)
- [ ] Build `src/events/interaction-create.ts` — interaction router
- [ ] Build `src/presenters/base.presenter.ts` — shared embed helpers and color constants
- [ ] Build `src/presenters/components/` — button, select menu, and pagination factories
- [ ] Build `src/constants/` — button IDs, colors, rewards, shop types

### Phase 2: Core Commands (Trainer & Monster)

- [ ] `src/services/trainer.service.ts`
- [ ] `src/services/monster.service.ts`
- [ ] `src/presenters/trainer.presenter.ts`
- [ ] `src/presenters/monster.presenter.ts`
- [ ] `src/commands/general/menu.command.ts`
- [ ] `src/commands/general/help.command.ts`
- [ ] `src/commands/general/link-account.command.ts`
- [ ] `src/commands/trainer/trainer.command.ts` + `.components.ts`
- [ ] `src/commands/monster/monster.command.ts` + `.components.ts`

### Phase 3: Adventure & Battle System

- [ ] `src/services/adventure.service.ts`
- [ ] `src/services/battle.service.ts`
- [ ] `src/presenters/adventure.presenter.ts`
- [ ] `src/presenters/battle.presenter.ts`
- [ ] `src/events/message-create.ts` — word count tracking
- [ ] `src/events/thread-create.ts` + `thread-delete.ts`
- [ ] All adventure commands (`encounter`, `capture`, `result`, `end`)
- [ ] All battle commands (`battle`, `attack`, `use-item`, `battle-status`, `release`, `withdraw`, `set-weather`, `set-terrain`, `flee`, `forfeit`, `forcewin`, `forcelose`, `win-condition`)

### Phase 4: Town & Commerce

- [ ] `src/services/town.service.ts`
- [ ] `src/services/market.service.ts`
- [ ] `src/presenters/town.presenter.ts`
- [ ] `src/presenters/shop.presenter.ts`
- [ ] `src/commands/town/town.command.ts` + `.components.ts`
- [ ] `src/commands/shop/shop.command.ts` + `.components.ts`

### Phase 5: Bridge & Polish

- [ ] `src/bridge/server.ts` — HTTP bridge for backend→Discord messaging
- [ ] `src/events/ready.ts` — bot status and startup logging
- [ ] End-to-end testing against dev backend
- [ ] Command registration script (guild-dev + global-prod)

---

## Key Improvements Over Original

| Area | Before (JS) | After (TS) |
|------|-------------|------------|
| Routing | Giant switch statements | Auto-discovered command modules |
| Type safety | None | Full TypeScript with typed API client |
| Separation of concerns | Handlers do everything | Command → Service → Presenter layers |
| Component handling | Scattered in buttonHandler.js | Co-located with their parent command |
| Error handling | Ad-hoc try/catch | Middleware-based error boundary |
| Cooldowns/Auth | Inline checks | Middleware pipeline |
| Embed building | Duplicated patterns | Presenter functions accepting domain types |
| Configuration | Loose env vars | Validated typed config |
| Button IDs | Hardcoded strings | Constants module |
| Testing | Impossible (tightly coupled) | Service/presenter layers independently testable |
