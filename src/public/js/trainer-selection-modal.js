/**
 * Trainer Selection Modal
 * 
 * This file contains the code for the trainer selection modal used in the rewards page.
 * It handles showing the modal, selecting a trainer, and submitting the selection.
 */

// Create the trainer selection modal if it doesn't exist
function createTrainerSelectionModal() {
  // Check if modal already exists
  if (document.getElementById('trainer-selection-modal')) {
    return;
  }

  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'trainer-selection-modal';
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 hidden';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';

  // Create modal content
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-purple-500/30">
      <h3 class="text-xl font-bold text-white mb-4">Select Trainer</h3>
      <p class="text-gray-300 text-sm mb-4">Choose which trainer will receive this reward:</p>
      
      <div id="trainer-options" class="max-h-60 overflow-y-auto mb-4 space-y-2">
        <!-- Trainer options will be inserted here -->
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button id="modal-cancel" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
          Cancel
        </button>
        <button id="modal-submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg">
          Confirm
        </button>
      </div>
    </div>
  `;

  // Add modal to the document
  document.body.appendChild(modal);

  // Add event listeners
  document.getElementById('modal-cancel').addEventListener('click', hideTrainerSelectionModal);
  document.getElementById('modal-submit').addEventListener('click', submitTrainerSelection);

  // Close modal when clicking outside
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      hideTrainerSelectionModal();
    }
  });

  return modal;
}

// Show the trainer selection modal
function showTrainerSelectionModal(trainers, callback) {
  // Create modal if it doesn't exist
  const modal = createTrainerSelectionModal();
  
  // Store the callback function
  window.trainerSelectionCallback = callback;
  
  // Get the trainer options container
  const trainerOptions = document.getElementById('trainer-options');
  trainerOptions.innerHTML = '';
  
  // Add trainer options
  trainers.forEach(trainer => {
    const option = document.createElement('div');
    option.className = 'trainer-option p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer';
    option.dataset.trainerId = trainer.id;
    option.innerHTML = `
      <div class="flex items-center">
        <div class="w-6 h-6 mr-3 flex-shrink-0">
          <input type="radio" name="trainer" value="${trainer.id}" id="trainer-${trainer.id}" class="hidden">
          <div class="w-6 h-6 border-2 border-purple-500 rounded-full flex items-center justify-center trainer-radio"></div>
        </div>
        <div>
          <div class="font-medium text-white">${trainer.name}</div>
          <div class="text-xs text-gray-400">Level ${trainer.level || '1'}</div>
        </div>
      </div>
    `;
    
    // Add click event to select this trainer
    option.addEventListener('click', function() {
      // Deselect all other options
      document.querySelectorAll('.trainer-option').forEach(opt => {
        opt.classList.remove('bg-purple-700');
        opt.classList.add('bg-gray-700');
        opt.querySelector('.trainer-radio').classList.remove('bg-purple-500');
      });
      
      // Select this option
      this.classList.remove('bg-gray-700');
      this.classList.add('bg-purple-700');
      this.querySelector('.trainer-radio').classList.add('bg-purple-500');
      
      // Set the selected trainer ID
      window.selectedTrainerId = trainer.id;
    });
    
    trainerOptions.appendChild(option);
  });
  
  // Show the modal
  modal.style.display = 'flex';
  console.log('Showing trainer selection modal');
}

// Hide the trainer selection modal
function hideTrainerSelectionModal() {
  const modal = document.getElementById('trainer-selection-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  console.log('Modal display style: none');
}

// Submit the trainer selection
function submitTrainerSelection() {
  // Get the selected trainer ID
  const selectedTrainerId = window.selectedTrainerId;
  
  // Call the callback function with the selected trainer ID
  if (window.trainerSelectionCallback && selectedTrainerId) {
    window.trainerSelectionCallback(selectedTrainerId);
  } else {
    console.error('No trainer selected or callback not defined');
  }
  
  // Hide the modal
  hideTrainerSelectionModal();
}

// Export functions
window.showTrainerSelectionModal = showTrainerSelectionModal;
window.hideTrainerSelectionModal = hideTrainerSelectionModal;
window.submitTrainerSelection = submitTrainerSelection;
