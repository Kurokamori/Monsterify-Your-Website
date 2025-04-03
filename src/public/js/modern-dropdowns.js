/**
 * Modern Dropdowns - JavaScript for custom dropdown functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  // Apply modern select styling to all select elements
  applyModernSelectStyling();
  
  // Initialize custom dropdowns
  initializeCustomDropdowns();
  
  // Handle window clicks to close dropdowns when clicking outside
  handleWindowClicks();
});

/**
 * Apply modern select styling to all select elements
 */
function applyModernSelectStyling() {
  // Find all select elements that don't already have the modern-select class
  const selectElements = document.querySelectorAll('select:not(.modern-select)');
  
  selectElements.forEach(select => {
    // Add the modern-select class
    select.classList.add('modern-select');
  });
}

/**
 * Initialize custom dropdowns
 */
function initializeCustomDropdowns() {
  // Find all elements with the modern-dropdown class
  const dropdowns = document.querySelectorAll('.modern-dropdown');
  
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.modern-dropdown-toggle');
    const menu = dropdown.querySelector('.modern-dropdown-menu');
    const items = dropdown.querySelectorAll('.modern-dropdown-item');
    const valueDisplay = dropdown.querySelector('.modern-dropdown-value');
    const hiddenInput = dropdown.querySelector('input[type="hidden"]');
    
    if (!toggle || !menu) return;
    
    // Toggle dropdown when clicking the toggle button
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Close all other dropdowns
      document.querySelectorAll('.modern-dropdown.open').forEach(openDropdown => {
        if (openDropdown !== dropdown) {
          openDropdown.classList.remove('open');
        }
      });
      
      // Toggle this dropdown
      dropdown.classList.toggle('open');
    });
    
    // Handle item selection
    items.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get the value and text
        const value = this.dataset.value;
        const text = this.textContent.trim();
        
        // Update the value display
        if (valueDisplay) {
          valueDisplay.textContent = text;
        }
        
        // Update the hidden input
        if (hiddenInput) {
          hiddenInput.value = value;
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          hiddenInput.dispatchEvent(event);
        }
        
        // Update active state
        items.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // Close the dropdown
        dropdown.classList.remove('open');
      });
    });
  });
}

/**
 * Handle window clicks to close dropdowns when clicking outside
 */
function handleWindowClicks() {
  window.addEventListener('click', function(e) {
    // Close all dropdowns when clicking outside
    document.querySelectorAll('.modern-dropdown.open').forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  });
}

/**
 * Create a custom dropdown from a select element
 * @param {HTMLSelectElement} selectElement - The select element to convert
 */
function createCustomDropdownFromSelect(selectElement) {
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'modern-dropdown';
  selectElement.parentNode.insertBefore(wrapper, selectElement);
  
  // Create toggle button
  const toggle = document.createElement('div');
  toggle.className = 'modern-dropdown-toggle';
  
  // Create value display
  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'modern-dropdown-value';
  valueDisplay.textContent = selectElement.options[selectElement.selectedIndex]?.text || 'Select an option';
  
  // Create icon
  const icon = document.createElement('i');
  icon.className = 'fas fa-chevron-down';
  
  // Assemble toggle
  toggle.appendChild(valueDisplay);
  toggle.appendChild(icon);
  wrapper.appendChild(toggle);
  
  // Create dropdown menu
  const menu = document.createElement('div');
  menu.className = 'modern-dropdown-menu';
  wrapper.appendChild(menu);
  
  // Create hidden input
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.name = selectElement.name;
  hiddenInput.value = selectElement.value;
  wrapper.appendChild(hiddenInput);
  
  // Add options
  Array.from(selectElement.options).forEach(option => {
    const item = document.createElement('div');
    item.className = 'modern-dropdown-item';
    if (option.selected) {
      item.classList.add('active');
    }
    item.dataset.value = option.value;
    item.textContent = option.text;
    menu.appendChild(item);
  });
  
  // Hide original select
  selectElement.style.display = 'none';
  
  // Initialize the new dropdown
  initializeCustomDropdowns();
  
  return wrapper;
}

// Export functions for global use
window.ModernDropdowns = {
  applyModernSelectStyling,
  initializeCustomDropdowns,
  createCustomDropdownFromSelect
};
