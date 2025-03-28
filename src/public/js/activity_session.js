// Activity Session JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Get session data from hidden div
  const sessionData = document.getElementById('session-data');
  const sessionId = sessionData.getAttribute('data-session-id');
  const endTimeStr = sessionData.getAttribute('data-end-time');
  const durationMinutes = parseInt(sessionData.getAttribute('data-duration'));
  
  // Timer elements
  const timerDisplay = document.getElementById('timer-display');
  const timerStatus = document.getElementById('timer-status');
  const progressCircle = document.getElementById('progress-circle');
  const endTimeDisplay = document.getElementById('end-time-display');
  const pauseButton = document.getElementById('pause-timer');
  const resumeButton = document.getElementById('resume-timer');
  const completeButton = document.getElementById('complete-task');
  
  // Timer state
  let timerInterval;
  let isPaused = false;
  let endTime = new Date(endTimeStr);
  let totalSeconds = durationMinutes * 60;
  let remainingSeconds;
  
  // Initialize timer
  initializeTimer();
  
  // Set up event listeners
  pauseButton.addEventListener('click', pauseTimer);
  resumeButton.addEventListener('click', resumeTimer);
  completeButton.addEventListener('click', completeTask);
  
  // Initialize the timer
  function initializeTimer() {
    // Format the end time for display
    const options = { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true
    };
    endTimeDisplay.textContent = new Date(endTime).toLocaleTimeString([], options);
    
    // Calculate remaining time
    updateRemainingTime();
    
    // Start the timer
    startTimer();
  }
  
  // Update the remaining time
  function updateRemainingTime() {
    const now = new Date();
    const timeDiff = endTime - now;
    
    // If time is up or negative, set to 0
    remainingSeconds = Math.max(0, Math.floor(timeDiff / 1000));
    
    // Update the display
    updateTimerDisplay();
  }
  
  // Update the timer display
  function updateTimerDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    // Format as MM:SS
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update progress circle
    updateProgressCircle();
    
    // Update status text
    if (remainingSeconds === 0) {
      timerStatus.textContent = 'Time\'s up!';
      pauseButton.disabled = true;
      pauseButton.classList.add('opacity-50');
      resumeButton.disabled = true;
      resumeButton.classList.add('opacity-50');
      
      // Highlight the complete button
      completeButton.classList.add('animate-pulse');
    } else if (isPaused) {
      timerStatus.textContent = 'Paused';
    } else {
      timerStatus.textContent = 'In progress';
    }
  }
  
  // Update the progress circle
  function updateProgressCircle() {
    const circumference = 2 * Math.PI * 45; // 2πr where r=45
    const progressPercentage = remainingSeconds / totalSeconds;
    const dashOffset = circumference * (1 - progressPercentage);
    
    // Update the circle
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = dashOffset;
  }
  
  // Start the timer
  function startTimer() {
    // Clear any existing interval
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Enable pause button, disable resume button
    pauseButton.disabled = false;
    pauseButton.classList.remove('opacity-50');
    resumeButton.disabled = true;
    resumeButton.classList.add('opacity-50');
    
    // Set timer status
    timerStatus.textContent = 'In progress';
    
    // Start the interval
    timerInterval = setInterval(() => {
      updateRemainingTime();
      
      // If time is up, stop the timer
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerStatus.textContent = 'Time\'s up!';
        
        // Disable pause/resume buttons
        pauseButton.disabled = true;
        pauseButton.classList.add('opacity-50');
        resumeButton.disabled = true;
        resumeButton.classList.add('opacity-50');
        
        // Highlight the complete button
        completeButton.classList.add('animate-pulse');
      }
    }, 1000);
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
  
  // Complete the task
  async function completeTask() {
    try {
      // Disable the button to prevent multiple clicks
      completeButton.disabled = true;
      completeButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
      
      // Call the API to complete the task
      const response = await fetch('/town/visit/complete-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to the rewards page
        window.location.href = data.redirect;
      } else {
        // Show error and re-enable button
        alert(data.message || 'Error completing task. Please try again.');
        completeButton.disabled = false;
        completeButton.innerHTML = '<i class="fas fa-check-circle mr-2"></i> I\'ve Completed This Task';
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Network error. Please try again.');
      completeButton.disabled = false;
      completeButton.innerHTML = '<i class="fas fa-check-circle mr-2"></i> I\'ve Completed This Task';
    }
  }
});
