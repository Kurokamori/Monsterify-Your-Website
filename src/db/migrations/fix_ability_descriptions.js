const pool = require('../../db');

async function fixAbilityDescriptions() {
  try {
    console.log('Starting to fix ability descriptions...');

    // Get all abilities from the database
    const getAbilitiesQuery = `
      SELECT name, effect
      FROM abilities
    `;
    const abilitiesResult = await pool.query(getAbilitiesQuery);

    console.log(`Found ${abilitiesResult.rows.length} abilities to process`);

    // Process each ability
    for (const ability of abilitiesResult.rows) {
      if (!ability.effect) continue;

      // Sanitize the effect text
      let sanitizedEffect = ability.effect;

      // Replace special apostrophes with regular quotes
      sanitizedEffect = sanitizedEffect.replace(/'/g, "'").replace(/'/g, "'");

      // Replace "Pokémon" with "Pokemon"
      sanitizedEffect = sanitizedEffect.replace(/Pokémon/g, "Pokemon");

      // Update the ability in the database
      const updateQuery = `
        UPDATE abilities
        SET effect = $1
        WHERE name = $2
      `;
      await pool.query(updateQuery, [sanitizedEffect, ability.name]);

      console.log(`Updated ability: ${ability.name}`);
    }

    console.log('Successfully fixed all ability descriptions');
  } catch (error) {
    console.error('Error fixing ability descriptions:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
fixAbilityDescriptions();
