const fs = require('fs');
const path = require('path');

/**
 * Parse a Fakemon markdown file
 * @param {string} content - Markdown content
 * @returns {Object} Parsed Fakemon data
 */
function parseFakemonMarkdown(content) {
  const lines = content.split('\n');
  const fakemon = {
    name: '',
    number: '',
    types: [],
    attribute: '',
    species_class: '',
    stats: {},
    height: '',
    weight: '',
    abilities: [],
    pokedex_entry: '',
    evolution_line: [],
    artist_caption: ''
  };

  // Extract name from the first line (# Name)
  if (lines[0].startsWith('# ')) {
    fakemon.name = lines[0].substring(2).trim();
  }

  let currentSection = '';
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Check for section headers
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).trim();
      continue;
    }

    // Process content based on current section
    if (currentSection === 'Classification') {
      fakemon.species_class = line;
    } else if (currentSection === 'Types') {
      fakemon.types = line.split(',').map(type => type.trim());
    } else if (currentSection === 'Attribute') {
      fakemon.attribute = line;
    } else if (currentSection === 'Stats') {
      // Parse stats like HP: 45
      const statMatch = line.match(/([A-Za-z]+):\s*(\d+)/);
      if (statMatch) {
        const statName = statMatch[1].toLowerCase();
        const statValue = statMatch[2];
        fakemon.stats[statName] = statValue;
      }
    } else if (currentSection === 'Physical') {
      // Parse height and weight from format like "Height: 1.0 m | Weight: 20.0 kg"
      if (line.includes('Height:') && line.includes('Weight:')) {
        const parts = line.split('|');
        if (parts.length >= 2) {
          fakemon.height = parts[0].replace('Height:', '').trim();
          fakemon.weight = parts[1].replace('Weight:', '').trim();
        }
      }
    } else if (currentSection === 'Abilities') {
      fakemon.abilities = line.split(',').map(ability => ability.trim());
    } else if (currentSection === 'Pokedex Entry') {
      fakemon.pokedex_entry = line;
    } else if (currentSection === 'Evolution') {
      // Parse evolution lines like "#001 (Base)"
      const evoMatch = line.match(/#(\d+)\s*\((.+)\)/);
      if (evoMatch) {
        const evoNum = evoMatch[1];
        const requirement = evoMatch[2];

        // Try to find the name from the fakemon list or use a placeholder
        let evoName = "Unknown";
        if (evoNum === fakemon.number) {
          evoName = fakemon.name;
        }

        fakemon.evolution_line.push({
          number: evoNum,
          name: evoName,
          requirement: requirement
        });
      }
    } else if (currentSection === 'Artist') {
      fakemon.artist_caption = line;
    }
  }

  return fakemon;
}

/**
 * Load all Fakemon data
 * @returns {Array} Array of Fakemon objects
 */
