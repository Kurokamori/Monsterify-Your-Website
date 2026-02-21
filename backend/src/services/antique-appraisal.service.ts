// ============================================================================
// Types
// ============================================================================

export type AntiqueCategory =
  | 'American Holidays'
  | 'Jewish Holidays'
  | 'Russian Holidays'
  | 'Indian Holidays'
  | 'Chinese Holidays';

export type AntiqueHoliday =
  | "New Year's"
  | "Valentine's Day"
  | "St. Patrick's Day"
  | 'April Fool\'s Day'
  | 'Easter'
  | 'Independence Day'
  | 'Halloween'
  | 'Thanksgiving'
  | 'Christmas'
  | 'Rosh Hashanah'
  | 'Yom Kippur'
  | 'Sukkot'
  | 'Hanukkah'
  | 'Purim'
  | 'Passover'
  | 'Old New Year'
  | 'Defender of the Fatherland Day'
  | 'Victory Day'
  | 'Maslenitsa'
  | 'Diwali'
  | 'Holi'
  | 'Raksha Bandhan'
  | 'Ganesh Chaturthi'
  | 'Lunar New Year';

export type OverrideParameters = {
  force_fusion?: boolean;
  attribute?: string[];
  species?: string[];
  species1?: string[];
  species2?: string[];
  species3?: string[];
  species_all?: string[];
  type?: string[];
  type1?: string[];
  type2?: string[];
  type3?: string[];
  type4?: string[];
  type5?: string[];
  max_types?: number;
  [key: string]: unknown;
};

export type Antique = {
  name: string;
  roll_count: number;
  force_fusion?: boolean;
  force_no_fusion?: boolean;
  allow_fusion?: boolean;
  force_min_types?: number;
  override_parameters: OverrideParameters;
  category: AntiqueCategory;
  holiday: AntiqueHoliday;
};

export type RollerParams = {
  roll_count: number;
  fusion_forced?: boolean;
  species_max?: number;
  types_min?: number;
  types_max?: number;
  includeSpecies?: string[];
  includeSpecies1?: string[];
  includeSpecies2?: string[];
  includeSpecies3?: string[];
  includeTypes?: string[];
  override_attribute?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string | string[];
  [key: string]: unknown;
};

export type BackendRollParams = {
  fusion_forced: boolean;
  min_types: number;
  max_types: number;
  allowed_types: string[];
  allowed_attributes: string[];
  allowed_species: string[];
};

// ============================================================================
// Service
// ============================================================================

/**
 * Service for converting antique settings to monster roller parameters.
 * Antique data is stored in the antique_settings DB table.
 */
export class AntiqueAppraisalService {
  /**
   * Get a random element from an array
   */
  private getRandomFromArray<T>(array: T[] | undefined | null): T | null {
    if (!array || array.length === 0) {return null;}
    return array[Math.floor(Math.random() * array.length)] ?? null;
  }

  /**
   * Convert antique parameters to monster roller parameters
   */
  convertToRollerParams(antique: Antique): RollerParams {
    const params: RollerParams = {
      roll_count: antique.roll_count || 1,
    };

    // Handle fusion settings
    if (antique.force_fusion) {
      params.fusion_forced = true;
    } else if (antique.force_no_fusion) {
      params.fusion_forced = false;
      params.species_max = 1;
    } else if (antique.allow_fusion === false) {
      params.species_max = 1;
    }

    // Handle min types
    if (antique.force_min_types) {
      params.types_min = antique.force_min_types;
    }

    // Merge override parameters
    if (antique.override_parameters) {
      Object.entries(antique.override_parameters).forEach(([key, value]) => {
        if (key === 'species' || key === 'species_all') {
          if (key === 'species_all') {
            const valueArray = value as string[];
            params.species1 = this.getRandomFromArray(valueArray) ?? undefined;
            params.species2 = this.getRandomFromArray(valueArray) ?? undefined;
            params.species3 = this.getRandomFromArray(valueArray) ?? undefined;
          } else {
            params.includeSpecies = value as string[];
          }
        } else if (key === 'type' || key === 'types') {
          params.includeTypes = value as string[];
        } else if (key.startsWith('species') && Array.isArray(value)) {
          const slotNumber = key.slice(7);
          if (slotNumber) {
            params[`includeSpecies${slotNumber}`] = value;
          } else {
            params.includeSpecies = value as string[];
          }
        } else if (key.startsWith('type') && Array.isArray(value)) {
          params[key] = this.getRandomFromArray(value as string[]);
        } else if (key === 'attribute' && Array.isArray(value)) {
          params.override_attribute = this.getRandomFromArray(value as string[]) ?? undefined;
        } else {
          params[key] = value;
        }
      });
    }

    return params;
  }
}
