/**
 * Egg Hatching Manager
 * Handles the egg hatching process in the nursery
 */
class EggHatchingManager {
  constructor() {
    this.init();
  }

  /**
   * Initialize the egg hatching manager
   */
  init() {
    console.log('Initializing Egg Hatching Manager');

    // Get DOM elements
    this.trainerSelect = document.getElementById('trainer-select');
    console.log('Trainer select found:', !!this.trainerSelect);

    this.trainerEggCount = document.getElementById('trainer-egg-count');
    console.log('Trainer egg count found:', !!this.trainerEggCount);

    this.hatchMethodContainer = document.getElementById('hatch-method-container');
    console.log('Hatch method container found:', !!this.hatchMethodContainer);

    this.incubatorOption = document.getElementById('incubator-option');
    console.log('Incubator option found:', !!this.incubatorOption);

    this.artworkOption = document.getElementById('artwork-option');
    console.log('Artwork option found:', !!this.artworkOption);

    this.artworkUrlContainer = document.getElementById('artwork-url-container');
    console.log('Artwork URL container found:', !!this.artworkUrlContainer);

    this.artworkUrlInput = document.getElementById('artwork-url');
    console.log('Artwork URL input found:', !!this.artworkUrlInput);

    this.monsterRollContainer = document.getElementById('monster-roll-container');
    console.log('Monster roll container found:', !!this.monsterRollContainer);

    this.monsterGrid = document.getElementById('monster-grid');
    console.log('Monster grid found:', !!this.monsterGrid);

    this.monsterNameInput = document.getElementById('monster-name');
    console.log('Monster name input found:', !!this.monsterNameInput);

    this.claimButton = document.getElementById('claim-button');
    console.log('Claim button found:', !!this.claimButton);

    this.successSection = document.getElementById('success-section');
    console.log('Success section found:', !!this.successSection);

    this.successMessage = document.getElementById('success-message');
    console.log('Success message found:', !!this.successMessage);

    this.loadingIndicator = document.getElementById('loading-indicator');
    console.log('Loading indicator found:', !!this.loadingIndicator);

    this.errorMessage = document.getElementById('error-message');
    console.log('Error message found:', !!this.errorMessage);

    // Bind event listeners
    this.bindEvents();
  }

  /**
   * Bind event listeners to form elements
   */
  bindEvents() {
    // Trainer selection
    if (this.trainerSelect) {
      this.trainerSelect.addEventListener('change', () => this.onTrainerChange());
    }

    // Hatch method selection
    if (this.incubatorOption) {
      this.incubatorOption.addEventListener('change', () => this.toggleArtworkInput());
    }

    if (this.artworkOption) {
      this.artworkOption.addEventListener('change', () => this.toggleArtworkInput());
    }

    // Form submission
    const form = document.getElementById('egg-hatching-form');
    if (form) {
      form.addEventListener('submit', (e) => this.onFormSubmit(e));
    }

    // Claim button
    if (this.claimButton) {
      this.claimButton.addEventListener('click', () => this.claimMonster());
    }
  }

  /**
   * Handle trainer selection change
   */
  onTrainerChange() {
    const trainerId = this.trainerSelect.value;
    if (!trainerId) {
      this.hideEggCount();
      this.hideHatchMethod();
      return;
    }

    this.fetchEggCount(trainerId);
  }

