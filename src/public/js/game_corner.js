// Game Corner JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Timer functionality
  let timerInterval;
  let timerDuration = 25 * 60; // Default duration in seconds (25 minutes)
  let breakDuration = 5 * 60; // Default break duration in seconds (5 minutes)
  let remainingTime = timerDuration;
  let isTimerRunning = false;
  let sessionCount = 1;
  let totalSessions = 4;
  let timerMode = 'work'; // 'work' or 'break'

  // Initialize timer display
  updateTimerDisplay();
  updateProgressCircle();
  updateTimerStatus('Ready to start');
  updateTimerModeIndicator();
  document.getElementById('total-sessions').textContent = totalSessions;

  // Initialize button states
  document.getElementById('pause-timer').disabled = true;
  document.getElementById('reset-timer').disabled = true;

  // Ensure the progress circle is visible on load
  const progressCircle = document.getElementById('progress-circle');
  if (progressCircle) {
    progressCircle.setAttribute('stroke', '#8b5cf6');
    progressCircle.setAttribute('stroke-dashoffset', '0');
    progressCircle.style.filter = 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))';
  }

  function startTimerGlobal() {
    if (isTimerRunning) return;

    isTimerRunning = true;
    updateTimerStatus('Running');
    document.getElementById('start-timer').disabled = true;
    document.getElementById('pause-timer').disabled = false;
    document.getElementById('reset-timer').disabled = false;

    timerInterval = setInterval(() => {
      if (remainingTime > 0) {
        remainingTime--;
        updateTimerDisplay();
        updateProgressCircle();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;

        // Handle session completion
        if (timerMode === 'work') {
          // Switch to break mode if not the last session
          if (sessionCount < totalSessions) {
            timerMode = 'break';
            remainingTime = breakDuration;
            updateTimerDisplay();
            updateProgressCircle();
            updateTimerStatus('Break time');
            updateTimerModeIndicator();
            document.getElementById('session-info').textContent = `Break ${sessionCount}`;
          } else {
            // Last session completed
            updateTimerStatus('All sessions complete!');
            // Store session data for rewards
            window.completedSessions = sessionCount;
            window.totalFocusMinutes = timerDuration / 60 * sessionCount;
            // Show productivity assessment
            showProductivityAssessment();
          }
        } else if (timerMode === 'break') {
          // Switch back to work mode and increment session
          timerMode = 'work';
          sessionCount++;
          document.getElementById('session-count').textContent = sessionCount;
          document.getElementById('session-info').textContent = `Session ${sessionCount}`;
          remainingTime = timerDuration;
          updateTimerDisplay();
          updateProgressCircle();
          updateTimerModeIndicator();
          updateTimerStatus('Ready to start next session');
        }

        alert("Time's up!");
      }
    }, 1000);
  }

  function pauseTimerGlobal() {
    if (!isTimerRunning) return;

    clearInterval(timerInterval);
    isTimerRunning = false;
    updateTimerStatus('Paused');
    document.getElementById('start-timer').disabled = false;
    document.getElementById('pause-timer').disabled = true;
  }

  function resetTimerGlobal() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerMode = 'work';
    remainingTime = timerDuration;
    updateTimerDisplay();
    updateProgressCircle();
    updateTimerModeIndicator();
    updateTimerStatus('Reset');
    document.getElementById('start-timer').disabled = false;
    document.getElementById('pause-timer').disabled = true;
    document.getElementById('reset-timer').disabled = true;
    document.getElementById('session-info').textContent = `Session ${sessionCount}`;
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const timerDisplay = document.getElementById("timer-display");
    if (timerDisplay) {
      timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
  }

  function updateProgressCircle() {
    const progressCircle = document.getElementById('progress-circle');
    if (progressCircle) {
      const circumference = 2 * Math.PI * 45; // 2πr where r=45
      let maxDuration = timerMode === 'work' ? timerDuration : breakDuration;
      const offset = circumference - (remainingTime / maxDuration) * circumference;
      progressCircle.setAttribute('stroke-dasharray', `${circumference} ${circumference}`);
      progressCircle.setAttribute('stroke-dashoffset', offset);

      // Change color based on timer mode
      if (timerMode === 'work') {
        progressCircle.setAttribute('stroke', '#8b5cf6'); // Purple for work sessions
        progressCircle.style.filter = 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))';
      } else {
        progressCircle.setAttribute('stroke', '#10B981'); // Green for break sessions
        progressCircle.style.filter = 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))';
      }
    }
  }

  function updateTimerStatus(status) {
    const timerStatus = document.getElementById('timer-status');
    if (timerStatus) {
      timerStatus.textContent = status;
    }
  }

  function updateTimerModeIndicator() {
    const modeIndicator = document.getElementById('timer-mode-indicator');
    if (modeIndicator) {
      if (timerMode === 'work') {
        modeIndicator.textContent = 'Work';
        modeIndicator.className = 'text-xxs block mt-1 badge badge-primary';
      } else {
        modeIndicator.textContent = 'Break';
        modeIndicator.className = 'text-xxs block mt-1 badge badge-success';
      }
    }
  }

  // Function to show productivity assessment and redirect to rewards page
  function showProductivityAssessment() {
    // Create a modal for productivity assessment
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black/70';
    modal.id = 'productivity-assessment-modal';

    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transform transition-all scale-95">
        <h3 class="text-xl font-bold text-white mb-4 text-center">How productive was your session?</h3>
        <p class="text-gray-300 mb-6 text-center">Rate your productivity to calculate your rewards</p>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <button class="productivity-btn bg-gray-700 hover:bg-gray-600 text-white py-4 px-4 rounded-lg flex flex-col items-center" data-value="25">
            <i class="fas fa-thumbs-down text-red-500 text-2xl mb-2"></i>
            <span>Not Productive</span>
          </button>
          <button class="productivity-btn bg-gray-700 hover:bg-gray-600 text-white py-4 px-4 rounded-lg flex flex-col items-center" data-value="50">
            <i class="fas fa-meh text-yellow-500 text-2xl mb-2"></i>
            <span>Somewhat Productive</span>
          </button>
          <button class="productivity-btn bg-gray-700 hover:bg-gray-600 text-white py-4 px-4 rounded-lg flex flex-col items-center" data-value="75">
            <i class="fas fa-smile text-blue-500 text-2xl mb-2"></i>
            <span>Productive</span>
          </button>
          <button class="productivity-btn bg-gray-700 hover:bg-gray-600 text-white py-4 px-4 rounded-lg flex flex-col items-center" data-value="100">
            <i class="fas fa-thumbs-up text-green-500 text-2xl mb-2"></i>
            <span>Very Productive</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add animation to modal
    setTimeout(() => {
      const modalContent = modal.querySelector('.bg-gray-800');
      if (modalContent) {
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
      }
    }, 10);

    // Add event listeners to productivity buttons
    const productivityBtns = modal.querySelectorAll('.productivity-btn');
    productivityBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const productivityValue = parseInt(this.getAttribute('data-value'));

        // Redirect to rewards page with session data
        window.location.href = `/town/rewards?sessions=${window.completedSessions}&minutes=${window.totalFocusMinutes}&productivity=${productivityValue}&source=game_corner&pageTitle=Pomodoro+Session+Complete!&returnUrl=/town/game_corner&returnButtonText=New+Session&allowTrainerSelection=false&showClaimAllButton=false`;
      });
    });
  }

  // Duration adjustment functions
  window.incrementDuration = function () {
    const durationInput = document.getElementById('timer-duration');
    let newDuration = parseInt(durationInput.value) + 1;
    if (newDuration > 60) newDuration = 60;
    durationInput.value = newDuration;
    timerDuration = newDuration * 60;
    if (!isTimerRunning && timerMode === 'work') {
      remainingTime = timerDuration;
      updateTimerDisplay();
      updateProgressCircle();
    }
  };

  window.decrementDuration = function () {
    const durationInput = document.getElementById('timer-duration');
    let newDuration = parseInt(durationInput.value) - 1;
    if (newDuration < 1) newDuration = 1;
    durationInput.value = newDuration;
    timerDuration = newDuration * 60;
    if (!isTimerRunning && timerMode === 'work') {
      remainingTime = timerDuration;
      updateTimerDisplay();
      updateProgressCircle();
    }
  };

  // Break duration adjustment functions
  window.incrementBreakDuration = function () {
    const breakDurationInput = document.getElementById('break-duration');
    let newDuration = parseInt(breakDurationInput.value) + 1;
    if (newDuration > 30) newDuration = 30;
    breakDurationInput.value = newDuration;
    breakDuration = newDuration * 60;
    if (!isTimerRunning && timerMode === 'break') {
      remainingTime = breakDuration;
      updateTimerDisplay();
      updateProgressCircle();
    }
  };

  window.decrementBreakDuration = function () {
    const breakDurationInput = document.getElementById('break-duration');
    let newDuration = parseInt(breakDurationInput.value) - 1;
    if (newDuration < 1) newDuration = 1;
    breakDurationInput.value = newDuration;
    breakDuration = newDuration * 60;
    if (!isTimerRunning && timerMode === 'break') {
      remainingTime = breakDuration;
      updateTimerDisplay();
      updateProgressCircle();
    }
  };

  // Session count adjustment functions
  window.incrementSessionCount = function () {
    const sessionCountInput = document.getElementById('session-count-input');
    let newCount = parseInt(sessionCountInput.value) + 1;
    if (newCount > 10) newCount = 10;
    sessionCountInput.value = newCount;
    totalSessions = newCount;
    document.getElementById('total-sessions').textContent = totalSessions;
  };

  window.decrementSessionCount = function () {
    const sessionCountInput = document.getElementById('session-count-input');
    let newCount = parseInt(sessionCountInput.value) - 1;
    if (newCount < 1) newCount = 1;
    sessionCountInput.value = newCount;
    totalSessions = newCount;
    document.getElementById('total-sessions').textContent = totalSessions;
  };

  window.updateSessionCount = function () {
    const sessionCountInput = document.getElementById('session-count-input');
    let newCount = parseInt(sessionCountInput.value);
    if (newCount < 1) newCount = 1;
    if (newCount > 10) newCount = 10;
    sessionCountInput.value = newCount;
    totalSessions = newCount;
    document.getElementById('total-sessions').textContent = totalSessions;
  };

  // Video player functionality
  function loadVideo(videoId) {
    const videoContainer = document.getElementById("video-container");
    if (videoContainer) {
      videoContainer.innerHTML = `
        <iframe
          id="youtube-player"
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&enablejsapi=1&origin=${window.location.origin}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;

      // Initialize video time display
      setTimeout(() => {
        updateVideoTimeDisplay();
        // Set up interval to update time display
        setInterval(updateVideoTimeDisplay, 1000);
      }, 2000); // Give the iframe time to load
    }
  }

  // Update video time display
  function updateVideoTimeDisplay() {
    const youtubePlayer = document.getElementById('youtube-player');
    const videoTimeDisplay = document.querySelector('.video-time');

    if (youtubePlayer && youtubePlayer.contentWindow && videoTimeDisplay) {
      try {
        // Try to get current time and duration
        youtubePlayer.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'getCurrentTime',
          args: []
        }), '*');

        youtubePlayer.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'getDuration',
          args: []
        }), '*');

        // This is a fallback since the YouTube API might not respond properly
        // In a real implementation, you'd use the YouTube API event listeners
        videoTimeDisplay.textContent = '00:00 / 00:00';
      } catch (e) {
        console.error('Error updating video time:', e);
      }
    }
  }

  // Video player controls
  const videoSelector = document.getElementById('video-selector');
  if (videoSelector) {
    videoSelector.addEventListener('change', function () {
      loadVideo(this.value);
    });

    // Load initial video
    if (videoSelector.value) {
      loadVideo(videoSelector.value);
    }
  }

  // Custom video URL loading
  const loadCustomVideoBtn = document.getElementById('load-custom-video');
  if (loadCustomVideoBtn) {
    loadCustomVideoBtn.addEventListener('click', function () {
      const customVideoUrl = document.getElementById('custom-video-url').value.trim();
      if (customVideoUrl) {
        // Extract video ID if full URL is provided
        let videoId = customVideoUrl;

        // Check if it's a full YouTube URL and extract the ID
        if (customVideoUrl.includes('youtube.com/watch?v=')) {
          const urlParams = new URLSearchParams(new URL(customVideoUrl).search);
          videoId = urlParams.get('v');
        } else if (customVideoUrl.includes('youtu.be/')) {
          videoId = customVideoUrl.split('youtu.be/')[1].split('?')[0];
        }

        if (videoId) {
          loadVideo(videoId);
        } else {
          alert('Invalid YouTube URL or ID');
        }
      } else {
        alert('Please enter a YouTube video URL or ID');
      }
    });
  }

  // Volume control
  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', function () {
      const youtubePlayer = document.getElementById('youtube-player');
      if (youtubePlayer && youtubePlayer.contentWindow) {
        try {
          youtubePlayer.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [this.value]
          }), '*');

          // Update volume icon
          const volumeIcon = document.getElementById('volume-icon');
          if (volumeIcon) {
            if (this.value == 0) {
              volumeIcon.className = 'fas fa-volume-mute';
            } else if (this.value < 50) {
              volumeIcon.className = 'fas fa-volume-down';
            } else {
              volumeIcon.className = 'fas fa-volume-up';
            }
          }
        } catch (e) {
          console.error('Error setting volume:', e);
        }
      }
    });
  }

  // Play/Pause video
  const playPauseBtn = document.getElementById('play-pause-video');
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', function () {
      const youtubePlayer = document.getElementById('youtube-player');
      if (youtubePlayer && youtubePlayer.contentWindow) {
        try {
          const icon = this.querySelector('i');
          if (icon.classList.contains('fa-play')) {
            youtubePlayer.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'playVideo',
              args: []
            }), '*');
            icon.classList.replace('fa-play', 'fa-pause');
          } else {
            youtubePlayer.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'pauseVideo',
              args: []
            }), '*');
            icon.classList.replace('fa-pause', 'fa-play');
          }
        } catch (e) {
          console.error('Error controlling video:', e);
        }
      }
    });
  }

  // Expand/Collapse video
  const expandBtn = document.getElementById('expand-video');
  const collapseBtn = document.getElementById('collapse-video');
  const videoContent = document.getElementById('video-content');

  if (expandBtn && collapseBtn && videoContent) {
    expandBtn.addEventListener('click', function () {
      videoContent.classList.add('expanded');
      videoContent.style.position = 'fixed';
      videoContent.style.top = '0';
      videoContent.style.left = '0';
      videoContent.style.width = '100vw';
      videoContent.style.height = '100vh';
      videoContent.style.zIndex = '9999';
      videoContent.style.backgroundColor = '#000';
      expandBtn.classList.add('hidden');
      collapseBtn.classList.remove('hidden');
    });

    collapseBtn.addEventListener('click', function () {
      videoContent.classList.remove('expanded');
      videoContent.style.position = '';
      videoContent.style.top = '';
      videoContent.style.left = '';
      videoContent.style.width = '';
      videoContent.style.height = '';
      videoContent.style.zIndex = '';
      videoContent.style.backgroundColor = '';
      expandBtn.classList.remove('hidden');
      collapseBtn.classList.add('hidden');
    });
  }

  // Event listeners for timer controls
  const startTimerBtn = document.getElementById("start-timer");
  const pauseTimerBtn = document.getElementById("pause-timer");
  const resetTimerBtn = document.getElementById("reset-timer");

  if (startTimerBtn) startTimerBtn.addEventListener("click", startTimerGlobal);
  if (pauseTimerBtn) pauseTimerBtn.addEventListener("click", pauseTimerGlobal);
  if (resetTimerBtn) resetTimerBtn.addEventListener("click", resetTimerGlobal);

  // Make timer functions globally accessible
  window.startTimer = startTimerGlobal;
  window.pauseTimer = pauseTimerGlobal;
  window.resetTimer = resetTimerGlobal;
  window.startTimerGlobal = startTimerGlobal;
  window.pauseTimerGlobal = pauseTimerGlobal;
  window.resetTimerGlobal = resetTimerGlobal;

  // Add event listeners for duration adjustment buttons
  const decrementDurationBtn = document.getElementById('decrement-duration');
  const incrementDurationBtn = document.getElementById('increment-duration');
  const decrementBreakDurationBtn = document.getElementById('decrement-break-duration');
  const incrementBreakDurationBtn = document.getElementById('increment-break-duration');
  const decrementSessionCountBtn = document.getElementById('decrement-session-count');
  const incrementSessionCountBtn = document.getElementById('increment-session-count');
  const sessionCountInput = document.getElementById('session-count-input');

  if (decrementDurationBtn) decrementDurationBtn.addEventListener('click', window.decrementDuration);
  if (incrementDurationBtn) incrementDurationBtn.addEventListener('click', window.incrementDuration);
  if (decrementBreakDurationBtn) decrementBreakDurationBtn.addEventListener('click', window.decrementBreakDuration);
  if (incrementBreakDurationBtn) incrementBreakDurationBtn.addEventListener('click', window.incrementBreakDuration);
  if (decrementSessionCountBtn) decrementSessionCountBtn.addEventListener('click', window.decrementSessionCount);
  if (incrementSessionCountBtn) incrementSessionCountBtn.addEventListener('click', window.incrementSessionCount);
  if (sessionCountInput) sessionCountInput.addEventListener('change', window.updateSessionCount);

  // Add keyboard shortcuts
  document.addEventListener('keydown', function (event) {
    // Space bar to start/pause timer
    if (event.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      event.preventDefault(); // Prevent scrolling
      if (isTimerRunning) {
        pauseTimerGlobal();
      } else {
        startTimerGlobal();
      }
    }

    // 'R' key to reset timer
    if (event.code === 'KeyR' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      resetTimerGlobal();
    }
  });
});