function loadAllFakemon() {
  const fakemonDir = path.join(__dirname, '..', 'content', 'fakemon');
  const fakemonFiles = fs.readdirSync(fakemonDir)
    .filter(file => file.endsWith('.md'))
    .sort((a, b) => {
      const numA = parseInt(a.split('.')[0]);
      const numB = parseInt(b.split('.')[0]);
      return numA - numB;
    });

  const fakemonList = [];

  for (const file of fakemonFiles) {
    try {
      const filePath = path.join(fakemonDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const fakemon = parseFakemonMarkdown(content);

      // Extract number from filename and add to fakemon object
      const number = file.split('.')[0].padStart(3, '0');
      fakemon.number = number;

      // Add image path
      fakemon.image_path = `/images/fakemon/${number}.png`;

      fakemonList.push(fakemon);
    } catch (error) {
      console.error(`Error loading Fakemon file ${file}:`, error);
    }
  }

  return fakemonList;
}

/**
 * Get a specific Fakemon by number
 * @param {string} number - Fakemon number
 * @returns {Object|null} Fakemon data or null if not found
 */
function getFakemonByNumber(number) {
  const fakemonDir = path.join(__dirname, '..', 'content', 'fakemon');
  const paddedNumber = number.toString().padStart(3, '0');
  const filePath = path.join(fakemonDir, `${paddedNumber}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fakemon = parseFakemonMarkdown(content);

    // Set number and add image path
    fakemon.number = paddedNumber;
    fakemon.image_path = `/images/fakemon/${paddedNumber}.png`;

    return fakemon;
  } catch (error) {
    console.error(`Error loading Fakemon #${number}:`, error);
    return null;
  }
}

/**
 * Get previous and next Fakemon
 * @param {string} currentNumber - Current Fakemon number
 * @returns {Object} Object with prev and next Fakemon
 */
function getAdjacentFakemon(currentNumber) {
  const allFakemon = loadAllFakemon();
  const currentIndex = allFakemon.findIndex(mon => mon.number === currentNumber);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  const prev = currentIndex > 0 ? allFakemon[currentIndex - 1] : null;
  const next = currentIndex < allFakemon.length - 1 ? allFakemon[currentIndex + 1] : null;

  return { prev, next };
}

/**
 * Generate markdown content from fakemon object
 * @param {Object} fakemon - Fakemon data
 * @returns {string} Markdown content
 */
function generateFakemonMarkdown(fakemon) {
  let markdown = `# ${fakemon.name}\n\n`;

  // Classification
  markdown += `## Classification\n${fakemon.species_class || 'The Something Pokemon'}\n\n`;

  // Types
  markdown += `## Types\n${fakemon.types.join(', ')}\n\n`;

  // Attribute
  markdown += `## Attribute\n${fakemon.attribute}\n\n`;

  // Abilities
  markdown += `## Abilities\n${fakemon.abilities.join(', ')}\n\n`;

  // Physical
  markdown += `## Physical\nHeight: ${fakemon.height || '1.0 m'} | Weight: ${fakemon.weight || '20.0 kg'}\n\n`;

  // Stats
  markdown += `## Stats\n`;
  for (const [stat, value] of Object.entries(fakemon.stats)) {
    markdown += `${stat.toUpperCase()}: ${value}\n`;
  }
  markdown += '\n';

  // Evolution
  markdown += `## Evolution\n`;
  if (fakemon.evolution_line && fakemon.evolution_line.length > 0) {
    fakemon.evolution_line.forEach(evo => {
      markdown += `#${evo.number} (${evo.requirement})\n`;
    });
  } else {
    markdown += `#${fakemon.number} (Base)\n`;
  }
  markdown += '\n';

  // Pokedex Entry
  markdown += `## Pokedex Entry\n${fakemon.pokedex_entry || 'This is the pokedex entry text...'}\n\n`;

  // Artist
  markdown += `## Artist\n${fakemon.artist_caption || 'Art by Artist Name'}`;

  return markdown;
}

/**
 * Save a fakemon to a markdown file
 * @param {Object} fakemon - Fakemon data
 * @returns {boolean} Success status
 */
function saveFakemon(fakemon) {
  try {
    const fakemonDir = path.join(__dirname, '..', 'content', 'fakemon');
    const paddedNumber = fakemon.number.toString().padStart(3, '0');
    const filePath = path.join(fakemonDir, `${paddedNumber}.md`);

    // Generate markdown content
    const markdown = generateFakemonMarkdown(fakemon);

    // Write to file
    fs.writeFileSync(filePath, markdown, 'utf8');

    return true;
  } catch (error) {
    console.error(`Error saving Fakemon #${fakemon.number}:`, error);
    return false;
  }
}

/**
 * Delete a fakemon markdown file
 * @param {string} number - Fakemon number
 * @returns {boolean} Success status
 */
function deleteFakemon(number) {
  try {
    const fakemonDir = path.join(__dirname, '..', 'content', 'fakemon');
    const paddedNumber = number.toString().padStart(3, '0');
    const filePath = path.join(fakemonDir, `${paddedNumber}.md`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return false;
    }

    // Delete file
    fs.unlinkSync(filePath);

    return true;
  } catch (error) {
    console.error(`Error deleting Fakemon #${number}:`, error);
    return false;
  }
}

/**
 * Get the next available fakemon number
 * @returns {string} Next available number
 */
function getNextFakemonNumber() {
  const fakemonList = loadAllFakemon();

  if (fakemonList.length === 0) {
    return '001';
  }

  // Find the highest number and increment
  const highestNumber = Math.max(...fakemonList.map(mon => parseInt(mon.number)));
  return (highestNumber + 1).toString().padStart(3, '0');
}

module.exports = {
  loadAllFakemon,
  getFakemonByNumber,
  getAdjacentFakemon,
  saveFakemon,
  deleteFakemon,
  getNextFakemonNumber
};
