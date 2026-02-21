/** Minimal species data used in the evolution explorer tree */
export interface EvolutionSpecies {
  name: string;
  image: string | null;
}

/** A node in the evolution tree (one direction) */
export interface EvolutionNode {
  species: EvolutionSpecies;
  children: EvolutionNode[];
  depth: number;
}

/** Raw evolution option returned from the API */
export interface EvolutionOption {
  name: string;
  type?: string;
  [key: string]: unknown;
}

/** Root-level bidirectional evolution data for a selected species */
export interface BidirectionalEvolution {
  species: EvolutionSpecies;
  forwardEvolutions: EvolutionNode[];
  reverseEvolutions: EvolutionNode[];
  isDigimon: boolean;
  isExpanded: boolean;
  isRoot: boolean;
}
