/**
 * Mobile Menu Functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get mobile menu elements
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavClose = document.getElementById('mobileNavClose');
  const mobileDropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');

  // Toggle mobile menu
  if (mobileMenuButton && mobileNav) {
    mobileMenuButton.addEventListener('click', function(e) {
      e.preventDefault();
      mobileNav.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
    });
  }

  // Close mobile menu
  if (mobileNavClose && mobileNav) {
    mobileNavClose.addEventListener('click', function(e) {
      e.preventDefault();
      mobileNav.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
    });
  }

  // Toggle mobile dropdowns
  if (mobileDropdownToggles.length > 0) {
    mobileDropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('data-target');
        const targetDropdown = document.getElementById(targetId);

        if (targetDropdown) {
          // Toggle the clicked dropdown
          targetDropdown.classList.toggle('active');

          // Toggle the icon
          const icon = this.querySelector('i');
          if (icon) {
            if (targetDropdown.classList.contains('active')) {
              icon.classList.remove('fa-chevron-down');
              icon.classList.add('fa-chevron-up');
            } else {
              icon.classList.remove('fa-chevron-up');
              icon.classList.add('fa-chevron-down');
            }
          }
        }
      });
    });
  }

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    if (mobileNav && mobileNav.classList.contains('active')) {
      if (!mobileNav.contains(event.target) && event.target !== mobileMenuButton) {
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });
});
