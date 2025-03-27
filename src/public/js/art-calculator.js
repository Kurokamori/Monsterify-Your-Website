/**
 * Art Submission Calculator
 *
 * This calculator helps users determine the level rewards for art submissions
 * based on various factors like size, linework, coloring, complexity, etc.
 */

class ArtSubmissionCalculator {
    constructor() {
        this.groups = {};
        this.backgroundBonus = 0;
        this.totalBackgroundBonus = 0;
        this.totalBonusLevels = 0;
        this.totalGiftLevels = 0;

        // Level assignment tracking
        this.assignedBackgroundLevels = 0;
        this.assignedBonusLevels = 0;
        this.assignedGiftLevels = 0;
        this.levelAssignments = [];

        // Trainers and monsters data
        this.trainers = [];
        this.monsters = [];
    }

    /**
     * Initialize the calculator UI
     */
    init() {
        // Store the calculator instance globally for debugging and access
        window.artCalculator = this;

        // Load trainers and monsters data
        this.loadTrainersAndMonsters();

        // Define the initialization function
        const initializeUI = function() {
            console.log('Initializing calculator UI...');

            // Reset the calculator to its initial state
            this.resetCalculator();

            // Set up all event listeners
            this.setupEventListeners();

            // Initialize the background bonus calculation
            this.updateBackgroundBonus();

            console.log('Calculator UI initialized');
        }.bind(this); // Bind 'this' to ensure correct context

        // Initialize immediately if DOM is already loaded
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            console.log('DOM already loaded, initializing immediately');
            initializeUI();
        } else {
            // Otherwise wait for DOMContentLoaded event
            console.log('DOM not yet loaded, waiting for DOMContentLoaded event');
            document.addEventListener('DOMContentLoaded', initializeUI);
        }

