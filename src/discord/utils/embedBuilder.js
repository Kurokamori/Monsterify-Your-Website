const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embedConfig = require('../config/embeds');
const buttonConfig = require('../config/buttons');

/**
 * Utility class for building embeds and button rows
 */
class EmbedBuilderUtil {
  /**
   * Create the main menu embed with buttons
   * @returns {Object} - Object containing embed and components
   */
  static createMainMenu() {
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(embedConfig.mainMenu.title)
      .setDescription(embedConfig.mainMenu.description)
      .setImage(embedConfig.mainMenu.image)
      .setColor(embedConfig.mainMenu.color)
      .setFooter({ text: embedConfig.mainMenu.footer })
      .setTimestamp();
    
    // Create button rows (maximum 5 buttons per row)
    const rows = this._createButtonRows(buttonConfig.mainMenu);
    
    return { embed, components: rows };
  }
  
  /**
   * Create the Visit Town embed with buttons
   * @returns {Object} - Object containing embed and components
   */
  static createTownMenu() {
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(embedConfig.visitTown.title)
      .setDescription(embedConfig.visitTown.description)
      .setImage(embedConfig.visitTown.image)
      .setColor(embedConfig.visitTown.color)
      .setFooter({ text: embedConfig.visitTown.footer })
      .setTimestamp();
    
    // Create button rows (maximum 5 buttons per row)
    const rows = this._createButtonRows(buttonConfig.townSquare);
    
    return { embed, components: rows };
  }
  
  /**
   * Create the Visit Market embed with buttons
   * @returns {Object} - Object containing embed and components
   */
  static createMarketMenu() {
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(embedConfig.visitMarket.title)
      .setDescription(embedConfig.visitMarket.description)
      .setImage(embedConfig.visitMarket.image)
      .setColor(embedConfig.visitMarket.color)
      .setFooter({ text: embedConfig.visitMarket.footer })
      .setTimestamp();
    
    // Create button rows (maximum 5 buttons per row)
    const rows = this._createButtonRows(buttonConfig.market);
    
    return { embed, components: rows };
  }
  
  /**
   * Create the Process Submission embed with buttons
   * @returns {Object} - Object containing embed and components
   */
  static createSubmissionMenu() {
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(embedConfig.processSubmission.title)
      .setDescription(embedConfig.processSubmission.description)
      .setImage(embedConfig.processSubmission.image)
      .setColor(embedConfig.processSubmission.color)
      .setFooter({ text: embedConfig.processSubmission.footer })
      .setTimestamp();
    
    // Create button rows (maximum 5 buttons per row)
    const rows = this._createButtonRows(buttonConfig.submission);
    
    return { embed, components: rows };
  }
  
  /**
   * Create the View Schedule embed with buttons
   * @returns {Object} - Object containing embed and components
   */
  static createScheduleMenu() {
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(embedConfig.viewSchedule.title)
      .setDescription(embedConfig.viewSchedule.description)
      .setImage(embedConfig.viewSchedule.image)
      .setColor(embedConfig.viewSchedule.color)
      .setFooter({ text: embedConfig.viewSchedule.footer })
      .setTimestamp();
    
    // Create button rows (maximum 5 buttons per row)
    const rows = this._createButtonRows(buttonConfig.schedule);
    
    return { embed, components: rows };
  }
  
  /**
   * Create button rows from button config
   * @param {Array} buttons - Array of button configurations
   * @returns {Array} - Array of ActionRowBuilder objects
   * @private
   */
  static _createButtonRows(buttons) {
    const rows = [];
    
    // Split buttons into rows of 5 (Discord limit)
    for (let i = 0; i < buttons.length; i += 5) {
      const row = new ActionRowBuilder();
      
      // Add up to 5 buttons to this row
      const rowButtons = buttons.slice(i, i + 5);
      for (const button of rowButtons) {
        // Map style string to ButtonStyle enum
        const style = this._getButtonStyle(button.style);
        
        // Create button
        const buttonBuilder = new ButtonBuilder()
          .setCustomId(button.customId)
          .setLabel(button.label)
          .setStyle(style);
        
        // Add emoji if provided
        if (button.emoji) {
          buttonBuilder.setEmoji(button.emoji);
        }
        
        row.addComponents(buttonBuilder);
      }
      
      rows.push(row);
    }
    
    return rows;
  }
  
  /**
   * Map style string to ButtonStyle enum
   * @param {string} styleString - Style string (PRIMARY, SECONDARY, etc.)
   * @returns {ButtonStyle} - ButtonStyle enum value
   * @private
   */
  static _getButtonStyle(styleString) {
    switch (styleString) {
      case 'PRIMARY':
        return ButtonStyle.Primary;
      case 'SECONDARY':
        return ButtonStyle.Secondary;
      case 'SUCCESS':
        return ButtonStyle.Success;
      case 'DANGER':
        return ButtonStyle.Danger;
      default:
        return ButtonStyle.Secondary;
    }
  }
}

module.exports = EmbedBuilderUtil;
