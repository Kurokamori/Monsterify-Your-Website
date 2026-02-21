/**
 * Zodiac sign calculation utility for backend
 */

const zodiacSigns = [
  { name: 'Capricorn - Sawsbuck', start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
  { name: 'Aquarius - Vaporeon', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
  { name: 'Pisces - Magikarp', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
  { name: 'Aries - Arcanine', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
  { name: 'Taurus - Bouffalant', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
  { name: 'Gemini - Tandemaus', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
  { name: 'Cancer - Kingler', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
  { name: 'Leo - Braviary', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
  { name: 'Virgo - Gardevoir', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
  { name: 'Libra - Claydol', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
  { name: 'Scorpio - Drapion', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
  { name: 'Sagittarius - Gogoat', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } }
];

/**
 * Calculate zodiac sign from a birthday
 * @param {string} birthday - Birthday in YYYY-MM-DD format
 * @returns {string} - Zodiac sign name
 */
const calculateZodiac = (birthday: string) => {
  if (!birthday) {return '';}

  try {
    // Parse the date components manually to avoid timezone issues
    const parts = birthday.split('-').map(num => parseInt(num, 10));
    const month = parts[1];
    const day = parts[2];

    if (month === undefined || day === undefined || isNaN(month) || isNaN(day)) {
      return '';
    }

    for (const sign of zodiacSigns) {
      // Handle signs that span across year boundary (like Capricorn)
      if (sign.start.month > sign.end.month) {
        if ((month === sign.start.month && day >= sign.start.day) ||
            (month === sign.end.month && day <= sign.end.day)) {
          return sign.name;
        }
      } else {
        // Normal signs within the same year
        if ((month === sign.start.month && day >= sign.start.day) ||
            (month === sign.end.month && day <= sign.end.day) ||
            (month > sign.start.month && month < sign.end.month)) {
          return sign.name;
        }
      }
    }

    return '';
  } catch (error) {
    console.error('Error calculating zodiac:', error);
    return '';
  }
};

/**
 * Calculate Chinese zodiac based on birth year
 * @param {string} birthday - Birthday in YYYY-MM-DD format
 * @returns {string} - Chinese zodiac animal
 */
const calculateChineseZodiac = (birthday: string) => {
  if (!birthday) {return '';}

  try {
    // Parse the year directly to avoid timezone issues
    const parts = birthday.split('-').map(num => parseInt(num, 10));
    const year = parts[0];

    if (year === undefined || isNaN(year)) {
      return '';
    }

    // Chinese zodiac cycle starts from Rat in 1900
    // The 12 animals in order
    const animals = [
      'Rat - Vikaralamon',
      'Ox - Vajramon',
      'Tiger - Mihiramon',
      'Rabbit - Antylamon',
      'Dragon - Majiramon',
      'Snake - Sandiramon',
      'Horse - Indramon',
      'Goat - Pajiramon',
      'Monkey - Makuramon',
      'Rooster - Sinduramon',
      'Dog - Caturamon',
      'Pig - Suzakumon'
    ];

    // Calculate position in 12-year cycle
    // 1900 was the year of the Rat (index 0)
    const cyclePosition = ((year - 1900) % 12 + 12) % 12; // Handle negative years

    return animals[cyclePosition] ?? '';
  } catch (error) {
    console.error('Error calculating Chinese zodiac:', error);
    return '';
  }
};

export { calculateZodiac, calculateChineseZodiac };