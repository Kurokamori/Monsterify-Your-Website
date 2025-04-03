// Activity Session JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded, initializing activity session');

  try {
    // Get session data from hidden div
    const sessionData = document.getElementById('session-data');
    if (!sessionData) {
      console.error('Session data element not found');
      return;
    }

    // Store session data for potential API calls
    const sessionInfo = {
      id: sessionData.getAttribute('data-session-id'),
      location: sessionData.getAttribute('data-location'),
      activity: sessionData.getAttribute('data-activity')
    };

    console.log('Session info:', sessionInfo);

    const endTimeStr = sessionData.getAttribute('data-end-time');
    const durationMinutes = parseInt(sessionData.getAttribute('data-duration'));
    const locationId = sessionData.getAttribute('data-location');

    // Add location class to body for styling
    document.body.classList.add(`location-${locationId}`);

    // Timer elements
    const timerDisplay = document.getElementById('timer-display');
    const timerStatus = document.getElementById('timer-status');
    const progressCircle = document.getElementById('progress-circle');
    const endTimeDisplay = document.getElementById('end-time-display');
    const pauseButton = document.getElementById('pause-button');
    const resumeButton = document.getElementById('resume-button');
    const completeButton = document.getElementById('complete-button');

    // Log element status
    console.log('Timer elements:', {
      timerDisplay: timerDisplay ? true : false,
      timerStatus: timerStatus ? true : false,
      progressCircle: progressCircle ? true : false,
      endTimeDisplay: endTimeDisplay ? true : false,
      pauseButton: pauseButton ? true : false,
      resumeButton: resumeButton ? true : false,
      completeButton: completeButton ? true : false
    });

    // Timer state
    let timerInterval;
    let isPaused = false;
    let endTime = new Date(endTimeStr);
    let totalSeconds = durationMinutes * 60;
    let remainingSeconds;

    // Initialize timer
    initializeTimer();

    // Set up event listeners
    if (pauseButton) {
      pauseButton.addEventListener('click', pauseTimer);
    }

    if (resumeButton) {
      resumeButton.addEventListener('click', resumeTimer);
    }

    // Prevent form submission if timer is not complete
    const completeForm = document.getElementById('complete-form');
    if (completeForm) {
      completeForm.addEventListener('submit', function(event) {
    // If timer is still running and not at 0, confirm with user
    if (remainingSeconds > 0) {
      if (!confirm('The timer is still running. Are you sure you want to complete this activity now?')) {
        event.preventDefault();
      }
    }
  });

  // Initialize the timer
  function initializeTimer() {
    console.log('Initializing timer');

    // Format the end time for display
    if (endTimeDisplay) {
      const options = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      };
      endTimeDisplay.textContent = new Date(endTime).toLocaleTimeString([], options);
    }

    // Calculate initial remaining time
    const now = new Date();
    const timeDiff = endTime - now;

    // If time is up or negative, set to 0
    remainingSeconds = Math.max(0, Math.floor(timeDiff / 1000));
    totalSeconds = Math.max(totalSeconds, remainingSeconds); // Ensure totalSeconds is at least as large as remainingSeconds

    console.log('Initial timer values:', {
      remainingSeconds,
      totalSeconds,
      endTime: endTime.toISOString(),
      now: now.toISOString(),
      timeDiff
    });

    // Update the display immediately
    if (timerDisplay) {
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Update progress circle
    updateProgressCircle();

    // Start the timer with a slight delay to ensure DOM is ready
    setTimeout(() => {
      startTimer();
    }, 100);
  }

  // Function to manually refresh the timer (can be called if needed)
  function refreshTimer() {
    const now = new Date();
    const timeDiff = endTime - now;

    // If time is up or negative, set to 0
    remainingSeconds = Math.max(0, Math.floor(timeDiff / 1000));

    // Update the display
    updateTimerDisplay();

    return remainingSeconds;
  }

  // Make the refresh function and session info available globally
  window.activitySession = {
    refreshTimer,
    sessionInfo
  };

  // Update the timer display
  function updateTimerDisplay() {
    console.log('Updating timer display, remaining seconds:', remainingSeconds);

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    // Format as MM:SS
    if (timerDisplay) {
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      console.error('Timer display element not found');
    }

    // Update progress circle
    updateProgressCircle();

    // Update status text
    if (remainingSeconds === 0) {
      if (timerStatus) {
        timerStatus.textContent = 'Time\'s up!';
      }

      if (pauseButton) {
        pauseButton.disabled = true;
        pauseButton.classList.add('opacity-50');
      }

      if (resumeButton) {
        resumeButton.disabled = true;
        resumeButton.classList.add('opacity-50');
      }

      // Highlight the complete button
      if (completeButton) {
        completeButton.classList.add('animate-pulse');
      }
    } else if (isPaused) {
      if (timerStatus) {
        timerStatus.textContent = 'Paused';
      }
    } else {
      if (timerStatus) {
        timerStatus.textContent = 'In progress';
      }
    }
  }

  // Update the progress circle
  function updateProgressCircle() {
    try {
      if (!progressCircle) {
        console.error('Progress circle element not found');
        return;
      }

      const circumference = 2 * Math.PI * 45; // 2πr where r=45
      const progressPercentage = remainingSeconds / totalSeconds;
      const dashOffset = circumference * (1 - progressPercentage);

      // Update the circle
      progressCircle.style.strokeDasharray = `${circumference}`;
      progressCircle.style.strokeDashoffset = `${dashOffset}`;

      console.log('Updated progress circle:', {
        circumference,
        progressPercentage,
        dashOffset,
        remainingSeconds,
        totalSeconds
      });
    } catch (error) {
      console.error('Error updating progress circle:', error);
    }
  }

  // Start the timer
  function startTimer() {
    console.log('Starting timer with remaining seconds:', remainingSeconds);

    // Clear any existing interval
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Enable pause button, disable resume button
    if (pauseButton) {
      pauseButton.disabled = false;
      pauseButton.classList.remove('opacity-50');
    }

    if (resumeButton) {
      resumeButton.disabled = true;
      resumeButton.classList.add('opacity-50');
    }

    // Set timer status
    if (timerStatus) {
      timerStatus.textContent = 'In progress';
    }

    // Only start a new interval if we don't already have one and time isn't up
    if (!timerInterval && remainingSeconds > 0) {
      console.log('Creating new timer interval');

      // Start with an immediate update
      updateTimerDisplay();

      // Start the interval
      timerInterval = setInterval(() => {
        // Decrement the remaining seconds directly
        remainingSeconds = Math.max(0, remainingSeconds - 1);

        // Update the display
        updateTimerDisplay();

        // If time is up, stop the timer
        if (remainingSeconds <= 0) {
          console.log('Timer completed');
          clearInterval(timerInterval);
          timerInterval = null;

          if (timerStatus) {
            timerStatus.textContent = 'Time\'s up!';
          }

          // Disable pause/resume buttons
          if (pauseButton) {
            pauseButton.disabled = true;
            pauseButton.classList.add('opacity-50');
          }

          if (resumeButton) {
            resumeButton.disabled = true;
            resumeButton.classList.add('opacity-50');
          }

          // Call the timer complete handler
          if (typeof handleTimerComplete === 'function') {
            handleTimerComplete();
          }
        }
      }, 1000);
    } else {
      console.log('Not starting timer interval:', {
        hasInterval: !!timerInterval,
        remainingSeconds
      });
    }
  }

  // Pause the timer
  function pauseTimer() {
    clearInterval(timerInterval);
    isPaused = true;

    // Update button states
    pauseButton.disabled = true;
    pauseButton.classList.add('opacity-50');
    resumeButton.disabled = false;
    resumeButton.classList.remove('opacity-50');

    // Update status
    timerStatus.textContent = 'Paused';
  }

  // Resume the timer
  function resumeTimer() {
    isPaused = false;
    startTimer();
  }

  // Add visual feedback when timer is complete
  function handleTimerComplete() {
    // Add pulse animation to complete button
    completeButton.classList.add('animate-pulse');

    // Change button color to make it more noticeable
    completeButton.classList.add('bg-green-600');
    completeButton.classList.remove('bg-yellow-600');
    completeButton.classList.add('hover:bg-green-700');
    completeButton.classList.remove('hover:bg-yellow-700');

    // Add a glow effect
    completeButton.classList.add('shadow-green-glow');

    // Update button text
    const buttonContent = completeButton.querySelector('span:last-child') || completeButton;
    buttonContent.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Complete Activity Now!';

    // Add a confetti effect
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'absolute inset-0 overflow-hidden pointer-events-none';
    confettiContainer.innerHTML = `
      <div class="confetti-piece"></div>
      <div class="confetti-piece"></div>
      <div class="confetti-piece"></div>
      <div class="confetti-piece"></div>
      <div class="confetti-piece"></div>
      <div class="confetti-piece"></div>
      <div class="confetti-piece"></div>
      <div class="confetti-piece"></div>
      <div class="confetti-piece"></div>
      <div class="confetti-piece"></div>
    `;
    completeButton.appendChild(confettiContainer);

    // Add confetti animation styles
    const style = document.createElement('style');
    style.textContent = `
      .confetti-piece {
        position: absolute;
        width: 10px;
        height: 10px;
        background: #fbbf24;
        top: 0;
        opacity: 0;
      }
      .confetti-piece:nth-child(1) {
        left: 10%;
        transform: rotate(15deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 182ms;
        animation-duration: 1116ms;
      }
      .confetti-piece:nth-child(2) {
        left: 20%;
        transform: rotate(90deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 161ms;
        animation-duration: 1076ms;
      }
      .confetti-piece:nth-child(3) {
        left: 30%;
        transform: rotate(176deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 481ms;
        animation-duration: 1103ms;
      }
      .confetti-piece:nth-child(4) {
        left: 40%;
        transform: rotate(40deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 334ms;
        animation-duration: 1091ms;
      }
      .confetti-piece:nth-child(5) {
        left: 50%;
        transform: rotate(115deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 385ms;
        animation-duration: 1042ms;
      }
      .confetti-piece:nth-child(6) {
        left: 60%;
        transform: rotate(176deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 360ms;
        animation-duration: 1116ms;
      }
      .confetti-piece:nth-child(7) {
        left: 70%;
        transform: rotate(19deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 241ms;
        animation-duration: 1076ms;
      }
      .confetti-piece:nth-child(8) {
        left: 80%;
        transform: rotate(10deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 505ms;
        animation-duration: 1103ms;
      }
      .confetti-piece:nth-child(9) {
        left: 90%;
        transform: rotate(74deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 152ms;
        animation-duration: 1091ms;
      }
      .confetti-piece:nth-child(10) {
        left: 100%;
        transform: rotate(120deg);
        animation: makeItRain 1000ms infinite ease-out;
        animation-delay: 391ms;
        animation-duration: 1042ms;
      }
      @keyframes makeItRain {
        from {
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        to {
          transform: translateY(350px);
        }
      }
    `;
    document.head.appendChild(style);

    // Add a notification sound if browser supports it
    try {
      const audio = new Audio('/sounds/complete.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  // Add a notification sound if browser supports it
  function playNotificationSound() {
    try {
      const audio = new Audio('/sounds/complete.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  } catch (error) {
    console.error('Error in activity session initialization:', error);
  }
});
