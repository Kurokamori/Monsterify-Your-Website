import { useState } from 'react';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import adminService from '../../services/adminService';
import { BulkAddResult } from '../../services/adminService';

interface BulkMonsterAddResults extends BulkAddResult {
  trainer_name?: string;
  processed_count?: number;
  error_count?: number;
}

export function BulkMonsterAdd() {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | number | null>(null);
  const [monstersText, setMonstersText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkMonsterAddResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTrainerId) {
      setError('Please select a trainer');
      return;
    }

    if (!monstersText.trim()) {
      setError('Please enter monster data');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const result = await adminService.bulkAddMonsters({
        trainer_id: Number(selectedTrainerId),
        monsters_text: monstersText
      });

      setResults(result);

      if (result.error_count === 0) {
        setMonstersText('');
        setSelectedTrainerId(null);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to add monsters');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMonstersText('');
    setResults(null);
    setError(null);
  };

  const exampleText = `Herby | 1 | Bulbasaur | Grass, Poison
Sparky | 5 | Pikachu | Electric
Blaze | 10 | Charmander | Fire | Data`;

  return (
    <div className="bulk-monster-add">
      <div className="map-header">
        <h2>Bulk Add Monsters to Trainer</h2>
        <p>Add multiple monsters to a selected trainer using a simple text format.</p>
      </div>

      <form onSubmit={handleSubmit} className="bulk-monster-add-form">
        <div className="form-group">
          <TrainerAutocomplete
            label="Select Trainer"
            placeholder="Search for a trainer..."
            selectedTrainerId={selectedTrainerId}
            onSelect={setSelectedTrainerId}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="monsters-text">
            Monsters Data:
            <span className="format-hint">
              Format: Name | Level | Species1,Species2,Species3 | Type1,Type2,Type3,Type4,Type5 | Attribute (optional)
            </span>
          </label>
          <textarea id="monsters-text" value={monstersText}
            onChange={(e) => setMonstersText(e.target.value)}
            placeholder={`Enter monsters data, one per line. Example:\n${exampleText}`}
            rows={10} className="form-input" />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading || !selectedTrainerId || !monstersText.trim()} className="button success">
            {loading ? 'Adding Monsters...' : 'Add Monsters'}
          </button>
          <button type="button" onClick={handleClear} className="button danger">Clear</button>
        </div>
      </form>

      {error && (<div className="alert error"><h3>Error</h3><p>{error}</p></div>)}

      {results && (
        <div className="results-section">
          <h3>Results</h3>
          <div className="results-summary">
            <p><strong>Trainer:</strong> {results.trainer_name}</p>
            <p><strong>Successfully Added:</strong> {results.processed_count} monsters</p>
            {(results.error_count ?? 0) > 0 && (
              <p className="errors"><strong>Errors:</strong> {results.error_count}</p>
            )}
          </div>

          {results.results && results.results.length > 0 && (
            <div className="success-results">
              <h4>Successfully Added Monsters:</h4>
              <div className="monster-list">
                {results.results.map((monster, index) => (
                  <div key={index} className="monster-item success">
                    <span className="monster-name">{monster.name}</span>
                    <span className="monster-level">Lv. {monster.level}</span>
                    <span className="monster-types">{monster.species.join(', ')}</span>
                    <span className="monster-types">{monster.types.join(', ')}</span>
                    <span className="monster-types">{monster.attribute}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.errors && results.errors.length > 0 && (
            <div className="error-results">
              <h4>Errors:</h4>
              <div className="error-list">
                {results.errors.map((err, index) => (
                  <div key={index} className="error-item">{err}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="format-guide">
        <h3>Format Guide</h3>
        <div className="guide-content">
          <p><strong>Required format:</strong> Name | Level | Species | Types | Attribute (optional)</p>
          <ul>
            <li><strong>Name:</strong> Any name for the monster</li>
            <li><strong>Level:</strong> Number between 1-100</li>
            <li><strong>Species:</strong> Comma-separated species names (up to 3)</li>
            <li><strong>Types:</strong> Comma-separated type names (up to 5)</li>
            <li><strong>Attribute:</strong> Optional - Data, Variable, Virus, Vaccine, or Free. If not provided, a random attribute will be assigned</li>
          </ul>
          <div className="example-section">
            <h4>Examples:</h4>
            <pre>{exampleText}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

