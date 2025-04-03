/**
 * Modern Inputs - JavaScript for enhancing input field functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  // Apply modern input styling to all text input elements
  applyModernInputStyling();
  
  // Initialize file inputs
  initializeFileInputs();
  
  // Initialize input with icons
  initializeInputsWithIcons();
  
  // Initialize input with buttons
  initializeInputsWithButtons();
});

/**
 * Apply modern input styling to all text input elements
 */
function applyModernInputStyling() {
  // Find all text input elements that don't already have the modern-input class
  const inputSelectors = [
    'input[type="text"]:not(.modern-input):not([class*="CodeMirror"])',
    'input[type="email"]:not(.modern-input)',
    'input[type="password"]:not(.modern-input)',
    'input[type="search"]:not(.modern-input)',
    'input[type="url"]:not(.modern-input)',
    'input[type="number"]:not(.modern-input)',
    'textarea:not(.modern-input):not([class*="CodeMirror"])'
  ];
  
  const inputElements = document.querySelectorAll(inputSelectors.join(', '));
  
  inputElements.forEach(input => {
    // Skip inputs that are part of special components or libraries
    if (input.closest('.CodeMirror') || 
        input.closest('.ql-editor') || 
        input.closest('.flatpickr-calendar') ||
        input.closest('.select2-container')) {
      return;
    }
    
    // Add the modern-input class
    input.classList.add('modern-input');
  });
}

/**
 * Initialize file inputs with custom styling
 */
function initializeFileInputs() {
  const fileInputs = document.querySelectorAll('input[type="file"]:not(.initialized-file-input)');
  
  fileInputs.forEach(fileInput => {
    // Mark as initialized
    fileInput.classList.add('initialized-file-input');
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'modern-file-input';
    fileInput.parentNode.insertBefore(wrapper, fileInput);
    
    // Create label
    const label = document.createElement('div');
    label.className = 'modern-file-input-label';
    
    // Create icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-upload modern-file-input-icon';
    
    // Create text
    const text = document.createElement('span');
    text.textContent = fileInput.getAttribute('data-label') || 'Choose a file';
    
    // Assemble label
    label.appendChild(icon);
    label.appendChild(text);
    wrapper.appendChild(label);
    
    // Move file input to wrapper
    wrapper.appendChild(fileInput);
    
    // Update label text when file is selected
    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        if (this.files.length === 1) {
          text.textContent = this.files[0].name;
        } else {
          text.textContent = `${this.files.length} files selected`;
        }
      } else {
        text.textContent = fileInput.getAttribute('data-label') || 'Choose a file';
      }
    });
  });
}

/**
 * Initialize inputs with icons
 */
function initializeInputsWithIcons() {
  const inputsWithIcons = document.querySelectorAll('.modern-input-with-icon:not(.initialized-input-with-icon)');
  
  inputsWithIcons.forEach(container => {
    // Mark as initialized
    container.classList.add('initialized-input-with-icon');
    
    // Find the input and icon
    const input = container.querySelector('input');
    const iconElement = container.querySelector('.input-icon');
    
    // If no icon element exists but there's an icon attribute, create the icon
    if (!iconElement && input && input.getAttribute('data-icon')) {
      const icon = document.createElement('i');
      icon.className = `${input.getAttribute('data-icon')} input-icon`;
      container.insertBefore(icon, input);
    }
    
    // Add modern-input class to the input if it doesn't have it
    if (input && !input.classList.contains('modern-input')) {
      input.classList.add('modern-input');
    }
  });
}

/**
 * Initialize inputs with buttons
 */
function initializeInputsWithButtons() {
  const inputsWithButtons = document.querySelectorAll('.modern-input-with-button:not(.initialized-input-with-button)');
  
  inputsWithButtons.forEach(container => {
    // Mark as initialized
    container.classList.add('initialized-input-with-button');
    
    // Find the input and button
    const input = container.querySelector('input');
    const buttonElement = container.querySelector('.input-button');
    
    // If no button element exists but there's a button attribute, create the button
    if (!buttonElement && input && input.getAttribute('data-button')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'input-button';
      button.innerHTML = input.getAttribute('data-button');
      
      // Add click handler if provided
      if (input.getAttribute('data-button-action')) {
        const actionName = input.getAttribute('data-button-action');
        if (typeof window[actionName] === 'function') {
          button.addEventListener('click', function() {
            window[actionName](input);
          });
        }
      }
      
      container.appendChild(button);
    }
    
    // Add modern-input class to the input if it doesn't have it
    if (input && !input.classList.contains('modern-input')) {
      input.classList.add('modern-input');
    }
  });
}

/**
 * Create a custom file input
 * @param {HTMLInputElement} fileInput - The file input element to enhance
 */
function createCustomFileInput(fileInput) {
  // Mark as initialized
  fileInput.classList.add('initialized-file-input');
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'modern-file-input';
  fileInput.parentNode.insertBefore(wrapper, fileInput);
  
  // Create label
  const label = document.createElement('div');
  label.className = 'modern-file-input-label';
  
  // Create icon
  const icon = document.createElement('i');
  icon.className = 'fas fa-upload modern-file-input-icon';
  
  // Create text
  const text = document.createElement('span');
  text.textContent = fileInput.getAttribute('data-label') || 'Choose a file';
  
  // Assemble label
  label.appendChild(icon);
  label.appendChild(text);
  wrapper.appendChild(label);
  
  // Move file input to wrapper
  wrapper.appendChild(fileInput);
  
  // Update label text when file is selected
  fileInput.addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
      if (this.files.length === 1) {
        text.textContent = this.files[0].name;
      } else {
        text.textContent = `${this.files.length} files selected`;
      }
    } else {
      text.textContent = fileInput.getAttribute('data-label') || 'Choose a file';
    }
  });
  
  return wrapper;
}

// Export functions for global use
window.ModernInputs = {
  applyModernInputStyling,
  initializeFileInputs,
  initializeInputsWithIcons,
  initializeInputsWithButtons,
  createCustomFileInput
};
