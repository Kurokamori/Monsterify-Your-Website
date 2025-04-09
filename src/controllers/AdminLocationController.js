const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Set up multer storage for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'public/images/locations/';

    // Determine the correct subfolder based on the type
    if (req.body.locationType === 'region') {
      uploadPath += 'regions/';
    } else if (req.body.locationType === 'area') {
      uploadPath += 'areas/';
    } else {
      uploadPath += 'locations/';
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create a filename based on the slug with underscores
    const filename = req.body.slug.replace(/-/g, '_') + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Helper function to check if an image exists
function imageExists(imagePath) {
  if (!imagePath) return false;

  // If it's an external URL (starts with http:// or https://), assume it exists
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return true;
  }

  try {
    // Remove leading slash if present
    const normalizedPath = imagePath.replace(/^\//, '');
    const fullPath = path.join(__dirname, '..', '..', 'public', normalizedPath);

    // Check if file exists
    const exists = fs.existsSync(fullPath);

    // Debug logging
    if (!exists) {
      console.log(`Admin - Image not found: ${fullPath}`);
    }

    return exists;
  } catch (error) {
    console.error('Error checking if image exists:', error);
    return false;
  }
}

// Helper function to get image path with fallback to default
function getImagePath(imagePath) {
  if (!imagePath) {
    console.log('Admin - No image path provided, using default');
    return '/images/locations/location.png';
  }

  console.log(`Admin - Checking image path: ${imagePath}`);

  // Check if the image exists
  if (imageExists(imagePath)) {
    console.log(`Admin - Image exists: ${imagePath}`);
    return imagePath;
  }

  // If the image doesn't exist, try to find a matching image by name
  try {
    const pathParts = imagePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const fileNameWithoutExt = fileName.split('.')[0];

    console.log(`Admin - Looking for alternatives for: ${fileNameWithoutExt}`);

    // Check for both hyphenated and underscore versions
    const hyphenVersion = fileNameWithoutExt.replace(/_/g, '-');
    const underscoreVersion = fileNameWithoutExt.replace(/-/g, '_');

    // Determine the directory (regions, areas, or locations)
    const directory = pathParts[pathParts.length - 2];

    // Try underscore version first
    const underscorePath = `/images/locations/${directory}/${underscoreVersion}.png`;
    console.log(`Admin - Trying underscore version: ${underscorePath}`);
    if (imageExists(underscorePath)) {
      console.log(`Admin - Found underscore version: ${underscorePath}`);
      return underscorePath;
    }

    // Try hyphen version next
    const hyphenPath = `/images/locations/${directory}/${hyphenVersion}.png`;
    console.log(`Admin - Trying hyphen version: ${hyphenPath}`);
    if (imageExists(hyphenPath)) {
      console.log(`Admin - Found hyphen version: ${hyphenPath}`);
      return hyphenPath;
    }

    // Try with different extensions
    const extensions = ['.jpg', '.jpeg', '.gif'];
    for (const ext of extensions) {
      const altPath = `/images/locations/${directory}/${underscoreVersion}${ext}`;
      console.log(`Admin - Trying alternative extension: ${altPath}`);
      if (imageExists(altPath)) {
        console.log(`Admin - Found with alternative extension: ${altPath}`);
        return altPath;
      }
    }

    console.log('Admin - No alternatives found, using default image');
  } catch (error) {
    console.error('Admin - Error finding alternative image:', error);
  }

  // If all else fails, return the default image
  return '/images/locations/location.png';
}

// Helper function to read location data
const getLocationData = () => {
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'locations.json');

    // Check if the file exists, if not create it with default structure
    if (!fs.existsSync(dataPath)) {
      const defaultData = {
        regions: [],
        areas: {},
        locations: {}
      };
      fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }

    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading location data:', error);
    return {
      regions: [],
      areas: {},
      locations: {}
    };
  }
}

// Helper function to save location data
function saveLocationData(data) {
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'locations.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving location data:', error);
    return false;
  }
}

