function getContentCategories() {
  return {
    events: {
      name: 'Events',
      structure: {
        directories: [
          {
            name: 'Current Event',
            path: 'current',
            children: {
              files: [
                { name: 'Overview', path: 'current/overview', url: 'current/overview.md' },
                // other files...
              ]
            }
          },
          // other directories...
        ]
      }
    }
  };
}