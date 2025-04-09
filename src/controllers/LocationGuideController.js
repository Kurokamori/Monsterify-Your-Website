const path = require('path');
const fs = require('fs');
const { loadMarkdownContent } = require('../utils/content-loader');

// Helper function to format a slug into a proper name
function formatNameFromSlug(slug) {
  return slug
    .split(/[-_]/g) // Split by both hyphens and underscores
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to check if an image exists
function imageExists(imagePath) {
  if (!imagePath) return false;

  try {
    // Remove leading slash if present
    const normalizedPath = imagePath.replace(/^\//, '');
    const fullPath = path.join(__dirname, '..', '..', 'public', normalizedPath);

    // Check if file exists
    const exists = fs.existsSync(fullPath);

    // Debug logging
    if (!exists) {
      console.log(`Image not found: ${fullPath}`);
    }

    return exists;
  } catch (error) {
    console.error('Error checking if image exists:', error);
    return false;
  }
}

// Helper function to check for image with different formats
function checkImageFormats(basePath, slug) {
  console.log(`Checking for images for ${slug} in ${basePath}`);

  // Try with original slug
  const originalPath = `${basePath}/${slug}.png`;
  if (imageExists(originalPath)) {
    console.log(`Found image: ${originalPath}`);
    return originalPath;
  }

  // Try with hyphens if slug has underscores
  if (slug.includes('_')) {
    const hyphenPath = `${basePath}/${slug.replace(/_/g, '-')}.png`;
    if (imageExists(hyphenPath)) {
      console.log(`Found image: ${hyphenPath}`);
      return hyphenPath;
    }
  }

  // Try with underscores if slug has hyphens
  if (slug.includes('-')) {
    const underscorePath = `${basePath}/${slug.replace(/-/g, '_')}.png`;
    if (imageExists(underscorePath)) {
      console.log(`Found image: ${underscorePath}`);
      return underscorePath;
    }
  }

  // Try different extensions
  const extensions = ['.jpg', '.jpeg', '.gif'];
  for (const ext of extensions) {
    // Try with original slug
    const originalExtPath = `${basePath}/${slug}${ext}`;
    if (imageExists(originalExtPath)) {
      console.log(`Found image: ${originalExtPath}`);
      return originalExtPath;
    }

    // Try with hyphens if slug has underscores
    if (slug.includes('_')) {
      const hyphenExtPath = `${basePath}/${slug.replace(/_/g, '-')}${ext}`;
      if (imageExists(hyphenExtPath)) {
        console.log(`Found image: ${hyphenExtPath}`);
        return hyphenExtPath;
      }
    }

    // Try with underscores if slug has hyphens
    if (slug.includes('-')) {
      const underscoreExtPath = `${basePath}/${slug.replace(/-/g, '_')}${ext}`;
      if (imageExists(underscoreExtPath)) {
        console.log(`Found image: ${underscoreExtPath}`);
        return underscoreExtPath;
      }
    }
  }

  // If no image found, return default
  console.log(`No image found for ${slug}, using default`);
  return '/images/locations/location.png';
}

// Helper function to process a location file
function processLocationFile(locationSlug, locationPath, areaSlug, areaName, locationData) {
  // Read the location file to extract name and description
  let locationName = formatNameFromSlug(locationSlug);
  let locationDescription = `Explore ${locationName} in the ${areaName} area.`;

  // Try to extract name and description from the markdown file
  try {
    const content = fs.readFileSync(locationPath, 'utf8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      locationName = titleMatch[1].trim();
    }

    // Extract the first paragraph after the title as the description
    const descMatch = content.match(/^#\s+.+\n+([^#\n].+)/m);
    if (descMatch && descMatch[1]) {
      locationDescription = descMatch[1].trim();
    }
  } catch (error) {
    console.error(`Error reading location file ${locationPath}:`, error);
  }

  // Add the location to the data structure
  locationData.locations[areaSlug].push({
    slug: locationSlug,
    name: locationName,
    description: locationDescription,
    image: checkImageFormats('/images/locations/locations', locationSlug)
  });
}

// Function to dynamically load location data from the file system
function loadLocationData() {
  const contentDir = path.join(__dirname, '..', 'content', 'locations');
  console.log(`Looking for content in: ${contentDir}`);

  const locationData = {
    regions: [],
    areas: {},
    locations: {}
  };

  // Check if the content directory exists
  if (!fs.existsSync(contentDir)) {
    console.log(`Content directory not found: ${contentDir}`);
    return locationData;
  }

  console.log(`Content directory found: ${contentDir}`);

  // Get all region directories
  const regionDirs = fs.readdirSync(contentDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`Found ${regionDirs.length} region directories: ${regionDirs.join(', ')}`);

  // If no regions found, add some default data for testing
  if (regionDirs.length === 0) {
    console.log('No regions found, adding default test data');
    locationData.regions.push({
      slug: 'test-region',
      name: 'Test Region',
      description: 'This is a test region added because no regions were found.',
      image: '/images/locations/location.png'
    });
    return locationData;
  }

  // Process each region
  regionDirs.forEach(regionDir => {
    const regionSlug = regionDir;
    const regionPath = path.join(contentDir, regionDir);
    console.log(`Processing region: ${regionSlug}, path: ${regionPath}`);

    // Format the region name from the slug
    const regionName = formatNameFromSlug(regionSlug);

    console.log(`Region name: ${regionName}`);

    // Check if the region directory exists and is accessible
    if (!fs.existsSync(regionPath)) {
      console.log(`Region directory not found: ${regionPath}`);
      return; // Skip this region
    }

    // Add the region to the data structure
    locationData.regions.push({
      slug: regionSlug,
      name: regionName,
      description: `Explore the ${regionName} region.`,
      image: checkImageFormats('/images/locations/regions', regionSlug)
    });

    // Initialize the areas array for this region
    locationData.areas[regionSlug] = [];

    // Get all area directories within this region
    const areaDirs = fs.readdirSync(regionPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Process each area
    areaDirs.forEach(areaDir => {
      const areaSlug = areaDir;
      const areaPath = path.join(regionPath, areaDir);

      // Format the area name from the slug
      const areaName = formatNameFromSlug(areaSlug);

      // Add the area to the data structure
      locationData.areas[regionSlug].push({
        slug: areaSlug,
        name: areaName,
        description: `Explore the ${areaName} area in ${regionName}.`,
        image: checkImageFormats('/images/locations/areas', areaSlug)
      });

      // Initialize the locations array for this area
      locationData.locations[areaSlug] = [];

      // Get all location files within this area
      const locationFiles = fs.readdirSync(areaPath, { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory() && dirent.name.endsWith('.md'))
        .map(dirent => dirent.name);

      // Process each location file
      locationFiles.forEach(locationFile => {
        const locationSlug = locationFile.replace('.md', '');
        const locationPath = path.join(areaPath, locationFile);

        processLocationFile(locationSlug, locationPath, areaSlug, areaName, locationData);
      });

      // Check for towns and cities subdirectories
      const subDirs = ['towns', 'cities'];
      subDirs.forEach(subDir => {
        const subDirPath = path.join(areaPath, subDir);
        if (fs.existsSync(subDirPath)) {
          console.log(`Found ${subDir} directory in ${areaName}`);

          // Get all location files within this subdirectory
          try {
            const subLocationFiles = fs.readdirSync(subDirPath, { withFileTypes: true })
              .filter(dirent => !dirent.isDirectory() && dirent.name.endsWith('.md'))
              .map(dirent => dirent.name);

            // Process each location file in the subdirectory
            subLocationFiles.forEach(locationFile => {
              // Create the correct prefix (town- or city-)
              const prefix = subDir === 'towns' ? 'town-' : 'city-';
              const locationSlug = `${prefix}${locationFile.replace('.md', '')}`;
              const locationPath = path.join(subDirPath, locationFile);

              processLocationFile(locationSlug, locationPath, areaSlug, areaName, locationData);
            });
          } catch (error) {
            console.error(`Error reading ${subDir} directory in ${areaName}:`, error);
          }
        }
      });
    });
  });

  return locationData;
}

// Load location data from the file system
const locationData = loadLocationData();

// Helper function to get region by slug
function getRegionBySlug(slug) {
  return locationData.regions.find(region => region.slug === slug);
}

// Helper function to get areas by region slug
function getAreasByRegionSlug(regionSlug) {
  return locationData.areas[regionSlug] || [];
}

// Helper function to get area by slug
function getAreaBySlug(regionSlug, areaSlug) {
  const areas = getAreasByRegionSlug(regionSlug);
  return areas.find(area => area.slug === areaSlug);
}

// Helper function to get locations by area slug
function getLocationsByAreaSlug(areaSlug) {
  return locationData.locations[areaSlug] || [];
}

// Helper function to get location by slug
function getLocationBySlug(areaSlug, locationSlug) {
  const locations = getLocationsByAreaSlug(areaSlug);
  return locations.find(location => location.slug === locationSlug);
}

// Controller methods
const LocationGuideController = {
  // Show regions grid
  showRegions: (req, res) => {
    // Apply slug-based image paths to all regions
    const regions = locationData.regions.map(region => ({
      ...region,
      url: `/guides/locations/region/${region.slug}`
    }));

    res.render('guides/locations/index', {
      title: 'Location Guide - Regions',
      level: 'regions',
      regions
    });
  },

  // Show areas grid for a specific region
  showAreas: (req, res) => {
    const { regionSlug } = req.params;

    // Get the region data
    const region = getRegionBySlug(regionSlug);
    if (!region) {
      return res.status(404).send('Region not found');
    }

    // Get areas for this region
    const areas = getAreasByRegionSlug(regionSlug).map(area => ({
      ...area,
      url: `/guides/locations/area/${regionSlug}/${area.slug}`
    }));

    res.render('guides/locations/index', {
      title: `${region.name} - Areas`,
      level: 'areas',
      currentRegion: region,
      areas
    });
  },

  // Show locations grid for a specific area
  showLocations: (req, res) => {
    const { regionSlug, areaSlug } = req.params;

    // Get the region data
    const region = getRegionBySlug(regionSlug);
    if (!region) {
      return res.status(404).send('Region not found');
    }

    // Get the area data
    const area = getAreaBySlug(regionSlug, areaSlug);
    if (!area) {
      return res.status(404).send('Area not found');
    }

    // Get locations for this area
    const locations = getLocationsByAreaSlug(areaSlug).map(location => ({
      ...location,
      url: `/guides/locations/detail/${regionSlug}/${areaSlug}/${location.slug}`
    }));

    res.render('guides/locations/index', {
      title: `${area.name} - Locations`,
      level: 'locations',
      currentRegion: region,
      currentArea: area,
      locations
    });
  },

  // Show a specific location
  showLocation: (req, res) => {
    const { regionSlug, areaSlug, locationSlug } = req.params;

    // Get the region data
    const region = getRegionBySlug(regionSlug);
    if (!region) {
      return res.status(404).send('Region not found');
    }

    // Get the area data
    const area = getAreaBySlug(regionSlug, areaSlug);
    if (!area) {
      return res.status(404).send('Area not found');
    }

    // Get the location data
    const location = getLocationBySlug(areaSlug, locationSlug);
    if (!location) {
      return res.status(404).send('Location not found');
    }

    // Load the location content
    const contentPath = path.join(__dirname, '..', 'content', 'locations', regionSlug, areaSlug);

    let markdownPath;

    // Check if the location is in a subdirectory (town or city)
    if (locationSlug.startsWith('town-') || locationSlug.startsWith('city-')) {
      const subDir = locationSlug.startsWith('town-') ? 'towns' : 'cities';
      const subLocationSlug = locationSlug.replace(/^(town|city)-/, '');
      markdownPath = path.join(contentPath, subDir, `${subLocationSlug}.md`);
      console.log(`Loading location from subdirectory: ${markdownPath}`);
    } else {
      markdownPath = path.join(contentPath, `${locationSlug}.md`);
    }

    // Load the markdown content
    const result = loadMarkdownContent(markdownPath);

    // Debug the content
    console.log(`Content length: ${result.content ? result.content.length : 0}`);
    console.log(`Content preview: ${result.content ? result.content.substring(0, 100) : 'No content'}...`);

    res.render('guides/locations/index', {
      title: `${location.name} - Location Details`,
      level: 'detail',
      currentRegion: region,
      currentArea: area,
      currentLocation: location,
      locationContent: result.content
    });
  }
};

module.exports = LocationGuideController;
