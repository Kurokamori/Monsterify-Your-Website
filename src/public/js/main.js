// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

    // Debug logging
    console.log('Starting mobile menu initialization...');

  // Mobile menu functionality
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavClose = document.getElementById('mobileNavClose');
  const mobileDropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');

    // Initialize mobile menu
    // No need to manipulate display property as it's handled by CSS

  // Toggle mobile menu
  if (mobileMenuButton && mobileNav) {
      console.log('Mobile menu button found:', mobileMenuButton);
      console.log('Mobile nav found:', mobileNav);

      mobileMenuButton.addEventListener('click', function (e) {
          console.log('Mobile menu button clicked');
          e.preventDefault();

          // Force show the mobile menu with inline styles
      mobileNav.classList.add('active');
          mobileNav.style.transform = 'translateX(0)';
          mobileNav.style.visibility = 'visible';
          mobileNav.style.pointerEvents = 'auto';
      document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open

          console.log('Mobile menu should now be visible');
      });

      // Add a direct onclick handler as a fallback
      mobileMenuButton.onclick = function (e) {
          console.log('Mobile menu button onclick triggered');
          e.preventDefault();

          // Force show the mobile menu with inline styles
          mobileNav.classList.add('active');
          mobileNav.style.transform = 'translateX(0)';
          mobileNav.style.visibility = 'visible';
          mobileNav.style.pointerEvents = 'auto';
          document.body.style.overflow = 'hidden';

          console.log('Mobile menu should now be visible (onclick)');
      };
  } else {
      console.error('Mobile menu elements not found:', {
          mobileMenuButton: mobileMenuButton ? 'Found' : 'Not found',
          mobileNav: mobileNav ? 'Found' : 'Not found'
    });
  }

  // Close mobile menu
  if (mobileNavClose && mobileNav) {
      console.log('Mobile nav close button found:', mobileNavClose);

      mobileNavClose.addEventListener('click', function (e) {
          console.log('Mobile nav close button clicked');
          e.preventDefault();

          // Force hide the mobile menu with inline styles
      mobileNav.classList.remove('active');
          mobileNav.style.transform = 'translateX(-100%)';
          mobileNav.style.pointerEvents = 'none';
      document.body.style.overflow = ''; // Re-enable scrolling

          console.log('Mobile menu should now be hidden');
      });

      // Add a direct onclick handler as a fallback
      mobileNavClose.onclick = function (e) {
          console.log('Mobile nav close button onclick triggered');
          e.preventDefault();

          // Force hide the mobile menu with inline styles
          mobileNav.classList.remove('active');
          mobileNav.style.transform = 'translateX(-100%)';
          mobileNav.style.pointerEvents = 'none';
          document.body.style.overflow = '';

          console.log('Mobile menu should now be hidden (onclick)');
      };
  } else {
      console.error('Mobile nav close elements not found:', {
          mobileNavClose: mobileNavClose ? 'Found' : 'Not found',
          mobileNav: mobileNav ? 'Found' : 'Not found'
    });
  }

  // Toggle mobile dropdowns
    if (mobileDropdownToggles && mobileDropdownToggles.length > 0) {
    mobileDropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function (e) {
            e.preventDefault();
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
          console.log('Clicked outside mobile menu, closing');

          // Force hide the mobile menu with inline styles
        mobileNav.classList.remove('active');
          mobileNav.style.transform = 'translateX(-100%)';
          mobileNav.style.pointerEvents = 'none';
        document.body.style.overflow = '';
      }
    }
  });
});
