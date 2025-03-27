<script>
  // Store selected items
  const selectedItems = {
    offered: {},
    requested: {}
  };

  // Switch item category
  function switchCategory(element, type) {
    // Update active class
    const categories = element.parentElement.querySelectorAll(".item-category");
    categories.forEach(cat => cat.classList.remove("active"));
    element.classList.add("active");

    const category = element.dataset.category;

    if (type === "your") {
      // Load your items for the selected category
      loadYourItems(category);
    } else {
      // Load recipient items for the selected category
      loadRecipientItems(category);
    }
  }

  // Load your items for a category
  function loadYourItems(category) {
    const container = document.getElementById("your-items-container");
    const inventory = <%- JSON.stringify(inventory || {}) %>;
    const itemDetails = <%- JSON.stringify(itemDetails || {}) %>;

    if (!inventory[category] || Object.keys(inventory[category]).length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-box-open"></i>
          </div>
          <div class="empty-state-text">No items in this category</div>
        </div>
      `;
      return;
    }

    let html = "<div class=\"item-grid\">";

    Object.entries(inventory[category]).forEach(([itemName, quantity]) => {
      const item = itemDetails[itemName] || { name: itemName, rarity: "common", category };
      const selectedQuantity = selectedItems.offered[category]?.[itemName] || 0;

      html += `
        <div class="item-card" data-item-name="${itemName}" data-item-category="${category}">
          <div class="item-image">
            <div class="item-image-icon">
              <i class="fas fa-box"></i>
            </div>
          </div>
          <div class="item-name">${itemName}</div>
          <div class="item-quantity">Quantity: ${quantity}</div>
          <div class="item-rarity rarity-${item.rarity || "common"}">
            ${(item.rarity || "common").charAt(0).toUpperCase() + (item.rarity || "common").slice(1)}
          </div>
          <div class="item-quantity-selector">
            <button type="button" class="quantity-btn" onclick="decrementQuantity(this)">-</button>
            <input type="number" class="quantity-input" value="${selectedQuantity}" min="0" max="${quantity}"
              onchange="updateSelectedItems('offered', '${itemName}', '${category}', this.value)">
            <button type="button" class="quantity-btn" onclick="incrementQuantity(this, ${quantity})">+</button>
          </div>
        </div>
      `;
    });

    html += "</div>";
    container.innerHTML = html;
  }

  // Increment quantity
  function incrementQuantity(button, max) {
    const input = button.previousElementSibling;
    let value = parseInt(input.value) || 0;

    if (value < max) {
      value++;
      input.value = value;

      // Update selected items
      const card = button.closest(".item-card");
      const itemName = card.dataset.itemName;
      const category = card.dataset.itemCategory;
      const type = card.closest(".trade-section").querySelector(".trade-section-title").textContent.includes("Offering") ? "offered" : "requested";

      updateSelectedItems(type, itemName, category, value);
    }
  }

  // Decrement quantity
  function decrementQuantity(button) {
    const input = button.nextElementSibling;
    let value = parseInt(input.value) || 0;

    if (value > 0) {
      value--;
      input.value = value;

      // Update selected items
      const card = button.closest(".item-card");
      const itemName = card.dataset.itemName;
      const category = card.dataset.itemCategory;
      const type = card.closest(".trade-section").querySelector(".trade-section-title").textContent.includes("Offering") ? "offered" : "requested";

      updateSelectedItems(type, itemName, category, value);
    }
  }

  // Update selected items
  function updateSelectedItems(type, itemName, category, quantity) {
    quantity = parseInt(quantity) || 0;

    // Initialize category if it doesn't exist
    if (!selectedItems[type][category]) {
      selectedItems[type][category] = {};
    }

    if (quantity > 0) {
      // Add or update item
      selectedItems[type][category][itemName] = quantity;
    } else {
      // Remove item if quantity is 0
      delete selectedItems[type][category][itemName];

      // Remove category if empty
      if (Object.keys(selectedItems[type][category]).length === 0) {
        delete selectedItems[type][category];
      }
    }

    // Update UI
    updateSelectedItemsList(type);
    updateHiddenInputs();
    updateSubmitButton();
  }

  // Update the selected items list
  function updateSelectedItemsList(type) {
    const listElement = document.getElementById(`${type}-items-list`);
    const emptyState = document.getElementById(`${type}-empty-state`);

    // Clear current list
    listElement.innerHTML = "";

    const categories = Object.keys(selectedItems[type]);

    if (categories.length === 0) {
      // Show empty state
      listElement.appendChild(emptyState);
      return;
    }

    // Add selected items
    categories.forEach(category => {
      Object.entries(selectedItems[type][category]).forEach(([itemName, quantity]) => {
        const tag = document.createElement("div");
        tag.className = "selected-item-tag";
        tag.innerHTML = `
          ${itemName}
          <span class="selected-item-tag-quantity">${quantity}</span>
          <span class="selected-item-tag-remove" onclick="removeSelectedItem('${type}', '${itemName}', '${category}')">
            &times;
          </span>
        `;
        listElement.appendChild(tag);
      });
    });
  }

  // Remove a selected item
  function removeSelectedItem(type, itemName, category) {
    // Remove from object
    if (selectedItems[type][category] && selectedItems[type][category][itemName]) {
      delete selectedItems[type][category][itemName];

      // Remove category if empty
      if (Object.keys(selectedItems[type][category]).length === 0) {
        delete selectedItems[type][category];
      }
    }

    // Reset quantity input if visible
    const card = document.querySelector(`.item-card[data-item-name="${itemName}"][data-item-category="${category}"]`);
    if (card) {
      const input = card.querySelector(".quantity-input");
      if (input) {
        input.value = 0;
      }
    }

    // Update UI
    updateSelectedItemsList(type);
    updateHiddenInputs();
    updateSubmitButton();
  }

  // Update hidden inputs for form submission
  function updateHiddenInputs() {
    const offeredInputsContainer = document.getElementById("offered-items-inputs");
    const requestedInputsContainer = document.getElementById("requested-items-inputs");

    // Clear current inputs
    offeredInputsContainer.innerHTML = "";
    requestedInputsContainer.innerHTML = "";

    // Add offered items inputs
    Object.entries(selectedItems.offered).forEach(([category, items]) => {
      Object.entries(items).forEach(([itemName, quantity]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = `offered_items[${category}][${itemName}]`;
        input.value = quantity;
        offeredInputsContainer.appendChild(input);
      });
    });

    // Add requested items inputs
    Object.entries(selectedItems.requested).forEach(([category, items]) => {
      Object.entries(items).forEach(([itemName, quantity]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = `requested_items[${category}][${itemName}]`;
        input.value = quantity;
        requestedInputsContainer.appendChild(input);
      });
    });
  }

  // Update submit button state
  function updateSubmitButton() {
    const submitButton = document.getElementById("submit-trade");
    const recipientSelect = document.getElementById("recipient_id");

    // Enable button if a recipient is selected and at least one item is selected (either offered or requested)
    const hasRecipient = recipientSelect.value !== "";
    const hasOfferedItems = Object.keys(selectedItems.offered).length > 0;
    const hasRequestedItems = Object.keys(selectedItems.requested).length > 0;

    submitButton.disabled = !(hasRecipient && (hasOfferedItems || hasRequestedItems));
  }

  // Load recipient's items when a trainer is selected
  document.getElementById("recipient_id").addEventListener("change", async function() {
    const trainerId = this.value;
    const categoriesContainer = document.getElementById("recipient-categories");
    const itemsContainer = document.getElementById("recipient-items-container");

    // Clear current selection when trainer changes
    selectedItems.requested = {};
    updateSelectedItemsList("requested");
    updateHiddenInputs();
    updateSubmitButton();

    if (!trainerId) {
      categoriesContainer.innerHTML = `<div class="item-category active">Select a trainer</div>`;
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-user-alt"></i>
          </div>
          <div class="empty-state-text">Select a trainer to see their items</div>
        </div>
      `;
      return;
    }

    // Show loading state
    itemsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div class="empty-state-text">Loading items...</div>
      </div>
    `;

    try {
      // Fetch the trainer's inventory
      const response = await fetch(`/api/trainers/${trainerId}/inventory`);
      const data = await response.json();

      if (!data.inventory || Object.keys(data.inventory).length === 0) {
        categoriesContainer.innerHTML = `<div class="item-category active">No Items</div>`;
        itemsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="fas fa-box-open"></i>
            </div>
            <div class="empty-state-text">This trainer doesn't have any items</div>
          </div>
        `;
        return;
      }

      // Update categories
      let categoriesHtml = "";
      const categories = Object.keys(data.inventory);

      categories.forEach((category, index) => {
        categoriesHtml += `
          <div class="item-category ${index === 0 ? 'active' : ''}" data-category="${category}" onclick="switchCategory(this, 'recipient')">
            ${category.charAt(0).toUpperCase() + category.slice(1)}
          </div>
        `;
      });

      categoriesContainer.innerHTML = categoriesHtml;

      // Load items for the first category
      const firstCategory = categories[0];
      const items = data.inventory[firstCategory] || {};

      if (Object.keys(items).length === 0) {
        itemsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="fas fa-box-open"></i>
            </div>
            <div class="empty-state-text">No items in this category</div>
          </div>
        `;
        return;
      }

      // Render the items
      let html = "<div class=\"item-grid\">";

      Object.entries(items).forEach(([itemName, quantity]) => {
        const item = data.itemDetails[itemName] || { name: itemName, rarity: "common", category: firstCategory };

        html += `
          <div class="item-card" data-item-name="${itemName}" data-item-category="${firstCategory}">
            <div class="item-image">
              <div class="item-image-icon">
                <i class="fas fa-box"></i>
              </div>
            </div>
            <div class="item-name">${itemName}</div>
            <div class="item-quantity">Quantity: ${quantity}</div>
            <div class="item-rarity rarity-${item.rarity || "common"}">
              ${(item.rarity || "common").charAt(0).toUpperCase() + (item.rarity || "common").slice(1)}
            </div>
            <div class="item-quantity-selector">
              <button type="button" class="quantity-btn" onclick="decrementQuantity(this)">-</button>
              <input type="number" class="quantity-input" value="0" min="0" max="${quantity}"
                onchange="updateSelectedItems('requested', '${itemName}', '${firstCategory}', this.value)">
              <button type="button" class="quantity-btn" onclick="incrementQuantity(this, ${quantity})">+</button>
            </div>
          </div>
        `;
      });

      html += "</div>";
      itemsContainer.innerHTML = html;

      // Store the inventory data for later use
      window.recipientInventory = data.inventory;
      window.recipientItemDetails = data.itemDetails;
    } catch (error) {
      console.error("Error fetching inventory:", error);
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="empty-state-text">Error loading items</div>
        </div>
      `;
    }
  });

  // Load recipient items for a category
  function loadRecipientItems(category) {
    if (!window.recipientInventory) return;

    const container = document.getElementById("recipient-items-container");
    const inventory = window.recipientInventory;
    const itemDetails = window.recipientItemDetails || {};

    if (!inventory[category] || Object.keys(inventory[category]).length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-box-open"></i>
          </div>
          <div class="empty-state-text">No items in this category</div>
        </div>
      `;
      return;
    }

    let html = "<div class=\"item-grid\">";

    Object.entries(inventory[category]).forEach(([itemName, quantity]) => {
      const item = itemDetails[itemName] || { name: itemName, rarity: "common", category };
      const selectedQuantity = selectedItems.requested[category]?.[itemName] || 0;

      html += `
        <div class="item-card" data-item-name="${itemName}" data-item-category="${category}">
          <div class="item-image">
            <div class="item-image-icon">
              <i class="fas fa-box"></i>
            </div>
          </div>
          <div class="item-name">${itemName}</div>
          <div class="item-quantity">Quantity: ${quantity}</div>
          <div class="item-rarity rarity-${item.rarity || "common"}">
            ${(item.rarity || "common").charAt(0).toUpperCase() + (item.rarity || "common").slice(1)}
          </div>
          <div class="item-quantity-selector">
            <button type="button" class="quantity-btn" onclick="decrementQuantity(this)">-</button>
            <input type="number" class="quantity-input" value="${selectedQuantity}" min="0" max="${quantity}"
              onchange="updateSelectedItems('requested', '${itemName}', '${category}', this.value)">
            <button type="button" class="quantity-btn" onclick="incrementQuantity(this, ${quantity})">+</button>
          </div>
        </div>
      `;
    });

    html += "</div>";
    container.innerHTML = html;
  }

  // Initialize empty states
  document.addEventListener("DOMContentLoaded", function() {
    updateSelectedItemsList("offered");
    updateSelectedItemsList("requested");
    updateSubmitButton();
  });
</script>