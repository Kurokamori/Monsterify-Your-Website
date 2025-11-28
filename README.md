<p align="center">
  <img src="https://github.com/Kurokamori/Monsterify-Your-Website/blob/master/website/public/images/logo.png" alt="Dusk and Dawn Logo">
</p>

<h1 align="center">Dusk and Dawn</h1>
<h3 align="center">A Monster Collecting Art Roleplaying Game</h3>

<p align="center">
  <a href="https://duskanddawn.net">Visit the Dusk and Dawn Website</a>
</p>

<p align="center">
  <em>Draw monsters. Collect creatures. Tell stories. Have fun.</em>
</p>

---

## What Is This?

**Dusk and Dawn** is my passion project - a browser-based game where creativity is the core mechanic. Players draw their characters and monsters, submit artwork to earn rewards, and use those rewards to hatch new creatures, power up their teams, and explore a world I've been building for years. <br>

This is a game I made for my friends, and have enjoyed watching them play, creating new characters and monsters based on what started as a silly little discord bot.

---

## The Tech Behind the Monsters

This project is a **full-stack JavaScript application** with three main components that talk to each other:

```
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │    Database     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │   React    │  │  Express   │  │  Discord   │
     │  Frontend  │◄─┤  Backend   │─►│    Bot     │
     │            │  │            │  │            │
     └────────────┘  └────────────┘  └────────────┘
           │              │              │
           └──────────────┴──────────────┘
                          │
                    ┌─────┴─────┐
                    │ Cloudinary│
                    │  (Images) │
                    └───────────┘
```

### The Website (React)

The frontend is built with **React 18** and handles everything a player interacts with:

- **React Router v6** for navigation across the game's many pages
- **React Bootstrap** for a clean, responsive UI
- **Context API** for state management (Auth & Modals)
- **Chart.js** for those satisfying stat visualizations
- **27+ API service modules** - each feature has its own dedicated service

The frontend talks to the backend through a RESTful API, with JWT authentication and automatic token refresh so sessions stay alive while you're deep in monster battles.

### The Backend (Express.js)

The heart of the operation. A **Node.js/Express** server that serves as the single source of truth:

- **48+ Controllers** handling everything from monster battles to faction reputation
- **57 Database Models** covering trainers, monsters, items, trades, adventures, and more
- **Service Layer Architecture** for complex game logic like damage calculation and capture mechanics
- **Passport.js** with Discord OAuth - log in with your Discord account
- **Cloudinary Integration** for storing all that beautiful player artwork
- **node-cron** for scheduled tasks and automated game events

The database runs on **PostgreSQL** in production (via Heroku) with **SQLite** for local development. Same codebase, different databases - the abstraction layer handles the switching.

### The Discord Bot (Discord.js)

Because sometimes you want to play from Discord:

- **Slash Commands** for quick gameplay actions
- **Button & Modal Handlers** for interactive encounters with genuine pokemon-style battling
- **Thread Integration** - adventures automatically spawn Discord threads
- **Real-time Word Count Tracking** for writing-based rewards
- **Embedded Express Server** so the backend can push updates to Discord

The bot isn't just for notifications - it's a full game interface. Start battles, encounter wild monsters, manage your team, all without leaving Discord.

---

## The Game Systems

### Monster Collecting
Not just one type of creature - the game supports multiple monster frameworks:
- Pokemon-style creatures
- Digimon
- Yokai
- Nexomon
- Pals
- **Fakemon** - completely custom player-designed monsters

Each has its own weighted roller system, evolution chains, and breeding mechanics.

### Adventures & Battles
- **User-Created Adventures** that spawn as Discord threads for collaborative storytelling
- **Random Encounters** - monsters, trainers, items, and story events
- **Turn-Based Combat** with type advantages, status effects, and AI opponents
- **Capture System** with success rate calculations
- **Monthly Bosses** for community challenges

### The Economy
- In-game currency earned through art submissions and gameplay
- **11+ Factions** with their own shops, reputation systems, and exclusive items
- Player-to-player trading
- Antique auctions for rare finds and seasonal events
- The Mega Mart for special purchases

### Art & Creativity
The core gameplay loop - submit art to earn rewards:
- Art submissions (drawings of your monsters and characters)
- Writing submissions (stories and adventures)
- Monster reference sheets
- Trainer reference sheets
- Prompt-based art challenges with bonus rewards

---

## API Architecture

The backend exposes a modular REST API:

```
/api/
├── /auth         → Login, register, Discord OAuth, token refresh
├── /trainers     → Player characters and their stats
├── /monsters     → The creatures themselves
├── /adventures   → Story mode with encounters
├── /battles      → Combat system endpoints
├── /factions     → The 11+ in-game organizations
├── /trades       → Player-to-player trading
├── /submissions  → Art and writing uploads
├── /shops        → Various in-game stores
├── /admin        → Management tools
└── ... and 30+ more route modules
```

Protected routes use JWT middleware. Admin routes check roles. Everything flows through controllers → services → models.

---

## Deployment

The whole thing runs on **Heroku** with two processes:

```
web:    node backend/server.js     # The API server
worker: cd discord-bot && npm start # The Discord bot
```

PostgreSQL for the database, Cloudinary for images, and Discord for real-time integration.


---

<p align="center">
  <strong>Dusk and Dawn</strong><br>
  <em>Where every drawing hatches a new adventure.</em>
</p>
