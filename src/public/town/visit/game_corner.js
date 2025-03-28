document.addEventListener('DOMContentLoaded', function() {
  console.log('Game Corner JS loaded');
  // Timer elements
  const elements = {
    focus: {
      input: document.getElementById('focus-duration'),
      increase: document.getElementById('increase-focus'),
      decrease: document.getElementById('decrease-focus')
    },
    break: {
      input: document.getElementById('break-duration'),
      increase: document.getElementById('increase-break'),
      decrease: document.getElementById('decrease-break')
    },
    sessions: {
      input: document.getElementById('num-sessions'),
      increase: document.getElementById('increase-sessions'),
      decrease: document.getElementById('decrease-sessions')
    },
    timer: {
      display: document.getElementById('timer-display'),
      status: document.getElementById('timer-status'),
      sessionInfo: document.getElementById('session-info'),
      start: document.getElementById('start-timer'),
      pause: document.getElementById('pause-timer'),
      reset: document.getElementById('reset-timer')
    },
    video: {
      player: document.getElementById('pomodoro-video'),
      source: document.getElementById('video-source'),
      selector: document.getElementById('video-selector'),
      muteToggle: document.getElementById('mute-toggle'),
      volumeIcon: document.getElementById('volume-icon')
    }
  };

  // Timer state
  const state = {
    timer: null,
    minutes: 25,
    seconds: 0,
    isRunning: false,
    isPaused: false,
    currentSession: 0,
    isFocusTime: true,
    completedSessions: 0,
    totalFocusMinutes: 0,
    rewardsShown: false // Track if rewards have been shown
  };

  // Initialize controls
  function initializeControls() {
    // Focus duration controls
    elements.focus.increase.addEventListener('click', () => {
      const max = parseInt(elements.focus.input.max);
      const current = parseInt(elements.focus.input.value);
      const step = parseInt(elements.focus.input.step);
      if (current < max) {
        elements.focus.input.value = current + step;
        updateTimerDisplay();
      }
    });

    elements.focus.decrease.addEventListener('click', () => {
      const min = parseInt(elements.focus.input.min);
      const current = parseInt(elements.focus.input.value);
      const step = parseInt(elements.focus.input.step);
      if (current > min) {
        elements.focus.input.value = current - step;
        updateTimerDisplay();
      }
    });

    // Break duration controls
    elements.break.increase.addEventListener('click', () => {
      const max = parseInt(elements.break.input.max);
      const current = parseInt(elements.break.input.value);
      const step = parseInt(elements.break.input.step);
      if (current < max) {
        elements.break.input.value = current + step;
      }
    });

    elements.break.decrease.addEventListener('click', () => {
      const min = parseInt(elements.break.input.min);
      const current = parseInt(elements.break.input.value);
      const step = parseInt(elements.break.input.step);
      if (current > min) {
        elements.break.input.value = current - step;
      }
    });

    // Session count controls
    elements.sessions.increase.addEventListener('click', () => {
      const max = parseInt(elements.sessions.input.max);
      const current = parseInt(elements.sessions.input.value);
      const step = parseInt(elements.sessions.input.step);
      if (current < max) {
        elements.sessions.input.value = current + step;
        updateSessionInfo();
      }
    });

    elements.sessions.decrease.addEventListener('click', () => {
      const min = parseInt(elements.sessions.input.min);
      const current = parseInt(elements.sessions.input.value);
      const step = parseInt(elements.sessions.input.step);
      if (current > min) {
        elements.sessions.input.value = current - step;
        updateSessionInfo();
      }
    });

    // Timer controls
    elements.timer.start.addEventListener('click', startTimer);
    elements.timer.pause.addEventListener('click', pauseTimer);
    elements.timer.reset.addEventListener('click', resetTimer);

    // Video controls
    elements.video.selector.addEventListener('change', function() {
      elements.video.source.src = this.value;
      elements.video.player.load();
      elements.video.player.play();
    });

    elements.video.muteToggle.addEventListener('click', function() {
      elements.video.player.muted = !elements.video.player.muted;
      elements.video.volumeIcon.className = elements.video.player.muted ?
        'fas fa-volume-mute' : 'fas fa-volume-up';
    });
  }

  function updateTimerDisplay() {
    state.minutes = parseInt(elements.focus.input.value);
    state.seconds = 0;
    elements.timer.display.textContent =
      `${state.minutes.toString().padStart(2, '0')}:${state.seconds.toString().padStart(2, '0')}`;

    // Initialize progress circle
    updateTimerWithProgress();
  }

  function startTimer() {
    if (!state.isRunning) {
      if (!state.isPaused) {
        state.minutes = parseInt(elements.focus.input.value);
        state.seconds = 0;
        state.currentSession = 1;
        state.isFocusTime = true;
        updateTimerDisplay();
        updateSessionInfo();
      }

      state.isRunning = true;
      state.isPaused = false;
      updateButtonStates(true);
      elements.timer.status.textContent = 'Timer running';
      state.timer = setInterval(updateTimer, 1000);
    }
  }

  function pauseTimer() {
    if (state.isRunning) {
      clearInterval(state.timer);
      state.isRunning = false;
      state.isPaused = true;
      updateButtonStates(false);
      elements.timer.status.textContent = 'Timer paused';
    }
  }

  function resetTimer() {
    console.log('Resetting timer...');
    clearInterval(state.timer);
    state.isRunning = false;
    state.isPaused = false;
    state.currentSession = 0;
    state.isFocusTime = true;

    // Don't reset completed sessions or focus minutes
    // These should persist until the page is refreshed

    updateButtonStates(false);
    elements.timer.status.textContent = 'Ready to start';
    updateTimerDisplay();
    updateSessionInfo();

    // Reset progress circle
    const progressCircle = document.getElementById('progress-circle');
    if (progressCircle) {
      progressCircle.style.strokeDashoffset = progressCircle.style.strokeDasharray;
      progressCircle.style.stroke = '#8B5CF6';
    }
  }

  function updateButtonStates(isRunning) {
    elements.timer.start.disabled = isRunning;
    elements.timer.start.classList.toggle('opacity-50', isRunning);
    elements.timer.pause.disabled = !isRunning;
    elements.timer.pause.classList.toggle('opacity-50', !isRunning);
    elements.timer.reset.disabled = !isRunning && !state.isPaused;
    elements.timer.reset.classList.toggle('opacity-50', !isRunning && !state.isPaused);
  }

  function updateSessionInfo() {
    // If timer is not running, show 0/total sessions
    if (state.currentSession === 0) {
      elements.timer.sessionInfo.textContent = `Session 0/${elements.sessions.input.value}`;
      elements.timer.status.textContent = 'Ready to start';
    } else {
      elements.timer.sessionInfo.textContent = `Session ${state.currentSession}/${elements.sessions.input.value}`;
      elements.timer.status.textContent = state.isFocusTime ? 'Focus Time' : 'Break Time';
    }
  }

  // Initialize everything
  updateTimerDisplay();
  updateSessionInfo();
  initializeControls();

  // Work assessment modal
  const workAssessmentModal = document.getElementById('work-assessment-modal');
  const workAssessmentBtns = document.querySelectorAll('.work-assessment-btn');

  // Reward elements
  const rewardsContainer = document.getElementById('rewards-container');
  const closeRewardsBtn = document.getElementById('close-rewards-btn');
  const completedSessionsEl = document.getElementById('completed-sessions');
  const focusMinutesEl = document.getElementById('focus-minutes');
  const productivityScoreEl = document.getElementById('productivity-score');
  const rewardsList = document.getElementById('rewards-list');
  const trainersContainer = document.getElementById('trainers-container');
  const monsterEncounterContainer = document.getElementById('monster-encounter-container');
  const monsterEncountersList = document.getElementById('monster-encounters-list');

    // Close rewards modal when clicking the close button
    if (closeRewardsBtn) {
      closeRewardsBtn.addEventListener('click', function() {
        const modalContent = rewardsContainer.querySelector('.bg-gray-900\/95');
        if (modalContent) {
          modalContent.classList.remove('scale-100');
          modalContent.classList.add('scale-95');
        }

        // Immediately start fading out
        rewardsContainer.style.opacity = '0';

        // After animation completes, hide the modal
        setTimeout(() => {
          rewardsContainer.classList.add('hidden');
          rewardsContainer.style.display = 'none';

          // Reset any dynamic heights
          const scrollableAreas = rewardsContainer.querySelectorAll('.overflow-y-auto');
          scrollableAreas.forEach(area => {
            if (area.style.maxHeight && !area.getAttribute('style').includes('calc')) {
              area.style.maxHeight = '';
            }
          });
        }, 300);
      });
    }
    const claimRewardsBtn = document.getElementById('claim-rewards-btn');

    // Store trainers and rewards data
    let trainersData = [];
    let selectedTrainers = {};
    let monsterEncounters = [];

    // Productivity tracking
    let sessionProductivity = [];
    let productivityScore = 0;

    // Work assessment buttons
    workAssessmentBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const productivityValue = this.dataset.value;
        let productivityPercent = 0;

        switch(productivityValue) {
          case 'none': productivityPercent = 0; break;
          case 'some': productivityPercent = 25; break;
          case 'most': productivityPercent = 75; break;
          case 'all': productivityPercent = 100; break;
        }

        // Record this session's productivity
        sessionProductivity.push(productivityPercent);

        // Hide modal with animation
        workAssessmentModal.style.opacity = '0';
        const modalContent = workAssessmentModal.querySelector('.bg-gray-800');
        if (modalContent) {
          modalContent.classList.remove('scale-100');
          modalContent.classList.add('scale-95');
        }

        setTimeout(() => {
          workAssessmentModal.classList.add('hidden');
          workAssessmentModal.style.display = 'none';
        }, 300);

        // Continue with timer flow
        continueAfterAssessment();
      });
    });

    function updateTimer() {
      if (state.seconds === 0) {
        if (state.minutes === 0) {
          // Timer completed
          clearInterval(state.timer);

          if (state.isFocusTime) {
            // Completed a focus session
            state.completedSessions++;
            state.totalFocusMinutes += parseInt(elements.focus.input.value);

            // Show work assessment modal
            workAssessmentModal.classList.remove('hidden');
            workAssessmentModal.style.display = 'flex';
            // Force a reflow to ensure the transition works
            void workAssessmentModal.offsetWidth;
            setTimeout(() => {
              workAssessmentModal.style.opacity = '1';
            }, 10);

            // Don't continue automatically - wait for user input
            return;
          } else {
            // Completed a break - no assessment needed
            state.currentSession++;
            state.isFocusTime = true;
            state.minutes = parseInt(elements.focus.input.value);
            state.seconds = 0;
            elements.timer.status.textContent = 'Focus time!';

            updateSessionInfo();
            updateTimerDisplay();
            startTimer(); // Auto-start the next session
            return;
          }
        }
        state.minutes--;
        state.seconds = 59;
      } else {
        state.seconds--;
      }

      elements.timer.display.textContent = `${state.minutes.toString().padStart(2, '0')}:${state.seconds.toString().padStart(2, '0')}`;

      // Update the progress circle
      updateTimerWithProgress();
    }

    function continueAfterAssessment() {
      console.log('Continue after assessment - Current session:', state.currentSession, 'Total sessions:', parseInt(elements.sessions.input.value));

      // Check if all sessions are completed
      if (state.currentSession >= parseInt(elements.sessions.input.value)) {
        console.log('All sessions completed! Showing rewards...');
        elements.timer.status.textContent = 'All sessions completed!';

        // Only show rewards once
        if (!state.rewardsShown) {
          state.rewardsShown = true;

          // Force show rewards with a slight delay to ensure UI updates
          setTimeout(() => {
            showRewards();
          }, 500);
        }

        resetTimer();
        return;
      }

      // Switch to break time
      state.isFocusTime = false;
      state.minutes = parseInt(elements.break.input.value);
      state.seconds = 0;
      elements.timer.status.textContent = 'Break time!';
      console.log('Starting break time...');

      updateSessionInfo();
      updateTimerDisplay();
      startTimer(); // Auto-start the next session
    }

    function updateRewards() {
      // Calculate average productivity
      const totalProductivity = sessionProductivity.reduce((sum, value) => sum + value, 0);
      productivityScore = Math.round(totalProductivity / sessionProductivity.length);

      // Update reward display
      completedSessionsEl.textContent = state.completedSessions;
      focusMinutesEl.textContent = state.totalFocusMinutes;
      productivityScoreEl.textContent = `${productivityScore}%`;
    }

    function showRewards() {
      console.log('Showing rewards...');

      // Only show rewards if there are completed sessions
      if (state.completedSessions <= 0) {
        console.log('No completed sessions, not showing rewards');
        return;
      }

      // Update reward summary
      updateRewards();

      // Show rewards container as modal
      rewardsContainer.classList.remove('hidden');
      rewardsContainer.style.display = 'flex';
      // Force a reflow to ensure the transition works
      void rewardsContainer.offsetWidth;

      // Add animation effect
      setTimeout(() => {
        rewardsContainer.style.opacity = '1';
        const modalContent = rewardsContainer.querySelector('.bg-gray-900\/95');
        if (modalContent) {
          modalContent.classList.add('scale-100');
          modalContent.classList.remove('scale-95');
        }

        // Ensure scrollable areas have proper height
        const scrollableAreas = rewardsContainer.querySelectorAll('.overflow-y-auto');
        scrollableAreas.forEach(area => {
          area.style.maxHeight = area.style.maxHeight || area.getAttribute('style')?.includes('max-height') ? area.style.maxHeight : area.classList.contains('flex-grow') ? 'calc(85vh - 120px)' : '150px';
        });

        // Initialize the rewards UI
        initializeRewardsUI();
      }, 10);

      // Fetch trainers data
      fetchTrainers();

      // Generate rewards based on sessions and productivity
      console.log('Generating rewards...');
      const combinedMultiplier = generateRewards(); // Generate rewards immediately

      // Generate monster encounters with a delay for dramatic effect
      setTimeout(() => {
        console.log('Generating monster encounters...');
        generateMonsterEncounters(combinedMultiplier);
      }, 1500);

      // Log reward data for debugging
      console.log('Reward data:', {
        completedSessions: state.completedSessions,
        focusMinutes: state.totalFocusMinutes,
        productivity: productivityScore
      });
    }

    // Fetch trainers data from the server
    function fetchTrainers() {
      // Clear previous data
      trainersData = [];
      selectedTrainers = {};

      // Get trainers from the server-rendered data
      if (typeof trainers !== 'undefined' && trainers.length > 0) {
        // Use server-provided trainers
        trainersData = trainers.map(function(trainer) {
          return {
            id: trainer.id,
            name: trainer.name,
            level: trainer.level || 1,
            image: trainer.image || '/images/default_trainer.png'
          };
        });
      }

      // If no trainers were found, show a message
      if (trainersData.length === 0) {
        trainersContainer.innerHTML = `
          <div class="text-center text-amber-400 py-4 col-span-full">
            <i class="fas fa-exclamation-circle text-xl mb-2"></i>
            <p>No trainers available. Please create a trainer first.</p>
          </div>
        `;
        return;
      }

      // Render trainers
      renderTrainers();
    }

    // Render trainers in the UI
    function renderTrainers() {
      trainersContainer.innerHTML = '';

      // Limit to showing max 4 trainers to keep it compact
      const maxTrainersToShow = 4;
      const trainersToShow = trainersData.slice(0, maxTrainersToShow);
      const remainingCount = trainersData.length - maxTrainersToShow;

      // Add all trainers to the selectedTrainers object automatically
      trainersData.forEach(trainer => {
        selectedTrainers[trainer.id] = trainer;
      });

      // Show a subset of trainers
      trainersToShow.forEach(trainer => {
        const trainerCard = document.createElement('div');
        trainerCard.className = 'trainer-card bg-gray-800/40 rounded-lg p-2 flex items-center border border-gray-700/50';
        trainerCard.innerHTML = `
          <div class="flex-shrink-0 mr-2">
            <img src="${trainer.image}" alt="${trainer.name}" class="w-8 h-8 rounded-full object-cover border border-gray-600 shadow-md">
          </div>
          <div class="flex-grow overflow-hidden">
            <h5 class="text-white text-xs font-medium truncate">${trainer.name}</h5>
            <span class="text-amber-400 text-xs">Lv.${trainer.level}</span>
          </div>
        `;

        trainersContainer.appendChild(trainerCard);
      });

      // If there are more trainers, show a count
      if (remainingCount > 0) {
        const moreTrainersElement = document.createElement('div');
        moreTrainersElement.className = 'col-span-2 text-center text-gray-400 py-1';
        moreTrainersElement.innerHTML = `
          <p class="text-xs">+${remainingCount} more trainer${remainingCount > 1 ? 's' : ''}</p>
        `;
        trainersContainer.appendChild(moreTrainersElement);
      }

      // If no trainers, show a message
      if (trainersData.length === 0) {
        const noTrainersElement = document.createElement('div');
        noTrainersElement.className = 'col-span-full text-center text-amber-400 py-2';
        noTrainersElement.innerHTML = `
          <i class="fas fa-exclamation-circle text-sm mb-1"></i>
          <p class="text-xs">No trainers available</p>
        `;
        trainersContainer.appendChild(noTrainersElement);
      }
    }

    function generateRewards() {
      // Clear previous rewards
      rewardsList.innerHTML = '';
      monsterEncountersList.innerHTML = '';
      monsterEncounters = [];

      // Calculate reward multiplier based on productivity, session amount, and session length
      const productivityMultiplier = productivityScore / 100;
      const sessionMultiplier = Math.min(2, state.completedSessions / 4); // Scale up to 2x for 8+ sessions
      const timeMultiplier = Math.min(2, state.totalFocusMinutes / 60); // Scale up to 2x for 2+ hours

      // Combined multiplier with diminishing returns
      const combinedMultiplier = 1 + (productivityMultiplier + sessionMultiplier + timeMultiplier) / 3;

      console.log('Reward multipliers:', {
        productivity: productivityMultiplier,
        sessions: sessionMultiplier,
        time: timeMultiplier,
        combined: combinedMultiplier
      });

      // Get all trainers
      const trainerIds = Object.keys(selectedTrainers);
      if (trainerIds.length === 0) {
        rewardsList.innerHTML = `
          <div class="text-center text-amber-400 py-4">
            <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
            <p>No trainers available to receive rewards</p>
          </div>
        `;
        return;
      }

      // Not all trainers will receive rewards - select a random subset
      const numTrainersToReward = Math.min(
        Math.max(1, Math.floor(trainerIds.length * 0.6)), // Reward about 60% of trainers
        Math.max(1, Math.ceil(state.completedSessions / 2)) // Or 1 trainer per 2 sessions, whichever is greater
      );

      // Shuffle the trainer IDs and take the first numTrainersToReward
      const shuffledTrainerIds = [...trainerIds].sort(() => Math.random() - 0.5).slice(0, numTrainersToReward);

      console.log('Selected trainers for rewards:', shuffledTrainerIds.length, 'out of', trainerIds.length);

      // Initialize rewards tracking
      const trainerRewards = {};
      const monsterRewards = {};

      // Initialize rewards for each trainer - but only those in the shuffled subset will get rewards
      trainerIds.forEach(id => {
        // Initialize with empty rewards
        trainerRewards[id] = { coins: 0, levels: 0, items: [] };
        monsterRewards[id] = [];
      });

      // 1. DISTRIBUTE COINS
      // Base coins per session, scaled by multiplier
      const baseCoinsPerSession = 50;
      const totalCoins = Math.round(state.completedSessions * baseCoinsPerSession * combinedMultiplier);

      // Create coin bundles of different sizes for more interesting distribution
      const coinBundles = [];
      let remainingCoins = totalCoins;

      while (remainingCoins > 0) {
        // Random bundle size between 5 and 25, or remaining coins if smaller
        const bundleSize = Math.min(remainingCoins, 5 + Math.floor(Math.random() * 21));
        coinBundles.push(bundleSize);
        remainingCoins -= bundleSize;
      }

      // Distribute coin bundles to random trainers from the shuffled subset
      coinBundles.forEach(coins => {
        const randomTrainerId = shuffledTrainerIds[Math.floor(Math.random() * shuffledTrainerIds.length)];
        trainerRewards[randomTrainerId].coins += coins;
      });

      // 2. DISTRIBUTE LEVELS
      // Base levels per session, scaled by multiplier
      const baseLevelsPerSession = 1;
      const totalLevels = Math.round(state.completedSessions * baseLevelsPerSession * combinedMultiplier);

      // Create level bundles for distribution
      const levelBundles = [];
      let remainingLevels = totalLevels;

      while (remainingLevels > 0) {
        // Random bundle size between 1 and 3, or remaining levels if smaller
        const bundleSize = Math.min(remainingLevels, 1 + Math.floor(Math.random() * 3));
        levelBundles.push(bundleSize);
        remainingLevels -= bundleSize;
      }

      // Distribute level bundles to random trainers from the shuffled subset
      levelBundles.forEach(levels => {
        const randomTrainerId = shuffledTrainerIds[Math.floor(Math.random() * shuffledTrainerIds.length)];
        trainerRewards[randomTrainerId].levels += levels;
      });

      // 3. DISTRIBUTE ITEMS
      // Number of items based on productivity and sessions
      const itemChance = 0.3 * combinedMultiplier; // 30% base chance per session, scaled by multiplier
      const maxItems = Math.min(5, state.completedSessions); // Cap at 5 items

      // Define possible items with rarity weights
      const items = [
        { name: 'Health Potion', rarity: 'common', icon: 'flask', color: 'blue', weight: 100 },
        { name: 'Super Potion', rarity: 'uncommon', icon: 'flask', color: 'green', weight: 60 },
        { name: 'Rare Candy', rarity: 'rare', icon: 'candy-cane', color: 'purple', weight: 30 },
        { name: 'Master Ball', rarity: 'epic', icon: 'circle', color: 'purple', weight: 10 },
        { name: 'Lucky Egg', rarity: 'legendary', icon: 'egg', color: 'yellow', weight: 5 },
        { name: 'Experience Share', rarity: 'epic', icon: 'share-alt', color: 'blue', weight: 8 },
        { name: 'Evolution Stone', rarity: 'rare', icon: 'gem', color: 'green', weight: 20 },
        { name: 'Stat Booster', rarity: 'uncommon', icon: 'arrow-up', color: 'red', weight: 40 },
        { name: 'Friendship Ribbon', rarity: 'rare', icon: 'ribbon', color: 'pink', weight: 25 },
        { name: 'Golden Berry', rarity: 'epic', icon: 'apple-alt', color: 'yellow', weight: 15 }
      ];

      // Roll for items
      for (let i = 0; i < state.completedSessions; i++) {
        if (Math.random() < itemChance && Object.values(trainerRewards).reduce((sum, r) => sum + r.items.length, 0) < maxItems) {
          // Select a random trainer from the shuffled subset
          const randomTrainerId = shuffledTrainerIds[Math.floor(Math.random() * shuffledTrainerIds.length)];

          // Roll for item rarity based on productivity
          const rarityRoll = Math.random() * combinedMultiplier; // Higher multiplier = better chance for rare items

          // Create weighted selection array
          const weightedItems = [];
          items.forEach(item => {
            // Adjust weight based on rarity and multiplier
            let adjustedWeight = item.weight;
            if (item.rarity === 'legendary' || item.rarity === 'epic') {
              adjustedWeight *= combinedMultiplier;
            }

            for (let w = 0; w < adjustedWeight; w++) {
              weightedItems.push(item);
            }
          });

          // Select random item from weighted array
          const selectedItem = weightedItems[Math.floor(Math.random() * weightedItems.length)];

          // Add to trainer's rewards
          trainerRewards[randomTrainerId].items.push(selectedItem);
        }
      }

      // 4. RENDER TRAINER REWARDS
      // Create reward cards for each trainer that received rewards
      Object.entries(trainerRewards).forEach(([trainerId, rewards]) => {
        // Skip trainers that didn't receive any rewards
        if (rewards.coins === 0 && rewards.levels === 0 && rewards.items.length === 0) return;

        const trainer = selectedTrainers[trainerId];
        const trainerCoins = rewards.coins;
        const trainerLevels = rewards.levels;

        const trainerReward = document.createElement('div');
        trainerReward.className = 'reward-item rounded-xl p-3 border shadow-md mb-3';

        // Add legendary class for trainers with legendary items
        if (rewards.items.some(item => item.rarity === 'legendary')) {
          trainerReward.classList.add('legendary');
        }

        // Build HTML for trainer info
        let rewardHTML = `
          <div class="flex items-center mb-2 pb-2 border-b border-gray-700/30">
            <div class="flex-shrink-0 mr-2">
              <img src="${trainer.image}" alt="${trainer.name}" class="w-8 h-8 rounded-full object-cover border border-gray-600 shadow-md">
            </div>
            <div class="flex-grow overflow-hidden">
              <h5 class="text-white text-xs font-medium truncate">${trainer.name}</h5>
              <div class="flex items-center">
                <span class="text-amber-400 text-xs">Lv.${trainer.level}</span>
                ${trainerLevels > 0 ? `<span class="text-green-400 text-xs ml-1">→ ${trainer.level + trainerLevels}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="flex justify-between mb-2">
            <div class="flex items-center bg-amber-900/20 rounded-lg px-2 py-1">
              <i class="fas fa-coins text-amber-400 text-xs mr-1"></i>
              <span class="text-xs text-amber-300">+${trainerCoins}</span>
            </div>
            ${trainerLevels > 0 ? `
              <div class="flex items-center bg-green-900/20 rounded-lg px-2 py-1">
                <i class="fas fa-star text-green-400 text-xs mr-1"></i>
                <span class="text-xs text-green-300">+${trainerLevels}</span>
              </div>
            ` : ''}
          </div>
        `;

        // Add items if any
        if (rewards.items.length > 0) {
          rewardHTML += `<div class="grid grid-cols-2 gap-2">`;

          rewards.items.forEach(item => {
            const rarityColor = {
              'common': 'blue',
              'uncommon': 'green',
              'rare': 'purple',
              'epic': 'pink',
              'legendary': 'amber'
            }[item.rarity] || item.color;

            rewardHTML += `
              <div class="flex items-center bg-${rarityColor}-900/20 rounded-lg p-1.5 border border-${rarityColor}-500/20">
                <div class="bg-${rarityColor}-500/20 p-1.5 rounded-full mr-1.5">
                  <i class="fas fa-${item.icon} text-${rarityColor}-400 text-xs"></i>
                </div>
                <div class="flex-grow overflow-hidden">
                  <h6 class="text-xs text-white truncate">${item.name}</h6>
                  <p class="text-xs text-${rarityColor}-400/80">${item.rarity.charAt(0).toUpperCase()}</p>
                </div>
              </div>
            `;
          });

          rewardHTML += `</div>`;
        }

        trainerReward.innerHTML = rewardHTML;
        rewardsList.appendChild(trainerReward);
      });

      // 5. MONSTER ENCOUNTERS
      // Monster encounters are now generated with a delay in the showRewards function
      console.log('Rewards generation complete, monster encounters will be generated with delay');

      // Return the combinedMultiplier for monster encounters
      return combinedMultiplier;
    }

    // Generate monster encounters using the MonsterRoller utility
    function generateMonsterEncounters(combinedMultiplier) {
      console.log('Generating monster encounters with combined multiplier:', combinedMultiplier);
      console.log('Completed sessions:', state.completedSessions);

      // Base chance of encounter scaled by multiplier
      const baseEncounterChance = 0.5; // 50% base chance per session
      const encounterChance = Math.min(1.0, baseEncounterChance * combinedMultiplier); // Cap at 100%

      // Number of potential encounters based on completed sessions
      const maxEncounters = Math.min(state.completedSessions, 3); // Cap at 3 encounters
      let encounterCount = 0;

      console.log('Max potential encounters:', maxEncounters, 'Encounter chance:', encounterChance);

      // Try for each potential encounter
      for (let i = 0; i < maxEncounters; i++) {
        const roll = Math.random();
        console.log(`Encounter roll ${i+1}:`, roll, '< chance:', encounterChance);

        if (roll < encounterChance) {
          encounterCount++;

          // Determine rarity tier based on combined multiplier
          let rarityTier = 'common';
          const rarityRoll = Math.random();

          // Scale chances based on combined multiplier
          const legendaryChance = 0.01 * combinedMultiplier;
          const mythicalChance = 0.03 * combinedMultiplier;
          const rareChance = 0.15 * combinedMultiplier;
          const uncommonChance = 0.30 * combinedMultiplier;

          if (rarityRoll < legendaryChance) {
            rarityTier = 'legendary';
          } else if (rarityRoll < mythicalChance) {
            rarityTier = 'mythical';
          } else if (rarityRoll < rareChance) {
            rarityTier = 'rare';
          } else if (rarityRoll < uncommonChance) {
            rarityTier = 'uncommon';
          }

          console.log(`Monster rarity tier: ${rarityTier}`);

          // Map rarity tier to filter parameters for MonsterRoller
          const rarityFilters = {
            common: {
              pokemon: { rarity: 'Common', stage: ['Base Stage', 'Doesn\'t Evolve'] },
              digimon: { stage: ['Training 1', 'Training 2', 'Rookie'] },
              yokai: { rank: ['E', 'D'] }
            },
            uncommon: {
              pokemon: { rarity: 'Uncommon', stage: ['Base Stage', 'Stage 1'] },
              digimon: { stage: ['Rookie'] },
              yokai: { rank: ['D', 'C'] }
            },
            rare: {
              pokemon: { rarity: 'Rare', stage: ['Stage 1', 'Stage 2'] },
              digimon: { stage: ['Champion'] },
              yokai: { rank: ['C', 'B'] }
            },
            mythical: {
              pokemon: { rarity: 'Epic', stage: ['Stage 2', 'Stage 3'] },
              digimon: { stage: ['Ultimate'] },
              yokai: { rank: ['B', 'A'] }
            },
            legendary: {
              pokemon: { rarity: 'Legendary', stage: ['Stage 3', 'Legendary'] },
              digimon: { stage: ['Mega'] },
              yokai: { rank: ['A', 'S'] }
            }
          };

          // In a real implementation, we would use the MonsterRoller utility here
          // Since we can't actually call the server-side utility from client-side JavaScript,
          // we'll simulate the result with a mock implementation

          // Simulate monster data based on rarity tier
          const monsterTypes = ['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Dark', 'Normal', 'Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Ice', 'Dragon', 'Fairy'];

          // Select 1-2 types based on rarity
          const typeCount = rarityTier === 'legendary' || rarityTier === 'mythical' ? 2 : 1;
          const selectedTypes = [];

          for (let t = 0; t < typeCount; t++) {
            // Avoid duplicate types
            let availableTypes = monsterTypes.filter(type => !selectedTypes.includes(type));
            selectedTypes.push(availableTypes[Math.floor(Math.random() * availableTypes.length)]);
          }

          // Generate species name based on rarity and type
          let speciesName = '';
          let monsterImage = '/images/default_mon.png';

          // More elaborate species names for rarer monsters
          const typeAdjectives = {
            'Fire': ['Flame', 'Ember', 'Blaze', 'Inferno', 'Scorch'],
            'Water': ['Aqua', 'Hydro', 'Tide', 'Wave', 'Splash'],
            'Grass': ['Leaf', 'Vine', 'Petal', 'Bloom', 'Forest'],
            'Electric': ['Spark', 'Volt', 'Thunder', 'Shock', 'Zap'],
            'Psychic': ['Mind', 'Psy', 'Dream', 'Mystic', 'Vision'],
            'Dark': ['Shadow', 'Night', 'Dusk', 'Gloom', 'Shade'],
            'Normal': ['Basic', 'Common', 'Standard', 'Regular', 'Ordinary'],
            'Fighting': ['Brawl', 'Combat', 'Martial', 'Fist', 'Warrior'],
            'Flying': ['Sky', 'Wind', 'Aerial', 'Soar', 'Glide'],
            'Poison': ['Toxic', 'Venom', 'Acid', 'Smog', 'Fume'],
            'Ground': ['Earth', 'Terra', 'Soil', 'Sand', 'Quake'],
            'Rock': ['Stone', 'Boulder', 'Pebble', 'Granite', 'Crystal'],
            'Bug': ['Insect', 'Beetle', 'Crawler', 'Swarm', 'Hive'],
            'Ghost': ['Spirit', 'Phantom', 'Specter', 'Haunt', 'Wisp'],
            'Steel': ['Metal', 'Iron', 'Chrome', 'Alloy', 'Steel'],
            'Ice': ['Frost', 'Freeze', 'Chill', 'Glacier', 'Snow'],
            'Dragon': ['Drake', 'Wyrm', 'Serpent', 'Wyvern', 'Dragon'],
            'Fairy': ['Fae', 'Pixie', 'Sprite', 'Charm', 'Enchant']
          };

          const suffixes = {
            'common': ['mon', 'pet', 'critter', 'ling', 'pup'],
            'uncommon': ['beast', 'creature', 'animal', 'being', 'entity'],
            'rare': ['guardian', 'protector', 'defender', 'champion', 'knight'],
            'mythical': ['lord', 'master', 'ruler', 'sovereign', 'overlord'],
            'legendary': ['god', 'deity', 'immortal', 'celestial', 'divine']
          };

          // Generate name based on type and rarity
          const primaryType = selectedTypes[0];
          const adjective = typeAdjectives[primaryType][Math.floor(Math.random() * typeAdjectives[primaryType].length)];
          const suffix = suffixes[rarityTier][Math.floor(Math.random() * suffixes[rarityTier].length)];

          // For dual-type monsters, incorporate the second type
          if (selectedTypes.length > 1) {
            const secondaryType = selectedTypes[1];
            const secondAdjective = typeAdjectives[secondaryType][Math.floor(Math.random() * typeAdjectives[secondaryType].length)];
            speciesName = `${adjective}${secondAdjective} ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
          } else {
            speciesName = `${adjective}${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
          }

          // Add monster to encounters list
          monsterEncounters.push({
            id: i + 1,
            species: speciesName,
            type: selectedTypes.join('/'),
            rarity: rarityTier,
            image: monsterImage,
            level: Math.floor(Math.random() * 5) + (rarityTier === 'legendary' ? 5 : 1) // Higher base level for legendary
          });
        }
      }

      // If we have encounters, show the container and render them
      console.log('Generated monster encounters:', monsterEncounters.length, monsterEncounters);
      if (monsterEncounters.length > 0) {
        monsterEncounterContainer.classList.remove('hidden');
        monsterEncounterContainer.style.display = 'block';
        renderMonsterEncounters();
      } else {
        console.warn('No monster encounters were generated!');
      }

      // Initialize the rewards UI after everything is generated
      setTimeout(initializeRewardsUI, 100);
    }

    // Render monster encounters in the UI
    function renderMonsterEncounters() {
      monsterEncountersList.innerHTML = '';

      monsterEncounters.forEach(monster => {
        const monsterCard = document.createElement('div');
        monsterCard.className = `monster-card rounded-xl overflow-hidden border shadow-md ${monster.rarity}`;
        monsterCard.dataset.monsterId = monster.id;

        // Get color based on rarity
        let rarityColor = 'white';
        let rarityBg = 'gray-600';

        switch(monster.rarity) {
          case 'legendary':
            rarityColor = 'yellow-400';
            rarityBg = 'yellow-900/30';
            break;
          case 'mythical':
            rarityColor = 'purple-400';
            rarityBg = 'purple-900/30';
            break;
          case 'rare':
            rarityColor = 'blue-400';
            rarityBg = 'blue-900/30';
            break;
          case 'uncommon':
            rarityColor = 'green-400';
            rarityBg = 'green-900/30';
            break;
          default:
            rarityColor = 'white';
            rarityBg = 'gray-600';
        }

        // Get color based on type
        // Handle dual types by using the primary type for color
        const primaryType = monster.type.split('/')[0];
        let typeColor = 'gray-400';
        let typeBg = 'gray-700';

        // Type color mapping with icons
        const typeColors = {
          'Fire': { color: 'red-400', bg: 'red-900/30', icon: 'fa-fire' },
          'Water': { color: 'blue-400', bg: 'blue-900/30', icon: 'fa-water' },
          'Grass': { color: 'green-400', bg: 'green-900/30', icon: 'fa-leaf' },
          'Electric': { color: 'yellow-400', bg: 'yellow-900/30', icon: 'fa-bolt' },
          'Psychic': { color: 'purple-400', bg: 'purple-900/30', icon: 'fa-brain' },
          'Dark': { color: 'gray-400', bg: 'gray-900/50', icon: 'fa-moon' },
          'Normal': { color: 'gray-300', bg: 'gray-700/50', icon: 'fa-circle' },
          'Fighting': { color: 'red-500', bg: 'red-950/30', icon: 'fa-fist-raised' },
          'Flying': { color: 'blue-300', bg: 'blue-800/30', icon: 'fa-feather' },
          'Poison': { color: 'purple-500', bg: 'purple-950/30', icon: 'fa-skull-crossbones' },
          'Ground': { color: 'yellow-600', bg: 'yellow-950/30', icon: 'fa-mountain' },
          'Rock': { color: 'yellow-700', bg: 'yellow-950/40', icon: 'fa-gem' },
          'Bug': { color: 'green-500', bg: 'green-950/30', icon: 'fa-bug' },
          'Ghost': { color: 'indigo-400', bg: 'indigo-900/30', icon: 'fa-ghost' },
          'Steel': { color: 'gray-400', bg: 'gray-800/50', icon: 'fa-shield-alt' },
          'Ice': { color: 'cyan-300', bg: 'cyan-900/30', icon: 'fa-snowflake' },
          'Dragon': { color: 'indigo-500', bg: 'indigo-950/30', icon: 'fa-dragon' },
          'Fairy': { color: 'pink-400', bg: 'pink-900/30', icon: 'fa-hat-wizard' }
        };

        // Set colors based on primary type
        if (typeColors[primaryType]) {
          typeColor = typeColors[primaryType].color;
          typeBg = typeColors[primaryType].bg;
        }

        // Create a glow effect for rarer monsters
        const glowEffect = monster.rarity === 'legendary' ? 'shadow-lg shadow-yellow-500/20' :
                          monster.rarity === 'mythical' ? 'shadow-lg shadow-purple-500/20' :
                          monster.rarity === 'rare' ? 'shadow-md shadow-blue-500/10' : '';

        // Format type display for dual types with icons
        const typeDisplay = monster.type.includes('/') ?
          `<div class="flex space-x-1">
            ${monster.type.split('/').map(t => {
              const typeInfo = typeColors[t] || { color: 'gray-400', bg: 'gray-700', icon: 'fa-question' };
              return `<span class="inline-flex items-center px-1.5 py-0.5 rounded-full bg-${typeInfo.bg} text-${typeInfo.color} text-xs shadow-sm">
                <i class="fas ${typeInfo.icon} text-xs mr-1"></i>${t}
              </span>`;
            }).join('')}
           </div>` :
          (() => {
            const typeInfo = typeColors[monster.type] || { color: 'gray-400', bg: 'gray-700', icon: 'fa-question' };
            return `<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-${typeBg} text-${typeColor} text-xs font-medium shadow-sm">
              <i class="fas ${typeInfo.icon} text-xs mr-1"></i>${monster.type}
            </span>`;
          })();

        monsterCard.innerHTML = `
          <div class="relative">
            <div class="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-${rarityBg} text-${rarityColor} text-xs font-medium">
              ${monster.rarity.charAt(0).toUpperCase() + monster.rarity.slice(1)}
            </div>
            <div class="p-3 flex justify-center">
              <img src="${monster.image}" alt="${monster.species}" class="w-24 h-24 object-contain ${monster.rarity === 'legendary' ? 'animate-pulse' : ''}">
            </div>
          </div>
          <div class="p-3 border-t border-gray-700/30">
            <h5 class="text-${rarityColor} font-bold text-sm mb-2 truncate">${monster.species}</h5>

            <div class="flex flex-wrap gap-1 mb-2">
              ${typeDisplay}
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                <i class="fas fa-arrow-up text-xs mr-1"></i> Lv.${monster.level}
              </span>
            </div>

            <div class="bg-gray-800/30 p-2 rounded-lg mb-3">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-400">Power Rating:</span>
                <span class="text-xs text-${rarityColor} font-bold">${Math.floor(monster.level * (monster.rarity === 'legendary' ? 10 : monster.rarity === 'mythical' ? 8 : monster.rarity === 'rare' ? 5 : monster.rarity === 'uncommon' ? 3 : 1))}</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-1 mt-1">
                <div class="bg-${rarityColor} h-1 rounded-full" style="width: ${monster.rarity === 'legendary' ? '95%' : monster.rarity === 'mythical' ? '80%' : monster.rarity === 'rare' ? '60%' : monster.rarity === 'uncommon' ? '40%' : '20%'}"></div>
              </div>
            </div>

            <div class="mb-3">
              <label class="block text-xs text-gray-400 mb-1">Give your ${monster.species} a name:</label>
              <input type="text" class="monster-name-input bg-gray-800/70 border border-gray-700 text-white w-full rounded p-2 text-sm"
                     placeholder="Enter name" data-monster-id="${monster.id}">
            </div>

            <button class="capture-monster-btn bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded text-sm w-full transition-colors border border-gray-700 shadow-md flex items-center justify-center"
                    data-monster-id="${monster.id}">
              <i class="fas fa-check-circle mr-1"></i> Capture ${monster.species}
            </button>
          </div>
        `;

        monsterEncountersList.appendChild(monsterCard);
      });

      // Add event listeners to capture buttons using direct onclick attribute
      // This approach is more reliable than adding event listeners dynamically
      monsterEncountersList.addEventListener('click', function(event) {
        // Check if the clicked element is a capture button or its child
        const captureBtn = event.target.closest('.capture-monster-btn');
        if (!captureBtn) return; // Not a capture button, exit

        console.log('Capture button clicked');
        const monsterId = captureBtn.dataset.monsterId;
        if (!monsterId) {
          console.error('No monster ID found on button');
          return;
        }

        const nameInput = document.querySelector(`.monster-name-input[data-monster-id="${monsterId}"]`);
        const monsterCard = document.querySelector(`div[data-monster-id="${monsterId}"]`);

        if (!nameInput) {
          console.error('Name input not found for monster ID:', monsterId);
          alert('Error: Could not find the name input field. Please try again.');
          return;
        }

        if (!nameInput.value) {
          alert('Please name your monster!');
          return;
        }

        if (!monsterCard) {
          console.error('Monster card not found for monster ID:', monsterId);
          alert('Error: Could not find the monster card. Please try again.');
          return;
        }

        // Get all available trainers
        const trainerIds = Object.keys(selectedTrainers);
        if (trainerIds.length === 0) {
          alert('No trainers available to assign the monster to!');
          return;
        }

        // Randomly select a trainer
        const randomTrainerId = trainerIds[Math.floor(Math.random() * trainerIds.length)];
        const randomTrainer = selectedTrainers[randomTrainerId];
        if (!randomTrainer) {
          console.error('Selected trainer not found:', randomTrainerId);
          alert('Error: Could not find the selected trainer. Please try again.');
          return;
        }

        // Update monster data with name and trainer
        const monsterIndex = monsterEncounters.findIndex(m => m.id.toString() === monsterId);
        if (monsterIndex === -1) {
          console.error('Monster not found in monsterEncounters array:', monsterId);
          alert('Error: Could not find the monster data. Please try again.');
          return;
        }

        // Update monster data
        monsterEncounters[monsterIndex].name = nameInput.value;
        monsterEncounters[monsterIndex].trainerId = randomTrainerId;
        monsterEncounters[monsterIndex].captured = true;

        // Get monster rarity for styling
        const monster = monsterEncounters[monsterIndex];
        let rarityColor = 'white';

        switch(monster.rarity) {
          case 'legendary':
            rarityColor = 'yellow-400';
            break;
          case 'mythical':
            rarityColor = 'purple-400';
            break;
          case 'rare':
            rarityColor = 'blue-400';
            break;
          case 'uncommon':
            rarityColor = 'green-400';
            break;
          default:
            rarityColor = 'white';
        }

        // Update UI to show captured
        monsterCard.innerHTML = `
          <div class="p-6 text-center">
            <div class="inline-block p-3 rounded-full bg-green-900/30 mb-3">
              <i class="fas fa-check-circle text-green-400 text-2xl"></i>
            </div>
            <h5 class="text-lg font-bold text-${rarityColor} mb-1">${nameInput.value} Captured!</h5>
            <p class="text-gray-300 text-sm mb-2">Added to ${randomTrainer.name}'s collection</p>
            <div class="text-xs text-gray-400 bg-gray-800/30 p-2 rounded-lg">
              <p>Level ${monster.level} ${monster.type} Type</p>
              <p class="mt-1">${monster.rarity.charAt(0).toUpperCase() + monster.rarity.slice(1)} Rarity</p>
            </div>
          </div>
        `;

        console.log(`Monster ${nameInput.value} captured and assigned to ${randomTrainer.name}`);
      });
    }

    // Set up claim rewards button with direct onclick handler
    function setupClaimRewardsButton() {
      console.log('Setting up claim rewards button');
      const claimRewardsBtn = document.getElementById('claim-rewards-btn');
      if (!claimRewardsBtn) {
        console.error('Claim rewards button not found');
        return;
      }

      // Remove any existing event listeners
      const newBtn = claimRewardsBtn.cloneNode(true);
      claimRewardsBtn.parentNode.replaceChild(newBtn, claimRewardsBtn);

      // Add new event listener
      newBtn.addEventListener('click', handleClaimRewards);
      console.log('Claim rewards button event listener added');
    }

    // Handle claim rewards button click
    function handleClaimRewards() {
      console.log('Claim rewards button clicked');
      // Check if any trainers are selected
      const selectedTrainerIds = Object.keys(selectedTrainers);
      if (selectedTrainerIds.length === 0) {
        alert('Please select at least one trainer to receive rewards');
        return;
      }

      // Create a form to submit the rewards
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/town/visit/game_corner/claim_rewards';

      // Use the already calculated rewards from generateRewards function
      // We'll collect all the rewards that were displayed to the user
      const trainerRewardsToSubmit = {};

      // Initialize rewards for each trainer
      selectedTrainerIds.forEach(id => {
        // Start with empty rewards
        trainerRewardsToSubmit[id] = { coins: 0, levels: 0, items: [] };
      });

      // Find all trainer reward cards
      const rewardsList = document.getElementById('rewards-list');
      if (!rewardsList) {
        console.error('Rewards list container not found');
        alert('Error: Could not find rewards list. Please try again.');
        return;
      }

      // Process each trainer reward card
      const trainerCards = rewardsList.querySelectorAll('.reward-item');
      console.log(`Found ${trainerCards.length} trainer reward cards`);

      trainerCards.forEach(card => {
        // Find trainer name
        const trainerNameElement = card.querySelector('h5.text-white');
        if (!trainerNameElement) {
          console.log('No trainer name found in card:', card);
          return;
        }

        const trainerName = trainerNameElement.textContent.trim();
        console.log('Processing rewards for trainer:', trainerName);

        // Find matching trainer ID
        let matchingTrainerId = null;
        for (const [id, trainer] of Object.entries(selectedTrainers)) {
          if (trainer.name === trainerName) {
            matchingTrainerId = id;
            break;
          }
        }

        if (!matchingTrainerId) {
          console.log('No matching trainer ID found for name:', trainerName);
          return;
        }

        // Extract coins - look for the amber text with the + symbol
        const coinsElements = card.querySelectorAll('.text-amber-300, .text-xs.text-amber-300');
        coinsElements.forEach(element => {
          if (element.textContent.includes('+')) {
            const coinsText = element.textContent;
            const coins = parseInt(coinsText.replace(/[^0-9]/g, ''));
            if (!isNaN(coins)) {
              trainerRewardsToSubmit[matchingTrainerId].coins = coins;
              console.log(`Found ${coins} coins for ${trainerName}`);
            }
          }
        });

        // Extract levels - look for the green text with the + symbol
        const levelsElements = card.querySelectorAll('.text-green-300, .text-xs.text-green-300, .text-green-400');
        levelsElements.forEach(element => {
          if (element.textContent.includes('+')) {
            const levelsText = element.textContent;
            const levels = parseInt(levelsText.replace(/[^0-9]/g, ''));
            if (!isNaN(levels)) {
              trainerRewardsToSubmit[matchingTrainerId].levels = levels;
              console.log(`Found ${levels} levels for ${trainerName}`);
            }
          }
        });

        // Extract items - look for item containers with different background colors
        const itemElements = card.querySelectorAll('[class*="bg-"][class*="-900/20"]');
        itemElements.forEach(itemElement => {
          const itemNameElement = itemElement.querySelector('h6.text-xs.text-white');
          const itemRarityElement = itemElement.querySelector('[class*="text-"][class*="-400"]');
          if (itemNameElement && itemRarityElement) {
            // Extract the rarity from the first character (e.g., "C" for Common)
            const rarityChar = itemRarityElement.textContent.trim();
            let rarity = 'common';

            // Map the first character to full rarity name
            if (rarityChar === 'U') rarity = 'uncommon';
            else if (rarityChar === 'R') rarity = 'rare';
            else if (rarityChar === 'E') rarity = 'epic';
            else if (rarityChar === 'L') rarity = 'legendary';

            trainerRewardsToSubmit[matchingTrainerId].items.push({
              name: itemNameElement.textContent.trim(),
              rarity: rarity
            });
            console.log(`Found item ${itemNameElement.textContent.trim()} (${rarity}) for ${trainerName}`);
          }
        });
      });

      console.log('Final trainer rewards to submit:', trainerRewardsToSubmit);

      // Add trainer rewards to form
      Object.entries(trainerRewardsToSubmit).forEach(([trainerId, rewards], index) => {
        // Skip trainers that didn't receive any rewards
        if (rewards.coins === 0 && rewards.levels === 0 && rewards.items.length === 0) return;

        // Add trainer ID field
        const trainerIdInput = document.createElement('input');
        trainerIdInput.type = 'hidden';
        trainerIdInput.name = `trainers[${index}][id]`;
        trainerIdInput.value = trainerId;
        form.appendChild(trainerIdInput);

        // Add coins field
        const coinsInput = document.createElement('input');
        coinsInput.type = 'hidden';
        coinsInput.name = `trainers[${index}][coins]`;
        coinsInput.value = rewards.coins;
        form.appendChild(coinsInput);

        // Add levels field
        const levelsInput = document.createElement('input');
        levelsInput.type = 'hidden';
        levelsInput.name = `trainers[${index}][levels]`;
        levelsInput.value = rewards.levels;
        form.appendChild(levelsInput);

        // Add items
        rewards.items.forEach((item, itemIndex) => {
          const itemNameInput = document.createElement('input');
          itemNameInput.type = 'hidden';
          itemNameInput.name = `trainers[${index}][items][${itemIndex}][name]`;
          itemNameInput.value = item.name;
          form.appendChild(itemNameInput);

          const itemRarityInput = document.createElement('input');
          itemRarityInput.type = 'hidden';
          itemRarityInput.name = `trainers[${index}][items][${itemIndex}][rarity]`;
          itemRarityInput.value = item.rarity;
          form.appendChild(itemRarityInput);
        });
      });

      // Add captured monsters
      const capturedMonsters = monsterEncounters.filter(monster => monster.captured);
      capturedMonsters.forEach((monster, index) => {
        // Add monster name
        const monsterNameInput = document.createElement('input');
        monsterNameInput.type = 'hidden';
        monsterNameInput.name = `monsters[${index}][name]`;
        monsterNameInput.value = monster.name;
        form.appendChild(monsterNameInput);

        // Add monster species
        const monsterSpeciesInput = document.createElement('input');
        monsterSpeciesInput.type = 'hidden';
        monsterSpeciesInput.name = `monsters[${index}][species]`;
        monsterSpeciesInput.value = monster.species;
        form.appendChild(monsterSpeciesInput);

        // Add monster type
        const monsterTypeInput = document.createElement('input');
        monsterTypeInput.type = 'hidden';
        monsterTypeInput.name = `monsters[${index}][type]`;
        monsterTypeInput.value = monster.type.toLowerCase();
        form.appendChild(monsterTypeInput);

        // Add monster rarity
        const monsterRarityInput = document.createElement('input');
        monsterRarityInput.type = 'hidden';
        monsterRarityInput.name = `monsters[${index}][rarity]`;
        monsterRarityInput.value = monster.rarity;
        form.appendChild(monsterRarityInput);

        // Add monster level
        const monsterLevelInput = document.createElement('input');
        monsterLevelInput.type = 'hidden';
        monsterLevelInput.name = `monsters[${index}][level]`;
        monsterLevelInput.value = monster.level;
        form.appendChild(monsterLevelInput);

        // Add trainer ID for this monster
        const monsterTrainerInput = document.createElement('input');
        monsterTrainerInput.type = 'hidden';
        monsterTrainerInput.name = `monsters[${index}][trainerId]`;
        monsterTrainerInput.value = monster.trainerId;
        form.appendChild(monsterTrainerInput);
      });

      // Add session data for analytics
      const sessionsInput = document.createElement('input');
      sessionsInput.type = 'hidden';
      sessionsInput.name = 'sessionData[completedSessions]';
      sessionsInput.value = state.completedSessions;
      form.appendChild(sessionsInput);

      const focusMinutesInput = document.createElement('input');
      focusMinutesInput.type = 'hidden';
      focusMinutesInput.name = 'sessionData[focusMinutes]';
      focusMinutesInput.value = state.totalFocusMinutes;
      form.appendChild(focusMinutesInput);

      const productivityInput = document.createElement('input');
      productivityInput.type = 'hidden';
      productivityInput.name = 'sessionData[productivityScore]';
      productivityInput.value = productivityScore;
      form.appendChild(productivityInput);

      // Add form to document and submit
      document.body.appendChild(form);

      // Reset UI elements before submitting
      const rewardsContainer = document.getElementById('rewards-container');
      if (rewardsContainer) {
        rewardsContainer.classList.add('hidden');
        rewardsContainer.style.display = 'none';
      }

      const monsterEncounterContainer = document.getElementById('monster-encounter-container');
      if (monsterEncounterContainer) {
        monsterEncounterContainer.classList.add('hidden');
        monsterEncounterContainer.style.display = 'none';
      }

      // Reset state
      state.completedSessions = 0;
      state.totalFocusMinutes = 0;
      state.rewardsShown = false;
      sessionProductivity = [];

      // Submit the form
      console.log('Submitting form with rewards');
      form.submit();
    }

    // Call setupClaimRewardsButton when rewards are generated
    function initializeRewardsUI() {
      // Set up the claim rewards button
      setupClaimRewardsButton();
    }

    // Settings toggle
    const toggleSettings = document.getElementById('toggle-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsChevron = document.getElementById('settings-chevron');

    toggleSettings.addEventListener('click', () => {
      settingsPanel.classList.toggle('hidden');
      settingsChevron.style.transform = settingsPanel.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Update progress circle
    function updateProgressCircle(timeLeft, totalTime) {
      const progressCircle = document.getElementById('progress-circle');
      const circumference = 2 * Math.PI * 40; // 2πr where r=40
      const progress = timeLeft / totalTime;
      const dashOffset = circumference * (1 - progress);

      progressCircle.style.strokeDasharray = circumference;
      progressCircle.style.strokeDashoffset = dashOffset;

      // Update color based on remaining time
      if (progress < 0.25) {
        progressCircle.style.stroke = '#EF4444'; // Red for last 25%
      } else if (progress < 0.5) {
        progressCircle.style.stroke = '#F59E0B'; // Amber for 25-50%
      } else {
        progressCircle.style.stroke = '#8B5CF6'; // Purple for 50-100%
      }
    }

  // Update progress circle in the timer function
  function updateTimerWithProgress() {
    // Update progress circle
    const totalSeconds = state.minutes * 60 + state.seconds;
    const totalTime = state.isFocusTime ?
      parseInt(elements.focus.input.value) * 60 :
      parseInt(elements.break.input.value) * 60;
    updateProgressCircle(totalSeconds, totalTime);
  }
});