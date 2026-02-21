/**
 * Zodiac sign calculation utilities
 * Western zodiac with Pokemon pairings, Chinese zodiac with Digimon pairings
 */

interface ZodiacDateRange {
  month: number;
  day: number;
}

interface ZodiacSign {
  name: string;
  start: ZodiacDateRange;
  end: ZodiacDateRange;
}

const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  { name: 'Capricorn - Sawsbuck', start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
  { name: 'Aquarius - Vaporeon', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
  { name: 'Pisces - Magikarp', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
  { name: 'Aries - Arcanine', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
  { name: 'Taurus - Bouffalant', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
  { name: 'Gemini - Tandemaus', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
  { name: 'Cancer - Kingler', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
  { name: 'Leo - Hisuian Braviary', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
  { name: 'Virgo - Gardevoir', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
  { name: 'Libra - Claydol', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
  { name: 'Scorpio - Drapion', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
  { name: 'Sagittarius - Gogoat', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
] as const;

const CHINESE_ZODIAC_ANIMALS = [
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
  'Pig - Suzakumon',
] as const;

const ZODIAC_EMOJI_MAP: Record<string, string> = {
  'Aries - Arcanine': '\u2648',
  'Taurus - Bouffalant': '\u2649',
  'Gemini - Tandemaus': '\u264A',
  'Cancer - Kingler': '\u264B',
  'Leo - Hisuian Braviary': '\u264C',
  'Virgo - Gardevoir': '\u264D',
  'Libra - Claydol': '\u264E',
  'Scorpio - Drapion': '\u264F',
  'Sagittarius - Gogoat': '\u2650',
  'Capricorn - Sawsbuck': '\u2651',
  'Aquarius - Vaporeon': '\u2652',
  'Pisces - Magikarp': '\u2653',
};

const CHINESE_ZODIAC_EMOJI_MAP: Record<string, string> = {
  'Rat - Vikaralamon': '\uD83D\uDC2D',
  'Ox - Vajramon': '\uD83D\uDC02',
  'Tiger - Mihiramon': '\uD83D\uDC05',
  'Rabbit - Antylamon': '\uD83D\uDC30',
  'Dragon - Majiramon': '\uD83D\uDC09',
  'Snake - Sandiramon': '\uD83D\uDC0D',
  'Horse - Indramon': '\uD83D\uDC0E',
  'Goat - Pajiramon': '\uD83D\uDC10',
  'Monkey - Makuramon': '\uD83D\uDC35',
  'Rooster - Sinduramon': '\uD83D\uDC13',
  'Dog - Caturamon': '\uD83D\uDC15',
  'Pig - Suzakumon': '\uD83D\uDC37',
};

/** Parse a YYYY-MM-DD birthday string into components, avoiding timezone issues */
function parseBirthday(birthday: string): { year: number; month: number; day: number } | null {
  const parts = birthday.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
}

/** Calculate Western zodiac sign from a YYYY-MM-DD birthday */
export function calculateZodiac(birthday: string): string {
  if (!birthday) return '';

  const parsed = parseBirthday(birthday);
  if (!parsed) return '';
  const { month, day } = parsed;

  for (const sign of ZODIAC_SIGNS) {
    // Handle signs spanning year boundary (Capricorn: Dec 22 - Jan 19)
    if (sign.start.month > sign.end.month) {
      if (
        (month === sign.start.month && day >= sign.start.day) ||
        (month === sign.end.month && day <= sign.end.day)
      ) {
        return sign.name;
      }
    } else {
      if (
        (month === sign.start.month && day >= sign.start.day) ||
        (month === sign.end.month && day <= sign.end.day) ||
        (month > sign.start.month && month < sign.end.month)
      ) {
        return sign.name;
      }
    }
  }

  return '';
}

/** Calculate Chinese zodiac animal from a YYYY-MM-DD birthday */
export function calculateChineseZodiac(birthday: string): string {
  if (!birthday) return '';

  const parsed = parseBirthday(birthday);
  if (!parsed) return '';

  // 1900 was the year of the Rat (index 0)
  const cyclePosition = ((parsed.year - 1900) % 12 + 12) % 12;
  return CHINESE_ZODIAC_ANIMALS[cyclePosition];
}

/** Format a YYYY-MM-DD birthday for display (e.g. "January 1, 2000") */
export function formatBirthday(birthday: string): string {
  if (!birthday) return '';

  const parsed = parseBirthday(birthday);
  if (!parsed) return birthday;

  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Get the zodiac emoji for a Western zodiac sign name */
export function getZodiacEmoji(zodiac: string): string {
  return ZODIAC_EMOJI_MAP[zodiac] ?? '';
}

/** Get the emoji for a Chinese zodiac animal name */
export function getChineseZodiacEmoji(chineseZodiac: string): string {
  return CHINESE_ZODIAC_EMOJI_MAP[chineseZodiac] ?? '';
}

export type ChineseZodiacAnimal = (typeof CHINESE_ZODIAC_ANIMALS)[number];
