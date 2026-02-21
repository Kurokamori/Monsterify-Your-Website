import type { Trainer, AdditionalReference } from '@components/trainers/types/Trainer';

interface AdditionalRefsTabProps {
  trainer: Trainer;
  handleImageClick: (src: string, alt: string) => void;
}

export const AdditionalRefsTab = ({ trainer, handleImageClick }: AdditionalRefsTabProps) => {
  let refs: AdditionalReference[] = [];
  try {
    refs = typeof trainer.additional_refs === 'string'
      ? JSON.parse(trainer.additional_refs)
      : trainer.additional_refs || [];
    if (!Array.isArray(refs)) refs = [];
  } catch {
    refs = [];
  }

  return (
    <div className="trainer-detail__stats-section">
      <h2>Additional References</h2>
      {refs.length === 0 ? (
        <div className="no-additional-refs">
          <i className="fas fa-images"></i>
          <p>No additional references available.</p>
        </div>
      ) : (
        <div className="additional-refs-container">
          <div className="refs-grid">
            {refs.map((ref, index) => (
              <div className="adopt-card" key={ref.id || index}>
                {ref.url && (
                  <div className="additional-ref-image">
                    <img
                      src={ref.url}
                      alt={ref.title || `Reference ${index + 1}`}
                      onClick={() => handleImageClick(ref.url, ref.title || `Reference ${index + 1}`)}
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/default_trainer.png';
                      }}
                    />
                  </div>
                )}
                <div className="additional-ref-info">
                  {ref.title && <h3>{ref.title}</h3>}
                  {ref.description && <p>{ref.description}</p>}
                  {ref.artist && <p className="text-muted text-sm">Art by: {ref.artist}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
