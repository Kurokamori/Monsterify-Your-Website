import api from './api';

export interface SpeciesMetadata {
  franchise: string | null;
  stage: string | null;
  isLegendary: boolean;
  isMythical: boolean;
}

export async function fetchSpeciesMetadata(
  speciesNames: string[]
): Promise<Record<string, SpeciesMetadata>> {
  if (speciesNames.length === 0) return {};

  const response = await api.post('/species/metadata', { speciesNames });
  return response.data?.data ?? {};
}
