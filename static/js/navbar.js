/**
 * Navbar functionality for PiBlog
 * - Tag menu toggle with # button
 * - Mobile search expand/collapse
 * - Click outside / Esc to close
 * - All/Clear button actions
 */

(function() {
    'use strict';

    // DOM Elements
    const tagMenuBtn = document.getElementById('tag-menu-btn');
    const tagMenu = document.getElementById('tag-menu');
    const searchContainer = document.querySelector('.gblog-nav__search');
    const searchToggle = document.querySelector('.gblog-search__toggle');
    const searchInput = document.querySelector('.gblog-search__input');
    const actionButtons = document.querySelectorAll('.gblog-tag-menu__action');

    if (!tagMenuBtn || !tagMenu) return;

    // Toggle tag menu
    function toggleTagMenu(open) {
        const isOpen = open !== undefined ? open : !tagMenu.classList.contains('is-open');

        tagMenu.classList.toggle('is-open', isOpen);
        tagMenuBtn.classList.toggle('is-active', isOpen);
        tagMenuBtn.setAttribute('aria-expanded', isOpen);
        tagMenu.setAttribute('aria-hidden', !isOpen);

        if (isOpen) {
            // Focus first tag pill when opening
            const firstPill = tagMenu.querySelector('.gblog-tag-pill');
            if (firstPill) firstPill.focus();
        }
    }

    // Close tag menu
    function closeTagMenu() {
        toggleTagMenu(false);
        tagMenuBtn.focus();
    }

    // Toggle mobile search
    function toggleSearch(open) {
        if (!searchContainer) return;
        const isExpanded = open !== undefined ? open : !searchContainer.classList.contains('is-expanded');

        searchContainer.classList.toggle('is-expanded', isExpanded);

        if (isExpanded && searchInput) {
            searchInput.focus();
        }
    }

    // Close search
    function closeSearch() {
        toggleSearch(false);
    }

    // Tag menu button click
    tagMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeSearch();
        toggleTagMenu();
    });

    // Search toggle click (mobile)
    if (searchToggle) {
        searchToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            closeTagMenu();
            toggleSearch();
        });
    }

    // Search input - close on blur if empty (mobile)
    if (searchInput) {
        searchInput.addEventListener('blur', function() {
            setTimeout(function() {
                if (!searchInput.value.trim()) {
                    closeSearch();
                }
            }, 200);
        });

        // Submit search on Enter
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                // Allow form submission
                return;
            }
        });
    }

    // Action buttons (All / Clear)
    actionButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');

            if (action === 'all') {
                // Navigate to home/posts page
                window.location.href = document.querySelector('a.gblog-header__link')?.href || '/';
            } else if (action === 'clear') {
                // Remove active state from all pills and go home
                window.location.href = document.querySelector('a.gblog-header__link')?.href || '/';
            }

            closeTagMenu();
        });
    });

    // Click outside to close
    document.addEventListener('click', function(e) {
        // Close tag menu if clicking outside
        if (!tagMenu.contains(e.target) && !tagMenuBtn.contains(e.target)) {
            if (tagMenu.classList.contains('is-open')) {
                closeTagMenu();
            }
        }

        // Close search if clicking outside (mobile)
        if (searchContainer && !searchContainer.contains(e.target)) {
            if (searchContainer.classList.contains('is-expanded') && searchInput && !searchInput.value.trim()) {
                closeSearch();
            }
        }
    });

    // Escape key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (tagMenu.classList.contains('is-open')) {
                closeTagMenu();
            }
            if (searchContainer && searchContainer.classList.contains('is-expanded')) {
                closeSearch();
                if (searchToggle) searchToggle.focus();
            }
        }
    });

    // Trap focus within tag menu when open
    tagMenu.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            const focusableElements = tagMenu.querySelectorAll('button, a[href]');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
})();
