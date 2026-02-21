import type { ComponentProps } from 'react';
import { EvolutionCards } from '@components/monsters/EvolutionCards';
import { EvolutionEditor } from '@components/monsters/EvolutionEditor';
import type { EvolutionEntry } from '../useMonsterDetail';

interface EvolutionTabProps {
  monsterId: number | null;
  evolutionChain: EvolutionEntry[];
  isOwner: boolean;
  showEvolutionEditor: boolean;
  setShowEvolutionEditor: (v: boolean) => void;
  evolutionSaving: boolean;
  handleSaveEvolution: (data: EvolutionEntry[]) => Promise<void>;
}

export const EvolutionTab = ({
  monsterId,
  evolutionChain,
  isOwner,
  showEvolutionEditor,
  setShowEvolutionEditor,
  evolutionSaving,
  handleSaveEvolution,
}: EvolutionTabProps) => {
  return (
    <div className="town-square">
      <div className="trainer-detail__stats-section">
        <div className="collapsible-header">
          <h2>Evolution Information</h2>
          {isOwner && (
            <button
              className={`button secondary no-flex sm ${showEvolutionEditor ? 'active' : ''}`}
              onClick={() => setShowEvolutionEditor(!showEvolutionEditor)}
              disabled={evolutionSaving}
            >
              <i className={`fas ${showEvolutionEditor ? 'fa-times' : 'fa-edit'}`}></i>
              {showEvolutionEditor ? 'Cancel Edit' : 'Edit Evolution'}
            </button>
          )}
        </div>

        {showEvolutionEditor && isOwner ? (
          <EvolutionEditor
            monsterId={monsterId ?? undefined}
            evolutionData={evolutionChain}
            onSave={handleSaveEvolution}
            onCancel={() => setShowEvolutionEditor(false)}
            isOwner={isOwner}
          />
        ) : (
          <EvolutionCards
            evolutionData={evolutionChain as ComponentProps<typeof EvolutionCards>['evolutionData']}
            currentMonsterId={monsterId ?? undefined}
          />
        )}
      </div>
    </div>
  );
};
