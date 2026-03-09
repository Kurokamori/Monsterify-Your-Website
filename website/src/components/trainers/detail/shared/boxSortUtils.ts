import type { TrainerMonster } from '@services/trainerService';
import type { SpeciesMetadata } from '@services/speciesMetadataService';

export interface SortConfig {
  specialSeparations: {
    level100Separate: boolean;
    legendaryMythicalSeparate: boolean;
    splitByImage: boolean;
  };
  mainSegregation: 'none' | 'stage' | 'franchise' | 'type' | 'attribute';
  segregationOptions: {
    franchiseMode: 'species1Only' | 'allSpecies';
    typeMode: 'type1Only' | 'allTypes';
  };
  sortWithin: Array<{
    field: 'level' | 'type' | 'name' | 'species' | 'attribute';
    direction: 'asc' | 'desc';
    enabled: boolean;
  }>;
}

export interface MonsterBoxPosition {
  id: number;
  boxNumber: number;
  trainerIndex: number;
}

/**
 * Compute sorted box positions for all unlocked-box monsters.
 * Preserves monsters in locked boxes at their current positions.
 */
export function computeSortedPositions(
  monsters: TrainerMonster[],
  speciesMetadata: Record<string, SpeciesMetadata>,
  lockedBoxNumbers: Set<number>,
  config: SortConfig,
): MonsterBoxPosition[] {
  const result: MonsterBoxPosition[] = [];
  const occupiedByLocked = new Set<string>();

  // 1. Preserve monsters in locked boxes
  for (const m of monsters) {
    if (
      m.box_number != null &&
      lockedBoxNumbers.has(m.box_number) &&
      m.trainer_index != null
    ) {
      result.push({
        id: m.id,
        boxNumber: m.box_number,
        trainerIndex: m.trainer_index as number,
      });
      occupiedByLocked.add(`${m.box_number}-${m.trainer_index}`);
    }
  }

  // Unlocked monsters pool
  const unlocked = monsters.filter(
    m => m.box_number == null || !lockedBoxNumbers.has(m.box_number),
  );

  // 2. Extract special groups
  let remaining = [...unlocked];
  const specialGroups: { label: string; monsters: TrainerMonster[] }[] = [];

  if (config.specialSeparations.level100Separate) {
    const level100 = remaining.filter(m => (m.level ?? 0) >= 100);
    remaining = remaining.filter(m => (m.level ?? 0) < 100);
    if (level100.length > 0) {
      specialGroups.push({ label: 'Level 100+', monsters: level100 });
    }
  }

  if (config.specialSeparations.legendaryMythicalSeparate) {
    const legendaryMythical = remaining.filter(m => {
      const s1 = m.species1 ? speciesMetadata[m.species1 as string] : null;
      const s2 = m.species2 ? speciesMetadata[m.species2 as string] : null;
      const s3 = m.species3 ? speciesMetadata[m.species3 as string] : null;
      return [s1, s2, s3].some(s => s?.isLegendary || s?.isMythical);
    });
    const legendaryIds = new Set(legendaryMythical.map(m => m.id));
    remaining = remaining.filter(m => !legendaryIds.has(m.id));
    if (legendaryMythical.length > 0) {
      specialGroups.push({ label: 'Legendary/Mythical', monsters: legendaryMythical });
    }
  }

  // 3. Group remaining by main segregation
  const groups = groupMonsters(remaining, config, speciesMetadata);

  // 4. Combine all groups: special first, then main groups
  const allGroups = [...specialGroups, ...groups];

  // 5. If splitByImage, split each group into has-image / no-image
  const finalGroups: { label: string; monsters: TrainerMonster[] }[] = [];
  for (const group of allGroups) {
    if (config.specialSeparations.splitByImage) {
      const withImage = group.monsters.filter(m => m.img_link && m.img_link !== 'null');
      const noImage = group.monsters.filter(m => !m.img_link || m.img_link === 'null');
      if (withImage.length > 0) {
        finalGroups.push({ label: `${group.label} (With Image)`, monsters: withImage });
      }
      if (noImage.length > 0) {
        finalGroups.push({ label: `${group.label} (No Image)`, monsters: noImage });
      }
    } else {
      finalGroups.push(group);
    }
  }

  // 6. Sort within each group
  const comparator = buildComparator(config.sortWithin);
  for (const group of finalGroups) {
    group.monsters.sort(comparator);
  }

  // 7. Assign to boxes, starting from box 0, skipping locked boxes
  let currentBox = 0;
  let currentSlot = 0;

  const advanceToUnlocked = () => {
    while (lockedBoxNumbers.has(currentBox)) {
      currentBox++;
    }
  };

  advanceToUnlocked();

  for (const group of finalGroups) {
    // Each segregation group starts on a fresh box
    if (currentSlot > 0) {
      currentBox++;
      currentSlot = 0;
      advanceToUnlocked();
    }

    for (const monster of group.monsters) {
      if (currentSlot >= 30) {
        currentBox++;
        currentSlot = 0;
        advanceToUnlocked();
      }

      result.push({
        id: monster.id,
        boxNumber: currentBox,
        trainerIndex: currentSlot,
      });
      currentSlot++;
    }
  }

  return result;
}

