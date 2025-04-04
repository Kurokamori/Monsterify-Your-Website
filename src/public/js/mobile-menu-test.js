/**
 * Test script for mobile menu functionality
 */
console.log('Mobile menu test script loaded');

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded in test script');

    // Get the mobile menu button
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileNav = document.getElementById('mobileNav');

    if (mobileMenuButton) {
        console.log('Mobile menu button found in test script');

        // Add a direct click handler
        mobileMenuButton.addEventListener('click', function (e) {
            console.log('Mobile menu button clicked in test script');
            e.preventDefault();

            if (mobileNav) {
                console.log('Toggling mobile nav active class');
                if (mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                } else {
                    mobileNav.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            } else {
                console.error('Mobile nav element not found');
            }
        });
    } else {
        console.error('Mobile menu button not found in test script');
    }
});

// Add a window load event as a fallback
window.addEventListener('load', function () {
    console.log('Window loaded in test script');

    // Try to attach the event listener again
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileNav = document.getElementById('mobileNav');

    if (mobileMenuButton && mobileNav) {
        console.log('Mobile menu elements found in window load event');

        // Add a direct click handler
        mobileMenuButton.onclick = function () {
            console.log('Mobile menu button clicked via onclick in window load event');
            mobileNav.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        };
    }
});
