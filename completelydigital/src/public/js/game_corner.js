// Game Corner JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Make timer functions globally accessible
  window.startTimer = startTimer;
  window.pauseTimer = pauseTimer;
  window.resetTimer = resetTimer;
  window.updateFocusDuration = updateFocusDuration;
  window.updateBreakDuration = updateBreakDuration;
  window.updateTotalSessions = updateTotalSessions;
  console.log('Game Corner script loaded - v1.0.1');

  // Debug DOM elements
  console.log('Debugging DOM elements:');
  console.log('Start button:', document.getElementById('start-timer'));
  console.log('Pause button:', document.getElementById('pause-timer'));
  console.log('Reset button:', document.getElementById('reset-timer'));
  console.log('Test assessment button:', document.getElementById('test-assessment-modal'));
  console.log('Test rewards button:', document.getElementById('test-rewards-modal'));
  console.log('Test rewards 100 button:', document.getElementById('test-rewards-100'));

  // Timer variables
  let timerInterval;
  let totalSeconds = 25 * 60; // 25 minutes in seconds
  let currentSeconds = totalSeconds;
  let isRunning = false;
  let isPaused = false;
  let currentSession = 0;
  let totalSessions = 4;
  let isBreak = false;
  let focusDuration = 25;
  let breakDuration = 5;

  // DOM elements
  const timerDisplay = document.getElementById('timer-display');
  const sessionInfo = document.getElementById('session-info');
  const timerStatus = document.getElementById('timer-status');
  const startButton = document.getElementById('start-timer');
  const pauseButton = document.getElementById('pause-timer');
  const resetButton = document.getElementById('reset-timer');
  const progressCircle = document.getElementById('progress-circle');
  const settingsToggle = document.getElementById('toggle-settings');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsChevron = document.getElementById('settings-chevron');
  const focusDurationInput = document.getElementById('focus-duration');
  const breakDurationInput = document.getElementById('break-duration');
  const numSessionsInput = document.getElementById('num-sessions');
  const videoSelector = document.getElementById('video-selector');
  const videoSource = document.getElementById('video-source');
  const videoElement = document.getElementById('youtube-player'); // Updated to youtube-player
  const muteToggle = document.getElementById('mute-toggle');
  const volumeIcon = document.getElementById('volume-icon');
  const expandVideo = document.getElementById('expand-video');
  const collapseVideo = document.getElementById('collapse-video');
  const videoContent = document.getElementById('video-content');
  const videoHeader = document.getElementById('video-header');

  // Modal elements
  const workAssessmentModal = document.getElementById('work-assessment-modal');
  const rewardsContainer = document.getElementById('rewards-container');
  const claimRewardsBtn = document.getElementById('claim-rewards-btn');
  const closeRewardsBtn = document.getElementById('close-rewards-btn');
  const rewardsList = document.getElementById('rewards-list');
  const completedSessionsDisplay = document.getElementById('completed-sessions');
  const focusMinutesDisplay = document.getElementById('focus-minutes');
  const productivityScoreDisplay = document.getElementById('productivity-score');
  const monsterEncounterContainer = document.getElementById('monster-encounter-container');
  const monsterEncountersList = document.getElementById('monster-encounters-list');

  // Log modal elements for debugging
  console.log('Work Assessment Modal:', workAssessmentModal);
  console.log('Rewards Container:', rewardsContainer);

  // Initialize timer display
  updateTimerDisplay();
  updateSessionInfo();

  // Timer controls - with direct function definitions for debugging
  console.log('Attaching timer control event listeners');

  if (startButton) {
    console.log('Start button found, attaching event listener');
    startButton.onclick = function() {
      console.log('Start button clicked');
      startTimer();
    };
  } else {
    console.error('Start button not found');
  }

  if (pauseButton) {
    console.log('Pause button found, attaching event listener');
    pauseButton.onclick = function() {
      console.log('Pause button clicked');
      pauseTimer();
    };
  } else {
    console.error('Pause button not found');
  }

  if (resetButton) {
    console.log('Reset button found, attaching event listener');
    resetButton.onclick = function() {
      console.log('Reset button clicked');
      resetTimer();
    };
  } else {
    console.error('Reset button not found');
  }

  // Settings panel is now always visible
  if (settingsPanel) {
    settingsPanel.classList.remove('hidden');
  }

  // Duration controls
  if (document.getElementById('increase-focus')) {
    document.getElementById('increase-focus').addEventListener('click', function() {
      if (parseInt(focusDurationInput.value) < 60) {
        focusDurationInput.value = parseInt(focusDurationInput.value) + 1;
        updateFocusDuration();
      }
    });
  }

  if (document.getElementById('decrease-focus')) {
    document.getElementById('decrease-focus').addEventListener('click', function() {
      if (parseInt(focusDurationInput.value) > 1) {
        focusDurationInput.value = parseInt(focusDurationInput.value) - 1;
        updateFocusDuration();
      }
    });
  }

  if (focusDurationInput) {
    focusDurationInput.addEventListener('change', updateFocusDuration);
    focusDurationInput.addEventListener('input', updateFocusDuration);
  }

  if (document.getElementById('increase-break')) {
    document.getElementById('increase-break').addEventListener('click', function() {
      if (parseInt(breakDurationInput.value) < 30) {
        breakDurationInput.value = parseInt(breakDurationInput.value) + 1;
        updateBreakDuration();
      }
    });
  }

  if (document.getElementById('decrease-break')) {
    document.getElementById('decrease-break').addEventListener('click', function() {
      if (parseInt(breakDurationInput.value) > 1) {
        breakDurationInput.value = parseInt(breakDurationInput.value) - 1;
        updateBreakDuration();
      }
    });
  }

  if (breakDurationInput) {
    breakDurationInput.addEventListener('change', updateBreakDuration);
    breakDurationInput.addEventListener('input', updateBreakDuration);
  }

  if (document.getElementById('increase-sessions')) {
    document.getElementById('increase-sessions').addEventListener('click', function() {
      if (parseInt(numSessionsInput.value) < 10) {
        numSessionsInput.value = parseInt(numSessionsInput.value) + 1;
        updateTotalSessions();
      }
    });
  }

  if (document.getElementById('decrease-sessions')) {
    document.getElementById('decrease-sessions').addEventListener('click', function() {
      if (parseInt(numSessionsInput.value) > 1) {
        numSessionsInput.value = parseInt(numSessionsInput.value) - 1;
        updateTotalSessions();
      }
    });
  }

  if (numSessionsInput) {
    numSessionsInput.addEventListener('change', updateTotalSessions);
    numSessionsInput.addEventListener('input', updateTotalSessions);
  }

  // YouTube Video Player
  const youtubePlayer = document.getElementById('youtube-player');
  const customYoutubeUrl = document.getElementById('custom-youtube-url');
  const loadCustomVideo = document.getElementById('load-custom-video');

  // Set default video
  function setDefaultVideo() {
    try {
      // Check if youtubePlayer exists
      if (!youtubePlayer) {
        throw new Error('YouTube player element not found');
      }

      // Show loading indicator
      const loadingIndicator = document.getElementById('video-loading');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
      }

      // Use a popular lofi hip hop radio stream as default
      const defaultVideoUrl = 'https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&mute=1';

      // Set the src attribute directly
      youtubePlayer.setAttribute('src', defaultVideoUrl);

      // Update the video selector if it exists
      if (videoSelector) {
        videoSelector.value = 'https://www.youtube.com/embed/5qap5aO4i9A';
      }

      // Add event listener to hide loading indicator when video loads
      youtubePlayer.onload = function() {
        if (loadingIndicator) {
          loadingIndicator.style.display = 'none';
        }
      };

      console.log('Default video set successfully:', defaultVideoUrl);
    } catch (error) {
      console.error('Error setting default video:', error);
      // Show error message in the video container
      const videoContainer = document.getElementById('video-container');
      if (videoContainer) {
        videoContainer.innerHTML = `
          <div class="flex items-center justify-center h-full bg-gray-900">
            <div class="text-center">
              <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-2"></i>
              <p class="text-gray-300">Unable to load video player: ${error.message}</p>
            </div>
          </div>
        `;
      }
    }
  }

  // Initialize with default video
  setDefaultVideo();

  // Test buttons for modals - with direct onclick handlers
  console.log('Setting up test buttons');

  const testAssessmentModal = document.getElementById('test-assessment-modal');
  const testRewardsModal = document.getElementById('test-rewards-modal');
  const testRewards100 = document.getElementById('test-rewards-100');

  if (testAssessmentModal) {
    console.log('Test assessment button found, attaching event listener');
    testAssessmentModal.onclick = function() {
      console.log('Test assessment button clicked');
      if (workAssessmentModal) {
        workAssessmentModal.style.display = 'flex';
        console.log('Work assessment modal displayed');
      } else {
        console.error('Work assessment modal not found');
      }
    };
  } else {
    console.error('Test assessment button not found');
  }

  if (testRewardsModal) {
    console.log('Test rewards button found, attaching event listener');
    testRewardsModal.onclick = async function() {
      console.log('Test rewards button clicked');

      // Update stats for testing
      if (completedSessionsDisplay) completedSessionsDisplay.textContent = '1';
      if (focusMinutesDisplay) focusMinutesDisplay.textContent = '25';
      if (productivityScoreDisplay) productivityScoreDisplay.textContent = '75%';

      try {
        // Show loading indicator
        const loadingIndicator = document.getElementById('rewards-loading');
        if (loadingIndicator) {
          loadingIndicator.style.display = 'flex';
        }

        // Generate and display rewards with 75% productivity
        console.log('Generating rewards with 75% productivity');
        const rewards = await generateRewards(25, 75);
        console.log('Generated rewards:', rewards);
        displayRewards(rewards);

        // Show rewards container
        if (rewardsContainer) {
          rewardsContainer.style.display = 'flex';
          console.log('Rewards container displayed');
        } else {
          console.error('Rewards container not found');
        }
      } catch (error) {
        console.error('Error generating or displaying rewards:', error);
        alert('Error generating rewards: ' + error.message);
      }
    };
  } else {
    console.error('Test rewards button not found');
  }

  if (testRewards100) {
    console.log('Test rewards 100 button found, attaching event listener');
    testRewards100.onclick = async function() {
      console.log('Test rewards 100 button clicked');

      // Update stats for testing
      if (completedSessionsDisplay) completedSessionsDisplay.textContent = '2';
      if (focusMinutesDisplay) focusMinutesDisplay.textContent = '50';
      if (productivityScoreDisplay) productivityScoreDisplay.textContent = '100%';

      try {
        // Show loading indicator
        const loadingIndicator = document.getElementById('rewards-loading');
        if (loadingIndicator) {
          loadingIndicator.style.display = 'flex';
        }

        // Generate and display rewards with 100% productivity and longer session
        console.log('Generating rewards with 100% productivity');
        const rewards = await generateRewards(50, 100);
        console.log('Generated rewards:', rewards);
        displayRewards(rewards);

        // Show rewards container
        if (rewardsContainer) {
          rewardsContainer.style.display = 'flex';
          console.log('Rewards container displayed');
        } else {
          console.error('Rewards container not found');
        }
      } catch (error) {
        console.error('Error generating or displaying rewards:', error);
        alert('Error generating rewards: ' + error.message);
      }
    };
  } else {
    console.error('Test rewards 100 button not found');
  }

  // Video selector change handler
  if (videoSelector) {
    videoSelector.addEventListener('change', function() {
      if (this.value) {
        try {
          // Show loading indicator
          const loadingIndicator = document.getElementById('video-loading');
          if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
          }

          // Add autoplay and mute parameters
          const videoUrl = `${this.value}?autoplay=1&mute=1`;

          // Set the src attribute directly
          youtubePlayer.setAttribute('src', videoUrl);

          console.log('Video changed successfully:', videoUrl);
        } catch (error) {
          console.error('Error changing video:', error);
          alert('Error changing video: ' + error.message);
        }
      } else {
        youtubePlayer.setAttribute('src', '');
      }
    });
  }

  // Custom URL handler
  if (loadCustomVideo && customYoutubeUrl) {
    loadCustomVideo.addEventListener('click', function() {
      let url = customYoutubeUrl.value.trim();
      if (url) {
        try {
          // Convert various YouTube URL formats to embed format
          if (url.includes('youtube.com/watch')) {
            // Extract video ID from watch URL
            const videoId = new URLSearchParams(new URL(url).search).get('v');
            if (videoId) {
              url = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
            } else {
              throw new Error('Could not extract video ID from URL');
            }
          } else if (url.includes('youtu.be/')) {
            // Extract video ID from short URL
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) {
              url = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
            } else {
              throw new Error('Could not extract video ID from URL');
            }
          } else if (!url.includes('youtube.com/embed')) {
            // If it's not already an embed URL and doesn't match known patterns
            throw new Error('Please enter a valid YouTube URL');
          } else {
            // It's already an embed URL, just add parameters
            url = `${url}${url.includes('?') ? '&' : '?'}autoplay=1&mute=1`;
          }

          // Show loading indicator
          const loadingIndicator = document.getElementById('video-loading');
          if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
          }

          // Update the video source
          youtubePlayer.setAttribute('src', url);
          console.log('Custom video loaded successfully:', url);

          // Clear the input field
          customYoutubeUrl.value = '';

          // Show success message
          const successMessage = document.createElement('div');
          successMessage.className = 'badge badge-success absolute top-2 right-2 z-10';
          successMessage.textContent = 'Video loaded successfully';
          document.getElementById('video-container').appendChild(successMessage);

          // Remove success message after 3 seconds
          setTimeout(() => {
            successMessage.remove();
          }, 3000);

        } catch (error) {
          console.error('Error loading custom video:', error);
          alert(error.message || 'Error loading video. Please check the URL and try again.');
        }
      }
    });

    // Allow pressing Enter to load the video
    customYoutubeUrl.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        loadCustomVideo.click();
      }
    });
  }

  // Mute toggle handler
  if (muteToggle && volumeIcon) {
    muteToggle.addEventListener('click', function() {
      try {
        // Get current src
        const currentSrc = youtubePlayer.getAttribute('src');
        if (!currentSrc) {
          console.error('No video source found');
          return;
        }

        const isMuted = currentSrc.includes('mute=1');
        let newSrc = currentSrc;

        if (isMuted) {
          // Unmute
          newSrc = newSrc.replace('mute=1', 'mute=0');
          volumeIcon.className = 'fas fa-volume-up';
          console.log('Video unmuted');
        } else {
          // Mute
          newSrc = newSrc.replace('mute=0', 'mute=1');
          volumeIcon.className = 'fas fa-volume-mute';
          console.log('Video muted');
        }

        // Set the new src
        youtubePlayer.setAttribute('src', newSrc);
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    });
  }

  // Expand/collapse video handlers
  if (expandVideo && videoContent) {
    expandVideo.addEventListener('click', function() {
      videoContent.classList.add('fixed', 'inset-0', 'z-50', 'bg-black');
      videoHeader.classList.add('absolute', 'top-0', 'left-0', 'right-0', 'z-10');
      expandVideo.classList.add('hidden');
      collapseVideo.classList.remove('hidden');
    });
  }

  if (collapseVideo && videoContent) {
    collapseVideo.addEventListener('click', function() {
      videoContent.classList.remove('fixed', 'inset-0', 'z-50', 'bg-black');
      videoHeader.classList.remove('absolute', 'top-0', 'left-0', 'right-0', 'z-10');
      expandVideo.classList.remove('hidden');
      collapseVideo.classList.add('hidden');
    });
  }

  // Work assessment buttons - with direct onclick handlers
  console.log('Setting up work assessment buttons');
  const workAssessmentButtons = document.querySelectorAll('.work-assessment-btn');

  console.log('Found work assessment buttons:', workAssessmentButtons.length);

  if (workAssessmentButtons.length > 0) {
    workAssessmentButtons.forEach(button => {
      const productivityValue = button.getAttribute('data-value');
      console.log('Setting up button for productivity value:', productivityValue);

      button.onclick = async function() {
        console.log('Work assessment button clicked:', productivityValue);
        let productivityScore = 0;

        switch(productivityValue) {
          case 'none':
            productivityScore = 0;
            break;
          case 'some':
            productivityScore = 25;
            break;
          case 'most':
            productivityScore = 75;
            break;
          case 'all':
            productivityScore = 100;
            break;
        }

        console.log(`User selected productivity: ${productivityValue} (${productivityScore}%)`);

        // Hide the assessment modal
        if (workAssessmentModal) {
          workAssessmentModal.style.display = 'none';
          console.log('Work assessment modal hidden');
        } else {
          console.error('Work assessment modal not found');
        }

        try {
          // Show rewards based on productivity score
          console.log('Showing rewards with productivity score:', productivityScore);
          await showRewards(productivityScore);
        } catch (error) {
          console.error('Error showing rewards:', error);
          alert('Error generating rewards: ' + error.message);
        }
      };
    });
  } else {
    console.error('No work assessment buttons found');

    // Check if the modal exists and log its content
    if (workAssessmentModal) {
      console.log('Work assessment modal HTML:', workAssessmentModal.innerHTML);
    }
  }

  // Rewards modal controls - with direct onclick handlers
  console.log('Setting up rewards modal buttons');

  if (closeRewardsBtn) {
    console.log('Close rewards button found, attaching event listener');
    closeRewardsBtn.onclick = function() {
      console.log('Close rewards button clicked');

      if (rewardsContainer) {
        rewardsContainer.style.display = 'none';
        console.log('Rewards container hidden');
      } else {
        console.error('Rewards container not found');
      }

      try {
        // Start break timer
        console.log('Starting break timer');
        startBreakTimer();
      } catch (error) {
        console.error('Error starting break timer:', error);
      }
    };
  } else {
    console.error('Close rewards button not found');
  }

  if (claimRewardsBtn) {
    console.log('Claim rewards button found, attaching event listener');
    claimRewardsBtn.onclick = function() {
      console.log('Claim rewards button clicked');

      // Hide the rewards container
      if (rewardsContainer) {
        rewardsContainer.style.display = 'none';
        console.log('Rewards container hidden');
      } else {
        console.error('Rewards container not found');
      }

      try {
        // Show success notification
        console.log('Showing success notification');
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-[1001] animate-fadeIn';
        notification.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Rewards claimed successfully!';
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
          notification.remove();
        }, 3000);

        // Start break timer
        console.log('Starting break timer');
        startBreakTimer();
      } catch (error) {
        console.error('Error processing claim rewards:', error);
      }
    };
  } else {
    console.error('Claim rewards button not found');
  }

  // Timer functions
  function startTimer() {
    if (isPaused) {
      // Resume from pause
      isPaused = false;
      isRunning = true;
      timerStatus.textContent = isBreak ? 'Taking a break...' : 'Focus time!';
    } else if (!isRunning) {
      // Start new timer
      isRunning = true;
      currentSession++;
      updateSessionInfo();
      timerStatus.textContent = isBreak ? 'Taking a break...' : 'Focus time!';

      // Start video if available
      if (videoElement) {
        videoElement.play().catch(e => console.log('Video play error:', e));
      }
    }

    startButton.disabled = true;
    pauseButton.disabled = false;
    resetButton.disabled = false;

    timerInterval = setInterval(updateTimer, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    isPaused = true;
    isRunning = false;
    timerStatus.textContent = 'Paused';
    startButton.disabled = false;
    pauseButton.disabled = true;

    // Pause video if available
    if (videoElement) {
      videoElement.pause();
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    isPaused = false;

    // Reset to focus time
    isBreak = false;
    currentSeconds = focusDuration * 60;
    totalSeconds = currentSeconds;

    updateTimerDisplay();
    timerStatus.textContent = 'Ready to start';
    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = true;

    // Reset video if available
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }

  function updateTimer() {
    currentSeconds--;

    if (currentSeconds <= 0) {
      clearInterval(timerInterval);
      isRunning = false;

      if (!isBreak) {
        // Focus session completed
        if (currentSession < totalSessions) {
          // Show work assessment modal
          if (workAssessmentModal) {
            console.log('Showing work assessment modal');
            workAssessmentModal.style.display = 'flex';
          } else {
            console.error('Work assessment modal not found');
          }
        } else {
          // All sessions completed
          showWorkAssessment();
        }
      } else {
        // Break completed, start next focus session
        isBreak = false;
        currentSeconds = focusDuration * 60;
        totalSeconds = currentSeconds;
        updateTimerDisplay();
        timerStatus.textContent = 'Ready for next session';
        startButton.disabled = false;
        pauseButton.disabled = true;
      }
    }

    updateTimerDisplay();
    updateProgressCircle();
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateSessionInfo() {
    if (sessionInfo) {
      sessionInfo.textContent = `Session ${currentSession}/${totalSessions}`;
    }
  }

  function updateProgressCircle() {
    if (progressCircle) {
      const circumference = 2 * Math.PI * 40; // 2πr where r=40
      const dashOffset = circumference * (1 - (currentSeconds / totalSeconds));
      progressCircle.style.strokeDasharray = circumference;
      progressCircle.style.strokeDashoffset = dashOffset;
    }
  }

  function updateFocusDuration() {
    focusDuration = parseInt(focusDurationInput.value);
    if (!isRunning && !isBreak) {
      currentSeconds = focusDuration * 60;
      totalSeconds = currentSeconds;
      updateTimerDisplay();
      updateProgressCircle();
    }
  }

  function updateBreakDuration() {
    breakDuration = parseInt(breakDurationInput.value);

    // Update timer if currently in break mode and not running
    if (isBreak && !isRunning) {
      currentSeconds = breakDuration * 60;
      totalSeconds = currentSeconds;
      updateTimerDisplay();
      updateProgressCircle();
    }
  }

  function updateTotalSessions() {
    totalSessions = parseInt(numSessionsInput.value);
    updateSessionInfo();
  }

  function showWorkAssessment() {
    if (workAssessmentModal) {
      console.log('Showing work assessment modal for final session');
      workAssessmentModal.style.display = 'flex';
    } else {
      console.error('Work assessment modal not found');
    }
  }

  // Utility function to generate random rewards based on session length and productivity
  async function generateRewards(sessionLength, productivityScore) {
    // Make function available globally
    window.generateRewards = generateRewards;

    try {
      console.log(`Generating rewards with session length: ${sessionLength} and productivity: ${productivityScore}`);

      // Call the server API to generate rewards
      const response = await fetch('/api/game-corner-gen/generate-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionLength,
          productivityScore,
          trainers: window.trainers || trainers || []
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to generate rewards');
      }

      console.log('Server-generated rewards:', data.rewards);
      return data.rewards;
    } catch (error) {
      console.error('Error generating rewards from server:', error);

      // Fallback to a basic rewards structure if server call fails
      console.log('Using fallback rewards generation');
      return {
        levels: [],
        items: [],
        coins: [],
        monsters: [{
          name: 'Mystery Monster',
          type: 'Normal',
          rarity: 'Common',
          isEvolved: false
        }]
      };
    }
  }

  async function showRewards(productivityScore) {
    console.log('Showing rewards with productivity score:', productivityScore);

    // Show loading indicator
    const loadingIndicator = document.getElementById('rewards-loading');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'flex';
    }

    // Update session stats
    if (completedSessionsDisplay) {
      completedSessionsDisplay.textContent = currentSession;
    } else {
      console.error('Completed sessions display element not found');
    }

    if (focusMinutesDisplay) {
      focusMinutesDisplay.textContent = focusDuration * currentSession;
    } else {
      console.error('Focus minutes display element not found');
    }

    if (productivityScoreDisplay) {
      productivityScoreDisplay.textContent = `${productivityScore}%`;
    } else {
      console.error('Productivity score display element not found');
    }

    try {
      // Generate rewards based on session length and productivity
      const sessionLength = focusDuration;
      const rewards = await generateRewards(sessionLength, productivityScore);

      // Display the rewards in the UI
      displayRewards(rewards);

      // Show the rewards container
      const rewardsContainer = document.getElementById('rewards-container');
      if (rewardsContainer) {
        rewardsContainer.style.display = 'flex';
      } else {
        console.error('Rewards container not found');
      }
    } catch (error) {
      console.error('Error showing rewards:', error);

      // Hide loading indicator
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }

      // Show error message to user
      alert('There was an error generating rewards. Please try again.');
    }
  }

  // Function to display rewards in the UI
  function displayRewards(rewards) {
    console.log('displayRewards called with:', rewards);

    // Make function available globally
    window.displayRewards = displayRewards;

    // Get the rewards list element
    const rewardsList = document.getElementById('rewards-list');
    if (!rewardsList) {
      console.error('Rewards list element not found');
      return;
    }

    console.log('Rewards list found, clearing previous content');

    // Hide loading indicator
    const loadingIndicator = document.getElementById('rewards-loading');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    // Clear previous rewards
    rewardsList.innerHTML = '';

    // If no rewards, show a message
    if (!rewards || (rewards.levels.length === 0 && rewards.items.length === 0 &&
        rewards.coins.length === 0 && rewards.monsters.length === 0)) {
      console.log('No rewards to display');
      rewardsList.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-exclamation-circle text-gray-500 text-3xl mb-2"></i>
          <p class="text-gray-400">No rewards earned this time. Try a longer session or higher productivity!</p>
        </div>
      `;
      return;
    }

    // Display level rewards
    if (rewards.levels.length > 0) {
      const levelRewardsSection = document.createElement('div');
      levelRewardsSection.className = 'mb-4';
      levelRewardsSection.innerHTML = `
        <h4 class="text-amber-400 text-sm font-medium mb-2"><i class="fas fa-arrow-up mr-2"></i>Level Ups</h4>
        <div class="grid grid-cols-1 gap-2">
          ${rewards.levels.map(level => `
            <div class="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg p-2 border border-gray-700/50">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded mr-3 bg-green-500/20 flex items-center justify-center">
                  <i class="fas fa-arrow-up text-green-400"></i>
                </div>
                <div>
                  <h5 class="font-medium text-white text-sm">${level.name}</h5>
                  <p class="text-xs text-green-400">+${level.levelIncrease} level${level.levelIncrease > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      rewardsList.appendChild(levelRewardsSection);
    }

    // Display item rewards
    if (rewards.items.length > 0) {
      const itemRewardsSection = document.createElement('div');
      itemRewardsSection.className = 'mb-4';
      itemRewardsSection.innerHTML = `
        <h4 class="text-amber-400 text-sm font-medium mb-2"><i class="fas fa-box mr-2"></i>Items</h4>
        <div class="grid grid-cols-1 gap-2">
          ${rewards.items.map(itemReward => `
            <div class="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg p-2 border border-gray-700/50">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded mr-3 bg-blue-500/20 flex items-center justify-center">
                  <i class="fas fa-box text-blue-400"></i>
                </div>
                <div>
                  <h5 class="font-medium text-white text-sm">${itemReward.item.name}</h5>
                  <p class="text-xs text-gray-400">${itemReward.item.description}</p>
                  <p class="text-xs text-blue-400 mt-1">Given to ${itemReward.trainerName}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      rewardsList.appendChild(itemRewardsSection);
    }

    // Display coin rewards
    if (rewards.coins.length > 0) {
      const coinRewardsSection = document.createElement('div');
      coinRewardsSection.className = 'mb-4';
      coinRewardsSection.innerHTML = `
        <h4 class="text-amber-400 text-sm font-medium mb-2"><i class="fas fa-coins mr-2"></i>Coins</h4>
        <div class="grid grid-cols-1 gap-2">
          ${rewards.coins.map(coin => `
            <div class="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg p-2 border border-gray-700/50">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded mr-3 bg-amber-500/20 flex items-center justify-center">
                  <i class="fas fa-coins text-amber-400"></i>
                </div>
                <div>
                  <h5 class="font-medium text-white text-sm">${coin.amount} coins</h5>
                  <p class="text-xs text-blue-400">Given to ${coin.trainerName}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      rewardsList.appendChild(coinRewardsSection);
    }

    // Display monster encounter rewards
    if (rewards.monsters.length > 0) {
      const monsterEncounterContainer = document.getElementById('monster-encounter-container');
      if (monsterEncounterContainer) {
        monsterEncounterContainer.classList.remove('hidden');
      }

      const monsterEncountersList = document.getElementById('monster-encounters-list');
      if (monsterEncountersList) {
        monsterEncountersList.innerHTML = '';

        rewards.monsters.forEach(monster => {
          const monsterElement = document.createElement('div');
          monsterElement.className = 'bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-3 border border-green-500/20';
          monsterElement.innerHTML = `
            <div class="flex items-center">
              <div class="rounded-lg mr-3 w-12 h-12 bg-green-500/20 flex items-center justify-center">
                <i class="fas fa-dragon text-green-400 text-xl"></i>
              </div>
              <div>
                <h5 class="font-bold text-white">${monster.name}${monster.isEvolved ? ' <span class="text-xs text-green-400">(Evolved!)</span>' : ''}</h5>
                <p class="text-xs text-gray-400">Type: ${monster.type}</p>
                <p class="text-xs ${monster.rarity === 'Legendary' ? 'text-yellow-400' : monster.rarity === 'Mythical' ? 'text-pink-400' : monster.rarity === 'Rare' ? 'text-purple-400' : monster.rarity === 'Uncommon' ? 'text-blue-400' : 'text-gray-400'}">Rarity: ${monster.rarity || 'Common'}</p>
                <div class="mt-2">
                  <button class="bg-green-600 hover:bg-green-500 text-white text-xs py-1 px-3 rounded">
                    <i class="fas fa-plus mr-1"></i> Catch
                  </button>
                </div>
              </div>
            </div>
          `;
          monsterEncountersList.appendChild(monsterElement);
        });
      }

      // Also add to the main rewards list
      const monsterRewardsSection = document.createElement('div');
      monsterRewardsSection.className = 'mb-4';
      monsterRewardsSection.innerHTML = `
        <h4 class="text-amber-400 text-sm font-medium mb-2"><i class="fas fa-dragon mr-2"></i>Monster Encounters</h4>
        <div class="grid grid-cols-1 gap-2">
          ${rewards.monsters.map(monster => `
            <div class="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-2 border border-green-500/20">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded mr-3 bg-green-500/20 flex items-center justify-center">
                  <i class="fas fa-dragon text-green-400"></i>
                </div>
                <div>
                  <h5 class="font-medium text-white text-sm">${monster.name}${monster.isEvolved ? ' <span class="text-xs text-green-400">(Evolved!)</span>' : ''}</h5>
                  <p class="text-xs text-gray-400">Type: ${monster.type}</p>
                  <p class="text-xs ${monster.rarity === 'Legendary' ? 'text-yellow-400' : monster.rarity === 'Mythical' ? 'text-pink-400' : monster.rarity === 'Rare' ? 'text-purple-400' : monster.rarity === 'Uncommon' ? 'text-blue-400' : 'text-gray-400'}">Rarity: ${monster.rarity || 'Common'}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      rewardsList.appendChild(monsterRewardsSection);
    } else {
      // Hide monster encounter container if no monsters
      const monsterEncounterContainer = document.getElementById('monster-encounter-container');
      if (monsterEncounterContainer) {
        monsterEncounterContainer.classList.add('hidden');
      }
    }

    // If no rewards at all, show a message
    if (rewards.levels.length === 0 && rewards.items.length === 0 &&
        rewards.coins.length === 0 && rewards.monsters.length === 0) {
      rewardsList.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-exclamation-circle text-gray-500 text-3xl mb-2"></i>
          <p class="text-gray-400">No rewards earned this time. Try a longer session or higher productivity!</p>
        </div>
      `;
    }
  }

    // Generate rewards based on productivity
    if (rewardsList) {
      rewardsList.innerHTML = '';

      // Sample rewards (in a real app, these would come from the server)
      const rewards = [
        { name: 'Poké Ball', quantity: Math.ceil(productivityScore / 20), image: 'https://via.placeholder.com/40' },
        { name: 'Berries', quantity: Math.ceil(productivityScore / 10), image: 'https://via.placeholder.com/40' }
      ];

      // Add random chance for monster encounter based on productivity
      const monsterChance = productivityScore / 100;
      if (Math.random() < monsterChance) {
        monsterEncounterContainer.classList.remove('hidden');

        // Sample monster encounter (in a real app, this would come from the server)
        const monsterHTML = `
          <div class="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-3 border border-green-500/20">
            <div class="flex items-center">
              <img src="https://via.placeholder.com/60" alt="Monster" class="rounded-lg mr-3">
              <div>
                <h5 class="font-bold text-white">Wild Pikachu</h5>
                <p class="text-xs text-gray-400">Level 5 • Electric</p>
                <div class="mt-2">
                  <button class="bg-green-600 hover:bg-green-500 text-white text-xs py-1 px-3 rounded">
                    <i class="fas fa-plus mr-1"></i> Catch
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        if (monsterEncountersList) {
          monsterEncountersList.innerHTML = monsterHTML;
        }
      } else {
        monsterEncounterContainer.classList.add('hidden');
      }

      // Generate reward HTML
      rewards.forEach(reward => {
        const rewardHTML = `
          <div class="bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-lg p-2 border border-gray-700/50">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded mr-3 bg-amber-500/20 flex items-center justify-center">
                <i class="fas fa-gift text-amber-400"></i>
              </div>
              <div>
                <h5 class="font-medium text-white text-sm">${reward.name}</h5>
                <p class="text-xs text-gray-400">Quantity: ${reward.quantity}</p>
              </div>
            </div>
          </div>
        `;

        rewardsList.innerHTML += rewardHTML;
      });
    }

    // Show rewards modal
    rewardsContainer.style.display = 'flex';

    // Start break timer
    startBreakTimer();
  }

  function startBreakTimer() {
    isBreak = true;
    currentSeconds = breakDuration * 60;
    totalSeconds = currentSeconds;
    updateTimerDisplay();
    updateProgressCircle();
    timerStatus.textContent = 'Break time!';

    // Auto-start break timer
    startTimer();
  }

  // Initialize progress circle
  updateProgressCircle();
});
