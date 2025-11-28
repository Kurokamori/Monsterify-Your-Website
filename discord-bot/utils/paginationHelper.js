const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createButton, createActionRow } = require('../config/buttons');

class PaginationHelper {
  constructor(items, itemsPerPage = 10, formatter = null) {
    this.items = items;
    this.itemsPerPage = itemsPerPage;
    this.formatter = formatter || ((item) => item.toString());
    this.totalPages = Math.ceil(items.length / itemsPerPage);
  }

  // Get items for a specific page
  getPageItems(page) {
    const startIndex = (page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.items.slice(startIndex, endIndex);
  }

  // Format items for display
  formatPageItems(page) {
    const pageItems = this.getPageItems(page);
    const startIndex = (page - 1) * this.itemsPerPage;

    return pageItems.map((item, index) => {
      const itemNumber = startIndex + index + 1;
      return `${itemNumber}. ${this.formatter(item)}`;
    }).join('\n');
  }

  // Create pagination buttons
  createPaginationButtons(currentPage, customIdPrefix = 'page') {
    const buttons = [];

    // First page button
    if (this.totalPages > 2) {
      buttons.push(
        createButton(`${customIdPrefix}_first`, '⏮️', ButtonStyle.Secondary, null, currentPage === 1)
      );
    }

    // Previous page button
    buttons.push(
      createButton(`${customIdPrefix}_prev`, '⬅️', ButtonStyle.Primary, null, currentPage === 1)
    );

    // Page indicator (disabled button showing current page)
    buttons.push(
      createButton(`${customIdPrefix}_current`, `${currentPage}/${this.totalPages}`, ButtonStyle.Secondary, null, true)
    );

    // Next page button
    buttons.push(
      createButton(`${customIdPrefix}_next`, '➡️', ButtonStyle.Primary, null, currentPage === this.totalPages)
    );

    // Last page button
    if (this.totalPages > 2) {
      buttons.push(
        createButton(`${customIdPrefix}_last`, '⏭️', ButtonStyle.Secondary, null, currentPage === this.totalPages)
      );
    }

    return createActionRow(...buttons);
  }

  // Create pagination info
  getPaginationInfo(currentPage) {
    const startItem = (currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(currentPage * this.itemsPerPage, this.items.length);

    return {
      currentPage,
      totalPages: this.totalPages,
      totalItems: this.items.length,
      startItem,
      endItem,
      hasNextPage: currentPage < this.totalPages,
      hasPrevPage: currentPage > 1,
    };
  }

  // Handle pagination button interactions
  static handlePaginationInteraction(interaction, currentPage) {
    const { customId } = interaction;
    const action = customId.split('_').pop();

    switch (action) {
      case 'first':
        return 1;
      case 'prev':
        return Math.max(1, currentPage - 1);
      case 'next':
        return currentPage + 1;
      case 'last':
        return interaction.totalPages || currentPage;
      default:
        return currentPage;
    }
  }

  // Create a complete paginated embed with buttons
  createPaginatedEmbed(embedBuilder, currentPage, customIdPrefix = 'page') {
    const pageInfo = this.getPaginationInfo(currentPage);
    const formattedItems = this.formatPageItems(currentPage);

    // Add pagination info to embed
    if (this.totalPages > 1) {
      embedBuilder.setFooter(
        `Page ${pageInfo.currentPage} of ${pageInfo.totalPages} | ` +
        `Items ${pageInfo.startItem}-${pageInfo.endItem} of ${pageInfo.totalItems}`
      );
    } else {
      embedBuilder.setFooter(`Total: ${pageInfo.totalItems} items`);
    }

    // Set description with formatted items
    embedBuilder.setDescription(formattedItems || 'No items to display.');

    const components = [];
    
    // Add pagination buttons if there are multiple pages
    if (this.totalPages > 1) {
      components.push(this.createPaginationButtons(currentPage, customIdPrefix));
    }

    return {
      embeds: [embedBuilder.build()],
      components,
    };
  }

  // Static helper methods
  static create(items, itemsPerPage = 10, formatter = null) {
    return new PaginationHelper(items, itemsPerPage, formatter);
  }

  // Create a simple paginated list
  static createSimpleList(items, currentPage = 1, itemsPerPage = 10, formatter = null) {
    const helper = new PaginationHelper(items, itemsPerPage, formatter);
    return {
      content: helper.formatPageItems(currentPage),
      pagination: helper.getPaginationInfo(currentPage),
    };
  }

  // Create pagination for select menus (max 25 options)
  static createSelectMenuPagination(items, currentPage = 1, optionsPerPage = 25) {
    const helper = new PaginationHelper(items, optionsPerPage);
    const pageItems = helper.getPageItems(currentPage);
    const pageInfo = helper.getPaginationInfo(currentPage);

    return {
      options: pageItems.map((item, index) => ({
        label: item.name || item.label || `Item ${index + 1}`,
        value: item.value || item.id?.toString() || index.toString(),
        description: item.description ? 
          (item.description.length > 100 ? 
            item.description.substring(0, 97) + '...' : 
            item.description) : 
          undefined,
      })),
      pagination: pageInfo,
    };
  }

  // Chunk array into pages
  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

module.exports = PaginationHelper;