// Controller methods
const AdminLocationController = {
  // Show dashboard for location management
  showDashboard: (req, res) => {
    const rawData = getLocationData();

    // Apply default images to all entities
    const locationData = {
      regions: rawData.regions.map(region => ({
        ...region,
        image: getImagePath(region.image)
      })),
      areas: Object.fromEntries(
        Object.entries(rawData.areas).map(([key, areas]) => [
          key,
          areas.map(area => ({
            ...area,
            image: getImagePath(area.image)
          }))
        ])
      ),
      locations: Object.fromEntries(
        Object.entries(rawData.locations).map(([key, locations]) => [
          key,
          locations.map(location => ({
            ...location,
            image: getImagePath(location.image)
          }))
        ])
      )
    };

    res.render('admin/locations/dashboard', {
      title: 'Location Management',
      locationData
    });
  },

  // Show form to add/edit a region
  showRegionForm: (req, res) => {
    const locationData = getLocationData();
    const regionSlug = req.params.slug;
    let region = null;

    if (regionSlug) {
      region = locationData.regions.find(r => r.slug === regionSlug);
      if (!region) {
        return res.redirect('/admin/locations');
      }
    }

    res.render('admin/locations/region-form', {
      title: region ? `Edit Region: ${region.name}` : 'Add New Region',
      region
    });
  },

  // Process region form submission
  processRegionForm: [
    upload.single('image'),
    (req, res) => {
      try {
        const locationData = getLocationData();
        const { slug, name, description } = req.body;
        const isEdit = req.params.slug;

        // Validate required fields
        if (!slug || !name || !description) {
          return res.status(400).send('All fields are required');
        }

        // For edit, find the existing region
        let region;
        if (isEdit) {
          const index = locationData.regions.findIndex(r => r.slug === req.params.slug);
          if (index === -1) {
            return res.status(404).send('Region not found');
          }

          // Update existing region
          region = locationData.regions[index];
          region.slug = slug;
          region.name = name;
          region.description = description;

          // If slug changed, update areas reference
          if (req.params.slug !== slug) {
            if (locationData.areas[req.params.slug]) {
              locationData.areas[slug] = locationData.areas[req.params.slug];
              delete locationData.areas[req.params.slug];
            }
          }
        } else {
          // Create new region
          region = {
            slug,
            name,
            description,
            image: `/images/locations/regions/${slug.replace(/-/g, '_')}.png`
          };

          // Check for duplicate slug
          if (locationData.regions.some(r => r.slug === slug)) {
            return res.status(400).send('A region with this slug already exists');
          }

          locationData.regions.push(region);
          locationData.areas[slug] = [];
        }

        // If image was uploaded, update the image path
        if (req.file) {
          region.image = `/images/locations/regions/${req.file.filename}`;
        }

        // Save the updated data
        saveLocationData(locationData);

        res.redirect('/admin/locations');
      } catch (error) {
        console.error('Error processing region form:', error);
        res.status(500).send('An error occurred while processing the form');
      }
    }
  ],

  // Show form to add/edit an area
  showAreaForm: (req, res) => {
    const locationData = getLocationData();
    const regionSlug = req.params.region;
    const areaSlug = req.params.slug;

    // Validate region exists
    if (!locationData.areas[regionSlug]) {
      return res.redirect('/admin/locations');
    }

    let area = null;
    if (areaSlug) {
      area = locationData.areas[regionSlug].find(a => a.slug === areaSlug);
      if (!area) {
        return res.redirect(`/admin/locations/region/${regionSlug}`);
      }
    }

    res.render('admin/locations/area-form', {
      title: area ? `Edit Area: ${area.name}` : 'Add New Area',
      area,
      regionSlug,
      regions: locationData.regions
    });
  },

  // Process area form submission
  processAreaForm: [
    upload.single('image'),
    (req, res) => {
      try {
        const locationData = getLocationData();
        const { slug, name, description, regionSlug } = req.body;
        const isEdit = req.params.slug;

        // Validate required fields
        if (!slug || !name || !description || !regionSlug) {
          return res.status(400).send('All fields are required');
        }

        // Validate region exists
        if (!locationData.areas[regionSlug]) {
          return res.status(404).send('Region not found');
        }

        // For edit, find the existing area
        let area;
        if (isEdit) {
          const index = locationData.areas[req.params.region].findIndex(a => a.slug === req.params.slug);
          if (index === -1) {
            return res.status(404).send('Area not found');
          }

          // If region changed, move the area
          if (req.params.region !== regionSlug) {
            // Remove from old region
            area = locationData.areas[req.params.region].splice(index, 1)[0];
            // Add to new region
            locationData.areas[regionSlug].push(area);
          } else {
            area = locationData.areas[regionSlug][index];
          }

          // Update area properties
          area.slug = slug;
          area.name = name;
          area.description = description;

          // If slug changed, update locations reference
          if (req.params.slug !== slug) {
            if (locationData.locations[req.params.slug]) {
              locationData.locations[slug] = locationData.locations[req.params.slug];
              delete locationData.locations[req.params.slug];
            }
          }
        } else {
          // Create new area
          area = {
            slug,
            name,
            description,
            image: `/images/locations/areas/${slug.replace(/-/g, '_')}.png`
          };

          // Check for duplicate slug in this region
          if (locationData.areas[regionSlug].some(a => a.slug === slug)) {
            return res.status(400).send('An area with this slug already exists in this region');
          }

          locationData.areas[regionSlug].push(area);
          locationData.locations[slug] = [];
        }

        // If image was uploaded, update the image path
        if (req.file) {
          area.image = `/images/locations/areas/${req.file.filename}`;
        }

        // Save the updated data
        saveLocationData(locationData);

        res.redirect(`/admin/locations/region/${regionSlug}`);
      } catch (error) {
        console.error('Error processing area form:', error);
        res.status(500).send('An error occurred while processing the form');
      }
    }
  ],

  // Show form to add/edit a location
  showLocationForm: (req, res) => {
    const locationData = getLocationData();
    const areaSlug = req.params.area;
    const locationSlug = req.params.slug;

    // Find the region for this area
    let regionSlug = '';
    for (const [region, areas] of Object.entries(locationData.areas)) {
      if (areas.some(a => a.slug === areaSlug)) {
        regionSlug = region;
        break;
      }
    }

    if (!regionSlug) {
      return res.redirect('/admin/locations');
    }

    // Validate area exists
    if (!locationData.locations[areaSlug]) {
      locationData.locations[areaSlug] = [];
      saveLocationData(locationData);
    }

    let location = null;
    if (locationSlug) {
      location = locationData.locations[areaSlug].find(l => l.slug === locationSlug);
      if (!location) {
        return res.redirect(`/admin/locations/area/${regionSlug}/${areaSlug}`);
      }
    }

    // Get all regions and areas for the dropdown
    const regions = locationData.regions;
    const areas = {};
    for (const [region, areaList] of Object.entries(locationData.areas)) {
      areas[region] = areaList;
    }

    res.render('admin/locations/location-form', {
      title: location ? `Edit Location: ${location.name}` : 'Add New Location',
      location,
      regionSlug,
      areaSlug,
      regions,
      areas
    });
  },

  // Process location form submission
  processLocationForm: [
    upload.single('image'),
    (req, res) => {
      try {
        const locationData = getLocationData();
        const { slug, name, description, areaSlug } = req.body;
        const isEdit = req.params.slug;

        // Validate required fields
        if (!slug || !name || !description || !areaSlug) {
          return res.status(400).send('All fields are required');
        }

        // Find the region for this area
        let regionSlug = '';
        for (const [region, areas] of Object.entries(locationData.areas)) {
          if (areas.some(a => a.slug === areaSlug)) {
            regionSlug = region;
            break;
          }
        }

        if (!regionSlug) {
          return res.status(404).send('Region not found for this area');
        }

        // Validate area exists
        if (!locationData.locations[areaSlug]) {
          locationData.locations[areaSlug] = [];
        }

        // For edit, find the existing location
        let location;
        if (isEdit) {
          const index = locationData.locations[req.params.area].findIndex(l => l.slug === req.params.slug);
          if (index === -1) {
            return res.status(404).send('Location not found');
          }

          // If area changed, move the location
          if (req.params.area !== areaSlug) {
            // Remove from old area
            location = locationData.locations[req.params.area].splice(index, 1)[0];
            // Add to new area
            locationData.locations[areaSlug].push(location);
          } else {
            location = locationData.locations[areaSlug][index];
          }

          // Update location properties
          location.slug = slug;
          location.name = name;
          location.description = description;
        } else {
          // Create new location
          location = {
            slug,
            name,
            description,
            image: `/images/locations/locations/${slug.replace(/-/g, '_')}.png`
          };

          // Check for duplicate slug in this area
          if (locationData.locations[areaSlug].some(l => l.slug === slug)) {
            return res.status(400).send('A location with this slug already exists in this area');
          }

          locationData.locations[areaSlug].push(location);
        }

        // If image was uploaded, update the image path
        if (req.file) {
          location.image = `/images/locations/locations/${req.file.filename}`;
        }

        // Save the updated data
        saveLocationData(locationData);

        res.redirect(`/admin/locations/area/${regionSlug}/${areaSlug}`);
      } catch (error) {
        console.error('Error processing location form:', error);
        res.status(500).send('An error occurred while processing the form');
      }
    }
  ],

  // Delete a region
  deleteRegion: (req, res) => {
    try {
      const locationData = getLocationData();
      const regionSlug = req.params.slug;

      // Find the region index
      const index = locationData.regions.findIndex(r => r.slug === regionSlug);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Region not found' });
      }

      // Remove the region
      locationData.regions.splice(index, 1);

      // Remove associated areas and locations
      delete locationData.areas[regionSlug];

      // Save the updated data
      saveLocationData(locationData);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting region:', error);
      res.status(500).json({ success: false, message: 'An error occurred while deleting the region' });
    }
  },

  // Delete an area
  deleteArea: (req, res) => {
    try {
      const locationData = getLocationData();
      const regionSlug = req.params.region;
      const areaSlug = req.params.slug;

      // Validate region exists
      if (!locationData.areas[regionSlug]) {
        return res.status(404).json({ success: false, message: 'Region not found' });
      }

      // Find the area index
      const index = locationData.areas[regionSlug].findIndex(a => a.slug === areaSlug);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Area not found' });
      }

      // Remove the area
      locationData.areas[regionSlug].splice(index, 1);

      // Remove associated locations
      delete locationData.locations[areaSlug];

      // Save the updated data
      saveLocationData(locationData);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting area:', error);
      res.status(500).json({ success: false, message: 'An error occurred while deleting the area' });
    }
  },

  // Delete a location
  deleteLocation: (req, res) => {
    try {
      const locationData = getLocationData();
      const areaSlug = req.params.area;
      const locationSlug = req.params.slug;

      // Validate area exists
      if (!locationData.locations[areaSlug]) {
        return res.status(404).json({ success: false, message: 'Area not found' });
      }

      // Find the location index
      const index = locationData.locations[areaSlug].findIndex(l => l.slug === locationSlug);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Location not found' });
      }

      // Remove the location
      locationData.locations[areaSlug].splice(index, 1);

      // Save the updated data
      saveLocationData(locationData);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ success: false, message: 'An error occurred while deleting the location' });
    }
  }
};

// Export the controller and helper functions
AdminLocationController.getLocationData = getLocationData;
AdminLocationController.getImagePath = getImagePath;
AdminLocationController.imageExists = imageExists;

module.exports = AdminLocationController;
