// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  // Mobile menu functionality
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavClose = document.getElementById('mobileNavClose');
  const mobileDropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');

  // Initialize mobile menu display property
  if (mobileNav) {
    mobileNav.style.display = 'block';
    setTimeout(() => {
      mobileNav.style.display = 'none';
    }, 10);
  }

  // Toggle mobile menu
  if (mobileMenuButton && mobileNav) {
    mobileMenuButton.addEventListener('click', function() {
      mobileNav.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
    });
  }

  // Close mobile menu
  if (mobileNavClose && mobileNav) {
    mobileNavClose.addEventListener('click', function() {
      mobileNav.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
    });
  }

  // Toggle mobile dropdowns
  if (mobileDropdownToggles) {
    mobileDropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const targetDropdown = document.getElementById(targetId);

        if (targetDropdown) {
          // Close all other dropdowns at the same level
          const parent = targetDropdown.parentElement;
          const siblings = parent.querySelectorAll('.mobile-dropdown-content, .mobile-nested-dropdown-content');

          siblings.forEach(sibling => {
            if (sibling !== targetDropdown) {
              sibling.classList.remove('active');
            }
          });

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
