# Dusk and Dawn - Refactored Structure

This project has been refactored to use a more modular structure. The original monolithic index.js file has been split into multiple smaller files for better maintainability.

## Directory Structure

- src/config/ - Configuration files
  - pp.js - Express app configuration
  - database.js - Database configuration
  - session.js - Session configuration
  - multer.js - File upload configuration
- src/middleware/ - Middleware functions
  - index.js - Common middleware
- src/routes/ - Route handlers
  - index.js - Main router
  - uth.js - Authentication routes
  - dmin.js - Admin routes
  - content.js - Content management routes
  - 	own.js - Town and shop routes
  - 	rainers.js - Trainer routes
  - monsters.js - Monster routes
  - dventures.js - Adventure routes
  - akemon.js - Fakemon routes
  - 	asks.js - Task and habit routes
  - content-pages.js - Content pages routes
- src/utils/ - Utility functions
  - iewHelpers.js - Helper functions for views
- src/server.js - Main entry point that starts the server
- src/index.js - Simple wrapper that imports server.js

## How to Use

1. The application can be started as before with 
ode src/index.js
2. All functionality remains the same, but the code is now more organized and easier to maintain
3. New features should be added to the appropriate route files rather than the main index.js file

## Migration Notes

This refactoring was done to improve code organization and maintainability. The functionality remains the same, but the code is now split into logical modules.

If you need to make changes to a specific feature, you can now find the relevant code more easily by looking in the appropriate file.

