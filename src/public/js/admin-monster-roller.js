/**
 * Admin Monster Roller Interface
 * Provides a user-friendly interface for configuring monster rolling parameters
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const monsterParamsTextarea = document.getElementById('reward_monster_params');
  const monsterRollerContainer = document.getElementById('monster-roller-container');
  const monsterPreviewContainer = document.getElementById('monster-preview');

  // Only initialize if we're on the right page
  if (!monsterParamsTextarea || !monsterRollerContainer) return;

  // Create the UI
  createMonsterRollerUI();

  // Initialize with existing data if available
  initializeFromExistingParams();

  /**
   * Create the monster roller UI
   */
  function createMonsterRollerUI() {
    // Create the form structure
    const formHTML = `
      <div class="monster-roller-ui">
        <div class="form-section-subtitle">Visual Monster Roller</div>
        <p class="form-help">Configure monster parameters visually instead of writing JSON</p>

        <div class="monster-config-grid">
          <!-- Species Selection -->
          <div class="config-group">
            <label class="config-label">Species Types</label>
            <div class="checkbox-group">
              <div class="checkbox-item">
                <input type="checkbox" id="species-pokemon" class="species-checkbox" checked>
                <label for="species-pokemon">Pokémon</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="species-digimon" class="species-checkbox" checked>
                <label for="species-digimon">Digimon</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="species-yokai" class="species-checkbox" checked>
                <label for="species-yokai">Yokai</label>
              </div>
            </div>
          </div>

          <!-- Rarity Selection -->
          <div class="config-group">
            <label class="config-label">Rarity</label>
            <select id="monster-rarity" class="form-select modern-select">
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>

          <!-- Fusion Options -->
          <div class="config-group">
            <label class="config-label">Fusion</label>
            <select id="monster-fusion" class="form-select modern-select">
              <option value="default">Default (Random)</option>
              <option value="force">Force Fusion</option>
              <option value="none">No Fusion</option>
            </select>
          </div>

          <!-- Species Count -->
          <div class="config-group">
            <label class="config-label">Species Count</label>
            <div class="range-with-value">
              <input type="range" id="species-count" min="1" max="3" value="1" class="range-slider">
              <span id="species-count-value">1</span>
            </div>
          </div>

          <!-- Type Count -->
          <div class="config-group">
            <label class="config-label">Type Count</label>
            <div class="range-with-value">
              <input type="range" id="type-count" min="1" max="5" value="1" class="range-slider">
              <span id="type-count-value">1</span>
            </div>
          </div>

          <!-- Advanced Options Toggle -->
          <div class="config-group form-full">
            <button type="button" id="toggle-advanced" class="btn-toggle">
              <i class="fas fa-cog"></i> Advanced Options
            </button>
          </div>
        </div>

        <!-- Advanced Options (hidden by default) -->
        <div id="advanced-options" class="advanced-options" style="display: none;">
          <div class="form-help mb-3">
            <i class="fas fa-info-circle"></i> Hold Ctrl (or Cmd on Mac) to select multiple options in the dropdowns. Select none to include all options.
          </div>
          <div class="monster-config-grid">
            <!-- Pokemon Options -->
            <div class="config-group form-full">
              <label class="config-label">Pokémon Filters</label>
              <div class="filter-grid">
                <div>
                  <label class="filter-label">Rarity (hold Ctrl to select multiple)</label>
                  <select id="pokemon-rarity" class="form-select modern-select" multiple size="4">
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Very Rare">Very Rare</option>
                    <option value="Legendary">Legendary</option>
                    <option value="Mythical">Mythical</option>
                    <option value="Ultra Beast">Ultra Beast</option>
                  </select>
                </div>
                <div>
                  <label class="filter-label">Stage (hold Ctrl to select multiple)</label>
                  <select id="pokemon-stage" class="form-select modern-select" multiple size="4">
                    <option value="Base Stage">Base Stage</option>
                    <option value="Middle Stage">Middle Stage</option>
                    <option value="Final Stage">Final Stage</option>
                    <option value="Doesn't Evolve">Doesn't Evolve</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Digimon Options -->
            <div class="config-group form-full">
              <label class="config-label">Digimon Filters</label>
              <div class="filter-grid">
                <div>
                  <label class="filter-label">Stage (hold Ctrl to select multiple)</label>
                  <select id="digimon-stage" class="form-select modern-select" multiple size="4">
                    <option value="Training 1">Training 1</option>
                    <option value="Training 2">Training 2</option>
                    <option value="Rookie">Rookie</option>
                    <option value="Champion">Champion</option>
                    <option value="Ultimate">Ultimate</option>
                    <option value="Mega">Mega</option>
                    <option value="Ultra">Ultra</option>
                    <option value="Super Ultimate">Super Ultimate</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Yokai Options -->
            <div class="config-group form-full">
              <label class="config-label">Yokai Filters</label>
              <div class="filter-grid">
                <div>
                  <label class="filter-label">Rank (hold Ctrl to select multiple)</label>
                  <select id="yokai-rank" class="form-select modern-select" multiple size="4">
                    <option value="E">E</option>
                    <option value="D">D</option>
                    <option value="C">C</option>
                    <option value="B">B</option>
                    <option value="A">A</option>
                    <option value="S">S</option>
                    <option value="SS">SS</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview and Generate Section -->
        <div class="preview-section">
          <button type="button" id="preview-monster" class="btn-preview">
            <i class="fas fa-eye"></i> Preview Possible Monster
          </button>
          <button type="button" id="generate-json" class="btn-generate">
            <i class="fas fa-code"></i> Generate JSON
          </button>
        </div>

        <!-- Monster Preview Area -->
        <div id="monster-preview" class="monster-preview">
          <div class="preview-placeholder">
            <i class="fas fa-question-circle"></i>
            <p>Click "Preview" to see a sample monster</p>
          </div>
        </div>
      </div>
    `;

    // Add the form to the container
    monsterRollerContainer.innerHTML = formHTML;

    // Add event listeners
    setupEventListeners();
  }

  /**
   * Set up event listeners for the UI
   */
  function setupEventListeners() {
    // Range sliders
    const speciesCountSlider = document.getElementById('species-count');
    const typeCountSlider = document.getElementById('type-count');

    speciesCountSlider.addEventListener('input', function() {
      document.getElementById('species-count-value').textContent = this.value;
      updateFusionAvailability();
    });

    typeCountSlider.addEventListener('input', function() {
      document.getElementById('type-count-value').textContent = this.value;
    });

    // Toggle advanced options
    document.getElementById('toggle-advanced').addEventListener('click', function() {
      const advancedOptions = document.getElementById('advanced-options');
      if (advancedOptions.style.display === 'none') {
        advancedOptions.style.display = 'block';
        this.innerHTML = '<i class="fas fa-times"></i> Hide Advanced Options';
      } else {
        advancedOptions.style.display = 'none';
        this.innerHTML = '<i class="fas fa-cog"></i> Advanced Options';
      }
    });

    // Preview button
    document.getElementById('preview-monster').addEventListener('click', function() {
      previewMonster();
    });

    // Generate JSON button
    document.getElementById('generate-json').addEventListener('click', function() {
      generateJSON();
    });

    // Species checkboxes
    document.querySelectorAll('.species-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        // Ensure at least one species is selected
        const checkedCount = document.querySelectorAll('.species-checkbox:checked').length;
        if (checkedCount === 0) {
          this.checked = true;
          alert('At least one species type must be selected.');
        }
      });
    });

    // Fusion dropdown
    document.getElementById('monster-fusion').addEventListener('change', function() {
      updateSpeciesCountAvailability();
    });
  }

  /**
   * Update fusion availability based on species count
   */
  function updateFusionAvailability() {
    const speciesCount = parseInt(document.getElementById('species-count').value);
    const fusionSelect = document.getElementById('monster-fusion');

    if (speciesCount === 1) {
      // If only one species, can't force fusion
      if (fusionSelect.value === 'force') {
        fusionSelect.value = 'default';
      }

      // Disable the "Force Fusion" option
      Array.from(fusionSelect.options).forEach(option => {
        if (option.value === 'force') {
          option.disabled = true;
        }
      });
    } else {
      // Enable all options
      Array.from(fusionSelect.options).forEach(option => {
        option.disabled = false;
      });
    }
  }

  /**
   * Update species count availability based on fusion selection
   */
  function updateSpeciesCountAvailability() {
    const fusionValue = document.getElementById('monster-fusion').value;
    const speciesCountSlider = document.getElementById('species-count');

    if (fusionValue === 'none') {
      // If no fusion, force species count to 1
      speciesCountSlider.value = 1;
      document.getElementById('species-count-value').textContent = 1;
      speciesCountSlider.disabled = true;
    } else if (fusionValue === 'force') {
      // If force fusion, minimum species count is 2
      if (parseInt(speciesCountSlider.value) < 2) {
        speciesCountSlider.value = 2;
        document.getElementById('species-count-value').textContent = 2;
      }
      speciesCountSlider.disabled = false;
    } else {
      // Default - enable the slider
      speciesCountSlider.disabled = false;
    }
  }

  /**
   * Initialize the UI from existing JSON parameters
   */
  function initializeFromExistingParams() {
    if (!monsterParamsTextarea.value || monsterParamsTextarea.value.trim() === '') {
      return;
    }

    try {
      const params = JSON.parse(monsterParamsTextarea.value);

      // Set species types
      if (params.filters && params.filters.includeSpecies) {
        const includeSpecies = Array.isArray(params.filters.includeSpecies)
          ? params.filters.includeSpecies
          : [params.filters.includeSpecies];

        // Uncheck all first
        document.querySelectorAll('.species-checkbox').forEach(checkbox => {
          checkbox.checked = false;
        });

        // Check the included ones
        includeSpecies.forEach(species => {
          const checkbox = document.getElementById(`species-${species.toLowerCase()}`);
          if (checkbox) checkbox.checked = true;
        });
      }

      // Set rarity
      if (params.filters && params.filters.rarity) {
        const raritySelect = document.getElementById('monster-rarity');
        if (raritySelect) raritySelect.value = params.filters.rarity.toLowerCase();
      }

      // Set fusion options
      if (params.overrideParams) {
        const fusionSelect = document.getElementById('monster-fusion');

        if (params.overrideParams.forceNoFusion) {
          fusionSelect.value = 'none';
        } else if (params.overrideParams.forceFusion) {
          fusionSelect.value = 'force';
        }

        // Set species count
        if (params.overrideParams.minSpecies && params.overrideParams.maxSpecies &&
            params.overrideParams.minSpecies === params.overrideParams.maxSpecies) {
          const speciesCount = document.getElementById('species-count');
          speciesCount.value = params.overrideParams.minSpecies;
          document.getElementById('species-count-value').textContent = params.overrideParams.minSpecies;
        }

        // Set type count
        if (params.overrideParams.minType && params.overrideParams.maxType &&
            params.overrideParams.minType === params.overrideParams.maxType) {
          const typeCount = document.getElementById('type-count');
          typeCount.value = params.overrideParams.minType;
          document.getElementById('type-count-value').textContent = params.overrideParams.minType;
        }
      }

      // Set advanced options if they exist
      if (params.filters) {
        // Helper function to set multiple selected values in a select element
        function setSelectedValues(selectElement, values) {
          if (!selectElement || !values) return;

          // Convert to array if it's not already
          const valueArray = Array.isArray(values) ? values : [values];

          // Deselect all options first
          for (let i = 0; i < selectElement.options.length; i++) {
            selectElement.options[i].selected = false;
          }

          // Select the specified options
          for (let i = 0; i < selectElement.options.length; i++) {
            if (valueArray.includes(selectElement.options[i].value)) {
              selectElement.options[i].selected = true;
            }
          }
        }

        // Pokemon filters
        if (params.filters.pokemon) {
          // Show advanced options if any filters are set
          document.getElementById('advanced-options').style.display = 'block';
          document.getElementById('toggle-advanced').innerHTML = '<i class="fas fa-times"></i> Hide Advanced Options';

          if (params.filters.pokemon.rarity) {
            setSelectedValues(document.getElementById('pokemon-rarity'), params.filters.pokemon.rarity);
          }

          if (params.filters.pokemon.stage) {
            setSelectedValues(document.getElementById('pokemon-stage'), params.filters.pokemon.stage);
          }
        }

        // Digimon filters
        if (params.filters.digimon) {
          // Show advanced options if any filters are set
          document.getElementById('advanced-options').style.display = 'block';
          document.getElementById('toggle-advanced').innerHTML = '<i class="fas fa-times"></i> Hide Advanced Options';

          if (params.filters.digimon.stage) {
            setSelectedValues(document.getElementById('digimon-stage'), params.filters.digimon.stage);
          }
        }

        // Yokai filters
        if (params.filters.yokai) {
          // Show advanced options if any filters are set
          document.getElementById('advanced-options').style.display = 'block';
          document.getElementById('toggle-advanced').innerHTML = '<i class="fas fa-times"></i> Hide Advanced Options';

          if (params.filters.yokai.rank) {
            setSelectedValues(document.getElementById('yokai-rank'), params.filters.yokai.rank);
          }
        }
      }

      // Update UI based on loaded values
      updateFusionAvailability();
      updateSpeciesCountAvailability();

    } catch (error) {
      console.error('Error parsing existing monster parameters:', error);
    }
  }

  /**
   * Generate JSON from the UI settings
   */
  function generateJSON() {
    // Get selected species
    const selectedSpecies = [];
    document.querySelectorAll('.species-checkbox:checked').forEach(checkbox => {
      const species = checkbox.id.replace('species-', '');
      selectedSpecies.push(species.charAt(0).toUpperCase() + species.slice(1));
    });

    // Get fusion settings
    const fusionValue = document.getElementById('monster-fusion').value;
    const forceFusion = fusionValue === 'force';
    const forceNoFusion = fusionValue === 'none';

    // Get counts
    const speciesCount = parseInt(document.getElementById('species-count').value);
    const typeCount = parseInt(document.getElementById('type-count').value);

    // Get rarity
    const rarity = document.getElementById('monster-rarity').value;

    // Build the JSON object
    const params = {
      filters: {
        includeSpecies: selectedSpecies,
        rarity: rarity.charAt(0).toUpperCase() + rarity.slice(1)
      },
      overrideParams: {
        forceFusion: forceFusion,
        forceNoFusion: forceNoFusion,
        minSpecies: speciesCount,
        maxSpecies: speciesCount,
        minType: typeCount,
        maxType: typeCount
      }
    };

    // Add advanced options if they're visible
    if (document.getElementById('advanced-options').style.display !== 'none') {
      // Helper function to get selected values from a multi-select
      function getSelectedValues(selectElement) {
        const selectedValues = [];
        for (let i = 0; i < selectElement.options.length; i++) {
          if (selectElement.options[i].selected) {
            selectedValues.push(selectElement.options[i].value);
          }
        }
        return selectedValues.length > 0 ? selectedValues : null;
      }

      // Pokemon filters
      const pokemonRarity = getSelectedValues(document.getElementById('pokemon-rarity'));
      const pokemonStage = getSelectedValues(document.getElementById('pokemon-stage'));

      // Only add pokemon filters if at least one filter is set
      if (pokemonRarity || pokemonStage) {
        params.filters.pokemon = {};
        if (pokemonRarity) params.filters.pokemon.rarity = pokemonRarity.length === 1 ? pokemonRarity[0] : pokemonRarity;
        if (pokemonStage) params.filters.pokemon.stage = pokemonStage.length === 1 ? pokemonStage[0] : pokemonStage;
      }

      // Digimon filters
      const digimonStage = getSelectedValues(document.getElementById('digimon-stage'));

      // Only add digimon filters if at least one filter is set
      if (digimonStage) {
        params.filters.digimon = {};
        params.filters.digimon.stage = digimonStage.length === 1 ? digimonStage[0] : digimonStage;
      }

      // Yokai filters
      const yokaiRank = getSelectedValues(document.getElementById('yokai-rank'));

      // Only add yokai filters if at least one filter is set
      if (yokaiRank) {
        params.filters.yokai = {};
        params.filters.yokai.rank = yokaiRank.length === 1 ? yokaiRank[0] : yokaiRank;
      }
    }

    // Update the textarea
    monsterParamsTextarea.value = JSON.stringify(params, null, 2);

    // Show success message
    alert('Monster parameters generated successfully!');
  }

  /**
   * Preview a possible monster based on current settings
   */
  function previewMonster() {
    // First generate the JSON
    generateJSON();

    // Show loading state
    monsterPreviewContainer.innerHTML = `
      <div class="preview-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Rolling a monster...</p>
      </div>
    `;

    // Simulate a monster roll (in a real implementation, this would call the API)
    setTimeout(() => {
      // Get the selected species for the preview
      const selectedSpecies = [];
      document.querySelectorAll('.species-checkbox:checked').forEach(checkbox => {
        selectedSpecies.push(checkbox.id.replace('species-', ''));
      });

      // Randomly select one of the species types for the preview
      const speciesType = selectedSpecies[Math.floor(Math.random() * selectedSpecies.length)];

      // Get some sample data based on the species type
      let monsterData;

      if (speciesType === 'pokemon') {
        const pokemonOptions = [
          { name: 'Pikachu', type: 'Electric', rarity: 'Common' },
          { name: 'Charizard', type: 'Fire/Flying', rarity: 'Rare' },
          { name: 'Eevee', type: 'Normal', rarity: 'Uncommon' },
          { name: 'Mewtwo', type: 'Psychic', rarity: 'Legendary' }
        ];
        monsterData = pokemonOptions[Math.floor(Math.random() * pokemonOptions.length)];
        monsterData.species = 'Pokémon';
      } else if (speciesType === 'digimon') {
        const digimonOptions = [
          { name: 'Agumon', type: 'Vaccine', rarity: 'Rookie' },
          { name: 'Gabumon', type: 'Data', rarity: 'Rookie' },
          { name: 'WarGreymon', type: 'Vaccine', rarity: 'Mega' },
          { name: 'Omnimon', type: 'Vaccine', rarity: 'Ultra' }
        ];
        monsterData = digimonOptions[Math.floor(Math.random() * digimonOptions.length)];
        monsterData.species = 'Digimon';
      } else {
        const yokaiOptions = [
          { name: 'Jibanyan', type: 'Fire', rarity: 'B' },
          { name: 'Komasan', type: 'Ice', rarity: 'C' },
          { name: 'Venoct', type: 'Wind', rarity: 'S' },
          { name: 'Whisper', type: 'Normal', rarity: 'E' }
        ];
        monsterData = yokaiOptions[Math.floor(Math.random() * yokaiOptions.length)];
        monsterData.species = 'Yokai';
      }

      // Display the preview
      monsterPreviewContainer.innerHTML = `
        <div class="preview-monster">
          <div class="preview-monster-header">
            <h3>${monsterData.name}</h3>
            <span class="preview-monster-type">${monsterData.type}</span>
          </div>
          <div class="preview-monster-details">
            <p><strong>Species:</strong> ${monsterData.species}</p>
            <p><strong>Rarity:</strong> ${monsterData.rarity}</p>
          </div>
          <div class="preview-note">
            <p><em>Note: This is just a sample preview. Actual results will vary.</em></p>
          </div>
        </div>
      `;
    }, 1000);
  }
});