        // Also initialize on window load as a fallback
        window.addEventListener('load', function() {
            console.log('Window load event fired');
            initializeUI();
        }.bind(this));
    }

    /**
     * Load trainers and monsters data from the server
     */
    async loadTrainersAndMonsters() {
        try {
            // Try to fetch real data from the server
            if (typeof ApiClient !== 'undefined') {
                console.log('Attempting to fetch trainers and monsters from API...');

                // Show loading message in the UI
                this.showLoadingMessage('Loading trainers and monsters from database...');

                const result = await ApiClient.fetchAllTrainersAndMonsters();
                const {trainers, monsters, error} = result;

                console.log(`API returned ${trainers?.length || 0} trainers and ${monsters?.length || 0} monsters`);

                if (error) {
                    console.error('API returned an error:', error);
                    this.showErrorMessage(`Failed to load data: ${error}`);
                    // Don't fall back to mock data automatically - let the user know there's an issue
                    return;
                }

                if (trainers && trainers.length > 0) {
                    this.trainers = trainers;
                    this.monsters = monsters || [];

                    // Log the first few trainers and monsters for debugging
                    console.log('Sample trainers:', this.trainers.slice(0, 3).map(t => ({ id: t.id, name: t.name })));
                    console.log('Sample monsters:', this.monsters.slice(0, 3).map(m => ({ id: m.id, name: m.name, trainer_id: m.trainer_id })));

                    // Store normalized versions of names for faster searching
                    this.normalizeTrainerAndMonsterNames();

                    // Clear any error messages
                    this.clearMessages();

                    // Show success message
                    this.showSuccessMessage(`Successfully loaded ${trainers.length} trainers and ${monsters.length} monsters`);
                } else {
                    console.warn('No trainers found from API');
                    this.showErrorMessage('No trainers found in the database. Please check your connection or contact support.');
                    // Don't fall back to mock data automatically - let the user know there's an issue
                    return;
                }
            } else {
                console.warn('ApiClient not available');
                this.showErrorMessage('API client not available. Please check your connection or contact support.');
                // Don't fall back to mock data automatically - let the user know there's an issue
                return;
            }
        } catch (error) {
            console.error('Error loading trainers and monsters:', error);
            this.showErrorMessage(`Error loading data: ${error.message}`);
            // Don't fall back to mock data automatically - let the user know there's an issue
            return;
        }
    }

    /**
     * Use mock data for trainers and monsters
     */
    useMockData() {
        console.log('Using mock data for trainers and monsters');
        this.trainers = [
            {id: 1, name: 'Trainer 1'},
            {id: 2, name: 'Trainer 2'},
            {id: 3, name: 'Trainer 3'}
        ];

        this.monsters = [
            {id: 1, name: 'Monster 1', trainer_id: 1},
            {id: 2, name: 'Monster 2', trainer_id: 1},
            {id: 3, name: 'Monster 3', trainer_id: 2},
            {id: 4, name: 'Monster 4', trainer_id: 2},
            {id: 5, name: 'Monster 5', trainer_id: 3}
        ];

        // Normalize the mock data names too
        this.normalizeTrainerAndMonsterNames();

        // Show a warning message that we're using mock data
        this.showWarningMessage('Using mock data for demonstration purposes. Real trainers and monsters are not available.');
    }

    /**
     * Show a loading message in the UI
     * @param {string} message - The message to display
     */
    showLoadingMessage(message) {
        this.showMessage(message, 'info');
    }

    /**
     * Show an error message in the UI
     * @param {string} message - The message to display
     */
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show a warning message in the UI
     * @param {string} message - The message to display
     */
    showWarningMessage(message) {
        this.showMessage(message, 'warning');
    }

    /**
     * Show a success message in the UI
     * @param {string} message - The message to display
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show a message in the UI
     * @param {string} message - The message to display
     * @param {string} type - The type of message (info, error, warning, success)
     */
    showMessage(message, type = 'info') {
        // Create or get the message container
        let messageContainer = document.getElementById('calculator-messages');

        if (!messageContainer) {
            // Create the message container if it doesn't exist
            messageContainer = document.createElement('div');
            messageContainer.id = 'calculator-messages';
            messageContainer.className = 'calculator-messages';

            // Insert it at the top of the calculator
            const calculatorContainer = document.getElementById('art-calculator-container');
            if (calculatorContainer) {
                calculatorContainer.insertBefore(messageContainer, calculatorContainer.firstChild);
            }
        }

        // Create the message element
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <span class="message-text">${message}</span>
                <button class="message-close">&times;</button>
            </div>
        `;

        // Add click handler to close button
        const closeButton = messageElement.querySelector('.message-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                messageElement.remove();
            });
        }

        // Add the message to the container
        messageContainer.appendChild(messageElement);

        // Auto-remove info and success messages after 5 seconds
        if (type === 'info' || type === 'success') {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 5000);
        }
    }

    /**
     * Clear all messages from the UI
     */
    clearMessages() {
        const messageContainer = document.getElementById('calculator-messages');
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }

    /**
     * Normalize trainer and monster names for better searching
     * This adds normalized_name property to each trainer and monster
     */
    normalizeTrainerAndMonsterNames() {
        console.log('Normalizing trainer and monster names for search...');

        // Normalize trainer names
        this.trainers.forEach(trainer => {
            if (trainer.name) {
                trainer.normalized_name = this.normalizeName(trainer.name);
            }
        });

        // Normalize monster names
        this.monsters.forEach(monster => {
            if (monster.name) {
                monster.normalized_name = this.normalizeName(monster.name);
            }
        });

        console.log('Name normalization complete');
    }

    /**
     * Normalize a name for better matching
     * @param {string} name - The name to normalize
     * @returns {string} The normalized name
     */
    normalizeName(name) {
        if (!name) return '';

        // Convert to lowercase
        let normalized = name.toLowerCase();

        // Remove special characters and extra spaces
        normalized = normalized.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

        return normalized;
    }

    /**
     * Find trainers matching the search term
     * @param {string} normalizedSearchTerm - The normalized search term
     * @returns {Array} Array of matching trainers
     */
    findMatchingTrainers(normalizedSearchTerm) {
        if (!normalizedSearchTerm || !this.trainers || this.trainers.length === 0) {
            return [];
        }

        // Try exact match first
        let matches = this.trainers.filter(trainer =>
            trainer.normalized_name === normalizedSearchTerm);

        // If no exact matches, try contains match
        if (matches.length === 0) {
            matches = this.trainers.filter(trainer => {
                if (!trainer.normalized_name) return false;

                // Check if trainer name contains search term or vice versa
                return trainer.normalized_name.includes(normalizedSearchTerm) ||
                       normalizedSearchTerm.includes(trainer.normalized_name);
            });
        }

        // If still no matches, try word-by-word matching
        if (matches.length === 0) {
            const searchWords = normalizedSearchTerm.split(' ').filter(word => word.length > 1);

            if (searchWords.length > 0) {
                matches = this.trainers.filter(trainer => {
                    if (!trainer.normalized_name) return false;

                    // Check if any word in the search term is in the trainer name
                    return searchWords.some(word => trainer.normalized_name.includes(word));
                });
            }
        }

        return matches;
    }

    /**
     * Find monsters matching the search term
     * @param {string} normalizedSearchTerm - The normalized search term
     * @returns {Array} Array of matching monsters
     */
    findMatchingMonsters(normalizedSearchTerm) {
        if (!normalizedSearchTerm || !this.monsters || this.monsters.length === 0) {
            return [];
        }

        // Try exact match first
        let matches = this.monsters.filter(monster =>
            monster.normalized_name === normalizedSearchTerm);

        // If no exact matches, try contains match
        if (matches.length === 0) {
            matches = this.monsters.filter(monster => {
                if (!monster.normalized_name) return false;

                // Check if monster name contains search term or vice versa
                return monster.normalized_name.includes(normalizedSearchTerm) ||
                       normalizedSearchTerm.includes(monster.normalized_name);
            });
        }

        // If still no matches, try word-by-word matching
        if (matches.length === 0) {
            const searchWords = normalizedSearchTerm.split(' ').filter(word => word.length > 1);

            if (searchWords.length > 0) {
                matches = this.monsters.filter(monster => {
                    if (!monster.normalized_name) return false;

                    // Check if any word in the search term is in the monster name
                    return searchWords.some(word => monster.normalized_name.includes(word));
                });
            }
        }

        return matches;
    }


    /**
     * Set up event listeners for the calculator UI
     */
    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Store reference to this for use in event handlers
        const self = this;

        // Background complexity selection
        const backgroundRadios = document.querySelectorAll('input[name="background"]');
        console.log(`Found ${backgroundRadios.length} background radio buttons`);

        backgroundRadios.forEach(radio => {
            // Use a named function for the event handler
            function backgroundChangeHandler() {
                console.log(`Background radio changed to: ${radio.value}`);
                self.updateBackgroundBonus();
            }

            // Add the event listener
            radio.onclick = backgroundChangeHandler;
        });

        // Background split selection
        const bgSplit = document.getElementById('bg-split');
        if (bgSplit) {
            console.log('Found bg-split checkbox');

            // Use a named function for the event handler
            function bgSplitChangeHandler() {
                console.log(`Background split changed to: ${bgSplit.checked}`);
                self.updateBackgroundBonus();
            }

            // Add the event listener
            bgSplit.onclick = bgSplitChangeHandler;
        }

        // Gift art selection
        const giftEnabled = document.getElementById('gift-enabled');
        if (giftEnabled) {
            console.log('Found gift-enabled checkbox');

            // Use a named function for the event handler
            function giftEnabledChangeHandler() {
                const isGiftEnabled = giftEnabled.checked;
                console.log(`Gift enabled changed to: ${isGiftEnabled}`);

                document.querySelectorAll('.gift-option').forEach(el => {
                    el.style.display = isGiftEnabled ? 'block' : 'none';
                });
            }

            // Add the event listener
            giftEnabled.onclick = giftEnabledChangeHandler;

            // Initialize visibility based on current state
            giftEnabledChangeHandler();
        }

        // Same rank selection
        const sameRank = document.getElementById('same-rank');
        if (sameRank) {
            console.log('Found same-rank checkbox');

            // Use a named function for the event handler
            function sameRankChangeHandler() {
                const isSameRank = sameRank.checked;
                console.log(`Same rank changed to: ${isSameRank}`);

                const container = document.getElementById('universal-default-container');
                if (container) container.style.display = isSameRank ? 'block' : 'none';

                document.querySelectorAll('.individual-rank-container').forEach(el => {
                    el.style.display = isSameRank ? 'none' : 'block';
                });
            }

            // Add the event listener
            sameRank.onclick = sameRankChangeHandler;

            // Initialize visibility based on current state
            sameRankChangeHandler();
        }

        // Universal default selection
        const universalDefault = document.getElementById('universal-default');
        if (universalDefault) {
            console.log('Found universal-default checkbox');

            // Use a named function for the event handler
            function universalDefaultChangeHandler() {
                const isUniversalDefault = universalDefault.checked;
                console.log(`Universal default changed to: ${isUniversalDefault}`);

                const container = document.getElementById('universal-default-rank-container');
                if (container) container.style.display = isUniversalDefault ? 'block' : 'none';
            }

            // Add the event listener
            universalDefault.onclick = universalDefaultChangeHandler;

            // Initialize visibility based on current state
            universalDefaultChangeHandler();
        }

        // Add group button
        const addGroupBtn = document.getElementById('add-group-btn');
        if (addGroupBtn) {
            console.log('Found add-group-btn');

            // Use a named function for the event handler
            function addGroupHandler() {
                console.log('Add group button clicked');
                self.addGroup();
            }

            // Add the event listener
            addGroupBtn.onclick = addGroupHandler;
        }

        // Calculate button
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            console.log('Found calculate-btn');

            // Use a named function for the event handler
            function calculateHandler() {
                console.log('Calculate button clicked');
                self.calculateResults();
            }

            // Add the event listener
            calculateBtn.onclick = calculateHandler;
        }

        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            console.log('Found reset-btn');

            // Use a named function for the event handler
            function resetHandler() {
                console.log('Reset button clicked');
                self.resetCalculator();
            }

            // Add the event listener
            resetBtn.onclick = resetHandler;
        }

        // Level assignment buttons
        const assignBackgroundBtn = document.getElementById('assign-background-btn');
        if (assignBackgroundBtn) {
            console.log('Found assign-background-btn');

            // Use a named function for the event handler
            function assignBackgroundHandler() {
                console.log('Assign background levels button clicked');
                self.assignLevels('background');
            }

            // Add the event listener
            assignBackgroundBtn.onclick = assignBackgroundHandler;
        }

        const assignBonusBtn = document.getElementById('assign-bonus-btn');
        if (assignBonusBtn) {
            console.log('Found assign-bonus-btn');

            // Use a named function for the event handler
            function assignBonusHandler() {
                console.log('Assign bonus levels button clicked');
                self.assignLevels('bonus');
            }

            // Add the event listener
            assignBonusBtn.onclick = assignBonusHandler;
        }

        const assignGiftBtn = document.getElementById('assign-gift-btn');
        if (assignGiftBtn) {
            console.log('Found assign-gift-btn');

            // Use a named function for the event handler
            function assignGiftHandler() {
                console.log('Assign gift levels button clicked');
                self.assignLevels('gift');
            }

            // Add the event listener
            assignGiftBtn.onclick = assignGiftHandler;
        }

        // Assign all levels buttons
        const assignAllBackgroundBtn = document.getElementById('assign-all-background-btn');
        if (assignAllBackgroundBtn) {
            console.log('Found assign-all-background-btn');

            // Use a named function for the event handler
            function assignAllBackgroundHandler() {
                console.log('Assign all background levels button clicked');
                self.assignAllLevels('background');
            }

            // Add the event listener
            assignAllBackgroundBtn.onclick = assignAllBackgroundHandler;
        }

        const assignAllBonusBtn = document.getElementById('assign-all-bonus-btn');
        if (assignAllBonusBtn) {
            console.log('Found assign-all-bonus-btn');

            // Use a named function for the event handler
            function assignAllBonusHandler() {
                console.log('Assign all bonus levels button clicked');
                self.assignAllLevels('bonus');
            }

            // Add the event listener
            assignAllBonusBtn.onclick = assignAllBonusHandler;
        }

        const assignAllGiftBtn = document.getElementById('assign-all-gift-btn');
        if (assignAllGiftBtn) {
            console.log('Found assign-all-gift-btn');

            // Use a named function for the event handler
            function assignAllGiftHandler() {
                console.log('Assign all gift levels button clicked');
                self.assignAllLevels('gift');
            }

            // Add the event listener
            assignAllGiftBtn.onclick = assignAllGiftHandler;
        }

        const assignAllLevelsBtn = document.getElementById('assign-all-levels-btn');
        if (assignAllLevelsBtn) {
            console.log('Found assign-all-levels-btn');

            // Use a named function for the event handler
            function assignAllLevelsHandler() {
                console.log('Assign all remaining levels button clicked');
                self.assignAllRemainingLevels();
            }

            // Add the event listener
            assignAllLevelsBtn.onclick = assignAllLevelsHandler;
        }

        // Level type selection for assignment
        const levelTypeSelect = document.getElementById('level-type-select');
        if (levelTypeSelect) {
            console.log('Found level-type-select');

            // Use a named function for the event handler
            function levelTypeSelectHandler() {
                console.log(`Level type selection changed to: ${levelTypeSelect.value}`);
                self.updateLevelAssignmentUI();
            }

            // Add the event listener
            levelTypeSelect.onchange = levelTypeSelectHandler;
        }

        // Duplicate monster modal
        const closeDuplicateModal = document.getElementById('close-duplicate-modal');
        if (closeDuplicateModal) {
            console.log('Found close-duplicate-modal button');

            // Use a named function for the event handler
            function closeDuplicateModalHandler() {
                console.log('Close duplicate modal button clicked');
                const duplicateModal = document.getElementById('duplicate-monster-modal');
                if (duplicateModal) duplicateModal.style.display = 'none';
            }

            // Add the event listener
            closeDuplicateModal.onclick = closeDuplicateModalHandler;
        }

        const cancelDuplicateSelection = document.getElementById('cancel-duplicate-selection');
        if (cancelDuplicateSelection) {
            console.log('Found cancel-duplicate-selection button');

            // Use a named function for the event handler
            function cancelDuplicateSelectionHandler() {
                console.log('Cancel duplicate selection button clicked');
                const duplicateModal = document.getElementById('duplicate-monster-modal');
                if (duplicateModal) duplicateModal.style.display = 'none';
            }

            // Add the event listener
            cancelDuplicateSelection.onclick = cancelDuplicateSelectionHandler;
        }

        // Apply levels modal
        const closeApplyModal = document.getElementById('close-apply-modal');
        if (closeApplyModal) {
            console.log('Found close-apply-modal button');

            // Use a named function for the event handler
            function closeApplyModalHandler() {
                console.log('Close apply modal button clicked');
                const applyModal = document.getElementById('apply-levels-modal');
                if (applyModal) applyModal.style.display = 'none';
            }

            // Add the event listener
            closeApplyModal.onclick = closeApplyModalHandler;
        }

        const cancelApplyLevels = document.getElementById('cancel-apply-levels');
        if (cancelApplyLevels) {
            console.log('Found cancel-apply-levels button');

            // Use a named function for the event handler
            function cancelApplyLevelsHandler() {
                console.log('Cancel apply levels button clicked');
                const applyModal = document.getElementById('apply-levels-modal');
                if (applyModal) applyModal.style.display = 'none';
            }

            // Add the event listener
            cancelApplyLevels.onclick = cancelApplyLevelsHandler;
        }

        const confirmApplyLevels = document.getElementById('confirm-apply-levels');
        if (confirmApplyLevels) {
            console.log('Found confirm-apply-levels button');

            // Use a named function for the event handler
            function confirmApplyLevelsHandler() {
                console.log('Confirm apply levels button clicked');
                self.confirmApplyLevels();
            }

            // Add the event listener
            confirmApplyLevels.onclick = confirmApplyLevelsHandler;
        }

        // Test search button
        const testSearchBtn = document.getElementById('test-search-btn');
        if (testSearchBtn) {
            console.log('Found test-search-btn');

            // Use a named function for the event handler
            function testSearchHandler() {
                console.log('Test search button clicked');
                self.testSearch();
            }

            // Add the event listener
            testSearchBtn.onclick = testSearchHandler;
        }

        // Use mock data button
        const useMockDataBtn = document.getElementById('use-mock-data-btn');
        if (useMockDataBtn) {
            console.log('Found use-mock-data-btn');

            // Use a named function for the event handler
            function useMockDataHandler() {
                console.log('Use mock data button clicked');
                self.clearMessages();
                self.useMockData();
                self.showWarningMessage('Using mock data for demonstration purposes. This will allow you to test the calculator functionality.');
            }

            // Add the event listener
            useMockDataBtn.onclick = useMockDataHandler;
        }

        // Reload data button
        const reloadDataBtn = document.getElementById('reload-data-btn');
        if (reloadDataBtn) {
            console.log('Found reload-data-btn');

            // Use a named function for the event handler
            function reloadDataHandler() {
                console.log('Reload data button clicked');
                self.clearMessages();
                self.showLoadingMessage('Reloading trainers and monsters from database...');

                // Reset the trainers and monsters arrays
                self.trainers = [];
                self.monsters = [];

                // Reload the data
                self.loadTrainersAndMonsters();
            }

            // Add the event listener
            reloadDataBtn.onclick = reloadDataHandler;
        }

        console.log('All event listeners set up successfully');
    }

    /**
     * Update the background bonus based on user selection
     */
    updateBackgroundBonus() {
        console.log('Updating background bonus...');

        try {
            // Get the selected background radio button
            const bgRadio = document.querySelector('input[name="background"]:checked');
            if (!bgRadio) {
                // If no radio button is selected, try to select the 'none' option
                const noneRadio = document.querySelector('input[name="background"][value="none"]');
                if (noneRadio) {
                    noneRadio.checked = true;
                    console.log('No background radio selected, defaulting to "none"');
                } else {
                    console.warn('No background radio buttons found');
                    return;
                }
            }

            // Get the selected value (after potentially setting a default)
            const selectedRadio = document.querySelector('input[name="background"]:checked');
            const bgChoice = selectedRadio.value;
            console.log(`Selected background: ${bgChoice}`);

            // Get the background split checkbox
            const bgSplitCheckbox = document.getElementById('bg-split');
            if (!bgSplitCheckbox) {
                console.warn('Could not find bg-split checkbox');
                return;
            }
            const bgSplit = bgSplitCheckbox.checked;
            console.log(`Background split: ${bgSplit}`);

            // Get the number of groups
            const numGroups = Object.keys(this.groups).length || 1;
            console.log(`Number of groups: ${numGroups}`);

            // Calculate background bonus based on selection
            switch (bgChoice) {
                case 'none':
                    this.backgroundBonus = 0;
                    break;
                case 'prop':
                    this.backgroundBonus = 1;
                    break;
                case 'simple':
                    this.backgroundBonus = 2;
                    break;
                case 'complex':
                    this.backgroundBonus = 3;
                    break;
                default:
                    console.warn(`Unknown background choice: ${bgChoice}`);
                    this.backgroundBonus = 0;
            }
            console.log(`Base background bonus: ${this.backgroundBonus}`);

            // Calculate total background bonus
            this.totalBackgroundBonus = bgSplit ? this.backgroundBonus * numGroups : this.backgroundBonus;
            console.log(`Total background bonus: ${this.totalBackgroundBonus}`);

            // Update the display
            const bonusDisplay = document.getElementById('background-bonus-display');
            if (bonusDisplay) {
                bonusDisplay.textContent = this.totalBackgroundBonus;
            } else {
                console.warn('Could not find background-bonus-display element');
            }
        } catch (error) {
            console.error('Error in updateBackgroundBonus:', error);
        }
    }

    /**
     * Add a new group to the calculator
     */
    addGroup() {
        const groupCount = Object.keys(this.groups).length + 1;
        const groupId = `group-${groupCount}`;
        const groupName = document.getElementById('group-name').value.trim() || `Group ${groupCount}`;

        this.groups[groupId] = {
            name: groupName,
            characters: []
        };

        // Create group UI
        const groupContainer = document.createElement('div');
        groupContainer.id = groupId;
        groupContainer.className = 'group-container';
        groupContainer.innerHTML = `
            <h3>${groupName}</h3>
            <div class="character-list" id="${groupId}-characters"></div>
            <div class="character-form">
                <input type="text" id="${groupId}-char-name" placeholder="Character name" class="form-control">
                <div class="individual-rank-container" style="${document.getElementById('same-rank').checked ? 'display:none;' : ''}">
                    <h4>Character Rank</h4>
                    <div class="form-group">
                        <label>Size:</label>
                        <select id="${groupId}-size" class="form-control">
                            <option value="fullbody">Fullbody</option>
                            <option value="halfbody">Halfbody</option>
                            <option value="bust">Bust</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Linework:</label>
                        <select id="${groupId}-linework" class="form-control">
                            <option value="clean">Clean</option>
                            <option value="sketch">Sketch</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Color:</label>
                        <select id="${groupId}-color" class="form-control">
                            <option value="no_color">No Color</option>
                            <option value="flat">Flat Color</option>
                            <option value="simple">Simple Shading</option>
                            <option value="complex">Complex Shading</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Complexity:</label>
                    <select id="${groupId}-complexity" class="form-control">
                        <option value="no_evolution">Doesn't Evolve</option>
                        <option value="base_stage">Base Stage</option>
                        <option value="middle">Middle Stage</option>
                        <option value="final">Final</option>
                        <option value="final_evo">Final Evo</option>
                        <option value="trainer">Trainer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Modifiers:</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" id="${groupId}-paradox"> Paradox</label>
                        <label><input type="checkbox" id="${groupId}-ultra-beast"> Ultra Beast</label>
                        <label><input type="checkbox" id="${groupId}-mega"> Mega</label>
                        <label><input type="checkbox" id="${groupId}-capped"> Capped (+100)</label>
                    </div>
                </div>
                <div class="form-group gift-option" style="display: none;">
                    <label><input type="checkbox" id="${groupId}-gift"> Gift Art</label>
                </div>
                <button type="button" class="btn btn-primary" id="${groupId}-add-char">Add Character</button>
            </div>
        `;

        document.getElementById('groups-container').appendChild(groupContainer);

        // Add event listener for adding a character
        document.getElementById(`${groupId}-add-char`).addEventListener('click', () => {
            this.addCharacter(groupId);
        });

        // Update background bonus if background is split
        this.updateBackgroundBonus();
    }

    /**
     * Add a character to a group
     * @param {string} groupId - The ID of the group to add the character to
     */
    addCharacter(groupId) {
        const charName = document.getElementById(`${groupId}-char-name`).value.trim();
        if (!charName) {
            alert('Please enter a character name');
            return;
        }

        let rankInfo = {};
        const isSameRank = document.getElementById('same-rank').checked;

        if (isSameRank) {
            const isUniversalDefault = document.getElementById('universal-default').checked;
            if (isUniversalDefault) {
                // Use universal default rank
                rankInfo = {
                    size: document.getElementById('universal-size').value,
                    linework: document.getElementById('universal-linework').value,
                    color: document.getElementById('universal-color').value
                };
            } else {
                // Use group default rank (not implemented in this simplified version)
                // For now, use universal default fields
                rankInfo = {
                    size: document.getElementById('universal-size').value,
                    linework: document.getElementById('universal-linework').value,
                    color: document.getElementById('universal-color').value
                };
            }
        } else {
            // Use individual character rank
            rankInfo = {
                size: document.getElementById(`${groupId}-size`).value,
                linework: document.getElementById(`${groupId}-linework`).value,
                color: document.getElementById(`${groupId}-color`).value
            };
        }

        // Calculate base points based on size and linework
        let basePoints = 0;
        if (rankInfo.size === 'fullbody') {
            basePoints = rankInfo.linework === 'clean' ? 3 : 2;
        } else if (rankInfo.size === 'halfbody') {
            basePoints = rankInfo.linework === 'clean' ? 2 : 1;
        } else if (rankInfo.size === 'bust') {
            basePoints = rankInfo.linework === 'clean' ? 1 : 0;
        }
        rankInfo.basePoints = basePoints;

        // Calculate color points
        let colorPoints = 0;
        let colorText = '';
        switch (rankInfo.color) {
            case 'no_color':
                colorPoints = 0;
                colorText = 'No Color';
                break;
            case 'flat':
                colorPoints = 1;
                colorText = 'Flat Color';
                break;
            case 'simple':
                colorPoints = 3;
                colorText = 'Simple Shading';
                break;
            case 'complex':
                colorPoints = 4;
                colorText = 'Complex Shading';
                break;
        }
        rankInfo.colorPoints = colorPoints;
        rankInfo.colorText = colorText;

        // Get complexity information
        const complexityType = document.getElementById(`${groupId}-complexity`).value;
        const paradox = document.getElementById(`${groupId}-paradox`).checked;
        const ultraBeast = document.getElementById(`${groupId}-ultra-beast`).checked;
        const mega = document.getElementById(`${groupId}-mega`).checked;
        const capped = document.getElementById(`${groupId}-capped`).checked;

        // Calculate complexity points
        let complexityPoints = 0;
        let complexityText = '';

        switch (complexityType) {
            case 'no_evolution':
                complexityText = "Doesn't Evolve";
                complexityPoints = 2;
                break;
            case 'base_stage':
                complexityText = "Base Stage";
                complexityPoints = 0;
                break;
            case 'middle':
                complexityText = "Middle Stage";
                complexityPoints = 1;
                break;
            case 'final':
                complexityText = "Final";
                complexityPoints = 2;
                break;
            case 'final_evo':
                complexityText = "Final Evo";
                complexityPoints = 3;
                break;
            case 'trainer':
                complexityText = "Trainer";
                complexityPoints = 3;
                break;
        }

        // Add modifiers
        const modifiers = [];
        let modifierBonus = 0;

        if (paradox) {
            modifiers.push("Paradox");
            modifierBonus += 2;
        }
        if (ultraBeast) {
            modifiers.push("Ultra Beast");
            modifierBonus += 2;
        }
        if (mega) {
            modifiers.push("Mega");
            modifierBonus += 2;
        }

        // If there are modifiers, they override the base complexity points
        if (modifiers.length > 0) {
            complexityPoints = modifierBonus;
            complexityText += ", " + modifiers.join(", ");
        }

        // Calculate total points
        const effectiveTotal = rankInfo.basePoints + rankInfo.colorPoints + complexityPoints;

        // Calculate trainer/gift bonus
        let trainerBonus = 0;
        let giftBonus = 0;
        const isGiftEnabled = document.getElementById('gift-enabled').checked;
        const isGift = isGiftEnabled && document.getElementById(`${groupId}-gift`)?.checked;
        const isTrainer = complexityType === 'trainer';

        if (isGift) {
            giftBonus = Math.floor((effectiveTotal + 1) / 2);
        } else if (isTrainer || capped) {
            trainerBonus = Math.floor((effectiveTotal + 1) / 2);
        }

        // Create character object
        const character = {
            name: charName,
            rankInfo: rankInfo,
            complexityText: complexityText,
            complexityPoints: complexityPoints,
            effectiveTotal: effectiveTotal,
            trainerBonus: trainerBonus,
            giftBonus: giftBonus,
            isTrainer: isTrainer,
            isGift: isGift,
            capped: capped
        };

        // Add character to group
        this.groups[groupId].characters.push(character);

        // Update UI
        this.updateCharacterList(groupId);

        // Clear character name input
        document.getElementById(`${groupId}-char-name`).value = '';

        // Update totals
        this.totalBonusLevels += trainerBonus;
        this.totalGiftLevels += giftBonus;
        this.updateTotals();
    }

    /**
     * Update the character list for a group
     * @param {string} groupId - The ID of the group to update
     */
    updateCharacterList(groupId) {
        const characterListEl = document.getElementById(`${groupId}-characters`);
        characterListEl.innerHTML = '';

        this.groups[groupId].characters.forEach((char, index) => {
            const charEl = document.createElement('div');
            charEl.className = 'character-item';

            // Format the breakdown text
            const sizeText = `${char.rankInfo.size.charAt(0).toUpperCase() + char.rankInfo.size.slice(1)} ${char.rankInfo.linework.charAt(0).toUpperCase() + char.rankInfo.linework.slice(1)}`;
            const breakdownText = `${sizeText} (${char.rankInfo.basePoints}) + ${char.rankInfo.colorText} (${char.rankInfo.colorPoints}) + ${char.complexityText} (${char.complexityPoints}) = ${char.effectiveTotal}`;

            charEl.innerHTML = `
                <div class="character-header">
                    <h4>${char.name}</h4>
                    <button type="button" class="btn btn-sm btn-danger remove-char" data-group="${groupId}" data-index="${index}">Remove</button>
                </div>
                <div class="character-details">
                    <p>${breakdownText}</p>
                    ${char.trainerBonus > 0 ? `<p>Bonus Levels: ${char.trainerBonus}</p>` : ''}
                    ${char.giftBonus > 0 ? `<p>Gift Levels: ${char.giftBonus}</p>` : ''}
                </div>
            `;

            characterListEl.appendChild(charEl);
        });

        // Add event listeners for remove buttons
        document.querySelectorAll(`.remove-char[data-group="${groupId}"]`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeCharacter(groupId, index);
            });
        });
    }

    /**
     * Remove a character from a group
     * @param {string} groupId - The ID of the group
     * @param {number} index - The index of the character to remove
     */
    removeCharacter(groupId, index) {
        const character = this.groups[groupId].characters[index];
        this.totalBonusLevels -= character.trainerBonus;
        this.totalGiftLevels -= character.giftBonus;

        this.groups[groupId].characters.splice(index, 1);
        this.updateCharacterList(groupId);
        this.updateTotals();
    }

    /**
     * Update the totals display
     */
    updateTotals() {
        document.getElementById('bonus-levels-display').textContent = this.totalBonusLevels;
        document.getElementById('gift-levels-display').textContent = this.totalGiftLevels;
    }

    /**
     * Update the level assignment UI based on selected level type
     */
    updateLevelAssignmentUI() {
        const levelTypeSelect = document.getElementById('level-type-select');
        const levelAmountInput = document.getElementById('level-amount');
        const remainingLevelsDisplay = document.getElementById('remaining-levels');

        if (!levelTypeSelect || !levelAmountInput || !remainingLevelsDisplay) return;

        const levelType = levelTypeSelect.value;
        let maxLevels = 0;
        let assignedLevels = 0;

        switch (levelType) {
            case 'background':
                maxLevels = this.totalBackgroundBonus;
                assignedLevels = this.assignedBackgroundLevels;
                break;
            case 'bonus':
                maxLevels = this.totalBonusLevels;
                assignedLevels = this.assignedBonusLevels;
                break;
            case 'gift':
                maxLevels = this.totalGiftLevels;
                assignedLevels = this.assignedGiftLevels;
                break;
        }

        const remainingLevels = maxLevels - assignedLevels;
        remainingLevelsDisplay.textContent = remainingLevels;

        // Update max attribute of level amount input
        levelAmountInput.max = remainingLevels;
        if (parseInt(levelAmountInput.value) > remainingLevels) {
            levelAmountInput.value = remainingLevels;
        }
    }

    /**
     * Auto-assign levels to game characters in the breakdown
     */
    autoAssignToGameCharacters() {
        // Get all characters from the groups
        const allCharacters = [];
        Object.values(this.groups).forEach(group => {
            group.characters.forEach(char => {
                // Include both the base levels and any bonus/gift levels
                const totalLevels = char.effectiveTotal;
                const bonusLevels = char.trainerBonus || 0;
                const giftLevels = char.giftBonus || 0;

                allCharacters.push({
                    name: char.name,
                    baseLevels: totalLevels,
                    bonusLevels: bonusLevels,
                    giftLevels: giftLevels
                });
            });
        });

        if (allCharacters.length === 0) {
            alert('No characters found in the breakdown');
            return;
        }

        // For each character, try to find a matching trainer or monster
        let assignedCount = 0;
        let notFoundCount = 0;
        let multipleMatchCount = 0;

        allCharacters.forEach(char => {
            console.log(`Auto-assign: Searching for character: "${char.name}"`);

            // Normalize the character name for better matching
            const normalizedCharName = this.normalizeName(char.name);
            console.log(`Auto-assign: Normalized character name: "${normalizedCharName}"`);

            // Use our improved matching functions
            const matchingTrainers = this.findMatchingTrainers(normalizedCharName);
            console.log(`Auto-assign: Found ${matchingTrainers.length} matching trainers:`,
                       matchingTrainers.map(t => ({ id: t.id, name: t.name })));

            // Then check if there's a monster with this name
            const matchingMonsters = this.findMatchingMonsters(normalizedCharName);
            console.log(`Auto-assign: Found ${matchingMonsters.length} matching monsters:`,
                       matchingMonsters.map(m => ({ id: m.id, name: m.name, trainer_id: m.trainer_id })));

            if (matchingTrainers.length === 1 && matchingMonsters.length === 0) {
                // One matching trainer, no matching monsters
                const trainer = matchingTrainers[0];

                // Assign base levels
                this.createAssignment('trainer', trainer.id, trainer.name, 'character', char.baseLevels);

                // Assign bonus levels if any
                if (char.bonusLevels > 0) {
                    this.createAssignment('trainer', trainer.id, trainer.name, 'bonus', char.bonusLevels);
                }

                // Assign gift levels if any
                if (char.giftLevels > 0) {
                    this.createAssignment('trainer', trainer.id, trainer.name, 'gift', char.giftLevels);
                }

                assignedCount++;
            } else if (matchingTrainers.length === 0 && matchingMonsters.length === 1) {
                // One matching monster, no matching trainers
                const monster = matchingMonsters[0];

                // Assign base levels
                this.createAssignment('monster', monster.id, monster.name, 'character', char.baseLevels);

                // Assign bonus levels if any
                if (char.bonusLevels > 0) {
                    this.createAssignment('monster', monster.id, monster.name, 'bonus', char.bonusLevels);
                }

                // Assign gift levels if any
                if (char.giftLevels > 0) {
                    this.createAssignment('monster', monster.id, monster.name, 'gift', char.giftLevels);
                }

                assignedCount++;
            } else if (matchingTrainers.length === 0 && matchingMonsters.length === 0) {
                // No matches found
                notFoundCount++;
            } else {
                // Multiple matches found
                multipleMatchCount++;
            }
        });

        // Show results
        let message = `Auto-assigned levels to ${assignedCount} characters.`;
        if (notFoundCount > 0) {
            message += `\n${notFoundCount} characters not found in the database.`;
        }
        if (multipleMatchCount > 0) {
            message += `\n${multipleMatchCount} characters had multiple matches (skipped).`;
        }

        alert(message);
    }

    /**
     * Assign all remaining levels (background, bonus, and gift)
     */
    assignAllRemainingLevels() {
        const targetNameInput = document.getElementById('target-name');

        if (!targetNameInput || !targetNameInput.value.trim()) {
            alert('Please enter a target name');
            return;
        }

        const targetName = targetNameInput.value.trim();

        // Check remaining levels for each type
        const remainingBackground = this.totalBackgroundBonus - this.assignedBackgroundLevels;
        const remainingBonus = this.totalBonusLevels - this.assignedBonusLevels;
        const remainingGift = this.totalGiftLevels - this.assignedGiftLevels;

        let totalAssigned = 0;

        // Assign background levels if available
        if (remainingBackground > 0) {
            document.getElementById('level-amount').value = remainingBackground;
            document.getElementById('level-type-select').value = 'background';
            this.updateLevelAssignmentUI();
            this.assignLevels('background');
            totalAssigned += remainingBackground;
        }

        // Assign bonus levels if available
        if (remainingBonus > 0) {
            document.getElementById('level-amount').value = remainingBonus;
            document.getElementById('level-type-select').value = 'bonus';
            this.updateLevelAssignmentUI();
            this.assignLevels('bonus');
            totalAssigned += remainingBonus;
        }

        // Assign gift levels if available
        if (remainingGift > 0) {
            document.getElementById('level-amount').value = remainingGift;
            document.getElementById('level-type-select').value = 'gift';
            this.updateLevelAssignmentUI();
            this.assignLevels('gift');
            totalAssigned += remainingGift;
        }

        if (totalAssigned > 0) {
            alert(`Assigned ${totalAssigned} total levels to ${targetName}`);
        } else {
            alert('No remaining levels to assign');
        }
    }

    /**
     * Assign levels to a trainer or monster
     * @param {string} levelType - The type of levels to assign (background, bonus, gift)
     */
    assignLevels(levelType) {
        const targetNameInput = document.getElementById('target-name');
        const levelAmountInput = document.getElementById('level-amount');

        if (!targetNameInput || !levelAmountInput) return;

        const targetName = targetNameInput.value.trim();
        const levelAmount = parseInt(levelAmountInput.value);

        if (!targetName || isNaN(levelAmount) || levelAmount <= 0) {
            alert('Please enter a valid target name and level amount');
            return;
        }

        // Determine max available levels
        let maxLevels = 0;
        let assignedLevels = 0;

        switch (levelType) {
            case 'background':
                maxLevels = this.totalBackgroundBonus;
                assignedLevels = this.assignedBackgroundLevels;
                break;
            case 'bonus':
                maxLevels = this.totalBonusLevels;
                assignedLevels = this.assignedBonusLevels;
                break;
            case 'gift':
                maxLevels = this.totalGiftLevels;
                assignedLevels = this.assignedGiftLevels;
                break;
        }

        const remainingLevels = maxLevels - assignedLevels;

        if (levelAmount > remainingLevels) {
            alert(`You can only assign up to ${remainingLevels} ${levelType} levels`);
            return;
        }

        console.log(`Searching for target: "${targetName}"`);
        console.log(`Available data: ${this.trainers.length} trainers, ${this.monsters.length} monsters`);

        // Normalize the search term
        const normalizedSearchTerm = this.normalizeName(targetName);
        console.log(`Normalized search term: "${normalizedSearchTerm}"`);

        if (!normalizedSearchTerm) {
            alert('Please enter a valid name to search for');
            return;
        }

        // First check if there's a trainer with this name (more flexible matching)
        const matchingTrainers = this.findMatchingTrainers(normalizedSearchTerm);
        console.log(`Found ${matchingTrainers.length} matching trainers:`,
                   matchingTrainers.map(t => ({ id: t.id, name: t.name })));

        // Then check if there's a monster with this name (more flexible matching)
        const matchingMonsters = this.findMatchingMonsters(normalizedSearchTerm);
        console.log(`Found ${matchingMonsters.length} matching monsters:`,
                   matchingMonsters.map(m => ({ id: m.id, name: m.name, trainer_id: m.trainer_id })));

        if (matchingTrainers.length === 1 && matchingMonsters.length === 0) {
            // One matching trainer, no matching monsters
            const trainer = matchingTrainers[0];
            this.createAssignment('trainer', trainer.id, trainer.name, levelType, levelAmount);
        } else if (matchingTrainers.length === 0 && matchingMonsters.length === 1) {
            // One matching monster, no matching trainers
            const monster = matchingMonsters[0];
            this.createAssignment('monster', monster.id, monster.name, levelType, levelAmount);
        } else if (matchingTrainers.length === 0 && matchingMonsters.length === 0) {
            // No matches found
            alert(`No trainer or monster found with the name "${targetName}". Please check the spelling.`);
            return;
        } else if (matchingMonsters.length > 1) {
            // Multiple monsters with the same name, show selection modal
            this.showDuplicateMonsterModal(matchingMonsters, levelType, levelAmount);
            return;
        } else {
            // Both trainer and monster matches found
            alert(`Found both a trainer and monsters with the name "${targetName}". Please be more specific.`);
            return;
        }

        // Clear input
        levelAmountInput.value = '';
    }

    /**
     * Create a level assignment
     * @param {string} targetType - The type of target (trainer or monster)
     * @param {number} targetId - The ID of the target
     * @param {string} targetName - The name of the target
     * @param {string} levelType - The type of levels to assign
     * @param {number} levelAmount - The amount of levels to assign
     */
    createAssignment(targetType, targetId, targetName, levelType, levelAmount) {
        // Create assignment object
        const assignment = {
            id: Date.now(), // Unique ID for the assignment
            targetType,
            targetId,
            targetName,
            levelType,
            levelAmount
        };

        // Add to assignments and update assigned levels
        this.levelAssignments.push(assignment);

        switch (levelType) {
            case 'background':
                this.assignedBackgroundLevels += levelAmount;
                break;
            case 'bonus':
                this.assignedBonusLevels += levelAmount;
                break;
            case 'gift':
                this.assignedGiftLevels += levelAmount;
                break;
            case 'character':
                // Character levels are directly from the breakdown, not from the bonus pools
                break;
        }

        // Update UI
        this.updateLevelAssignmentUI();
        this.updateAssignmentsList();
    }

    /**
     * Show the duplicate monster selection modal
     * @param {Array} monsters - Array of matching monsters
     * @param {string} levelType - The type of levels to assign
     * @param {number} levelAmount - The amount of levels to assign
     */
    showDuplicateMonsterModal(monsters, levelType, levelAmount) {
        const modal = document.getElementById('duplicate-monster-modal');
        const listContainer = document.getElementById('duplicate-monsters-list');

        // Clear previous content
        listContainer.innerHTML = '';

        // Create a list of monsters with their trainer names
        monsters.forEach(monster => {
            const monsterItem = document.createElement('div');
            monsterItem.className = 'duplicate-monster-item';
            monsterItem.innerHTML = `
                <div class="monster-info">
                    <h4>${monster.name}</h4>
                    <p>Trainer: ${monster.trainer_name || 'Unknown'}</p>
                    <p>Level: ${monster.level || 0}</p>
                </div>
                <button class="btn btn-primary select-monster" data-id="${monster.id}">Select</button>
            `;
            listContainer.appendChild(monsterItem);
        });

        // Add event listeners to select buttons
        document.querySelectorAll('.select-monster').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const monsterId = parseInt(e.target.dataset.id);
                const monster = monsters.find(m => m.id === monsterId);

                if (monster) {
                    this.createAssignment('monster', monster.id, monster.name, levelType, levelAmount);
                    modal.style.display = 'none';

                    // Clear input
                    document.getElementById('level-amount').value = '';
                }
            });
        });

        // Show the modal
        modal.style.display = 'block';
    }

    /**
     * Assign all remaining levels of a specific type
     * @param {string} levelType - The type of levels to assign (background, bonus, gift)
     */
    assignAllLevels(levelType) {
        const targetNameInput = document.getElementById('target-name');

        if (!targetNameInput || !targetNameInput.value.trim()) {
            alert('Please enter a target name');
            return;
        }

        // Determine remaining levels
        let remainingLevels = 0;

        switch (levelType) {
            case 'background':
                remainingLevels = this.totalBackgroundBonus - this.assignedBackgroundLevels;
                break;
            case 'bonus':
                remainingLevels = this.totalBonusLevels - this.assignedBonusLevels;
                break;
            case 'gift':
                remainingLevels = this.totalGiftLevels - this.assignedGiftLevels;
                break;
        }

        if (remainingLevels <= 0) {
            alert(`No ${levelType} levels remaining to assign`);
            return;
        }

        // Set the level amount input to the remaining levels
        const levelAmountInput = document.getElementById('level-amount');
        if (levelAmountInput) {
            levelAmountInput.value = remainingLevels;
        }

        // Call assignLevels with the updated level amount
        this.assignLevels(levelType);
    }

    /**
     * Update the assignments list in the UI
     */
    updateAssignmentsList() {
        const assignmentsContainer = document.getElementById('assignments-list');
        if (!assignmentsContainer) return;

        assignmentsContainer.innerHTML = '';

        if (this.levelAssignments.length === 0) {
            assignmentsContainer.innerHTML = '<p>No assignments yet</p>';
            return;
        }

        // Group assignments by level type
        const groupedAssignments = {
            background: [],
            bonus: [],
            gift: [],
            character: []
        };

        this.levelAssignments.forEach(assignment => {
            groupedAssignments[assignment.levelType].push(assignment);
        });

        // Create sections for each level type
        for (const [type, assignments] of Object.entries(groupedAssignments)) {
            if (assignments.length === 0) continue;

            const typeSection = document.createElement('div');
            typeSection.className = 'assignment-section';

            const typeTitle = document.createElement('h4');
            typeTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Level Assignments`;
            typeSection.appendChild(typeTitle);

            const assignmentsList = document.createElement('ul');
            assignmentsList.className = 'assignments-list';

            assignments.forEach(assignment => {
                const listItem = document.createElement('li');
                listItem.className = 'assignment-item';
                listItem.innerHTML = `
                    <span>${assignment.targetName} (${assignment.targetType}): ${assignment.levelAmount} levels</span>
                    <button class="btn btn-sm btn-danger remove-assignment" data-id="${assignment.id}">Remove</button>
                `;
                assignmentsList.appendChild(listItem);
            });

            typeSection.appendChild(assignmentsList);
            assignmentsContainer.appendChild(typeSection);
        }

        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-assignment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignmentId = parseInt(e.target.dataset.id);
                this.removeAssignment(assignmentId);
            });
        });
    }

    /**
     * Remove a level assignment
     * @param {number} assignmentId - The ID of the assignment to remove
     */
    removeAssignment(assignmentId) {
        const assignmentIndex = this.levelAssignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex === -1) return;

        const assignment = this.levelAssignments[assignmentIndex];

        // Update assigned levels
        switch (assignment.levelType) {
            case 'background':
                this.assignedBackgroundLevels -= assignment.levelAmount;
                break;
            case 'bonus':
                this.assignedBonusLevels -= assignment.levelAmount;
                break;
            case 'gift':
                this.assignedGiftLevels -= assignment.levelAmount;
                break;
        }

        // Remove assignment
        this.levelAssignments.splice(assignmentIndex, 1);

        // Update UI
        this.updateLevelAssignmentUI();
        this.updateAssignmentsList();
    }

    /**
     * Calculate and display the results
     */
    calculateResults() {
        // Get the results container
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) return;

        // Clear previous results
        resultsContainer.innerHTML = '';

        // Create results header
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'results-header';
        resultsHeader.innerHTML = `
            <h2>Final Level Breakdowns by Group</h2>
            <p class="info-note">All characters in your artwork should receive the levels shown below. Use the auto-assign button to automatically assign these levels.</p>
        `;
        resultsContainer.appendChild(resultsHeader);

        // Create results for each group
        Object.keys(this.groups).forEach(groupId => {
            const group = this.groups[groupId];
            if (group.characters.length === 0) return;

            const groupResults = document.createElement('div');
            groupResults.className = 'group-results';
            groupResults.innerHTML = `<h3>${group.name}</h3>`;

            group.characters.forEach(char => {
                const charResult = document.createElement('div');
                charResult.className = 'character-result';

                // Format the breakdown text
                const sizeText = `${char.rankInfo.size.charAt(0).toUpperCase() + char.rankInfo.size.slice(1)} ${char.rankInfo.linework.charAt(0).toUpperCase() + char.rankInfo.linework.slice(1)}`;
                const breakdownText = `${sizeText} (${char.rankInfo.basePoints}) + ${char.rankInfo.colorText} (${char.rankInfo.colorPoints}) + ${char.complexityText} (${char.complexityPoints}) = ${char.effectiveTotal}`;

                charResult.innerHTML = `
                    <h4>${char.name}</h4>
                    <p>${breakdownText}</p>
                    ${char.trainerBonus > 0 ? `<p>Bonus Levels: ${char.trainerBonus}</p>` : ''}
                    ${char.giftBonus > 0 ? `<p>Gift Levels: ${char.giftBonus}</p>` : ''}
                `;

                groupResults.appendChild(charResult);
            });

            resultsContainer.appendChild(groupResults);
        });

        // Create summary
        const summary = document.createElement('div');
        summary.className = 'results-summary';
        summary.innerHTML = `
            <h3>Summary</h3>
            <p>Global Background Bonus Levels: ${this.totalBackgroundBonus}</p>
            <p>Total Bonus Levels (across image): ${this.totalBonusLevels}</p>
            <p>Total Gift Levels (across image): ${this.totalGiftLevels}</p>
            <p>Total Coins: ${this.calculateTotalCoins()}</p>
        `;
        resultsContainer.appendChild(summary);

        // Add auto-assign button
        const autoAssignButton = document.createElement('div');
        autoAssignButton.className = 'apply-levels-container';
        autoAssignButton.innerHTML = `
            <button type="button" id="auto-assign-characters" class="btn btn-secondary">Auto-Assign All Levels to Characters in Artwork</button>
            <p class="form-note">This will automatically assign base levels and any bonus/gift levels to all characters in your artwork.</p>
        `;
        resultsContainer.appendChild(autoAssignButton);

        // Add apply levels button
        const applyButton = document.createElement('div');
        applyButton.className = 'apply-levels-container';
        applyButton.innerHTML = `
            <button type="button" id="show-apply-levels-modal" class="btn btn-primary">Apply Levels to Trainers/Monsters</button>
        `;
        resultsContainer.appendChild(applyButton);

        // Add event listeners
        document.getElementById('auto-assign-characters')?.addEventListener('click', () => this.autoAssignToGameCharacters());
        document.getElementById('show-apply-levels-modal')?.addEventListener('click', () => this.showApplyLevelsModal());

        // Show results section and level assignment section
        document.getElementById('results-section').style.display = 'block';
        document.getElementById('level-assignment-section').style.display = 'block';

        // Update level assignment UI
        this.updateLevelAssignmentUI();
    }

    /**
     * Calculate the total coins earned
     * @returns {number} Total coins earned
     */
    calculateTotalCoins() {
        let totalLevels = 0;

        // Sum up levels from all characters
        Object.values(this.groups).forEach(group => {
            group.characters.forEach(char => {
                totalLevels += char.effectiveTotal;
            });
        });

        // Coins = Levels * 50
        return totalLevels * 50;
    }

    /**
     * Test the search functionality with the current target name
     * This helps diagnose issues with finding trainers and monsters
     */
    testSearch() {
        const targetNameInput = document.getElementById('target-name');
        if (!targetNameInput) return;

        const targetName = targetNameInput.value.trim();
        if (!targetName) {
            alert('Please enter a name to search for');
            return;
        }

        console.log(`Test search for: "${targetName}"`);
        console.log(`Available data: ${this.trainers.length} trainers, ${this.monsters.length} monsters`);

        // Normalize the search term
        const normalizedSearchTerm = this.normalizeName(targetName);
        console.log(`Normalized search term: "${normalizedSearchTerm}"`);

        // Find matching trainers and monsters
        const matchingTrainers = this.findMatchingTrainers(normalizedSearchTerm);
        const matchingMonsters = this.findMatchingMonsters(normalizedSearchTerm);

        // Build a detailed report
        let report = `Search Results for "${targetName}":\n\n`;

        report += `Trainers (${matchingTrainers.length} found):\n`;
        if (matchingTrainers.length > 0) {
            matchingTrainers.forEach(trainer => {
                report += `- ID: ${trainer.id}, Name: "${trainer.name}", Normalized: "${trainer.normalized_name}"\n`;
            });
        } else {
            report += "No matching trainers found\n";
        }

        report += `\nMonsters (${matchingMonsters.length} found):\n`;
        if (matchingMonsters.length > 0) {
            matchingMonsters.forEach(monster => {
                report += `- ID: ${monster.id}, Name: "${monster.name}", Normalized: "${monster.normalized_name}"\n`;
                report += `  Trainer ID: ${monster.trainer_id}, Trainer Name: "${monster.trainer_name || 'Unknown'}"\n`;
            });
        } else {
            report += "No matching monsters found\n";
        }

        // Show the report
        alert(report);
    }
}

// Function to initialize the calculator
function initializeCalculator() {
    console.log('Creating and initializing ArtSubmissionCalculator instance');
    try {
        const calculator = new ArtSubmissionCalculator();
        calculator.init();
        console.log('ArtSubmissionCalculator initialized successfully');

        // Debug: Check if add-group-btn exists and has click handler
        const addGroupBtn = document.getElementById('add-group-btn');
        if (addGroupBtn) {
            console.log('add-group-btn found in DOM');
            console.log('add-group-btn onclick handler:', addGroupBtn.onclick ? 'Exists' : 'Missing');
        } else {
            console.error('add-group-btn not found in DOM');
        }
    } catch (error) {
        console.error('Error initializing ArtSubmissionCalculator:', error);
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeCalculator);

// Also initialize on window load as a fallback
window.addEventListener('load', function() {
    console.log('Window load event fired, ensuring calculator is initialized');
    initializeCalculator();
});

// Initialize immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('DOM already loaded, initializing calculator immediately');
    initializeCalculator();
}
