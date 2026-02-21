/**
 * Monster Gender Constants
 * Defines gender values and their generation weights
 */

// Gender definitions
export const Gender = {
  MALE: 'Male',
  FEMALE: 'Female',
  NON_BINARY: 'Non-binary',
  GENDERLESS: 'Genderless',
} as const;

export type GenderKey = keyof typeof Gender;
export type GenderValue = (typeof Gender)[GenderKey];

// Array of all gender values for iteration
export const GENDERS: GenderValue[] = Object.values(Gender);

/**
 * Gender generation weights (in percentage)
 * - Male: 45%
 * - Female: 45%
 * - Non-binary: 5%
 * - Genderless: 5%
 */
export const GENDER_WEIGHTS: Record<GenderValue, number> = {
  [Gender.MALE]: 45,
  [Gender.FEMALE]: 45,
  [Gender.NON_BINARY]: 5,
  [Gender.GENDERLESS]: 5,
};

/**
 * Generate a random gender based on weights
 * @returns A random gender value
 */
export function generateRandomGender(): GenderValue {
  const totalWeight = Object.values(GENDER_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  const randomValue = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (const [gender, weight] of Object.entries(GENDER_WEIGHTS)) {
    cumulativeWeight += weight;
    if (randomValue <= cumulativeWeight) {
      return gender as GenderValue;
    }
  }

  // Default fallback (should never reach here)
  return Gender.MALE;
}

/**
 * Check if a gender value is valid
 * @param gender - The gender to check
 * @returns True if the gender is valid
 */
export function isValidGender(gender: string): gender is GenderValue {
  return GENDERS.includes(gender as GenderValue);
}

/**
 * Get the probability of generating a specific gender
 * @param gender - The gender to check
 * @returns The probability as a decimal (0-1)
 */
export function getGenderProbability(gender: GenderValue): number {
  const totalWeight = Object.values(GENDER_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  return GENDER_WEIGHTS[gender] / totalWeight;
}
