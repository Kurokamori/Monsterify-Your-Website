/**
 * Admin Item Roller Interface
 * Provides a user-friendly interface for configuring random item rolling
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const randomItemsContainer = document.getElementById('randomItemsContainer');
  const addRandomItemRow = document.getElementById('addRandomItemRow');

  // Only initialize if we're on the right page
  if (!randomItemsContainer || !addRandomItemRow) return;

  // Create the enhanced UI
  enhanceItemRollerUI();

  /**
   * Enhance the existing item roller UI
   */
  function enhanceItemRollerUI() {
    // Add quick templates section
    addQuickTemplates();

    // Add item previews
    addItemPreviews();

    // Enhance existing rows
    enhanceExistingRows();
  }

  /**
   * Add quick templates for common item configurations
   */
  function addQuickTemplates() {
    // Create the templates container
    const templatesContainer = document.createElement('div');
    templatesContainer.className = 'quick-templates';
    templatesContainer.innerHTML = `
      <div class="templates-header">
        <span>Quick Templates</span>
        <button type="button" id="toggle-templates" class="btn-toggle">
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>
      <div class="templates-content">
        <div class="template-buttons">
          <button type="button" class="template-button" data-template="basic">
            <i class="fas fa-star"></i> Basic Reward
          </button>
          <button type="button" class="template-button" data-template="berries">
            <i class="fas fa-apple-alt"></i> Berries Pack
          </button>
          <button type="button" class="template-button" data-template="evolution">
            <i class="fas fa-level-up-alt"></i> Evolution Items
          </button>
          <button type="button" class="template-button" data-template="premium">
            <i class="fas fa-gem"></i> Premium Pack
          </button>
          <button type="button" class="template-button" data-template="helditems">
            <i class="fas fa-hand-holding"></i> Held Items
          </button>
          <button type="button" class="template-button" data-template="clear">
            <i class="fas fa-trash"></i> Clear All
          </button>
        </div>
      </div>
    `;

    // Insert before the container
    randomItemsContainer.parentNode.insertBefore(templatesContainer, randomItemsContainer);

    // Add event listeners
    document.getElementById('toggle-templates').addEventListener('click', function() {
      const content = this.parentNode.nextElementSibling;
      const icon = this.querySelector('i');

      if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
      } else {
        content.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
      }
    });

    // Template button listeners
    document.querySelectorAll('.template-button').forEach(button => {
      button.addEventListener('click', function() {
        applyTemplate(this.dataset.template);
      });
    });
  }

  /**
   * Apply a predefined template
   * @param {string} templateName - Name of the template to apply
   */
  function applyTemplate(templateName) {
    // Clear existing rows
    while (randomItemsContainer.firstChild) {
      randomItemsContainer.removeChild(randomItemsContainer.firstChild);
    }

    // Apply the selected template
    switch (templateName) {
      case 'basic':
        addTemplateRow('ITEMS', 2);
        addTemplateRow('BERRIES', 1);
        break;

      case 'berries':
        addTemplateRow('BERRIES', 3);
        break;

      case 'evolution':
        addTemplateRow('EVOLUTION', 1);
        addTemplateRow('ITEMS', 1);
        break;

      case 'premium':
        addTemplateRow('ANTIQUE', 1);
        addTemplateRow('EVOLUTION', 1);
        addTemplateRow('BALLS', 2);
        break;

      case 'helditems':
        addTemplateRow('HELDITEMS', 2);
        addTemplateRow('ITEMS', 1);
        break;

      case 'clear':
        // Just add one empty row
        addTemplateRow('', 1);
        break;
    }

    // Enhance the newly added rows
    enhanceExistingRows();
  }

  /**
   * Add a template row with specified category and quantity
   * @param {string} category - Item category
   * @param {number} quantity - Item quantity
   */
  function addTemplateRow(category, quantity) {
    const newRow = document.createElement('div');
    newRow.className = 'random-item-row';

    // Get all available categories
    const categories = [];
    document.querySelectorAll('#randomItemsContainer select option').forEach(option => {
      if (option.value && !categories.includes(option.value)) {
        categories.push(option.value);
      }
    });

    // If no categories found (first load), use default categories
    const defaultCategories = ['BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'];
    const allCategories = categories.length > 0 ? categories : defaultCategories;

    // Create category options
    let categoryOptions = '<option value="">-- Select Category --</option>';
    allCategories.forEach(cat => {
      categoryOptions += `<option value="${cat}" ${cat === category ? 'selected' : ''}>${cat}</option>`;
    });

    newRow.innerHTML = `
      <select name="reward_random_items_category" class="form-select modern-select">
        ${categoryOptions}
      </select>
      <input type="number" name="reward_random_items_quantity" class="form-input modern-input" value="${quantity}" min="1">
      <button type="button" class="btn-remove-row" onclick="removeRandomItemRow(this)">
        <i class="fas fa-times"></i>
      </button>
    `;

    randomItemsContainer.appendChild(newRow);
  }

  /**
   * Add item previews to the UI
   */
  function addItemPreviews() {
    // Create the preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'item-preview-container';
    previewContainer.innerHTML = `
      <div class="preview-header">
        <span>Item Preview</span>
        <button type="button" id="refresh-preview" class="btn-refresh">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
      <div id="item-preview" class="item-preview">
        <div class="preview-placeholder">
          <i class="fas fa-box-open"></i>
          <p>Configure items above to see a preview</p>
        </div>
      </div>
    `;

    // Insert after the random items container
    randomItemsContainer.parentNode.insertBefore(previewContainer, randomItemsContainer.nextSibling);

    // Add event listener for refresh button
    document.getElementById('refresh-preview').addEventListener('click', function() {
      updateItemPreview();
    });
  }

  /**
   * Enhance existing item rows with icons and tooltips
   */
  function enhanceExistingRows() {
    document.querySelectorAll('.random-item-row').forEach(row => {
      const select = row.querySelector('select');
      const input = row.querySelector('input');

      // Skip if already enhanced
      if (row.classList.contains('enhanced')) return;

      // Add category icon
      const iconSpan = document.createElement('span');
      iconSpan.className = 'category-icon';
      iconSpan.innerHTML = getCategoryIcon(select.value);
      select.parentNode.insertBefore(iconSpan, select);

      // Update icon when category changes
      select.addEventListener('change', function() {
        iconSpan.innerHTML = getCategoryIcon(this.value);
        updateItemPreview();
      });

      // Update preview when quantity changes
      input.addEventListener('change', function() {
        updateItemPreview();
      });

      // Mark as enhanced
      row.classList.add('enhanced');
    });

    // Initial preview update
    updateItemPreview();
  }

  /**
   * Get an icon for a category
   * @param {string} category - Item category
   * @returns {string} - HTML for the icon
   */
  function getCategoryIcon(category) {
    switch (category) {
      case 'BERRIES':
        return '<i class="fas fa-apple-alt" title="Berries"></i>';
      case 'BALLS':
        return '<i class="fas fa-circle" title="Balls"></i>';
      case 'ITEMS':
        return '<i class="fas fa-box" title="Items"></i>';
      case 'EVOLUTION':
        return '<i class="fas fa-level-up-alt" title="Evolution Items"></i>';
      case 'PASTRIES':
        return '<i class="fas fa-cookie" title="Pastries"></i>';
      case 'ANTIQUE':
        return '<i class="fas fa-gem" title="Antiques"></i>';
      case 'HELDITEMS':
        return '<i class="fas fa-hand-holding" title="Held Items"></i>';
      default:
        return '<i class="fas fa-question" title="Select a category"></i>';
    }
  }

  /**
   * Update the item preview based on current selections
   */
  function updateItemPreview() {
    const previewContainer = document.getElementById('item-preview');

    // Get all selected categories and quantities
    const selections = [];
    document.querySelectorAll('.random-item-row.enhanced').forEach(row => {
      const category = row.querySelector('select').value;
      const quantity = parseInt(row.querySelector('input').value) || 0;

      if (category && quantity > 0) {
        selections.push({ category, quantity });
      }
    });

    // If no valid selections, show placeholder
    if (selections.length === 0) {
      previewContainer.innerHTML = `
        <div class="preview-placeholder">
          <i class="fas fa-box-open"></i>
          <p>Configure items above to see a preview</p>
        </div>
      `;
      return;
    }

    // Show loading state
    previewContainer.innerHTML = `
      <div class="preview-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Generating preview...</p>
      </div>
    `;

    // Simulate item generation (in a real implementation, this would call the API)
    setTimeout(() => {
      let previewHTML = '<div class="preview-items">';

      // Generate sample items for each category
      selections.forEach(selection => {
        const items = getSampleItems(selection.category, selection.quantity);

        items.forEach(item => {
          previewHTML += `
            <div class="preview-item">
              <div class="preview-item-icon">${getCategoryIcon(selection.category)}</div>
              <div class="preview-item-details">
                <div class="preview-item-name">${item.name}</div>
                <div class="preview-item-rarity">${item.rarity}</div>
              </div>
            </div>
          `;
        });
      });

      previewHTML += '</div>';
      previewHTML += '<div class="preview-note"><p><em>Note: This is just a sample preview. Actual results will vary.</em></p></div>';

      previewContainer.innerHTML = previewHTML;
    }, 500);
  }

  /**
   * Get sample items for a category
   * @param {string} category - Item category
   * @param {number} quantity - Number of items to generate
   * @returns {Array} - Array of sample items
   */
  function getSampleItems(category, quantity) {
    const items = [];
    const sampleItems = {
      'BERRIES': [
        { name: 'Oran Berry', rarity: 'Common' },
        { name: 'Sitrus Berry', rarity: 'Uncommon' },
        { name: 'Lum Berry', rarity: 'Rare' },
        { name: 'Enigma Berry', rarity: 'Epic' }
      ],
      'BALLS': [
        { name: 'Poké Ball', rarity: 'Common' },
        { name: 'Great Ball', rarity: 'Uncommon' },
        { name: 'Ultra Ball', rarity: 'Rare' },
        { name: 'Master Ball', rarity: 'Legendary' }
      ],
      'ITEMS': [
        { name: 'Potion', rarity: 'Common' },
        { name: 'Super Potion', rarity: 'Uncommon' },
        { name: 'Hyper Potion', rarity: 'Rare' },
        { name: 'Max Potion', rarity: 'Epic' }
      ],
      'EVOLUTION': [
        { name: 'Fire Stone', rarity: 'Rare' },
        { name: 'Water Stone', rarity: 'Rare' },
        { name: 'Thunder Stone', rarity: 'Rare' },
        { name: 'Leaf Stone', rarity: 'Rare' }
      ],
      'PASTRIES': [
        { name: 'Sweet Cookie', rarity: 'Common' },
        { name: 'Chocolate Cake', rarity: 'Uncommon' },
        { name: 'Rainbow Cupcake', rarity: 'Rare' },
        { name: 'Golden Pastry', rarity: 'Epic' }
      ],
      'ANTIQUE': [
        { name: 'Old Coin', rarity: 'Uncommon' },
        { name: 'Ancient Statue', rarity: 'Rare' },
        { name: 'Royal Crown', rarity: 'Epic' },
        { name: 'Legendary Artifact', rarity: 'Legendary' }
      ],
      'HELDITEMS': [
        { name: 'Choice Band', rarity: 'Rare' },
        { name: 'Focus Sash', rarity: 'Rare' },
        { name: 'Leftovers', rarity: 'Uncommon' },
        { name: 'Life Orb', rarity: 'Rare' },
        { name: 'Assault Vest', rarity: 'Rare' },
        { name: 'Eviolite', rarity: 'Rare' },
        { name: 'Rocky Helmet', rarity: 'Uncommon' },
        { name: 'Expert Belt', rarity: 'Uncommon' }
      ]
    };

    // Get the sample items for this category
    const categoryItems = sampleItems[category] || [];

    // Generate the requested number of items
    for (let i = 0; i < quantity; i++) {
      const randomIndex = Math.floor(Math.random() * categoryItems.length);
      items.push(categoryItems[randomIndex]);
    }

    return items;
  }

  // Override the original add row function to enhance new rows
  const originalAddRandomItemRow = addRandomItemRow.onclick;
  addRandomItemRow.onclick = function() {
    // Call the original function
    if (originalAddRandomItemRow) {
      originalAddRandomItemRow.call(this);
    } else {
      // Fallback if original function not available
      const event = new Event('click');
      this.dispatchEvent(event);
    }

    // Enhance the newly added row
    setTimeout(() => {
      enhanceExistingRows();
    }, 0);
  };
});
