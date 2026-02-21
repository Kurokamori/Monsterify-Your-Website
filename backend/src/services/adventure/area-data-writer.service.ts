import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import {
  landmassDefinitions,
  regionDefinitions,
  areaConfigurations,
  type LandmassDefinition,
  type RegionDefinition,
  type AreaConfiguration,
  type Coordinates,
} from '../../utils/contents/area-configurations';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.resolve(__dirname, '../../utils/contents/area-configurations.ts');

/**
 * Service for writing area configuration data.
 * Mutates in-memory maps and debounce-persists changes back to the TS source file.
 */
export class AreaDataWriterService {
  private static instance: AreaDataWriterService;
  private writeTimer: ReturnType<typeof setTimeout> | null = null;

  static getInstance(): AreaDataWriterService {
    if (!AreaDataWriterService.instance) {
      AreaDataWriterService.instance = new AreaDataWriterService();
    }
    return AreaDataWriterService.instance;
  }

  // ── Landmass CRUD ──────────────────────────────────────────────────

  getLandmass(id: string): LandmassDefinition | null {
    return landmassDefinitions[id] ?? null;
  }

  updateLandmass(id: string, patch: Partial<LandmassDefinition>): LandmassDefinition | null {
    const existing = landmassDefinitions[id];
    if (!existing) {
      return null;
    }
    Object.assign(existing, patch);
    this.schedulePersist();
    return existing;
  }

  createLandmass(data: LandmassDefinition): LandmassDefinition {
    landmassDefinitions[data.id] = data;
    this.schedulePersist();
    return data;
  }

  deleteLandmass(id: string): boolean {
    if (!landmassDefinitions[id]) {
      return false;
    }
    delete landmassDefinitions[id];
    this.schedulePersist();
    return true;
  }

  // ── Region CRUD ────────────────────────────────────────────────────

  getRegion(id: string): RegionDefinition | null {
    return regionDefinitions[id] ?? null;
  }

  updateRegion(id: string, patch: Partial<RegionDefinition>): RegionDefinition | null {
    const existing = regionDefinitions[id];
    if (!existing) {
      return null;
    }
    Object.assign(existing, patch);
    this.schedulePersist();
    return existing;
  }

  createRegion(data: RegionDefinition): RegionDefinition {
    regionDefinitions[data.id] = data;
    // Add to parent landmass's regions array
    const landmass = landmassDefinitions[data.landmassId];
    if (landmass && !landmass.regions.includes(data.id)) {
      landmass.regions.push(data.id);
    }
    this.schedulePersist();
    return data;
  }

  deleteRegion(id: string): boolean {
    const region = regionDefinitions[id];
    if (!region) {
      return false;
    }
    // Remove from parent landmass
    const landmass = landmassDefinitions[region.landmassId];
    if (landmass) {
      landmass.regions = landmass.regions.filter(r => r !== id);
    }
    delete regionDefinitions[id];
    this.schedulePersist();
    return true;
  }

  // ── Area CRUD ──────────────────────────────────────────────────────

  getArea(id: string): AreaConfiguration | null {
    return areaConfigurations[id] ?? null;
  }

  updateArea(id: string, patch: Partial<AreaConfiguration>): AreaConfiguration | null {
    const existing = areaConfigurations[id];
    if (!existing) {
      return null;
    }
    Object.assign(existing, patch);
    this.schedulePersist();
    return existing;
  }

  createArea(id: string, data: AreaConfiguration): AreaConfiguration {
    areaConfigurations[id] = data;
    // Add to parent region's areas array
    const region = regionDefinitions[data.region];
    if (region && !region.areas.includes(id)) {
      region.areas.push(id);
    }
    this.schedulePersist();
    return data;
  }

  deleteArea(id: string): boolean {
    const area = areaConfigurations[id];
    if (!area) {
      return false;
    }
    // Remove from parent region
    const region = regionDefinitions[area.region];
    if (region) {
      region.areas = region.areas.filter(a => a !== id);
    }
    delete areaConfigurations[id];
    this.schedulePersist();
    return true;
  }

  // ── Coordinates shortcut ───────────────────────────────────────────

  updateCoordinates(entityType: 'landmass' | 'region' | 'area', id: string, coords: Coordinates): boolean {
    switch (entityType) {
      case 'landmass': {
        const lm = landmassDefinitions[id];
        if (!lm) {
          return false;
        }
        lm.mapCoordinates = coords;
        break;
      }
      case 'region': {
        const rg = regionDefinitions[id];
        if (!rg) {
          return false;
        }
        rg.mapCoordinates = coords;
        break;
      }
      case 'area': {
        const ar = areaConfigurations[id];
        if (!ar) {
          return false;
        }
        ar.mapCoordinates = coords;
        break;
      }
      default:
        return false;
    }
    this.schedulePersist();
    return true;
  }

  // ── Persistence ────────────────────────────────────────────────────

  private schedulePersist(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }
    this.writeTimer = setTimeout(() => {
      this.persistToFile().catch(err => {
        console.error('Failed to persist area configurations:', err);
      });
    }, 2000);
  }

  private async persistToFile(): Promise<void> {
    try {
      let content = await fs.readFile(DATA_FILE_PATH, 'utf-8');

      content = this.replaceSection(content, 'LANDMASS_DATA', 'landmassDefinitions', 'LandmassDefinitionsMap', landmassDefinitions);
      content = this.replaceSection(content, 'REGION_DATA', 'regionDefinitions', 'RegionDefinitionsMap', regionDefinitions);
      content = this.replaceSection(content, 'AREA_DATA', 'areaConfigurations', 'AreaConfigurationsMap', areaConfigurations);

      await fs.writeFile(DATA_FILE_PATH, content, 'utf-8');
      console.log('Area configurations persisted to file.');
    } catch (err) {
      console.error('Error persisting area configurations:', err);
      throw err;
    }
  }

  private replaceSection(
    fileContent: string,
    marker: string,
    varName: string,
    typeName: string,
    data: Record<string, unknown>,
  ): string {
    const startMarker = `// === ${marker}_START ===`;
    const endMarker = `// === ${marker}_END ===`;

    const startIdx = fileContent.indexOf(startMarker);
    const endIdx = fileContent.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1) {
      console.warn(`Markers not found for ${marker}, skipping section.`);
      return fileContent;
    }

    const serialized = this.serializeDataMap(varName, typeName, data);
    const before = fileContent.substring(0, startIdx);
    const after = fileContent.substring(endIdx + endMarker.length);

    return before + startMarker + '\n' + serialized + '\n' + endMarker + after;
  }

  private serializeDataMap(varName: string, typeName: string, data: Record<string, unknown>): string {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return `export const ${varName}: ${typeName} = {};\n`;
    }

    const lines: string[] = [];
    lines.push(`export const ${varName}: ${typeName} = {`);

    for (const [key, value] of entries) {
      const json = JSON.stringify(value, null, 2);
      // Indent each line by 2 spaces (it's already 2-space indented from JSON.stringify)
      const indented = json
        .split('\n')
        .map((line, i) => (i === 0 ? `  '${key}': ${line}` : `  ${line}`))
        .join('\n');
      lines.push(`${indented},\n`);
    }

    lines.push('};\n');
    return lines.join('\n');
  }
}
