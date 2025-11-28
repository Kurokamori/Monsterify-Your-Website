const { createBaseEmbed, createInfoEmbed, createErrorEmbed, colors } = require('../config/embeds');
const { commonButtons, createActionRow, createButton } = require('../config/buttons');
const { ButtonStyle } = require('discord.js');
const townService = require('../services/townService');

const townCommands = {
  // Show town menu
  menu: async (interaction) => {
    const embed = createInfoEmbed(
      '🏘️ Town Menu',
      'Welcome to the town! Choose a location to visit:\n\n' +
      '🏠 **Home** - Your cozy home base\n' +
      '🏥 **Adoption Center** - Adopt new monsters\n' +
      '🌱 **Garden** - Tend to your garden\n' +
      '🚜 **Farm** - Breed monsters and farm work\n' +
      '🎮 **Game Corner** - Play games and activities\n' +
      '🏺 **Antique Shop** - Discover rare antiques\n' +
      '🏴‍☠️ **Pirate\'s Dock** - Maritime adventures\n' +
      '🔬 **Laboratory** - Conduct experiments'
    );

    // Create location buttons
    const row1 = createActionRow(
      createButton('town_home', 'Home', ButtonStyle.Secondary, '🏠'),
      createButton('town_adoption', 'Adoption', ButtonStyle.Primary, '🏥'),
      createButton('town_garden', 'Garden', ButtonStyle.Success, '🌱'),
      createButton('town_farm', 'Farm', ButtonStyle.Secondary, '🚜')
    );

    const row2 = createActionRow(
      createButton('town_game', 'Game Corner', ButtonStyle.Primary, '🎮'),
      createButton('town_antique', 'Antique Shop', ButtonStyle.Secondary, '🏺'),
      createButton('town_pirates', 'Pirate\'s Dock', ButtonStyle.Danger, '🏴‍☠️'),
      createButton('town_lab', 'Laboratory', ButtonStyle.Primary, '🔬')
    );

    await interaction.reply({ 
      embeds: [embed], 
      components: [row1, row2],
      ephemeral: true 
    });
  },

  // Visit a specific location
  visit: async (interaction) => {
    try {
      const location = interaction.options.getString('location');
      const locationInfo = townService.formatLocationInfo(location);

      const embed = createBaseEmbed(
        locationInfo.name,
        locationInfo.description,
        colors.town
      );

      // Add activities field
      if (locationInfo.activities.length > 0) {
        embed.addFields([
          {
            name: '🎯 Available Activities',
            value: locationInfo.activities.map(activity => `• ${activity}`).join('\n'),
            inline: false,
          },
        ]);
      }

      // Create activity buttons based on location
      const buttons = [];
      
      switch (location) {
        case 'adoption':
          buttons.push(
            createButton('adoption_view', 'View Adopts', ButtonStyle.Primary, '👁️'),
            createButton('adoption_claim', 'Claim Adopt', ButtonStyle.Success, '🤝')
          );
          break;
        case 'garden':
          buttons.push(
            createButton('garden_tend', 'Tend Garden', ButtonStyle.Success, '🌱'),
            createButton('garden_harvest', 'Harvest', ButtonStyle.Primary, '🌾'),
            createButton('garden_points', 'View Points', ButtonStyle.Secondary, '📊')
          );
          break;
        case 'farm':
          buttons.push(
            createButton('farm_breed', 'Breed Monsters', ButtonStyle.Primary, '💕'),
            createButton('farm_status', 'Breeding Status', ButtonStyle.Secondary, '📊')
          );
          break;
        case 'game':
          buttons.push(
            createButton('game_pomodoro', 'Pomodoro', ButtonStyle.Primary, '⏰'),
            createButton('game_activities', 'Activities', ButtonStyle.Secondary, '🎯')
          );
          break;
        case 'antique':
          buttons.push(
            createButton('antique_browse', 'Browse', ButtonStyle.Primary, '👁️'),
            createButton('antique_appraise', 'Appraise', ButtonStyle.Secondary, '💎')
          );
          break;
        case 'pirates':
          buttons.push(
            createButton('pirates_swab', 'Swab Deck', ButtonStyle.Primary, '🧽'),
            createButton('pirates_fish', 'Go Fishing', ButtonStyle.Success, '🎣'),
            createButton('pirates_treasure', 'Treasure Hunt', ButtonStyle.Danger, '💰')
          );
          break;
        case 'lab':
          buttons.push(
            createButton('lab_research', 'Research', ButtonStyle.Primary, '🔬'),
            createButton('lab_experiment', 'Experiment', ButtonStyle.Secondary, '⚗️')
          );
          break;
        default:
          buttons.push(
            createButton('location_explore', 'Explore', ButtonStyle.Primary, '🔍')
          );
      }

      // Add common navigation buttons
      buttons.push(commonButtons.back());

      // Split buttons into rows (max 5 per row)
      const rows = [];
      for (let i = 0; i < buttons.length; i += 4) {
        rows.push(createActionRow(...buttons.slice(i, i + 4)));
      }

      await interaction.reply({ 
        embeds: [embed], 
        components: rows,
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in town visit command:', error);
      const embed = createErrorEmbed('Failed to visit location. Please try again later.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // Adoption Center activities
  adoption: {
    view: async (interaction) => {
      try {
        const monthsResponse = await townService.getAdoptionMonths();
        if (!monthsResponse.success) {
          throw new Error(monthsResponse.message || 'Failed to get adoption months');
        }

        const months = monthsResponse.data || [];
        
        if (months.length === 0) {
          const embed = createInfoEmbed(
            '🏥 Adoption Center',
            'No adoption months available yet. Check back later!'
          );
          return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Show latest month's adopts
        const latestMonth = months[0];
        const adoptsResponse = await townService.getMonthlyAdopts(latestMonth.year, latestMonth.month);
        
        if (!adoptsResponse.success) {
          throw new Error(adoptsResponse.message || 'Failed to get monthly adopts');
        }

        const adopts = adoptsResponse.data || [];
        const adoptsList = adopts.slice(0, 10).map((adopt, index) => 
          `${index + 1}. **${adopt.name}** (${adopt.species || 'Unknown Species'})`
        ).join('\n');

        const embed = createBaseEmbed(
          `🏥 Monthly Adopts - ${latestMonth.month}/${latestMonth.year}`,
          adoptsList || 'No adopts available this month.',
          colors.town
        );

        embed.addFields([
          {
            name: '📊 Adoption Stats',
            value: `Available: ${adopts.length}${adopts.length > 10 ? '\nShowing first 10' : ''}`,
            inline: true,
          },
        ]);

        const row = createActionRow(
          createButton('adoption_claim', 'Claim Adopt', ButtonStyle.Success, '🤝'),
          commonButtons.back(),
          commonButtons.refresh()
        );

        await interaction.reply({ 
          embeds: [embed], 
          components: [row],
          ephemeral: true 
        });

      } catch (error) {
        console.error('Error viewing adoption center:', error);
        const embed = createErrorEmbed(
          error.isApiError ? error.message : 'Failed to load adoption center. Please try again later.'
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },

  // Garden activities
  garden: {
    points: async (interaction) => {
      try {
        // This would need trainer ID - for now show placeholder
        const embed = createInfoEmbed(
          '🌱 Garden Points',
          'Garden points system coming soon!\n\nThis will track your gardening progress and rewards.'
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } catch (error) {
        console.error('Error viewing garden points:', error);
        const embed = createErrorEmbed('Failed to load garden points. Please try again later.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },

  // Farm activities
  farm: {
    status: async (interaction) => {
      try {
        // This would need trainer ID - for now show placeholder
        const embed = createInfoEmbed(
          '🚜 Farm Status',
          'Breeding system coming soon!\n\nThis will show your active breeding pairs and progress.'
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } catch (error) {
        console.error('Error viewing farm status:', error);
        const embed = createErrorEmbed('Failed to load farm status. Please try again later.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },
};

module.exports = townCommands;