  /**
   * Fetch egg count for the selected trainer
   * @param {string} trainerId - The ID of the selected trainer
   */
  async fetchEggCount(trainerId) {
    try {
      this.showLoading();
      const response = await fetch(`/api/nursery/eggs?trainerId=${trainerId}`);
      const data = await response.json();

      if (data.success) {
        this.showEggCount(data.eggCount, data.trainerName);
        if (data.eggCount > 0) {
          this.showHatchMethod();
        } else {
          this.hideHatchMethod();
          this.showError('This trainer has no eggs to hatch. Visit the shop to purchase eggs.');
        }
      } else {
        this.hideEggCount();
        this.hideHatchMethod();
        this.showError(data.message || 'Error fetching egg count');
      }
    } catch (error) {
      console.error('Error fetching egg count:', error);
      this.hideEggCount();
      this.hideHatchMethod();
      this.showError('Error connecting to server. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Show egg count information
   * @param {number} count - Number of eggs
   * @param {string} trainerName - Name of the trainer
   */
  showEggCount(count, trainerName) {
    console.log(`Showing egg count: ${count} for ${trainerName}`);
    if (this.trainerEggCount) {
      this.trainerEggCount.innerHTML = `
        <div class="bg-gray-800/70 p-4 rounded-lg border border-amber-700/50">
          <p class="text-amber-400 font-semibold">${trainerName} has <span class="text-white">${count}</span> Standard Egg${count !== 1 ? 's' : ''}</p>
        </div>
      `;
      this.trainerEggCount.classList.remove('hidden');
    } else {
      console.error('trainerEggCount element not found');
    }
  }

  /**
   * Hide egg count information
   */
  hideEggCount() {
    if (this.trainerEggCount) {
      this.trainerEggCount.classList.add('hidden');
    }
  }

  /**
   * Show hatch method selection
   */
  showHatchMethod() {
    if (this.hatchMethodContainer) {
      this.hatchMethodContainer.classList.remove('hidden');
    }
  }

  /**
   * Hide hatch method selection
   */
  hideHatchMethod() {
    if (this.hatchMethodContainer) {
      this.hatchMethodContainer.classList.add('hidden');
    }
  }

  /**
   * Toggle artwork URL input based on selected hatch method
   */
  toggleArtworkInput() {
    if (this.artworkOption && this.artworkOption.checked) {
      if (this.artworkUrlContainer) {
        this.artworkUrlContainer.classList.remove('hidden');
      }
    } else {
      if (this.artworkUrlContainer) {
        this.artworkUrlContainer.classList.add('hidden');
      }
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async onFormSubmit(e) {
    e.preventDefault();
    console.log('Form submitted');

    // Validate form
    const trainerId = this.trainerSelect.value;
    if (!trainerId) {
      this.showError('Please select a trainer');
      return;
    }

    // Check if using incubator or artwork
    const useIncubator = this.incubatorOption && this.incubatorOption.checked;
    const useArtwork = this.artworkOption && this.artworkOption.checked;

    // Validate that a hatch method is selected
    if (!useIncubator && !useArtwork) {
      this.showError('Please select a hatching method');
      return;
    }

    // If using artwork, validate URL
    let artworkUrl = '';
    if (useArtwork) {
      artworkUrl = this.artworkUrlInput.value.trim();
      if (!artworkUrl) {
        this.showError('Please enter an artwork URL');
        return;
      }

      // Basic URL validation
      if (!artworkUrl.startsWith('http')) {
        this.showError('Please enter a valid URL starting with http:// or https://');
        return;
      }
    }

    // Prepare data for API call
    const requestData = {
      trainerId,
      useIncubator,
      submissionUrl: artworkUrl
    };

    console.log('Sending request:', requestData);

    try {
      this.showLoading();
      const response = await fetch('/api/nursery/hatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('Response received:', data);

      if (data.success) {
        this.displayMonsters(data.data.monsters);
      } else {
        this.showError(data.message || 'Error hatching egg');
      }
    } catch (error) {
      console.error('Error hatching egg:', error);
      this.showError('Error connecting to server. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Display rolled monsters
   * @param {Array} monsters - Array of monster data
   */
  displayMonsters(monsters) {
    console.log('Displaying monsters:', monsters);

    if (!this.monsterRollContainer || !this.monsterGrid) {
      console.error('Monster roll container or grid not found');
      return;
    }

    // Hide the form
    const form = document.getElementById('egg-hatching-form');
    if (form) {
      form.classList.add('hidden');
    }

    // Show the monster roll container
    this.monsterRollContainer.classList.remove('hidden');

    // Clear previous monsters
    this.monsterGrid.innerHTML = '';

    // Add each monster to the grid
    monsters.forEach((monster, index) => {
      const card = document.createElement('div');
      card.className = 'monster-card';
      card.dataset.index = index;

      // Determine species display
      const speciesDisplay = [monster.species1, monster.species2, monster.species3]
        .filter(Boolean)
        .join('/');

      // Determine type display
      const typeDisplay = [monster.type1, monster.type2, monster.type3]
        .filter(Boolean)
        .join('/');

      card.innerHTML = `
        <div class="monster-card-content">
          <h5 class="monster-name">${speciesDisplay}</h5>
          <div class="monster-types">${typeDisplay}</div>
          <div class="monster-attribute">${monster.attribute || 'Data'}</div>
        </div>
        <div class="monster-card-footer">
          <button type="button" class="select-monster-btn" data-index="${index}">
            <i class="far fa-circle"></i> Select
          </button>
        </div>
      `;

      this.monsterGrid.appendChild(card);

      // Add click event to select button
      const selectBtn = card.querySelector('.select-monster-btn');
      if (selectBtn) {
        selectBtn.addEventListener('click', () => this.selectMonster(index, monsters));
      }
    });

    // Store the monsters for later use
    this.monsters = monsters;

    // Scroll to the monster grid
    this.monsterRollContainer.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Select a monster
   * @param {number} index - Index of the selected monster
   * @param {Array} monsters - Array of monster data
   */
  selectMonster(index, monsters) {
    console.log(`Selecting monster at index ${index}:`, monsters[index]);

    // Highlight the selected monster
    const cards = document.querySelectorAll('.monster-card');
    cards.forEach(card => {
      card.classList.remove('selected');
      const btn = card.querySelector('.select-monster-btn');
      if (btn) {
        btn.innerHTML = '<i class="far fa-circle"></i> Select';
      }
    });

    const selectedCard = document.querySelector(`.monster-card[data-index="${index}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
      const btn = selectedCard.querySelector('.select-monster-btn');
      if (btn) {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Selected';
      }
    } else {
      console.error(`Could not find card with data-index=${index}`);
    }

    // Store the selected monster
    this.selectedMonsterIndex = index;
    this.selectedMonster = monsters[index];

    // Show the name input and claim button
    const nameInputContainer = document.getElementById('monster-name-container');
    if (nameInputContainer) {
      nameInputContainer.classList.remove('hidden');
    } else {
      console.error('Monster name container not found');
    }

    if (this.claimButton) {
      this.claimButton.classList.remove('hidden');
    } else {
      console.error('Claim button not found');
    }

    // Set default name based on species
    if (this.monsterNameInput) {
      const speciesDisplay = [this.selectedMonster.species1, this.selectedMonster.species2, this.selectedMonster.species3]
        .filter(Boolean)[0];
      this.monsterNameInput.value = speciesDisplay;
    } else {
      console.error('Monster name input not found');
    }
  }

  /**
   * Claim the selected monster
   */
  async claimMonster() {
    console.log('Claiming monster');

    if (!this.selectedMonster) {
      this.showError('Please select a monster to claim');
      return;
    }

    const trainerId = this.trainerSelect.value;
    if (!trainerId) {
      this.showError('Please select a trainer');
      return;
    }

    const monsterName = this.monsterNameInput.value.trim();
    if (!monsterName) {
      this.showError('Please enter a name for your monster');
      return;
    }

    // Prepare data for API call
    const requestData = {
      trainerId,
      monsterData: this.selectedMonster,
      monsterName
    };

    console.log('Sending claim request:', requestData);

    try {
      this.showLoading();
      const response = await fetch('/api/nursery/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('Claim response:', data);

      if (data.success) {
        this.showSuccess(monsterName);
      } else {
        this.showError(data.message || 'Error claiming monster');
      }
    } catch (error) {
      console.error('Error claiming monster:', error);
      this.showError('Error connecting to server. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Show success message
   * @param {string} monsterName - Name of the claimed monster
   */
  showSuccess(monsterName) {
    console.log(`Showing success for monster: ${monsterName}`);

    // Hide the form and monster roll container
    const form = document.getElementById('egg-hatching-form');
    if (form) {
      form.classList.add('hidden');
    }

    if (this.monsterRollContainer) {
      this.monsterRollContainer.classList.add('hidden');
    }

    // Show success message
    if (this.successSection) {
      this.successSection.classList.remove('hidden');
    } else {
      console.error('Success section not found');
    }

    if (this.successMessage) {
      this.successMessage.textContent = `You've successfully claimed ${monsterName}!`;
    } else {
      console.error('Success message element not found');
    }

    // Scroll to success message
    if (this.successSection) {
      this.successSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.classList.remove('hidden');
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.classList.add('hidden');
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.classList.remove('hidden');

      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.hideError();
      }, 5000);
    }
  }

  /**
   * Hide error message
   */
  hideError() {
    if (this.errorMessage) {
      this.errorMessage.classList.add('hidden');
    }
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.eggHatchingManager = new EggHatchingManager();
});