function groupMonsters(
  monsters: TrainerMonster[],
  config: SortConfig,
  speciesMetadata: Record<string, SpeciesMetadata>,
): { label: string; monsters: TrainerMonster[] }[] {
  const groups = new Map<string, TrainerMonster[]>();

  const getKey = (m: TrainerMonster): string => {
    switch (config.mainSegregation) {
      case 'none':
        return 'All';

      case 'stage': {
        // Use monster's attribute field for stage, or species metadata
        if (m.attribute) return m.attribute as string;
        const s1 = m.species1 ? speciesMetadata[m.species1 as string] : null;
        if (s1?.stage) return s1.stage;
        return 'Unknown';
      }

      case 'franchise': {
        if (config.segregationOptions.franchiseMode === 'species1Only') {
          const s1 = m.species1 ? speciesMetadata[m.species1 as string] : null;
          return s1?.franchise || 'Unknown';
        }
        // allSpecies: combine all species' franchises
        const franchises = new Set<string>();
        for (const sp of [m.species1, m.species2, m.species3]) {
          if (sp) {
            const meta = speciesMetadata[sp as string];
            if (meta?.franchise) franchises.add(meta.franchise);
          }
        }
        if (franchises.size === 0) return 'Unknown';
        return [...franchises].sort().join('+');
      }

      case 'type': {
        if (config.segregationOptions.typeMode === 'type1Only') {
          return (m.type1 as string) || 'Unknown';
        }
        const types = [m.type1, m.type2, m.type3, m.type4, m.type5]
          .filter(Boolean) as string[];
        if (types.length === 0) return 'Unknown';
        return [...new Set(types)].sort().join('+');
      }

      case 'attribute':
        return (m.attribute as string) || 'Unknown';

      default:
        return 'All';
    }
  };

  for (const monster of monsters) {
    const key = getKey(monster);
    const arr = groups.get(key);
    if (arr) {
      arr.push(monster);
    } else {
      groups.set(key, [monster]);
    }
  }

  // Sort group keys alphabetically
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return a.localeCompare(b);
  });

  return sortedKeys.map(key => ({
    label: key,
    monsters: groups.get(key)!,
  }));
}

function buildComparator(
  sortFields: Array<{ field: string; direction: string; enabled: boolean }>,
): (a: TrainerMonster, b: TrainerMonster) => number {
  const enabledFields = sortFields.filter(f => f.enabled);

  return (a: TrainerMonster, b: TrainerMonster) => {
    for (const { field, direction } of enabledFields) {
      const mult = direction === 'desc' ? -1 : 1;
      let cmp = 0;

      switch (field) {
        case 'level':
          cmp = ((a.level as number) ?? 0) - ((b.level as number) ?? 0);
          break;
        case 'type':
          cmp = ((a.type1 as string) || '').localeCompare((b.type1 as string) || '');
          break;
        case 'name':
          cmp = (a.name || '').localeCompare(b.name || '');
          break;
        case 'species':
          cmp = ((a.species1 as string) || '').localeCompare((b.species1 as string) || '');
          break;
        case 'attribute':
          cmp = ((a.attribute as string) || '').localeCompare((b.attribute as string) || '');
          break;
      }

      if (cmp !== 0) return cmp * mult;
    }
    return 0;
  };
}

export const DEFAULT_SORT_CONFIG: SortConfig = {
  specialSeparations: {
    level100Separate: false,
    legendaryMythicalSeparate: false,
    splitByImage: false,
  },
  mainSegregation: 'none',
  segregationOptions: {
    franchiseMode: 'species1Only',
    typeMode: 'type1Only',
  },
  sortWithin: [
    { field: 'level', direction: 'desc', enabled: true },
    { field: 'type', direction: 'asc', enabled: false },
    { field: 'name', direction: 'asc', enabled: false },
    { field: 'species', direction: 'asc', enabled: false },
    { field: 'attribute', direction: 'asc', enabled: false },
  ],
};
