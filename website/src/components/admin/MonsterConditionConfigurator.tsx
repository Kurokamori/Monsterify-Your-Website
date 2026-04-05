import { useCallback } from 'react';
import { MONSTER_TYPES } from '../../utils/staticValues';

export interface MonsterCondition {
  id: string;
  conditionType: string;
  applicationMode: 'auto' | 'opt-in';
  criteria: Record<string, unknown>;
  effect: Record<string, unknown>;
  label: string;
}

interface MonsterConditionConfiguratorProps {
  conditions: MonsterCondition[];
  onChange: (conditions: MonsterCondition[]) => void;
}

const CONDITION_TYPES = [
  { value: 'type_bonus', label: 'Type Bonus (auto-apply)', defaultMode: 'auto' as const },
  { value: 'can_talk_progression', label: 'Can Talk Progression (opt-in)', defaultMode: 'opt-in' as const },
];

function generateId(): string {
  return `cond_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function MonsterConditionConfigurator({ conditions, onChange }: MonsterConditionConfiguratorProps) {
  const addCondition = useCallback(() => {
    onChange([
      ...conditions,
      {
        id: generateId(),
        conditionType: 'type_bonus',
        applicationMode: 'auto',
        criteria: { monsterTypes: [] },
        effect: { bonusLevels: 0, bonusCoins: 0 },
        label: '',
      },
    ]);
  }, [conditions, onChange]);

  const removeCondition = useCallback((id: string) => {
    onChange(conditions.filter(c => c.id !== id));
  }, [conditions, onChange]);

  const updateCondition = useCallback((id: string, updates: Partial<MonsterCondition>) => {
    onChange(conditions.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [conditions, onChange]);

  const handleTypeChange = useCallback((id: string, newType: string) => {
    const typeConfig = CONDITION_TYPES.find(t => t.value === newType);
    const defaults: Partial<MonsterCondition> = { conditionType: newType };

    if (typeConfig) {
      defaults.applicationMode = typeConfig.defaultMode;
    }

    if (newType === 'type_bonus') {
      defaults.criteria = { monsterTypes: [] };
      defaults.effect = { bonusLevels: 0, bonusCoins: 0 };
    } else if (newType === 'can_talk_progression') {
      defaults.criteria = { requiredCanTalkLevel: 0 };
      defaults.effect = { newCanTalkLevel: 1 };
    }

    updateCondition(id, defaults);
  }, [updateCondition]);

  const toggleMonsterType = useCallback((conditionId: string, type: string) => {
    const condition = conditions.find(c => c.id === conditionId);
    if (!condition) return;
    const currentTypes = (condition.criteria.monsterTypes as string[]) || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    updateCondition(conditionId, {
      criteria: { ...condition.criteria, monsterTypes: newTypes },
    });
  }, [conditions, updateCondition]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0 }}>Monster Conditions</h4>
        <button type="button" className="button primary sm" onClick={addCondition}>
          <i className="fas fa-plus"></i> Add Condition
        </button>
      </div>

      {conditions.length === 0 && (
        <p className="form-help-text">No monster conditions configured. Conditions can automatically apply bonuses or enable opt-in progression when a prompt is submitted.</p>
      )}

      {conditions.map((condition) => (
        <div key={condition.id} className="form-section" style={{ border: '1px solid var(--border-color)', padding: '1rem', marginBottom: '1rem', borderRadius: 'var(--border-radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <strong>Condition</strong>
            <button type="button" className="button danger sm" onClick={() => removeCondition(condition.id)}>
              <i className="fas fa-trash"></i> Remove
            </button>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label>Condition Type</label>
              <select
                className="form-input"
                value={condition.conditionType}
                onChange={(e) => handleTypeChange(condition.id, e.target.value)}
              >
                {CONDITION_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Application Mode</label>
              <select
                className="form-input"
                value={condition.applicationMode}
                onChange={(e) => updateCondition(condition.id, { applicationMode: e.target.value as 'auto' | 'opt-in' })}
              >
                <option value="auto">Auto-Apply</option>
                <option value="opt-in">Opt-In (User Selects)</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label>Label (shown to users)</label>
            <input
              type="text"
              className="form-input"
              value={condition.label}
              onChange={(e) => updateCondition(condition.id, { label: e.target.value })}
              placeholder="e.g., Fire types earn +2 bonus levels"
            />
          </div>

          {/* Type Bonus criteria/effect */}
          {condition.conditionType === 'type_bonus' && (
            <>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label>Target Monster Types</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {MONSTER_TYPES.map(type => {
                    const selected = ((condition.criteria.monsterTypes as string[]) || []).includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        className={`button sm ${selected ? 'primary' : 'secondary'}`}
                        onClick={() => toggleMonsterType(condition.id, type)}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
                <small className="form-help-text">Checks all 5 type slots on each monster.</small>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Bonus Levels</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={(condition.effect.bonusLevels as number) || 0}
                    onChange={(e) => updateCondition(condition.id, {
                      effect: { ...condition.effect, bonusLevels: parseInt(e.target.value) || 0 },
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Bonus Coins</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={(condition.effect.bonusCoins as number) || 0}
                    onChange={(e) => updateCondition(condition.id, {
                      effect: { ...condition.effect, bonusCoins: parseInt(e.target.value) || 0 },
                    })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Can Talk Progression criteria/effect */}
          {condition.conditionType === 'can_talk_progression' && (
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Required Current Level</label>
                <select
                  className="form-input"
                  value={(condition.criteria.requiredCanTalkLevel as number) ?? 0}
                  onChange={(e) => {
                    const required = parseInt(e.target.value);
                    updateCondition(condition.id, {
                      criteria: { ...condition.criteria, requiredCanTalkLevel: required },
                      effect: { newCanTalkLevel: required + 1 },
                    });
                  }}
                >
                  <option value={0}>0 - Unable to Speak</option>
                  <option value={1}>1 - Knows Some Letters</option>
                  <option value={2}>2 - Forming Simple Words</option>
                </select>
                <small className="form-help-text">Monsters must have this level to qualify.</small>
              </div>
              <div className="form-group">
                <label>New Level After Completion</label>
                <input
                  type="text"
                  className="form-input"
                  value={`Level ${((condition.criteria.requiredCanTalkLevel as number) ?? 0) + 1}`}
                  disabled
                />
                <small className="form-help-text">Automatically set to required + 1.</small>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
